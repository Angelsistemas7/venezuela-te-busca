#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Ingesta automática de publicaciones de otras redes sociales por hashtag
// ("El Mundo Te Busca").
//
// Busca el hashtag (p. ej. #TerremotoVE) en las APIs PÚBLICAS Y OFICIALES de
// Bluesky y Mastodon —nada de scraping ni de X/Twitter, cuya única vía
// automatizada por hashtag requiere pagar su API (tier "Basic", ~$200/mes)—
// y guarda cada resultado nuevo en la tabla `posts` con
// moderation_status = "pending". NO se publica nada directo: un moderador
// aprueba o rechaza cada uno en /admin antes de que aparezca en /comunidad
// (ver `getPendingExternalPosts`/`getPosts` en src/lib/data.ts).
//
// Uso:
//   node scripts/fetch-social-posts.mjs             # busca e inserta
//   node scripts/fetch-social-posts.mjs --dry-run    # solo imprime, no escribe
//
// Pensado para correr por cron en el VPS (ver docs/DESPLIEGUE-VPS.md), p. ej.
// cada 15 min: */15 * * * * cd /ruta/app && npm run fetch:social >> logs/social-fetch.log 2>&1
//
// Variables de entorno (todas opcionales, con valores por defecto razonables):
//   SOCIAL_HASHTAGS       Hashtags a buscar, separados por coma.
//                         Default: "TerremotoVE,TerremotoVenezuela"
//   MASTODON_INSTANCES    Instancias Mastodon a consultar, separadas por coma.
//                         Default: "mastodon.social"
//   BLUESKY_IDENTIFIER    Usuario y "app password" de Bluesky. Sin esto la
//   BLUESKY_APP_PASSWORD  búsqueda por hashtag en Bluesky no trae resultados
//                         (su endpoint público de búsqueda exige sesión,
//                         a diferencia del resto de su API); Mastodon no
//                         necesita nada de esto. Se genera gratis en
//                         bsky.app → Ajustes → App passwords.
// ─────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Carga manual de .env.local (igual que scripts/import-data.mjs) ─────────
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* sin .env.local: se usan variables de entorno del sistema */
  }
}
loadEnv();

const HASHTAGS = (process.env.SOCIAL_HASHTAGS || "TerremotoVE,TerremotoVenezuela,laguaira")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const MASTODON_INSTANCES = (process.env.MASTODON_INSTANCES || "mastodon.social")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const BODY_MAX = 1500; // mismo límite que postSchema (src/lib/validation.ts)

function truncate(text, max = BODY_MAX) {
  const s = text.trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Mastodon devuelve `content` en HTML (<p>, <br>, menciones...). Lo pasamos a
// texto plano porque PostCard no interpreta HTML (evita tener que sanitizar
// HTML de terceros para poder mostrarlo en el cliente).
function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Bluesky (AT Protocol) ────────────────────────────────────────────────
// `public.api.bsky.app` sirve sin cuenta la mayoría de endpoints de lectura,
// pero `searchPosts` en concreto exige sesión autenticada (confirmado: sin
// login devuelve 403). Por eso, a diferencia de Mastodon, Bluesky SOLO
// funciona si defines BLUESKY_IDENTIFIER/BLUESKY_APP_PASSWORD (gratis: se
// genera en bsky.app -> Ajustes -> App passwords, no hace falta pagar nada).
// Sin esas variables, esta fuente simplemente no aporta resultados y el
// script sigue con Mastodon con normalidad.
async function bskySession() {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) return null;
  const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    console.error(`⚠️  No se pudo iniciar sesión en Bluesky: ${res.status}`);
    return null;
  }
  const data = await res.json();
  return { token: data.accessJwt, base: "https://bsky.social" };
}

async function fetchBluesky(hashtag, session) {
  const base = session?.base ?? "https://public.api.bsky.app";
  const url = `${base}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent("#" + hashtag)}&limit=25`;
  const res = await fetch(url, { headers: session ? { authorization: `Bearer ${session.token}` } : {} });
  if (!res.ok) {
    console.error(`⚠️  Bluesky (#${hashtag}): ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return (data.posts ?? []).map((p) => {
    const handle = p.author?.handle ?? "desconocido";
    const display = p.author?.displayName || handle;
    // uri: at://did:plc:xxx/app.bsky.feed.post/<rkey>
    const rkey = p.uri?.split("/").pop();
    return {
      external_id: `bluesky:${p.uri}`,
      origin: "bluesky",
      author_name: `${display} (@${handle})`,
      body: truncate(p.record?.text ?? ""),
      link_url: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : null,
      created_at: p.record?.createdAt ?? new Date().toISOString(),
    };
  });
}

// ── Mastodon ──────────────────────────────────────────────────────────────
// Los timelines por hashtag son por-instancia (no existe un índice global de
// todo el fediverso): se recorre una lista corta y configurable de
// instancias. Endpoint público, sin token en la gran mayoría de instancias.
async function fetchMastodon(instance, hashtag) {
  const url = `https://${instance}/api/v1/timelines/tag/${encodeURIComponent(hashtag)}?limit=25`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`⚠️  Mastodon ${instance} (#${hashtag}): ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((status) => {
    const acct = status.account?.acct ?? "desconocido";
    const display = status.account?.display_name || acct;
    return {
      external_id: `mastodon:${instance}:${status.id}`,
      origin: "mastodon",
      author_name: `${display} (@${acct})`,
      body: truncate(stripHtml(status.content ?? "")),
      link_url: status.url ?? status.uri ?? null,
      created_at: status.created_at ?? new Date().toISOString(),
    };
  });
}

// ── Ejecución ────────────────────────────────────────────────────────────
async function main() {
  const found = [];

  const session = await bskySession();
  for (const hashtag of HASHTAGS) {
    found.push(...(await fetchBluesky(hashtag, session)));
  }
  for (const instance of MASTODON_INSTANCES) {
    for (const hashtag of HASHTAGS) {
      found.push(...(await fetchMastodon(instance, hashtag)));
    }
  }

  // Descarta cuerpos vacíos (posts que son solo una imagen, por ejemplo: sin
  // texto no hay nada útil que mostrar en el muro).
  const rows = found.filter((r) => r.body && r.body.trim().length > 0);
  console.log(
    `🔎 ${rows.length} publicaciones encontradas para: ${HASHTAGS.map((h) => "#" + h).join(", ")}`,
  );

  if (DRY_RUN) {
    for (const r of rows) {
      console.log(`\n[${r.origin}] ${r.author_name}\n${r.body}\n${r.link_url ?? ""}`);
    }
    console.log("\n(--dry-run: no se escribió nada en la base de datos.)");
    return;
  }

  if (rows.length === 0) return;

  const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_SB || !SERVICE_KEY) {
    console.error(
      "❌ Falta configuración. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
    process.exit(1);
  }
  const sb = createClient(URL_SB, SERVICE_KEY, { auth: { persistSession: false } });

  const payload = rows.map((r) => ({
    type: "info",
    body: r.body,
    estado: null,
    location_text: "",
    photo_url: null,
    link_url: r.link_url,
    author_name: r.author_name,
    contact_phone: null,
    reactions: { apoyo: 0, corazon: 0, hecho: 0 },
    origin: r.origin,
    moderation_status: "pending",
    external_id: r.external_id,
    created_at: r.created_at,
  }));

  const { data, error } = await sb
    .from("posts")
    .upsert(payload, { onConflict: "external_id", ignoreDuplicates: true })
    .select("id");

  if (error) {
    console.error("❌ Error insertando en Supabase:", error.message);
    process.exit(1);
  }
  console.log(`✅ ${data?.length ?? 0} publicaciones nuevas agregadas a la cola de moderación (/admin).`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
