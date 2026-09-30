import { NextResponse } from "next/server";
import { APPROVED_DRINKS } from "@/lib/constants";

/**
 * Next.js Edge / Server Handler for /api/products
 * Serves the authoritative 25-drink catalog directly from Next.js with zero cross-origin latency,
 * eliminating all client-side CORS errors when the remote backend is waking or sleeping.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        products: APPROVED_DRINKS,
        count: APPROVED_DRINKS.length,
      },
      products: APPROVED_DRINKS,
      count: APPROVED_DRINKS.length,
      source: "nextjs-edge-catalog",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-guest-session-id",
    },
  });
}
