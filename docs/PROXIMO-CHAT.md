# Estado y pendientes — "El Mundo Te Busca"

Plataforma ciudadana, sin fines de lucro, para localizar personas desaparecidas y
coordinar ayuda tras el **terremoto de Venezuela 2026**. En producción en
`elmundotebusca.com` (VPS propio, Next.js + Supabase, deploy automático por
GitHub Actions + PM2 en cada push a `main`). Español, `npm run build` siempre verde.

## 🚨 Pendiente crítico — acción del dueño (NO tocar sin sus claves)
El `.env` del VPS (`/var/www/elmundotebusca/.env`) tiene **3 secretos que siguen
siendo el texto de ejemplo `pega-aqui`** de la documentación (nunca se
reemplazaron):
- `SUPABASE_SERVICE_ROLE_KEY` — causaba que reacciones/guardados con permisos
  elevados fallaran en silencio (ya blindado en código para que avise en vez de
  fallar callado, pero la causa real sigue sin arreglar).
- `TURNSTILE_SECRET_KEY` — probablemente rechaza publicaciones de gente SIN
  sesión ("no se pudo verificar que eres humano").
- `ADMIN_TOKEN` — **hueco de seguridad**: el panel `/admin` usa un token
  adivinable (está literal en `docs/DESPLIEGUE-VPS.md`, que es público en GitHub).

El dueño dijo que lo hace él más tarde. Pasos: sacar la `service_role` real de
Supabase (Settings → API), el secreto real de Cloudflare Turnstile, generar un
`ADMIN_TOKEN` aleatorio largo, editar el `.env` en el VPS y `pm2 restart
elmundotebusca --update-env`.

## 📞 Pendiente — teléfonos de emergencia sin verificar
`src/lib/emergency.ts` solo tiene bomberos/ambulancias de **Caracas y La
Guaira**, sin verificar en la vida real, y nada de Falcón/Valencia/Maracay (zonas
también afectadas). El dueño no tiene forma de verificarlos ahora mismo — se
irán completando **cuando la comunidad aporte números confirmados**. No
inventar ni "corregir" ningún teléfono sin confirmación real (son datos de vida
o muerte).

## Metodología de esta ronda: auditoría profunda por sección
El dueño pidió repasar el sitio **sección por sección, a fondo** (rendimiento,
caché de Supabase/VPS, bordes, animaciones, transiciones, bugs reales — no
cambios al azar). Ya se hizo, con commits propios cada vez:
- **Se busca** — cache de `getCountsByEstado`, tap feedback en `PersonCard`.
- **¿La reconoces?** — carruseles por edad (paridad con "Se busca"), fix de
  búsqueda por rasgos (`search_doc` no incluía `description`; correr
  `supabase/schema.sql` si no se ha hecho).
- **Comunidad** — paginación clásica (10/20/50 por página, no scroll infinito:
  se probó y el dueño prefirió páginas), fijados/rescates en carrusel lateral,
  orden por relevancia (`reactions_total`, columna calculada), fix de "me
  gusta" que no se guardaba (mismo problema de fondo que las claves del VPS).
- **Mapa** — control de capas nativo de Leaflet más fácil de tocar en móvil.
- **Fichas de persona** — `BackLink` (usa el historial del navegador: "volver
  al listado" ya no pierde el filtro/página), botón "Compartir" separado de
  las reacciones (debajo de "Guardar"), imagen de compartir POR PERSONA (foto
  real + estado + texto), reportes de estado unificados visualmente con
  "Información de la comunidad".
- **Vaivén leve** (`SwipeHint.tsx`): se pausa al tocar/deslizar, retoma solo a
  los 10s, amplitud reducida (6px).
- **Emergencias** — página 100% estática (no tenía ninguna consulta a la BD;
  antes forzada a "force-dynamic" sin motivo), tap feedback en los teléfonos.
- **Noticias** — código muerto eliminado (`getLatestNews`/GDELT, ya no se
  usaba), dominio viejo en el `appname` de ReliefWeb, aviso de "vas a salir
  del sitio" en titulares/fuentes (contenido de terceros).
- **Hospitales** — **hallazgo grande**: TODO `lib/data.ts` tenía el mismo
  patrón sin revisar errores de `reactToPerson`/`reactToPost` (~18 lugares:
  likes de aid_points/marches/comments/heroes/news_items/hospitales,
  votos de insumos/disponibilidad, `person_owners`/`resource_owners`
  (enlaces de gestión), `saved_items`, `resource_managers`). Se revisó y
  blindó TODO el archivo (ya no queda ningún `await sb...update/insert/delete`
  sin comprobar `error`). Esto es justo lo que las 3 claves del VPS seguían
  rompiendo en silencio — doblemente importante corregir esas claves.
  También: `HospitalCard` sin tap feedback (mismo bug que `PersonCard`),
  buscador de pacientes con el mismo problema de zoom en iPhone.

- **Voluntarios** — mismo bug de Comunidad: `getVolunteers` traía hasta 300 sin
  paginar, cacheado 60s. Nueva `getVolunteersPage` (en vivo, 10/20/50 a
  elegir) para la página; se dejó `getVolunteers` intacta para el mapa.

- **Puntos de ayuda** — mismo bug de Comunidad/Voluntarios: `getAidPoints()`
  traía la tabla entera cacheada 60s sin límite. Nueva `getAidPointsPage`
  (en vivo, filtro por tipo/disponibilidad, 10/20/50 a elegir); se dejó
  `getAidPoints` intacta para `/admin` y `/mapa`. Tap feedback (`.press`)
  agregado en varios botones que quedaron sin él: teléfono y "Ver y
  comentar" de `AidPointCard`, teléfono y "Gestionar este punto" en la
  ficha, y en `AidPointManagePanel` (checkbox de tipos, "Guardar cambios",
  toggle Disponible/Agotado, "Eliminar" y su confirmación "Sí,
  eliminar"/"Cancelar"), y en `RegisterAidPointButton` (dropzone de foto,
  "Cerrar", "Cancelar"/"Publicar punto").

## Siguiente en la cola
Caravanas/Denuncias, Mascotas, Admin.

## Otros pendientes menores
- Los 4 documentos del kit de prensa (`docs/kit-prensa/`) con el nombre nuevo.
- Botón "Comunicados de prensa" en Noticias → Drive.
- Importar personas (export autorizado del dueño).
