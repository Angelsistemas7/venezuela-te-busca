# 💰 Costos, escala e infraestructura

Respuesta directa a: *"¿qué peso aguanta y qué tengo que pagar para que mucha
gente la use a la vez?"*

## La idea clave (corrige un mito común)

**Muchos usuarios a la vez NO requieren un "VPS pesado"** si la app está bien
hecha. Esta plataforma es sobre todo de **lectura** (gente buscando), y eso se
sirve desde una **CDN/serverless** que reparte la carga por todo el mundo. El
cuello de botella real no es "la gente conectada", son **dos cosas**:

1. La **base de datos** (consultas) → resuelta con índices (ya están).
2. Las **fotos** (almacenamiento + ancho de banda) → el gasto principal al crecer.

"10.000 personas registradas" son **10.000 filas**: para PostgreSQL es trivial
(aguanta millones). Lo que cuesta dinero es servir miles de **fotos** a miles de
visitantes.

---

## Opción recomendada: Gestionado (sin servidor que mantener)

| Pieza | Servicio | Gratis | Cuándo pagas | Costo al crecer |
|-------|----------|--------|--------------|-----------------|
| Web/CDN | **Vercel** | Sí (Hobby) | Uso comercial / +100GB tráfico | $20/mes (Pro, 1TB) |
| Base de datos + fotos | **Supabase** | Sí (500MB DB, 1GB fotos, 5GB tráfico) | Al superar fotos/tráfico | $25/mes (Pro: 8GB DB, 100GB fotos, 250GB tráfico) |
| Anti-bot | **Cloudflare Turnstile** | Sí | — | $0 |
| Dominio | (Namecheap, Cloudflare…) | No | Siempre | ~$10–15/año |

- **Para arrancar:** Vercel free + Supabase free + dominio ≈ **$1/mes** (solo el dominio prorrateado).
- **Con tracción real** (miles de visitas + miles de fotos): ≈ **$25–45/mes**.
- **No necesitas VPS.** Vercel escala solo ante picos (p. ej. si la página se
  vuelve viral), cosa que un solo VPS hace peor.

### El gasto que de verdad importa: las fotos
25.000 fotos × ~200 KB ≈ **5 GB** de almacenamiento, y servirlas a mucha gente
gasta ancho de banda. Cómo mantenerlo barato:
- **Comprimir y redimensionar** cada foto al subir (a WebP, máx. ~1000px). Una
  foto de retrato baja de ~2 MB a ~100–200 KB.
- Servir por **CDN** (Vercel/Cloudflare ya lo hacen).
- Si crece mucho, mover las fotos a **Cloudflare R2** (egress gratis) o
  **Cloudflare Images**. Es el mayor ahorro a escala.

---

## Opción alternativa: VPS (más control, más trabajo)

| Pieza | Ejemplo | Costo |
|-------|---------|-------|
| VPS | Hetzner CX22 / DigitalOcean básico | ~$5–7/mes |
| Dominio | — | ~$10–15/año |
| Base de datos | PostgreSQL en el mismo VPS (tú lo mantienes) o Supabase | $0 / $25 |
| Fotos | Disco del VPS o Cloudflare R2 | bajo |

Un VPS pequeño (2 vCPU / 4 GB RAM) con Next.js en modo `standalone` + Nginx +
caché **aguanta miles de visitantes concurrentes** de lectura sin problema. Pero
**tú** te encargas de: actualizaciones de seguridad, backups, reinicios,
certificados SSL y escalar si revienta en un pico. Más barato en papel, más
riesgo operativo.

**Cuándo tiene sentido el VPS:** si quieres evitar el precio "comercial" de
Vercel, o control total. Para una causa donde el tiempo es crítico y no quieres
que se caiga en un pico, **lo gestionado es más seguro**.

---

## ¿Qué aguanta cada escala? (estimación realista)

| Escala | Registros | Visitas/mes | Plan suficiente | Costo aprox. |
|--------|-----------|-------------|-----------------|--------------|
| Inicio | < 2.000 | < 50.000 | Vercel free + Supabase free | **$0** + dominio |
| Medio | 10.000 | ~300.000 | Vercel free/Pro + Supabase Pro | **~$25–45/mes** |
| Grande/viral | 50.000+ | millones | Vercel Pro + Supabase Pro + Cloudflare R2 para fotos | **~$45–80/mes** |

> Con los índices y la búsqueda full-text que ya tiene, la base de datos no es el
> problema ni con 100.000 registros. Planifica por **fotos y tráfico**, no por
> "cantidad de gente conectada".

---

## Mi recomendación concreta para ti

1. Compra el **dominio** (lo que ya querías).
2. Crea **Supabase** (gratis) y **Vercel** (gratis), conecta el dominio.
3. Activa **Turnstile** (gratis).
4. Añadimos **compresión de fotos al subir** (lo implemento yo) para que el
   almacenamiento/tráfico no se dispare.
5. Empiezas en **~$0–1/mes**. Solo subes a ~$25 cuando de verdad haya volumen,
   y para entonces la plataforma ya estará ayudando a mucha gente.

Sin VPS. Sin servidor que cuidar. Escala sola.
