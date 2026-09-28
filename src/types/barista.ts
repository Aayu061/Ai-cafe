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

export type BaristaResponseMode =
  | "GREETING"
  | "CONVERSATION"
  | "CATALOG_QUERY"
  | "RECOMMENDATION"
  | "COMPARISON"
  | "DETAILS"
  | "PAIRING"
  | "CUSTOMIZATION"
  | "BUDGET_COMBO";

export type BaristaMoodContext =
  | "REFRESH"
  | "FOCUS"
  | "CHILL"
  | "COMFORT"
  | "INDULGE"
  | "ENERGIZE"
  | "EXPLORE";

export interface CafeMomentCombo {
  title: string;
  drink: {
    id: string;
    name: string;
    price: number;
    categoryLabel: string;
    image: string;
  };
  snack: {
    name: string;
    category: "pastry" | "cookie" | "cake" | "savory";
    price: number;
    description: string;
    whyItWorks: string;
  };
  dessert?: {
    name: string;
    category: "pastry" | "cookie" | "cake" | "savory";
    price: number;
    description: string;
    whyItWorks: string;
  };
  totalPrice: number;
  budgetLimit?: number;
}

export interface BaristaCatalogProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  image: string;
  basePrice: number;
  available: boolean;
  temperatureProfile: "Iced" | "Hot" | "Blended";
  tasteNotes: string[];
  featured?: boolean;
}

export interface BaristaReferenceResolution {
  resolvedProductId?: string;
  resolvedProductName?: string;
  resolvedIndex?: number;
  action?: "modify" | "reject" | "switch" | "inquire";
}

export interface BaristaConversationMessage {
  role: BaristaRole;
  content: string;
  mode?: BaristaResponseMode;
  intent?: BaristaIntent;
  recommendations?: BaristaRecommendation[];
  catalogProducts?: BaristaCatalogProduct[];
  comparison?: BaristaComparisonItem;
  productDetails?: BaristaProductSummary & { tasteNotes?: string[]; calories?: number; temperatureProfile?: string; available?: boolean };
  pairings?: BaristaPairingItem[];
  cafeMoment?: CafeMomentCombo;
  preferences?: BaristaPreferences;
  moodContext?: BaristaMoodContext;
  budget?: number;
  totalPrice?: number;
  followUpSuggestion?: string;
  timestamp?: number;
}

export interface BaristaRecommendResponse {
  success: boolean;
  mode?: BaristaResponseMode;
  intent?: BaristaIntent;
  message: string;
  preferences: BaristaPreferences;
  moodContext?: BaristaMoodContext;
  activeProductId?: string;
  recommendations: BaristaRecommendation[];
  catalogProducts?: BaristaCatalogProduct[];
  comparison?: BaristaComparisonItem;
  productDetails?: BaristaProductSummary & { tasteNotes?: string[]; calories?: number; temperatureProfile?: string; available?: boolean };
  pairings?: BaristaPairingItem[];
  cafeMoment?: CafeMomentCombo;
  budget?: number;
  totalPrice?: number;
  references?: BaristaReferenceResolution;
  actions?: Array<{ label: string; action: string; payload?: unknown }>;
  followUpSuggestion?: string;
  error?: {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
}
