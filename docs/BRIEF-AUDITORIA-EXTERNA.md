# Brief para auditoría de seguridad externa — "El Mundo Te Busca"

> Documento para entregar a un equipo/persona externa que va a hacer una
> revisión de seguridad manual y profunda de la plataforma. Está pensado para
> que lo lean sin necesitar contexto previo de este proyecto.

---

## 1) Qué es esta plataforma y por qué la seguridad importa tanto

**"El Mundo Te Busca"** es una plataforma ciudadana, **sin fines de lucro**,
para localizar personas desaparecidas y coordinar ayuda humanitaria tras el
terremoto de Venezuela de 2026. La base de datos contiene información real y
sensible de personas reales:

- Nombres completos, cédulas, fotos, teléfonos y ubicaciones de personas
  desaparecidas o sin identificar — **muchas son menores de edad**.
- Datos de pacientes de hospitales (nombre, cédula, estado médico).
- Datos de contacto de voluntarios y organizadores de ayuda.

**Esto no es una app de e-commerce ni un SaaS cualquiera**: un fallo de
seguridad aquí puede significar exposición de datos de menores, suplantación
de identidad, o que alguien manipule información sobre si una persona
desaparecida "fue encontrada" o no. Traten cada hallazgo con esa vara.

El objetivo de esta auditoría es **defensivo**: encontrar huecos ANTES de que
alguien más los explote, no explotarlos contra el sistema en producción real
sin coordinación.

---

## 2) Reglas de juego (leer antes de empezar)

### Permitido
- Revisar el código fuente completo (repositorio Git, se les da acceso).
- Levantar el proyecto **en local o en un entorno de pruebas propio**
  (instrucciones en la sección 5) y probar ahí con datos de ejemplo.
- Probar contra el sitio de **producción real** (`elmundotebusca.com`)
  **solo** pruebas de caja negra no destructivas: navegación, inspección de
  respuestas HTTP, intentos de acceso no autorizado con cuentas de prueba
  propias, fuzzing ligero de formularios con datos falsos claramente
  identificables como prueba (ej. nombres tipo "TEST-AUDITORIA-001").
- Usar herramientas estándar de análisis (Burp Suite, OWASP ZAP, `npm audit`,
  linters de seguridad, etc.).

### NO permitido sin autorización explícita previa (coordinar con el dueño)
- **Nada de pruebas de denegación de servicio** (DoS/DDoS), ni de volumen
  alto de tráfico/requests contra producción.
- **No publicar información real de personas** como prueba (no usar cédulas,
  nombres o fotos reales para "probar" un formulario — usar siempre datos
  ficticios y marcados como prueba).
- **No intentar acceder, modificar o borrar registros reales** de personas,
  hospitales, puntos de ayuda, etc. que no hayan creado ustedes mismos como
  prueba.
- **No hacer scraping masivo** del sitio (ver por qué en la sección 4.2 — el
  contenido es público por diseño, pero descargarlo en bloque no es el
  objetivo de esta auditoría y genera carga innecesaria).
- **No tocar el servidor (VPS) directamente** sin acceso SSH otorgado
  explícitamente — la auditoría de infraestructura (firewall, hardening del
  SO, etc.) se coordina aparte con quien tiene acceso root.
- Cualquier prueba que pudiera **afectar disponibilidad real** para gente
  buscando a un familiar debe avisarse antes, no improvisarse.

### Cómo reportar lo que encuentren
Para cada hallazgo, en un documento o issue, incluyan:
1. **Título corto** del problema.
2. **Severidad** (crítica / alta / media / baja / informativa) con
   justificación — piensen en impacto real sobre datos de personas
   vulnerables, no solo en "checklist de OWASP".
3. **Pasos para reproducirlo** (concretos, verificables).
4. **Evidencia** (captura, request/response, fragmento de código si aplica).
5. **Recomendación de corrección** (aunque sea una idea general).

No hace falta que corrijan el código ustedes — con el reporte priorizado
basta; la corrección se coordina con el equipo de desarrollo.

---

## 3) Acceso que se les va a dar

- **Repositorio de código** (Git) — de solo lectura o con su propia rama,
  según se acuerde.
- **Entorno local de pruebas**: la app corre completa sin necesitar
  credenciales reales (ver sección 5) — con datos de ejemplo (`seed.ts`), en
  memoria, sin tocar la base de datos real. **Este es el entorno recomendado
  para el 90% de las pruebas.**
- Si necesitan probar contra una base de datos real de prueba (no la de
  producción), pueden pedir un **proyecto de Supabase de staging** aparte —
  no se les debe dar acceso a las claves de producción bajo ninguna
  circunstancia.
- Acceso al sitio público `elmundotebusca.com` (no requiere nada especial,
  es público).
- Si necesitan probar el panel de administración (`/admin`), pidan una
  contraseña de prueba temporal — **no la de producción real**.

---

## 4) Arquitectura resumida (para no partir de cero)

### 4.1 Stack técnico
- **Next.js 15** (App Router, React 19, Server Components + **Server
  Actions** — no hay API REST/GraphQL separada, toda mutación de datos pasa
  por funciones de servidor invocadas desde formularios React).
- **Supabase** (Postgres + Storage + Auth + Row Level Security) como base de
  datos en producción. Sin Supabase configurado, la app corre con datos de
  ejemplo en memoria (útil para pruebas locales sin riesgo).
- **Cloudflare Turnstile** como anti-bot en formularios públicos.
- **zod** para validación de datos en el servidor.
- Hosting: VPS propio (nginx + PM2), próximamente detrás de Cloudflare
  (proxy DNS activándose).

### 4.2 Puntos clave de diseño que deben entender antes de reportar
- **No existe ninguna API JSON pública** (`/api/*`) — todo pasa por Server
  Actions. Esto es relevante porque significa que la superficie de ataque
  "clásica" de API REST no aplica igual aquí; el vector real son las Server
  Actions y las páginas mismas.
- **El contenido de personas/recursos es público a propósito** — es el
  propósito del sitio (que se difunda para ayudar a encontrar gente). No
  reporten como hallazgo "se puede ver la información de una persona
  desaparecida sin login" — eso es el producto funcionando. Sí es hallazgo
  si se puede ver algo que **no debería ser público** (ej. el token privado
  de gestión de alguien, datos de otra tabla, columnas no destinadas a
  mostrarse).
- **Dos modelos de control distintos** en la app:
  - *Personas* → el estado oficial (localizado / fallecido) solo lo cambia
    el autor original (vía un enlace privado con token) o un moderador
    admin. Cualquier otro reporte queda visible pero marcado "sin
    verificar" — no cambia el estado oficial. Prueben si esto se puede
    saltar (IDOR).
  - *Recursos* (puntos de ayuda, hospitales) → consenso comunitario por
    voto + un "visto bueno" de admin, más gestores delegados por recurso.
- **Tokens de gestión** (`person_owners` / `resource_owners`): son la única
  barrera para editar/borrar una publicación ajena. Viven en la URL del
  enlace privado que recibe el autor al publicar. Vale la pena poner
  atención especial aquí: ¿son enumerables?, ¿se filtran en algún lado
  (logs, referrer headers, historial del navegador compartido)?, ¿hay rate
  limiting al intentar adivinarlos?

---

## 5) Cómo levantar el entorno de pruebas en local

```bash
git clone <url-del-repo>
cd venezuelatebusca
npm install
npm run dev
# http://localhost:3000 — modo demostración, datos de ejemplo en memoria,
# sin necesitar ninguna clave real. Ideal para el grueso de las pruebas.
```

Si necesitan probar con Supabase real (staging, NO producción):
```bash
cp .env.example .env.local
# rellenar con las claves del proyecto de STAGING que les compartan
npm run build && npm run start
```

---

## 6) Checklist de alcance — qué revisar a fondo

Esto es exhaustivo a propósito. No todo aplica con el mismo peso, pero
recorran cada punto.

### 6.1 Autenticación
- [ ] Fuerza de contraseñas exigida en el registro (mínimo actual: 10
  caracteres, revisar `src/lib/validation.ts`).
- [ ] Enumeración de usuarios (mensajes de error al iniciar sesión /
  recuperar contraseña — ¿son genéricos o revelan si el usuario existe?).
- [ ] Manejo de sesión: cookies (flags `httpOnly`, `Secure`, `SameSite`),
  expiración, invalidación al cerrar sesión.
- [ ] Recuperación de contraseña: ¿el flujo de reseteo es robusto? ¿el token
  del enlace de recuperación expira? ¿es de un solo uso?
- [ ] Login del panel `/admin`: fuerza bruta, comparación de credenciales,
  bloqueo tras intentos fallidos (ya se agregó un límite de 5 intentos/15
  min — verifiquen que funciona y que no se pueda evadir, ej. rotando
  cabeceras `X-Forwarded-For`).

### 6.2 Autorización / control de acceso (IDOR)
- [ ] ¿Se puede editar/borrar una persona, punto de ayuda, caravana,
  mascota, post, sin el token correcto? Prueben con tokens inventados,
  vacíos, de otro recurso.
- [ ] ¿Se puede escalar de "usuario normal" a "gestor delegado" o "admin" de
  algún recurso sin autorización?
- [ ] ¿Las Server Actions verifican permisos en el servidor, o confían en
  que la UI oculte el botón? (Prueben llamando las acciones directamente,
  no solo a través de la interfaz — con las herramientas de red del
  navegador o interceptando con un proxy.)
- [ ] Denuncias/reportes: ¿puede alguien "verificar y aplicar" un reporte de
  estado sin ser el autor/admin?
- [ ] Hospitales: ¿puede alguien que no es admin/gestor cambiar la
  capacidad/insumos oficiales?

### 6.3 Inyección y validación de datos
- [ ] SQL injection (aunque se usa el cliente de Supabase parametrizado,
  prueben específicamente los filtros de búsqueda de texto libre — ej.
  `search`, `ilike` con caracteres especiales).
- [ ] XSS almacenado: intenten inyectar `<script>`, `<img onerror=...>`,
  event handlers, en TODOS los campos de texto libre (comentarios,
  descripciones, nombres, notas) y revisen si se renderiza sin escapar en
  algún lugar (el código no usa `dangerouslySetInnerHTML` en ningún lado
  detectado, pero verifíquenlo ustedes mismos, incluidas librerías de
  terceros que rendericen markdown/HTML).
- [ ] Inyección en URLs de terceros (`whatsappUrl`, `linkUrl`, `sourceUrl`):
  ¿se puede colar `javascript:`, `data:`, o un esquema no-http para lograr
  algo al hacer clic?
- [ ] Subida de fotos: suban un archivo con extensión de imagen pero
  contenido distinto (polyglot), un SVG con script embebido, un archivo
  gigante, un nombre de archivo con path traversal (`../../etc/passwd`),
  y confirmen que todo se rechaza.
- [ ] Validación de longitud/tamaño en cada campo (¿se puede mandar un
  string de 10 MB en un campo de texto y tumbar algo?).

### 6.4 CSRF y origen de las peticiones
- [ ] Confirmen que las Server Actions rechazan peticiones con `Origin`
  distinto al del sitio (Next.js lo hace por defecto — verifíquenlo,
  no lo asuman).

### 6.5 Exposición de datos / superficie de información
- [ ] Revisen el "RSC payload" (los datos incrustados en el HTML de cada
  página) y confirmen que **no incluye** campos que no se muestran en
  pantalla (tokens, IDs internos innecesarios, datos de otros usuarios).
- [ ] Mensajes de error: ¿alguna Server Action devuelve detalles internos
  (stack traces, nombres de tabla, mensajes de Postgres) en vez de un
  mensaje genérico?
- [ ] Metadatos de imágenes subidas (EXIF con GPS del teléfono de quien
  subió la foto) — ¿se limpian antes de guardarlas? Esto es
  particularmente sensible: alguien podría subir sin querer la ubicación
  GPS exacta de su casa en la foto de una persona desaparecida.
- [ ] Fuga de información en cabeceras HTTP (`Server`, `X-Powered-By`,
  versión de Next.js expuesta).

### 6.6 Row Level Security (Supabase) — si tienen acceso a un proyecto de staging
- [ ] Con la clave `anon` (pública) intenten directamente, vía API REST de
  Supabase (sin pasar por la app), hacer `INSERT`/`UPDATE`/`DELETE` en
  cualquier tabla. Deben fallar todas.
- [ ] Intenten leer `person_owners`, `resource_owners`, `resource_managers`,
  `profiles` con la clave `anon` — deben fallar (no tienen política de
  lectura pública).
- [ ] Revisen `supabase/schema.sql` completo y comparen contra lo que
  realmente está aplicado en el proyecto (pueden divergir si no se
  re-ejecutó el script tras cambios).

### 6.7 Anti-bot / abuso / rate limiting
- [ ] Prueben evadir Turnstile (¿se puede omitir el token y que la acción
  igual se ejecute?).
- [ ] Prueben la frecuencia de publicación: ¿cuántas publicaciones seguidas
  se pueden crear en poco tiempo con una sola cuenta/IP?
- [ ] Las acciones de "me gusta"/reacciones/votos: ¿se pueden repetir sin
  límite via script (sin pasar por la deduplicación de `localStorage` del
  navegador, que es solo del lado del cliente)?

### 6.8 Panel de administración (`/admin`)
- [ ] Confirmen que **todas** las acciones del panel (no solo la página)
  verifican `isAdmin()` en el servidor.
- [ ] Prueben si un usuario normal (con sesión, sin ser admin) puede
  ejecutar acciones de admin llamándolas directamente.
- [ ] Revisen si hay algún dato sensible cargado en la página de admin que
  no debería estar (ej. tokens de gestión en texto plano).

### 6.9 Dependencias y configuración
- [ ] `npm audit` — revisen severidad real de cada hallazgo, no solo el
  conteo.
- [ ] Cabeceras de seguridad HTTP (`X-Frame-Options`, `X-Content-Type-Options`,
  `Content-Security-Policy` si se llega a implementar, `Referrer-Policy`).
- [ ] Configuración de Cloudflare (cuando esté activo): modo SSL/TLS,
  reglas de firewall/rate limiting a nivel de borde, si Turnstile está
  bien vinculado al dominio correcto.
- [ ] Secretos: confirmen que ninguna clave secreta (`SUPABASE_SERVICE_ROLE_KEY`,
  `TURNSTILE_SECRET_KEY`, `ADMIN_TOKEN`) aparece en el bundle de JavaScript
  que se manda al navegador (inspeccionen el código fuente compilado que
  llega al cliente, busquen las claves).

### 6.10 Lógica de negocio específica de esta app (no genérico de OWASP)
- [ ] ¿Se puede marcar como "Confirmado sin vida" a una persona sin ser el
  autor o admin? (Esto es especialmente delicado — piensen en el daño de
  que alguien haga esto como broma o ataque dirigido.)
- [ ] ¿Se puede suplantar la identidad de otro usuario en un comentario
  cuando se tiene sesión iniciada (que el nombre mostrado no sea
  realmente el de la cuenta autenticada)?
- [ ] ¿Se pueden crear cuentas en volumen (bypass de Turnstile) para
  manipular votos de consenso en disponibilidad de un punto de ayuda o
  insumos de un hospital?
- [ ] Denuncias de irregularidades: como quedan ligadas permanentemente a
  la cuenta que las publicó (no se pueden borrar, a propósito, para que
  no se pueda "hacer desaparecer" una denuncia) — ¿se puede abusar de
  esto para difamar sin consecuencia, publicando denuncias falsas contra
  alguien real? Esto es más una pregunta de producto/moderación que
  técnica, pero vale que lo señalen si lo consideran un riesgo real.

---

## 7) Lo que ya se revisó en una ronda previa (para no partir de cero, pero verifíquenlo ustedes)

Ya se hizo una primera pasada (documentada en `docs/INFORME-SEGURIDAD.md`,
incluido en el repo) que encontró y corrigió:
- Una Server Action de creación de contenido sin ninguna protección
  anti-bot (ya corregida).
- Ausencia total de rate limiting en el login de `/admin` (ya corregida,
  5 intentos / 15 min de bloqueo por IP).
- Ausencia total de cabeceras de seguridad HTTP (ya corregidas: 
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`).
- Generación de tokens de gestión con un respaldo débil (ya corregido,
  ahora siempre `crypto.randomUUID()`).

Y dejó pendientes, como "decisión de equipo" (sección 5 de ese informe):
rate limiting en "me gusta"/reacciones y en frecuencia de publicación,
firewall a nivel de sistema operativo del VPS, una dependencia transitoria
(`postcss`) con severidad moderada pero impacto práctico bajo.

**No asuman que esa ronda fue exhaustiva** — fue una revisión de código
hecha por un asistente de IA, útil como punto de partida, pero una auditoría
humana profunda (la que ustedes van a hacer) puede y debe encontrar más,
sobre todo en lógica de negocio (sección 6.10) y en pruebas dinámicas
contra el sitio real que un análisis estático de código no puede replicar.

---

## 8) Contacto y coordinación

Cualquier hallazgo de severidad **crítica o alta** debe reportarse de
inmediato al dueño del proyecto, no esperar al informe final — dado que hay
datos reales de personas vulnerables en juego.
