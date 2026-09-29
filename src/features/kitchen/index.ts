/**
 * Phase 8 Extension Point: Kitchen Queue & Operational Fulfillment
 * Barista / kitchen display system (KDS) interfaces.
 */

export interface KitchenQueueTicket {
  ticketId: string;
  orderId: string;
  station: "espresso" | "cold-brew" | "blended" | "bakery";
  drinkName: string;
  customizationSummary: string[];
  priority: "normal" | "rush";
  receivedAt: string;
}
