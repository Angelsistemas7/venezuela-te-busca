import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase. Si las variables de entorno no están configuradas,
// `isSupabaseConfigured` es false y la app usa datos de ejemplo en memoria.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Cliente público (respeta Row Level Security). Seguro para lectura. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Cliente con permisos de servicio. SOLO usar en el servidor (acciones,
 * verificación de reportes). Nunca importar en componentes de cliente.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
