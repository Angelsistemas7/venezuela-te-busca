/** Detecta si un enlace es un tuit/post de X (Twitter) para poder incrustarlo
 *  con el embed oficial en vez de mostrarlo como enlace externo plano. */
export function isTweetUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "twitter.com" && host !== "x.com") return false;
    return /\/status\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}
