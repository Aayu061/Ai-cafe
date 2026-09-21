/**
 * AI CAFÉ — AI Barista Frontend Types
 * Synchronized with backend Barista recommendations and Drink DNA engine.
 */

export type BaristaRole = "user" | "assistant";

export interface BaristaConversationMessage {
  role: BaristaRole;
  content: string;
  recommendations?: BaristaRecommendation[];
  preferences?: BaristaPreferences;
  followUpSuggestion?: string;
  timestamp?: number;
}

export interface DrinkDna {
  sweetness: number;
  strength: number;
  creaminess: number;
  chill: number;
  richness: number;
}

export interface BaristaPreferences {
  temperature?: "hot" | "cold" | "blended";
  sweetness?: number;
  strength?: number;
  creaminess?: number;
  chill?: number;
  richness?: number;
  flavorPreferences?: string[];
  flavorAvoidances?: string[];
  milkPreference?: string;
  basePreference?: string;
  categoryPreference?: string;
}

export interface BaristaProductSummary {
  id: string;
  slug: string;
  name: string;
  categoryLabel: string;
  description: string;
  image: string;
}

export interface BaristaConfiguration {
  productId: string;
  baseId: string;
  milkId: string;
  flavorId: string;
  sweetnessId: string;
  iceId: string;
  toppingIds: string[];
  sizeId: string;
}

export interface BaristaPricing {
  currency: "INR";
  basePrice: number;
  customizationTotal: number;
  finalPrice: number;
}

export interface BaristaRecommendation {
  product: BaristaProductSummary;
  configuration: BaristaConfiguration;
  reason: string;
  drinkDna: DrinkDna;
  pricing: BaristaPricing;
  matchScore?: number;
}

export interface BaristaRecommendResponse {
  success: boolean;
  message: string;
  preferences: BaristaPreferences;
  recommendations: BaristaRecommendation[];
  followUpSuggestion?: string;
  error?: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}
