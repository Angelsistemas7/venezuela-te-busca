import { cookies } from "next/headers";

// Control de acceso del panel de moderación. Simple y suficiente: un token
// secreto en ADMIN_TOKEN. Si no está configurado, el panel queda ABIERTO en
// modo demostración (con aviso), para poder probarlo sin configurar nada.

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const COOKIE = "vtb_admin";

export const adminConfigured = Boolean(ADMIN_TOKEN);

export async function isAdmin(): Promise<boolean> {
  // Sin ADMIN_TOKEN: abierto en desarrollo (demo), CERRADO en producción para no
  // dejar la moderación expuesta si se olvida configurar el secreto.
  if (!ADMIN_TOKEN) return process.env.NODE_ENV !== "production";
  const store = await cookies();
  return store.get(COOKIE)?.value === ADMIN_TOKEN;
}

export async function signInAdmin(password: string): Promise<boolean> {
  if (!ADMIN_TOKEN) return process.env.NODE_ENV !== "production";
  if (password !== ADMIN_TOKEN) return false;
  const store = await cookies();
  store.set(COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 h
  });
  return true;
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
