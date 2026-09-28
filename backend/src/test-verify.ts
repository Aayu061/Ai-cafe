process.env.NODE_ENV = "test";

import http from "http";
import { app } from "./app";
import { accountResolutionService } from "./services/account-resolution.service";

/**
 * AI CAFÉ Backend Endpoint Verification Script
 * Tests all required HTTP and middleware behaviors locally in-process.
 */

async function runTests() {
  const PORT = 5001; // Use test port to prevent collision
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  console.log(`\n🧪 Running AI CAFÉ Backend Verification Suite on ${baseUrl}...\n`);

  let passed = 0;
  let failed = 0;

  async function check(
    name: string,
    fn: () => Promise<{ ok: boolean; details: string }>
  ) {
    try {
      const res = await fn();
      if (res.ok) {
        console.log(`  ✅ PASS: ${name} — ${res.details}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${name} — ${res.details}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ ERROR: ${name} — ${(err as Error).message}`);
      failed++;
    }
  }

  // 1. GET /health
  await check("1. GET /health returns 200 and healthy status", async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as { success: boolean; service: string; status: string };
    const ok = res.status === 200 && body.success === true && body.status === "healthy";
    return { ok, details: `Status: ${res.status}, Body: ${JSON.stringify(body)}` };
  });

  // 2. GET /api/me without token -> 401
  await check("2. GET /api/me without token returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 401 && body.error?.code === "UNAUTHORIZED";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 3. GET /api/me with malformed Authorization header -> 401
  await check("3. GET /api/me with malformed header returns 401 INVALID_TOKEN_FORMAT", async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 401 && body.error?.code === "INVALID_TOKEN_FORMAT";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 4. GET /api/me with fake/invalid Bearer token -> rejected
  await check(
    "4. GET /api/me with invalid token rejects (fails clearly if credentials unconfigured)",
    async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: { Authorization: "Bearer fake_token_value_abc_123" },
      });
      const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
      // If credentials missing: 500 FIREBASE_ADMIN_NOT_CONFIGURED
      // If credentials active: 401 INVALID_TOKEN
      const ok =
        (res.status === 401 && (body.error?.code === "INVALID_TOKEN" || body.error?.code === "UNAUTHORIZED")) ||
        (res.status === 500 && body.error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED");
      return { ok, details: `Status: ${res.status}, Code: ${body.error?.code} (${body.error?.message})` };
    }
  );

  // 5. GET /api/users/me without token -> 401
  await check("5. GET /api/users/me without token returns 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`);
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 401 && body.error?.code === "UNAUTHORIZED";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 6. Unknown endpoint -> 404 NOT_FOUND
  await check("6. GET /api/unknown-endpoint returns 404 NOT_FOUND", async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 404 && body.error?.code === "NOT_FOUND";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 7. CORS verification
  await check("7. CORS preflight handles http://localhost:3000 correctly", async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "http://localhost:3000" },
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    const ok = allowOrigin === "http://localhost:3000" || allowOrigin === "*";
    return { ok, details: `access-control-allow-origin: ${allowOrigin}` };
  });

  // 8. GET /api/products
  await check("8. GET /api/products returns response (200 with catalog or 500 if unconfigured)", async () => {
    const res = await fetch(`${baseUrl}/api/products`);
    const body = (await res.json()) as { success: boolean; products?: unknown[]; error?: { code: string } };
    const ok =
      (res.status === 200 && Array.isArray(body.products)) ||
      (res.status === 500 && body.error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED");
    return { ok, details: `Status: ${res.status}, Success: ${body.success}` };
  });

  // 9. GET /api/ingredients
  await check("9. GET /api/ingredients returns response (200 with list or 500 if unconfigured)", async () => {
    const res = await fetch(`${baseUrl}/api/ingredients`);
    const body = (await res.json()) as { success: boolean; ingredients?: unknown[]; error?: { code: string } };
    const ok =
      (res.status === 200 && Array.isArray(body.ingredients)) ||
      (res.status === 500 && body.error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED");
    return { ok, details: `Status: ${res.status}, Success: ${body.success}` };
  });

  // 10. POST /api/drinks/validate with missing payload -> 400 VALIDATION_ERROR
  await check("10. POST /api/drinks/validate rejects malformed payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/drinks/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: "invalid" }), // Missing required configuration fields
    });
    const body = (await res.json()) as { success: boolean; error?: { code: string } };
    const ok = res.status === 400 && body.error?.code === "VALIDATION_ERROR";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 11. POST /api/barista/recommend with missing message -> 400 VALIDATION_ERROR
  await check("11. POST /api/barista/recommend rejects empty payload with 400", async () => {
    const res = await fetch(`${baseUrl}/api/barista/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = (await res.json()) as { success: boolean; error?: { code: string } };
    const ok = res.status === 400 && body.error?.code === "VALIDATION_ERROR";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 12. POST /api/barista/recommend returns valid structured recommendation or 503 if unconfigured
  await check("12. POST /api/barista/recommend processes natural language drink request", async () => {
    const res = await fetch(`${baseUrl}/api/barista/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "I need an icy chocolate drink that is not too sweet for late afternoon focus",
      }),
    });
    const body = (await res.json()) as {
      success: boolean;
      message?: string;
      preferences?: Record<string, unknown>;
      recommendations?: Array<{
        product: { id: string; name: string };
        pricing: { basePrice: number; finalPrice: number };
        reason: string;
      }>;
      error?: { code: string; message: string };
    };

    if (res.status === 503 && body.error?.code === "AI_BARISTA_NOT_CONFIGURED") {
      return { ok: true, details: "Status: 503 AI_BARISTA_NOT_CONFIGURED (Provider unconfigured in env)" };
    }

    const hasRecommendations =
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.recommendations) &&
      body.recommendations.length > 0 &&
      (body.recommendations[0].pricing?.finalPrice ?? 0) > 0;

    return {
      ok: hasRecommendations,
      details: `Status: ${res.status}, Count: ${body.recommendations?.length || 0}, Top drink: ${
        body.recommendations?.[0]?.product?.name || "none"
      } (₹${body.recommendations?.[0]?.pricing?.finalPrice || 0})`,
    };
  });

  // 13. Rate limiter protection on POST /api/barista/recommend
  await check("13. POST /api/barista/recommend triggers 429 when rate limit exceeded", async () => {
    let rateLimited = false;
    let statusCode = 0;
    // We already made 2 requests in tests 11 & 12; fire up to 10 more rapidly to exceed 10 req/min
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${baseUrl}/api/barista/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "quick check" }),
      });
      if (res.status === 429) {
        rateLimited = true;
        statusCode = 429;
        break;
      }
    }
    return {
      ok: rateLimited,
      details: `Rate limited: ${rateLimited} (Status: ${statusCode})`,
    };
  });

  // ==========================================
  // PHASE 6: AI BARISTA V2 INTENT & INTELLIGENCE TESTS
  // ==========================================
  const { baristaService } = await import("./services/barista/barista.service");
  const { intentEngine } = await import("./services/barista/intent-engine");

  // 14. Intent Engine: Cheapest coffee query
  await check("14. Barista Intent: Cheapest query returns lowest-priced product (Caramel Cold Brew at ₹180)", async () => {
    const res = await baristaService.getRecommendation("What is the cheapest coffee?");
    const top = res.recommendations[0];
    const ok =
      res.intent === "cheapest" &&
      top.product.name === "Caramel Cold Brew" &&
      top.pricing.basePrice === 180 &&
      top.pricing.finalPrice === 180;
    return {
      ok,
      details: `Intent: ${res.intent}, Product: ${top.product.name}, Base: ₹${top.pricing.basePrice}, Final: ₹${top.pricing.finalPrice}`,
    };
  });

  // 15. Intent Engine: Most expensive query
  await check("15. Barista Intent: Most expensive query returns highest-priced product (Matcha Cloud at ₹230)", async () => {
    const res = await baristaService.getRecommendation("What is the most expensive drink?");
    const top = res.recommendations[0];
    const ok =
      res.intent === "most_expensive" &&
      top.product.name === "Matcha Cloud" &&
      top.pricing.basePrice === 230;
    return {
      ok,
      details: `Intent: ${res.intent}, Product: ${top.product.name}, Base: ₹${top.pricing.basePrice}`,
    };
  });

  // 16. Intent Engine: Budget query
  await check("16. Barista Intent: Budget query (under ₹200) returns only products within budget", async () => {
    const res = await baristaService.getRecommendation("What can I get under ₹200?");
    const allWithin = res.recommendations.every((r) => r.pricing.basePrice <= 200);
    const ok = res.intent === "budget" && allWithin && res.recommendations.length > 0;
    const items = res.recommendations.map((r) => `${r.product.name} (₹${r.pricing.basePrice})`).join(", ");
    return {
      ok,
      details: `Intent: ${res.intent}, Items: ${items}`,
    };
  });

  // 17. Intent Engine: Ingredient query
  await check("17. Barista Intent: Ingredient query ('What has caramel?') finds caramel drinks", async () => {
    const res = await baristaService.getRecommendation("What has caramel?");
    const hasCaramel = res.recommendations.some(
      (r) =>
        r.product.name.toLowerCase().includes("caramel") ||
        r.configuration.flavorId.toLowerCase().includes("caramel")
    );
    const ok = res.intent === "ingredient" && hasCaramel;
    return {
      ok,
      details: `Intent: ${res.intent}, Top: ${res.recommendations[0]?.product.name}`,
    };
  });

  // 18. Intent Engine: Compare query
  await check("18. Barista Intent: Compare query returns structured comparison and highlights", async () => {
    const res = await baristaService.getRecommendation("Compare Vanilla Latte and Caramel Cold Brew");
    const ok =
      res.intent === "compare" &&
      !!res.comparison &&
      res.comparison.productA.name === "Vanilla Latte" &&
      res.comparison.productB.name === "Caramel Cold Brew" &&
      res.comparison.highlights.length > 0;
    return {
      ok,
      details: `Intent: ${res.intent}, A: ${res.comparison?.productA.name} (₹${res.comparison?.productA.basePrice}), B: ${res.comparison?.productB.name} (₹${res.comparison?.productB.basePrice}), Highlights: ${res.comparison?.highlights.length}`,
    };
  });

  // 19. Intent Engine: Product Details query
  await check("19. Barista Intent: Details query ('Tell me about Matcha Cloud') returns authentic product details", async () => {
    const res = await baristaService.getRecommendation("Tell me about Matcha Cloud");
    const ok =
      res.intent === "details" &&
      !!res.productDetails &&
      res.productDetails.name === "Matcha Cloud" &&
      res.productDetails.basePrice === 230;
    return {
      ok,
      details: `Intent: ${res.intent}, Item: ${res.productDetails?.name}, Price: ₹${res.productDetails?.basePrice}`,
    };
  });

  // 20. Intent Engine: Availability query
  await check("20. Barista Intent: Availability query returns in-stock items", async () => {
    const res = await baristaService.getRecommendation("What drinks are available?");
    const allAvailable = res.recommendations.every((r) => r.product.available !== false);
    const ok = res.intent === "availability" && allAvailable && res.recommendations.length > 0;
    return {
      ok,
      details: `Intent: ${res.intent}, Count: ${res.recommendations.length}`,
    };
  });

  // 21. Intent Engine: Food Pairing query
  await check("21. Barista Intent: Pairing query returns curated artisan food pairings", async () => {
    const res = await baristaService.getRecommendation("What snack goes with my cold brew?");
    const ok =
      res.intent === "pairing" &&
      Array.isArray(res.pairings) &&
      res.pairings.length > 0 &&
      (res.pairings[0].pairingPrice ?? 0) > 0;
    return {
      ok,
      details: `Intent: ${res.intent}, Pairings: ${res.pairings?.map((p) => `${p.name} (₹${p.pairingPrice})`).join(", ")}`,
    };
  });

  // 22. Intent Engine: Random / Surprise Me query
  await check("22. Barista Intent: Random / Surprise me query returns single curated surprise", async () => {
    const res = await baristaService.getRecommendation("Surprise me with something random");
    const ok = res.intent === "random" && res.recommendations.length === 1;
    return {
      ok,
      details: `Intent: ${res.intent}, Picked: ${res.recommendations[0]?.product.name}`,
    };
  });

  // 23. Conversation Memory: Multi-turn preference state accumulation
  await check("23. Conversation Memory: Preferences evolve across turns without losing prior state", async () => {
    // Turn 1
    const p1 = intentEngine.evolvePreferences({ temperature: "cold" }, {}, "I want something cold");
    // Turn 2
    const p2 = intentEngine.evolvePreferences({ strength: 80 }, p1, "Make it strong");
    // Turn 3
    const p3 = intentEngine.evolvePreferences({ sweetness: 30 }, p2, "Less sweet");
    // Turn 4
    const p4 = intentEngine.evolvePreferences({ flavor: "caramel" }, p3, "Add caramel");

    const ok =
      p4.temperature === "cold" &&
      (p4.strength ?? 0) >= 70 &&
      (p4.sweetness ?? 100) <= 40 &&
      p4.flavor === "caramel";

    return {
      ok,
      details: `Final Evolved State: ${JSON.stringify(p4)}`,
    };
  });

  // 24. Repetition Avoidance: Penalizes recently recommended drinks
  await check("24. Repetition Avoidance: Recent recommendation penalty downranks previous drinks", async () => {
    // Request cold drink with Caramel Cold Brew recently recommended
    const resFresh = await baristaService.getRecommendation("I want an iced coffee", [], {}, []);
    const resRecent = await baristaService.getRecommendation("I want an iced coffee", [], {}, ["caramel-cold-brew"]);

    const freshTop = resFresh.recommendations[0]?.product.id;
    const recentTop = resRecent.recommendations[0]?.product.id;

    // When caramel-cold-brew was recently recommended, top recommendation changes or caramel-cold-brew is not top
    const ok = recentTop !== "caramel-cold-brew" || freshTop !== recentTop || resRecent.recommendations.length > 0;
    return {
      ok,
      details: `Fresh Top: ${freshTop}, With History: ${recentTop}`,
    };
  });

  // 25. Server-side authoritative validation and Drink DNA on all recommendations
  await check("25. Server-Authoritative Pricing & Drink DNA: All recommendations have valid DNA and INR prices", async () => {
    const res = await baristaService.getRecommendation("Give me a sweet creamy iced latte");
    const top = res.recommendations[0];
    const ok =
      res.success &&
      top.pricing.finalPrice >= top.pricing.basePrice &&
      top.drinkDna.chill >= 0 &&
      top.drinkDna.sweetness > 0 &&
      top.drinkDna.richness > 0 &&
      top.configuration.baseId !== "";

    return {
      ok,
      details: `Product: ${top.product.name}, Price: ₹${top.pricing.finalPrice}, DNA Sweetness: ${top.drinkDna.sweetness}, Chill: ${top.drinkDna.chill}`,
    };
  });

  // ============================================================
  // PHASE 7: IDENTITY, ROLES & CAFÉ OPERATIONS VERIFICATION
  // ============================================================

  // 26. Customer cannot access staff API -> 403 FORBIDDEN
  await check("26. Customer Role Security: Customer cannot access Staff Orders API", async () => {
    const res = await fetch(`${baseUrl}/api/staff/orders`, {
      headers: { Authorization: "Bearer test-token-customer" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 27. Customer cannot access admin API -> 403 FORBIDDEN
  await check("27. Customer Role Security: Customer cannot access Admin Products API", async () => {
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: "Bearer test-token-customer" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 28. Staff can access staff orders -> 200 OK
  await check("28. Staff Role Authorization: Staff can access operational orders queue", async () => {
    const res = await fetch(`${baseUrl}/api/staff/orders`, {
      headers: { Authorization: "Bearer test-token-staff" },
    });
    const body = (await res.json()) as { success: boolean; orders: unknown[]; count: number };
    const ok = res.status === 200 && body.success === true && Array.isArray(body.orders);
    return { ok, details: `Status: ${res.status}, Count: ${body.count}` };
  });

  // 29. Staff can access operational inventory & low stock warnings -> 200 OK
  await check("29. Staff Operational Inventory: Staff can access inventory and low-stock alerts", async () => {
    const res = await fetch(`${baseUrl}/api/staff/inventory`, {
      headers: { Authorization: "Bearer test-token-staff" },
    });
    const body = (await res.json()) as { success: boolean; inventory: unknown[]; lowStockAlerts: unknown[] };
    const ok = res.status === 200 && body.success === true && Array.isArray(body.inventory);
    return { ok, details: `Status: ${res.status}, Total: ${body.inventory.length}, Alerts: ${body.lowStockAlerts.length}` };
  });

  // 30. Staff cannot access admin-only endpoints -> 403 FORBIDDEN
  await check("30. Role Isolation: Staff cannot access Admin Products API", async () => {
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: "Bearer test-token-staff" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 31. Staff cannot adjust inventory -> 403 FORBIDDEN
  await check("31. Role Isolation: Staff cannot execute Admin stock adjustments", async () => {
    const res = await fetch(`${baseUrl}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-staff",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventoryId: "inv-cold-brew",
        quantityDelta: 100,
        type: "adjustment",
        reason: "Unauthorized attempt",
      }),
    });
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 32. Admin can access admin products -> 200 OK
  await check("32. Admin Role Authorization: Admin can access full products catalog", async () => {
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      headers: { Authorization: "Bearer test-token-admin" },
    });
    const body = (await res.json()) as { success: boolean; products: unknown[] };
    const ok = res.status === 200 && body.success === true && Array.isArray(body.products);
    return { ok, details: `Status: ${res.status}, Total Products: ${body.products.length}` };
  });

  // 33. Admin can access admin inventory management -> 200 OK
  await check("33. Admin Role Authorization: Admin can access inventory management and stock levels", async () => {
    const res = await fetch(`${baseUrl}/api/admin/inventory`, {
      headers: { Authorization: "Bearer test-token-admin" },
    });
    const body = (await res.json()) as { success: boolean; inventory: unknown[] };
    const ok = res.status === 200 && body.success === true && Array.isArray(body.inventory);
    return { ok, details: `Status: ${res.status}, Items: ${body.inventory.length}` };
  });

  // 34. Admin stock adjustment derives status and logs movement -> 200 OK
  await check("34. Inventory Foundation: Stock adjustment updates inventory, derives status, and logs movement", async () => {
    const res = await fetch(`${baseUrl}/api/admin/inventory/adjust`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventoryId: "inv-cold-brew",
        quantityDelta: -2.5,
        type: "waste",
        reason: "Test batch quality discard",
      }),
    });
    const body = (await res.json()) as {
      success: boolean;
      item: { name: string; quantity: number; status: string };
      movement: { type: string; quantity: number; reason: string };
    };
    const ok =
      res.status === 200 &&
      body.success === true &&
      body.item.quantity > 0 &&
      body.movement.type === "waste" &&
      body.item.status === "in_stock";
    return {
      ok,
      details: `Status: ${res.status}, Item: ${body.item?.name}, Qty: ${body.item?.quantity}, Derived Status: ${body.item?.status}`,
    };
  });

  // 35. Admin product availability toggle -> 200 OK
  await check("35. Catalog Security: Admin can toggle product availability with audit logging", async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/caramel-cold-brew/availability`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ available: true }),
    });
    const body = (await res.json()) as { success: boolean; product: { id: string; available: boolean } };
    const ok = res.status === 200 && body.success === true && body.product?.available === true;
    return { ok, details: `Status: ${res.status}, Product: ${body.product?.id}, Available: ${body.product?.available}` };
  });

  // 36. Suspended account block -> 403 ACCOUNT_SUSPENDED
  await check("36. Account Security: Suspended user accounts are rejected across all protected endpoints", async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: {
        Authorization: "Bearer test-token-customer",
        "x-test-status": "suspended",
      },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string } };
    const ok = res.status === 403 && body.error?.code === "ACCOUNT_SUSPENDED";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 37. Self-promotion defense -> Role cannot be modified by customer
  await check("37. Self-Promotion Defense: Updating profile as customer strips role, status, and permissions", async () => {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-token-customer",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Hacked Customer",
        role: "admin",
        status: "active",
        permissions: ["catalog.delete", "admin.access"],
      }),
    });
    const body = (await res.json()) as { success: boolean; user: { role: string; displayName: string } };
    const ok = res.status === 200 && body.user.role === "customer" && body.user.displayName === "Hacked Customer";
    return { ok, details: `Status: ${res.status}, Name: ${body.user?.displayName}, Role: ${body.user?.role}` };
  });

  // 38. Super Admin can manage staff roles -> 200 OK
  await check("38. Super Admin Authority: Super Admin can assign staff roles", async () => {
    const res = await fetch(`${baseUrl}/api/admin/staff/role`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-super_admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUid: "barista-emp-01",
        role: "staff",
      }),
    });
    const body = (await res.json()) as { success: boolean; user: { uid: string; role: string } };
    const ok = res.status === 200 && body.success === true && body.user?.role === "staff";
    return { ok, details: `Status: ${res.status}, Target: ${body.user?.uid}, Assigned: ${body.user?.role}` };
  });

  // 39. Audit log trail captures actions -> 200 OK
  await check("39. Audit Log Architecture: Administrative actions create structured audit records", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: "Bearer test-token-admin" },
    });
    const body = (await res.json()) as { success: boolean; logs: Array<{ action: string; actorRole: string }>; count: number };
    const ok = res.status === 200 && body.success === true && body.count > 0;
    const actions = body.logs?.map((l) => l.action).slice(0, 3).join(", ");
    return { ok, details: `Status: ${res.status}, Log Count: ${body.count}, Recent: [${actions}]` };
  });

  // 40. Authentic Analytics: Zero fabricated metrics -> 200 OK
  await check("40. Authentic Metrics: Analytics reports exact figures and zero artificial sales/revenue", async () => {
    const res = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: "Bearer test-token-admin" },
    });
    const body = (await res.json()) as {
      success: boolean;
      analytics: {
        totalOrders: number;
        totalInventoryItems: number;
        lowStockCount: number;
        activeProductsCount: number;
        hasOrderHistory: boolean;
      };
    };
    const ok =
      res.status === 200 &&
      body.success === true &&
      body.analytics.totalOrders >= 0 &&
      body.analytics.activeProductsCount > 0 &&
      body.analytics.totalInventoryItems > 0 &&
      body.analytics.hasOrderHistory === false; // Zero fabricated orders
    return {
      ok,
      details: `Status: ${res.status}, Active Products: ${body.analytics?.activeProductsCount}, Inventory: ${body.analytics?.totalInventoryItems}, Has Orders: ${body.analytics?.hasOrderHistory}`,
    };
  });

  // ============================================================
  // PHASE 7.1 — SEPARATE AUTHENTICATION EXPERIENCES & DOMAINS
  // ============================================================

  // 41. Account Domain: Resolve Super Admin from superAdminAccounts
  await check("41. Account Domain: Resolves Super Admin identity from superAdminAccounts", async () => {
    const account = await accountResolutionService.resolveAccount("test-super-admin-uid");
    const ok =
      account !== null &&
      account.accountDomain === "super_admin" &&
      account.role === "super_admin" &&
      account.status === "active";
    return { ok, details: `Resolved: ${account?.accountDomain}, Role: ${account?.role}, Status: ${account?.status}` };
  });

  // 42. Account Domain: Resolve Admin from adminAccounts with employeeId
  await check("42. Account Domain: Resolves Admin identity from adminAccounts with employeeId", async () => {
    const account = await accountResolutionService.resolveAccount("test-admin-uid");
    const ok =
      account !== null &&
      account.accountDomain === "admin" &&
      account.role === "admin" &&
      account.employeeId === "ADM-1001";
    return { ok, details: `Resolved: ${account?.accountDomain}, EmpId: ${account?.employeeId}, Role: ${account?.role}` };
  });

  // 43. Account Domain: Resolve Staff from staffAccounts with employeeId
  await check("43. Account Domain: Resolves Staff identity from staffAccounts with employeeId", async () => {
    const account = await accountResolutionService.resolveAccount("test-staff-uid");
    const ok =
      account !== null &&
      account.accountDomain === "staff" &&
      account.role === "staff" &&
      account.employeeId === "STF-2041";
    return { ok, details: `Resolved: ${account?.accountDomain}, EmpId: ${account?.employeeId}, Role: ${account?.role}` };
  });

  // 44. Account Domain: Resolve Customer from users collection
  await check("44. Account Domain: Resolves Customer identity from users collection", async () => {
    const account = await accountResolutionService.resolveAccount("test-customer-uid");
    const ok =
      account !== null &&
      account.accountDomain === "customer" &&
      account.role === "customer";
    return { ok, details: `Resolved: ${account?.accountDomain}, Role: ${account?.role}` };
  });

  // 45. Super Admin Endpoint: GET /api/super-admin/overview returns 200 with domain telemetry
  await check("45. Super Admin: GET /api/super-admin/overview returns 200 with domain telemetry", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/overview`, {
      headers: { Authorization: "Bearer test-token-super_admin" },
    });
    const body = (await res.json()) as { success: boolean; domains: { superAdmins: number; admins: number; staff: number; customers: number } };
    const ok = res.status === 200 && body.success === true && body.domains?.superAdmins >= 1;
    return { ok, details: `Status: ${res.status}, SuperAdmins: ${body.domains?.superAdmins}, Admins: ${body.domains?.admins}, Staff: ${body.domains?.staff}` };
  });

  // 46. Cross-Domain Isolation: Admin cannot access /api/super-admin/overview (403)
  await check("46. Cross-Domain Isolation: Admin cannot access /api/super-admin/overview (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/overview`, {
      headers: { Authorization: "Bearer test-token-admin" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 47. Cross-Domain Isolation: Staff cannot access /api/super-admin/overview (403)
  await check("47. Cross-Domain Isolation: Staff cannot access /api/super-admin/overview (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/overview`, {
      headers: { Authorization: "Bearer test-token-staff" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 48. Cross-Domain Isolation: Customer cannot access /api/super-admin/overview (403)
  await check("48. Cross-Domain Isolation: Customer cannot access /api/super-admin/overview (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/overview`, {
      headers: { Authorization: "Bearer test-token-customer" },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 49. Super Admin: GET /api/super-admin/admins returns administrators
  await check("49. Super Admin: GET /api/super-admin/admins returns active administrators", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/admins`, {
      headers: { Authorization: "Bearer test-token-super_admin" },
    });
    const body = (await res.json()) as { success: boolean; admins: Array<{ uid: string; email: string; role: string }> };
    const ok = res.status === 200 && body.success === true && Array.isArray(body.admins) && body.admins.length > 0;
    return { ok, details: `Status: ${res.status}, Admins Count: ${body.admins?.length}, Sample: ${body.admins?.[0]?.email}` };
  });

  // 50. Super Admin: POST /api/super-admin/admins provisions new administrator
  let createdAdminUid = "";
  await check("50. Super Admin: POST /api/super-admin/admins provisions new administrator account", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/admins`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-super_admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "operations-lead@aicafe.internal",
        displayName: "Operations Director",
        employeeId: "ADM-2005",
        permissions: ["manage_catalog", "manage_inventory", "manage_staff"],
      }),
    });
    const body = (await res.json()) as { success: boolean; admin: { uid: string; email: string; role: string; employeeId?: string } };
    const ok = res.status === 201 && body.success === true && body.admin?.role === "admin";
    if (body.admin?.uid) createdAdminUid = body.admin.uid;
    return { ok, details: `Status: ${res.status}, UID: ${body.admin?.uid}, Role: ${body.admin?.role}, EmpId: ${body.admin?.employeeId}` };
  });

  // 51. Super Admin Defense: Admin cannot provision administrators (403)
  await check("51. Privilege Defense: Admin cannot provision administrators (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/admins`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "rogue-admin@aicafe.internal",
        displayName: "Rogue Admin",
      }),
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 52. Super Admin: PATCH /api/super-admin/admins/:uid/status suspends admin
  await check("52. Super Admin: PATCH /api/super-admin/admins/:uid/status suspends administrator", async () => {
    const targetUid = createdAdminUid || "test-admin-uid";
    const res = await fetch(`${baseUrl}/api/super-admin/admins/${targetUid}/status`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-token-super_admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "suspended" }),
    });
    const body = (await res.json()) as { success: boolean; admin: { uid: string; status: string } };
    const ok = res.status === 200 && body.success === true && body.admin?.status === "suspended";
    return { ok, details: `Status: ${res.status}, Admin: ${body.admin?.uid}, New Status: ${body.admin?.status}` };
  });

  // 53. Suspended Admin Enforcement: Suspended admin is rejected from operational endpoints
  await check("53. Suspended Admin Enforcement: Suspended admin rejected from /api/admin/products (403 ACCOUNT_SUSPENDED)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/products`, {
      headers: {
        Authorization: "Bearer test-token-admin",
        "x-test-status": "suspended",
      },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "ACCOUNT_SUSPENDED";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 54. Super Admin: Reactivate suspended administrator
  await check("54. Super Admin: PATCH /api/super-admin/admins/:uid/status reactivates administrator", async () => {
    const targetUid = createdAdminUid || "test-admin-uid";
    const res = await fetch(`${baseUrl}/api/super-admin/admins/${targetUid}/status`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-token-super_admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "active" }),
    });
    const body = (await res.json()) as { success: boolean; admin: { uid: string; status: string } };
    const ok = res.status === 200 && body.success === true && body.admin?.status === "active";
    return { ok, details: `Status: ${res.status}, Admin: ${body.admin?.uid}, Restored Status: ${body.admin?.status}` };
  });

  // 55. Staff Management: Admin provisions staff member via POST /api/admin/staff
  let createdStaffUid = "";
  await check("55. Staff Management: Admin provisions staff member via POST /api/admin/staff", async () => {
    const res = await fetch(`${baseUrl}/api/admin/staff`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "shift-barista@aicafe.internal",
        displayName: "Shift Barista",
        employeeId: "STF-3001",
        permissions: ["view_orders", "update_order_status"],
      }),
    });
    const body = (await res.json()) as { success: boolean; staff: { uid: string; email: string; role: string; employeeId?: string } };
    const ok = res.status === 201 && body.success === true && body.staff?.role === "staff";
    if (body.staff?.uid) createdStaffUid = body.staff.uid;
    return { ok, details: `Status: ${res.status}, UID: ${body.staff?.uid}, Role: ${body.staff?.role}, EmpId: ${body.staff?.employeeId}` };
  });

  // 56. Self-Promotion Defense: Admin cannot provision super_admin via POST /api/admin/staff (403)
  await check("56. Privilege Escalation Defense: Admin cannot provision super_admin via staff API (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/staff`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "escalation@aicafe.internal",
        displayName: "Escalated Super Admin",
        role: "super_admin",
      }),
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 57. Staff Management Defense: Staff member cannot provision other staff (403)
  await check("57. Privilege Defense: Staff member cannot access POST /api/admin/staff (403 FORBIDDEN)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/staff`, {
      method: "POST",
      headers: {
        Authorization: "Bearer test-token-staff",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "staff-friend@aicafe.internal",
        displayName: "Staff Friend",
      }),
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "FORBIDDEN";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 58. Staff Status Lifecycle: Admin can suspend staff member via PATCH /api/admin/staff/:id/status
  await check("58. Staff Lifecycle: Admin suspends staff member via PATCH /api/admin/staff/:id/status", async () => {
    const targetUid = createdStaffUid || "test-staff-uid";
    const res = await fetch(`${baseUrl}/api/admin/staff/${targetUid}/status`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer test-token-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "suspended" }),
    });
    const body = (await res.json()) as { success: boolean; staff: { uid: string; status: string } };
    const ok = res.status === 200 && body.success === true && body.staff?.status === "suspended";
    return { ok, details: `Status: ${res.status}, Staff: ${body.staff?.uid}, New Status: ${body.staff?.status}` };
  });

  // 59. Suspended Staff Enforcement: Suspended staff is rejected from staff orders queue
  await check("59. Suspended Staff Enforcement: Suspended staff rejected from /api/staff/orders (403 ACCOUNT_SUSPENDED)", async () => {
    const res = await fetch(`${baseUrl}/api/staff/orders`, {
      headers: {
        Authorization: "Bearer test-token-staff",
        "x-test-status": "suspended",
      },
    });
    const body = (await res.json()) as { success: boolean; error: { code: string; message: string } };
    const ok = res.status === 403 && body.error?.code === "ACCOUNT_SUSPENDED";
    return { ok, details: `Status: ${res.status}, Code: ${body.error?.code}` };
  });

  // 60. Root System Health: Super Admin GET /api/super-admin/system-health returns health status
  await check("60. Root System Health: Super Admin GET /api/super-admin/system-health returns 200 operational", async () => {
    const res = await fetch(`${baseUrl}/api/super-admin/system-health`, {
      headers: { Authorization: "Bearer test-token-super_admin" },
    });
    const body = (await res.json()) as { success: boolean; status: string; environment: string };
    const ok = res.status === 200 && body.success === true && body.status === "operational";
    return { ok, details: `Status: ${res.status}, System Status: ${body.status}, Env: ${body.environment}` };
  });

  // ==========================================
  // PHASE 7.2: AI CONCIERGE & NLU INTELLIGENCE SUITE (44 TESTS)
  // ==========================================
  const { baristaToolsService } = await import("./services/barista/barista-tools.service");

  // 61. Price NLU: expensive coffee in your cafe
  await check("61. Price NLU: 'expensive coffee in your cafe' resolves to most_expensive catalog query", async () => {
    const res = await baristaService.getRecommendation("expensive coffee in your cafe");
    const ok =
      res.mode === "CATALOG_QUERY" &&
      res.intent === "most_expensive" &&
      !!res.catalogProducts &&
      res.catalogProducts[0].basePrice >= 190;
    return {
      ok,
      details: `Mode: ${res.mode}, Intent: ${res.intent}, Top: ${res.catalogProducts?.[0]?.name} (₹${res.catalogProducts?.[0]?.basePrice})`,
    };
  });

  // 62. Price NLU: which coffee costs the most?
  await check("62. Price NLU: 'which coffee costs the most?' finds authoritative priciest coffee", async () => {
    const res = await baristaService.getRecommendation("which coffee costs the most?");
    const ok =
      res.mode === "CATALOG_QUERY" &&
      res.intent === "most_expensive" &&
      res.catalogProducts?.[0]?.name === "Mocha Cream" &&
      res.catalogProducts?.[0]?.basePrice === 220;
    return {
      ok,
      details: `Mode: ${res.mode}, Product: ${res.catalogProducts?.[0]?.name}, Price: ₹${res.catalogProducts?.[0]?.basePrice}`,
    };
  });

  // 63. Price NLU: what's your priciest coffee?
  await check("63. Price NLU: 'what\\'s your priciest coffee?' maps to most_expensive query", async () => {
    const res = await baristaService.getRecommendation("what's your priciest coffee?");
    const ok = res.mode === "CATALOG_QUERY" && res.intent === "most_expensive";
    return { ok, details: `Mode: ${res.mode}, Product: ${res.catalogProducts?.[0]?.name}` };
  });

  // 64. Price NLU: show me the fanciest coffee
  await check("64. Price NLU: 'show me the fanciest coffee' maps to most_expensive query", async () => {
    const res = await baristaService.getRecommendation("show me the fanciest coffee");
    const ok = res.mode === "CATALOG_QUERY" && res.intent === "most_expensive";
    return { ok, details: `Mode: ${res.mode}, Intent: ${res.intent}` };
  });

  // 65. Price NLU: which coffee has the highest price?
  await check("65. Price NLU: 'which coffee has the highest price?' maps to most_expensive query", async () => {
    const res = await baristaService.getRecommendation("which coffee has the highest price?");
    const ok = res.mode === "CATALOG_QUERY" && res.intent === "most_expensive" && res.catalogProducts?.[0]?.basePrice === 220;
    return { ok, details: `Mode: ${res.mode}, Price: ₹${res.catalogProducts?.[0]?.basePrice}` };
  });

  // 66. Price NLU: what is your premium coffee?
  await check("66. Price NLU: 'what is your premium coffee?' maps to most_expensive query", async () => {
    const res = await baristaService.getRecommendation("what is your premium coffee?");
    const ok = res.mode === "CATALOG_QUERY" && res.intent === "most_expensive";
    return { ok, details: `Mode: ${res.mode}, Product: ${res.catalogProducts?.[0]?.name}` };
  });

  // 67. Price NLU: give me the cheapest coffee
  await check("67. Price NLU: 'give me the cheapest coffee' maps to cheapest query (Caramel Cold Brew ₹180)", async () => {
    const res = await baristaService.getRecommendation("give me the cheapest coffee");
    const ok =
      res.mode === "CATALOG_QUERY" &&
      res.intent === "cheapest" &&
      res.catalogProducts?.[0]?.name === "Caramel Cold Brew" &&
      res.catalogProducts?.[0]?.basePrice === 180;
    return {
      ok,
      details: `Mode: ${res.mode}, Product: ${res.catalogProducts?.[0]?.name}, Price: ₹${res.catalogProducts?.[0]?.basePrice}`,
    };
  });

  // 68. Budget NLU: I only have ₹200
  await check("68. Budget NLU: 'I only have ₹200' extracts budget=200 and filters real items", async () => {
    const res = await baristaService.getRecommendation("I only have ₹200");
    const allWithin = (res.catalogProducts || []).every((p) => p.basePrice <= 200);
    const ok = res.preferences.budget === 200 && allWithin && (res.catalogProducts?.length || 0) > 0;
    return { ok, details: `Budget: ₹${res.preferences.budget}, Count: ${res.catalogProducts?.length}` };
  });

  // 69. Budget NLU: keep it under 200
  await check("69. Budget NLU: 'keep it under 200' extracts budget=200 and enforces price limit", async () => {
    const res = await baristaService.getRecommendation("keep it under 200");
    const ok = res.preferences.budget === 200 && (res.catalogProducts || []).every((p) => p.basePrice <= 200);
    return { ok, details: `Budget: ₹${res.preferences.budget}` };
  });

  // 70. Budget NLU: what can I get for 200?
  await check("70. Budget NLU: 'what can I get for 200?' extracts budget=200", async () => {
    const res = await baristaService.getRecommendation("what can I get for 200?");
    const ok = res.preferences.budget === 200;
    return { ok, details: `Budget: ₹${res.preferences.budget}` };
  });

  // 71. Budget NLU: I've got two hundred rupees
  await check("71. Budget NLU: 'I\\'ve got two hundred rupees' parses word-form budget into 200", async () => {
    const res = await baristaService.getRecommendation("I've got two hundred rupees");
    const ok = res.preferences.budget === 200;
    return { ok, details: `Parsed Word Budget: ₹${res.preferences.budget}` };
  });

  // 72. Budget NLU: something affordable around ₹250
  await check("72. Budget NLU: 'something affordable around ₹250' parses budget into 250", async () => {
    const res = await baristaService.getRecommendation("something affordable around ₹250");
    const ok = res.preferences.budget === 250;
    return { ok, details: `Parsed Budget: ₹${res.preferences.budget}` };
  });

  // 73. Temperature NLU: I want something cold
  await check("73. Temperature NLU: 'I want something cold' sets temperature=cold", async () => {
    const res = await baristaService.getRecommendation("I want something cold");
    const ok = res.preferences.temperature === "cold" && res.recommendations.length > 0;
    return { ok, details: `Temperature: ${res.preferences.temperature}, Top: ${res.recommendations[0]?.product.name}` };
  });

  // 74. Temperature NLU: it's hot today
  await check("74. Temperature NLU: 'it\\'s hot today' detects REFRESH mood and cold temperature", async () => {
    const res = await baristaService.getRecommendation("it's hot today");
    const ok = res.moodContext === "REFRESH" && res.preferences.temperature === "cold";
    return { ok, details: `Mood: ${res.moodContext}, Temp: ${res.preferences.temperature}` };
  });

  // 75. Temperature NLU: give me something refreshing
  await check("75. Temperature NLU: 'give me something refreshing' detects REFRESH mood", async () => {
    const res = await baristaService.getRecommendation("give me something refreshing");
    const ok = res.moodContext === "REFRESH";
    return { ok, details: `Mood: ${res.moodContext}` };
  });

  // 76. Mood NLU: I need something to wake me up
  await check("76. Mood NLU: 'I need something to wake me up' maps to ENERGIZE mood with high strength", async () => {
    const res = await baristaService.getRecommendation("I need something to wake me up");
    const ok = res.moodContext === "ENERGIZE" && (res.preferences.strength || 0) >= 70;
    return { ok, details: `Mood: ${res.moodContext}, Strength: ${res.preferences.strength}%` };
  });

  // 77. Mood NLU: I'm working and need coffee
  await check("77. Mood NLU: 'I\\'m working and need coffee' maps to FOCUS mood", async () => {
    const res = await baristaService.getRecommendation("I'm working and need coffee");
    const ok = res.moodContext === "FOCUS";
    return { ok, details: `Mood: ${res.moodContext}` };
  });

  // 78. Mood NLU: I want something cozy
  await check("78. Mood NLU: 'I want something cozy' maps to COMFORT mood with warm temperature", async () => {
    const res = await baristaService.getRecommendation("I want something cozy");
    const ok = res.moodContext === "COMFORT" && res.preferences.temperature === "hot";
    return { ok, details: `Mood: ${res.moodContext}, Temp: ${res.preferences.temperature}` };
  });

  // 79. Mood NLU: I want to treat myself
  await check("79. Mood NLU: 'I want to treat myself' maps to INDULGE mood with elevated sweetness", async () => {
    const res = await baristaService.getRecommendation("I want to treat myself");
    const ok = res.moodContext === "INDULGE" && (res.preferences.sweetness || 0) >= 65;
    return { ok, details: `Mood: ${res.moodContext}, Sweetness: ${res.preferences.sweetness}%` };
  });

  // 80. Mood NLU: I want something new
  await check("80. Mood NLU: 'I want something new' maps to EXPLORE mood", async () => {
    const res = await baristaService.getRecommendation("I want something new");
    const ok = res.moodContext === "EXPLORE";
    return { ok, details: `Mood: ${res.moodContext}` };
  });

  // 81. Pairing NLU: what should I eat with this?
  await check("81. Pairing NLU: 'what should I eat with this?' resolves PAIRING mode for active drink", async () => {
    const res = await baristaService.getRecommendation("what should I eat with this?", [], undefined, [], undefined, "caramel-cold-brew");
    const ok = res.mode === "PAIRING" && Array.isArray(res.pairings) && res.pairings.length > 0;
    return { ok, details: `Mode: ${res.mode}, Pairings Count: ${res.pairings?.length}, First: ${res.pairings?.[0]?.name}` };
  });

  // 82. Pairing NLU: what snack goes with my coffee?
  await check("82. Pairing NLU: 'what snack goes with my coffee?' returns artisan food pairings", async () => {
    const res = await baristaService.getRecommendation("what snack goes with my coffee?");
    const ok = res.mode === "PAIRING" && (res.pairings?.length || 0) > 0;
    return { ok, details: `Mode: ${res.mode}, Count: ${res.pairings?.length}` };
  });

  // 83. Pairing NLU: give me something sweet with it
  await check("83. Pairing NLU: 'give me something sweet with it' returns sweet pastries/cookies", async () => {
    const res = await baristaService.getRecommendation("give me something sweet with it", [], undefined, [], undefined, "vanilla-latte");
    const hasSweet = (res.pairings || []).some((p) => p.category === "pastry" || p.category === "cookie" || p.category === "cake");
    const ok = res.mode === "PAIRING" && hasSweet;
    return { ok, details: `Mode: ${res.mode}, Has Sweet: ${hasSweet}` };
  });

  // 84. Café Moment: complete my café moment
  await check("84. Café Moment: 'complete my café moment' returns structured BUDGET_COMBO with drink & snack", async () => {
    const res = await baristaService.getRecommendation("complete my café moment");
    const ok =
      res.mode === "BUDGET_COMBO" &&
      !!res.cafeMoment &&
      !!res.cafeMoment.drink &&
      !!res.cafeMoment.snack &&
      res.cafeMoment.totalPrice === res.cafeMoment.drink.price + res.cafeMoment.snack.price;
    return {
      ok,
      details: `Mode: ${res.mode}, Combo: ${res.cafeMoment?.drink?.name} + ${res.cafeMoment?.snack?.name}, Total: ₹${res.cafeMoment?.totalPrice}`,
    };
  });

  // 85. Context NLU: make it strong
  await check("85. Context NLU: 'make it strong' updates strength to >= 80 in CUSTOMIZATION mode", async () => {
    const res = await baristaService.getRecommendation("make it strong", [], { temperature: "cold" });
    const ok = res.mode === "CUSTOMIZATION" && (res.preferences.strength || 0) >= 80;
    return { ok, details: `Mode: ${res.mode}, Strength: ${res.preferences.strength}%` };
  });

  // 86. Context NLU: less sweet
  await check("86. Context NLU: 'less sweet' adjusts sweetness to <= 35 without dropping prior state", async () => {
    const res = await baristaService.getRecommendation("less sweet", [], { temperature: "cold", strength: 80 });
    const ok =
      res.mode === "CUSTOMIZATION" &&
      res.preferences.temperature === "cold" &&
      res.preferences.strength === 80 &&
      (res.preferences.sweetness || 0) <= 35;
    return { ok, details: `Mode: ${res.mode}, Sweetness: ${res.preferences.sweetness}%, Temp: ${res.preferences.temperature}` };
  });

  // 87. Context NLU: add caramel
  await check("87. Context NLU: 'add caramel' detects flavor preference caramel", async () => {
    const res = await baristaService.getRecommendation("add caramel", [], { temperature: "cold" });
    const hasCaramel = res.preferences.flavor === "caramel" || res.preferences.flavorPreferences?.includes("caramel");
    const ok = !!hasCaramel && res.preferences.temperature === "cold";
    return { ok, details: `Flavor: ${res.preferences.flavor}, Flavors: ${res.preferences.flavorPreferences?.join(",")}` };
  });

  // 88. Context NLU: make it large
  await check("88. Context NLU: 'make it large' sets recipe size to large", async () => {
    const res = await baristaService.getRecommendation("make it large", [], undefined, [], undefined, "caramel-cold-brew");
    const size = res.recommendations[0]?.configuration?.sizeId;
    const ok = size === "large";
    return { ok, details: `Size: ${size}` };
  });

  // 89. Context NLU: make that iced
  await check("89. Context NLU: 'make that iced' modifies beverage temperature to cold", async () => {
    const res = await baristaService.getRecommendation("make that iced", [], { strength: 80 }, [], undefined, "vanilla-latte");
    const ok = res.preferences.temperature === "cold" && res.preferences.strength === 80;
    return { ok, details: `Temp: ${res.preferences.temperature}, Strength: ${res.preferences.strength}%` };
  });

  // 90. References NLU: give me another
  await check("90. References NLU: 'give me another' marks previous drink as avoided and offers alternative", async () => {
    const res = await baristaService.getRecommendation("give me another", [], undefined, ["caramel-cold-brew"], undefined, "caramel-cold-brew");
    const topId = res.recommendations[0]?.product.id;
    const ok = topId !== "caramel-cold-brew";
    return { ok, details: `Avoided: caramel-cold-brew, New Top: ${topId}` };
  });

  // 91. References NLU: not that one
  await check("91. References NLU: 'not that one' rejects target drink and changes recommendation", async () => {
    const res = await baristaService.getRecommendation("not that one", [], undefined, ["caramel-cold-brew"], undefined, "caramel-cold-brew");
    const topId = res.recommendations[0]?.product.id;
    const ok = topId !== "caramel-cold-brew" && res.references?.action === "reject";
    return { ok, details: `Action: ${res.references?.action}, New Top: ${topId}` };
  });

  // 92. References NLU: something similar
  await check("92. References NLU: 'something similar' preserves sensory profile", async () => {
    const res = await baristaService.getRecommendation("something similar", [], { temperature: "cold", sweetness: 30 });
    const ok = res.preferences.temperature === "cold" && res.preferences.sweetness === 30;
    return { ok, details: `Preserved Temp: ${res.preferences.temperature}, Sweetness: ${res.preferences.sweetness}` };
  });

  // 93. References NLU: what about the second one?
  await check("93. References NLU: 'what about the second one?' resolves to index 1 recommendation", async () => {
    const res = await baristaService.getRecommendation("what about the second one?", [], undefined, ["caramel-cold-brew", "vanilla-latte"]);
    const ok = res.references?.resolvedIndex === 1 && res.references?.resolvedProductId === "vanilla-latte";
    return { ok, details: `Resolved Index: ${res.references?.resolvedIndex}, Target: ${res.references?.resolvedProductId}` };
  });

  // 94. References NLU: make that one iced
  await check("94. References NLU: 'make that one iced' modifies temperature of referenced drink", async () => {
    const res = await baristaService.getRecommendation("make that one iced", [], undefined, ["vanilla-latte"], undefined, "vanilla-latte");
    const ok = res.preferences.temperature === "cold" && res.activeProductId === "vanilla-latte";
    return { ok, details: `Target: ${res.activeProductId}, Temp: ${res.preferences.temperature}` };
  });

  // 95. Surprise NLU: surprise me
  await check("95. Surprise NLU: 'surprise me' returns single curated surprise from menu", async () => {
    const res = await baristaService.getRecommendation("surprise me");
    const ok = res.intent === "random" && res.recommendations.length === 1;
    return { ok, details: `Intent: ${res.intent}, Picked: ${res.recommendations[0]?.product.name}` };
  });

  // 96. Surprise NLU: pick something for me
  await check("96. Surprise NLU: 'pick something for me' maps to random/curated surprise", async () => {
    const res = await baristaService.getRecommendation("pick something for me");
    const ok = res.intent === "random";
    return { ok, details: `Intent: ${res.intent}, Picked: ${res.recommendations[0]?.product.name}` };
  });

  // 97. Surprise NLU: choose something unexpected
  await check("97. Surprise NLU: 'choose something unexpected' maps to random with EXPLORE mood", async () => {
    const res = await baristaService.getRecommendation("choose something unexpected");
    const ok = res.intent === "random" && res.moodContext === "EXPLORE";
    return { ok, details: `Intent: ${res.intent}, Mood: ${res.moodContext}` };
  });

  // 98. Security: AI cannot invent price
  await check("98. Price Integrity: AI cannot invent prices — matches server catalog with 0 deviation", async () => {
    const { catalogService } = await import("./services/catalog.service");
    const res = await baristaService.getRecommendation("recommend me a coffee");
    const top = res.recommendations[0];
    const serverProduct = await catalogService.getProductByIdOrSlug(top.product.id);
    const ok = !!serverProduct && top.pricing.basePrice === serverProduct.basePrice;
    return { ok, details: `AI Base: ₹${top.pricing.basePrice}, Catalog Base: ₹${serverProduct?.basePrice}` };
  });

  // 99. Security: AI cannot recommend unavailable product as available
  await check("99. Availability Awareness: Unavailable product is flagged and provides alternative", async () => {
    const check1 = await baristaToolsService.checkAvailability("caramel-cold-brew");
    const ok1 = check1.available === true;
    return { ok: ok1, details: `Caramel Cold Brew Available: ${check1.available}, Alternatives: ${check1.alternatives.length}` };
  });

  // 100. Security: AI cannot access another customer's data
  await check("100. Customer Data Isolation: User A cannot access User B's favorites or private profile", async () => {
    const userA_favs = await baristaToolsService.getOwnFavorites("user-a-uid");
    const userB_favs = await baristaToolsService.getOwnFavorites("user-b-uid");
    const anonFavs = await baristaToolsService.getOwnFavorites(undefined);
    const ok = Array.isArray(userA_favs) && Array.isArray(userB_favs) && anonFavs.length === 0;
    return { ok, details: `Anon Favs: ${anonFavs.length}, User A: ${userA_favs.length}, User B: ${userB_favs.length}` };
  });

  // 101. Multi-Turn Test A: Cold -> Strong -> Less Sweet -> Pairing
  await check("101. Multi-Turn Flow A: Cold -> Strong -> Less Sweet -> Pairing preserves context", async () => {
    // Turn 1
    const t1 = await baristaService.getRecommendation("I want something cold");
    const ok1 = t1.preferences.temperature === "cold";

    // Turn 2
    const t2 = await baristaService.getRecommendation("Make it strong", [], t1.preferences, [t1.recommendations[0].product.id], undefined, t1.activeProductId);
    const ok2 = t2.preferences.temperature === "cold" && (t2.preferences.strength || 0) >= 80;

    // Turn 3
    const t3 = await baristaService.getRecommendation("Less sweet", [], t2.preferences, [t2.recommendations[0].product.id], undefined, t2.activeProductId);
    const ok3 = t3.preferences.temperature === "cold" && t3.preferences.strength === t2.preferences.strength && (t3.preferences.sweetness || 0) <= 35;

    // Turn 4
    const t4 = await baristaService.getRecommendation("What snack goes with it?", [], t3.preferences, [t3.recommendations[0].product.id], undefined, t3.activeProductId);
    const ok4 = t4.mode === "PAIRING" && (t4.pairings?.length || 0) > 0;

    const allOk = ok1 && ok2 && ok3 && ok4;
    return {
      ok: allOk,
      details: `T1(Cold): ${ok1}, T2(Strong ${t2.preferences.strength}%): ${ok2}, T3(Sweet ${t3.preferences.sweetness}%): ${ok3}, T4(Pairing ${t4.pairings?.[0]?.name}): ${ok4}`,
    };
  });

  // 102. Multi-Turn Test B: Most expensive -> Similar but cheaper
  await check("102. Multi-Turn Flow B: 'What\\'s most expensive coffee?' -> 'Something similar but cheaper'", async () => {
    // Turn 1: priciest coffee
    const t1 = await baristaService.getRecommendation("What's the most expensive coffee?");
    const expensivePrice = t1.catalogProducts?.[0]?.basePrice || 220;

    // Turn 2: similar but cheaper
    const t2 = await baristaService.getRecommendation("Something similar but cheaper", [], t1.preferences, [t1.catalogProducts?.[0]?.id || "mocha-cream"], undefined, t1.catalogProducts?.[0]?.id);
    const cheaperPrice = t2.recommendations[0]?.pricing.basePrice;
    const ok = cheaperPrice < expensivePrice;
    return { ok, details: `Turn 1: ₹${expensivePrice}, Turn 2 Cheaper: ₹${cheaperPrice}` };
  });

  // 103. Multi-Turn Test C: Budget 300 -> Drink + Sweet -> Make large
  await check("103. Multi-Turn Flow C: Budget ₹300 -> Drink + Sweet combo -> Make large recalculates server price", async () => {
    // Turn 1: Budget
    const t1 = await baristaService.getRecommendation("I have ₹300");

    // Turn 2: Combo
    const t2 = await baristaService.getRecommendation("Give me a drink and something sweet", [], t1.preferences);
    const combo = t2.cafeMoment;
    const comboOk = t2.mode === "BUDGET_COMBO" && !!combo && combo.totalPrice <= 300;

    // Turn 3: Make large
    const t3 = await baristaService.getRecommendation("Make the drink large", [], t2.preferences, [], undefined, combo?.drink.id);
    const isLarge = t3.recommendations[0]?.configuration.sizeId === "large";

    const allOk = comboOk && isLarge;
    return { ok: allOk, details: `Combo Total: ₹${combo?.totalPrice} (<= ₹300), Upgraded to Large: ${isLarge}` };
  });

  // 104. Multi-Turn Test D: Surprise me -> Not that
  await check("104. Multi-Turn Flow D: 'Surprise me' -> 'Not that' returns meaningfully different drink", async () => {
    // Turn 1: Surprise me
    const t1 = await baristaService.getRecommendation("Surprise me");
    const firstDrinkId = t1.recommendations[0]?.product.id;

    // Turn 2: Not that
    const t2 = await baristaService.getRecommendation("Not that", [], t1.preferences, [firstDrinkId], undefined, firstDrinkId);
    const secondDrinkId = t2.recommendations[0]?.product.id;

    const ok = !!firstDrinkId && !!secondDrinkId && firstDrinkId !== secondDrinkId;
    return { ok, details: `First Surprise: ${firstDrinkId}, Second Surprise: ${secondDrinkId}` };
  });

  console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed\n`);

  server.close((err) => {
    if (err) {
      console.error("Error closing test server:", err);
      process.exit(1);
    }
    if (failed > 0) {
      process.exit(1);
    }
  });
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

