import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPersonById } from "@/lib/data";
import { PERSON_STATUS_LABEL, type PersonStatus } from "@/lib/types";

// Tarjeta que se ve al compartir la ficha de una persona (WhatsApp, redes).
// A diferencia de la genérica del inicio, esta trae la FOTO real (si tiene) y
// un texto que invita a ayudar a localizarla — mucho más movilizador que solo
// el logo. Sin acentos: la fuente por defecto de ImageResponse no los trae.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_COLOR: Record<PersonStatus, string> = {
  por_localizar: "#f43f5e",
  hospitalizado: "#f59e0b",
  localizado: "#10b981",
  fallecido: "#71717a",
};

export default async function PersonOpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPersonById(id);
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  const fullName = person ? `${person.firstName} ${person.lastName}`.trim() : "";
  const displayName =
    person && person.isUnidentified && !fullName ? "Persona sin identificar" : fullName || "Persona desaparecida";
  const statusColor = person ? STATUS_COLOR[person.status] : STATUS_COLOR.por_localizar;
  const statusLabel = person ? PERSON_STATUS_LABEL[person.status] : "Se busca";
  const cta =
    person?.isUnidentified
      ? `Alguien vio a ${displayName === "Persona sin identificar" ? "esta persona" : displayName} y no se sabe quien es. Si la reconoces, avisa.`
      : `Ayudanos a localizar a ${displayName}. Sus familiares esperan verlo pronto.`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          padding: "56px 64px",
        }}
      >
        {/* Foto de la persona (o iniciales si no tiene) a la izquierda. */}
        <div
          style={{
            display: "flex",
            width: "420px",
            height: "100%",
            borderRadius: "28px",
            overflow: "hidden",
            flexShrink: 0,
            background: "#334155",
            border: `6px solid ${statusColor}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          {person?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photoUrl} width={408} height={506} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "160px",
                fontWeight: 800,
                color: "#94a3b8",
              }}
            >
              {displayName === "Persona sin identificar" ? "?" : displayName.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Texto a la derecha. */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: "52px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={48} height={48} alt="" />
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 700, color: "#fbbf24" }}>
              El Mundo Te Busca
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "28px",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: "9999px",
              background: statusColor,
              color: "#0f172a",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            {statusLabel}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "18px",
              fontSize: "58px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.08,
            }}
          >
            {displayName}
          </div>

          <div style={{ display: "flex", marginTop: "24px", fontSize: "30px", color: "#cbd5e1", lineHeight: 1.35 }}>
            {cta}
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontSize: "24px", fontWeight: 600, color: "#94a3b8" }}>
            elmundotebusca.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
