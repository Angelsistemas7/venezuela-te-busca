import "server-only";

// Noticias y reportes de ayuda humanitaria desde dos APIs públicas y GRATUITAS,
// sin clave:
//   • ReliefWeb (ONU/OCHA): reportes oficiales de respuesta humanitaria.
//   • GDELT 2.0 Doc API: titulares de prensa de todo el mundo.
// Todo se FILTRA para quedarnos solo con lo relacionado a Venezuela y el sismo.
// Si una API falla, se devuelve [] y la UI muestra un aviso suave (igual que USGS).
// Nunca inventamos contenido: cada artículo conserva su fuente y su enlace.

export interface NewsArticle {
  id: string;
  title: string;
  /** Medio o fuente (p. ej. "Reuters", "OCHA"). */
  source: string;
  url: string;
  /** Fecha de publicación en ISO; null si la API no la entrega. */
  publishedAt: string | null;
  image: string | null;
}

// Términos que marcan que una noticia es de Venezuela / del sismo. Sirve de
// colador final aunque la consulta ya venga orientada al tema.
const VE_TERMS =
  /venezuela|venezolan|la guaira|caraballeda|catia la mar|maiquet|yumare|yaracuy|vargas|caracas|naiguat[áa]|macuto/i;

function isVenezuela(...text: (string | null | undefined)[]): boolean {
  return VE_TERMS.test(text.filter(Boolean).join(" "));
}


/** Decodifica entidades y CDATA básicos de un RSS. */
function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Prensa mundial sobre el sismo de Venezuela vía Google Noticias (RSS público,
 * gratis, sin clave). Devuelve titulares reales con su medio y ENLACE que abre
 * la nota completa. Mucho más fiable que GDELT y se actualiza solo.
 */
export async function getWorldPress(limit = 14): Promise<NewsArticle[]> {
  try {
    const q = encodeURIComponent("Venezuela (terremoto OR sismo OR réplica OR rescate)");
    const url = `https://news.google.com/rss/search?q=${q}&hl=es-419&gl=VE&ceid=VE:es`;
    const res = await fetch(url, {
      next: { revalidate: 1800 }, // refresca cada 30 min
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; ElMundoTeBusca/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    // Regex literales por etiqueta (un RegExp dinámico con escapes fallaba).
    const RE = {
      title: /<title[^>]*>([\s\S]*?)<\/title>/,
      link: /<link[^>]*>([\s\S]*?)<\/link>/,
      source: /<source[^>]*>([\s\S]*?)<\/source>/,
      pubDate: /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/,
    } as const;
    const seen = new Set<string>();
    const out: NewsArticle[] = [];
    for (const chunk of xml.split("<item>").slice(1)) {
      const block = chunk.split("</item>")[0];
      const pick = (tag: keyof typeof RE) => {
        const m = RE[tag].exec(block);
        return m ? decodeXml(m[1]) : "";
      };
      const link = pick("link");
      let title = pick("title");
      const source = pick("source") || "Prensa";
      const pub = pick("pubDate");
      if (!link || !title || seen.has(link)) continue;
      // Google News trae el titular como "Titular - Fuente"; quita ese sufijo.
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      // Solo prensa: descartamos fuentes de redes sociales.
      if (/facebook|twitter|x\.com|instagram|tiktok|youtube|reddit/i.test(source)) continue;
      if (!isVenezuela(title, source)) continue;
      seen.add(link);
      out.push({
        id: link,
        title,
        source,
        url: link,
        publishedAt: pub ? new Date(pub).toISOString() : null,
        image: null,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** "20260714T234500Z" (formato de GDELT) → ISO 8601 normal. */
function parseGdeltDate(s: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(s);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}Z`;
}

// Caché COMPARTIDA entre las dos fuentes con foto (GDELT y GNews) — lo que
// responda primero se guarda igual, sin duplicar la lógica de caché por
// fuente. Ambas son gratis y sin garantía real de disponibilidad (a GDELT ya
// le pasó estar horas fallando seguido); con tráfico real es fácil toparse
// con un mal momento de cualquiera de las dos.
//
// Además de vivir en memoria, se espeja a un archivo en disco: la caché en
// memoria se BORRA cada vez que el proceso se reinicia (cada deploy), y si
// justo en ese momento la fuente en turno está fallando, el sitio se queda
// sin fotos hasta que se recupere — le pasó varias veces seguidas en
// producción. Con el archivo, un reinicio recupera la última lista buena al
// instante en vez de arrancar de cero.
type VerifiedNewsCache = { articles: NewsArticle[]; fetchedAt: number };
let verifiedNewsCache: VerifiedNewsCache | null = null;
let diskCacheLoaded = false;
// 30 min pegaba peticiones cada rato — estas APIs son gratis y sin garantía
// de disponibilidad, y a más peticiones más riesgo de toparse con un mal
// momento suyo (confirmado con GDELT: tuvo horas fallando seguido). Con
// noticias de un terremoto de hace semanas, una lista de varias horas de
// antigüedad sigue siendo información real y vigente — no hace falta
// refrescar tan seguido.
const NEWS_TTL_MS = 6 * 60 * 60 * 1000;
// Ruta fija (no `os.tmpdir()`/`path.join()`): esos módulos de Node, igual que
// `fs`, no existen en el runtime Edge — Next compilaba instrumentation.ts
// (que llamaba a este archivo) también para Edge, y un import ESTÁTICO de
// cualquiera de los tres rompía ese build aunque nunca se ejecutara ahí. Por
// eso, además, `fs` se importa DINÁMICO dentro de cada función en vez de
// arriba del archivo: así Next lo deja fuera del paquete de Edge en vez de
// intentar resolverlo igual.
const DISK_CACHE_FILE = "/tmp/elmundotebusca-news-cache.json";

async function loadDiskCacheOnce() {
  if (diskCacheLoaded) return;
  diskCacheLoaded = true;
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(DISK_CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as VerifiedNewsCache;
    if (Array.isArray(parsed.articles) && parsed.articles.length > 0 && !verifiedNewsCache) {
      verifiedNewsCache = parsed;
      console.log("[news] caché recuperada de disco, edad ms:", Date.now() - parsed.fetchedAt);
    }
  } catch {
    // No hay archivo todavía (primer arranque) o está corrupto: se ignora,
    // se sigue igual que si no hubiera caché.
  }
}

async function saveDiskCache() {
  if (!verifiedNewsCache) return;
  try {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(DISK_CACHE_FILE, JSON.stringify(verifiedNewsCache));
  } catch (e) {
    console.error("[news] no se pudo guardar la caché en disco:", e);
  }
}

/**
 * Traduce titulares al español con OpenAI (mismo proveedor/modelo que ya usa
 * scripts/fetch-social-posts.mjs para los posts importados). Una sola llamada
 * por lote en vez de una por titular: más barato y rápido. Si falla o no hay
 * OPENAI_API_KEY, devuelve {} y el llamador se queda con el titular original
 * — nunca bloquea el carrusel por esto.
 */
async function translateTitles(items: { id: string; title: string }[]): Promise<Record<string, string>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || items.length === 0) return {};
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      // Con ~40 titulares en un solo lote (ver fetchLimit en getGdeltNews) tarda
      // más de 10s; medido en logs reales, se estaba cortando siempre antes de
      // responder y por eso nunca se aplicaba ninguna traducción.
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Traduces titulares de prensa al español neutro, manteniendo el sentido y el tono periodístico, sin agregar ni quitar información. Recibes un array JSON de {id, title}. Respondes SOLO con {"traducciones": {"<id>": "<titular traducido>", ...}}, una entrada por cada id recibido.',
          },
          { role: "user", content: JSON.stringify(items) },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[news] traducción OpenAI falló", res.status, await res.text());
      return {};
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { traducciones?: Record<string, string> };
    const result = parsed.traducciones && typeof parsed.traducciones === "object" ? parsed.traducciones : {};
    console.log("[news] traducción OpenAI ok:", Object.keys(result).length, "titulares traducidos");
    return result;
  } catch (e) {
    console.error("[news] traducción OpenAI excepción:", e);
    return {};
  }
}

/**
 * Prensa mundial vía GDELT 2.0 Doc API (RSS público, gratis, sin clave). A
 * diferencia de Google Noticias, GDELT trae la URL directa del artículo (no
 * un enlace intermediario) y una foto real (`socialimage`, la misma que usa
 * el propio medio para compartir en redes). Sin caché propia — la maneja
 * `getVerifiedNews`, que también prueba GNews si esto no alcanza.
 */
async function fetchFromGdelt(fetchLimit: number): Promise<NewsArticle[]> {
  try {
    const q = encodeURIComponent("Venezuela (terremoto OR sismo OR réplica OR rescate)");
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=${fetchLimit}&format=json&sort=datedesc`;
    const res = await fetch(url, {
      cache: "no-store", // el cacheo lo maneja getVerifiedNews; así una respuesta fallida (429) no queda pegada
      // GDELT puede tardar bastante más que otras APIs (medido: ~10s en pruebas
      // reales); 6s la cortaba siempre antes de responder.
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; ElMundoTeBusca/1.0)" },
    });
    if (!res.ok) {
      console.error("[news] GDELT respondió mal:", res.status, await res.text().catch(() => ""));
      return [];
    }
    const json = (await res.json()) as {
      articles?: {
        url: string;
        title: string;
        seendate?: string;
        domain?: string;
        socialimage?: string;
        language?: string;
      }[];
    };
    const seen = new Set<string>();
    const spanish: NewsArticle[] = [];
    const other: NewsArticle[] = [];
    for (const a of json.articles ?? []) {
      if (!a.url || !a.title || seen.has(a.url)) continue;
      if (/facebook|twitter|x\.com|instagram|tiktok|youtube|reddit/i.test(a.domain ?? "")) continue;
      seen.add(a.url);
      const article: NewsArticle = {
        id: a.url,
        title: a.title.trim(),
        source: (a.domain ?? "Prensa").replace(/^www\./, ""),
        url: a.url,
        publishedAt: a.seendate ? parseGdeltDate(a.seendate) : null,
        // Solo se usa si es una URL http(s) real — nunca se confía a ciegas
        // en un campo de un tercero para algo que termina en un <img src>.
        image: a.socialimage && /^https?:\/\//.test(a.socialimage) ? a.socialimage : null,
      };
      // Prioriza fuentes en español (audiencia del sitio); el resto solo se
      // usa para completar si no alcanzan las noticias en español.
      (a.language === "Spanish" ? spanish : other).push(article);
    }

    // En la práctica, GDELT casi no indexa prensa en español reciente para
    // este tema (verificado): casi siempre "other" es toda la lista. En vez
    // de perder esa cobertura real, se traducen sus titulares en un solo
    // lote — el enlace de "Ver fuente" sigue yendo al artículo original.
    console.log("[news] GDELT trajo", spanish.length, "en español y", other.length, "en otro idioma");
    if (other.length > 0) {
      const translations = await translateTitles(other.map((a) => ({ id: a.id, title: a.title })));
      let applied = 0;
      for (const a of other) {
        const t = translations[a.id];
        if (t) {
          a.title = t;
          applied++;
        }
      }
      console.log("[news] traducciones aplicadas:", applied, "de", other.length);
    }

    return [...spanish, ...other];
  } catch (e) {
    console.error("[news] fetchFromGdelt excepción:", e);
    return [];
  }
}

/**
 * Prensa vía GNews.io (necesita GNEWS_API_KEY — capa gratis: 100
 * peticiones/día, hasta 10 artículos por petición). Respaldo de GDELT: más
 * confiable (no es un proyecto de investigación gratis sin garantía) y ya
 * entrega en español (`lang=es`), sin necesitar traducción aparte. Si no hay
 * clave configurada, devuelve [] — el resto de la cadena de respaldo sigue
 * funcionando igual sin ella.
 */
async function fetchFromGNews(fetchLimit: number): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const q = encodeURIComponent("Venezuela terremoto");
    const max = Math.min(Math.max(fetchLimit, 1), 25);
    const url = `https://gnews.io/api/v4/search?q=${q}&lang=es&max=${max}&sortby=publishedAt&apikey=${apiKey}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("[news] GNews respondió mal:", res.status, await res.text().catch(() => ""));
      return [];
    }
    const json = (await res.json()) as {
      articles?: {
        title: string;
        url: string;
        image?: string | null;
        publishedAt?: string;
        source?: { name?: string };
      }[];
    };
    const seen = new Set<string>();
    const out: NewsArticle[] = [];
    for (const a of json.articles ?? []) {
      if (!a.url || !a.title || seen.has(a.url)) continue;
      seen.add(a.url);
      out.push({
        id: a.url,
        title: a.title.trim(),
        source: a.source?.name ?? "Prensa",
        url: a.url,
        publishedAt: a.publishedAt ?? null,
        image: a.image && /^https?:\/\//.test(a.image) ? a.image : null,
      });
    }
    console.log("[news] GNews trajo", out.length, "artículos");
    return out;
  } catch (e) {
    console.error("[news] fetchFromGNews excepción:", e);
    return [];
  }
}

/**
 * Noticias verificadas CON foto real, para el carrusel del home. Prueba GDELT
 * primero (gratis, sin clave, buena cobertura, pero sin garantía de
 * disponibilidad); si falla o no trae nada, prueba GNews (necesita
 * GNEWS_API_KEY, más confiable, ya en español). Si ambas fallan, sirve la
 * última lista buena guardada (memoria o disco) — solo si NUNCA hubo una
 * lista buena devuelve [] (y el carrusel cae a Google Noticias sin foto).
 */
export async function getVerifiedNews(limit = 10): Promise<NewsArticle[]> {
  await loadDiskCacheOnce();
  const now = Date.now();
  if (verifiedNewsCache && now - verifiedNewsCache.fetchedAt < NEWS_TTL_MS) {
    console.log("[news] getVerifiedNews: caché válida (edad ms):", now - verifiedNewsCache.fetchedAt);
    return verifiedNewsCache.articles.slice(0, limit);
  }

  // Se pide bastante más de lo que hace falta (ambas fuentes rastrean prensa
  // mundial en cualquier idioma) porque GDELT después prioriza español y
  // descarta el resto si hay suficiente.
  const fetchLimit = Math.max(limit * 2, 20);

  let fresh = await fetchFromGdelt(fetchLimit);
  let sourceUsed = "GDELT";
  if (fresh.length === 0) {
    fresh = await fetchFromGNews(fetchLimit);
    sourceUsed = "GNews";
  }

  if (fresh.length === 0) {
    console.error("[news] getVerifiedNews: GDELT y GNews fallaron, usando última caché si hay");
    return verifiedNewsCache?.articles.slice(0, limit) ?? [];
  }

  console.log("[news] getVerifiedNews: usando", sourceUsed, "-", fresh.length, "artículos");
  verifiedNewsCache = { articles: fresh, fetchedAt: now };
  await saveDiskCache();
  return fresh.slice(0, limit);
}

/**
 * Reportes de ayuda humanitaria sobre Venezuela (ReliefWeb / ONU-OCHA):
 * ayuda internacional que llegó, va en camino o fue anunciada.
 */
export async function getHumanitarianUpdates(limit = 10): Promise<NewsArticle[]> {
  try {
    // ReliefWeb v1: GET con appname obligatorio. Filtramos por país Venezuela
    // (id 257 en su taxonomía) y orientamos la búsqueda al sismo/ayuda.
    const params = new URLSearchParams({
      appname: "elmundotebusca.com",
      "query[value]": "earthquake OR sismo OR terremoto OR humanitarian aid",
      "query[operator]": "OR",
      "filter[field]": "primary_country.iso3",
      "filter[value]": "ven",
      limit: String(limit),
      "fields[include][]": "title",
      sort: "date.created:desc",
    });
    // Varias claves repetidas: añadimos los demás include manualmente.
    params.append("fields[include][]", "url");
    params.append("fields[include][]", "url_alias");
    params.append("fields[include][]", "date.created");
    params.append("fields[include][]", "source.shortname");
    params.append("fields[include][]", "source.name");

    const res = await fetch(`https://api.reliefweb.int/v1/reports?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: {
        id: string;
        fields?: {
          title?: string;
          url?: string;
          url_alias?: string;
          date?: { created?: string };
          source?: { name?: string; shortname?: string }[];
        };
      }[];
    };
    return (json.data ?? [])
      .map((d) => {
        const f = d.fields ?? {};
        const src = f.source?.[0];
        return {
          id: `rw-${d.id}`,
          title: f.title ?? "",
          source: src?.shortname || src?.name || "ReliefWeb (OCHA)",
          url: f.url_alias || f.url || `https://reliefweb.int/node/${d.id}`,
          publishedAt: f.date?.created ?? null,
          image: null,
        } satisfies NewsArticle;
      })
      .filter((a) => a.title);
  } catch {
    return [];
  }
}
