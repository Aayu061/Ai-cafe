import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS } from "../scripts/seed-data";
import {
  ProductDoc,
  IngredientDoc,
  DrinkConfiguration,
  DrinkValidationResult,
  DrinkDna,
} from "../types/catalog";
import { UserRole } from "../types/roles";
import { auditService } from "./operations/audit.service";

export class CatalogService {
  private memoryProducts: ProductDoc[] = [...INITIAL_PRODUCTS];

  /**
   * Reads products from Cloud Firestore when configured, or INITIAL_PRODUCTS for local dev.
   */
  async getProducts(category?: string, featured?: boolean): Promise<ProductDoc[]> {
    if (!isFirebaseAdminConfigured()) {
      let prods = this.memoryProducts;
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
   * Finds the lowest-priced available product (optionally within a category).
   */
  async findCheapest(categoryKeyword?: string): Promise<ProductDoc | null> {
    const products = await this.getProducts();
    let available = products.filter((p) => p.available);
    if (categoryKeyword) {
      const kw = categoryKeyword.toLowerCase().trim();
      available = available.filter(
        (p) =>
          p.category.toLowerCase().includes(kw) ||
          p.categoryLabel.toLowerCase().includes(kw) ||
          p.tags.some((t) => t.toLowerCase().includes(kw)) ||
          (kw === "coffee" && (p.category === "cold-coffee" || p.category === "hot-coffee"))
      );
    }
    if (available.length === 0) return null;
    return available.sort((a, b) => a.basePrice - b.basePrice)[0] || null;
  }

  /**
   * Finds the highest-priced / most premium available product (optionally within a category).
   */
  async findMostExpensive(categoryKeyword?: string): Promise<ProductDoc | null> {
    const products = await this.getProducts();
    let available = products.filter((p) => p.available);
    if (categoryKeyword) {
      const kw = categoryKeyword.toLowerCase().trim();
      available = available.filter(
        (p) =>
          p.category.toLowerCase().includes(kw) ||
          p.categoryLabel.toLowerCase().includes(kw) ||
          p.tags.some((t) => t.toLowerCase().includes(kw)) ||
          (kw === "coffee" && (p.category === "cold-coffee" || p.category === "hot-coffee"))
      );
    }
    if (available.length === 0) return null;
    return available.sort((a, b) => b.basePrice - a.basePrice)[0] || null;
  }

  /**
   * Finds all available products within a max budget (sorted by price ascending).
   */
  async findWithinBudget(maxBudget: number, categoryKeyword?: string): Promise<ProductDoc[]> {
    const products = await this.getProducts();
    let available = products.filter((p) => p.available && p.basePrice <= maxBudget);
    if (categoryKeyword) {
      const kw = categoryKeyword.toLowerCase().trim();
      available = available.filter(
        (p) =>
          p.category.toLowerCase().includes(kw) ||
          p.categoryLabel.toLowerCase().includes(kw) ||
          p.tags.some((t) => t.toLowerCase().includes(kw)) ||
          (kw === "coffee" && (p.category === "cold-coffee" || p.category === "hot-coffee"))
      );
    }
    return available.sort((a, b) => a.basePrice - b.basePrice);
  }

  /**
   * Finds products matching a category name or related tag.
   */
  async findByCategory(categoryOrKeyword: string): Promise<ProductDoc[]> {
    const products = await this.getProducts();
    const kw = categoryOrKeyword.toLowerCase().trim();
    return products.filter((p) => {
      if (!p.available) return false;
      if (p.category.toLowerCase() === kw) return true;
      if (p.categoryLabel.toLowerCase().includes(kw)) return true;
      if (kw === "coffee" && (p.category === "cold-coffee" || p.category === "hot-coffee")) return true;
      if (kw === "tea" && (p.category === "matcha" || p.tags.some((t) => t.toLowerCase().includes("tea")))) return true;
      return p.tags.some((t) => t.toLowerCase().includes(kw));
    });
  }

  /**
   * Finds products containing or featuring a specific ingredient, flavor, milk, or taste note.
   */
  async findByIngredient(ingredientOrFlavor: string): Promise<ProductDoc[]> {
    const products = await this.getProducts();
    const query = ingredientOrFlavor.toLowerCase().trim();
    return products.filter((p) => {
      if (!p.available) return false;
      const config = p.defaultConfiguration;
      const matchesConfig =
        config.baseId.toLowerCase().includes(query) ||
        config.milkId.toLowerCase().includes(query) ||
        config.flavorId.toLowerCase().includes(query) ||
        config.toppingIds.some((t) => t.toLowerCase().includes(query));
      const matchesNotes = p.tasteNotes.some((n) => n.toLowerCase().includes(query));
      const matchesDesc = p.description.toLowerCase().includes(query);
      const matchesName = p.name.toLowerCase().includes(query);
      return matchesConfig || matchesNotes || matchesDesc || matchesName;
    });
  }

  /**
   * Finds all currently available products.
   */
  async findAvailable(): Promise<ProductDoc[]> {
    const products = await this.getProducts();
    return products.filter((p) => p.available);
  }

  /**
   * Compares two products side-by-side using actual authoritative catalog attributes.
   */
  async compareProducts(
    idOrSlugA: string,
    idOrSlugB: string
  ): Promise<{
    productA: ProductDoc;
    productB: ProductDoc;
    highlights: string[];
    priceDifference: number;
  } | null> {
    const [pA, pB] = await Promise.all([
      this.getProductByIdOrSlug(idOrSlugA),
      this.getProductByIdOrSlug(idOrSlugB),
    ]);

    if (!pA || !pB) return null;

    const priceDiff = Math.abs(pA.basePrice - pB.basePrice);
    const highlights: string[] = [];

    // Pricing contrast
    if (pA.basePrice === pB.basePrice) {
      highlights.push(`Both drinks share the exact same base price of ₹${pA.basePrice}.`);
    } else {
      const cheaper = pA.basePrice < pB.basePrice ? pA : pB;
      const pricier = pA.basePrice < pB.basePrice ? pB : pA;
      highlights.push(
        `${cheaper.name} is ₹${priceDiff} more budget-friendly than ${pricier.name} (₹${cheaper.basePrice} vs ₹${pricier.basePrice}).`
      );
    }

    // Temperature contrast
    if (pA.temperatureProfile !== pB.temperatureProfile) {
      highlights.push(
        `${pA.name} is served ${pA.temperatureProfile.toLowerCase()}, whereas ${pB.name} is ${pB.temperatureProfile.toLowerCase()}.`
      );
    }

    // Sensory contrast (strength & sweetness)
    if (Math.abs(pA.strengthProfile - pB.strengthProfile) >= 20) {
      const stronger = pA.strengthProfile > pB.strengthProfile ? pA : pB;
      highlights.push(`${stronger.name} delivers a much stronger caffeine/boldness kick.`);
    }

    if (Math.abs(pA.sweetnessProfile - pB.sweetnessProfile) >= 15) {
      const sweeter = pA.sweetnessProfile > pB.sweetnessProfile ? pA : pB;
      highlights.push(`${sweeter.name} is distinctly sweeter.`);
    }

    return {
      productA: pA,
      productB: pB,
      highlights,
      priceDifference: priceDiff,
    };
  }

  /**
   * Retrieves data-driven food and snack pairings for a product.
   */
  async findPairings(idOrSlug: string): Promise<
    Array<{
      name: string;
      category: "pastry" | "cookie" | "cake" | "savory";
      description: string;
      whyItWorks: string;
      pairingPrice?: number;
    }>
  > {
    const product = await this.getProductByIdOrSlug(idOrSlug);
    if (!product) return [];

    const defaultPairings = product.pairings || ["Almond Croissant", "Sea Salt Caramel Biscotti"];

    const pairingDescriptions: Record<
      string,
      { category: "pastry" | "cookie" | "cake" | "savory"; description: string; whyItWorks: string }
    > = {
      "Almond Croissant": {
        category: "pastry",
        description: "Flaky French pastry layered with rich frangipane almond cream.",
        whyItWorks: "The nutty almond butter cuts through deep coffee notes effortlessly.",
      },
      "Sea Salt Caramel Biscotti": {
        category: "cookie",
        description: "Twice-baked Tuscan artisan biscotti with fleur de sel and caramel drizzle.",
        whyItWorks: "Crunchy texture pairs with slow-steeped iced or warm brew.",
      },
      "Dark Chocolate Truffle": {
        category: "cake",
        description: "70% single-origin Belgian dark chocolate ganache dust.",
        whyItWorks: "Brings out roasted caramel and espresso crema aromatics.",
      },
      "Belgian Waffle Bites": {
        category: "pastry",
        description: "Crisp pearl-sugar Belgian waffle squares with warm maple mist.",
        whyItWorks: "Warm buttery contrast to frosted blended frappes.",
      },
      "Vanilla Bean Shortbread": {
        category: "cookie",
        description: "Melt-in-mouth Scottish shortbread made with Madagascar vanilla bean.",
        whyItWorks: "Subtle buttery sweetness balances rich cocoa.",
      },
      "New York Cheesecake Slice": {
        category: "cake",
        description: "Dense, velvety cream cheese on a graham cracker crust.",
        whyItWorks: "Tangy rich cream complements sweet berry notes perfectly.",
      },
      "Pistachio Macaron": {
        category: "cookie",
        description: "Delicate French almond meringue filled with Sicilian pistachio ganache.",
        whyItWorks: "Airy elegance that elevates fruity chilled drinks.",
      },
      "Coconut Chia Pudding": {
        category: "savory",
        description: "Creamy organic chia seed pudding soaked in coconut cream with mango pearls.",
        whyItWorks: "Harmonizes with tropical smoothies for a wholesome boost.",
      },
      "Lemon Tart": {
        category: "pastry",
        description: "Zesty lemon curd in a crisp sweet pastry shell.",
        whyItWorks: "Vibrant citrus acidity enhances tropical fruit sweetness.",
      },
      "Japanese Mochi Trio": {
        category: "cake",
        description: "Handcrafted soft rice cake filled with sweet red bean and white sesame.",
        whyItWorks: "Traditional zen harmony with stone-ground ceremonial matcha.",
      },
      "Matcha Financier": {
        category: "pastry",
        description: "French browned-butter almond cake infused with Kyoto Uji matcha.",
        whyItWorks: "Intensifies earthy green tea notes while adding velvety butter.",
      },
      "Classic Butter Croissant": {
        category: "pastry",
        description: "Golden honeycombed all-butter croissant baked fresh daily.",
        whyItWorks: "The timeless companion for a steamed vanilla latte.",
      },
      "Cinnamon Brioche Roll": {
        category: "pastry",
        description: "Swirled brioche infused with Ceylon cinnamon and cream cheese glaze.",
        whyItWorks: "Warm aromatic spice enriches velvety espresso crema.",
      },
      "Hazelnut Babka": {
        category: "pastry",
        description: "Braided brioche ribboned with dark chocolate fudge and roasted hazelnuts.",
        whyItWorks: "Complements mocha ganache with toasty hazelnut crunch.",
      },
      "Double Chocolate Cookie": {
        category: "cookie",
        description: "Chewy Dutch cocoa cookie loaded with melted dark and milk chocolate chips.",
        whyItWorks: "Ultimate chocolate indulgence alongside hot mocha cream.",
      },
      "Granola Parfait": {
        category: "savory",
        description: "Toasted maple oats, pumpkin seeds, and Greek yogurt layered with wild honey.",
        whyItWorks: "Clean, protein-rich crunch matching tart wild berries.",
      },
      "Blueberry Scone": {
        category: "pastry",
        description: "Tender buttermilk scone bursting with wild mountain blueberries.",
        whyItWorks: "Berry-on-berry synergy with light afternoon refreshment.",
      },
    };

    const priceMap: Record<string, number> = {
      pastry: 130,
      cookie: 95,
      cake: 160,
      savory: 140,
    };

    return defaultPairings.map((name) => {
      const match = pairingDescriptions[name] || {
        category: "pastry" as const,
        description: "Artisan bakery treat prepared daily in our café kitchen.",
        whyItWorks: "Selected specifically to balance the drink's sensory profile.",
      };
      return {
        name,
        category: match.category,
        description: match.description,
        whyItWorks: match.whyItWorks,
        pairingPrice: priceMap[match.category] || 120,
      };
    });
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

  /**
   * Admin: Creates a new product in the catalog and logs audit action.
   */
  async createProduct(
    productData: ProductDoc,
    actorId: string,
    actorRole: UserRole
  ): Promise<ProductDoc> {
    const product: ProductDoc = {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.memoryProducts.push(product);

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("products").doc(product.id).set(product);
      } catch (err) {
        console.warn("[CatalogService]: Firestore write failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "PRODUCT_CREATED",
      resourceType: "product",
      resourceId: product.id,
      metadata: { name: product.name, basePrice: product.basePrice, category: product.category },
    });

    return product;
  }

  /**
   * Admin: Updates an existing product (e.g. price, description, pairings, availability) and logs audit action.
   */
  async updateProduct(
    id: string,
    updates: Partial<ProductDoc>,
    actorId: string,
    actorRole: UserRole
  ): Promise<ProductDoc> {
    const existing = await this.getProductByIdOrSlug(id);
    if (!existing) {
      throw new Error(`Product "${id}" not found.`);
    }

    const updated: ProductDoc = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const idx = this.memoryProducts.findIndex((p) => p.id === existing.id);
    if (idx !== -1) {
      this.memoryProducts[idx] = updated;
    } else {
      this.memoryProducts.push(updated);
    }

    if (isFirebaseAdminConfigured()) {
      try {
        const db = getFirebaseAdminDb();
        await db.collection("products").doc(existing.id).set(updated, { merge: true });
      } catch (err) {
        console.warn("[CatalogService]: Firestore update failed:", (err as Error).message);
      }
    }

    await auditService.logAction({
      actorId,
      actorRole,
      action: "PRODUCT_UPDATED",
      resourceType: "product",
      resourceId: existing.id,
      metadata: {
        previousPrice: existing.basePrice,
        newPrice: updated.basePrice,
        priceChanged: existing.basePrice !== updated.basePrice,
        availabilityChanged: existing.available !== updated.available,
      },
    });

    return updated;
  }

  /**
   * Admin: Toggles product availability and logs audit action.
   */
  async setProductAvailability(
    id: string,
    available: boolean,
    actorId: string,
    actorRole: UserRole
  ): Promise<ProductDoc> {
    return this.updateProduct(id, { available }, actorId, actorRole);
  }
}

export const catalogService = new CatalogService();
