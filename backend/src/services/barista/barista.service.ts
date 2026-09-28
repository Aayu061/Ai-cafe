import { catalogService } from "../catalog.service";
import { baristaToolsService } from "./barista-tools.service";
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
  BaristaResponseMode,
  BaristaCatalogProduct,
  CafeMomentCombo,
  BaristaMoodContext,
} from "../ai/ai-provider.types";
import { ProductDoc, DrinkConfiguration } from "../../types/catalog";

export class BaristaService {
  /**
   * Generates a grounded, server-validated response with concierge intelligence,
   * structured response modes, semantic natural-language understanding,
   * multi-turn preferences, and controlled server-side tools.
   */
  async getRecommendation(
    message: string,
    conversationHistory: BaristaMessage[] = [],
    incomingPreferences?: BaristaPreferences,
    recentProductIds: string[] = [],
    authenticatedUserId?: string,
    activeProductId?: string
  ): Promise<BaristaRecommendResponse> {
    // 1. Fetch live catalog via server-authoritative service
    const [allProducts, allIngredients] = await Promise.all([
      catalogService.getProducts(),
      catalogService.getIngredients(),
    ]);

    const availableProducts = allProducts.filter((p) => p.available);
    if (availableProducts.length === 0) {
      return {
        success: false,
        mode: "CONVERSATION",
        intent: "recommend",
        message: "Our café menu is currently updating. Please check back in a few moments!",
        preferences: {},
        recommendations: [],
      };
    }

    // 2. Classify intent, response mode, mood context, and pronoun references
    const intentResult = intentEngine.classifyIntent(
      message,
      conversationHistory,
      availableProducts,
      recentProductIds,
      activeProductId
    );
    const intent: BaristaIntent = intentResult.intent;
    const mode: BaristaResponseMode = intentResult.mode;
    const moodContext: BaristaMoodContext | undefined = intentResult.moodContext;

    // Handle rejection tracking ("not that one", "try something else")
    const rejectedProductIds: string[] = [];
    if (intentResult.referenceResolution?.action === "reject" && intentResult.referenceResolution.resolvedProductId) {
      rejectedProductIds.push(intentResult.referenceResolution.resolvedProductId);
    }

    // 3. Handle GREETING mode immediately
    if (mode === "GREETING") {
      return {
        success: true,
        mode: "GREETING",
        intent: "recommend",
        message:
          "Welcome to AI Café! I'm your café concierge. Tell me what you're craving today, how much caffeine you need, or ask me anything about our specialty menu!",
        preferences: incomingPreferences || {},
        moodContext,
        recommendations: [],
        followUpSuggestion: "Would you like something cold and energizing, or a warm comfort latte?",
      };
    }

    // 4. Handle CONVERSATION mode
    if (mode === "CONVERSATION") {
      return {
        success: true,
        mode: "CONVERSATION",
        intent: "recommend",
        message:
          "I am your dedicated AI Café Barista & Concierge. I know our entire handcrafted menu, ingredients, and pairings. I'm here to recommend, customize, compare, and ensure every drink is tailored precisely to your taste.",
        preferences: incomingPreferences || {},
        moodContext,
        recommendations: [],
        followUpSuggestion: "Shall I suggest our most popular iced creation or check what's fresh on tap?",
      };
    }

    // 5. Build safe catalog context for AI model
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

    // 6. Extract sensory preferences and evolve multi-turn state
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

    // Apply mood context adjustments to preferences if not explicitly set
    if (moodContext) {
      if (moodContext === "REFRESH" && !evolvedPrefs.temperature) evolvedPrefs.temperature = "cold";
      if (moodContext === "ENERGIZE" && typeof evolvedPrefs.strength !== "number") evolvedPrefs.strength = 80;
      if (moodContext === "COMFORT" && !evolvedPrefs.temperature) evolvedPrefs.temperature = "hot";
      if (moodContext === "INDULGE" && typeof evolvedPrefs.sweetness !== "number") evolvedPrefs.sweetness = 75;
    }

    if (intentResult.extractedBudget) evolvedPrefs.budget = intentResult.extractedBudget;
    if (intentResult.extractedCategory) evolvedPrefs.category = intentResult.extractedCategory;
    if (intentResult.extractedIngredient) evolvedPrefs.flavor = intentResult.extractedIngredient;

    // Optional customer taste profile integration
    if (authenticatedUserId) {
      try {
        const tasteProfile = await baristaToolsService.getOwnTasteProfile(authenticatedUserId);
        if (tasteProfile && typeof tasteProfile === "object") {
          const tp = tasteProfile as Record<string, unknown>;
          if (tp.preferredMilk && !evolvedPrefs.milk) evolvedPrefs.milk = String(tp.preferredMilk);
        }
      } catch {
        // Safe fallback; guest experience
      }
    }

    let candidateProducts: ProductDoc[] = [];
    let customGreeting: string | undefined;
    let comparisonData: BaristaComparisonItem | undefined;
    let productDetails: ProductDoc | undefined;
    let pairingsData: BaristaPairingItem[] | undefined;
    let cafeMomentCombo: CafeMomentCombo | undefined;
    let resolvedActiveId: string | undefined = activeProductId;

    // 7. Execute Controlled Backend Tools based on Intent & Mode
    switch (intent) {
      case "cheapest": {
        const cheapest = await baristaToolsService.findCheapest(intentResult.extractedCategory);
        if (cheapest) {
          candidateProducts = [cheapest];
          resolvedActiveId = cheapest.id;
          customGreeting = `The lowest-priced ${intentResult.extractedCategory || "specialty beverage"} on our current menu is our ${cheapest.name} at ₹${cheapest.basePrice}.`;
        }
        break;
      }

      case "most_expensive": {
        const priciest = await baristaToolsService.findMostExpensive(intentResult.extractedCategory);
        if (priciest) {
          candidateProducts = [priciest];
          resolvedActiveId = priciest.id;
          customGreeting = `Our most luxurious, top-tier handcrafted creation is the ${priciest.name} at ₹${priciest.basePrice}.`;
        }
        break;
      }

      case "budget": {
        const budgetTarget = intentResult.extractedBudget || evolvedPrefs.budget || 200;

        if (mode === "BUDGET_COMBO" || intentResult.isBudgetCombo) {
          // Complete Café Moment: Drink + Snack <= budgetTarget
          const combo = await baristaToolsService.buildCafeMomentCombo(
            intentResult.referenceResolution?.resolvedProductId || resolvedActiveId,
            budgetTarget,
            intentResult.extractedCategory
          );
          if (combo) {
            cafeMomentCombo = combo;
            const drinkDoc = await baristaToolsService.getProduct(combo.drink.id);
            if (drinkDoc) candidateProducts = [drinkDoc];
            resolvedActiveId = combo.drink.id;
            customGreeting = `For your ₹${budgetTarget} budget, I've paired our ${combo.drink.name} (₹${combo.drink.price}) with freshly baked ${combo.snack.name} (₹${combo.snack.price}) for a total of ₹${combo.totalPrice}.`;
          }
        } else {
          // Catalog budget query
          const matching = await baristaToolsService.findWithinBudget(budgetTarget, intentResult.extractedCategory);
          candidateProducts = matching.slice(0, 3);
          if (candidateProducts.length > 0) {
            const names = candidateProducts.map((p) => `${p.name} (₹${p.basePrice})`).join(", ");
            resolvedActiveId = candidateProducts[0].id;
            customGreeting = `You've got great choices under ₹${budgetTarget}: ${names}.`;
          } else {
            const cheapest = await baristaToolsService.findCheapest();
            customGreeting = `We don't currently have items under ₹${budgetTarget}. Our most affordable specialty drink is ${cheapest?.name} at ₹${cheapest?.basePrice}.`;
            if (cheapest) {
              candidateProducts = [cheapest];
              resolvedActiveId = cheapest.id;
            }
          }
        }
        break;
      }

      case "category": {
        const cat = intentResult.extractedCategory || evolvedPrefs.category || "coffee";
        const matching = await baristaToolsService.findByCategory(cat);
        candidateProducts = matching.slice(0, 3);
        if (candidateProducts.length > 0) resolvedActiveId = candidateProducts[0].id;
        customGreeting = `Here are our handcrafted ${cat} creations ready to order:`;
        break;
      }

      case "ingredient": {
        const ing = intentResult.extractedIngredient || evolvedPrefs.flavor || "caramel";
        const matching = await baristaToolsService.findByIngredient(ing);
        candidateProducts = matching.slice(0, 3);
        if (candidateProducts.length > 0) resolvedActiveId = candidateProducts[0].id;
        customGreeting = `Here are our café drinks crafted with ${ing}:`;
        break;
      }

      case "compare": {
        if (intentResult.comparisonTargets) {
          const comp = await baristaToolsService.compareProducts(
            intentResult.comparisonTargets[0],
            intentResult.comparisonTargets[1]
          );
          if (comp) {
            candidateProducts = [comp.productA, comp.productB];
            comparisonData = comp;
            resolvedActiveId = comp.productA.id;
            customGreeting = `Comparing ${comp.productA.name} (₹${comp.productA.basePrice}) and ${comp.productB.name} (₹${comp.productB.basePrice}): ${comp.highlights.join(" ")}`;
          }
        }
        break;
      }

      case "details": {
        const targetId =
          intentResult.detailsTargetId ||
          intentResult.referenceResolution?.resolvedProductId ||
          extraction.suggestedProductId ||
          resolvedActiveId ||
          availableProducts[0].id;
        const item = await baristaToolsService.getProduct(targetId);
        if (item) {
          candidateProducts = [item];
          productDetails = item;
          resolvedActiveId = item.id;
          customGreeting = `${item.name} (₹${item.basePrice}) is our signature ${item.categoryLabel} highlight. ${item.description}`;
        }
        break;
      }

      case "availability": {
        const available = await catalogService.findAvailable();
        candidateProducts = available.slice(0, 4);
        if (candidateProducts.length > 0) resolvedActiveId = candidateProducts[0].id;
        customGreeting = `We currently have ${available.length} specialty drinks freshly available on our café menu:`;
        break;
      }

      case "pairing": {
        const targetId =
          intentResult.pairingTargetId ||
          intentResult.referenceResolution?.resolvedProductId ||
          resolvedActiveId ||
          extraction.suggestedProductId ||
          "caramel-cold-brew";
        const item = (await baristaToolsService.getProduct(targetId)) || availableProducts[0];
        if (item) {
          candidateProducts = [item];
          pairingsData = await baristaToolsService.findPairings(item.id);
          resolvedActiveId = item.id;
          customGreeting = `For your ${item.name}, our chef recommends these artisan café pairings:`;
        }
        break;
      }

      case "random": {
        // Contextual surprise (NOT pure Math.random):
        // Filter out recently recommended and rejected products
        const avoidedIds = new Set([...recentProductIds, ...rejectedProductIds]);
        let freshPool = availableProducts.filter((p) => !avoidedIds.has(p.id));
        if (freshPool.length === 0) {
          freshPool = availableProducts.filter((p) => !rejectedProductIds.includes(p.id));
        }
        if (freshPool.length === 0) freshPool = availableProducts;

        // Rank remaining pool by subtle sensory fit without matching the exact previous drink
        const ranked = this.rankProducts(
          freshPool,
          evolvedPrefs,
          undefined,
          Array.from(avoidedIds),
          message,
          moodContext
        );
        const picked = ranked[0]?.product || freshPool[0];
        candidateProducts = [picked];
        resolvedActiveId = picked.id;
        customGreeting = `A curated barista surprise! I selected our ${picked.name} (₹${picked.basePrice}) featuring ${picked.tasteNotes.join(", ")}.`;
        break;
      }

      case "customize": {
        // If a specific drink was being discussed or modified ("make it strong", "make that iced", "less sweet")
        const targetId =
          intentResult.referenceResolution?.resolvedProductId ||
          resolvedActiveId ||
          extraction.suggestedProductId ||
          recentProductIds[0] ||
          availableProducts[0].id;

        const targetProduct = (await baristaToolsService.getProduct(targetId)) || availableProducts[0];
        candidateProducts = [targetProduct];
        resolvedActiveId = targetProduct.id;
        customGreeting = `I've updated your ${targetProduct.name} recipe according to your specifications.`;
        break;
      }

      case "recommend":
      default: {
        const ranked = this.rankProducts(
          availableProducts,
          evolvedPrefs,
          extraction.suggestedProductId,
          [...recentProductIds, ...rejectedProductIds],
          message,
          moodContext
        );
        candidateProducts = ranked.slice(0, 3).map((r) => r.product);
        if (candidateProducts.length > 0) resolvedActiveId = candidateProducts[0].id;
        break;
      }
    }

    // Fallback if query returned no candidates
    if (candidateProducts.length === 0) {
      candidateProducts = availableProducts.slice(0, 3);
      resolvedActiveId = candidateProducts[0]?.id;
    }

    // 8. Build and Authoritatively Validate Candidate Drink Configurations
    const recommendations: BaristaRecommendation[] = [];

    for (const product of candidateProducts) {
      // Check availability tool
      const availCheck = await baristaToolsService.checkAvailability(product.id);
      const isAvailable = availCheck.available;

      const config = this.buildCandidateConfiguration(
        product,
        evolvedPrefs,
        safeContext,
        intent,
        message
      );
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
              available: isAvailable,
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
          available: isAvailable,
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

    // 9. Format Catalog Products list for catalog queries
    const catalogProducts: BaristaCatalogProduct[] = candidateProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      categoryLabel: p.categoryLabel,
      description: p.description,
      image: p.image,
      basePrice: p.basePrice,
      available: p.available,
      temperatureProfile: p.temperatureProfile,
      tasteNotes: p.tasteNotes,
      featured: p.featured,
    }));

    // 10. Context-Aware Barista Greeting & Follow-Up
    const primary = recommendations[0];
    const finalGreeting =
      customGreeting ||
      (primary
        ? `I've crafted a personalized recommendation for you: our ${primary.product.name}!`
        : "Here are our recommended café creations tailored for your taste:");

    const followUp = this.generateFollowUp(evolvedPrefs, primary?.configuration, intent, mode);

    return {
      success: true,
      mode,
      intent,
      message: finalGreeting,
      preferences: evolvedPrefs,
      moodContext,
      activeProductId: resolvedActiveId,
      recommendations,
      catalogProducts,
      comparison: comparisonData,
      productDetails,
      pairings: pairingsData,
      cafeMoment: cafeMomentCombo,
      budget: intentResult.extractedBudget || evolvedPrefs.budget,
      totalPrice: cafeMomentCombo?.totalPrice || primary?.pricing.finalPrice,
      references: intentResult.referenceResolution,
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
    avoidProductIds: string[] = [],
    messageText: string = "",
    moodContext?: BaristaMoodContext
  ): Array<{ product: ProductDoc; score: number }> {
    const rawLower = messageText.toLowerCase();

    return products
      .map((product) => {
        let score = 50;

        // User explicitly asked for this product by name
        if (rawLower.includes(product.name.toLowerCase())) {
          score += 60;
        }

        // Avoid repetitive or rejected recommendations unless explicitly requested
        if (avoidProductIds.includes(product.id) && !rawLower.includes(product.name.toLowerCase())) {
          score -= 40;
        }

        // Suggested product boost from extraction
        if (suggestedId && product.id === suggestedId) {
          score += 40;
        }

        // Mood context scoring
        if (moodContext) {
          switch (moodContext) {
            case "REFRESH":
              if (product.temperatureProfile === "Iced" || product.temperatureProfile === "Blended") score += 35;
              if (product.category === "smoothie" || product.tasteNotes.some((n) => /mint|lemon|berry|mango/i.test(n))) score += 20;
              break;
            case "ENERGIZE":
              if (product.strengthProfile >= 70) score += 35;
              if (product.category === "cold-coffee" || product.category === "hot-coffee") score += 20;
              break;
            case "FOCUS":
              if (product.strengthProfile >= 60 && product.sweetnessProfile <= 60) score += 30;
              break;
            case "COMFORT":
              if (product.temperatureProfile === "Hot") score += 35;
              if (product.tasteNotes.some((n) => /vanilla|cinnamon|caramel|cocoa/i.test(n))) score += 20;
              break;
            case "INDULGE":
              if (product.sweetnessProfile >= 65 || product.category === "frappe") score += 35;
              break;
            case "CHILL":
              if (product.category === "matcha" || product.category === "smoothie") score += 25;
              break;
            case "EXPLORE":
              if (product.featured || product.category === "matcha" || product.id === "matcha-cloud") score += 30;
              break;
          }
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
    intent?: BaristaIntent,
    messageText: string = ""
  ): DrinkConfiguration {
    const baseConfig = { ...product.defaultConfiguration };
    const text = messageText.toLowerCase();

    // When cheapest intent is requested, keep configuration at base minimum without paid add-ons
    if (intent === "cheapest") {
      baseConfig.milkId = "whole-milk";
      baseConfig.flavorId = "flavor-none";
      baseConfig.toppingIds = [];
      baseConfig.sizeId = "medium";
      return baseConfig;
    }

    // 0. Size modification (e.g. "make it large", "grande")
    if (text.includes("large") || text.includes("grande") || text.includes("big size")) {
      baseConfig.sizeId = "large";
    } else if (text.includes("small") || text.includes("regular")) {
      baseConfig.sizeId = "small";
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
   * Generates a context-aware café follow-up inquiry based on intent, mode, and recipe.
   */
  private generateFollowUp(
    prefs: BaristaPreferences,
    config?: DrinkConfiguration,
    intent?: BaristaIntent,
    mode?: BaristaResponseMode
  ): string {
    if (mode === "BUDGET_COMBO") {
      return "Would you like me to reserve this café combo for your order, or customize the drink size?";
    }
    if (mode === "CATALOG_QUERY") {
      return "Would you like to customize this drink in our Drink Studio, or see what snack pairs with it?";
    }
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
