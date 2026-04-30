import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "YogaOps - Yoga femmes, en ligne, sur place et entreprise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #f5f1f6 0%, #e8dff0 50%, #d4c5e8 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "#7c5cbf",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            YogaOps
          </div>

          <div
            style={{
              fontSize: "52px",
              fontWeight: "700",
              color: "#2d1f4a",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            Yoga pour femmes
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#5a4080",
              textAlign: "center",
              maxWidth: "750px",
              lineHeight: 1.4,
            }}
          >
            En ligne · Sur place · En entreprise
          </div>

          <div
            style={{
              marginTop: "16px",
              background: "#7c5cbf",
              color: "#fff",
              fontSize: "22px",
              fontWeight: "600",
              padding: "14px 36px",
              borderRadius: "50px",
            }}
          >
            Réserver un cours →
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "18px",
            color: "#7c5cbf",
            opacity: 0.7,
          }}
        >
          yogaops.fr
        </div>
      </div>
    ),
    { ...size },
  );
}
