# Desplegar en VPS con GitHub Actions (PM2 + nginx)

Build en GitHub Actions → subida por SSH (rsync) → PM2 corre el servidor
`standalone` de Next.js detrás de nginx. El workflow está en
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) y se dispara en
cada push a `main` (o manual desde la pestaña **Actions**).

> Requisito en el VPS: **Node 20.6 o superior** (el arranque usa `--env-file`).
> Compruébalo con `node --version`.

---

## 1) Secrets del repositorio (GitHub → Settings → Secrets and variables → Actions)

Conexión al VPS:
- `VPS_HOST` — IP o host del VPS.
- `VPS_USER` — usuario SSH (p. ej. `deploy` o `ubuntu`).
- `VPS_PORT` — puerto SSH (si es 22 puedes omitirlo).
- `VPS_SSH_KEY` — **clave privada** SSH en **base64** (una sola línea) con acceso a ese usuario.

> La carpeta destino NO es un secret: va fija en el workflow como
> `DEPLOY_PATH: /var/www/elmundotebusca` (cámbiala ahí si usas otra ruta).
> La llave va en base64 para que no se rompan los saltos de línea al copiarla:
> genérala con `base64 -w0 ~/.ssh/deploy_elmundotebusca`.

Variables que se hornean en el build (cliente):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

(`NEXT_PUBLIC_SITE_URL` ya va fijo a `https://elmundotebusca.com` en el workflow.)

> Los **secretos de servidor** (service role, Turnstile secret, admin) NO van en
> GitHub: viven en el `.env` del VPS (paso 2).

### Generar la llave SSH de despliegue (en tu PC)
```bash
ssh-keygen -t ed25519 -C "deploy-elmundotebusca" -f deploy_key
# Pega deploy_key.pub en el VPS:
ssh-copy-id -i deploy_key.pub VPS_USER@VPS_HOST
# Copia el CONTENIDO de deploy_key (la privada) en el secret VPS_SSH_KEY.
```

---

## 2) Preparar el VPS (una sola vez)

```bash
# Carpeta destino (igual a VPS_PATH) y permisos del usuario de deploy
sudo mkdir -p /var/www/elmundotebusca
sudo chown -R $USER:$USER /var/www/elmundotebusca

# Secretos de runtime: crea el .env (NO se sube nunca; rsync lo conserva)
cat > /var/www/elmundotebusca/.env <<'EOF'
SUPABASE_SERVICE_ROLE_KEY=pega-aqui
TURNSTILE_SECRET_KEY=pega-aqui
ADMIN_TOKEN=pega-aqui
# Útiles también en runtime (no son secretas):
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pega-aqui
NEXT_PUBLIC_SITE_URL=https://elmundotebusca.com
EOF
chmod 600 /var/www/elmundotebusca/.env

# PM2 global y arranque automático tras reinicios
sudo npm install -g pm2
pm2 startup    # ejecuta el comando que imprime (configura el servicio)
```

El primer despliegue (push a `main`) creará el proceso `elmundotebusca` con PM2.
A partir de ahí cada push hace `pm2 reload` (recarga sin downtime).

Comandos útiles: `pm2 status`, `pm2 logs elmundotebusca`, `pm2 reload elmundotebusca`.

---

## 3) nginx (reverse proxy) + SSL

Crea `/etc/nginx/sites-available/elmundotebusca` :
```nginx
server {
    listen 80;
    server_name elmundotebusca.com www.elmundotebusca.com;

    client_max_body_size 12M;   # subida de fotos

    location / {
        proxy_pass http://127.0.0.1:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/elmundotebusca /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL gratis con Let's Encrypt (añade el bloque 443 y la renovación automática)
sudo certbot --nginx -d elmundotebusca.com -d www.elmundotebusca.com
```

---

## 4) Mover el dominio a tu VPS (DNS en Namecheap)

En la zona DNS de `elmundotebusca.com`, **reemplaza** los registros que apuntan a
Vercel por:
- `A`  `@`   → **IP de tu VPS**
- `A`  `www` → **IP de tu VPS**  (o un `CNAME www` → `elmundotebusca.com`)

Espera la propagación (minutos a unas horas). Cuando resuelva al VPS, corre el
`certbot` del paso 3 (necesita que el dominio ya apunte al VPS para validar).

> Mientras tanto puedes probar el VPS por su IP. Una vez que el dominio esté en el
> VPS con SSL OK, puedes desconectar el proyecto en Vercel (o dejarlo de respaldo).

---

## 5) Base de datos

Sigue siendo **Supabase** (no cambia). Si aún no lo hiciste, ejecuta una vez
`supabase/schema.sql` en el SQL Editor de Supabase para tener todas las tablas
(incluida `saved_items`). El VPS solo corre la app; los datos viven en Supabase.

---

## Resumen del flujo
1. `git push origin main` →
2. GitHub Actions: `npm ci` + `npm run build` (con las NEXT_PUBLIC_*) →
3. empaqueta `.next/standalone` (+ estáticos, `public`, `ecosystem.config.cjs`) →
4. `rsync` al VPS (conserva el `.env`) →
5. `pm2 startOrReload` → nginx sirve `https://elmundotebusca.com`.
