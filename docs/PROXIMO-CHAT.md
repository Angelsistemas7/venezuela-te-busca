# Continuar en chat nuevo — "El Mundo Te Busca"

Eres agente de Claude Code en esta plataforma del terremoto de Venezuela 2026.
Español. LEE `CLAUDE.md` y `docs/ESTADO-DEL-PROYECTO.md`. `npm run build` debe quedar **verde**.
El proyecto está EN VIVO en `venezuela-te-busca.vercel.app` (Supabase + Vercel ya configurados;
claves en `.env.local`, gitignored). Sé eficiente con los tokens.

## 🎯 Tarea principal: cambiar el nombre a "El Mundo Te Busca"
Ya compraron el dominio **elmundotebusca.com**. Hay que renombrar la marca:
- "Venezuela te busca" → **"El Mundo Te Busca"** en toda la app (~25 sitios en 13 archivos):
  `layout.tsx` (metadata/OG), `SiteHeader.tsx` (la insignia "VE" → 🌍 o "EM"), `SiteFooter.tsx`,
  `ShareWhatsApp.tsx`, `opengraph-image.tsx`, `PersonReactions.tsx`, `lib/news.ts`, `lib/auth.ts`,
  `lib/seed.ts`, y las páginas `mapa/recursos/noticias`. Grep: `Venezuela te busca`.
- Añade un **subtítulo de contexto**: "Respuesta al terremoto de Venezuela 2026" (para no confundir).
- NO cambies el slug interno del repo/proyecto Vercel (`venezuela-te-busca`): el dominio lo tapa.
- Regenera los **4 documentos** del kit con el nombre nuevo (generador en el scratchpad: `kitgen/gen.js` y `gen2.js`; o reconstrúyelos).

## Conectar el dominio (lo hace el usuario, guíalo)
1. Vercel → proyecto → **Settings → Domains → Add** → `elmundotebusca.com` → poner los registros DNS que indique. HTTPS automático.
2. Variable en Vercel: `NEXT_PUBLIC_SITE_URL=https://elmundotebusca.com`.
3. Cloudflare Turnstile: agregar el hostname `elmundotebusca.com` al widget.

## Botón "Comunicados de prensa" (cuando esté el nombre)
- En **Noticias**, agregar botón/sección "Comunicados de prensa" que enlace al Drive:
  `https://drive.google.com/drive/folders/1gYrfCU85yJPWKEtim6mjAuSy4zDkP6Oj`
- Los 4 docs del kit están en `docs/kit-prensa/`.

## Pendientes menores
- **¿La reconoces?**: agregar filtro "por estado" (chips) y dejar claro que son personas **de las que
  no se tiene información**. Los chips de estado (localizado/hospitalizado/sin vida) ahí SÍ aplican
  (porque alguien las vio en ese estado). Es correcto como está; solo falta el filtro por estado + la nota.
- **Más personas**: el usuario pega nombre+datos y deja la foto en `fotos-personas/` (gitignored);
  se sube con un script: foto a Storage `photos/persons/` + insert en tabla `persons` (ver scripts
  usados antes). IDs fijos `e1000000-...`. Solo subir si tienen NOMBRE arriba.
- **Seguridad**: rotar la `service_role` de Supabase (se pegó en el chat). Confirmar teléfonos de emergencia.

## Hecho recientemente (ya en este commit)
- Cifras del inicio **clicables** (cada una a su filtro/sección).
- Portada "Se busca" limpia ahora lista por **grupos de edad** (Niñas/niños, Adolescentes, Jóvenes,
  Adultos, Adultos mayores) con "Ver todos" (`FeaturedSections`); se quitó la rejilla plana en esa vista.
- Fixes móviles: menú "Más" (Recursos visible), avisos reaparecen a los 60 s, "Recursos = de terceros".
