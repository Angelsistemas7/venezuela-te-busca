# Auditoría de ciberseguridad

> Prompt reutilizable para un chat nuevo. Seguridad **defensiva** de una app propia
> del usuario. Complemento sugerido: arrancar con el comando integrado
> `/security-review` (revisa el diff de la rama) y luego este prompt para una pasada
> completa.

Eres un agente de Claude Code haciendo una AUDITORÍA DE SEGURIDAD autorizada de
"Venezuela te busca", una app propia del usuario a punto de lanzarse. Es defensiva:
protege a personas reales — la base tiene datos sensibles (nombres, cédulas, fotos),
MUCHAS de menores. Trata la protección de esos datos como prioridad máxima.

Antes de nada, LEE: `CLAUDE.md`, `docs/ESTADO-DEL-PROYECTO.md` y especialmente
`supabase/schema.sql`. Stack: Next.js 15 (Server Actions) + Supabase (Postgres +
Storage + RLS) + Cloudflare Turnstile + zod. Límite ético: NO scrapear el sitio
original. `npm run build` debe seguir verde.

TAREA: revisa la seguridad y entrégame un informe de hallazgos con SEVERIDAD
(crítica/alta/media/baja) + recomendación; luego aplica las correcciones
crítica/alta verificando con build. Cubre al menos:

1. **RLS** (`supabase/schema.sql`): lectura/escritura pública bien acotada; que
   `person_owners` y `resource_owners` NO tengan lectura pública (los tokens son
   secretos); que UPDATE/DELETE sensibles exijan service role.
2. **Secretos**: `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_TOKEN` solo en servidor, nunca
   al cliente (revisa `src/lib/supabase.ts`, `admin.ts` y qué es `NEXT_PUBLIC_*`).
   `.env` fuera de git.
3. **Tokens de gestión** (`person_owners`/`resource_owners`): aleatoriedad
   (`crypto.randomUUID`), no adivinables ni enumerables; implicaciones de llevar el
   token en la URL.
4. **Validación e inyección**: zod en TODAS las Server Actions (`src/app/actions.ts`);
   Turnstile en todas las mutaciones públicas (`src/lib/turnstile.ts`); XSS (¿algún
   `dangerouslySetInnerHTML`?, contenido de usuario); consultas seguras.
5. **Subida de fotos** (`src/lib/upload.ts`, `image.ts`): tipo/tamaño validados,
   permisos del bucket, abuso.
6. **IDOR / control de acceso**: que nadie edite o borre recursos de otro sin el
   token; panel `/admin` bien protegido (`src/lib/admin.ts`).
7. **PII y abuso**: enumeración de personas, rate limiting/spam, fuga de datos en
   respuestas o errores; enlaces externos (`linkUrl`/`whatsappUrl`) con
   `rel=noopener` y sin open redirect/SSRF.
8. **Dependencias**: `npm audit`.

Dame el informe priorizado ANTES de corregir.
