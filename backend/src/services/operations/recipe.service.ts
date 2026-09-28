import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../../config/firebase-admin";
import { Recipe, RecipeIngredient } from "../../types/operations";
import { UserRole } from "../../types/roles";
import { auditService } from "./audit.service";

const INITIAL_RECIPES: Recipe[] = [
  {
    id: "rec-caramel-cold-brew",
    productId: "caramel-cold-brew",
    ingredients: [
      { ingredientId: "cold-brew", quantity: 240, unit: "ml" },
      { ingredientId: "oat-milk", quantity: 60, unit: "ml" },
      { ingredientId: "caramel", quantity: 25, unit: "ml" },
      { ingredientId: "regular-ice", quantity: 120, unit: "g" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-vanilla-latte",
    productId: "vanilla-latte",
    ingredients: [
      { ingredientId: "espresso-shot", quantity: 60, unit: "ml" },
      { ingredientId: "whole-milk", quantity: 220, unit: "ml" },
      { ingredientId: "vanilla", quantity: 20, unit: "ml" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-chocolate-frappe",
    productId: "chocolate-frappe",
    ingredients: [
      { ingredientId: "frappe-mix", quantity: 150, unit: "ml" },
      { ingredientId: "chocolate", quantity: 30, unit: "g" },
      { ingredientId: "regular-ice", quantity: 150, unit: "g" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-matcha-cloud",
    productId: "matcha-cloud",
    ingredients: [
      { ingredientId: "matcha-base", quantity: 50, unit: "ml" },
      { ingredientId: "oat-milk", quantity: 200, unit: "ml" },
      { ingredientId: "regular-ice", quantity: 100, unit: "g" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class RecipeService {
  private memoryRecipes: Map<string, Recipe> = new Map();

  constructor() {
    INITIAL_RECIPES.forEach((rec) => {
      this.memoryRecipes.set(rec.productId, { ...rec });
    });
  }

  /**
   * Retrieves all recipes.
   */
  async getRecipes(): Promise<Recipe[]> {
    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        const snap = await db.collection("recipes").get();
        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as Recipe);
        }
      } catch (err) {
        console.warn("[RecipeService]: Firestore read failed, using memory:", (err as Error).message);
      }
    }
    return Array.from(this.memoryRecipes.values());
  }

  /**
   * Retrieves a recipe by product ID.
   */
  async getRecipeByProductId(productId: string): Promise<Recipe | null> {
    const all = await this.getRecipes();
    return all.find((r) => r.productId === productId) || null;
  }

  /**
   * Creates or updates a product recipe.
   */
  async saveRecipe(
    productId: string,
    ingredients: RecipeIngredient[],
    actorId: string,
    actorRole: UserRole
  ): Promise<Recipe> {
    const now = new Date().toISOString();
    const existing = await this.getRecipeByProductId(productId);
    const id = existing?.id || `rec-${productId}`;

    const recipe: Recipe = {
      id,
      productId,
      ingredients,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.memoryRecipes.set(productId, recipe);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("recipes").doc(id).set(recipe);
      } catch (err) {
        console.warn("[RecipeService]: Firestore save failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: existing ? "RECIPE_UPDATED" : "RECIPE_CREATED",
      resourceType: "product",
      resourceId: productId,
      metadata: { ingredientCount: ingredients.length },
    });

    return recipe;
  }
}

export const recipeService = new RecipeService();
