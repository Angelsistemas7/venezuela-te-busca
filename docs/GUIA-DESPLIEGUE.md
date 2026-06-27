# 🚀 Guía paso a paso: poner la página en línea (gratis)

Tiempo estimado: **30–40 minutos**. Costo: **solo el dominio (~$10–15/año)**.
No necesitas VPS. No necesitas tarjeta para empezar (salvo el dominio).

Resultado final: tu página en `https://tudominio.com`, con base de datos real,
fotos y anti-bot.

---

## Paso 0 — Lo que vas a crear (todo gratis)

| Cuenta | Para qué | Link |
|--------|----------|------|
| GitHub | Guardar el código | https://github.com/signup |
| Supabase | Base de datos + fotos | https://supabase.com |
| Vercel | Publicar la web | https://vercel.com/signup |
| Cloudflare | Anti-bot (Turnstile) + dominio | https://dash.cloudflare.com/sign-up |

---

## Paso 1 — Subir el código a GitHub

1. Crea una cuenta en https://github.com/signup
2. Instala GitHub Desktop (https://desktop.github.com) — es lo más fácil.
3. En GitHub Desktop: **File → Add Local Repository** → elige la carpeta
   `venezuelatebusca`. Acepta crear el repositorio.
4. Pon un nombre, deja **Keep this code private** marcado, y pulsa
   **Publish repository**.

> El código ya incluye un `.gitignore` correcto (no sube `node_modules` ni claves).

---

## Paso 2 — Crear la base de datos en Supabase

1. Entra a https://supabase.com → **Start your project** → inicia sesión con GitHub.
2. **New project**. Elige nombre, una contraseña fuerte para la base de datos y la
   región más cercana (ej. *East US*). Espera ~2 min a que se cree.
3. En el menú izquierdo, **SQL Editor → New query**. Abre el archivo
   [`supabase/schema.sql`](../supabase/schema.sql), copia **todo** su contenido,
   pégalo y pulsa **Run**. Debe decir *Success*.
   - **Contenido inicial (recomendado):** abre **New query** otra vez, pega TODO
     [`supabase/seed-contenido.sql`](../supabase/seed-contenido.sql) y pulsa **Run**.
     Carga hospitales, puntos de ayuda y publicaciones para que el sitio no salga
     vacío. Es re-ejecutable (no duplica). ⚠️ Confirma los teléfonos de hospitales y
     los puntos de acopio internacionales antes de promocionarlos.
4. **Storage → New bucket**. Nombre: `photos`. Marca **Public bucket**.
   - En **Additional configuration** (o después en *Settings* del bucket) pon:
     **Restrict file MIME types** = `image/jpeg, image/png, image/webp` y
     **File size limit** = `8 MB`. *(Evita que suban archivos peligrosos —p. ej.
     SVG con scripts— o enormes; es el control de seguridad clave de las fotos.)*
   - Crear. Luego entra al bucket `photos` → **Policies** → crea una policy de tipo
     **INSERT** para el rol `anon` (así la web puede subir fotos). Plantilla
     *"Allow uploads"* con `true`. *(El tipo y el tamaño ya quedan limitados por el
     paso anterior.)*
5. **Project Settings (⚙️) → API**. Copia estos 3 valores (los usarás en el Paso 4):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreto) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Paso 3 — Anti-bot con Cloudflare Turnstile (gratis)

1. Entra a https://dash.cloudflare.com → **Turnstile → Add widget**.
2. Domain: pon tu dominio (y `localhost` para pruebas). Widget mode: **Managed**.
3. Copia:
   - **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret Key** → `TURNSTILE_SECRET_KEY`

---

## Paso 4 — Publicar en Vercel

1. Entra a https://vercel.com/signup → inicia sesión con GitHub.
2. **Add New → Project** → importa tu repositorio `venezuelatebusca`.
3. Antes de pulsar Deploy, abre **Environment Variables** y pega estas
   (de los pasos 2 y 3). Inventa una contraseña para `ADMIN_TOKEN`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
   TURNSTILE_SECRET_KEY=...
   ADMIN_TOKEN=una-contraseña-larga-y-secreta
   ```
4. Pulsa **Deploy**. En ~2 min tendrás una URL `tu-proyecto.vercel.app`.
   Ábrela: ya NO dirá "modo demostración" y guardará datos reales.

---

## Paso 5 — Conectar tu dominio

1. Compra el dominio. Opciones baratas y confiables:
   - **Cloudflare Registrar** (al costo, sin sobreprecio): https://dash.cloudflare.com → Domain Registration
   - **Namecheap**: https://www.namecheap.com
   - **Porkbun**: https://porkbun.com
2. En Vercel: **Project → Settings → Domains → Add** → escribe tu dominio.
3. Vercel te dirá qué registros DNS poner. En tu proveedor del dominio, añade esos
   registros (o, si compraste en Cloudflare, apunta el dominio según sus
   instrucciones). En minutos a 1 hora queda activo con HTTPS automático.

---

## Paso 6 — Cargar datos iniciales (opcional)

Si consigues un **export autorizado** (JSON/CSV) de registros, créalo en
`.env.local` con las mismas claves y ejecuta:

```bash
node scripts/import-data.mjs ./datos.json
```

Formato esperado documentado en [`scripts/import-data.mjs`](../scripts/import-data.mjs).

---

## 🔒 Seguridad (importante)

- **`ADMIN_TOKEN` y `TURNSTILE_SECRET_KEY` son obligatorios en producción.** Sin
  ellos, el panel `/admin` queda **cerrado** y los formularios **rechazan** los
  envíos. Es a propósito (*fail-closed*): así un despliegue mal configurado no deja
  la moderación abierta ni el sitio sin anti-bot.
- **`SUPABASE_SERVICE_ROLE_KEY` también es obligatoria:** las escrituras pasan por
  el servidor con esa clave. Ya **no** hay inserción pública con la clave anon
  (evita bots por REST y que se falsee la autoría).
- Si **actualizas** el proyecto, **vuelve a ejecutar `supabase/schema.sql`** en el
  SQL Editor (es idempotente): aplica los ajustes de RLS y las tablas/columnas nuevas.

---

## ✅ Listo

- Página pública con tu dominio y HTTPS.
- Base de datos real con fotos comprimidas.
- Anti-bot activo.
- Panel de moderación en `tudominio.com/admin` (entra con tu `ADMIN_TOKEN`).

**Cada vez que cambiemos algo**, basta con subir los cambios a GitHub
(GitHub Desktop → Commit → Push) y Vercel **vuelve a publicar solo** en ~1 min.

¿Costos recurrentes? Ver [COSTOS-Y-DESPLIEGUE.md](COSTOS-Y-DESPLIEGUE.md).
