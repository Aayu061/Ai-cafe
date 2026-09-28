import {
  AiProvider,
  BaristaExtractionResult,
  BaristaMessage,
  BaristaPreferences,
  SafeCatalogContext,
  BaristaIntent,
} from "./ai-provider.types";
import { ProductDoc, DrinkConfiguration, DrinkDna } from "../../types/catalog";

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async extractPreferences(
    message: string,
    history: BaristaMessage[],
    _catalogContext: SafeCatalogContext
  ): Promise<BaristaExtractionResult> {
    const text = (
      history.map((m) => m.content).join(" ") + " " + message
    ).toLowerCase();

    const preferences: BaristaPreferences = {};

    // Temperature detection
    if (text.includes("hot") || text.includes("warm") || text.includes("steamed")) {
      preferences.temperature = "hot";
    } else if (text.includes("frappe") || text.includes("blended") || text.includes("smoothie")) {
      preferences.temperature = "blended";
    } else if (text.includes("cold") || text.includes("iced") || text.includes("chill") || text.includes("refresh")) {
      preferences.temperature = "cold";
    }

    // Sweetness detection
    if (text.includes("not sweet") || text.includes("zero sugar") || text.includes("no sweet") || text.includes("unsweetened")) {
      preferences.sweetness = 10;
    } else if (text.includes("less sweet") || text.includes("light sweet") || text.includes("not too sweet")) {
      preferences.sweetness = 30;
    } else if (text.includes("extra sweet") || text.includes("very sweet") || text.includes("sweet tooth")) {
      preferences.sweetness = 85;
    } else if (text.includes("sweet")) {
      preferences.sweetness = 65;
    }

    // Strength detection
    if (text.includes("decaf") || text.includes("no caffeine") || text.includes("zero caffeine")) {
      preferences.strength = 5;
    } else if (text.includes("extra strong") || text.includes("very strong") || text.includes("double shot") || text.includes("high caffeine")) {
      preferences.strength = 90;
    } else if (text.includes("strong") || text.includes("bold") || text.includes("wake me up") || text.includes("energizing")) {
      preferences.strength = 75;
    }

    // Creaminess detection
    if (text.includes("black") || text.includes("no milk") || text.includes("dairy free without cream")) {
      preferences.creaminess = 10;
    } else if (text.includes("extra creamy") || text.includes("heavy cream") || text.includes("rich cream")) {
      preferences.creaminess = 85;
    } else if (text.includes("creamy") || text.includes("smooth") || text.includes("velvet") || text.includes("silky")) {
      preferences.creaminess = 65;
    }

    // Milk preference
    if (text.includes("oat milk") || text.includes("oat")) {
      preferences.milkPreference = "oat-milk";
    } else if (text.includes("almond milk") || text.includes("almond")) {
      preferences.milkPreference = "almond-milk";
    } else if (text.includes("soy milk") || text.includes("soy")) {
      preferences.milkPreference = "soy-milk";
    } else if (text.includes("whole milk") || text.includes("dairy milk")) {
      preferences.milkPreference = "whole-milk";
    }

    // Flavor preference
    const flavorPrefs: string[] = [];
    if (text.includes("caramel")) flavorPrefs.push("caramel");
    if (text.includes("vanilla")) flavorPrefs.push("vanilla");
    if (text.includes("chocolate") || text.includes("cocoa") || text.includes("mocha")) flavorPrefs.push("chocolate");
    if (text.includes("hazelnut") || text.includes("nutty")) flavorPrefs.push("hazelnut");
    if (text.includes("strawberry")) flavorPrefs.push("strawberry");
    if (text.includes("mango")) flavorPrefs.push("mango");
    if (text.includes("berry") || text.includes("blackberry")) flavorPrefs.push("berry");
    if (flavorPrefs.length > 0) {
      preferences.flavorPreferences = flavorPrefs;
    }

    // Category preference
    if (text.includes("smoothie")) {
      preferences.categoryPreference = "smoothie";
    } else if (text.includes("frappe")) {
      preferences.categoryPreference = "frappe";
    } else if (text.includes("cold brew")) {
      preferences.categoryPreference = "cold-coffee";
    } else if (text.includes("latte") || text.includes("espresso")) {
      preferences.categoryPreference = "hot-coffee";
    } else if (text.includes("matcha")) {
      preferences.categoryPreference = "matcha";
    }

    return {
      preferences,
      intentSummary: `Customer requested a ${preferences.temperature || "curated"} drink with ${flavorPrefs.join(", ") || "signature"} notes.`,
    };
  }

  async generateExplanation(
    product: ProductDoc,
    preferences: BaristaPreferences,
    config: DrinkConfiguration,
    dna: DrinkDna,
    intent?: BaristaIntent
  ): Promise<string> {
    if (intent === "cheapest") {
      return `At just ₹${product.basePrice}, ${product.name} is the most affordable specialty drink on our menu while preserving rich ${product.tasteNotes.join(" & ")} flavor.`;
    }

    if (intent === "most_expensive") {
      return `Our most indulgent, top-tier craft creation at ₹${product.basePrice}, celebrated for its ${product.tasteNotes.join(" and ")} profile.`;
    }

    if (intent === "budget") {
      return `Priced at ₹${product.basePrice}, ${product.name} fits comfortably under your spending target.`;
    }

    if (intent === "random") {
      return `A curated surprise from our café kitchen: ${product.name} blends ${product.tasteNotes.join(", ")} for an unexpected delight!`;
    }

    if (intent === "ingredient") {
      return `${product.name} highlights your requested flavor profile, infused with ${product.tasteNotes.join(", ")}.`;
    }

    const reasons: string[] = [];

    if (preferences.temperature) {
      reasons.push(
        product.temperatureProfile.toLowerCase() === preferences.temperature
          ? `Its ${product.temperatureProfile.toLowerCase()} profile gives you the exact temperature you wanted.`
          : `Crafted as an iced classic to keep you refreshed.`
      );
    }

    if (config.milkId === "oat-milk") {
      reasons.push("Steamed/poured with oat milk for a rich, silky plant-based body.");
    } else if (config.milkId === "almond-milk") {
      reasons.push("Blended with almond milk for a lighter, nutty finish.");
    }

    if (config.flavorId !== "flavor-none") {
      reasons.push(`Enhanced with ${config.flavorId} to match your sweet cravings without overpowering the brew.`);
    }

    if (dna.strength >= 70) {
      reasons.push("Provides the robust, coffee-forward punch you need.");
    } else if (dna.sweetness <= 35) {
      reasons.push("Calibrated with restrained sweetness so the natural bean notes shine.");
    }

    return reasons.length > 0
      ? reasons.join(" ")
      : `${product.name} is one of our signature favorites, perfectly balanced with ${product.tasteNotes.join(", ")}.`;
  }

  async generateIntentResponse(
    intent: BaristaIntent,
    context: {
      message: string;
      products: ProductDoc[];
      preferences: BaristaPreferences;
      extra?: Record<string, unknown>;
    }
  ): Promise<string> {
    const { products, extra } = context;

    switch (intent) {
      case "cheapest": {
        const top = products[0];
        if (!top) return "No drinks found in that category.";
        return `The most affordable coffee on our current menu is our ${top.name} at ₹${top.basePrice}.`;
      }

      case "most_expensive": {
        const top = products[0];
        if (!top) return "No drinks found.";
        return `Our most premium, handcrafted specialty is the ${top.name} at ₹${top.basePrice}.`;
      }

      case "budget": {
        const budget = context.preferences.budget || 200;
        if (products.length === 0) {
          return `We don't currently have items under ₹${budget}, but our lowest-priced drink starts at ₹180.`;
        }
        const names = products.map((p) => `${p.name} (₹${p.basePrice})`).join(", ");
        return `You've got ${products.length} delicious option${products.length > 1 ? "s" : ""} under ₹${budget}: ${names}.`;
      }

      case "category": {
        const cat = context.preferences.category || "coffee";
        return `Here are our handcrafted ${cat} options ready to order:`;
      }

      case "ingredient": {
        const ing = context.preferences.flavor || "your selected ingredient";
        return `Here are our drinks featuring ${ing}:`;
      }

      case "compare": {
        const comp = extra?.comparison as { productA: ProductDoc; productB: ProductDoc; highlights: string[] } | undefined;
        if (comp) {
          return `Here is how ${comp.productA.name} (₹${comp.productA.basePrice}) and ${comp.productB.name} (₹${comp.productB.basePrice}) compare: ${comp.highlights.join(" ")}`;
        }
        return `Comparing your selected drinks side-by-side:`;
      }

      case "details": {
        const prod = products[0];
        if (!prod) return "I couldn't find details on that specific drink.";
        return `${prod.name} (₹${prod.basePrice}) is our ${prod.categoryLabel} specialty. ${prod.description} It delivers ${prod.tasteNotes.join(", ")} served ${prod.temperatureProfile.toLowerCase()}.`;
      }

      case "availability": {
        return `We currently have ${products.length} signature drinks freshly available on our café menu:`;
      }

      case "pairing": {
        const prod = products[0];
        return `For your ${prod?.name || "beverage"}, our chef recommends these artisan café pairings:`;
      }

      case "random": {
        const prod = products[0];
        return `Surprise! Today's barista spotlight is our ${prod?.name || "specialty creation"} (₹${prod?.basePrice}).`;
      }

      default:
        return "I've crafted a personalized recommendation tailored to your taste:";
    }
  }
}
