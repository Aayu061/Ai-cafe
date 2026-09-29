/**
 * Phase 8 Extension Point: Orders & Customer Tracking
 * Real-time order state transition and live status stream.
 */

export type OrderStage = "placed" | "accepted" | "brewing" | "ready" | "completed" | "cancelled";

export interface OrderTrackingState {
  orderId: string;
  stage: OrderStage;
  estimatedMinutesRemaining: number;
  stageUpdatedAt: string;
  itemsSummary: string;
}
