// Verificación del token de Cloudflare Turnstile en el servidor.
// Si no hay TURNSTILE_SECRET_KEY configurado, se omite la verificación
// (modo desarrollo) pero se deja registrado en consola.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Sin clave configurada: no bloqueamos en desarrollo.
    return true;
  }
  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (ip) body.append("remoteip", ip);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
