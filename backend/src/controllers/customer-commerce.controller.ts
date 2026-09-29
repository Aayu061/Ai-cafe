import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { catalogService } from "../services/catalog.service";
import { DrinkConfiguration, ProductDoc } from "../types/catalog";

export interface SavedDrinkItem {
  id: string;
  name: string;
  configuration: DrinkConfiguration;
  serverPrice: number;
  notes?: string;
  createdAt: string;
}

/**
 * GET /api/favorites
 * Returns array of favorite ProductDoc items for authenticated customer.
 */
export async function getFavorites(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const profile = await userService.getUserProfile(req.user.uid);
    const favoriteIds: string[] = profile?.favorites || [];

    const products = await Promise.all(
      favoriteIds.map((id) => catalogService.getProductByIdOrSlug(id))
    );
    const validProducts = products.filter((p): p is ProductDoc => p !== null);

    res.status(200).json({
      success: true,
      count: validProducts.length,
      favorites: validProducts,
      favoriteIds,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/favorites/:productId
 * Adds a product to customer's favorites.
 */
export async function addFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const rawProdId = req.params.productId;
    const productId = String(Array.isArray(rawProdId) ? rawProdId[0] : rawProdId);
    const product = await catalogService.getProductByIdOrSlug(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: `Product "${productId}" not found.` },
      });
      return;
    }

    const profile = await userService.getUserProfile(req.user.uid);
    const existing = new Set(profile?.favorites || []);
    existing.add(productId);
    const updatedFavorites = Array.from(existing);

    await userService.updateUserProfile(req.user.uid, { favorites: updatedFavorites });

    res.status(200).json({
      success: true,
      message: `Added "${product.name}" to favorites.`,
      favorites: updatedFavorites,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/favorites/:productId
 * Removes a product from customer's favorites.
 */
export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const rawProdId = req.params.productId;
    const productId = String(Array.isArray(rawProdId) ? rawProdId[0] : rawProdId);
    const profile = await userService.getUserProfile(req.user.uid);
    const updatedFavorites = (profile?.favorites || []).filter((id) => id !== productId);

    await userService.updateUserProfile(req.user.uid, { favorites: updatedFavorites });

    res.status(200).json({
      success: true,
      message: `Removed "${productId}" from favorites.`,
      favorites: updatedFavorites,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/saved-drinks
 * Returns customer's custom drink creations with server-recalculated current price.
 */
export async function getSavedDrinks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const profile = await userService.getUserProfile(req.user.uid);
    const rawCreations: any[] = profile?.savedCreations || [];

    // Recalculate current authoritative server price for each creation
    const validatedCreations = await Promise.all(
      rawCreations.map(async (creation) => {
        if (!creation.configuration) return null;
        const validation = await catalogService.validateDrinkConfiguration(creation.configuration);
        return {
          id: creation.id,
          name: creation.name || "Custom Drink",
          configuration: creation.configuration,
          serverPrice: validation.finalPrice,
          basePrice: validation.basePrice,
          customizationTotal: validation.customizationTotal,
          isValid: validation.valid,
          notes: creation.notes || "",
          createdAt: creation.createdAt || new Date().toISOString(),
        };
      })
    );

    const validCreations = validatedCreations.filter((c) => c !== null);

    res.status(200).json({
      success: true,
      count: validCreations.length,
      savedDrinks: validCreations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/saved-drinks
 * Saves a customer custom drink creation after validating with recipe pricing engine.
 */
export async function saveDrink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const { name, configuration, notes } = req.body;
    if (!configuration || !configuration.productId || !configuration.baseId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_CONFIGURATION", message: "Valid drink configuration is required." },
      });
      return;
    }

    // 100% Server Authoritative Validation
    const validation = await catalogService.validateDrinkConfiguration(configuration);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: `Drink validation failed: ${(validation.errors || []).join(", ")}`,
        },
      });
      return;
    }

    const id = `saved-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCreation: SavedDrinkItem = {
      id,
      name: (name || "My Custom Creation").trim(),
      configuration,
      serverPrice: validation.finalPrice,
      notes: notes ? String(notes).slice(0, 200) : undefined,
      createdAt: new Date().toISOString(),
    };

    const profile = await userService.getUserProfile(req.user.uid);
    const existingCreations = profile?.savedCreations || [];
    const updatedCreations = [newCreation, ...existingCreations];

    await userService.updateUserProfile(req.user.uid, { savedCreations: updatedCreations });

    res.status(201).json({
      success: true,
      message: "Custom drink saved to your café profile.",
      savedDrink: newCreation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/saved-drinks/:id
 * Removes a saved custom drink from customer's profile.
 */
export async function deleteSavedDrink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
      return;
    }

    const rawId = req.params.id;
    const id = String(Array.isArray(rawId) ? rawId[0] : rawId);
    const profile = await userService.getUserProfile(req.user.uid);
    const existingCreations = profile?.savedCreations || [];
    const updatedCreations = existingCreations.filter((c: any) => c.id !== id);

    await userService.updateUserProfile(req.user.uid, { savedCreations: updatedCreations });

    res.status(200).json({
      success: true,
      message: "Saved drink removed.",
    });
  } catch (error) {
    next(error);
  }
}
