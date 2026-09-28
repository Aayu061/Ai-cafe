import { catalogService } from "../catalog.service";
import { getAiProvider } from "../ai/ai-provider";
import { intentEngine } from "./intent-engine";
import {
  BaristaMessage,
  BaristaRecommendation,
  BaristaRecommendResponse,
  SafeCatalogContext,
  BaristaPreferences,
  BaristaIntent,
  BaristaComparisonItem,
  BaristaPairingItem,
} from "../ai/ai-provider.types";
import { ProductDoc, DrinkConfiguration } from "../../types/catalog";

export class BaristaService {
  /**
   * Generates a grounded, server-validated drink recommendation with intent intelligence.
   */
  async getRecommendation(
    message: string,
    conversationHistory: BaristaMessage[] = [],
    incomingPreferences?: BaristaPreferences,
    recentProductIds: string[] = []
  ): Promise<BaristaRecommendResponse> {
    // 1. Fetch live catalog
    const [allProducts, allIngredients] = await Promise.all([
      catalogService.getProducts(),
      catalogService.getIngredients(),
    ]);

    const availableProducts = allProducts.filter((p) => p.available);
    if (availableProducts.length === 0) {
      return {
        success: false,
        intent: "recommend",
        message: "Our café menu is currently updating. Please check back in a few moments!",
        preferences: {},
        recommendations: [],
      };
    }

    // 2. Classify intent deterministically
    const intentResult = intentEngine.classifyIntent(
      message,
      conversationHistory,
      availableProducts
    );
    const intent: BaristaIntent = intentResult.intent;

    // 3. Build safe catalog context for AI model
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

    // 4. Extract sensory preferences and evolve multi-turn state
    const ai = getAiProvider();
    const extraction = await ai.extractPreferences(
      message,
      conversationHistory,
      safeContext,
      incomingPreferences
    );

    const evolvedPrefs = intentEngine.evolvePreferences(
      extraction.preferences || {},
      incomingPreferences,
      message
    );

    if (intentResult.extractedBudget) evolvedPrefs.budget = intentResult.extractedBudget;
    if (intentResult.extractedCategory) evolvedPrefs.category = intentResult.extractedCategory;
    if (intentResult.extractedIngredient) evolvedPrefs.flavor = intentResult.extractedIngredient;

    let candidateProducts: ProductDoc[] = [];
    let customGreeting: string | undefined;
    let comparisonData: BaristaComparisonItem | undefined;
    let productDetails: ProductDoc | undefined;
    let pairingsData: BaristaPairingItem[] | undefined;

    // 5. Deterministic Catalog Query Layer (Catalog is Source of Truth)
    switch (intent) {
      case "cheapest": {
        const cheapest = await catalogService.findCheapest(intentResult.extractedCategory);
        if (cheapest) {
          candidateProducts = [cheapest];
          customGreeting = `The lowest-priced ${intentResult.extractedCategory || "specialty beverage"} on our current menu is our ${cheapest.name} at ₹${cheapest.basePrice}.`;
        }
        break;
      }

      case "most_expensive": {
        const priciest = await catalogService.findMostExpensive(intentResult.extractedCategory);
        if (priciest) {
          candidateProducts = [priciest];
          customGreeting = `Our most luxurious, top-tier handcrafted creation is the ${priciest.name} at ₹${priciest.basePrice}.`;
        }
        break;
      }

      case "budget": {
        const budgetTarget = intentResult.extractedBudget || evolvedPrefs.budget || 200;
        const matching = await catalogService.findWithinBudget(budgetTarget, intentResult.extractedCategory);
        candidateProducts = matching.slice(0, 3);
        if (candidateProducts.length > 0) {
          const names = candidateProducts.map((p) => `${p.name} (₹${p.basePrice})`).join(", ");
          customGreeting = `You've got great choices under ₹${budgetTarget}: ${names}.`;
        } else {
          const cheapest = await catalogService.findCheapest();
          customGreeting = `We don't currently have items under ₹${budgetTarget}. Our most affordable specialty drink is ${cheapest?.name} at ₹${cheapest?.basePrice}.`;
          if (cheapest) candidateProducts = [cheapest];
        }
        break;
      }

      case "category": {
        const cat = intentResult.extractedCategory || evolvedPrefs.category || "coffee";
        const matching = await catalogService.findByCategory(cat);
        candidateProducts = matching.slice(0, 3);
        customGreeting = `Here are our handcrafted ${cat} creations ready to order:`;
        break;
      }

      case "ingredient": {
        const ing = intentResult.extractedIngredient || evolvedPrefs.flavor || "caramel";
        const matching = await catalogService.findByIngredient(ing);
        candidateProducts = matching.slice(0, 3);
        customGreeting = `Here are our café drinks crafted with ${ing}:`;
        break;
      }

      case "compare": {
        if (intentResult.comparisonTargets) {
          const comp = await catalogService.compareProducts(
            intentResult.comparisonTargets[0],
            intentResult.comparisonTargets[1]
          );
          if (comp) {
            candidateProducts = [comp.productA, comp.productB];
            comparisonData = comp;
            customGreeting = `Comparing ${comp.productA.name} (₹${comp.productA.basePrice}) and ${comp.productB.name} (₹${comp.productB.basePrice}): ${comp.highlights.join(" ")}`;
          }
        }
        break;
      }

      case "details": {
        const targetId = intentResult.detailsTargetId || extraction.suggestedProductId || availableProducts[0].id;
        const item = await catalogService.getProductByIdOrSlug(targetId);
        if (item) {
          candidateProducts = [item];
          productDetails = item;
          customGreeting = `${item.name} (₹${item.basePrice}) is our signature ${item.categoryLabel} highlight. ${item.description}`;
        }
        break;
      }

      case "availability": {
        const available = await catalogService.findAvailable();
        candidateProducts = available.slice(0, 4);
        customGreeting = `We currently have ${available.length} specialty drinks freshly available on our café menu:`;
        break;
      }

      case "pairing": {
        const targetId = intentResult.pairingTargetId || extraction.suggestedProductId || "caramel-cold-brew";
        const item = (await catalogService.getProductByIdOrSlug(targetId)) || availableProducts[0];
        if (item) {
          candidateProducts = [item];
          pairingsData = await catalogService.findPairings(item.id);
          customGreeting = `For your ${item.name}, our chef recommends these artisan café pairings:`;
        }
        break;
      }

      case "random": {
        // Filter out recently recommended products to avoid repetition
        const freshChoices = availableProducts.filter((p) => !recentProductIds.includes(p.id));
        const pool = freshChoices.length > 0 ? freshChoices : availableProducts;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        candidateProducts = [picked];
        customGreeting = `Surprise! Today's barista spotlight is our ${picked.name} (₹${picked.basePrice}).`;
        break;
      }

      case "customize":
      case "recommend":
      default: {
        const ranked = this.rankProducts(
          availableProducts,
          evolvedPrefs,
          extraction.suggestedProductId,
          recentProductIds,
          message
        );
        candidateProducts = ranked.slice(0, 3).map((r) => r.product);
        break;
      }
    }

    // Fallback if query returned no candidates
    if (candidateProducts.length === 0) {
      candidateProducts = availableProducts.slice(0, 3);
    }

    // 6. Build and Authoritatively Validate Candidate Drink Configurations
    const recommendations: BaristaRecommendation[] = [];

    for (const product of candidateProducts) {
      const config = this.buildCandidateConfiguration(product, evolvedPrefs, safeContext, intent);
      const validation = await catalogService.validateDrinkConfiguration(config);

      if (!validation.valid) {
        const fallbackValidation = await catalogService.validateDrinkConfiguration(
          product.defaultConfiguration
        );
        if (fallbackValidation.valid) {
          const explanation = await ai.generateExplanation(
            product,
            evolvedPrefs,
            product.defaultConfiguration,
            fallbackValidation.drinkDna,
            intent
          );

          recommendations.push({
            product: {
              id: product.id,
              slug: product.slug,
              name: product.name,
              categoryLabel: product.categoryLabel,
              description: product.description,
              image: product.image,
              available: product.available,
              basePrice: product.basePrice,
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
          });
        }
        continue;
      }

      const explanation = await ai.generateExplanation(
        product,
        evolvedPrefs,
        config,
        validation.drinkDna,
        intent
      );

      recommendations.push({
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          categoryLabel: product.categoryLabel,
          description: product.description,
          image: product.image,
          available: product.available,
          basePrice: product.basePrice,
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
      });
    }

    // 7. Context-Aware Barista Greeting & Follow-Up
    const primary = recommendations[0];
    const finalGreeting =
      customGreeting ||
      (primary
        ? `I've crafted a personalized recommendation for you: our ${primary.product.name}!`
        : "Here are our recommended café creations tailored for your taste:");

    const followUp = this.generateFollowUp(evolvedPrefs, primary?.configuration, intent);

    return {
      success: true,
      intent,
      message: finalGreeting,
      preferences: evolvedPrefs,
      recommendations,
      comparison: comparisonData,
      productDetails,
      pairings: pairingsData,
      followUpSuggestion: followUp,
    };
  }

  /**
   * Deterministically ranks products based on sensory preference distance,
   * avoiding recently recommended products unless explicitly requested.
   */
  private rankProducts(
    products: ProductDoc[],
    prefs: BaristaPreferences,
    suggestedId?: string,
    recentProductIds: string[] = [],
    messageText: string = ""
  ): Array<{ product: ProductDoc; score: number }> {
    const rawLower = messageText.toLowerCase();

    return products
      .map((product) => {
        let score = 50;

        // User explicitly asked for this product by name
        if (rawLower.includes(product.name.toLowerCase())) {
          score += 60;
        }

        // Avoid repetitive recommendations unless explicitly requested
        if (recentProductIds.includes(product.id) && !rawLower.includes(product.name.toLowerCase())) {
          score -= 35;
        }

        // Suggested product boost from extraction
        if (suggestedId && product.id === suggestedId) {
          score += 40;
        }

        // Temperature match
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

        // Category match
        if (prefs.category || prefs.categoryPreference) {
          const targetCat = (prefs.category || prefs.categoryPreference || "").toLowerCase();
          if (
            product.category.toLowerCase().includes(targetCat) ||
            product.categoryLabel.toLowerCase().includes(targetCat)
          ) {
            score += 25;
          }
        }

        // Flavor matches
        const allFlavorPrefs = prefs.flavorPreferences || [];
        if (prefs.flavor && !allFlavorPrefs.includes(prefs.flavor)) {
          allFlavorPrefs.push(prefs.flavor);
        }
        if (allFlavorPrefs.length > 0) {
          for (const flavor of allFlavorPrefs) {
            const hasFlavorInNotes = product.tasteNotes.some((n) =>
              n.toLowerCase().includes(flavor.toLowerCase())
            );
            const hasFlavorInName = product.name.toLowerCase().includes(flavor.toLowerCase());
            if (hasFlavorInNotes || hasFlavorInName) {
              score += 20;
            }
          }
        }

        // Flavor avoidances
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

        // Budget constraint
        if (typeof prefs.budget === "number") {
          if (product.basePrice <= prefs.budget) {
            score += 20;
          } else {
            score -= 30;
          }
        }

        // Sweetness distance
        if (typeof prefs.sweetness === "number") {
          const sweetDiff = Math.abs(prefs.sweetness - product.sweetnessProfile);
          score += Math.max(0, 20 - sweetDiff * 0.4);
        }

        // Strength / Caffeine distance
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
    context: SafeCatalogContext,
    intent?: BaristaIntent
  ): DrinkConfiguration {
    const baseConfig = { ...product.defaultConfiguration };

    // When cheapest intent is requested, keep configuration at base minimum without paid add-ons
    if (intent === "cheapest") {
      baseConfig.milkId = "whole-milk";
      baseConfig.flavorId = "flavor-none";
      baseConfig.toppingIds = [];
      baseConfig.sizeId = "medium";
      return baseConfig;
    }

    // 1. Milk selection
    const milkPref = prefs.milk || prefs.milkPreference;
    if (milkPref && context.availableMilks.includes(milkPref)) {
      baseConfig.milkId = milkPref;
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
      baseConfig.iceId = "no-ice";
    } else if (prefs.chill && prefs.chill <= 30) {
      baseConfig.iceId = "light-ice";
    } else if (prefs.chill && prefs.chill >= 85) {
      baseConfig.iceId = "extra-ice";
    }

    // 4. Flavor selection
    const flavorPrefs = prefs.flavorPreferences || [];
    if (prefs.flavor && !flavorPrefs.includes(prefs.flavor)) {
      flavorPrefs.push(prefs.flavor);
    }
    if (flavorPrefs.length > 0) {
      const match = context.availableFlavors.find((f) =>
        flavorPrefs.some((p) => f.toLowerCase().includes(p.toLowerCase()))
      );
      if (match) {
        baseConfig.flavorId = match;
      }
    }

    return baseConfig;
  }

  /**
   * Generates a context-aware café follow-up inquiry based on intent and recipe.
   */
  private generateFollowUp(
    prefs: BaristaPreferences,
    config?: DrinkConfiguration,
    intent?: BaristaIntent
  ): string {
    if (intent === "cheapest" || intent === "budget") {
      return "Would you like to customize any toppings or upgrade to a Grande size (+₹40)?";
    }
    if (intent === "compare") {
      return "Which one of these sounds more refreshing for your mood right now?";
    }
    if (intent === "pairing") {
      return "Would you like to customize your drink before adding the pairing?";
    }
    if (config?.milkId === "oat-milk") {
      return "Would you like to customize the sweetness or try it with almond milk?";
    }
    if (prefs.sweetness && prefs.sweetness <= 30) {
      return "Want to try an extra espresso shot or adjust the ice level?";
    }
    return "Would you like to make it less sweet, add a topping, or customize it in the Drink Studio?";
  }
}

export const baristaService = new BaristaService();
