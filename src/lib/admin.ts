import { cookies, headers } from "next/headers";

// Control de acceso del panel de moderación. Simple y suficiente: un token
// secreto en ADMIN_TOKEN. Si no está configurado, el panel queda ABIERTO en
// modo demostración (con aviso), para poder probarlo sin configurar nada.

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const COOKIE = "vtb_admin";

export const adminConfigured = Boolean(ADMIN_TOKEN);

// Freno de fuerza bruta contra el login de /admin: 5 intentos fallidos por IP
// bloquean esa IP 15 minutos. En memoria (un solo proceso en el VPS con PM2);
// se reinicia si el proceso reinicia, lo cual es aceptable para este alcance.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : null) || h.get("x-real-ip") || "unknown";
}

function isLocked(ip: string): boolean {
  const entry = attempts.get(ip);
  return Boolean(entry && entry.lockedUntil > Date.now());
}

function registerFailure(ip: string): void {
  const entry = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(ip, entry);
}

function registerSuccess(ip: string): void {
  attempts.delete(ip);
}

export async function isAdmin(): Promise<boolean> {
  // Sin ADMIN_TOKEN: abierto en desarrollo (demo), CERRADO en producción para no
  // dejar la moderación expuesta si se olvida configurar el secreto.
  if (!ADMIN_TOKEN) return process.env.NODE_ENV !== "production";
  const store = await cookies();
  return store.get(COOKIE)?.value === ADMIN_TOKEN;
}

export async function signInAdmin(password: string): Promise<boolean> {
  if (!ADMIN_TOKEN) return process.env.NODE_ENV !== "production";
  const ip = await clientIp();
  if (isLocked(ip)) return false;
  if (password !== ADMIN_TOKEN) {
    registerFailure(ip);
    return false;
  }
  registerSuccess(ip);
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
