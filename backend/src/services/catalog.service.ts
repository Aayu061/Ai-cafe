import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS } from "../scripts/seed-data";
import {
  ProductDoc,
  IngredientDoc,
  DrinkConfiguration,
  DrinkValidationResult,
  DrinkDna,
} from "../types/catalog";

export class CatalogService {
  /**
   * Reads products from Cloud Firestore when configured, or INITIAL_PRODUCTS for local dev.
   */
  async getProducts(category?: string, featured?: boolean): Promise<ProductDoc[]> {
    if (!isFirebaseAdminConfigured()) {
      let prods = INITIAL_PRODUCTS;
      if (category) prods = prods.filter((p) => p.category === category);
      if (typeof featured === "boolean") prods = prods.filter((p) => p.featured === featured);
      return prods;
    }

    const db = getFirebaseAdminDb();
    let query: FirebaseFirestore.Query = db.collection("products");

    if (category) {
      query = query.where("category", "==", category);
    }
    if (typeof featured === "boolean") {
      query = query.where("featured", "==", featured);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as ProductDoc);
  }

  /**
   * Retrieves a single product by ID or slug from Cloud Firestore or local seed catalog.
   */
  async getProductByIdOrSlug(idOrSlug: string): Promise<ProductDoc | null> {
    if (!isFirebaseAdminConfigured()) {
      return (
        INITIAL_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null
      );
    }

    const db = getFirebaseAdminDb();

    // 1. Check by Document ID
    const docRef = db.collection("products").doc(idOrSlug);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as ProductDoc;
    }

    // 2. Query by slug
    const querySnap = await db
      .collection("products")
      .where("slug", "==", idOrSlug)
      .limit(1)
      .get();

    if (!querySnap.empty && querySnap.docs[0]) {
      return querySnap.docs[0].data() as ProductDoc;
    }

    return null;
  }

  /**
   * Reads ingredients from Cloud Firestore when configured, or INITIAL_INGREDIENTS for local dev.
   */
  async getIngredients(type?: string): Promise<IngredientDoc[]> {
    if (!isFirebaseAdminConfigured()) {
      if (type) return INITIAL_INGREDIENTS.filter((i) => i.type === type);
      return INITIAL_INGREDIENTS;
    }

    const db = getFirebaseAdminDb();
    let query: FirebaseFirestore.Query = db.collection("ingredients");

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as IngredientDoc);
  }

  /**
   * Validates a drink configuration, verifies all component existence and availability,
   * enforces beverage consistency rules, and computes authoritative server-side pricing.
   */
  async validateDrinkConfiguration(
    config: DrinkConfiguration
  ): Promise<DrinkValidationResult> {
    const errors: string[] = [];

    // 1. Fetch Product
    const product = await this.getProductByIdOrSlug(config.productId);
    if (!product) {
      return {
        valid: false,
        currency: "INR",
        basePrice: 0,
        customizationTotal: 0,
        finalPrice: 0,
        configuration: config,
        drinkDna: { sweetness: 0, strength: 0, creaminess: 0, chill: 0, richness: 0 },
        errors: [`Product with ID "${config.productId}" was not found in catalog.`],
      };
    }

    if (!product.available) {
      errors.push(`Product "${product.name}" is currently unavailable.`);
    }

    // 2. Fetch All Selected Ingredients
    const requiredIds = [
      config.baseId,
      config.milkId,
      config.flavorId,
      config.sweetnessId,
      config.iceId,
      config.sizeId,
      ...config.toppingIds,
    ];

    const ingredientMap = new Map<string, IngredientDoc>();

    if (isFirebaseAdminConfigured()) {
      const db = getFirebaseAdminDb();
      const ingredientsCol = db.collection("ingredients");
      const uniqueIds = Array.from(new Set(requiredIds));
      const ingredientSnaps = await Promise.all(
        uniqueIds.map((id) => ingredientsCol.doc(id).get())
      );
      ingredientSnaps.forEach((snap, idx) => {
        const targetId = uniqueIds[idx];
        if (snap.exists && targetId) {
          ingredientMap.set(targetId, snap.data() as IngredientDoc);
        }
      });
    } else {
      INITIAL_INGREDIENTS.forEach((ing) => {
        ingredientMap.set(ing.id, ing);
      });
    }

    // 3. Verify Base
    const base = ingredientMap.get(config.baseId);
    if (!base) {
      errors.push(`Invalid or missing Base ID: "${config.baseId}".`);
    } else if (base.type !== "base") {
      errors.push(`Item "${config.baseId}" is not a valid base ingredient.`);
    } else if (!base.available) {
      errors.push(`Base "${base.name}" is currently out of stock.`);
    }

    // 4. Verify Milk
    const milk = ingredientMap.get(config.milkId);
    if (!milk) {
      errors.push(`Invalid or missing Milk ID: "${config.milkId}".`);
    } else if (milk.type !== "milk") {
      errors.push(`Item "${config.milkId}" is not a valid milk option.`);
    } else if (!milk.available) {
      errors.push(`Milk "${milk.name}" is currently out of stock.`);
    }

    // 5. Verify Flavor
    const flavor = ingredientMap.get(config.flavorId);
    if (!flavor) {
      errors.push(`Invalid or missing Flavor ID: "${config.flavorId}".`);
    } else if (flavor.type !== "flavor") {
      errors.push(`Item "${config.flavorId}" is not a valid flavor option.`);
    } else if (!flavor.available) {
      errors.push(`Flavor "${flavor.name}" is currently out of stock.`);
    }

    // 6. Verify Sweetness
    const sweetness = ingredientMap.get(config.sweetnessId);
    if (!sweetness) {
      errors.push(`Invalid or missing Sweetness ID: "${config.sweetnessId}".`);
    } else if (sweetness.type !== "sweetness") {
      errors.push(`Item "${config.sweetnessId}" is not a valid sweetness level.`);
    }

    // 7. Verify Ice
    const ice = ingredientMap.get(config.iceId);
    if (!ice) {
      errors.push(`Invalid or missing Ice ID: "${config.iceId}".`);
    } else if (ice.type !== "ice") {
      errors.push(`Item "${config.iceId}" is not a valid ice level.`);
    }

    // Temperature Compatibility Rules
    if (product.temperatureProfile === "Hot" && config.iceId !== "no-ice") {
      errors.push(`Hot beverage "${product.name}" cannot be ordered with ice.`);
    }
    if (product.temperatureProfile === "Blended" && config.iceId === "no-ice") {
      errors.push(`Blended beverage "${product.name}" requires ice to prepare.`);
    }

    // 8. Verify Size
    const size = ingredientMap.get(config.sizeId);
    if (!size) {
      errors.push(`Invalid or missing Size ID: "${config.sizeId}".`);
    } else if (size.type !== "size") {
      errors.push(`Item "${config.sizeId}" is not a valid drink size.`);
    }

    // 9. Verify Toppings
    const validatedToppings: IngredientDoc[] = [];
    for (const toppingId of config.toppingIds) {
      const topping = ingredientMap.get(toppingId);
      if (!topping) {
        errors.push(`Invalid topping ID: "${toppingId}".`);
      } else if (topping.type !== "topping") {
        errors.push(`Item "${toppingId}" is not a valid topping.`);
      } else if (!topping.available) {
        errors.push(`Topping "${topping.name}" is currently out of stock.`);
      } else {
        validatedToppings.push(topping);
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        currency: "INR",
        basePrice: product.basePrice,
        customizationTotal: 0,
        finalPrice: product.basePrice,
        productName: product.name,
        configuration: config,
        drinkDna: { sweetness: 0, strength: 0, creaminess: 0, chill: 0, richness: 0 },
        errors,
      };
    }

    // 10. Authoritative Price Calculation (Server-Controlled)
    let customizationTotal = 0;
    if (base) customizationTotal += base.priceDelta;
    if (milk) customizationTotal += milk.priceDelta;
    if (flavor) customizationTotal += flavor.priceDelta;
    if (size) customizationTotal += size.priceDelta;
    for (const topping of validatedToppings) {
      customizationTotal += topping.priceDelta;
    }

    const finalPrice = Math.max(0, product.basePrice + customizationTotal);

    // 11. Deterministic Drink DNA Sensory Scores (0 - 100)
    // Combines product base profile with selected ingredient adjustments
    const baseSweet = product.sweetnessProfile || 50;
    const sweetnessModifier = (sweetness?.metadata?.sweetnessScore as number) ?? 50;
    const flavorSweet = (flavor?.metadata?.sweetnessScore as number) ?? 0;
    const finalSweetness = Math.min(100, Math.round(baseSweet * 0.4 + sweetnessModifier * 0.4 + flavorSweet * 0.6));

    const baseStrength = product.strengthProfile || 50;
    const baseStrengthScore = (base?.metadata?.strengthScore as number) ?? 50;
    const finalStrength = Math.min(100, Math.round(baseStrength * 0.5 + baseStrengthScore * 0.5));

    const milkCreaminess = (milk?.metadata?.creaminessScore as number) ?? 50;
    const toppingCreaminess = validatedToppings.reduce(
      (acc, t) => acc + ((t.metadata?.creaminessScore as number) ?? 0),
      0
    );
    const finalCreaminess = Math.min(100, Math.round(milkCreaminess * 0.7 + toppingCreaminess * 0.5));

    const iceChillScore = (ice?.metadata?.chillScore as number) ?? (product.temperatureProfile === "Hot" ? 0 : 70);
    const finalChill = product.temperatureProfile === "Hot" ? 0 : Math.min(100, iceChillScore);

    const baseRichness = (base?.metadata?.richnessScore as number) ?? 50;
    const milkRichness = (milk?.metadata?.richnessScore as number) ?? 50;
    const flavorRichness = (flavor?.metadata?.richnessScore as number) ?? 0;
    const toppingRichness = validatedToppings.reduce(
      (acc, t) => acc + ((t.metadata?.richnessScore as number) ?? 0),
      0
    );
    const finalRichness = Math.min(
      100,
      Math.round(baseRichness * 0.3 + milkRichness * 0.3 + flavorRichness * 0.4 + toppingRichness * 0.4)
    );

    const drinkDna: DrinkDna = {
      sweetness: finalSweetness,
      strength: finalStrength,
      creaminess: finalCreaminess,
      chill: finalChill,
      richness: finalRichness,
    };

    // 12. Normalized configuration with sorted topping IDs
    const normalizedConfig: DrinkConfiguration = {
      productId: product.id,
      baseId: config.baseId,
      milkId: config.milkId,
      flavorId: config.flavorId,
      sweetnessId: config.sweetnessId,
      iceId: config.iceId,
      toppingIds: [...config.toppingIds].sort(),
      sizeId: config.sizeId,
    };

    return {
      valid: true,
      currency: "INR",
      basePrice: product.basePrice,
      customizationTotal,
      finalPrice,
      productName: product.name,
      configuration: normalizedConfig,
      drinkDna,
    };
  }
}

export const catalogService = new CatalogService();
