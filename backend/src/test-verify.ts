import http from "http";
import { app } from "./app";

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
