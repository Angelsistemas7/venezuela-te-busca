# Estado del proyecto — Venezuela te busca

Última actualización: 26 jun. 2026. Para arquitectura y convenciones, ver
[`../CLAUDE.md`](../CLAUDE.md).

> ⚠️ **Este documento quedó desactualizado** (describe el estado de antes del
> despliegue en VPS, del sistema de cuentas/roles, de la auditoría de
> seguridad y de todo lo construido después). Para el estado REAL y actual
> del proyecto, lee [`PROXIMO-CHAT.md`](PROXIMO-CHAT.md) primero — es el
> documento que se ha mantenido al día en cada sesión. Este archivo se deja
> como referencia histórica de la arquitectura original.

El proyecto **compila** (`npm run build` en verde) y corre en modo demostración
(`npm run dev`) con datos de ejemplo. Cada sección lista abajo está construida y
probada con prueba de humo (curl).

---

## 🔄 Reorganización de navegación (28 jun. 2026 — sin subir aún, build verde)
- **Menú de 8 ítems** (arriba y barra inferior móvil con íconos): Se busca ·
  Comunidad · Noticias · Hospitales · Puntos de ayuda · Mascotas · Emergencias ·
  Mapa. (`SiteHeader`, `MobileNav`).
- **Comunidad = centro con pestañas** (`CommunityTabs`): Muro · Voluntarios ·
  Caravanas · Denuncias (páginas separadas con barra común; "Comunidad" se
  resalta en todas).
- **Noticias = pestañas** (`NoticiasTabs`): Héroes · Ayuda humanitaria · Últimas
  noticias · **Sismos** (el widget de réplicas USGS se movió aquí desde el inicio).
- **Portada con interruptor** (`PersonViewToggle`): "Se busca" ↔ "¿La reconoces?"
  vía `?view=`. `/sin-identificar` ahora **redirige** a `/?view=reconoces`.
- **Noticias curadas** (`news_items`): el admin agrega noticias/ayuda con su fuente
  (botón en las pestañas), con like + comentarios (`entity_type='news_item'`).
  Conviven con el feed en vivo. No se siembran (no se inventan); `getNewsItems`
  tolera tabla ausente (`.catch(()=>[])`).
- **Foto en voluntarios** (columna `volunteers.photo_url`).
- **Genéricos quitados** del seed (voluntarios + mascotas de ejemplo). ⚠️ En la
  base EN VIVO hay que borrarlos a mano (SQL) — siguen ahí del primer seed.
- **Fix modal** (`Modal.tsx`): usa `dvh` en vez de `vh` para que el login/los
  modales no salgan cortados en móvil.
- **Mapa**: `jitter` reducido y coordenadas costeras/Cartagena corregidas (ya no
  caen "en el agua").
- **Al desplegar este bloque**: re-correr `supabase/schema.sql` (crea `heroes` ya
  estaba; ahora `news_items`, columna `volunteers.photo_url`, y amplía el check de
  `comments.entity_type`). Idempotente.

## ✅ Construido y funcionando

### Personas — dos intenciones (reformulado por claridad)
- **Dos pestañas según el objetivo**, no según un dato abstracto:
  - 🔍 **"Se busca"** (`/`): personas **con información** que alguien busca (tengo
    sus datos, no sé dónde está). Búsqueda, **filtros**, **paginación en servidor**,
    **secciones destacadas** y chips **Por estado**.
  - 📍 **"¿La reconoces?"** (`/sin-identificar`): personas **sin identificar** que
    alguien **vio o encontró** (sé dónde está, no sé quién es). Búsqueda por foto/rasgos.
- **Al publicar, primer paso "¿Qué quieres hacer?"** (Busco / Vi) que coloca la
  persona en la pestaña correcta y adapta el formulario. En "Vi", el **nombre es
  opcional** (puede ser solo foto) pero se exige al menos foto, descripción o lugar.
- Ficha `/persona/[id]`: foto (con fallback a iniciales si falla), datos, contacto,
  reportes visibles al instante, reacciones 🙏❤️📢 (con "Difundo" que comparte),
  foro de comentarios (con foto).
- **Reportes con fricción anti-abuso** ("Tengo información"): visibles ya como
  "sin verificar"; el estado oficial solo cambia por autor o moderador.
- **Autoría**: al publicar se entrega un **enlace privado de gestión**
  (`/persona/[id]/gestion?token=…`); el autor cambia estado, edita o elimina.
- **Agrupación al filtrar** por estado de localización: Hospitalizado → por
  hospital; Localizado y Confirmado sin vida → por región. "Por localizar" y
  "Todos" siguen en rejilla plana con paginación. (`getPersonGroups` + `PersonGroups`.)
- Etiqueta de fallecido = **"Confirmado sin vida"** (decisión del usuario).

### Comunidad / Feed (`/comunidad`)
- Publicaciones por tipo: 🆘 Necesito, 🤲 Ofrezco, 🚨 Rescate, 🏥 Médico,
  🚐 Caravana, 🕊️ Identificar, 📣 Info. Con foto, enlace externo, reacciones y
  comentarios. Filtro por tipo.
- **Buscar en el muro** (texto/sector/nombre); la búsqueda se conserva al cambiar de tipo.
- **Destacado (fijado)**: publicaciones con `pinned` (avisos del equipo) se anclan
  arriba en su propia sección 📌. Debajo, **rescates activos** (🚨 recientes ≤72 h).
  El admin **fija/desfija** publicaciones desde `/admin` (sección "Publicaciones").
- **Gestión por el autor**: enlace privado (`/comunidad/[id]/gestion?token=…`) para
  editar la publicación o eliminarla (reutiliza `resource_owners`).

### Denuncias de irregularidades (`/denuncias`)
- Reportes ciudadanos por **categoría** (riesgo a la niñez, desvío/robo de ayuda,
  fraude, abuso de autoridad, persona desaparecida, otra). Foto, ubicación, búsqueda.
- **Apoyar** (uno por dispositivo) y **comentarios** por denuncia.
- **Publicar exige sesión** (no anónimo ante el sistema = responsabilidad) y pasa por
  un **aviso legal + confirmación** ("la información es veraz; una acusación falsa
  tiene consecuencias"). Riesgo a menores → recuerda llamar al 911.
- Salvaguarda de diseño: la guía pide **no señalar a personas con nombre/foto sin
  pruebas**; los ejemplos sembrados son neutrales (no acusan a nadie). Modelo:
  tabla `complaints` + comentarios con `entity_type='complaint'`.

### Mascotas (`/mascotas`)
- Reportes de mascotas **perdida / encontrada / en refugio / en veterinario**, por
  especie (perro/gato/otro). Foto, descripción, ubicación, contacto y **comentarios**
  (igual que personas). Filtros por estado del reporte y búsqueda por nombre/ciudad.
- Modelo: tabla `pets` + comentarios `entity_type='pet'`. Publicar es abierto (Turnstile).

### Voluntarios (`/voluntarios`, "Puedo ayudar")
- Directorio de quienes se ofrecen: tipo (médico, enfermero, psicólogo, rescatista,
  conductor, cocinero, traductor, electricista, otra), disponibilidad, habilidades,
  ciudad y contacto (teléfono/correo). Filtro por tipo y búsqueda por nombre/ciudad.
- Modelo: tabla `volunteers`. Publicar es abierto (Turnstile). Alimenta el contador
  "Voluntarios" del panel de cifras del inicio.

### Comentarios (transversal a todas las secciones)
- Foro con foto en personas, posts, puntos, caravanas y hospitales.
- **Respuestas en hilo de un nivel**: botón "Responder", banner "Respondiendo a…",
  respuestas anidadas bajo el comentario raíz (`comments.parent_id`).
- **"Me gusta" por comentario** (uno por dispositivo, dedup con `localStorage`;
  `comments.likes`).

### Puntos de ayuda (`/ayuda`, `/ayuda/[id]`)
- **Filtros**: chips por recurso (comida/agua/refugio…) + "Solo disponibles";
  los disponibles se muestran primero.
- **Varios recursos por punto** (comida + agua + refugio…). Foto, horario, contacto.
- **Consenso de disponibilidad** ("✅ Sí hay / ❌ Se acabó" → marca Agotado solo).
- Estado verificado/por verificar. "Me gusta" y foro con fotos en la ficha.
- **Gestión por el autor**: al publicar se entrega un **enlace privado**
  (`/ayuda/[id]/gestion?token=…`) para editar (recursos, horario, ubicación) o eliminar.

### Caravanas benéficas (`/caravanas`, `/caravanas/[id]`)
- Salida, destino, fecha/hora, organizador. **Enlace de grupo de WhatsApp**.
  "Me gusta" y foro. Separadas en Próximas / Finalizadas.
- **Gestión por el autor**: enlace privado (`/caravanas/[id]/gestion?token=…`) para
  editar (p. ej. la hora de salida) o eliminar.
- **Conmutador** Todas / Próximas / Finalizadas (con conteos).

### Hospitales (`/hospitales`, `/hospitales/[id]`)
- Capacidad por color (operativo/saturado/lleno/cerrado, editable), especialidades,
  insumos. **Consenso de insumos** ("¿Tiene insumos? Sí/No"). Sello verificado.
- **Lista de personas atendidas** con buscador + alta. Foro con fotos (para que el
  personal suba listas de nombres) y mensaje de buena fe. "Me gusta".

### Contenido inicial (para no salir vacío en el lanzamiento)
- **Hospitales reales** de la zona afectada y de la red que recibe heridos
  (La Guaira, Caracas/Distrito Capital, Miranda, Yaracuy, Carabobo, Aragua,
  Falcón): nombre, dirección y teléfono de fuentes públicas. Algunos teléfonos
  quedaron en blanco **a confirmar** (Periférico de Pariata, Naval, Materno de
  Macuto). El estado de capacidad es ilustrativo.
- **Puntos de ayuda**: refugios, acopios, agua, comedores; **alojamiento** (hogares
  que abren sus puertas) y **acopios en el exterior** (Colombia: Cartagena, Medellín,
  Bogotá, Cúcuta; Panamá, España/Madrid, EE. UU./Miami, Chile, Perú, Ecuador,
  Brasil/Boa Vista — diáspora que reúne y envía). Sin teléfono (confirmar con cada
  organización). Los internacionales van como **"Por verificar"** y SIN atribuir a
  ningún medio hasta confirmarlo.
- **Publicaciones de comunidad** con comentarios humanizados por tema, incl. dos
  **avisos fijados**: cómo entregar la ayuda de forma segura y **protección a la
  niñez**.
- Vive en dos lugares: `src/lib/seed.ts` (modo demostración) y
  **`supabase/seed-contenido.sql`** (cargar UNA vez en Supabase para producción,
  después de `schema.sql`).

### Tipo de punto "alojamiento" + barra de seguridad
- Nuevo tipo de punto de ayuda **`alojamiento`** (🛏️): hogares/casas que ofrecen
  techo. Aparece en filtros de `/ayuda`, en el formulario y en el mapa. Requiere
  migración del enum `aid_point_type` (incluida en `schema.sql`).
- **Barra fija de protección a la niñez** (`components/SafetyBanner.tsx`) en todo el
  sitio, ocultable por dispositivo. Mensaje suavizado + enlace al 911.
- **Mapa**: los puntos internacionales se ubican con coordenadas en `lib/geo.ts`
  (Colombia/Panamá); el mapa sigue centrado en la zona del sismo (acercar/alejar
  para ver el exterior).

### Mapa (`/mapa`)
- Leaflet. **Zonas afectadas** (marcador pulsante por estado; al pasar muestra
  por localizar / localizados / sin vida). **Puntos de ayuda** (solo disponibles),
  **hospitales** (color por capacidad), **salidas de caravanas**, **alertas de
  rescate** (pines 🚨 + franja de alertas activas), **epicentro** y ficha "Datos
  del sismo" (de fuentes públicas, en `lib/geo.ts`).
- **Popups con enlace** a la ficha completa: puntos→`/ayuda/[id]`,
  hospitales→`/hospitales/[id]`, caravanas→`/caravanas/[id]`, rescates→`/comunidad`.
- **Capas activables/desactivables** (`LayersControl` de react-leaflet, arriba a la
  derecha): 🆘 **Necesito ayuda** (posts tipo `necesito` anclados a su ubicación) y
  🤲 **Puedo ayudar** (voluntarios + posts `ofrezco`), además de rescates, puntos,
  hospitales, caravanas y zonas. Los popups de las dos capas nuevas traen
  **"Escribir por WhatsApp"** (link `wa.me` con mensaje prellenado desde el teléfono
  del registro; helper `whatsappLink` en `lib/utils.ts`) y **"Cómo llegar"**
  (indicaciones en Google Maps; helper `directionsLink`). Sin BD nueva: reusa
  `getPosts`/`getVolunteers` + `geocode` de `lib/geo.ts`.

### Verificación por el admin + gestores delegados
- **Visto bueno con evidencia**: cualquiera publica un punto de ayuda u hospital y
  aparece de inmediato como **"Por verificar"**. En `/admin` el moderador revisa la
  evidencia (ubicación, contacto, foto) y lo marca **"Verificado"** (sello
  `BadgeCheck`). Aplica a personas, puntos de ayuda y **hospitales** (campo
  `verified` añadido a `hospitals`). El cambio de `verified` es solo por service role.
- **Gestores delegados por recurso** (`resource_managers`): el admin otorga a una
  **cuenta** permiso para administrar un hospital o punto concreto, sin ser el admin
  global ni el publicador. Se asignan/quitan en `/admin` por nombre de usuario
  (`profiles` es privada). El estado oficial del hospital (capacidad/insumos) y la
  gestión del punto la pueden hacer: **admin, autor por cuenta o gestor delegado**;
  el resto opina con el voto (no vinculante) o por comentarios.

### Transversal
- **Moderación** (`/admin`, `ADMIN_TOKEN`): aprobar reportes (aplica estado),
  dar visto bueno a personas/puntos/hospitales, asignar gestores. No bloquea: todo
  es visible de inmediato.
- **Anti-bot** Turnstile, **validación** zod en cliente y servidor.
- **Compresión de fotos** a WebP antes de subir (`lib/image.ts`).
- **Móvil**: barra de navegación inferior, estadísticas compactas, modales tipo hoja.
- **Importador** de exports autorizados: `scripts/import-data.mjs`.
- Esquema Postgres completo con índices + RLS: `supabase/schema.sql`.

---

### Inicio (dashboard) y recursos de emergencia
- **Panel de cifras** en el inicio: Desaparecidos, En hospitales, A salvo, Niños,
  Fallecidos, Denuncias, Necesidades, Ofrecimientos (de la base real) + cifras del
  sismo (heridos/fallecidos, fuentes públicas). `getDashboardStats`.
- **Localizados recientemente**: personas que estaban desaparecidas y ya fueron
  ubicadas (`getRecentlyLocated`). Da esperanza e incentiva el uso.
- **Asistente**: nota que orienta a buscar por nombre en el buscador (el
  reconocimiento facial por foto no es viable gratis, se omitió a propósito).
- **Réplicas y sismos recientes**: widget con datos REALES del **USGS** (API
  gratuita, `lib/usgs.ts`), en inicio y en `/mapa`. Si la API falla, aviso suave.

### Noticias y ayuda humanitaria (`/noticias`) — feed en vivo
- Sección **de solo lectura** que cita su fuente, con datos en vivo de dos APIs
  públicas y **gratuitas sin clave** (`lib/news.ts`, patrón USGS con `try/catch` +
  aviso suave si fallan):
  - **Ayuda humanitaria internacional** — reportes oficiales de **ReliefWeb (ONU/
    OCHA)** filtrados por país Venezuela (ayuda que llegó / va en camino / anunciada).
  - **Últimas noticias** — titulares de prensa mundial vía **GDELT 2.0 Doc API**.
- **Filtro Venezuela** (`isVenezuela` en `lib/news.ts`): se descarta lo que no
  mencione Venezuela/zona del sismo. Cada artículo enlaza a su fuente original y
  muestra medio + hora. Cacheado 30 min (`revalidate`). Componente `NewsList`.
- **Héroes** (subsección curada, en BD `heroes`): reconocimiento a bomberos,
  rescatistas, perros de búsqueda, personal de salud y donantes. Con **like +
  comentarios** (`entity_type='hero'`) y **fuente** cuando la hay. Sembrados por
  CATEGORÍA (sin señalar a personas concretas, sin atribución falsa).
  - **Publicación abierta con control**: cualquiera puede **proponer** un héroe
    (Turnstile, `ProposeHeroButton` → `registerHeroAction`); aparece como
    **"sin verificar"** hasta que el moderador le da el **visto bueno** en `/admin`
    (`toggleHeroVerifiedAction`) o lo **elimina** (`deleteHeroAction`). Mismo modelo
    que puntos/hospitales. `getHeroes()` solo trae verificados al público;
    `includeUnverified` para el panel. Componentes `HeroCard`, sección en
    `AdminDashboard`.
- Enlazada en el menú superior (`SiteHeader`). Vive en `seed.ts` (demo) y
  `supabase/seed-contenido.sql` (prod, idempotente).
- **Emergencia y seguridad** (`/emergencias`): línea 911, directorio de ambulancias
  y bomberos por municipio (referencia, a confirmar), **guía rápida** de 9 pasos y
  **Compartir por WhatsApp**.
- **Compartir por WhatsApp** (`ShareWhatsApp`) en el pie y en `/emergencias`, con el
  mensaje "entre más personas vean la página, más personas pueden estar a salvo".
- **Más hospitales**: añadidos varios de Caracas (José Gregorio Hernández, Militar,
  Periférico de Catia/Coche) con teléfono, y de Zulia/Táchira.

## 🚧 Pendiente

**La cola aprobada (#1–#4) está completa.** Lo único que falta para que esté en
línea es desplegar (sección siguiente).

> Nota sobre #4: "Confirmado sin vida" se agrupa por **región** (estado), no por un
> campo dedicado de "dónde se encontró" (la persona no tiene ese campo aparte;
> `locationText` es la referencia de ubicación). Si en el futuro se quiere agrupar
> por el lugar exacto del hallazgo, habría que tomar `locationFound` del reporte
> verificado y guardarlo en la persona.

### Ideas mencionadas, aún no priorizadas
- ¿Voto sólo para "usuarios verificados"? Hoy votar exige sesión (cualquier cuenta)
  y es no vinculante. Se podría añadir un nivel de usuario de confianza aprobado por
  el admin si se quiere endurecer (decisión abierta).
- Más reacciones/medios (video) en publicaciones.
- Agrupar por lugar exacto del hallazgo en "Confirmado sin vida" (ver nota de #4).

---

## 🚀 Para poner en línea (lo hace el usuario)
Seguir `docs/GUIA-DESPLIEGUE.md`: GitHub → Supabase (pegar `supabase/schema.sql`,
crear bucket público `photos`) → Cloudflare Turnstile → Vercel (variables de
`.env.example` + `ADMIN_TOKEN`) → dominio. Sin VPS. Costo inicial ~$0.

> Recordatorio para un chat nuevo: confirma el estado con `npm run build` antes de
> seguir, y mantén `types.ts` ↔ `supabase/schema.sql` ↔ `seed.ts` sincronizados al
> tocar cualquier modelo.
