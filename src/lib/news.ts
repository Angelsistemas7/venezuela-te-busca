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

/** Convierte la fecha de GDELT ("20260625T143000Z") a ISO. */
function parseGdeltDate(s: string | undefined): string | null {
  if (!s) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

/**
 * Últimas noticias de prensa sobre el sismo de Venezuela (GDELT).
 * Titular + medio + fecha + enlace a la fuente original.
 */
export async function getLatestNews(limit = 12): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({
      query: '(Venezuela earthquake) OR (Venezuela sismo) OR (Venezuela terremoto)',
      mode: "ArtList",
      format: "json",
      maxrecords: String(Math.min(limit * 3, 75)),
      sort: "DateDesc",
      timespan: "1w", // última semana (unidades GDELT: min/H/d/w)
    });
    const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, {
      next: { revalidate: 1800 }, // refresca cada 30 min
      signal: AbortSignal.timeout(8000), // no colgar la página si la API tarda
    });
    // GDELT a veces responde texto plano (límite de tasa) en vez de JSON.
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.includes("json")) return [];
    const json = (await res.json()) as {
      articles?: { url: string; title: string; seendate: string; domain: string; socialimage?: string }[];
    };
    const seen = new Set<string>();
    return (json.articles ?? [])
      .filter((a) => a.url && a.title && isVenezuela(a.title, a.domain))
      .filter((a) => (seen.has(a.url) ? false : (seen.add(a.url), true)))
      .slice(0, limit)
      .map((a) => ({
        id: a.url,
        title: a.title,
        source: a.domain ?? "Prensa",
        url: a.url,
        publishedAt: parseGdeltDate(a.seendate),
        image: a.socialimage || null,
      }));
  } catch {
    return [];
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
      appname: "venezuelatebusca.org",
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
      signal: AbortSignal.timeout(8000),
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
