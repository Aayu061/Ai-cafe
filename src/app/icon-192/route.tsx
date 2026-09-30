import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * AI CAFÉ — 192×192 PWA App Icon
 * Served at /icon-192 for web manifest.
 */
export async function GET(_req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "192px",
          height: "192px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#3A2418",
          borderRadius: "42px",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 48 48"
          fill="none"
        >
          <path
            d="M13 10H33L30.8 35.2C30.6 37.8 28.5 39.8 25.9 39.8H20.1C17.5 39.8 15.4 37.8 15.2 35.2L13 10Z"
            stroke="#FFFDF8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.8 20C17.5 19.2 20.8 21.2 24.5 20.8C27.5 20.5 29.8 19.4 31.2 20L29.6 34.5C29.5 35.8 28.4 36.8 27.1 36.8H20.9C19.6 36.8 18.5 35.8 18.4 34.5L14.8 20Z"
            fill="#C98A4A"
          />
          <path
            d="M37 6C37 9.5 39.5 12 43 12C39.5 12 37 14.5 37 18C37 14.5 34.5 12 31 12C34.5 12 37 9.5 37 6Z"
            fill="#C98A4A"
          />
        </svg>
      </div>
    ),
    {
      width: 192,
      height: 192,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    }
  );
}
