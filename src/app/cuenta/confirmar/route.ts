import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

// Destino del enlace de recuperación del correo. Canjea el `code` por una sesión
// (escribiendo la cookie) y manda a la página para fijar la nueva contraseña.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Solo rutas internas (evita open-redirect): debe empezar por "/" y no por "//".
  const nextRaw = searchParams.get("next") ?? "/cuenta/restablecer";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/cuenta/restablecer";

  if (code) {
    const sb = await getSupabaseServer();
    if (sb) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/cuenta/restablecer?error=1`);
}
