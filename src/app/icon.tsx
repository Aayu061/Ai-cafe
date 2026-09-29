import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "#2A1810",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#C98A4A",
          borderRadius: "50%",
          border: "1.5px solid #C98A4A",
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        ☕
      </div>
    ),
    {
      ...size,
    }
  );
}
