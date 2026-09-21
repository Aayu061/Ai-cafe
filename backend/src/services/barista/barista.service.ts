import { catalogService } from "../catalog.service";
import { getAiProvider } from "../ai/ai-provider";
import {
  BaristaMessage,
  BaristaRecommendation,
  BaristaRecommendResponse,
  SafeCatalogContext,
  BaristaPreferences,
} from "../ai/ai-provider.types";
import { ProductDoc, DrinkConfiguration } from "../../types/catalog";

export class BaristaService {
  /**
   * Generates a grounded, server-validated drink recommendation.
   */
  async getRecommendation(
    message: string,
    conversationHistory: BaristaMessage[] = []
  ): Promise<BaristaRecommendResponse> {
    // 1. Fetch live catalog (exclusively from Firestore Admin when configured, or initial catalog)
    const [allProducts, allIngredients] = await Promise.all([
      catalogService.getProducts(),
      catalogService.getIngredients(),
    ]);

    const availableProducts = allProducts.filter((p) => p.available);
    if (availableProducts.length === 0) {
      return {
        success: false,
        message: "Our café menu is currently updating. Please check back in a few moments!",
        preferences: {},
        recommendations: [],
      };
    }

    // 2. Build safe catalog context for AI model
    const safeContext: SafeCatalogContext = {
      products: availableProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        categoryLabel: p.categoryLabel,
        description: p.description,
        tasteNotes: p.tasteNotes,
        temperatureProfile: p.temperatureProfile,
        sweetnessProfile: p.sweetnessProfile,
        strengthProfile: p.strengthProfile,
        textureProfile: p.textureProfile,
        basePrice: p.basePrice,
      })),
      availableBases: allIngredients.filter((i) => i.type === "base" && i.available).map((i) => i.id),
      availableMilks: allIngredients.filter((i) => i.type === "milk" && i.available).map((i) => i.id),
      availableFlavors: allIngredients.filter((i) => i.type === "flavor" && i.available).map((i) => i.id),
      availableSweetness: allIngredients.filter((i) => i.type === "sweetness" && i.available).map((i) => i.id),
      availableIce: allIngredients.filter((i) => i.type === "ice" && i.available).map((i) => i.id),
      availableToppings: allIngredients.filter((i) => i.type === "topping" && i.available).map((i) => i.id),
      availableSizes: allIngredients.filter((i) => i.type === "size" && i.available).map((i) => i.id),
    };

    // 3. Stage 1: Call AI Provider for Structured Intent & Preference Extraction
    const ai = getAiProvider();
    const extraction = await ai.extractPreferences(message, conversationHistory, safeContext);
    const prefs = extraction.preferences || {};

    // 4. Stage 2: Deterministic Catalog Grounding & Ranking
    const rankedProducts = this.rankProducts(availableProducts, prefs, extraction.suggestedProductId);

    if (rankedProducts.length === 0) {
      return {
        success: true,
        message: "I couldn't find an exact match for that specific combination, but here are our signature café favorites!",
        preferences: prefs,
        recommendations: [],
        followUpSuggestion: "Would you like something cold and creamy, or a warm classic espresso?",
      };
    }

    // Select primary candidate + up to 2 alternatives
    const candidateProducts = rankedProducts.slice(0, 3);
    const recommendations: BaristaRecommendation[] = [];

    for (const item of candidateProducts) {
      const product = item.product;

      // 5. Synthesize Candidate Configuration using strictly verified IDs
      const config = this.buildCandidateConfiguration(product, prefs, safeContext);

      // 6. Authoritative Server Validation & Pricing Calculation
      const validation = await catalogService.validateDrinkConfiguration(config);

      if (!validation.valid) {
        // Fallback to default product configuration if customized options clashed
        const fallbackValidation = await catalogService.validateDrinkConfiguration(product.defaultConfiguration);
        if (fallbackValidation.valid) {
          const explanation = await ai.generateExplanation(
            product,
            prefs,
            product.defaultConfiguration,
            fallbackValidation.drinkDna
          );

          recommendations.push({
            product: {
              id: product.id,
              slug: product.slug,
              name: product.name,
              categoryLabel: product.categoryLabel,
              description: product.description,
              image: product.image,
            },
            configuration: product.defaultConfiguration,
            reason: explanation,
            drinkDna: fallbackValidation.drinkDna,
            pricing: {
              currency: "INR",
              basePrice: fallbackValidation.basePrice,
              customizationTotal: fallbackValidation.customizationTotal,
              finalPrice: fallbackValidation.finalPrice,
            },
            matchScore: item.score,
          });
        }
        continue;
      }

      // Valid configuration: generate grounded explanation
      const explanation = await ai.generateExplanation(
        product,
        prefs,
        config,
        validation.drinkDna
      );

      recommendations.push({
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryLabel: product.categoryLabel,
          description: product.description,
          image: product.image,
        },
        configuration: config,
        reason: explanation,
        drinkDna: validation.drinkDna,
        pricing: {
          currency: "INR",
          basePrice: validation.basePrice,
          customizationTotal: validation.customizationTotal,
          finalPrice: validation.finalPrice,
        },
        matchScore: item.score,
      });
    }

    // Determine conversational intro
    const primary = recommendations[0];
    const baristaGreeting = primary
      ? `I've crafted a personalized recommendation for you: our ${primary.product.name}!`
      : "Here are our recommended café creations tailored for your taste:";

    const followUp = this.generateFollowUp(prefs, primary?.configuration);

    return {
      success: true,
      message: baristaGreeting,
      preferences: prefs,
      recommendations,
      followUpSuggestion: followUp,
    };
  }

  /**
   * Deterministically ranks products based on sensory preference distance.
   */
  private rankProducts(
    products: ProductDoc[],
    prefs: BaristaPreferences,
    suggestedId?: string
  ): Array<{ product: ProductDoc; score: number }> {
    return products
      .map((product) => {
        let score = 50; // baseline score

        // 1. Suggested product boost
        if (suggestedId && product.id === suggestedId) {
          score += 40;
        }

        // 2. Temperature match
        if (prefs.temperature) {
          const productTemp = product.temperatureProfile.toLowerCase();
          if (prefs.temperature === "hot") {
            if (productTemp === "hot") score += 30;
            else score -= 40;
          } else if (prefs.temperature === "blended") {
            if (productTemp === "blended") score += 30;
            else score -= 15;
          } else if (prefs.temperature === "cold") {
            if (productTemp === "iced" || productTemp === "blended") score += 30;
            else score -= 40;
          }
        }

        // 3. Category match
        if (prefs.categoryPreference) {
          if (product.category === prefs.categoryPreference || product.categoryLabel.toLowerCase().includes(prefs.categoryPreference.toLowerCase())) {
            score += 25;
          }
        }

        // 4. Flavor matches
        if (prefs.flavorPreferences && prefs.flavorPreferences.length > 0) {
          for (const flavor of prefs.flavorPreferences) {
            const hasFlavorInNotes = product.tasteNotes.some((n) =>
              n.toLowerCase().includes(flavor.toLowerCase())
            );
            const hasFlavorInName = product.name.toLowerCase().includes(flavor.toLowerCase());
            if (hasFlavorInNotes || hasFlavorInName) {
              score += 20;
            }
          }
        }

        // 5. Flavor avoidances
        if (prefs.flavorAvoidances && prefs.flavorAvoidances.length > 0) {
          for (const avoid of prefs.flavorAvoidances) {
            if (
              product.name.toLowerCase().includes(avoid.toLowerCase()) ||
              product.tasteNotes.some((n) => n.toLowerCase().includes(avoid.toLowerCase()))
            ) {
              score -= 50;
            }
          }
        }

        // 6. Sweetness distance
        if (typeof prefs.sweetness === "number") {
          const sweetDiff = Math.abs(prefs.sweetness - product.sweetnessProfile);
          score += Math.max(0, 20 - sweetDiff * 0.4);
        }

        // 7. Strength / Caffeine distance
        if (typeof prefs.strength === "number") {
          const strengthDiff = Math.abs(prefs.strength - product.strengthProfile);
          score += Math.max(0, 20 - strengthDiff * 0.4);
        }

        return { product, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Builds a valid DrinkConfiguration adhering to real catalog ingredient constraints.
   */
  private buildCandidateConfiguration(
    product: ProductDoc,
    prefs: BaristaPreferences,
    context: SafeCatalogContext
  ): DrinkConfiguration {
    const baseConfig = { ...product.defaultConfiguration };

    // 1. Milk selection
    if (prefs.milkPreference && context.availableMilks.includes(prefs.milkPreference)) {
      baseConfig.milkId = prefs.milkPreference;
    }

    // 2. Sweetness mapping
    if (typeof prefs.sweetness === "number") {
      if (prefs.sweetness <= 10) baseConfig.sweetnessId = "sweetness-0";
      else if (prefs.sweetness <= 35) baseConfig.sweetnessId = "sweetness-25";
      else if (prefs.sweetness <= 60) baseConfig.sweetnessId = "sweetness-50";
      else if (prefs.sweetness <= 85) baseConfig.sweetnessId = "sweetness-75";
      else baseConfig.sweetnessId = "sweetness-100";
    }

    // 3. Ice level enforcement
    if (product.temperatureProfile === "Hot") {
      baseConfig.iceId = "no-ice"; // Enforce hot drink consistency
    } else if (prefs.chill && prefs.chill <= 30) {
      baseConfig.iceId = "light-ice";
    } else if (prefs.chill && prefs.chill >= 85) {
      baseConfig.iceId = "extra-ice";
    }

    // 4. Flavor selection
    if (prefs.flavorPreferences && prefs.flavorPreferences.length > 0) {
      const match = context.availableFlavors.find((f) =>
        prefs.flavorPreferences?.some((p) => f.toLowerCase().includes(p.toLowerCase()))
      );
      if (match) {
        baseConfig.flavorId = match;
      }
    }

    return baseConfig;
  }

  /**
   * Generates a natural café follow-up inquiry.
   */
  private generateFollowUp(
    prefs: BaristaPreferences,
    config?: DrinkConfiguration
  ): string {
    if (config?.milkId === "oat-milk") {
      return "Would you like to customize the sweetness or try it with almond milk?";
    }
    if (prefs.sweetness && prefs.sweetness <= 30) {
      return "Want to try an extra espresso shot or adjust the ice level?";
    }
    return "Would you like to make it less sweet, add a topping, or customize it further?";
  }
}

export const baristaService = new BaristaService();
