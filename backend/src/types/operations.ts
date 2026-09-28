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
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
