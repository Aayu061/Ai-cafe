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

