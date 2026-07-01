# Informe de seguridad — "El Mundo Te Busca"

Auditoría de seguridad defensiva realizada sobre el código de la plataforma.
Objetivo: que nadie pueda robar los datos (nombres, cédulas, fotos, teléfonos —
muchos de menores), republicar el contenido en bloque, ni tomar control de
funciones que no le corresponden (verificar personas, borrar publicaciones
ajenas, acceder al panel de moderación). Este documento es para que el equipo
técnico lo revise, discuta y decida qué queda pendiente.

Fecha de esta ronda: 2026-07-01. Stack: Next.js 15 (App Router, Server
Actions) + Supabase (Postgres + Storage + RLS) + Cloudflare Turnstile + zod.
Despliegue: VPS propio con nginx + PM2 (ver `docs/DESPLIEGUE-VPS.md`).

---

## 1) Resumen ejecutivo

La arquitectura de base es sólida: **no hay endpoints de API tipo REST/JSON
públicos** (no existe ninguna carpeta `src/app/api/*`); toda escritura pasa
por *Server Actions* de Next.js validadas con `zod`, y la base de datos tiene
Row Level Security (RLS) configurada para que la clave pública (`anon`) **solo
pueda leer**, nunca escribir — todas las inserciones/actualizaciones/borrados
los hace el servidor con la clave `service_role`, que nunca llega al
navegador.

En esta ronda se encontraron y corrigieron 4 huecos reales (ver §7). El
riesgo más grande de todos **no es de código, es operativo**: el `.env` del
VPS de producción todavía tiene el texto de ejemplo `pega-aqui` en 3
variables secretas (`SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`,
`ADMIN_TOKEN`). Mientras eso no se corrija con las claves reales, ninguna
otra protección de este informe es completamente efectiva (ver §7.0).

---

## 2) Sobre tu pregunta: "URLs que muestran datos en JSON"

Esto merece una explicación clara porque mezcla dos cosas distintas:

- **No existe ninguna URL tipo `/api/personas` que devuelva un JSON crudo con
  toda la base de datos.** Se buscó explícitamente (`src/app/api/**`) y no
  hay ninguna. Todo pasa por páginas React renderizadas en el servidor.
- **Pero toda página en Next.js sí incluye, dentro del HTML, un bloque de
  datos serializados (el "RSC payload")** que el navegador usa para hidratar
  la página sin volver a pedirle todo al servidor. Eso es **inevitable** en
  cualquier app moderna (React, Vue, Next, Nuxt, etc.) — no es un error de
  configuración, es cómo funciona el renderizado en el servidor. Lo que
  importa es que **ese bloque solo contenga lo que la página ya muestra
  públicamente** (nombres, fotos, estados — todo pensado para ser público,
  porque el propósito de la app es que se difunda) y **nunca** contenga
  claves, tokens de gestión de otras personas, contraseñas, ni columnas que
  no se muestran en pantalla. Se revisó y no se encontró ningún caso de
  sobre-exposición de campos (over-fetching) en las consultas a Supabase.
- **Lo que sí es real y vale la pena que el equipo entienda**: como no hay
  ninguna API "oficial" mal protegida, la única forma de descargar los datos
  en bloque sería *scrapear* las páginas públicas una por una (igual que
  cualquiera podría hacer con cualquier sitio web público). Contra eso no
  hay una solución 100% técnica — es información que la plataforma **existe
  para mostrar** (es un sitio de personas desaparecidas, tiene que ser
  público para servir). Las mitigaciones razonables son: Cloudflare delante
  del VPS (protección anti-bot/rate-limit a nivel de red, ver §6.6), Turnstile
  en las mutaciones (ya existe, evita que un bot *publique* en masa, aunque
  no evita que *lea* en masa), y monitoreo de tráfico anómalo.

---

## 3) Qué protege ya la arquitectura (verificado, sin tocar)

| Área | Estado | Detalle |
|---|---|---|
| Escrituras a la base de datos | ✅ Correcto | RLS: `anon` (clave pública, va al navegador) solo tiene políticas de `SELECT`. Todo `INSERT`/`UPDATE`/`DELETE` se hace con `service_role` desde el servidor (`supabase/schema.sql:426-449`). |
| Tablas de tokens secretos | ✅ Correcto | `person_owners` y `resource_owners` (los enlaces privados de gestión) **no tienen ninguna política de lectura pública** — ni siquiera con la clave `anon` se pueden leer. Solo el servidor, con `service_role`, los consulta. |
| Tabla de gestores delegados | ✅ Correcto | `resource_managers` sin políticas públicas — quién administra qué recurso no es información pública. |
| Contraseñas de usuario | ✅ Correcto | Las gestiona Supabase Auth (bcrypt); la app nunca las ve ni las guarda. |
| XSS por contenido de usuario | ✅ Correcto | Cero usos de `dangerouslySetInnerHTML` en todo el código. React escapa texto por defecto. |
| Enlaces externos (`linkUrl`, `whatsappUrl`, `sourceUrl`) | ✅ Correcto | Validados con un esquema `httpUrl` en `zod` que rechaza protocolos peligrosos (`javascript:`, `data:`, etc.). |
| Inyección SQL | ✅ Correcto | Todo el acceso a datos usa el cliente de Supabase (consultas parametrizadas), no hay concatenación de SQL en ningún lado. |
| CSRF | ✅ Correcto | Cubierto por el framework: Next.js valida el header `Origin` en cada Server Action automáticamente. |
| Subida de fotos | ✅ Correcto (si el bucket está bien configurado) | Cliente valida tipo MIME (`jpeg/png/webp`) y tamaño (8 MB) antes de subir; el bucket de Supabase Storage debe tener el mismo límite server-side (`docs/GUIA-DESPLIEGUE.md` lo documenta) — **confirmar que quedó así configurado en el proyecto real**, es la única defensa dura porque la clave `anon` sube directo al bucket. |
| Imágenes remotas (`next/image`) | ✅ Correcto | `remotePatterns` limitado a `*.supabase.co`/`*.supabase.in` — no se puede usar el optimizador de imágenes como proxy para cargar cualquier URL externa (evita SSRF vía esa vía). |
| Secretos en git | ✅ Correcto | Solo `.env.example` (vacío) está en el repositorio; ningún `.env` real se ha commiteado nunca (revisado el historial completo de git). |
| Turnstile fail-closed | ✅ Correcto | Si `TURNSTILE_SECRET_KEY` falta en **producción**, las acciones se **rechazan** (no se omite el chequeo) — evita quedar sin anti-bot por un despliegue mal configurado. |
| Servidor de Next.js no expuesto directo | ✅ Correcto | El proceso de Node (PM2) escucha solo en `127.0.0.1:3200`; solo nginx (con TLS) es accesible desde internet. |

---

## 4) Corregido en esta ronda (2026-07-01)

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | `addHospitalPatientAction` (agregar un paciente a un hospital) **no tenía Turnstile ni exigía sesión** — la única acción de creación de toda la app sin ninguna protección anti-bot. Cualquiera podía insertar nombre + **cédula real** + estado médico ("crítico"/"alta") de una persona, sin límite, de forma anónima y automatizable. | **Alta** | Se agregó Turnstile igual que en las otras 15 acciones de creación (`src/app/actions.ts`, `src/components/HospitalPatients.tsx`). |
| 2 | Login de `/admin` sin ningún freno de fuerza bruta — se podía probar contraseñas sin límite de intentos. | **Alta** (mientras el `ADMIN_TOKEN` real siga sin configurar en el VPS, ver §7.0) | Bloqueo de 15 minutos por IP tras 5 intentos fallidos (`src/lib/admin.ts`). |
| 3 | Cero cabeceras de seguridad HTTP en toda la app (sin `X-Frame-Options`) — la página, incluido `/admin`, se podía embeber en un `<iframe>` invisible de un sitio malicioso para un ataque de *clickjacking* (engañar a un moderador para que haga clic en un botón sin saberlo). | **Media** | Se agregaron `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy` (`next.config.ts`). |
| 4 | Generación del token de gestión (`newToken()`) tenía un respaldo débil con `Math.random()` si el `crypto` global no estaba disponible en el entorno de ejecución — ese token es lo único que protege que alguien edite/borre una persona, punto de ayuda, caravana, mascota o post ajeno. | **Baja** (el respaldo probablemente nunca se activaba con Node 20+, pero es una ambigüedad innecesaria en código crítico) | Se forzó el uso directo de `node:crypto` (`randomUUID()`), sin respaldo débil (`src/lib/data.ts`). |

---

## 5) Encontrado, NO corregido — para decisión del equipo

| # | Hallazgo | Severidad | Por qué no se tocó / qué falta decidir |
|---|---|---|---|
| A | Las acciones de "me gusta"/reacción (`likeAidPointAction`, `likeMarchAction`, `likeHospitalAction`, `likeHeroAction`, `likeNewsItemAction`, `likeCommentAction`, `reactToPostAction`) **no exigen sesión ni Turnstile**, y la deduplicación de "ya lo di like" es solo del lado del cliente (`localStorage`), no del servidor. Un script podría llamarlas en bucle e inflar cualquier contador artificialmente. | **Media-baja** | Impacto limitado (no hay fuga de datos, solo un número cosmético/de orden), pero corregirlo bien implica una decisión de diseño: ¿rate limiting por IP?, ¿exigir sesión para dar "me gusta" (cambiaría la experiencia actual, que es deliberadamente sin fricción)? |
| B | Ninguna otra Server Action pública (crear post, crear punto de ayuda, comentar, etc.) tiene límite de frecuencia (rate limiting) más allá de Turnstile. Turnstile evita bots simples, pero no evita que una persona real publique 50 veces seguidas. | **Baja** | Es un problema de "cuánto spam humano toleramos", no una falla de seguridad per se. Se podría añadir un límite simple (ej. "1 publicación cada X segundos por IP/sesión") si en producción se ve abuso real. |
| C | No hay Cloudflare (ni ningún WAF/CDN) delante del VPS — el dominio apunta directo a nginx. Esto significa: sin protección DDoS de capa de red, la IP del servidor es pública/descubrible, y no hay un anti-bot a nivel de red (solo el Turnstile que se ve en los formularios). | **Media** (depende del apetito de riesgo del equipo) | Recomendación: activar Cloudflare en modo proxy (nube naranja) para el dominio — es gratis en el plan básico, oculta la IP real del VPS y añade un filtro de bots antes de que el tráfico llegue al servidor. No se activó porque implica cambiar DNS, una decisión operativa que le corresponde al dueño. |
| D | `npm audit` reporta una vulnerabilidad moderada transitiva: `postcss` (vía una versión antigua empaquetada dentro de `next`) — XSS al convertir CSS a string. Es una herramienta de *build*, no de runtime; esta app no toma CSS de usuarios y lo convierte a texto, así que el impacto real es prácticamente nulo, pero conviene tenerlo en el radar. | **Baja/informativa** | Se resolvería solo actualizando Next.js a una versión mayor más adelante (es un cambio de versión con posibles breaking changes, no algo para hacer a la ligera). |
| E | No hay un firewall a nivel de sistema operativo (`ufw`/`iptables`) documentado en `docs/DESPLIEGUE-VPS.md` — el riesgo real es bajo porque Next.js solo escucha en `127.0.0.1`, pero si el VPS corre otros servicios en el futuro, un firewall que solo permita 22/80/443 es una buena práctica de defensa en profundidad. | **Baja** | Recomendación operativa para quien administra el VPS, no requiere cambios de código. |
| F | Comparación de tokens (`token !== stored`) usa igualdad de string normal, no una comparación de tiempo constante (`crypto.timingSafeEqual`). En teoría es vulnerable a un ataque de temporización; en la práctica, con tokens UUID de 122 bits de entropía y latencia de red normal de internet, es extremadamente difícil de explotar. | **Muy baja / teórica** | Se documenta por completitud (buena práctica de "defensa en profundidad"), no por riesgo real inmediato. |

---

## 6) Checklist completo de lo que se revisó

Para que el equipo pueda verificar por su cuenta o repetir esta auditoría más
adelante, esto es todo lo que se cubrió (✅ = revisado, sin hallazgos nuevos
más allá de lo listado arriba):

### 6.1 Autenticación y sesiones
- ✅ Contraseñas gestionadas por Supabase Auth (bcrypt), nunca vistas por la app.
- ✅ Cookies de sesión: `httpOnly`, `secure` en producción, `sameSite: lax`.
- ✅ Recuperación de contraseña: respuesta siempre genérica (no revela si el usuario existe ni si tiene correo registrado) — evita enumeración de cuentas.
- ✅ Login/registro exigen Turnstile.
- 🔧 Login de `/admin`: corregido en esta ronda (rate limiting, ver §4.2).

### 6.2 Autorización / control de acceso (IDOR)
- ✅ Editar/borrar una persona, punto de ayuda, caravana, mascota o post exige el token privado de `person_owners`/`resource_owners` (o ser admin/gestor delegado) — se verificó `verifyOwner`/`verifyResourceOwner` en cada acción sensible de `src/app/actions.ts`.
- ✅ El estado oficial de un hospital (capacidad/insumos) solo lo puede cambiar admin, el autor con cuenta, o un gestor delegado — el resto de la comunidad solo puede votar (no vinculante) o comentar.
- ✅ Las denuncias exigen sesión iniciada para publicarse (no son anónimas ante el sistema, a propósito).
- ✅ El panel `/admin` verifica `isAdmin()` en cada Server Action, no solo en la página (si alguien llamara la acción directamente sin pasar por la UI, igual se rechaza).

### 6.3 Validación de datos / inyección
- ✅ Toda Server Action valida con `zod` antes de tocar la base de datos.
- ✅ Sin SQL crudo en ningún lado (cliente de Supabase parametrizado).
- ✅ Sin `dangerouslySetInnerHTML`.
- ✅ URLs externas validadas contra protocolos peligrosos.

### 6.4 Exposición de datos / superficie de API
- ✅ Sin rutas `/api/*` — todo por Server Actions.
- ✅ Confirmado: ninguna consulta a Supabase trae más columnas de las que la página muestra (sin *over-fetching* de campos sensibles).
- ✅ Tablas de tokens (`person_owners`, `resource_owners`, `resource_managers`, `profiles`) sin lectura pública ni con la clave `anon`.
- ⚠️ Ver §2: cualquier dato que una página muestra públicamente es, por definición, scrapeable — eso es inherente al propósito de la plataforma, no un bug.

### 6.5 Gestión de secretos
- ✅ `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `ADMIN_TOKEN` solo se leen en el servidor (`src/lib/supabase.ts`, `admin.ts`, `turnstile.ts`) — nunca en un archivo con prefijo `NEXT_PUBLIC_*`, que es lo único que Next.js expone al navegador.
- ✅ `.env`/`.env.local` fuera de git (`.gitignore`).
- 🚨 **Pendiente crítico operativo**: el `.env` del VPS de producción todavía tiene el placeholder `pega-aqui` en las 3 variables secretas — ver §7.0.

### 6.6 Anti-bot / rate limiting / abuso
- ✅ Turnstile en las 16 acciones de creación de contenido (fail-closed en producción).
- 🔧 Excepción encontrada y corregida: `addHospitalPatientAction` (§4.1).
- ⚠️ Sin rate limiting general más allá de Turnstile (§5.A, §5.B).
- ⚠️ Sin CDN/WAF (Cloudflare) delante del VPS (§5.C).

### 6.7 Cabeceras HTTP y configuración del framework
- 🔧 Cabeceras de seguridad agregadas en esta ronda (§4.3).
- ✅ `remotePatterns` de `next/image` acotado a dominios de Supabase.
- ✅ Sin fuentes de mapas de código (`sourcemaps`) expuestas en producción por defecto de Next.js.

### 6.8 Subida y almacenamiento de archivos
- ✅ Tipo MIME y tamaño validados en el cliente antes de subir.
- ⚠️ El control **duro** (que de verdad importa) está en la configuración del bucket de Supabase Storage (fuera del código, se configura en el panel de Supabase) — confirmar que sigue así en el proyecto real (`docs/GUIA-DESPLIEGUE.md` documenta los pasos).
- ✅ Nombre de archivo generado por el servidor (`crypto.randomUUID()`), nunca a partir de lo que envía el usuario — evita path traversal.
- ✅ Extensión derivada del tipo MIME real, no de lo que diga el nombre del archivo.

### 6.9 Infraestructura (VPS)
- ✅ Node.js solo escucha en `127.0.0.1` (no accesible sin pasar por nginx).
- ✅ TLS vía Let's Encrypt (documentado en `docs/DESPLIEGUE-VPS.md`).
- ⚠️ Sin firewall (`ufw`) documentado (§5.E).
- ⚠️ Sin Cloudflare/WAF delante (§5.C).

### 6.10 Dependencias
- ⚠️ `npm audit`: 1 vulnerabilidad moderada transitiva (`postcss`, vía `next`) — impacto real bajo, ver §5.D.

---

## 7) Pendientes priorizados (para el equipo)

### 7.0 🚨 Crítico — acción del dueño, no del código
El `.env` de producción (`/var/www/elmundotebusca/.env`) tiene **3 secretos
que siguen siendo el texto de ejemplo `pega-aqui`**:
- `SUPABASE_SERVICE_ROLE_KEY` (clave de servicio real de Supabase)
- `TURNSTILE_SECRET_KEY` (clave real de Cloudflare Turnstile)
- `ADMIN_TOKEN` (contraseña real y larga para `/admin`, generada al azar —
  NO usar la palabra "pega-aqui" ni nada corto/adivinable, porque ese
  string literal está en un documento público en GitHub)

Mientras esto no se corrija: el panel de moderación puede estar protegido
por una "contraseña" que cualquiera que lea el repo público conoce, y
Turnstile puede no estar validando de verdad contra Cloudflare.

### 7.1 Alta prioridad, recomendado
- Activar Cloudflare (proxy) delante del dominio de producción (§5.C).
- Confirmar en el panel de Supabase que el bucket `photos` tiene los límites
  de tipo MIME y tamaño configurados (es la única defensa dura contra subir
  archivos peligrosos, ver §6.8).

### 7.2 Media prioridad, a discutir con el equipo
- Decidir si se agrega rate limiting a "me gusta"/reacciones y a la
  frecuencia de publicación (§5.A, §5.B).
- Firewall (`ufw`) en el VPS como defensa en profundidad (§5.E).

### 7.3 Baja prioridad / informativa
- Vulnerabilidad transitiva de `postcss` vía `next` (§5.D) — revisar al
  actualizar la versión mayor de Next.js.
- Comparación de tokens no es de tiempo constante (§5.F) — cambio cosmético
  de buena práctica, no urgente.

---

*Este informe cubre el código de la aplicación y su configuración conocida.
No sustituye una revisión de la configuración real de Supabase (políticas de
bucket, RLS aplicado tal cual en producción) ni del servidor VPS en vivo —
para eso, quien tenga acceso a esos paneles debería verificar los puntos
marcados con ⚠️ contra el estado real.*
