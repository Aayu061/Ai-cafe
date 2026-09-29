import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "AI CAFÉ — Your Drink. Your Way.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#180C06",
          backgroundImage: "radial-gradient(circle at 50% 30%, #351C10 0%, #180C06 70%, #0D0502 100%)",
          color: "#F8F3EA",
          fontFamily: "serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Subtle decorative border ring */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "1px solid rgba(201, 138, 74, 0.25)",
            borderRadius: "28px",
          }}
        />

        {/* Brand Eyebrow Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 24px",
            borderRadius: "9999px",
            backgroundColor: "rgba(201, 138, 74, 0.15)",
            border: "1px solid rgba(201, 138, 74, 0.4)",
            fontSize: "16px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#C98A4A",
            marginBottom: "32px",
            fontFamily: "sans-serif",
          }}
        >
          Specialty Coffee & AI Craft
        </div>

        {/* Main Brand Title */}
        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#FAF6F0",
            marginBottom: "16px",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          AI CAFÉ
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "36px",
            fontStyle: "italic",
            color: "#E2D3BE",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          Your Drink. Your Way.
        </div>

        {/* Supporting description */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(248, 243, 234, 0.75)",
            maxWidth: "750px",
            textAlign: "center",
            lineHeight: 1.5,
            fontFamily: "sans-serif",
          }}
        >
          Crafted by AI. Inspired by You. Slow-steeped cold brew, espresso craft, and real-time custom drink design.
        </div>

        {/* Footer brand signature */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "14px",
            color: "rgba(248, 243, 234, 0.5)",
            fontFamily: "sans-serif",
            letterSpacing: "1px",
          }}
        >
          <span>142 Artisan Boulevard</span>
          <span>•</span>
          <span>ai-cafe-zeta.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
