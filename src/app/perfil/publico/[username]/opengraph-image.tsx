import { ImageResponse } from "next/og";
import { getPublicProfileByUsername } from "@/lib/auth";
import { getDigitalVolunteerStats } from "@/lib/data";
import { getLogoDataUrl, toEmbeddablePhoto } from "@/lib/ogImage";

// Tarjeta que se ve al compartir un perfil de voluntario digital (WhatsApp,
// redes): foto de quien comparte (si tiene) + sus estadísticas reales +
// invitación a sumarse. Mismo patrón que persona/mascota, cacheada 1 hora por
// la misma razón (ver esos archivos): sin esto se regenera con sharp en cada
// reenvío, compitiendo por CPU con el único proceso Node del VPS.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function VolunteerProfileOpengraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  const stats = profile ? await getDigitalVolunteerStats(profile.id) : null;
  const logoSrc = await getLogoDataUrl();
  const photoSrc = profile?.avatarUrl ? await toEmbeddablePhoto(profile.avatarUrl) : null;

  const displayName = profile?.username ?? "Voluntario digital";
  const total = stats
    ? stats.publications + stats.commentsMade + stats.reactionsReceived + stats.commentsReceived + stats.savedByOthers
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #0f172a 100%)",
          padding: "56px 64px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={100}
          height={100}
          alt=""
          style={{
            position: "absolute",
            top: "40px",
            right: "56px",
            borderRadius: "22px",
            boxShadow: "0 14px 32px rgba(0,0,0,0.4)",
          }}
        />

        {/* Foto de quien comparte (o sus iniciales) a la izquierda. */}
        <div
          style={{
            display: "flex",
            width: "340px",
            height: "100%",
            borderRadius: "28px",
            overflow: "hidden",
            flexShrink: 0,
            background: "#134e4a",
            border: "6px solid #34d399",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} width={328} height={506} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ display: "flex", fontSize: "140px", fontWeight: 800, color: "#6ee7b7" }}>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Texto y estadísticas a la derecha. */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: "52px" }}>
          <div style={{ display: "flex", fontSize: "26px", fontWeight: 700, color: "#6ee7b7" }}>
            Voluntario digital de El Mundo Te Busca
          </div>
          <div style={{ display: "flex", marginTop: "16px", fontSize: "54px", fontWeight: 800, color: "#ffffff" }}>
            {displayName}
          </div>

          <div style={{ display: "flex", marginTop: "28px", gap: "18px" }}>
            {stats && (
              <>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: "40px", fontWeight: 800, color: "#ffffff" }}>
                    {stats.publications}
                  </div>
                  <div style={{ display: "flex", fontSize: "18px", color: "#a7f3d0" }}>Publicaciones</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: "40px", fontWeight: 800, color: "#ffffff" }}>
                    {stats.reactionsReceived}
                  </div>
                  <div style={{ display: "flex", fontSize: "18px", color: "#a7f3d0" }}>Reacciones recibidas</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: "40px", fontWeight: 800, color: "#ffffff" }}>
                    {total}
                  </div>
                  <div style={{ display: "flex", fontSize: "18px", color: "#a7f3d0" }}>Impacto total</div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", marginTop: "32px", fontSize: "30px", color: "#d1fae5", lineHeight: 1.35 }}>
            Quiero invitarte a que también seas voluntario digital: juntos podemos salvar más vidas.
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontSize: "24px", fontWeight: 600, color: "#a7f3d0" }}>
            elmundotebusca.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
