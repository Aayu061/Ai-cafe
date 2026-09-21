import {
  AiProvider,
  BaristaExtractionResult,
  BaristaMessage,
  BaristaPreferences,
  SafeCatalogContext,
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
    dna: DrinkDna
  ): Promise<string> {
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
}
