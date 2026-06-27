import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase ligado a las cookies de la petición. Es el que mantiene
// la SESIÓN del usuario (login). Se usa en Server Components y Server Actions.
// La sesión vive en cookies httpOnly (no en localStorage) → más difícil de robar.
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component (no se pueden escribir cookies):
          // se ignora; el middleware refresca la sesión en cada navegación.
        }
      },
    },
  });
}
