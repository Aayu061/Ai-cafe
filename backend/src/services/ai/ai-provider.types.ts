import { DrinkConfiguration, DrinkDna, ProductDoc } from "../../types/catalog";

export type BaristaRole = "user" | "assistant";

export interface BaristaMessage {
  role: BaristaRole;
  content: string;
}

export interface BaristaPreferences {
  temperature?: "hot" | "cold" | "blended";
  sweetness?: number; // 0 - 100
  strength?: number; // 0 - 100 (caffeine / boldness)
  creaminess?: number; // 0 - 100
  chill?: number; // 0 - 100
  richness?: number; // 0 - 100
  flavorPreferences?: string[];
  flavorAvoidances?: string[];
  milkPreference?: string;
  basePreference?: string;
  categoryPreference?: string;
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
  preferences: BaristaPreferences;
  intentSummary: string;
  suggestedProductId?: string;
  suggestedCustomizations?: Partial<DrinkConfiguration>;
}

export interface BaristaRecommendation {
  product: {
    id: string;
    slug: string;
    name: string;
    categoryLabel: string;
    description: string;
    image: string;
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

export interface BaristaRecommendResponse {
  success: boolean;
  message: string;
  preferences: BaristaPreferences;
  recommendations: BaristaRecommendation[];
  followUpSuggestion?: string;
}

export interface AiProvider {
  readonly name: string;
  extractPreferences(
    message: string,
    history: BaristaMessage[],
    catalogContext: SafeCatalogContext
  ): Promise<BaristaExtractionResult>;
  generateExplanation(
    product: ProductDoc,
    preferences: BaristaPreferences,
    config: DrinkConfiguration,
    dna: DrinkDna
  ): Promise<string>;
}
