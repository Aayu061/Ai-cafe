/**
 * Phase 8 Extension Point: Smart Cart
 * Server-authoritative cart management interfaces.
 */

export interface CartItemOption {
  optionId: string;
  name: string;
  priceDelta: number;
}

export interface ClientCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  options: Record<string, string>;
  customizations?: {
    sweetness?: string;
    temperature?: string;
    milk?: string;
    flavor?: string;
    size?: string;
  };
  serverVerifiedUnitPrice: number;
  totalPrice: number;
}
