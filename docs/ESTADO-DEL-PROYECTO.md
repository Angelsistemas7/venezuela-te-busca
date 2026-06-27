# Estado del proyecto — Venezuela te busca

Última actualización: 26 jun. 2026. Para arquitectura y convenciones, ver
[`../CLAUDE.md`](../CLAUDE.md).

El proyecto **compila** (`npm run build` en verde) y corre en modo demostración
(`npm run dev`) con datos de ejemplo. Cada sección lista abajo está construida y
probada con prueba de humo (curl).

---

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
- **Rescates activos fijados arriba**: los 🚨 recientes (≤72 h) se anclan al tope.
- **Gestión por el autor**: enlace privado (`/comunidad/[id]/gestion?token=…`) para
  editar la publicación o eliminarla (reutiliza `resource_owners`).

### Comentarios (transversal a todas las secciones)
- Foro con foto en personas, posts, puntos, caravanas y hospitales.
- **Respuestas en hilo de un nivel**: botón "Responder", banner "Respondiendo a…",
  respuestas anidadas bajo el comentario raíz (`comments.parent_id`).
- **"Me gusta" por comentario** (uno por dispositivo, dedup con `localStorage`;
  `comments.likes`).

### Puntos de ayuda (`/ayuda`, `/ayuda/[id]`)
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

### Hospitales (`/hospitales`, `/hospitales/[id]`)
- Capacidad por color (operativo/saturado/lleno/cerrado, editable), especialidades,
  insumos. **Consenso de insumos** ("¿Tiene insumos? Sí/No").
- **Lista de personas atendidas** con buscador + alta. Foro con fotos (para que el
  personal suba listas de nombres) y mensaje de buena fe. "Me gusta".

### Mapa (`/mapa`)
- Leaflet. **Zonas afectadas** (marcador pulsante por estado; al pasar muestra
  por localizar / localizados / sin vida). **Puntos de ayuda** (solo disponibles),
  **hospitales** (color por capacidad), **salidas de caravanas**, **alertas de
  rescate** (pines 🚨 + franja de alertas activas), **epicentro** y ficha "Datos
  del sismo" (de fuentes públicas, en `lib/geo.ts`).

### Transversal
- **Moderación** (`/admin`, `ADMIN_TOKEN`): aprobar reportes (aplica estado),
  dar visto bueno. No bloquea: todo es visible de inmediato.
- **Anti-bot** Turnstile, **validación** zod en cliente y servidor.
- **Compresión de fotos** a WebP antes de subir (`lib/image.ts`).
- **Móvil**: barra de navegación inferior, estadísticas compactas, modales tipo hoja.
- **Importador** de exports autorizados: `scripts/import-data.mjs`.
- Esquema Postgres completo con índices + RLS: `supabase/schema.sql`.

---

## 🚧 Pendiente

**La cola aprobada (#1–#4) está completa.** Lo único que falta para que esté en
línea es desplegar (sección siguiente).

> Nota sobre #4: "Confirmado sin vida" se agrupa por **región** (estado), no por un
> campo dedicado de "dónde se encontró" (la persona no tiene ese campo aparte;
> `locationText` es la referencia de ubicación). Si en el futuro se quiere agrupar
> por el lugar exacto del hallazgo, habría que tomar `locationFound` del reporte
> verificado y guardarlo en la persona.

### Ideas mencionadas, aún no priorizadas
- Hospitales: con el tiempo, un responsable verificado por hospital que administre su info.
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
