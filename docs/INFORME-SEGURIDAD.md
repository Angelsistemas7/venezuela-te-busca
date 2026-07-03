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

## 8) Segunda ronda (mismo día, 2026-07-01) — 2 hallazgos nuevos, ambos corregidos

Revisión de seguimiento centrada en lo que la ronda anterior no llegó a cubrir:
las funciones nuevas de esa misma pull (mascotas, tarjetas de compartir con
foto/OG-image, paginación real). Se encontraron y corrigieron 2 huecos reales.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | `photoUrl` no se validaba en ningún lado (ni en `personSchema`/`petSchema` ni en `actions.ts`): cualquiera podía llamar una Server Action de creación directamente con una URL propia. Al compartir la ficha de una persona o mascota, `toEmbeddablePhoto` (`src/lib/ogImage.ts`) hacía `fetch(url)` **en el servidor** con esa URL — un SSRF completo contra la red interna del VPS, disparable sin interacción (cualquier bot de vista previa de WhatsApp/Telegram lo activa solo con visitar el enlace), y sin timeout ni tope de tamaño en la respuesta (riesgo adicional de DoS por memoria/cuelgue). | **Crítica** | Nuevo validador `isSafePhotoUrl` (`src/lib/validation.ts`) que solo acepta URLs del propio bucket de Storage (`https://*.supabase.{co,in}/storage/v1/object/public/photos/...`); se aplica al leer `photoUrl` del formulario en las 8 Server Actions que lo reciben (`src/app/actions.ts`). Además, defensa en profundidad en `toEmbeddablePhoto`: revalida el dominio, agrega timeout de 5 s y tope de 8 MB en la respuesta (`src/lib/ogImage.ts`). |
| 2 | El "voto de consenso" de disponibilidad de un punto de ayuda (`voteAidAvailabilityAction`) y de insumos de un hospital (`voteHospitalSuppliesAction`) exigía sesión, pero no había ningún límite de UN voto por cuenta: los contadores eran columnas simples (`votes_available`, etc.) sin tabla de por medio, así que la misma cuenta podía llamar la acción sin límite y falsear a voluntad la señal que otros usan para decidir a dónde ir a buscar ayuda. Responde directamente la pregunta abierta en `docs/BRIEF-AUDITORIA-EXTERNA.md` §6.10 sobre manipular el consenso creando/usando cuentas en volumen. | **Media-alta** | Nueva tabla `consensus_votes` (`entity_type, entity_id, user_id`) con clave única — un voto por cuenta y recurso, se puede cambiar pero no repetir (`supabase/schema.sql`). `voteAidAvailability`/`voteHospitalSupplies` (`src/lib/data.ts`) ahora reciben el `userId`, consultan el voto previo y recalculan los contadores en vez de incrementarlos ciegamente; verificado con un script que confirma que 3 llamadas iguales de la misma cuenta solo suman 1, cambiar de voto mueve el contador correctamente, y una cuenta distinta sí puede sumar el suyo. |

Verificado con `npm run build` (verde) tras aplicar ambas correcciones.

---

## 9) Tercera ronda (2026-07-01) — motivada por un ataque real a una plataforma similar

El dueño reportó que otra plataforma parecida (ayuda a Venezuela) fue
atacada y se filtraron datos de sus voluntarios. Se hizo una revisión de
emergencia enfocada en exposición de datos personales, más un barrido
amplio contra categorías conocidas de ataque (reconocimiento, inyección,
control de acceso, SSRF, cabeceras, etc.) — triado según qué aplica de
verdad a este stack (Next.js + Supabase, sin Docker/Java/PHP/GraphQL/XML,
sin backend propio más allá de Server Actions).

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **El mapa (`/mapa`) mostraba la coordenada GPS EXACTA de cada voluntario** (la que su teléfono reportó al registrarse), junto a su nombre completo y un enlace directo de WhatsApp — visible para cualquiera, sin sesión. A diferencia de puntos de ayuda/hospitales (lugares físicos que SÍ deben mostrarse exactos, es su propósito), un voluntario es una persona privada: esto revelaba dónde vive/está exactamente. Coincide con el patrón típico de estas fugas ("se veían los datos de los voluntarios"). | **Alta** | Los voluntarios en el mapa ahora usan siempre una ubicación aproximada (mismo sector/estado + variación aleatoria, la misma función `geocode()` que ya se usaba para el resto quien no daba coordenada exacta) — nunca la coordenada precisa (`src/app/mapa/page.tsx`). Personas/puntos de ayuda/hospitales se revisaron y están bien: mostrar su ubicación exacta ahí sí es el propósito. |
| 2 | **Inyección de cabecera `Host`** en el enlace de recuperación de contraseña: si `NEXT_PUBLIC_SITE_URL` llegara a faltar en producción (ya pasó con otras 3 variables en este proyecto), la función arma el enlace del correo con las cabeceras `Host`/`X-Forwarded-For` de la petición — que cualquiera puede falsear apuntando directo a la IP del VPS (sin pasar por Cloudflare/el dominio real), ya que el nginx documentado no tiene un bloque `default_server` que rechace hosts desconocidos. Permitiría mandar un correo real de "recuperar contraseña" con el enlace apuntando a un dominio del atacante (phishing / robo del token). Hoy no es explotable porque esa variable SÍ está configurada, pero es una trampa lista para el día que no lo esté. | **Media** (latente, no explotable hoy) | `siteOrigin()` (`src/lib/auth.ts`) ya NO confía en cabeceras de la petición — solo usa `NEXT_PUBLIC_SITE_URL`, o `localhost` en desarrollo; si falta en producción, simplemente no manda el correo (mejor que mandarlo con un enlace falseable). Se documentó además un bloque `default_server { return 444; }` para nginx (`docs/DESPLIEGUE-VPS.md`) que corta esas peticiones en el borde, antes de que lleguen a la app. |

**Re-verificado a fondo, sin hallazgos nuevos** (ya lo cubría la ronda anterior,
se repitió con lupa por la alarma):
- **RLS**: las 20 tablas de `supabase/schema.sql` tienen Row Level Security
  activado; ninguna política permite `INSERT`/`UPDATE`/`DELETE` con la clave
  pública (`anon`) — las dos únicas que lo harían están comentadas a
  propósito. Es justo el patrón de fuga más común encontrado al investigar
  incidentes reales de Supabase en 2026 (tablas sin RLS ⇒ la clave pública
  se vuelve "llave maestra" por accidente) — no es el caso aquí.
- **Next.js 15.5.19** (versión instalada) ya incluye el parche de mayo 2026
  para la denegación de servicio de Server Components (CVE-2026-23869).
- SSRF: revisado también el generador de imágenes para compartir
  (`src/lib/ogImage.ts`, ya blindado en la ronda anterior) y los feeds de
  noticias (`src/lib/news.ts`, `src/lib/usgs.ts`) — URLs fijas, sin
  influencia de datos de usuario.
- XXE: no aplica — el "parseo" de RSS de noticias es con expresiones
  regulares simples, no un parser XML real que pudiera procesar entidades
  externas.
- Cabeceras/CORS: sin `Access-Control-Allow-*` en ningún lado (no hace
  falta, todo es mismo-origen); páginas de error (`error.tsx`,
  `global-error.tsx`) no exponen el mensaje técnico, solo lo registran en
  consola del servidor.
- Funciones nuevas de esta sesión (cambiar contraseña, correo de
  recuperación, eliminar cuenta, foto de perfil): todas derivan el usuario
  de la sesión verificada en el servidor (`getCurrentUser()`), nunca de un
  ID que mande el cliente — sin IDOR posible ahí. `changePassword`/
  `deleteAccount` re-verifican la contraseña actual antes de actuar.

**Encontrado, de severidad baja, sin corregir (anotado para más adelante)**:
- Los contadores de "voto de consenso" (`votes_available`/`votes_depleted`
  en `aid_points`, insumos de hospitales) se leen-y-escriben sin bloqueo —
  bajo peticiones simultáneas MUY rápidas de la misma cuenta, el conteo
  numérico puede desincronizarse ligeramente (típico "TOCTOU"/race
  condition). No es explotable como fuga ni como bypass real: la tabla
  `consensus_votes` sigue garantizando un solo voto por cuenta gracias a su
  restricción única, así que como mucho el NÚMERO mostrado queda un poco
  impreciso, no falso a voluntad. Arreglarlo bien requeriría un incremento
  atómico en la base de datos (función SQL/RPC) — cambio más grande, no
  urgente dado el impacto real.

Verificado con `npm run build` (verde) tras aplicar las dos correcciones.

---

## 10) Cuarta ronda (2026-07-01) — modelo de amenazas específico del stack

A propuesta del dueño: en vez de seguir una checklist genérica de OWASP (gran
parte no aplica — sin Docker/Kubernetes expuesto, sin Java/PHP/XML/GraphQL,
sin backend propio más allá de Server Actions), se hizo un modelo de amenazas
acotado a lo que este stack (Next.js 15 + Supabase + nginx) puede tener de
verdad, priorizado así: control de acceso → lógica de negocio → subida de
archivos → Server Actions/API → denegación de servicio.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **El EXIF de las fotos podía sobrevivir la subida** — `compressImage` (`src/lib/image.ts`) recomprime toda foto en un `<canvas>` antes de subirla, lo cual borra metadatos como sido efecto colateral (los canvas no los guardan) — **pero** si la versión comprimida salía más pesada que la original (pasa con fotos ya optimizadas, ej. capturas de pantalla), la función devolvía el archivo **original sin tocar**, con su EXIF completo — que en una foto tomada con el celular casi siempre incluye la coordenada GPS **exacta** de dónde se tomó. Cualquier foto subida al sitio (persona, mascota, punto de ayuda, foto de perfil) podía filtrar la ubicación precisa de quien la subió, sin que lo supiera. | **Alta** | Se quitó el atajo: ahora siempre se sube la versión recomprimida (sin metadatos), nunca el archivo original — aunque pese un poco más. Confirmado que las 3 rutas de subida de fotos del sitio pasan por esta función. |

**Control de acceso (IDOR/BOLA/escalada) — revisado función por función, sin hallazgos nuevos**:
- Las 14 acciones "de autor" (`owner*Action` en `src/app/actions.ts`) y las
  15 acciones de `src/app/admin/actions.ts` verifican permiso (token de
  dueño, `canManageX`, o `isAdmin()`) como una de las primeras líneas,
  siempre antes de mutar — confirmado con un barrido automatizado de las 56
  Server Actions del archivo.
- **Mass Assignment**: ningún esquema `zod` usa `.passthrough()`/`.any()`;
  el código siempre extrae campo por campo (`getField(form, "x")`), nunca
  esparce el `FormData` completo hacia la base de datos.
- **Sesión/JWT**: `getCurrentUser()` usa `auth.getUser()` (revalida contra
  el servidor de Supabase) y no `auth.getSession()` (que solo decodifica la
  cookie sin confirmar con el servidor) — la diferencia importa para no
  confiar en un JWT que el cliente pudiera manipular.
- **RPC/funciones SQL**: solo existe una función en toda la base
  (`touch_updated_at`, un trigger de fecha) — sin `SECURITY DEFINER` ni SQL
  dinámico en ningún lado.

**Denegación de servicio y otros, revisados sin hallazgos que ameriten
corrección inmediata**:
- Paginación: `clampPageSize` usa lista blanca explícita (10/20/50);
  `pageSize=999999` es imposible, no solo "poco probable".
- `_next/image` no se puede usar como proxy hacia dominios externos
  (`remotePatterns` restringido a Supabase).
- `sharp` en versión reciente (0.34.5), sin CVEs conocidas aplicables.
- **Pendiente de bajo impacto, sin tocar**: los campos de búsqueda (`?q=`)
  no tienen límite explícito de longitud. Riesgo real bajo (la búsqueda de
  texto de Postgres no es vulnerable a un patrón tipo ReDoS como sí lo
  sería un regex mal escrito), pero sería una mejora barata de defensa en
  profundidad — tocaría bastantes archivos (cada página con buscador), se
  dejó pendiente por ser bajo impacto frente al resto de esta ronda.

Verificado con `npm run build` (verde) tras aplicar la corrección.

---

## 11) Quinta ronda (2026-07-01) — auditoría de invariantes (no de vulnerabilidades "famosas")

Última fase: en vez de buscar XSS/SQLi/SSRF (ya cubierto), se buscaron
**estados imposibles** — bugs de lógica/integridad que no aparecen en
ninguna checklist porque son específicos de cómo está armada esta app.
Todo esto se revisó leyendo código (no requiere tráfico en vivo).

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **Confianza excesiva en el cliente**: `postCommentAction` tomaba el campo oculto `entityType` del formulario con un `as` de TypeScript — que NO valida nada en tiempo de ejecución, solo cambia lo que ve el editor. Cualquiera podía mandar un `entityType` que no fuera ninguno de los 9 válidos. El `CHECK` de la base de datos lo detiene igual (no es explotable a fondo), pero es el patrón exacto que hay que evitar: nunca confiar en un campo oculto sin revalidarlo. | **Baja** (contenida por el `CHECK` de Postgres, pero mala práctica) | Nueva lista blanca en tiempo de ejecución (`COMMENT_ENTITY_TYPES`) que se revisa ANTES de usar el valor (`src/app/actions.ts`). |
| 2 | **Fotos huérfanas en Storage**: al borrar una persona, publicación, punto de ayuda, mascota, héroe o noticia, la fila de la base se borraba pero **la foto se quedaba en el bucket para siempre**, accesible por su URL aunque el registro ya no existiera en el sitio. Lo mismo al cambiar la foto de perfil: la anterior nunca se borraba. No es una fuga masiva (los nombres de archivo son UUID, no se pueden adivinar/enumerar), pero si alguien guardó el enlace directo de una foto "eliminada", seguía viéndola. | **Media** | Nueva función `deleteStoragePhoto` (`src/lib/data.ts`) que borra el archivo del bucket al eliminar cada uno de esos 6 tipos de contenido; `updateAvatar` (`src/lib/auth.ts`) borra la foto de perfil anterior al reemplazarla. "Mejor esfuerzo" a propósito: si falla borrar el archivo, no bloquea el borrado del registro (lo importante). |
| 3 | **Fuga de memoria lógica** en el freno de fuerza bruta de `/admin` (agregado en una ronda anterior de esta misma auditoría): cada IP que fallaba el login quedaba en un `Map` en memoria PARA SIEMPRE si nunca volvía a intentar — con el tráfico normal de bots que escanean cualquier servidor público, este mapa crece sin límite mientras viva el proceso de Node (PM2 no lo reinicia solo). | **Baja** | El mapa ahora se poda (quita entradas viejas cuyo bloqueo ya venció) en cuanto crece de 5.000 IPs distintas (`src/lib/admin.ts`). |

**Revisado a fondo, sin hallazgos (invariantes correctas)**:
- **TOCTOU en acciones "de autor"**: el patrón es siempre "verificar dueño → mutar" dentro de la MISMA función, sin ventana de tiempo entre medio donde algo externo pudiera cambiar el resultado del chequeo — no es el patrón "leer con una consulta, decidir en JS, escribir con otra" que sí sería explotable.
- **RLS vs. lógica de la app**: aclaración importante para el equipo — **todas las escrituras del servidor usan `service_role`, que IGNORA RLS por diseño** (RLS solo protege contra quien golpee Supabase directo con la clave `anon`, saltándose la app). Eso significa que las verificaciones de la propia app (`verifyOwner`, `isAdmin`, `canManageX` — ya revisadas en la ronda anterior) son la ÚNICA barrera real para esas 56 Server Actions, no hay una "red de seguridad" extra de RLS por detrás. Ya estaban bien, pero es el modelo mental correcto para cualquiera que toque este código después.
- **Invariantes de estado imposible**: `Person.status` es un único campo `enum` (no dos banderas independientes), así que "desaparecida Y encontrada a la vez" no es un estado que se pueda representar, ni por accidente ni a propósito.
- **Canonicalización de usuario**: `username_lower` (con restricción única en la base) + `.trim().toLowerCase()` antes de cualquier comparación — "Admin"/"admin"/"ADMIN" siempre resuelven a la misma cuenta.
- **Unicode invisible / homógrafos**: el usuario solo acepta `[a-zA-Z0-9_.]` (lista blanca, no lista negra) — eso excluye TODO lo demás de una vez: cirílico, caracteres invisibles (ZWJ/ZWNJ/BOM), todo.
- **Transacciones multi-tabla**: `signUp()` ya tenía limpieza de compensación (si falla crear el perfil después de crear la cuenta, borra la cuenta) — patrón correcto donde no hay transacciones SQL reales de por medio.
- **Huérfanos al borrar una cuenta**: revisadas las 20 relaciones a `auth.users` — cada una usa `cascade` o `set null` según corresponde (perfil/roles/guardados/votos se borran con la cuenta; publicaciones se desvinculan pero NO se borran) — consistente en toda la base.
- **Código muerto / archivos sospechosos**: sin `*_old.ts`, `*.bak`, `backup.ts`, etc. Sin comentarios `TODO`/`FIXME`/`HACK` reales en el código (los únicos resultados eran la palabra "TODOS" en español).
- **GET vs. POST con validación distinta**: solo existe UNA ruta HTTP real fuera de Server Actions (`/cuenta/confirmar`, el enlace de recuperación) — ya revisada, con protección correcta contra open-redirect.

**Anotado, no corregido (bajo impacto, ya alineado con hallazgos anteriores)**:
- Colección sin límite: un usuario con sesión puede comentar sin límite de
  cantidad (Turnstile solo aplica a comentarios anónimos) — mismo tema que
  el "me gusta" sin límite ya anotado en rondas previas.
- El contador de `consensus_votes` puede quedar levemente desincronizado si
  se borra una cuenta que había votado (el voto se borra en cascada, pero
  el contador denormalizado en `aid_points`/`hospitals` no se recalcula
  solo) — mismo origen que la imprecisión de conteo ya documentada.

Verificado con `npm run build` (verde) tras aplicar las tres correcciones.

---

## 12) Sexta ronda (2026-07-01) — base de datos: constraints, índices, migraciones

Última fase de revisión estática: no el código de la app, sino
`supabase/schema.sql` en sí — constraints, índices, historial de migraciones,
funciones/triggers, cron jobs.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **Búsquedas sin índice en 4 tablas** (`posts`, `complaints`, `pets`, `volunteers`): buscan con `ILIKE '%texto%'` en varias columnas a la vez, sin ningún índice que lo respalde — a diferencia de `persons`, que ya tenía índices `GIN`/trigram para esto. Sin índice, cada búsqueda escanea la tabla completa fila por fila; combinado con que no hay límite de peticiones de búsqueda, es una forma barata de generar carga cara en la base a medida que esas tablas crezcan (justo el patrón "10 ms → 8.000 ms" de una consulta sin índice). | **Media** (crece con el tiempo, no es explotable "ahora" con pocos datos, pero sí lo será) | 12 índices `gin_trgm_ops` nuevos, uno por columna buscada en esas 4 tablas (`supabase/schema.sql`) — mismo patrón que ya usaba `persons`. |

**Revisado a fondo, sin hallazgos (invariantes de base de datos correctas)**:
- **Historial de migraciones**: revisado con `git log -p` sobre todo el
  historial de `schema.sql` — RLS nunca se desactivó en ningún punto, no
  hay policies "temporales" tipo `for all using (true)` que hayan quedado
  activas u olvidadas.
- **Constraints**: cada `CHECK` de enum coincide exactamente con lo que
  valida `zod` en el servidor (doble verificación, no contradictoria).
  Cada `FOREIGN KEY` de la base tiene un `ON DELETE` explícito (`cascade` o
  `set null`) — ninguna se dejó en el valor por defecto de Postgres
  (`RESTRICT`, que bloquearía el borrado en vez de resolverlo).
- **UNIQUE/PRIMARY KEY**: `person_owners`/`resource_owners` (los tokens de
  gestión) tienen como llave primaria exactamente `(person_id)` /
  `(entity_type, entity_id)` — un solo token posible por recurso, no puede
  haber ambigüedad. `app_roles`/`resource_managers`/`consensus_votes` igual,
  sin duplicados posibles.
- **Cron jobs / triggers / funciones SQL**: sin `pg_cron`. Solo existe una
  función en toda la base (`touch_updated_at`, un trigger de fecha, sin
  `SECURITY DEFINER` ni SQL dinámico — ya revisado en una ronda anterior).
- **Valores numéricos extremos**: `age`/`lat`/`lng` en `zod` siempre tienen
  `.min()`/`.max()` explícitos — `Infinity`, `-Infinity` y valores fuera de
  rango se rechazan solos (Zod los excluye del rango numérico), no hay forma
  de colar un valor absurdo en esas columnas.
- **Zonas horarias**: todo timestamp en el esquema es `timestamptz`
  (con zona horaria, gestionado por Postgres) — no hay aritmética manual de
  fechas en el código que pudiera desincronizarse.

Verificado con `npm run build` (verde). Los índices nuevos no cambian
comportamiento, solo rendimiento — se aplican solos al volver a correr
`supabase/schema.sql` (es idempotente).

---

## 13) Séptima ronda (2026-07-03) — auditoría de "supuestos"

Última fase de revisión estática: no el código en sí, sino todo lo que el
código **asume** sin decirlo — variables de entorno con valores por defecto,
`try/catch` que esconden fallos, casts sin validar, `fetch()` sin límite de
tiempo, cachés que crecen sin límite, parsers, recursión.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **`verifyTurnstile` era el único `fetch()` del servidor sin timeout** — los demás (`news.ts`, `usgs.ts`, `ogImage.ts`) ya tenían `AbortSignal.timeout(...)`. Esta función se llama en las 16+ acciones de crear contenido del sitio entero: si el endpoint de Cloudflare alguna vez se cuelga o tarda de más, cada publicación del sitio se quedaría esperando indefinidamente, sin salida. | **Media** | `AbortSignal.timeout(6000)` agregado (`src/lib/turnstile.ts`), igual que en el resto de `fetch()` del proyecto. El `catch` ya fallaba cerrado (`return false`), eso ya estaba bien. |

**Revisado a fondo, sin hallazgos nuevos**:
- **Variables de entorno / fallbacks inseguros**: todo `process.env.X ?? / ||` revisado uno por uno — los únicos que cambian comportamiento por ausencia (`ADMIN_TOKEN`, `TURNSTILE_SECRET_KEY`, `siteOrigin`) ya fallan CERRADO en producción (ya corregido en rondas anteriores), abierto solo en desarrollo.
- **`try/catch` que esconden fallos**: sin ningún `catch { return true }` ni `catch {}` completamente vacío en todo `src/` — los `catch` silenciosos que sí existen (localStorage, `compressImage`, fetches de terceros) todos devuelven un valor de *respaldo seguro*, no un "todo bien" falso.
- **`as any` / casts sin validar**: 9 usos de `as any[]` en `data.ts`, todos inmediatamente encauzados por un mapeador (`rowToX`) que solo copia campos conocidos uno por uno — no hay forma de que un campo extra de la base "se cuele" al cliente por ahí. Cero *non-null assertions* (`!`) en todo el proyecto.
- **`TODO`/`XXX`/`BUG`/`WORKAROUND`/`IGNORE`** y comentarios tipo "no validamos esto porque...": ninguno en el código.
- **Regex dinámicas**: cero `new RegExp()` construidas con datos de usuario — todas las expresiones regulares del proyecto son literales fijas en el código, sin riesgo de ReDoS por esa vía.
- **`JSON.parse`**: un solo uso, leyendo `localStorage` (dato del propio navegador, nunca de otro usuario), ya envuelto en `try/catch` con valor de respaldo.
- **`new URL()`**: 6 usos, todos ya revisados en rondas anteriores (extracción de ruta de Storage, guardia de open-redirect, aviso de enlace externo, validación de foto).
- **`Promise.all()`**: los 4 usos en `data.ts`/`actions.ts` son siempre lecturas en paralelo, nunca escrituras combinadas — no hay riesgo de que una falle y dañe la otra.
- **Cachés/`Map`/`Set` a nivel de módulo**: revisados todos — `savedStore.ts` es una caché del NAVEGADOR (dura lo que dura la pestaña, un usuario), no del servidor. El único caso de caché de servidor sin límite (el freno de fuerza bruta de `/admin`) ya se corrigió en la ronda anterior.
- **Recursión / parsers propios**: ninguna función se llama a sí misma en todo el proyecto; el único "parser" es el decodificador de RSS (expresiones simples, sin anidamiento, ya revisado).

Verificado con `npm run build` (verde) tras aplicar la corrección.

---

## 14) Octava ronda (2026-07-03) — fronteras de confianza (Trust Boundary Review)

Última fase de revisión estática: no vulnerabilidades ni supuestos, sino
**cada punto donde el sistema confía en algo externo** (cabeceras, cookies,
query params, Turnstile, Storage, variables de entorno) — y comprobar que
esa confianza está bien justificada en cada uno.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **La "IP" del freno de fuerza bruta de `/admin` era falseable.** `X-Forwarded-For` lo arma nginx AÑADIENDO la IP real al final de lo que el cliente ya mandó, sin reemplazarlo — cualquiera podía mandar su propio `X-Forwarded-For: 1.2.3.4` y el código tomaba ese valor falso (`split(",")[0]`), no el real. Bastaba con rotar ese encabezado en cada intento para saltarse por completo el bloqueo de 5 intentos/15 min. Además, con Cloudflare ahora por delante, la IP que nginx SÍ ve directamente (`$remote_addr`, usada en `X-Real-IP`) pasó a ser la del borde de Cloudflare, no la del visitante real — dos problemas del mismo origen: no quedaba claro en qué cabecera confiar para saber quién es quién. | **Media** | `clientIp()` ahora usa `CF-Connecting-IP` primero — la pone Cloudflare mismo y SOBRESCRIBE cualquier valor que el cliente haya mandado, no se puede falsear (mientras el `default_server` de nginx, ya documentado, siga bloqueando quien le pegue directo a la IP del VPS). El resto queda como respaldo para desarrollo local, sin Cloudflare. |

**Trazado un flujo completo de extremo a extremo** (Registrar persona →
publicar → mostrar → borrar), como pediste con el "Data Flow Review", para
confirmar que no queda ningún salto de confianza sin verificar:
`RegisterPersonButton` (foto: EXIF ya limpio, MIME validado) → Turnstile
(con timeout) → `personSchema` de zod (límites en todos los campos) →
`isSafePhotoUrl` (revalidada en el servidor, no solo en el cliente) →
`createPerson` con `service_role` (el único punto con privilegio elevado,
llega ahí ya con todo verificado) → se muestra públicamente por diseño (RLS
de solo lectura) → borrar exige el token exacto (`verifyOwner`) → el borrado
ahora también limpia la foto del bucket y el token (`on delete cascade`) —
sin huecos en ningún eslabón.

**Revisado, ya bien resuelto en rondas anteriores**: fail-secure de
Turnstile/`ADMIN_TOKEN` (fallan cerrado en producción, abiertos solo en
desarrollo); privilegio mínimo (todas las verificaciones de permiso ocurren
ANTES de tocar `service_role`, nunca después); rotación/exposición de
secretos (viven solo en el `.env` del VPS, nunca en git ni en el cliente).

Verificado con `npm run build` (verde) tras aplicar la corrección.

---

## 15) Novena ronda (2026-07-03) — técnicas de investigación avanzadas (bug bounty / PortSwigger)

Última pasada: líneas de investigación de los últimos años (James Kettle,
PortSwigger Web Security Research) que casi nunca aparecen en checklists
tradicionales — diferencias entre parsers, canales de tiempo, confusión de
cabeceras/cookies, máquinas de estado. Triado explícito: la mitad de esta
lista compara cómo interpretan bytes sistemas DISTINTOS (Cloudflare, nginx,
Node) — eso, por definición, no se puede determinar leyendo el código de
uno solo de ellos. Lo demás sí se revisó en código.

| # | Hallazgo | Severidad | Corrección aplicada |
|---|---|---|---|
| 1 | **Email Parser Attacks**: el correo de recuperación se guardaba tal cual lo escribiera la persona (`Juan@Gmail.com`), sin pasar a minúsculas — a diferencia del nombre de usuario, que sí. Supabase Auth normaliza internamente el correo; si `profiles.recovery_email`/`login_email` quedaban con mayúsculas mezcladas, la recuperación de contraseña (que busca por ese valor exacto) podía fallar en silencio para cualquiera que escribiera su correo con mayúsculas. | **Baja** (bug de funcionalidad con tinte de seguridad — cuenta que no se puede recuperar) | `email.trim().toLowerCase()` aplicado en `signUp()` y `updateRecoveryEmail()` (`src/lib/auth.ts`), igual que ya se hacía con el usuario. |
| 2 | **Timing Side Channel en el login**: si el usuario NO existe, la función devolvía de inmediato tras una sola consulta; si SÍ existe, además llamaba a Supabase para comparar la contraseña (con bcrypt, deliberadamente lento) — esa diferencia de tiempo, medible con suficientes intentos, revela qué nombres de usuario existen aunque el mensaje de error sea siempre genérico. Es exactamente la técnica que ha popularizado James Kettle en los últimos años: más práctica hoy de lo que solía ser. | **Baja** (requiere medición estadística con muchos intentos; mitigado, no eliminado del todo — un canal de tiempo nunca se cierra al 100%) | Cuando el usuario no existe, ahora igual se hace un intento de login (con una clave que nunca puede ser válida) antes de responder, para parejar el tiempo de las dos rutas (`src/lib/auth.ts`). |

**Revisado, no aplica a este stack (razones explícitas)**:
- **Parser Differential Attacks / Header Confusion / Host Confusion /
  Cookie Confusion / Duplicate Parameter Pollution / JSON Differential
  Parsing** — todas comparan cómo interpretan los MISMOS bytes sistemas
  DISTINTOS (Cloudflare, nginx, Node). Por definición no se puede responder
  leyendo el código fuente de uno solo — hace falta mandar tráfico
  deliberadamente ambiguo y observar qué hace cada capa. Ver recomendación
  de fase dinámica abajo.
- **Multi-layer Cache** — ya revisado en una ronda anterior desde el ángulo
  de cache poisoning (sin `Cache-Control` manual en ningún lado); la parte
  de "qué cachea Cloudflare de verdad" es configuración, no código.
- **Prototype Pollution** — no se provoca en código propio (sin `merge`/
  `Object.assign` con datos de usuario sin filtrar); si apareciera, vendría
  de una dependencia de terceros — cubierto por `npm audit`, ya revisado.
- **Request Tunneling / HTTP2 / Compression Oracle entre capas / Browser
  Quirks** — todo esto es comportamiento de red y de navegador, no del
  código de la aplicación.
- **Edge Computing Bugs**: sin `export const runtime = "edge"` en ningún
  archivo — todo corre en Node estándar, esa superficie no existe aquí.
- **Hidden Parameter Mining**: revisado — sin `?debug=`, `?preview=`,
  `?admin=`, `?internal=` ni nada similar en ningún `searchParams.get()`
  o `form.get()` del proyecto.
- **Serialization Bugs**: todas las fechas se guardan y pasan como texto
  ISO (`createdAt: string`), nunca como objeto `Date` — evitado por diseño
  desde el principio, no por casualidad.
- **Hydration Attacks**: ya se encontró y corrigió un caso EXACTO de esto
  en una ronda anterior (`ShareWhatsApp.tsx`, la URL calculada distinto en
  servidor y navegador) — categoría ya cazada una vez, sin otra instancia
  encontrada al revisar de nuevo.
- **Service Boundary (Storage → CDN → navegador)**: ya revisado — el bucket
  es público de lectura a propósito (por diseño: las fotos deben verse sin
  sesión), y la única entrada (subida) exige política `insert` explícita,
  ya confirmada.
- **Feature Interaction**: revisada la combinación que mencionaste de
  ejemplo (Búsqueda + Compartir + Storage) — la búsqueda nunca expone más
  campos de los que ya son públicos, y compartir solo usa fotos ya
  validadas — no se encontró una fuga por la combinación de ambas.
- **State Machine Bugs**: el estado de una persona (`por_localizar` →
  `localizado`/`hospitalizado`/`fallecido`) puede moverse en CUALQUIER
  dirección, incluso "hacia atrás" — pero eso es a propósito: el
  autor/admin necesita poder corregir un error (ej. alguien marcado
  "Confirmado sin vida" por una confusión). Esa transición libre está bien
  porque solo la puede hacer quien ya está autorizado (`verifyOwner`/
  `isAdmin`, revisado a fondo en la ronda de control de acceso) — nadie sin
  autorización puede forzar ningún estado.

Verificado con `npm run build` (verde) tras aplicar las dos correcciones.

## Nota final sobre el alcance de esta auditoría

Nueve rondas de revisión de código (control de acceso, subida de archivos,
lógica de negocio/invariantes, base de datos, supuestos implícitos,
fronteras de confianza, y ahora técnicas de investigación avanzadas de bug
bounty) cubren prácticamente todo lo que un análisis **estático** puede
responder para este stack. Eso es una afirmación distinta a "la aplicación
no tiene vulnerabilidades" — nadie puede garantizar eso solo leyendo código.
Lo que queda por delante requiere **pruebas dinámicas** contra el sitio
desplegado: diferencias de interpretación entre Cloudflare/nginx/Node
(parser differentials — la familia que originó el request smuggling
moderno), concurrencia real (no solo razonada), fuzzing, comportamiento
HTTP (smuggling, slowloris), resistencia real a carga, canales de tiempo
medidos (no solo mitigados a ciegas), y una revisión de la configuración de
Supabase/VPS tal como está funcionando en producción, no solo como está
descrita en este repositorio. Esa es la siguiente fase
recomendada — ver `docs/BRIEF-AUDITORIA-EXTERNA.md` para el alcance de una
auditoría externa con herramientas reales (Burp, ZAP, etc.).

---

*Este informe cubre el código de la aplicación y su configuración conocida.
No sustituye una revisión de la configuración real de Supabase (políticas de
bucket, RLS aplicado tal cual en producción) ni del servidor VPS en vivo —
para eso, quien tenga acceso a esos paneles debería verificar los puntos
marcados con ⚠️ contra el estado real.*
