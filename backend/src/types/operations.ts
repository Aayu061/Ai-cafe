/**
 * AI CAFÉ — Operations Domain Types (Inventory, Recipes, Audit & Orders)
 */

import { UserRole } from "./roles";

export type InventoryUnit = "ml" | "g" | "kg" | "l" | "pcs";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  name: string;
  ingredientId: string;
  quantity: number;
  unit: InventoryUnit;
  reorderThreshold: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType =
  | "purchase"
  | "adjustment"
  | "waste"
  | "correction"
  | "order_consumption";

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: InventoryMovementType;
  quantity: number;
  unit: InventoryUnit;
  reason: string;
  referenceId?: string;
  createdBy: string; // Actor UID
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
  createdAt: string;
  updatedAt: string;
}

export type AuditResourceType = "product" | "inventory" | "order" | "staff" | "customer" | "system" | "admin" | "super_admin";

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: AuditResourceType;
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export type PaymentStatus = "unpaid" | "processing" | "paid" | "failed" | "refunded";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  configurationSummary: string;
}

export interface OrderDoc {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  paymentOrderId?: string;
  paymentTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Phase 8 Smart Cart Interface Contracts
 */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  recipeConfiguration?: Record<string, unknown>;
  configurationSummary: string;
}

export interface CartDoc {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  updatedAt: string;
}

/**
 * Server-authoritative contract for Phase 8 payment gateway handshake
 */
export interface ServerPriceVerificationContract {
  orderId: string;
  userId: string;
  serverCalculatedAmount: number;
  currency: "INR";
  verificationHash: string;
  timestamp: string;
}
