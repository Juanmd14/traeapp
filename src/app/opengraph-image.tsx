import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vadelivery — Marketplace de delivery local";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #FF4D3A 0%, #E63823 60%, #B91C1C 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#FFFFFF",
              color: "#FF4D3A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 40,
              letterSpacing: -1,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, opacity: 0.95 }}>
            Vadelivery
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Marketplace de delivery local
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              opacity: 0.92,
              maxWidth: 900,
            }}
          >
            Auth OTP · RLS en Postgres · Pagos con webhook firmado · Tracking
            realtime
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {["Next.js", "Supabase", "Mercado Pago", "TypeScript"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
