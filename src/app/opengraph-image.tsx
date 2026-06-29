import { ImageResponse } from "next/og";

// Tarjeta que se ve al compartir el enlace (WhatsApp, redes). Sin acentos a
// propósito: la fuente por defecto de ImageResponse no incluye glifos
// acentuados y saldrían cuadros. Next la cablea como og:image y twitter:image.
export const alt = "El Mundo Te Busca";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "120px",
              height: "120px",
              borderRadius: "28px",
              background: "#fbbf24",
              color: "#18181b",
              fontSize: "60px",
              fontWeight: 800,
            }}
          >
            EM
          </div>
          <div style={{ display: "flex", fontSize: "72px", fontWeight: 800, color: "#18181b" }}>
            El Mundo Te Busca
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "40px",
            fontSize: "36px",
            color: "#3f3f46",
            textAlign: "center",
            maxWidth: "920px",
            lineHeight: 1.3,
          }}
        >
          Localizar personas desaparecidas y coordinar ayuda tras el terremoto de Venezuela 2026
        </div>
        <div style={{ display: "flex", marginTop: "44px", fontSize: "26px", color: "#a16207" }}>
          Iniciativa ciudadana, voluntaria y sin fines de lucro
        </div>
      </div>
    ),
    { ...size },
  );
}
