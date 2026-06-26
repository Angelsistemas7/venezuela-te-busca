# Handoff para el equipo — Venezuela te busca

Plataforma ciudadana **sin fines de lucro** para localizar personas desaparecidas y
coordinar ayuda tras el terremoto de Venezuela 2026. Next.js 15 + TypeScript +
Tailwind v4 + Supabase + Turnstile. **Compila en verde** y corre en modo demo sin
configuración.

## ⚠️ Límite ético (no cruzar)
No scrapear ni replicar datos del sitio `venezuelatebusca.com` ni saltar su Cloudflare.
Son datos de personas reales (muchas menores). Se construye desde cero.

## Cómo correr (local)
```bash
npm install
npm run dev        # http://localhost:3000  (modo demo, datos en memoria)
npm run build      # verificación principal: SIEMPRE debe quedar verde
npm run typecheck
```
Sin `.env.local` corre en **modo demostración** con datos de ejemplo. Con Supabase
(ver `.env.example`) usa la base real.

## Por dónde empezar (lean esto antes de tocar nada)
1. `CLAUDE.md` — arquitectura, convenciones y reglas. **Se carga solo** al abrir un
   chat de Claude Code en esta carpeta.
2. `docs/ESTADO-DEL-PROYECTO.md` — qué está hecho y qué falta.
3. `docs/GUIA-DESPLIEGUE.md` y `docs/COSTOS-Y-DESPLIEGUE.md` — para publicar.

## 📋 Prompt listo para pegarle a su Claude (Claude Code)
> Abran Claude Code **dentro de esta carpeta** y peguen esto:

```
Lee CLAUDE.md y docs/ESTADO-DEL-PROYECTO.md antes de nada. Es una plataforma para
localizar desaparecidos tras el terremoto de Venezuela 2026; objetivo: salvar vidas,
bien hecho. NO scrapear venezuelatebusca.com ni saltar su Cloudflare. El producto y la
comunicación son en español. La cola de funciones #1–#4 está completa y el build está
verde. Lo único que falta es desplegar (docs/GUIA-DESPLIEGUE.md). Antes de cambiar
algo, corre `npm run build` para confirmar que sigue en verde. Resume en 5 líneas el
estado actual y dime qué propones hacer.
```
Así su Claude tiene el contexto sin necesidad de una auditoría completa.

## Pasos a seguir (orden sugerido)
1. `npm install` y `npm run build` → confirmar verde.
2. Leer el estado del proyecto y elegir tarea.
3. Para publicar en línea: seguir `docs/GUIA-DESPLIEGUE.md`
   (Supabase + Vercel + Turnstile + dominio; ~$0 para arrancar).
4. No commitear `.env*`. Trabajar en ramas y abrir Pull Request.

Contacto del responsable: angelacero.sistemas@gmail.com
