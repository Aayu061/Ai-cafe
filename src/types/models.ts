/**
 * AI CAFÉ — Cloud Firestore Domain Data Models
 * Clean, extensible interfaces for future application phases.
 */

export type UserRole = "customer" | "staff" | "admin" | "super_admin";
export type UserStatus = "active" | "suspended";

export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: string; // ISO 8601 string or Timestamp
  updatedAt: string;
  lastLoginAt?: string;
  role: UserRole;
  status?: UserStatus;
  permissions?: string[];
  tasteProfile?: {
    favoriteBases?: string[];
    preferredMilk?: string;
    sweetnessPreference?: number;
    preferredTemperature?: "hot" | "cold" | "blended";
  };
  preferences?: {
    favoriteBases?: string[];
    preferredMilk?: string;
    sweetnessPreference?: number;
  };
  favorites?: string[];
  savedCreations?: Array<{
    id: string;
    name: string;
    base: string;
    milk: string;
    sweetness: number;
    flavor?: string;
    createdAt: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  category: "cold-brew" | "frappe" | "espresso" | "tea" | "smoothie";
  categoryLabel: string;
  description: string;
  basePrice: number;
  calories: number;
  temperature: "Iced" | "Hot" | "Blended";
  tasteNotes: string[];
  image: string;
  isAvailable: boolean;
  featured?: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  type: "base" | "milk" | "syrup" | "foam" | "topping";
  extraCost: number;
  inStock: boolean;
  caloriesPerServing: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customization: {
    base: string;
    milk: string;
    sweetness: number;
    flavor: string;
    foam: string;
    topping: string;
    iceLevel: string;
  };
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "brewing"
  | "ready"
  | "completed"
  | "cancelled"
  | "new"
  | "preparing";

export type OrderDoc = Order;

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationSummary: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  customizationId?: string;
  createdAt: string;
}

export type InventoryUnit = "ml" | "g" | "kg" | "l" | "pcs";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";
export type InventoryMovementType = "purchase" | "adjustment" | "waste" | "correction" | "order_consumption";

export interface InventoryItem {
  id: string;
  name: string;
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
  reorderThreshold: number;
  status: InventoryStatus;
  createdAt?: string;
  updatedAt?: string;
  lastRestocked?: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: InventoryMovementType;
  quantity: number;
  unit: InventoryUnit;
  reason: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
}

export interface Recipe {
  id: string;
  productId: string;
  ingredients: RecipeIngredient[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  userId?: string;
  userPrompt: string;
  recommendedDrinkId: string;
  recommendedDrinkName: string;
  flavorMatchScore: number;
  reasoning: string;
  suggestedCustomization?: {
    base: string;
    milk: string;
    sweetness: number;
  };
  createdAt: string;
}
