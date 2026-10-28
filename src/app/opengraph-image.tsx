import { ImageResponse } from "next/og";

export const alt = "Segunda Temporada — Acabou o episódio. A conversa começa aqui.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OgImage = () =>
  new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 56,
        background: "#0a0a0a",
        color: "#f5f0e8",
        fontFamily: "sans-serif",
        backgroundImage: "radial-gradient(ellipse at 100% 0%, #243018 0%, #0a0a0a 65%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 58,
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#c8f565",
            borderRadius: 15,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 30 30" fill="none">
            <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a" />
            <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)" />
          </svg>
        </div>
        <span style={{ fontSize: 30, fontWeight: 700 }}>Segunda Temporada</span>
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 770 }}>
          <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2 }}>
            Acabou o episódio.
          </span>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -2,
              color: "#c8f565",
            }}
          >
            A conversa começa aqui.
          </span>
          <span style={{ marginTop: 28, fontSize: 25, color: "#b6b5ae", lineHeight: 1.5 }}>
            Teorias, recomendações e debates.
          </span>
          <span style={{ fontSize: 25, color: "#b6b5ae", lineHeight: 1.5 }}>
            No seu ritmo. No seu nível de spoiler.
          </span>
        </div>

        <div style={{ display: "flex", width: 270, height: 240, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 240,
              height: 140,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              background: "#171e12",
              border: "1px solid #3a492b",
              borderRadius: "22px 22px 6px 22px",
              transform: "rotate(-6deg)",
            }}
          >
            <span style={{ color: "#c8f565", fontSize: 18, fontWeight: 700 }}>
              Qual é a sua teoria?
            </span>
            <div
              style={{
                display: "flex",
                width: 164,
                height: 8,
                background: "#3b4830",
                borderRadius: 8,
              }}
            />
            <div
              style={{
                display: "flex",
                width: 112,
                height: 8,
                background: "#3b4830",
                borderRadius: 8,
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 220,
              height: 116,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              background: "#c8f565",
              borderRadius: "22px 22px 22px 6px",
              transform: "rotate(5deg)",
            }}
          >
            <span style={{ color: "#0a0a0a", fontSize: 18, fontWeight: 700 }}>
              A conversa continua.
            </span>
            <div
              style={{
                display: "flex",
                width: 138,
                height: 8,
                background: "#93b34e",
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "1px solid #2b3323",
        }}
      >
        <span style={{ fontSize: 22, color: "#b6b5ae" }}>segundatemporada.com.br</span>
        <span style={{ fontSize: 20, color: "#c8f565" }}>Entre na conversa</span>
      </div>
    </div>,
    size,
  );

export default OgImage;
