import { Request, Response, NextFunction } from "express";
import { catalogService } from "../services/catalog.service";
import {
  productsQuerySchema,
  ingredientsQuerySchema,
  validateDrinkSchema,
} from "../validators/catalog.schemas";

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = productsQuerySchema.parse(req.query);
    const products = await catalogService.getProducts(query.category, query.featured);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PRODUCT_ID",
          message: "Product ID or slug is required.",
        },
      });
      return;
    }

    const product = await catalogService.getProductByIdOrSlug(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product "${id}" was not found in the catalog.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function getIngredients(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = ingredientsQuerySchema.parse(req.query);
    const ingredients = await catalogService.getIngredients(query.type);

    res.status(200).json({
      success: true,
      count: ingredients.length,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
}

export async function validateDrink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = validateDrinkSchema.parse(req.body);
    const result = await catalogService.validateDrinkConfiguration(input);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        ...result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
