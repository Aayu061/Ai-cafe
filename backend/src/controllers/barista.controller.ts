import { Request, Response, NextFunction } from "express";
import { baristaService } from "../services/barista/barista.service";
import { recommendationRequestSchema } from "../validators/barista.schemas";

export async function recommendDrink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = recommendationRequestSchema.parse(req.body);
    const result = await baristaService.getRecommendation(input.message, input.conversation);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export const baristaController = {
  recommendDrink,
};
