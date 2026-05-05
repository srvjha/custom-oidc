import { ImageResponse } from "next/og";

export const alt = "srvAuth — Developer Console";
export const size = { width: 1200, height: 630 };
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
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(circle at 20% 20%, #1e293b 0%, #020617 55%, #000000 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "52px",
              fontWeight: 800,
              color: "#0b1020",
            }}
          >
            S
          </div>
          <div
            style={{
              fontSize: "40px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            srvAuth
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              backgroundImage:
                "linear-gradient(90deg, #ffffff 0%, #c7d2fe 60%, #a5b4fc 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Developer Console
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#94a3b8",
              lineHeight: 1.3,
              maxWidth: "950px",
            }}
          >
            Secure, modern identity platform — OIDC clients, tokens, and
            sessions for your apps.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "26px",
            color: "#64748b",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            <span>OIDC</span>
            <span>·</span>
            <span>OAuth 2.1</span>
            <span>·</span>
            <span>PKCE</span>
          </div>
          <div style={{ color: "#a5b4fc" }}>srvauth.dev</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
