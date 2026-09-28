import { BaristaIntent, BaristaPreferences, BaristaMessage } from "../ai/ai-provider.types";
import { ProductDoc } from "../../types/catalog";

export interface IntentDetectionResult {
  intent: BaristaIntent;
  confidence: number;
  extractedBudget?: number;
  extractedCategory?: string;
  extractedIngredient?: string;
  comparisonTargets?: [string, string];
  detailsTargetId?: string;
  pairingTargetId?: string;
}

export class IntentEngine {
  /**
   * Fast, deterministic intent classifier analyzing user query and conversation context.
   */
  classifyIntent(
    message: string,
    history: BaristaMessage[] = [],
    availableProducts: ProductDoc[] = []
  ): IntentDetectionResult {
    const raw = message.trim();
    const text = raw.toLowerCase();

    // 1. CHEAPEST INTENT
    if (
      /\b(cheapest|cheaper|lowest price|least expensive|most affordable|lowest cost|budget friendly option|pocket friendly)\b/i.test(
        text
      )
    ) {
      let categoryMatch: string | undefined;
      if (/\b(coffee|espresso|latte|brew)\b/i.test(text)) categoryMatch = "coffee";
      else if (/\b(tea|matcha)\b/i.test(text)) categoryMatch = "tea";
      else if (/\b(smoothie|frappe)\b/i.test(text)) categoryMatch = "smoothie";

      return {
        intent: "cheapest",
        confidence: 0.95,
        extractedCategory: categoryMatch,
      };
    }

    // 2. MOST EXPENSIVE / PREMIUM INTENT
    if (
      /\b(most expensive|priciest|highest price|top shelf|most premium|costliest|luxurious)\b/i.test(
        text
      )
    ) {
      let categoryMatch: string | undefined;
      if (/\b(coffee|espresso|latte|brew)\b/i.test(text)) categoryMatch = "coffee";
      return {
        intent: "most_expensive",
        confidence: 0.95,
        extractedCategory: categoryMatch,
      };
    }

    // 3. BUDGET INTENT (e.g. "under ₹200", "below 250", "I have 300", "within 200")
    const budgetMatch = text.match(
      /(?:under|below|less than|within|have|budget of|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d{2,4})\b/i
    ) || text.match(/(?:₹|rs\.?|inr)\s*(\d{2,4})\s*(?:budget|or less|max)?/i);

    if (budgetMatch && budgetMatch[1]) {
      const budgetAmount = parseInt(budgetMatch[1], 10);
      if (!isNaN(budgetAmount) && budgetAmount > 0) {
        let categoryMatch: string | undefined;
        if (/\b(coffee|cold brew|latte)\b/i.test(text)) categoryMatch = "coffee";
        return {
          intent: "budget",
          confidence: 0.92,
          extractedBudget: budgetAmount,
          extractedCategory: categoryMatch,
        };
      }
    }

    // 4. COMPARISON INTENT (e.g. "compare X and Y", "X vs Y", "difference between X and Y")
    if (
      /\b(compare|versus|\bvs\b|difference between|how does .+ compare to)\b/i.test(
        text
      )
    ) {
      const targets = this.findComparisonTargets(text, availableProducts);
      if (targets) {
        return {
          intent: "compare",
          confidence: 0.95,
          comparisonTargets: [targets[0].id, targets[1].id],
        };
      }
    }

    // 5. PAIRING INTENT (e.g. "what goes with X", "snack pairing", "food with cold brew")
    if (
      /\b(pairing|pair with|goes with|snack|food|pastry|dessert|biscuit|cookie|croissant)\b/i.test(
        text
      )
    ) {
      const targetProduct = this.findProductMention(text, availableProducts);
      return {
        intent: "pairing",
        confidence: 0.9,
        pairingTargetId: targetProduct?.id,
      };
    }

    // 6. PRODUCT DETAILS INTENT (e.g. "tell me about Matcha Cloud", "what is Caramel Cold Brew")
    if (
      /\b(tell me about|what is|explain|details on|info on|ingredients of|what's in|what is in)\b/i.test(
        text
      )
    ) {
      const targetProduct = this.findProductMention(text, availableProducts);
      if (targetProduct) {
        return {
          intent: "details",
          confidence: 0.95,
          detailsTargetId: targetProduct.id,
        };
      }
    }

    // 7. AVAILABILITY INTENT (e.g. "what drinks are available", "what can I order", "menu in stock")
    if (
      /\b(what drinks are available|what is available|what's available|in stock|menu availability|what can i order|what do you have)\b/i.test(
        text
      )
    ) {
      return {
        intent: "availability",
        confidence: 0.9,
      };
    }

    // 8. RANDOM / SURPRISE INTENT (e.g. "surprise me", "give me something random", "you choose", "something else")
    if (
      /\b(surprise me|random|pick for me|anything|you choose|dealer's choice|surprise|give me something else|try something else|different drink)\b/i.test(
        text
      )
    ) {
      return {
        intent: "random",
        confidence: 0.9,
      };
    }

    // 9. INGREDIENT INTENT (e.g. "what has caramel", "which drinks have oat milk", "creamy drinks")
    if (
      /\b(what has|which drinks have|drinks with|contains|has caramel|has chocolate|has matcha|has vanilla|has oat milk|has almond milk|dairy free)\b/i.test(
        text
      )
    ) {
      const ingredient = this.extractIngredientQuery(text);
      if (ingredient) {
        return {
          intent: "ingredient",
          confidence: 0.88,
          extractedIngredient: ingredient,
        };
      }
    }

    // 10. CATEGORY INTENT (e.g. "show me coffees", "show cold drinks", "list smoothies", "matcha drinks")
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
          confidence: 0.9,
          extractedCategory: categoryMatch,
        };
      }
    }

    // 11. CUSTOMIZE INTENT (Follow-up tuning like "make it less sweet", "extra strong", "add vanilla")
    if (
      history.length > 0 &&
      /\b(make it|less sweet|more sweet|sweeter|stronger|less strong|extra strong|decaf|add |change milk|with oat|with almond|no ice|more ice)\b/i.test(
        text
      )
    ) {
      return {
        intent: "customize",
        confidence: 0.85,
      };
    }

    // 12. DEFAULT: RECOMMEND
    return {
      intent: "recommend",
      confidence: 0.8,
    };
  }

  /**
   * Evolve and accumulate conversation preferences across multi-turn interactions.
   */
  evolvePreferences(
    incoming: BaristaPreferences,
    previous?: BaristaPreferences,
    messageText?: string
  ): BaristaPreferences {
    const evolved: BaristaPreferences = { ...(previous || {}) };
    const text = (messageText || "").toLowerCase();

    // 1. Temperature
    if (incoming.temperature) {
      evolved.temperature = incoming.temperature;
    } else if (text.includes("cold") || text.includes("iced") || text.includes("chill")) {
      evolved.temperature = "cold";
    } else if (text.includes("hot") || text.includes("warm") || text.includes("steamed")) {
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
    } else if (text.includes("sweet")) {
      evolved.sweetness = 65;
    }

    // 3. Strength / Boldness
    if (typeof incoming.strength === "number") {
      evolved.strength = incoming.strength;
    } else if (text.includes("decaf") || text.includes("zero caffeine") || text.includes("no caffeine")) {
      evolved.strength = 10;
    } else if (text.includes("extra strong") || text.includes("double shot") || text.includes("very strong")) {
      evolved.strength = 90;
    } else if (text.includes("strong") || text.includes("bold") || text.includes("high caffeine")) {
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
    } else if (text.includes("oat milk") || text.includes("oat")) {
      evolved.milk = "oat-milk";
      evolved.milkPreference = "oat-milk";
    } else if (text.includes("almond milk") || text.includes("almond")) {
      evolved.milk = "almond-milk";
      evolved.milkPreference = "almond-milk";
    } else if (text.includes("soy milk") || text.includes("soy")) {
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
    if (typeof incoming.budget === "number") {
      evolved.budget = incoming.budget;
    }

    return evolved;
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
}

export const intentEngine = new IntentEngine();
