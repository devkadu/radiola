import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Segunda Temporada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "#c8f565",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 30 30" fill="none">
              <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a" />
              <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#F5F0E8", lineHeight: 1.1 }}>
              Segunda
            </span>
            <span style={{ fontSize: 52, fontWeight: 800, color: "#F5F0E8", lineHeight: 1.1 }}>
              Temporada
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 26, color: "rgba(245,240,232,0.5)", margin: 0, letterSpacing: 1 }}>
          Debate cada episódio da sua série favorita
        </p>

        {/* URL */}
        <p style={{ fontSize: 18, color: "#c8f565", marginTop: 24, opacity: 0.7 }}>
          segundatemporada.com.br
        </p>
      </div>
    ),
    { ...size }
  );
}
