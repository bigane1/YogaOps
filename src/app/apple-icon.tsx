import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          background: "#faf8f5",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            background: "#c9a0a0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 62,
            fontWeight: 600,
            color: "#faf8f5",
            fontFamily: "Georgia, serif",
          }}
        >
          Y
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#2d2a26",
            letterSpacing: "-0.02em",
            fontFamily: "Georgia, serif",
          }}
        >
          YogaOps
        </div>
      </div>
    ),
    { ...size },
  );
}
