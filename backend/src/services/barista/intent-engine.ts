import {
  BaristaIntent,
  BaristaPreferences,
  BaristaMessage,
  BaristaResponseMode,
  BaristaMoodContext,
  BaristaReferenceResolution,
} from "../ai/ai-provider.types";
import { ProductDoc } from "../../types/catalog";

export interface IntentDetectionResult {
  intent: BaristaIntent;
  mode: BaristaResponseMode;
  confidence: number;
  extractedBudget?: number;
  extractedCategory?: string;
  extractedIngredient?: string;
  comparisonTargets?: [string, string];
  detailsTargetId?: string;
  pairingTargetId?: string;
  moodContext?: BaristaMoodContext;
  isBudgetCombo?: boolean;
  referenceResolution?: BaristaReferenceResolution;
  isRejection?: boolean;
  isSurprise?: boolean;
  sizeUpgrade?: string;
  isSecurityDefusal?: boolean;
  securityDefusalMessage?: string;
}

export class IntentEngine {
  /**
   * Fast, semantic, and deterministic intent classifier analyzing user query, conversation history,
   * active product references, and mood context.
   */
  classifyIntent(
    message: string,
    history: BaristaMessage[] = [],
    availableProducts: ProductDoc[] = [],
    lastRecommendations: string[] = [],
    lastActiveProductId?: string
  ): IntentDetectionResult {
    const raw = message.trim();
    const text = raw.toLowerCase();

    // 0. Detect Mood Context (No psychological/medical claims)
    const moodContext = this.detectMoodContext(text);

    // 0.1 Detect References & Pronouns ("that one", "second one", "not that", "make it large")
    const referenceResolution = this.resolveReference(
      text,
      history,
      availableProducts,
      lastRecommendations,
      lastActiveProductId
    );

    // 0.2 PROMPT INJECTION & SECURITY PROBE DEFENSE
    const injectionCheck = this.detectPromptInjection(text);
    if (injectionCheck.isInjection) {
      return {
        intent: "recommend",
        mode: "CONVERSATION",
        confidence: 1.0,
        moodContext,
        isSecurityDefusal: true,
        securityDefusalMessage: injectionCheck.explanation,
      };
    }

    // 1. GREETING (e.g. "hi", "hello", "good morning", "hey barista")
    if (
      /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy|greetings|hey\s+barista|namaste)[!.,\s]*$/i.test(
        text
      )
    ) {
      return {
        intent: "recommend",
        mode: "GREETING",
        confidence: 0.98,
        moodContext,
      };
    }

    // 2. CONVERSATION / GENERAL (e.g. "who are you", "what can you do", "thank you", "thanks")
    if (
      /\b(who are you|what can you do|how are you|tell me your name|thank you|thanks|bye|see you)\b/i.test(
        text
      )
    ) {
      return {
        intent: "recommend",
        mode: "CONVERSATION",
        confidence: 0.95,
        moodContext,
      };
    }

    // 3. COMPLETE MY CAFÉ MOMENT / BUDGET COMBO (e.g. "coffee and something sweet under 300", "complete my café moment", "drink and snack")
    if (
      text.includes("complete my café moment") ||
      text.includes("complete my cafe moment") ||
      text.includes("café moment") ||
      text.includes("cafe moment") ||
      /\b(drink and something sweet|coffee and something sweet|drink and snack|combo|meal|snack and coffee|pastry and coffee)\b/i.test(
        text
      )
    ) {
      const budget = this.extractBudgetAmount(text);
      let categoryMatch: string | undefined;
      if (/\b(coffee|espresso|latte|brew)\b/i.test(text)) categoryMatch = "coffee";

      return {
        intent: "budget",
        mode: "BUDGET_COMBO",
        confidence: 0.96,
        isBudgetCombo: true,
        extractedBudget: budget || undefined,
        extractedCategory: categoryMatch,
        moodContext,
        referenceResolution,
      };
    }

    // 4. MOST EXPENSIVE / PREMIUM INTENT (Semantic Paraphrases)
    // "expensive coffee in your cafe", "which coffee costs the most?", "what's your priciest coffee?",
    // "show me the fanciest coffee", "which coffee has the highest price?", "what is your premium coffee?"
    if (
      /\b(most expensive|priciest|highest price|top shelf|most premium|costliest|luxurious|fanciest|costs the most|highest cost|premium coffee|expensive coffee)\b/i.test(
        text
      )
    ) {
      let categoryMatch: string | undefined;
      if (/\b(coffee|espresso|latte|brew)\b/i.test(text)) categoryMatch = "coffee";
      else if (/\b(tea|matcha)\b/i.test(text)) categoryMatch = "tea";
      else if (/\b(smoothie|frappe)\b/i.test(text)) categoryMatch = "smoothie";

      return {
        intent: "most_expensive",
        mode: "CATALOG_QUERY",
        confidence: 0.96,
        extractedCategory: categoryMatch,
        moodContext,
      };
    }

    // 5. CHEAPEST INTENT (Semantic Paraphrases)
    // "give me the cheapest coffee", "lowest price", "least expensive", "pocket friendly", "cheapest"
    if (
      /\b(cheapest|cheaper|lowest price|least expensive|most affordable|lowest cost|budget friendly option|pocket friendly|costs the least|give me the cheapest)\b/i.test(
        text
      )
    ) {
      let categoryMatch: string | undefined;
      if (/\b(coffee|espresso|latte|brew)\b/i.test(text)) categoryMatch = "coffee";
      else if (/\b(tea|matcha)\b/i.test(text)) categoryMatch = "tea";
      else if (/\b(smoothie|frappe)\b/i.test(text)) categoryMatch = "smoothie";

      return {
        intent: "cheapest",
        mode: "CATALOG_QUERY",
        confidence: 0.96,
        extractedCategory: categoryMatch,
        moodContext,
      };
    }

    // 6. BUDGET INTENT (e.g. "I only have ₹200", "keep it under 200", "what can I get for 200?", "I've got two hundred rupees", "something affordable around ₹250")
    const budgetAmount = this.extractBudgetAmount(text);
    if (budgetAmount) {
      let categoryMatch: string | undefined;
      if (/\b(coffee|cold brew|latte)\b/i.test(text)) categoryMatch = "coffee";

      // If user specifically asked for a drink and food combo
      if (
        /\b(and|with|plus)\b/i.test(text) &&
        /\b(sweet|snack|cookie|pastry|cake|food|eat)\b/i.test(text)
      ) {
        return {
          intent: "budget",
          mode: "BUDGET_COMBO",
          confidence: 0.94,
          isBudgetCombo: true,
          extractedBudget: budgetAmount,
          extractedCategory: categoryMatch,
          moodContext,
          referenceResolution,
        };
      }

      return {
        intent: "budget",
        mode: "CATALOG_QUERY",
        confidence: 0.93,
        extractedBudget: budgetAmount,
        extractedCategory: categoryMatch,
        moodContext,
        referenceResolution,
      };
    }

    // 7. COMPARISON INTENT (e.g. "compare X and Y", "X vs Y", "difference between X and Y")
    if (
      /\b(compare|versus|\bvs\b|difference between|how does .+ compare to)\b/i.test(
        text
      )
    ) {
      const targets = this.findComparisonTargets(text, availableProducts);
      if (targets) {
        return {
          intent: "compare",
          mode: "COMPARISON",
          confidence: 0.95,
          comparisonTargets: [targets[0].id, targets[1].id],
          moodContext,
        };
      }
    }

    // 8. PAIRING INTENT (e.g. "what goes with X", "snack pairing", "food with cold brew", "what should I eat with this?", "what snack goes with my coffee?")
    if (
      /\b(pairing|pair with|goes with|snack|food|pastry|dessert|biscuit|cookie|croissant|what should i eat with this|what snack goes with my coffee|give me something sweet with it)\b/i.test(
        text
      )
    ) {
      const targetProduct =
        this.findProductMention(text, availableProducts) ||
        (lastActiveProductId
          ? availableProducts.find((p) => p.id === lastActiveProductId)
          : null);

      return {
        intent: "pairing",
        mode: "PAIRING",
        confidence: 0.92,
        pairingTargetId: targetProduct?.id,
        moodContext,
        referenceResolution,
      };
    }

    // 9. PRODUCT DETAILS INTENT (e.g. "tell me about Matcha Cloud", "what is Caramel Cold Brew")
    if (
      /\b(tell me about|what is|explain|details on|info on|ingredients of|what's in|what is in)\b/i.test(
        text
      )
    ) {
      const targetProduct = this.findProductMention(text, availableProducts);
      if (targetProduct) {
        return {
          intent: "details",
          mode: "DETAILS",
          confidence: 0.95,
          detailsTargetId: targetProduct.id,
          moodContext,
        };
      }
    }

    // 10. AVAILABILITY INTENT (e.g. "what drinks are available", "what can I order", "menu in stock")
    if (
      /\b(what drinks are available|what is available|what's available|in stock|menu availability|what can i order|what do you have)\b/i.test(
        text
      )
    ) {
      return {
        intent: "availability",
        mode: "CATALOG_QUERY",
        confidence: 0.92,
        moodContext,
      };
    }

    // 11. RANDOM / SURPRISE / REJECTION INTENT
    // "surprise me", "pick something for me", "choose something unexpected", "give me another", "not that one", "try something else", "something different"
    if (
      /\b(surprise me|pick something for me|pick for me|choose something unexpected|you choose|dealer's choice|give me another|not that one|not that|not this|something different|try something else|different drink|something else)\b/i.test(
        text
      )
    ) {
      const isRejection = /\b(not that|not this|different|another|something else)\b/i.test(text);
      return {
        intent: "random",
        mode: "RECOMMENDATION",
        confidence: 0.92,
        isSurprise: true,
        isRejection,
        moodContext,
        referenceResolution,
      };
    }

    // 12. INGREDIENT INTENT (e.g. "what has caramel", "which drinks have oat milk", "creamy drinks")
    if (
      /\b(what has|which drinks have|drinks with|contains|has caramel|has chocolate|has matcha|has vanilla|has oat milk|has almond milk|dairy free)\b/i.test(
        text
      )
    ) {
      const ingredient = this.extractIngredientQuery(text);
      if (ingredient) {
        return {
          intent: "ingredient",
          mode: "CATALOG_QUERY",
          confidence: 0.9,
          extractedIngredient: ingredient,
          moodContext,
        };
      }
    }

    // 13. CATEGORY INTENT (e.g. "show me coffees", "show cold drinks", "list smoothies", "matcha drinks")
    if (
      /\b(show me|list|give me)\s+(?:all\s+)?(coffees?|cold brews?|frappes?|smoothies?|matcha|teas?|hot drinks?|cold drinks?|lattes?)\b/i.test(
        text
      ) ||
      /^(coffees?|cold brews?|frappes?|smoothies?|matcha|hot drinks?|cold drinks?|lattes?)$/i.test(
        text
      )
    ) {
      const categoryMatch = this.extractCategoryQuery(text);
      if (categoryMatch) {
        return {
          intent: "category",
          mode: "CATALOG_QUERY",
          confidence: 0.9,
          extractedCategory: categoryMatch,
          moodContext,
        };
      }
    }

    // 14. CUSTOMIZE INTENT (Follow-up tuning like "make it strong", "less sweet", "add caramel", "make it large", "make that iced")
    if (
      /\b(make it|make that|less sweet|more sweet|sweeter|stronger|less strong|extra strong|decaf|add |change milk|with oat|with almond|no ice|more ice|large|grande|make it large|make that iced)\b/i.test(
        text
      )
    ) {
      return {
        intent: "customize",
        mode: "CUSTOMIZATION",
        confidence: 0.9,
        referenceResolution,
        moodContext,
      };
    }

    // 15. DEFAULT: RECOMMENDATION
    return {
      intent: "recommend",
      mode: "RECOMMENDATION",
      confidence: 0.85,
      moodContext,
      referenceResolution,
    };
  }

  /**
   * Resolves context references and pronouns ("that one", "second one", "not that", "make it large").
   */
  resolveReference(
    text: string,
    history: BaristaMessage[] = [],
    availableProducts: ProductDoc[] = [],
    lastRecommendations: string[] = [],
    lastActiveProductId?: string
  ): BaristaReferenceResolution | undefined {
    // 1. "not that one", "not that", "give me another", "something else"
    if (/\b(not that|not this|give me another|try something else|something different)\b/i.test(text)) {
      const targetId = lastActiveProductId || lastRecommendations[0];
      const prod = availableProducts.find((p) => p.id === targetId);
      return {
        resolvedProductId: targetId,
        resolvedProductName: prod?.name,
        action: "reject",
      };
    }

    // 2. "second one", "the second one", "the 2nd one", "number 2"
    if (/\b(second one|the second one|2nd one|number two|number 2)\b/i.test(text)) {
      const targetId = lastRecommendations[1] || lastRecommendations[0];
      const prod = availableProducts.find((p) => p.id === targetId);
      return {
        resolvedProductId: targetId,
        resolvedProductName: prod?.name,
        resolvedIndex: 1,
        action: "switch",
      };
    }

    // 3. "that one", "that", "make that", "same but", "make it"
    if (
      /\b(that one|that drink|make that|make it|same but|with that)\b/i.test(text) ||
      (history.length > 0 && /\b(large|iced|strong|sweet|oat milk)\b/i.test(text))
    ) {
      const targetId = lastActiveProductId || lastRecommendations[0];
      const prod = availableProducts.find((p) => p.id === targetId);
      return {
        resolvedProductId: targetId,
        resolvedProductName: prod?.name,
        action: "modify",
      };
    }

    return undefined;
  }

  /**
   * Maps natural language cues into lightweight café mood/context states without medical claims.
   */
  detectMoodContext(text: string): BaristaMoodContext | undefined {
    // REFRESH: heat, thirsty, refreshing, cooling
    if (/\b(hot today|so hot|scorching|refreshing|refresh|cooling|beat the heat|cool down|thirst)\b/i.test(text)) {
      return "REFRESH";
    }

    // ENERGIZE: tired, wake me up, exhausted, fatigue, sleepy, long day, boost
    if (/\b(wake me up|wake up|exhausted|tired|sleepy|need energy|fatigued|caffeine boost|need a boost)\b/i.test(text)) {
      return "ENERGIZE";
    }

    // FOCUS: working, studying, study, focus, concentration, coding, deep work
    if (/\b(working|work|study|studying|focus|concentrate|concentration|deep work|reading)\b/i.test(text)) {
      return "FOCUS";
    }

    // COMFORT: cozy, warm hug, rainy, gloomy, comfort, comforting, relax
    if (/\b(cozy|comfort|comforting|warm hug|rainy|gloomy|snuggle|winter)\b/i.test(text)) {
      return "COMFORT";
    }

    // INDULGE: treat myself, dessert, decadent, cheat day, sweet tooth, luxury, pamper
    if (/\b(treat myself|indulge|indulgence|decadent|cheat day|pamper|rich treat|sweet tooth)\b/i.test(text)) {
      return "INDULGE";
    }

    // CHILL: unwind, slow down, chill, taking a break, relaxed afternoon
    if (/\b(chill|unwind|slow down|take a break|taking a break|lazy afternoon|casual)\b/i.test(text)) {
      return "CHILL";
    }

    // EXPLORE: explore, something new, surprise me, unique, adventurous, unusual
    if (/\b(explore|something new|surprise|unexpected|unique|adventurous|try something new)\b/i.test(text)) {
      return "EXPLORE";
    }

    return undefined;
  }

  /**
   * Evolve and accumulate conversation preferences across multi-turn interactions.
   * Preserves previous state unless explicitly changed by customer.
   */
  evolvePreferences(
    incoming: BaristaPreferences,
    previous?: BaristaPreferences,
    messageText?: string
  ): BaristaPreferences {
    const evolved: BaristaPreferences = { ...(previous || {}) };
    const text = (messageText || "").toLowerCase();

    // 1. Temperature
    if (text.includes("hot today") || text.includes("so hot") || text.includes("hot outside")) {
      evolved.temperature = "cold";
    } else if (incoming.temperature) {
      evolved.temperature = incoming.temperature;
    } else if (text.includes("cold") || text.includes("iced") || text.includes("chill") || text.includes("make that iced") || text.includes("make it iced")) {
      evolved.temperature = "cold";
    } else if (text.includes("hot") || text.includes("warm") || text.includes("steamed") || text.includes("make that hot")) {
      evolved.temperature = "hot";
    } else if (text.includes("blended") || text.includes("frappe")) {
      evolved.temperature = "blended";
    }

    // 2. Sweetness
    if (typeof incoming.sweetness === "number") {
      evolved.sweetness = incoming.sweetness;
    } else if (text.includes("unsweetened") || text.includes("zero sugar") || text.includes("no sugar")) {
      evolved.sweetness = 10;
    } else if (text.includes("less sweet") || text.includes("light sweet") || text.includes("not too sweet")) {
      evolved.sweetness = 30;
    } else if (text.includes("extra sweet") || text.includes("very sweet")) {
      evolved.sweetness = 85;
    } else if (text.includes("more sweet") || text.includes("sweeter")) {
      evolved.sweetness = 75;
    } else if (text.includes("sweet")) {
      evolved.sweetness = 65;
    }

    // 3. Strength / Boldness
    if (text.includes("make it strong") || text.includes("extra strong") || text.includes("very strong") || text.includes("double shot")) {
      evolved.strength = 85;
    } else if (typeof incoming.strength === "number") {
      evolved.strength = incoming.strength;
    } else if (text.includes("decaf") || text.includes("zero caffeine") || text.includes("no caffeine")) {
      evolved.strength = 10;
    } else if (text.includes("strong") || text.includes("bold") || text.includes("high caffeine") || text.includes("wake me up")) {
      evolved.strength = 80;
    }

    // 4. Creaminess
    if (typeof incoming.creaminess === "number") {
      evolved.creaminess = incoming.creaminess;
    } else if (text.includes("black") || text.includes("no milk")) {
      evolved.creaminess = 10;
    } else if (text.includes("extra creamy") || text.includes("rich cream")) {
      evolved.creaminess = 85;
    } else if (text.includes("creamy") || text.includes("silky")) {
      evolved.creaminess = 65;
    }

    // 5. Chill
    if (typeof incoming.chill === "number") {
      evolved.chill = incoming.chill;
    }

    // 6. Milk
    if (incoming.milkPreference) {
      evolved.milk = incoming.milkPreference;
      evolved.milkPreference = incoming.milkPreference;
    } else if (text.includes("oat milk") || text.includes("with oat milk") || text.includes("with oat")) {
      evolved.milk = "oat-milk";
      evolved.milkPreference = "oat-milk";
    } else if (text.includes("almond milk") || text.includes("with almond milk") || text.includes("with almond")) {
      evolved.milk = "almond-milk";
      evolved.milkPreference = "almond-milk";
    } else if (text.includes("soy milk") || text.includes("with soy")) {
      evolved.milk = "soy-milk";
      evolved.milkPreference = "soy-milk";
    } else if (text.includes("whole milk") || text.includes("dairy")) {
      evolved.milk = "whole-milk";
      evolved.milkPreference = "whole-milk";
    }

    // 7. Flavor
    const existingFlavors = new Set(evolved.flavorPreferences || []);
    if (incoming.flavorPreferences) {
      incoming.flavorPreferences.forEach((f) => existingFlavors.add(f));
    }
    const detectedFlavors = ["caramel", "vanilla", "chocolate", "hazelnut", "strawberry", "mango", "berry", "mint"];
    detectedFlavors.forEach((fl) => {
      if (text.includes(fl)) {
        existingFlavors.add(fl);
        evolved.flavor = fl;
      }
    });
    if (existingFlavors.size > 0) {
      evolved.flavorPreferences = Array.from(existingFlavors);
    }

    // 8. Category
    if (incoming.categoryPreference) {
      evolved.category = incoming.categoryPreference;
      evolved.categoryPreference = incoming.categoryPreference;
    }

    // 9. Budget
    const extractedBudget = this.extractBudgetAmount(text);
    if (extractedBudget) {
      evolved.budget = extractedBudget;
    } else if (typeof incoming.budget === "number") {
      evolved.budget = incoming.budget;
    }

    return evolved;
  }

  /**
   * Extracts numerical or word-form budget from text.
   */
  private extractBudgetAmount(text: string): number | null {
    // Digit-based budget
    const digitMatch =
      text.match(/(?:under|below|less than|within|have|only have|got|budget of|around|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d{2,4})\b/i) ||
      text.match(/(?:₹|rs\.?|inr)\s*(\d{2,4})\b/i) ||
      text.match(/\bfor\s*(\d{2,4})\b/i);

    if (digitMatch && digitMatch[1]) {
      const val = parseInt(digitMatch[1], 10);
      if (!isNaN(val) && val > 0) return val;
    }

    // Word-based budget (e.g. "two hundred rupees", "three hundred", "two hundred fifty")
    if (text.includes("two hundred fifty") || text.includes("250")) return 250;
    if (text.includes("two hundred") || text.includes("200")) return 200;
    if (text.includes("three hundred") || text.includes("300")) return 300;
    if (text.includes("one hundred fifty") || text.includes("150")) return 150;
    if (text.includes("four hundred") || text.includes("400")) return 400;

    return null;
  }

  /**
   * Identifies two distinct products mentioned for side-by-side comparison.
   */
  private findComparisonTargets(text: string, products: ProductDoc[]): [ProductDoc, ProductDoc] | null {
    const matched: ProductDoc[] = [];
    for (const p of products) {
      const nameParts = p.name.toLowerCase().split(" ");
      const matchesFullName = text.includes(p.name.toLowerCase());
      const matchesKeyword = nameParts.some(
        (part) => part.length > 3 && text.includes(part)
      );
      if (matchesFullName || matchesKeyword) {
        if (!matched.some((m) => m.id === p.id)) {
          matched.push(p);
        }
      }
      if (matched.length === 2) break;
    }

    if (matched.length >= 2) {
      matched.sort((a, b) => {
        const getIdx = (p: ProductDoc) => {
          const full = text.indexOf(p.name.toLowerCase());
          if (full !== -1) return full;
          const slugIdx = text.indexOf(p.slug.toLowerCase());
          if (slugIdx !== -1) return slugIdx;
          const parts = p.name.toLowerCase().split(" ");
          for (const part of parts) {
            const pi = text.indexOf(part);
            if (pi !== -1) return pi;
          }
          return 9999;
        };
        return getIdx(a) - getIdx(b);
      });
      return [matched[0], matched[1]];
    }

    // If query mentions "latte and cold brew" as generic categories, find matching catalog items
    if (text.includes("latte") && (text.includes("cold brew") || text.includes("coldbrew"))) {
      const latte = products.find((p) => p.id === "vanilla-latte");
      const coldBrew = products.find((p) => p.id === "caramel-cold-brew");
      if (latte && coldBrew) {
        return text.indexOf("latte") < text.indexOf("cold") ? [latte, coldBrew] : [coldBrew, latte];
      }
    }

    return null;
  }

  /**
   * Finds a specific product mentioned in text.
   */
  findProductMention(text: string, products: ProductDoc[]): ProductDoc | null {
    for (const p of products) {
      if (text.includes(p.name.toLowerCase()) || text.includes(p.slug)) {
        return p;
      }
    }
    // Partial keyword matches
    if (text.includes("matcha")) return products.find((p) => p.id === "matcha-cloud") || null;
    if (text.includes("cold brew")) return products.find((p) => p.id === "caramel-cold-brew") || null;
    if (text.includes("frappe")) return products.find((p) => p.id === "chocolate-frappe") || null;
    if (text.includes("latte")) return products.find((p) => p.id === "vanilla-latte") || null;
    if (text.includes("mocha")) return products.find((p) => p.id === "mocha-cream") || null;
    if (text.includes("strawberry")) return products.find((p) => p.id === "strawberry-cream") || null;
    if (text.includes("mango")) return products.find((p) => p.id === "mango-smoothie") || null;
    if (text.includes("berry")) return products.find((p) => p.id === "berry-blast") || null;

    return null;
  }

  /**
   * Extracts target ingredient from query.
   */
  private extractIngredientQuery(text: string): string | null {
    const ingredients = [
      "caramel",
      "chocolate",
      "vanilla",
      "hazelnut",
      "matcha",
      "oat milk",
      "almond milk",
      "soy milk",
      "whole milk",
      "strawberry",
      "mango",
      "berry",
      "mint",
      "espresso",
      "cold brew",
    ];

    for (const ing of ingredients) {
      if (text.includes(ing)) return ing;
    }
    return null;
  }

  /**
   * Extracts category query keyword from text.
   */
  private extractCategoryQuery(text: string): string | null {
    if (text.includes("cold brew") || text.includes("cold coffee")) return "cold-coffee";
    if (text.includes("hot coffee") || text.includes("latte") || text.includes("espresso")) return "hot-coffee";
    if (text.includes("frappe")) return "frappe";
    if (text.includes("smoothie")) return "smoothie";
    if (text.includes("matcha") || text.includes("tea")) return "matcha";
    if (text.includes("coffee")) return "coffee";
    return null;
  }

  /**
   * Identifies adversarial prompt injection attacks, system prompt leakage attempts,
   * privilege escalation probes, and authoritative price manipulation attempts.
   */
  private detectPromptInjection(text: string): { isInjection: boolean; explanation?: string } {
    // 1. System prompt leakage / developer instruction extraction
    if (
      /\b(ignore (all )?previous instructions|disregard (all )?prior instructions|reveal (your |the )?system prompt|show (me )?(your |the )?system prompt|what is your system prompt|tell me your system prompt|print your system instructions|developer instructions|reveal your prompt|what were you told to do)\b/i.test(
        text
      )
    ) {
      return {
        isInjection: true,
        explanation:
          "I am your AI Café Concierge dedicated to crafting and recommending beverages from our authentic café menu. My internal system instructions and operational parameters are protected and cannot be disclosed.",
      };
    }

    // 2. Secret API keys & credential probing
    if (
      /\b(admin credentials|super_admin password|secret api key|gemini api key|firebase credentials|service account key|reveal (the )?password|give me (the )?credentials|show me (the )?api key)\b/i.test(
        text
      )
    ) {
      return {
        isInjection: true,
        explanation:
          "I do not have access to administrative credentials, server API keys, or private system secrets. As a café concierge, I can only assist with beverages, recipes, and menu pairings.",
      };
    }

    // 3. Privilege escalation / role tampering attempts
    if (
      /\b(change my role to super_admin|make me an admin|grant me super_admin|elevate my role|escalate my permissions|grant me admin privileges|give me admin access)\b/i.test(
        text
      )
    ) {
      return {
        isInjection: true,
        explanation:
          "I cannot modify account roles, permissions, or administrative access. User roles and governance are strictly managed by authorized administrators through our security architecture.",
      };
    }

    // 4. Authoritative price / catalog tampering
    if (
      /\b(override (the )?price|pretend this (product |drink )?costs|make this (drink |product )?(cost )?₹?1\b|give it to me for free|set the price to ₹?0|fake price)\b/i.test(
        text
      )
    ) {
      return {
        isInjection: true,
        explanation:
          "All beverage and item pricing is server-authoritative and determined exclusively by our live café catalog. I cannot alter, override, or negotiate menu pricing.",
      };
    }

    // 5. Invent fake non-existent products
    if (
      /\b(create a product that doesn't exist|invent a (new )?product|fabricate a drink)\b/i.test(
        text
      )
    ) {
      return {
        isInjection: true,
        explanation:
          "I only recommend and customize real products available on our actual café menu. I cannot fabricate non-existent products.",
      };
    }

    return { isInjection: false };
  }
}

export const intentEngine = new IntentEngine();
