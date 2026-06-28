# Prompt para continuar (pegar en un chat nuevo)

Eres agente de Claude Code en "Venezuela te busca" (plataforma del terremoto 2026).
Producto y comunicación en **español**. LEE primero `CLAUDE.md` y
`docs/ESTADO-DEL-PROYECTO.md`. `npm run build` debe quedar **verde**.

Reglas: NO inventes teléfonos ni atribuyas puntos/datos a medios sin confirmar
(va como "Por verificar"). El contenido vive en **DOS** sitios sincronizados:
`src/lib/seed.ts` (demo) y `supabase/seed-contenido.sql` (producción, idempotente
con `on conflict (id) do nothing`). Convención: tipo→zod→`data.ts` (memoria +
Supabase)→action→`schema.sql`+RLS→seed→build.

Ya hecho: personas, comunidad, hospitales, puntos de ayuda (+alojamiento y acopios
internacionales), caravanas, mapa, admin (verificar/gestores/fijar), denuncias,
mascotas, voluntarios, panel de cifras, sismos USGS, emergencias+guía, compartir WhatsApp.

## Falta (hazlo bien, por tandas con build verde)

**Ola 3 — Noticias / Ayuda humanitaria + Héroes.** Sección curada (sin publicaciones
del público), cada registro **cita su fuente**, con **like y comentarios**. Incluye:
ayuda internacional que llegó / va en camino / anunciada (Suiza, ONU/OCHA, Cuba,
Ecuador, México, España, El Salvador, Colombia, EE.UU., Argentina, India, Turquía,
Catar, Cruz Roja, Francia, Países Bajos, Alemania, Brasil, Chile, Canadá, Vaticano…),
"Últimas noticias" (titular + medio + hora), y **Héroes** (bomberos, policías, perros
rescatistas, grandes donantes). El usuario tiene los textos/fuentes; pídeselos o
reutiliza los del historial.

**Ola 4 — Mapa: capas "Necesito ayuda" / "Puedo ayudar".** Mostrar en el mapa los
posts tipo `necesito` y los voluntarios/`ofrezco`, ancladas a su ubicación, con
WhatsApp y "cómo llegar". Capas **activables/desactivables**. Reusa `lib/geo.ts`.
