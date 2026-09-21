export type ProductCategory =
  | "cold-coffee"
  | "frappe"
  | "creamy"
  | "smoothie"
  | "matcha"
  | "hot-coffee";

export interface DrinkConfiguration {
  productId: string;
  baseId: string;
  milkId: string;
  flavorId: string;
  sweetnessId: string;
  iceId: string;
  toppingIds: string[];
  sizeId: string;
}

export interface DrinkDna {
  sweetness: number; // 0 - 100
  strength: number; // 0 - 100
  creaminess: number; // 0 - 100
  chill: number; // 0 - 100
  richness: number; // 0 - 100
}

export interface ProductDoc {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  categoryLabel: string;
  basePrice: number;
  currency: "INR";
  image: string;
  available: boolean;
  featured: boolean;
  tags: string[];
  tasteNotes: string[];
  calories: number;
  sweetnessProfile: number;
  strengthProfile: number;
  textureProfile: string;
  temperatureProfile: "Iced" | "Hot" | "Blended";
  defaultConfiguration: DrinkConfiguration;
  createdAt: string;
  updatedAt: string;
}

export type IngredientType =
  | "base"
  | "milk"
  | "flavor"
  | "sweetness"
  | "ice"
  | "topping"
  | "size";

export interface IngredientDoc {
  id: string;
  name: string;
  type: IngredientType;
  priceDelta: number; // in INR (₹)
  available: boolean;
  metadata?: {
    caloriesDelta?: number;
    description?: string;
    sweetnessScore?: number;
    strengthScore?: number;
    creaminessScore?: number;
    chillScore?: number;
    richnessScore?: number;
    [key: string]: unknown;
  };
}

export interface DrinkValidationResult {
  valid: boolean;
  currency: "INR";
  basePrice: number;
  customizationTotal: number;
  finalPrice: number;
  productName?: string;
  configuration: DrinkConfiguration;
  drinkDna: DrinkDna;
  errors?: string[];
}
