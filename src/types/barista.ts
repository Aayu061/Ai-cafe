/**
 * AI CAFÉ — AI Barista Frontend Types
 * Synchronized with backend Barista recommendations, intent engine, and Drink DNA.
 */

export type BaristaRole = "user" | "assistant";

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
  flavor?: string;
  flavorPreferences?: string[];
  flavorAvoidances?: string[];
  milk?: string;
  milkPreference?: string;
  basePreference?: string;
  category?: string;
  categoryPreference?: string;
  budget?: number;
}

export interface BaristaProductSummary {
  id: string;
  slug: string;
  name: string;
  categoryLabel: string;
  description: string;
  image: string;
  available?: boolean;
  basePrice?: number;
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

export interface BaristaComparisonItem {
  productA: BaristaProductSummary & { basePrice: number; temperatureProfile?: string; tasteNotes?: string[] };
  productB: BaristaProductSummary & { basePrice: number; temperatureProfile?: string; tasteNotes?: string[] };
  highlights: string[];
  priceDifference: number;
}

export interface BaristaPairingItem {
  name: string;
  category: "pastry" | "cookie" | "cake" | "savory";
  description: string;
  whyItWorks: string;
  pairingPrice?: number;
}

export interface BaristaConversationMessage {
  role: BaristaRole;
  content: string;
  intent?: BaristaIntent;
  recommendations?: BaristaRecommendation[];
  comparison?: BaristaComparisonItem;
  productDetails?: BaristaProductSummary & { tasteNotes?: string[]; calories?: number };
  pairings?: BaristaPairingItem[];
  preferences?: BaristaPreferences;
  followUpSuggestion?: string;
  timestamp?: number;
}

export interface BaristaRecommendResponse {
  success: boolean;
  intent?: BaristaIntent;
  message: string;
  preferences: BaristaPreferences;
  recommendations: BaristaRecommendation[];
  comparison?: BaristaComparisonItem;
  productDetails?: BaristaProductSummary & { tasteNotes?: string[]; calories?: number };
  pairings?: BaristaPairingItem[];
  followUpSuggestion?: string;
  error?: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}
