import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Modo mantenimiento (temporal, manual) ───────────────────────────────────
// Con MAINTENANCE_MODE=true, todo el sitio muestra /mantenimiento excepto
// /admin (para poder entrar) y quien YA tiene la cookie de admin (el mismo
// ADMIN_TOKEN que usa el panel de moderación, ver src/lib/admin.ts). No
// replica el segundo camino de isAdmin() (rol "admin" por cuenta vía
// Supabase) a propósito: haría falta una consulta a la base en cada
// navegación, y ADMIN_TOKEN ya es la llave maestra que siempre funciona.
function maintenanceRedirect(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "true") return null;
  const { pathname } = request.nextUrl;
  if (pathname === "/mantenimiento" || pathname.startsWith("/admin")) return null;

  const adminToken = process.env.ADMIN_TOKEN;
  const cookie = request.cookies.get("vtb_admin")?.value;
  if (adminToken && cookie === adminToken) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/mantenimiento";
  return NextResponse.rewrite(url);
}

// Refresca la sesión de Supabase en cada navegación (renueva el token y
// reescribe la cookie). Si Supabase no está configurado, no hace nada.
export async function middleware(request: NextRequest) {
  const maintenance = maintenanceRedirect(request);
  if (maintenance) return maintenance;

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Importante: no metas lógica entre crear el cliente y getUser().
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Excluye estáticos y archivos de imagen para no correr en cada recurso.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
