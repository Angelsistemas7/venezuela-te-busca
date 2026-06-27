# Repaso final pre‑lanzamiento (calidad)

> Prompt reutilizable para un chat nuevo. Calidad **no** seguridad (eso va en
> [`AUDITORIA-SEGURIDAD.md`](AUDITORIA-SEGURIDAD.md)).

Eres un agente de Claude Code trabajando en "Venezuela te busca" (plataforma sin
fines de lucro para localizar personas desaparecidas y coordinar ayuda tras el
terremoto de Venezuela 2026). Está por lanzarse y compila en verde.

Antes de tocar nada, LEE: `CLAUDE.md` (arquitectura y reglas) y
`docs/ESTADO-DEL-PROYECTO.md` (qué hay hecho). El producto y la comunicación son en
**ESPAÑOL**. Límite ético: NO scrapear `venezuelatebusca.com` ni saltar su Cloudflare.
Corre `npm run build` para confirmar verde antes y después de cualquier cambio.

TAREA: repaso final pre‑lanzamiento de **CALIDAD** (no seguridad, eso va en otro chat).
Primero audita y entrégame una lista priorizada (P0 = rompe o avergüenza en el
lanzamiento, P1 = importante, P2 = menor); luego corrige las P0/P1 verificando con
build. Revisa:

1. **Textos y tono**: ortografía, claridad, consistencia y SENSIBILIDAD — es una
   tragedia con personas desaparecidas (muchas menores); tono respetuoso y sobrio.
2. **Accesibilidad**: contraste, `<label>` en todos los campos, `alt` en imágenes,
   foco visible, navegación por teclado, roles/aria en modales, tamaños táctiles en
   móvil, jerarquía de encabezados.
3. **Móvil**: que todo se vea y funcione bien en pantallas chicas (modales, mapa,
   nav inferior).
4. **Rendimiento**: tamaño/lazy de imágenes, posible N+1 (en `/comunidad` se hace
   `getComments` por cada post), nº de marcadores del mapa, `revalidate`/caché, bundle.
5. **Estados** vacíos, de carga y de error coherentes en todas las secciones.
6. **Metadata/SEO**: `<title>`, descripción, Open Graph, `lang`, favicon, robots.
7. **Consistencia visual** entre secciones (botones, chips, tarjetas, espaciado).

Dame el inventario priorizado ANTES de editar.
