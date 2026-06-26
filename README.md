# 🇻🇪 Venezuela te busca

Plataforma ciudadana, voluntaria y sin fines de lucro para **localizar personas
desaparecidas** y **coordinar ayuda** tras el terremoto de Venezuela 2026.

Construida para ser **gratuita**, **rápida** y **escalable** a cientos de miles de
registros, con un fuerte enfoque en **proteger a las personas** de información
falsa y abuso.

---

## ✨ Qué incluye

- **Registro de personas** con foto, cédula, edad, género, ubicación y descripción.
- **Búsqueda y filtros avanzados** (texto, estado/región, género, rango de edad,
  estado de localización, orden) sincronizados con la URL y **paginación en
  servidor** — no hay que bajar "centenares de páginas".
- **Personas sin identificar**: sección para buscar por foto/rasgos cuando no se
  conoce el nombre (p. ej. quien vio a alguien y no pudo preguntar quién era).
- **"Tengo información / marcar como localizado" con verificación**: ningún estado
  cambia automáticamente. Cada reporte queda **pendiente de verificación**, con
  contacto y relación de quien reporta, para frenar el abuso.
- **Puntos de ayuda**: donatones de comida, agua, refugios y medicinas, con foto y
  estado *verificado / por verificar*.
- **Marchas y caravanas**: convoca idas en grupo a la zona (salida, hora, destino).
- **Foro de comunidad** en cada ficha de persona y punto de ayuda.
- **Anti-bot con Cloudflare Turnstile** y validación estricta de datos (zod).

## 🧱 Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend + backend | **Next.js 15** (App Router, RSC, Server Actions) | Un solo proyecto, rápido, SEO, escalable |
| Estilos | **Tailwind CSS v4** | UI consistente y ligera |
| Base de datos | **Supabase (PostgreSQL)** | Gratis para empezar, índices y búsqueda full-text en español |
| Fotos | **Supabase Storage** | Subida directa desde el navegador |
| Anti-abuso | **Cloudflare Turnstile** | Verificación humana gratuita |
| Validación | **zod** | Integridad de datos en cliente y servidor |

Todo el stack tiene **nivel gratuito** suficiente para arrancar. Desplegando el
frontend en **Vercel** (gratis) + Supabase (gratis), el costo inicial es **0**.

---

## 🚀 Cómo ejecutarlo

```bash
npm install
npm run dev        # http://localhost:3000
```

> Sin configurar nada, la app arranca en **modo demostración** con datos de
> ejemplo en memoria, para que puedas verla y probarla de inmediato.

### Conectar la base de datos real (Supabase)

1. Crea un proyecto gratis en <https://app.supabase.com>.
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. En **Storage**, crea un bucket **público** llamado `photos`.
4. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (y `SUPABASE_SERVICE_ROLE_KEY` para verificación).
5. Reinicia `npm run dev`. La app dejará de usar datos de ejemplo y guardará todo
   en Supabase.

### Activar Cloudflare Turnstile (anti-bot)

1. Entra a <https://dash.cloudflare.com> → **Turnstile** → crea un widget.
2. Pon `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en `.env.local`.

Mientras no esté configurado, el formulario funciona sin bloquear (modo desarrollo).

---

## 📦 Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run typecheck  # verificar tipos
```

## 🗂️ Estructura

```
src/
  app/
    page.tsx               # Inicio: listado, búsqueda, filtros
    sin-identificar/       # Casos sin identificar
    ayuda/                 # Puntos de ayuda
    marchas/               # Marchas y caravanas
    persona/[id]/          # Ficha de persona + foro
    actions.ts             # Server Actions (validación + Turnstile + escritura)
  components/              # UI (tarjetas, modales, filtros, foro...)
  lib/
    types.ts               # Modelo de datos
    validation.ts          # Esquemas zod
    data.ts                # Acceso a datos (Supabase o memoria)
    supabase.ts            # Clientes Supabase
    seed.ts                # Datos de ejemplo
supabase/schema.sql        # Esquema PostgreSQL (índices + RLS)
```

## 🔐 Notas de seguridad y ética

- **Lectura pública, escritura controlada**: cualquiera puede publicar, pero los
  cambios de estado de una persona requieren verificación (no se hacen desde el
  cliente). Ver políticas RLS en `supabase/schema.sql`.
- Los datos publicados son **responsabilidad de quien los envía**. La plataforma
  no vende ni comparte información con terceros.
- Si vas a coordinar con registros oficiales (Protección Civil, Cruz Roja,
  bomberos), hazlo con su autorización y evita duplicar bases de datos
  desincronizadas: una sola fuente confiable ayuda más.

---

Hecho con el objetivo de ayudar a salvar vidas. 🤍
