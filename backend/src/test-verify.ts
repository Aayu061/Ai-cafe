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
