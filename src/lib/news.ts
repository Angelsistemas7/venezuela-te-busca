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

// GDELT limita a ~1 petición cada 5 segundos por IP; con tráfico real es fácil
// toparse con un 429. Cache propia en memoria (no la de Next) para que, si
// una petición falla, sirvamos la última lista buena en vez de vaciar el
// carrusel — Next SÍ cachearía una respuesta 429 igual que una 200 durante
// `revalidate`, dejando el carrusel sin fotos media hora.
let gdeltCache: { articles: NewsArticle[]; fetchedAt: number } | null = null;
const GDELT_TTL_MS = 30 * 60 * 1000;

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
      signal: AbortSignal.timeout(10000),
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
    if (!res.ok) return {};
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as {
      traducciones?: Record<string, string>;
    };
    return parsed.traducciones && typeof parsed.traducciones === "object" ? parsed.traducciones : {};
  } catch {
    return {};
  }
}

/**
 * Prensa mundial vía GDELT 2.0 Doc API (RSS público, gratis, sin clave). A
 * diferencia de Google Noticias, GDELT trae la URL directa del artículo (no
 * un enlace intermediario) y una foto real (`socialimage`, la misma que usa
 * el propio medio para compartir en redes) — por eso se usa para el carrusel
 * con imagen; Google Noticias (arriba) no trae fotos en su feed.
 */
export async function getGdeltNews(limit = 10): Promise<NewsArticle[]> {
  const now = Date.now();
  if (gdeltCache && now - gdeltCache.fetchedAt < GDELT_TTL_MS) {
    return gdeltCache.articles.slice(0, limit);
  }
  try {
    // Se pide bastante más de lo que hace falta (GDELT rastrea prensa mundial
    // en cualquier idioma) porque después se prioriza español y se descarta
    // el resto si hay suficiente — así no dependemos de que el filtro de
    // idioma en la query de GDELT funcione bien combinado con paréntesis/OR.
    const fetchLimit = Math.max(limit * 3, 30);
    const q = encodeURIComponent("Venezuela (terremoto OR sismo OR réplica OR rescate)");
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&maxrecords=${fetchLimit}&format=json&sort=datedesc`;
    const res = await fetch(url, {
      cache: "no-store", // el cacheo lo maneja gdeltCache; así una respuesta fallida (429) no queda pegada
      // GDELT puede tardar bastante más que otras APIs (medido: ~10s en pruebas
      // reales); 6s la cortaba siempre antes de responder.
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; ElMundoTeBusca/1.0)" },
    });
    if (!res.ok) return gdeltCache?.articles.slice(0, limit) ?? [];
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
    if (other.length > 0) {
      const translations = await translateTitles(other.map((a) => ({ id: a.id, title: a.title })));
      for (const a of other) {
        const t = translations[a.id];
        if (t) a.title = t;
      }
    }

    const out = [...spanish, ...other];
    if (out.length === 0) return gdeltCache?.articles.slice(0, limit) ?? [];
    gdeltCache = { articles: out, fetchedAt: now };
    return out.slice(0, limit);
  } catch {
    return gdeltCache?.articles.slice(0, limit) ?? [];
  }
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
