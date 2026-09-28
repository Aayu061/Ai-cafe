import { DrinkConfiguration, DrinkDna, ProductDoc } from "../../types/catalog";

export type BaristaRole = "user" | "assistant";

export interface BaristaMessage {
  role: BaristaRole;
  content: string;
}

export type BaristaIntent =
  | "recommend"
  | "cheapest"
  | "most_expensive"
  | "random"
  | "category"
  | "budget"
  | "ingredient"
  | "compare"
  | "customize"
  | "details"
  | "availability"
  | "pairing";

export interface BaristaPreferences {
  temperature?: "hot" | "cold" | "blended";
  sweetness?: number; // 0 - 100
  strength?: number; // 0 - 100 (caffeine / boldness)
  creaminess?: number; // 0 - 100
  chill?: number; // 0 - 100
  richness?: number; // 0 - 100
  flavor?: string;
  flavorPreferences?: string[];
  flavorAvoidances?: string[];
  milk?: string;
  milkPreference?: string;
  basePreference?: string;
  category?: string;
  categoryPreference?: string;
  budget?: number; // Max budget in INR
}

export interface CatalogContextItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  tasteNotes: string[];
  temperatureProfile: "Iced" | "Hot" | "Blended";
  sweetnessProfile: number;
  strengthProfile: number;
  textureProfile: string;
  basePrice: number;
}

export interface SafeCatalogContext {
  products: CatalogContextItem[];
  availableBases: string[];
  availableMilks: string[];
  availableFlavors: string[];
  availableSweetness: string[];
  availableIce: string[];
  availableToppings: string[];
  availableSizes: string[];
}

export interface BaristaExtractionResult {
  intent?: BaristaIntent;
  preferences: BaristaPreferences;
  intentSummary: string;
  suggestedProductId?: string;
  suggestedCustomizations?: Partial<DrinkConfiguration>;
  comparisonIds?: [string, string];
  targetIngredient?: string;
  targetCategory?: string;
  targetBudget?: number;
}

export interface BaristaRecommendation {
  product: {
    id: string;
    slug: string;
    name: string;
    categoryLabel: string;
    description: string;
    image: string;
    available?: boolean;
    basePrice?: number;
  };
  configuration: DrinkConfiguration;
  reason: string;
  drinkDna: DrinkDna;
  pricing: {
    currency: "INR";
    basePrice: number;
    customizationTotal: number;
    finalPrice: number;
  };
  matchScore?: number;
}

export interface BaristaComparisonItem {
  productA: ProductDoc;
  productB: ProductDoc;
  highlights: string[];
  priceDifference: number; // in INR
}

export interface BaristaPairingItem {
  name: string;
  category: "pastry" | "cookie" | "cake" | "savory";
  description: string;
  whyItWorks: string;
  pairingPrice?: number;
}

export interface BaristaRecommendResponse {
  success: boolean;
  intent: BaristaIntent;
  message: string;
  preferences: BaristaPreferences;
  recommendations: BaristaRecommendation[];
  comparison?: BaristaComparisonItem;
  productDetails?: ProductDoc;
  pairings?: BaristaPairingItem[];
  followUpSuggestion?: string;
}

export interface AiProvider {
  readonly name: string;
  extractPreferences(
    message: string,
    history: BaristaMessage[],
    catalogContext: SafeCatalogContext,
    previousPreferences?: BaristaPreferences
  ): Promise<BaristaExtractionResult>;
  generateExplanation(
    product: ProductDoc,
    preferences: BaristaPreferences,
    config: DrinkConfiguration,
    dna: DrinkDna,
    intent?: BaristaIntent
  ): Promise<string>;
  generateIntentResponse?(
    intent: BaristaIntent,
    context: {
      message: string;
      products: ProductDoc[];
      preferences: BaristaPreferences;
      extra?: Record<string, unknown>;
    }
  ): Promise<string>;
}
