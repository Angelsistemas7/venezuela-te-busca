# Estado actual y continuación — "El Mundo Te Busca"

Plataforma ciudadana, sin fines de lucro, para localizar personas desaparecidas y
coordinar ayuda tras el **terremoto de Venezuela 2026**. Producto y comunicación en
**español**. LEE primero `CLAUDE.md` y `docs/ESTADO-DEL-PROYECTO.md`.
`npm run build` debe quedar **verde** siempre. Sé eficiente con los tokens.

## En producción
- Dominio **conectado**: `elmundotebusca.com` (Namecheap DNS → Vercel, SSL activo).
  Variable `NEXT_PUBLIC_SITE_URL=https://elmundotebusca.com` puesta en Vercel.
  Turnstile con los hostnames del dominio + `venezuela-te-busca.vercel.app` + `localhost`.
- Slug interno del proyecto Vercel sigue siendo `venezuela-te-busca` (no se toca; el dominio lo tapa).
- Supabase en vivo; falta importar el export AUTORIZADO de personas del dueño.

## Hecho recientemente (ya en código, build verde)
- **Marca "El Mundo Te Busca"** en toda la app + **logo** (`public/logo.png`) en header,
  footer, favicon (`src/app/icon.svg`, ya no dice "VE") y en la **imagen social** rediseñada
  (`opengraph-image.tsx`, fondo oscuro + logo en tarjeta). Header con "El Mundo" sobre "Te Busca".
- **Patrocinadores** en el pie (sección "Con el apoyo de"), lado a lado con divisor:
  **Sentra Labs** (logo `public/logo-light.webp`, enlaza a https://sentralabs.co/, con descripción)
  e **INN Clusion** (`public/INNClusion.jpeg`, con descripción). NO usar emoji de bandera 🇻🇪
  (en Windows se ve como "VE").
- **Inicio:** las 8 cifras son un **carrusel que se desliza solo** en móvil (CSS `.animate-marquee`,
  sin JS); rejilla de 8 en escritorio. Cifras del sismo en **caja pequeña** debajo. Secciones por
  edad como **carrusel horizontal**. Quitado el mensaje "Asistente". Buscador/filtros/botón más
  pequeños en móvil. Barra "¿Estás en la zona…?" compacta.
- **Noticias:** "prensa mundial" ahora en vivo desde **Google Noticias** (RSS, real, con enlace;
  `getWorldPress` en `lib/news.ts`). **Historias destacadas** con 3 fotos + enlace arriba
  (`FeaturedNews.tsx`, imágenes en `public/noticias/`). Cifras del sismo movidas al inicio.
- **Mapa:** una sola alerta de rescate; arreglada la geocodificación que tiraba puntos al **agua**
  (jitter solo hacia el sur; se quitó "vargas" de `SECTOR_COORDS` —era calle de Maracay— y se
  añadió maracay/valencia).

## Pendientes
- **Texto de compartir largo:** el dueño quiere un texto "sección por sección" para pegar junto al
  enlace (ya se le pasó en el chat; valorar dejarlo en un doc o botón "Copiar").
- Importar personas (export autorizado). Confirmar teléfonos de emergencia. Rotar `service_role`.
- Opcional: streaming (Suspense) en Noticias para que los feeds en vivo no bloqueen.
