import { Request, Response, NextFunction } from "express";
import { baristaService } from "../services/barista/barista.service";
import { recommendationRequestSchema } from "../validators/barista.schemas";

// Memory tracking for guest interaction count (keyed by session identifier or client IP)
const guestInteractionStore = new Map<string, number>();

export function getGuestInteractionCount(guestKey: string): number {
  return guestInteractionStore.get(guestKey) || 0;
}

export function resetGuestInteractionCount(guestKey?: string): void {
  if (guestKey) {
    guestInteractionStore.delete(guestKey);
  } else {
    guestInteractionStore.clear();
  }
}

export async function recommendDrink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = recommendationRequestSchema.parse(req.body);
    const authenticatedUserId = req.user?.uid;

    let guestKey = "";
    if (!authenticatedUserId) {
      guestKey =
        (req.headers["x-guest-session-id"] as string) ||
        (req.headers["x-test-guest-id"] as string) ||
        req.ip ||
        "guest_default";

      const currentCount = guestInteractionStore.get(guestKey) || 0;
      if (currentCount >= 3) {
        res.status(403).json({
          success: false,
          error: {
            code: "AI_LOGIN_REQUIRED",
            message: "You've had a taste. Sign in to keep exploring your café.",
          },
          guestInteractionsRemaining: 0,
        });
        return;
      }
    }

    const result = await baristaService.getRecommendation(
      input.message,
      input.conversation,
      input.preferences,
      input.recentProductIds,
      authenticatedUserId,
      input.activeProductId
    );

    // If guest and recommendation was successful, increment count
    if (!authenticatedUserId && guestKey && result.success) {
      const updated = (guestInteractionStore.get(guestKey) || 0) + 1;
      guestInteractionStore.set(guestKey, updated);
      (result as any).guestInteractionsRemaining = Math.max(0, 3 - updated);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const baristaController = {
  recommendDrink,
  getGuestInteractionCount,
  resetGuestInteractionCount,
};

