# Checklist de infraestructura en vivo (Cloudflare / Supabase / nginx / VPS)

Fase siguiente a la auditoría estática (`docs/INFORME-SEGURIDAD.md` §16).
Esto no se revisa leyendo el repositorio — se revisa entrando a los paneles
reales y al VPS real, porque la configuración desplegada puede no coincidir
con lo que dicen los archivos del proyecto. Orden por impacto esperado.
Marca cada casilla según la vayas confirmando; si algo no coincide con lo
"esperado", anótalo y lo corregimos.

---

## 1) Cloudflare ⭐⭐⭐⭐⭐

Dashboard → selecciona `elmundotebusca.com`.

**DNS**
- [ ] Los registros `A` de `@` y `www` tienen la nube **naranja** (proxied),
  no gris (DNS only). Si está gris, Cloudflare no protege nada — el
  tráfico va directo al VPS.
- [ ] Verifica que el VPS no responda si le pegan directo a su IP (saltando
  Cloudflare). Desde tu PC:
  ```powershell
  curl.exe -I http://TU_IP_DEL_VPS
  ```
  Debe fallar o devolver algo vacío/cerrado (por el bloque `default_server`
  de `docs/DESPLIEGUE-VPS.md` §3) — **no** debe devolver el HTML del sitio.
  Si lo devuelve, ese bloque nginx no está aplicado todavía → prioridad alta.

**SSL/TLS**
- [ ] Overview → modo **"Full (strict)"** (no "Flexible" ni "Full" a
  secas). Con certbot ya generando certificado real en el VPS, strict es lo
  correcto: valida que el certificado del origen sea válido, no solo que
  exista.
- [ ] Edge Certificates → **Always Use HTTPS**: ON.
- [ ] Edge Certificates → **HSTS**: actívalo (con un `max-age` razonable,
  p. ej. 6 meses) una vez confirmes que HTTPS funciona siempre — HSTS le
  dice al navegador "nunca intentes HTTP con este dominio", cerrando la
  ventana de un downgrade.

**WAF**
- [ ] Security → WAF → **Managed Rules**: activa el "Cloudflare Managed
  Ruleset" (incluido en el plan gratuito). Filtra ataques genéricos conocidos
  (inyección, paths de exploits comunes) antes de que lleguen a la app.

**Bots y nivel de seguridad**
- [ ] Security → Settings → **Security Level**: Medium o High.
- [ ] Security → **Bot Fight Mode**: ON (gratuito). Complementa —no
  reemplaza— a Turnstile, que ya protege los formularios de publicar.

**Rate Limiting Rules**
- [ ] Crea una regla sobre `/admin` (o donde esté el login del panel): p.
  ej. más de 10 peticiones/minuto desde la misma IP → challenge o bloqueo.
  Es una segunda capa sobre el freno de fuerza bruta que ya tiene el código
  (`src/lib/admin.ts`), a nivel de red en vez de proceso — sobrevive incluso
  si el VPS se reinicia.
  > Nota: las Server Actions de Next.js pegan todas a la misma URL de la
  página (con un header `Next-Action` distinto por acción) — una regla de
  rate limiting por URL aquí es más gruesa que por endpoint específico; aun
  así vale la pena para el login de `/admin`, que sí es una URL propia.

**Cache Rules**
- [ ] Confirma que no haya **Page Rules heredadas** (Rules → Page Rules) de
  cuando el dominio apuntaba a Vercel — pueden forzar cacheo de HTML
  dinámico y servir contenido viejo o de otro usuario.
- [ ] Cache Level: Standard está bien (cachea estáticos por extensión, no
  HTML) siempre que no haya una Cache Rule custom que diga lo contrario.

**Otros**
- [ ] Origin Rules / Transform Rules / Response Header Transform: revisa
  que no exista ninguna (no las necesitas para este stack; si aparece algo
  que no configuraste tú ni tu compañero, investígalo antes de borrarlo).
- [ ] Zero Trust: no aplica (el sitio es público a propósito).
- [ ] **Development Mode**: apagado (se usa temporalmente para probar sin
  caché y se les olvida apagar — revisa que no haya quedado prendido).
- [ ] **Rocket Loader**: déjalo **apagado**. Este sitio tiene mapas Leaflet
  e interacción con fotos que dependen del orden de carga de scripts;
  Rocket Loader difiere la ejecución y puede romper esa inicialización sin
  un error claro en consola.

---

## 2) Supabase ⭐⭐⭐⭐⭐

Dashboard del proyecto → no el código, el **proyecto desplegado**.

**Storage**
- [ ] Storage → bucket `photos` → confirma que es **Public** (a propósito:
  las fotos deben verse sin sesión).
- [ ] Storage → Policies: deben existir políticas de **INSERT** para
  `anon`/`authenticated`, y **ninguna** de `UPDATE`/`DELETE` para esos
  roles (los borrados de Storage los hace el servidor con `service_role`,
  que se salta las políticas — revisado en el código, confírmalo aquí
  contra lo que el panel muestra en vivo).

**RLS efectivo**
- [ ] Database → Tables: cada tabla debe mostrar el candado de **RLS
  habilitado** (verde). Si alguna aparece sin RLS, es una tabla
  completamente abierta a quien tenga la `anon key` (que es pública, va en
  el navegador).
- [ ] Para 2-3 tablas sensibles (`persons`, `person_owners`,
  `resource_owners`), abre sus políticas y confirma que solo hay `SELECT`
  para `anon`/`authenticated` — ninguna de escritura.

**Auth**
- [ ] Authentication → URL Configuration → **Site URL**:
  `https://elmundotebusca.com` (no `localhost`, no una URL vieja de
  Vercel).
- [ ] Authentication → URL Configuration → **Redirect URLs**: solo tu
  dominio real, sin comodines sueltos ni URLs de pruebas viejas.
- [ ] Authentication → Settings → **JWT expiry**: valor por defecto (3600s)
  está bien; si alguien lo subió mucho, bájalo.
- [ ] Authentication → Settings → **Refresh Token Rotation**: activado
  (detecta si un refresh token robado se reutiliza).
- [ ] Authentication → Providers → **SMTP**: si sigue en el SMTP
  compartido de Supabase, ojo: tiene límite bajo de correos/hora (recuperar
  contraseña puede fallar bajo uso real) y puede caer en spam. No es
  urgente para el lanzamiento, pero anótalo para cuando haya más usuarios.

**Superficie**
- [ ] Edge Functions: confirma que no hay ninguna desplegada que no
  reconozcas (este proyecto no usa Edge Functions).
- [ ] Database → Extensions: deberían estar habilitadas solo las que se
  usan (`pg_trgm` para los índices de búsqueda, `pgcrypto`/`uuid-ossp` para
  IDs). Si ves alguna que no reconoces, es superficie extra sin necesidad.
- [ ] Project Settings → API: confirma que la `service_role key` que está
  en el `.env` del VPS es la real del proyecto (no la `anon key` puesta por
  error, ni una clave vieja rotada).
- [ ] Logs → Auth Logs: un vistazo rápido buscando picos raros de intentos
  fallidos de login.

---

## 3) nginx en el VPS ⭐⭐⭐⭐

No asumas que el archivo del repo coincide con lo que corre en el VPS —
confírmalo por SSH:

```bash
sudo nginx -T | grep -E "server_tokens|client_max_body_size|default_server|ssl_protocols|gzip on"
```

- [ ] `server_tokens off;` presente.
- [ ] Existe el bloque `default_server` (puerto 80 **y** revisa si certbot
  agregó uno equivalente al bloque 443 — certbot a veces solo edita el
  bloque principal y deja el `default_server` de 443 sin cubrir; si el 443
  no tiene un catch-all, alguien pegándole por IP con SNI vacío podría caer
  igual en el bloque real).
- [ ] `client_max_body_size 12M;` presente (subida de fotos).
- [ ] `ssl_protocols` solo incluye `TLSv1.2 TLSv1.3` (nada de TLSv1/1.1,
  certbot moderno ya lo hace bien por defecto, pero confírmalo).
- [ ] `gzip on;` (compresión — normalmente ya viene por defecto en
  `/etc/nginx/nginx.conf`).
- [ ] Con el sitio abierto en el navegador, F12 → pestaña **Network** → clic
  en el documento principal → **Headers** de la respuesta: confirma que
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` llegan
  intactos (los pone `next.config.ts`, pero nginx o Cloudflare podrían
  reescribirlos — no debería, pero se confirma mirando, no asumiendo).

---

## 4) Hardening del VPS ⭐⭐⭐⭐

Esto no es pentesting, es higiene básica de servidor. Por SSH:

- [ ] **Firewall**: `sudo ufw status` — solo 22 (SSH), 80 y 443 abiertos.
  El puerto de la app (3200) **no** debe ser accesible desde fuera, solo
  vía `127.0.0.1` (nginx le pega por localhost).
- [ ] **Puertos escuchando**: `sudo ss -tulpn` — nada inesperado en
  interfaces públicas.
- [ ] **SSH**: `sudo grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config`
  → `PermitRootLogin no`, `PasswordAuthentication no` (solo llave, como ya
  configuraste para el deploy).
- [ ] **Fail2ban**: `sudo fail2ban-client status` — instalado y con el
  jail de `sshd` activo como mínimo.
- [ ] **Actualizaciones**: `sudo apt list --upgradable` — si hay parches de
  seguridad pendientes, aplícalos (`sudo apt update && sudo apt upgrade`);
  idealmente `unattended-upgrades` activado para los de seguridad.
- [ ] **Backups**: la base de datos vive en Supabase, no en el VPS —
  confirma en el dashboard de Supabase (Database → Backups) que los
  backups automáticos están activos. El VPS en sí no guarda datos que no
  estén también en git o Supabase, así que su respaldo importa menos.
- [ ] **Logs**: `pm2 logs` puede crecer sin límite — si no está instalado,
  `pm2 install pm2-logrotate`.
- [ ] **Usuarios con acceso**: `cat /etc/passwd | grep -E "/bin/(bash|sh)$"`
  y revisa `/etc/sudoers.d/` — solo las cuentas que reconoces deberían
  tener shell y/o sudo.
- [ ] **Permisos**: `ls -la /var/www/elmundotebusca/.env` → debe ser
  `600` y del usuario de deploy, no legible por otros.

---

## 5) Después: pruebas automáticas para lo ya corregido

Cada hallazgo de `docs/INFORME-SEGURIDAD.md` que se pueda expresar como
"esta entrada específica produce esta salida específica" es candidato a un
test que falle si alguien reintroduce el problema sin darse cuenta (p. ej.
al refactorizar meses después). No es urgente — es una práctica a adoptar
de a poco, no algo que bloquee nada de lo anterior. Candidatos obvios ya
identificados en este proyecto:
- `compressImage` realmente quita el EXIF (no solo cuando el archivo
  resultante es más chico).
- El correo se guarda siempre en minúsculas (`signUp`, `updateRecoveryEmail`).
- `postCommentAction` rechaza un `entityType` fuera de la lista permitida.
- El borrado de una persona/aid_point/post/pet/hero/newsItem también borra
  su foto en Storage (no deja huérfanos).

Cuando quieras, armamos esto con Vitest/Jest (el proyecto no tiene runner
de tests todavía — sería la primera pieza a decidir).

---

## 6) Después de esto: vuelta al producto

Con infraestructura revisada, los pendientes funcionales ya no compiten con
seguridad: kit de prensa, importación de personas del export autorizado, y
lo que quede de `docs/PROXIMO-CHAT.md`.
