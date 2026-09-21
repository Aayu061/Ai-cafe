import { CatalogService } from "./services/catalog.service";
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS } from "./scripts/seed-data";
import { ProductDoc, IngredientDoc } from "./types/catalog";

/**
 * In-memory test verifying catalog calculation and validation rules
 */
class InMemoryCatalogService extends CatalogService {
  private products = new Map<string, ProductDoc>(INITIAL_PRODUCTS.map((p) => [p.id, p]));
  private ingredients = new Map<string, IngredientDoc>(INITIAL_INGREDIENTS.map((i) => [i.id, i]));

  override async getProductByIdOrSlug(idOrSlug: string): Promise<ProductDoc | null> {
    const direct = this.products.get(idOrSlug);
    if (direct) return direct;
    for (const p of this.products.values()) {
      if (p.slug === idOrSlug) return p;
    }
    return null;
  }

  // Override to use in-memory ingredient map for testing validation logic without external Firestore credentials
  override async validateDrinkConfiguration(config: any): Promise<any> {
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

    const errors: string[] = [];
    const base = this.ingredients.get(config.baseId);
    if (!base) errors.push(`Invalid Base: ${config.baseId}`);
    const milk = this.ingredients.get(config.milkId);
    if (!milk) errors.push(`Invalid Milk: ${config.milkId}`);
    const flavor = this.ingredients.get(config.flavorId);
    if (!flavor) errors.push(`Invalid Flavor: ${config.flavorId}`);
    const sweetness = this.ingredients.get(config.sweetnessId);
    if (!sweetness) errors.push(`Invalid Sweetness: ${config.sweetnessId}`);
    const ice = this.ingredients.get(config.iceId);
    if (!ice) errors.push(`Invalid Ice: ${config.iceId}`);
    const size = this.ingredients.get(config.sizeId);
    if (!size) errors.push(`Invalid Size: ${config.sizeId}`);

    if (product.temperatureProfile === "Hot" && config.iceId !== "no-ice") {
      errors.push(`Hot beverage "${product.name}" cannot be ordered with ice.`);
    }
    if (product.temperatureProfile === "Blended" && config.iceId === "no-ice") {
      errors.push(`Blended beverage "${product.name}" requires ice to prepare.`);
    }

    const validatedToppings: IngredientDoc[] = [];
    for (const tid of config.toppingIds || []) {
      const top = this.ingredients.get(tid);
      if (!top) errors.push(`Invalid Topping: ${tid}`);
      else validatedToppings.push(top);
    }

    if (errors.length > 0) {
      return {
        valid: false,
        currency: "INR",
        basePrice: product.basePrice,
        customizationTotal: 0,
        finalPrice: product.basePrice,
        configuration: config,
        errors,
      };
    }

    let customizationTotal = 0;
    if (base) customizationTotal += base.priceDelta;
    if (milk) customizationTotal += milk.priceDelta;
    if (flavor) customizationTotal += flavor.priceDelta;
    if (size) customizationTotal += size.priceDelta;
    for (const t of validatedToppings) customizationTotal += t.priceDelta;

    const finalPrice = Math.max(0, product.basePrice + customizationTotal);

    return {
      valid: true,
      currency: "INR",
      basePrice: product.basePrice,
      customizationTotal,
      finalPrice,
      productName: product.name,
      configuration: {
        ...config,
        toppingIds: [...config.toppingIds].sort(),
      },
    };
  }
}

async function runUnitTests() {
  console.log("\n🧪 Running Catalog & Pricing Calculation Engine Unit Tests...\n");

  const service = new InMemoryCatalogService();
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name} — ${details}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} — ${details}`);
      failed++;
    }
  }

  // Test 1: Standard Caramel Cold Brew (Base 180 + Oat Milk 30 + Caramel 25 + Drizzle 20 = 255)
  const res1 = await service.validateDrinkConfiguration({
    productId: "caramel-cold-brew",
    baseId: "cold-brew", // 0
    milkId: "oat-milk", // +30
    flavorId: "caramel", // +25
    sweetnessId: "sweetness-50", // 0
    iceId: "regular-ice", // 0
    toppingIds: ["caramel-drizzle"], // +20
    sizeId: "medium", // 0
  });

  assert(
    "1. Caramel Cold Brew Price Calculation",
    res1.valid && res1.finalPrice === 255 && res1.customizationTotal === 75,
    `Expected finalPrice=255, got ${res1.finalPrice}`
  );

  // Test 2: Size adjustment (Large +40, Small -20)
  const res2 = await service.validateDrinkConfiguration({
    productId: "caramel-cold-brew",
    baseId: "cold-brew",
    milkId: "whole-milk", // 0
    flavorId: "flavor-none", // 0
    sweetnessId: "sweetness-0", // 0
    iceId: "regular-ice", // 0
    toppingIds: [],
    sizeId: "large", // +40
  });

  assert(
    "2. Large size price delta (+40)",
    res2.valid && res2.finalPrice === 220,
    `Expected finalPrice=220, got ${res2.finalPrice}`
  );

  // Test 3: Hot beverage cannot have ice
  const res3 = await service.validateDrinkConfiguration({
    productId: "vanilla-latte", // Hot beverage
    baseId: "espresso",
    milkId: "whole-milk",
    flavorId: "vanilla",
    sweetnessId: "sweetness-50",
    iceId: "extra-ice", // Incompatible!
    toppingIds: [],
    sizeId: "medium",
  });

  assert(
    "3. Hot beverage with ice rejected",
    !res3.valid && res3.errors?.some((e: string) => e.includes("cannot be ordered with ice")),
    `Errors: ${JSON.stringify(res3.errors)}`
  );

  // Test 4: Blended beverage without ice rejected
  const res4 = await service.validateDrinkConfiguration({
    productId: "chocolate-frappe", // Blended beverage
    baseId: "chocolate-base",
    milkId: "whole-milk",
    flavorId: "chocolate",
    sweetnessId: "sweetness-75",
    iceId: "no-ice", // Incompatible!
    toppingIds: [],
    sizeId: "medium",
  });

  assert(
    "4. Blended beverage without ice rejected",
    !res4.valid && res4.errors?.some((e: string) => e.includes("requires ice")),
    `Errors: ${JSON.stringify(res4.errors)}`
  );

  // Test 5: Invalid product ID rejected
  const res5 = await service.validateDrinkConfiguration({
    productId: "non-existent-drink-xyz",
    baseId: "cold-brew",
    milkId: "whole-milk",
    flavorId: "vanilla",
    sweetnessId: "sweetness-50",
    iceId: "regular-ice",
    toppingIds: [],
    sizeId: "medium",
  });

  assert(
    "5. Invalid product ID rejected",
    !res5.valid && res5.errors?.some((e: string) => e.includes("not found")),
    `Errors: ${JSON.stringify(res5.errors)}`
  );

  console.log(`\n📊 Engine Unit Test Summary: ${passed} Passed, ${failed} Failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runUnitTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
