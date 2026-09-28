import { catalogService } from "../catalog.service";
import { userService } from "../user.service";
import { orderService } from "../operations/order.service";
import {
  ProductDoc,
  DrinkConfiguration,
  DrinkValidationResult,
  DrinkDna,
} from "../../types/catalog";
import {
  BaristaPreferences,
  BaristaPairingItem,
  BaristaComparisonItem,
  CafeMomentCombo,
  SafeCatalogContext,
} from "../ai/ai-provider.types";

export interface CartItemStub {
  id: string;
  productId: string;
  productName: string;
  configuration: DrinkConfiguration;
  drinkDna: DrinkDna;
  unitPrice: number;
  quantity: number;
  addedAt: string;
}

export interface CustomerCartStub {
  userId: string;
  items: CartItemStub[];
  subtotal: number;
  updatedAt: string;
}

export class BaristaToolsService {
  // In-memory cart store preparing for future Phase 8 integration
  private cartStore: Map<string, CustomerCartStub> = new Map();

  // =========================================================================
  // 1. CATALOG TOOLS (Server-Authoritative)
  // =========================================================================

  /**
   * Searches catalog products matching keyword and optional category.
   */
  async searchProducts(query: string, category?: string): Promise<ProductDoc[]> {
    const products = await catalogService.getProducts();
    const q = query.toLowerCase().trim();

    return products.filter((p) => {
      const catMatch = !category || p.category.toLowerCase().includes(category.toLowerCase());
      if (!catMatch) return false;

      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const noteMatch = p.tasteNotes.some((n) => n.toLowerCase().includes(q));
      const tagMatch = p.tags.some((t) => t.toLowerCase().includes(q));

      return nameMatch || descMatch || noteMatch || tagMatch;
    });
  }

  /**
   * Retrieves a single product by ID or slug.
   */
  async getProduct(idOrSlug: string): Promise<ProductDoc | null> {
    return catalogService.getProductByIdOrSlug(idOrSlug);
  }

  /**
   * Finds the lowest-priced available product.
   */
  async findCheapest(category?: string): Promise<ProductDoc | null> {
    return catalogService.findCheapest(category);
  }

  /**
   * Finds the most expensive / premium available product.
   */
  async findMostExpensive(category?: string): Promise<ProductDoc | null> {
    return catalogService.findMostExpensive(category);
  }

  /**
   * Finds products within a specified maximum budget in INR.
   */
  async findWithinBudget(maxBudget: number, category?: string): Promise<ProductDoc[]> {
    return catalogService.findWithinBudget(maxBudget, category);
  }

  /**
   * Finds products by category (e.g. coffee, frappe, smoothie, matcha).
   */
  async findByCategory(category: string): Promise<ProductDoc[]> {
    return catalogService.findByCategory(category);
  }

  /**
   * Finds products by ingredient, flavor, or taste note.
   */
  async findByIngredient(ingredient: string): Promise<ProductDoc[]> {
    return catalogService.findByIngredient(ingredient);
  }

  /**
   * Compares two products side-by-side using real authoritative catalog attributes.
   */
  async compareProducts(idA: string, idB: string): Promise<BaristaComparisonItem | null> {
    return catalogService.compareProducts(idA, idB);
  }

  /**
   * Retrieves chef-curated food and snack pairings for a drink.
   */
  async findPairings(idOrSlug: string): Promise<BaristaPairingItem[]> {
    return catalogService.findPairings(idOrSlug);
  }

  /**
   * Checks real-time product availability and returns alternatives if unavailable.
   */
  async checkAvailability(idOrSlug: string): Promise<{
    available: boolean;
    product: ProductDoc | null;
    alternatives: ProductDoc[];
  }> {
    const product = await catalogService.getProductByIdOrSlug(idOrSlug);
    if (!product) {
      const allAvailable = await catalogService.findAvailable();
      return { available: false, product: null, alternatives: allAvailable.slice(0, 3) };
    }

    if (product.available) {
      return { available: true, product, alternatives: [] };
    }

    // Product is unavailable; find alternatives in same category or available favorites
    const sameCategory = await catalogService.findByCategory(product.category);
    const availableCategory = sameCategory.filter((p) => p.id !== product.id && p.available);

    if (availableCategory.length > 0) {
      return { available: false, product, alternatives: availableCategory.slice(0, 3) };
    }

    const generalAvailable = await catalogService.findAvailable();
    return {
      available: false,
      product,
      alternatives: generalAvailable.filter((p) => p.id !== product.id).slice(0, 3),
    };
  }

  /**
   * Builds a structured "Complete My Café Moment" budget combo (Drink + Snack + optional Dessert <= maxBudget).
   */
  async buildCafeMomentCombo(
    drinkIdOrSlug?: string,
    maxBudget?: number,
    categoryPreference?: string
  ): Promise<CafeMomentCombo | null> {
    let drink: ProductDoc | null = null;

    if (drinkIdOrSlug) {
      drink = await catalogService.getProductByIdOrSlug(drinkIdOrSlug);
    }

    if (!drink) {
      if (maxBudget) {
        // Reserve at least ₹95 for snack, so drink <= maxBudget - 95
        const drinkBudget = Math.max(120, maxBudget - 95);
        const options = await catalogService.findWithinBudget(drinkBudget, categoryPreference);
        drink = options[0] || (await catalogService.findCheapest(categoryPreference));
      } else {
        drink = (await catalogService.getProductByIdOrSlug("caramel-cold-brew")) || (await catalogService.findCheapest());
      }
    }

    if (!drink) return null;

    const pairings = await catalogService.findPairings(drink.id);
    if (pairings.length === 0) return null;

    // Default snack
    let selectedSnack = pairings[0];
    let selectedDessert: BaristaPairingItem | undefined;

    // Filter within budget if specified
    if (maxBudget) {
      const remainingBudget = maxBudget - drink.basePrice;
      const affordableSnack = pairings.find((p) => (p.pairingPrice || 95) <= remainingBudget);
      if (affordableSnack) {
        selectedSnack = affordableSnack;
      }
    }

    const snackPrice = selectedSnack.pairingPrice || 95;
    let totalPrice = drink.basePrice + snackPrice;

    // Check if optional dessert can fit in budget
    if (maxBudget && maxBudget >= totalPrice + 95) {
      const secondPairing = pairings.find((p) => p.name !== selectedSnack.name && (p.category === "cake" || p.category === "cookie"));
      if (secondPairing && totalPrice + (secondPairing.pairingPrice || 120) <= maxBudget) {
        selectedDessert = secondPairing;
        totalPrice += (secondPairing.pairingPrice || 120);
      }
    }

    return {
      title: `${drink.name} & ${selectedSnack.name}`,
      drink: {
        id: drink.id,
        name: drink.name,
        price: drink.basePrice,
        categoryLabel: drink.categoryLabel,
        image: drink.image,
      },
      snack: {
        name: selectedSnack.name,
        category: selectedSnack.category,
        price: snackPrice,
        description: selectedSnack.description,
        whyItWorks: selectedSnack.whyItWorks,
      },
      dessert: selectedDessert
        ? {
            name: selectedDessert.name,
            category: selectedDessert.category,
            price: selectedDessert.pairingPrice || 120,
            description: selectedDessert.description,
            whyItWorks: selectedDessert.whyItWorks,
          }
        : undefined,
      totalPrice,
      budgetLimit: maxBudget,
    };
  }

  // =========================================================================
  // 2. BUILDER TOOLS (Validation & Authoritative Pricing)
  // =========================================================================

  /**
   * Validates a drink configuration against server ingredients and rules.
   */
  async validateDrinkConfiguration(config: DrinkConfiguration): Promise<DrinkValidationResult> {
    return catalogService.validateDrinkConfiguration(config);
  }

  /**
   * Calculates the exact server-authoritative price for a drink configuration.
   */
  async calculateDrinkPrice(config: DrinkConfiguration): Promise<{
    basePrice: number;
    customizationTotal: number;
    finalPrice: number;
  }> {
    const result = await catalogService.validateDrinkConfiguration(config);
    return {
      basePrice: result.basePrice,
      customizationTotal: result.customizationTotal,
      finalPrice: result.finalPrice,
    };
  }

  /**
   * Resolves customer sensory preferences into a valid, server-authoritative DrinkConfiguration.
   */
  resolveDrinkConfiguration(
    product: ProductDoc,
    prefs: BaristaPreferences,
    context?: SafeCatalogContext
  ): DrinkConfiguration {
    const baseConfig: DrinkConfiguration = { ...product.defaultConfiguration };

    // 1. Milk selection
    const milkPref = prefs.milk || prefs.milkPreference;
    if (milkPref && (!context || context.availableMilks.includes(milkPref))) {
      baseConfig.milkId = milkPref;
    }

    // 2. Sweetness mapping
    if (typeof prefs.sweetness === "number") {
      if (prefs.sweetness <= 10) baseConfig.sweetnessId = "sweetness-0";
      else if (prefs.sweetness <= 35) baseConfig.sweetnessId = "sweetness-25";
      else if (prefs.sweetness <= 60) baseConfig.sweetnessId = "sweetness-50";
      else if (prefs.sweetness <= 85) baseConfig.sweetnessId = "sweetness-75";
      else baseConfig.sweetnessId = "sweetness-100";
    }

    // 3. Ice level enforcement
    if (product.temperatureProfile === "Hot") {
      baseConfig.iceId = "no-ice";
    } else if (prefs.chill && prefs.chill <= 30) {
      baseConfig.iceId = "light-ice";
    } else if (prefs.chill && prefs.chill >= 85) {
      baseConfig.iceId = "extra-ice";
    }

    // 4. Flavor selection
    const flavorPrefs = prefs.flavorPreferences || [];
    if (prefs.flavor && !flavorPrefs.includes(prefs.flavor)) {
      flavorPrefs.push(prefs.flavor);
    }
    if (flavorPrefs.length > 0) {
      const target = flavorPrefs[0].toLowerCase();
      if (context) {
        const match = context.availableFlavors.find((f) => f.toLowerCase().includes(target));
        if (match) baseConfig.flavorId = match;
      } else {
        baseConfig.flavorId = `flavor-${target}`;
      }
    }

    return baseConfig;
  }

  // =========================================================================
  // 3. CUSTOMER TOOLS (Own Authenticated Customer Data Only)
  // =========================================================================

  /**
   * Fetches the customer's own taste profile. Enforces privacy: returns null if no valid userId.
   */
  async getOwnTasteProfile(userId?: string): Promise<Record<string, unknown> | null> {
    if (!userId) return null;
    const user = await userService.getUserProfile(userId);
    return user?.tasteProfile || null;
  }

  /**
   * Fetches the customer's own favorite drinks. Enforces privacy: returns empty array if no userId.
   */
  async getOwnFavorites(userId?: string): Promise<ProductDoc[]> {
    if (!userId) return [];
    const user = await userService.getUserProfile(userId);
    if (!user || !user.favorites || user.favorites.length === 0) return [];

    const products = await Promise.all(
      user.favorites.map((favId: string) => catalogService.getProductByIdOrSlug(favId))
    );
    return products.filter((p: ProductDoc | null): p is ProductDoc => p !== null && p.available);
  }

  /**
   * Fetches the customer's own saved custom creations.
   */
  async getOwnSavedCreations(userId?: string): Promise<unknown[]> {
    if (!userId) return [];
    const user = await userService.getUserProfile(userId);
    return user?.savedCreations || [];
  }

  /**
   * Fetches the customer's own recent orders.
   */
  async getOwnRecentOrders(userId?: string): Promise<unknown[]> {
    if (!userId) return [];
    const orders = await orderService.getOrders(undefined, userId);
    return orders.slice(0, 5);
  }

  // =========================================================================
  // 4. CART INTERFACES (Preparation for Future Phase 8)
  // =========================================================================

  /**
   * Retrieves customer's current cart state.
   */
  async getCart(userId: string): Promise<CustomerCartStub> {
    if (!this.cartStore.has(userId)) {
      this.cartStore.set(userId, {
        userId,
        items: [],
        subtotal: 0,
        updatedAt: new Date().toISOString(),
      });
    }
    return this.cartStore.get(userId)!;
  }

  /**
   * Adds an item to the customer's cart after server validation.
   */
  async addToCart(
    userId: string,
    item: {
      productId: string;
      configuration: DrinkConfiguration;
      quantity?: number;
    }
  ): Promise<CustomerCartStub> {
    const product = await catalogService.getProductByIdOrSlug(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found.`);
    if (!product.available) throw new Error(`${product.name} is currently unavailable.`);

    const validation = await catalogService.validateDrinkConfiguration(item.configuration);
    if (!validation.valid) {
      throw new Error(`Invalid drink configuration: ${(validation.errors || []).join(", ")}`);
    }

    const cart = await this.getCart(userId);
    const qty = Math.max(1, item.quantity || 1);

    const cartItem: CartItemStub = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      configuration: item.configuration,
      drinkDna: validation.drinkDna,
      unitPrice: validation.finalPrice,
      quantity: qty,
      addedAt: new Date().toISOString(),
    };

    cart.items.push(cartItem);
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    cart.updatedAt = new Date().toISOString();

    return cart;
  }

  /**
   * Removes an item from the customer's cart.
   */
  async removeFromCart(userId: string, itemId: string): Promise<CustomerCartStub> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    cart.updatedAt = new Date().toISOString();
    return cart;
  }

  /**
   * Updates quantity or configuration of a cart item.
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    updates: { quantity?: number }
  ): Promise<CustomerCartStub> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (item && typeof updates.quantity === "number") {
      item.quantity = Math.max(1, updates.quantity);
      cart.subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      cart.updatedAt = new Date().toISOString();
    }
    return cart;
  }
}

export const baristaToolsService = new BaristaToolsService();
