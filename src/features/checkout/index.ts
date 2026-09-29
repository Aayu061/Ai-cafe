/**
 * Phase 8 Extension Point: Checkout Architecture
 * Pre-payment calculation, delivery/pickup selection, and order intent creation.
 */

export interface CheckoutSessionContract {
  sessionId: string;
  userId?: string;
  diningOption: "dine-in" | "takeaway" | "curbside";
  tableNumber?: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: "INR";
}
