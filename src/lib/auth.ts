import "server-only";
import { getSupabaseServer } from "./supabaseServer";
import { getSupabaseAdmin } from "./supabase";
import type { SignupInput, LoginInput } from "./validation";

// Cuentas con Supabase Auth. Diseño: usuario único + contraseña fuerte; correo
// OPCIONAL (solo para recuperar la clave). La contraseña la hashea Supabase
// (bcrypt) — nunca la vemos ni la guardamos, y no se puede saber si se repite.
//
// Como Supabase Auth es por correo, cuando el usuario no da uno usamos un correo
// sintético derivado del nombre de usuario (no se entrega a nadie). El correo
// real, si lo dan, queda guardado en `profiles.recovery_email` (tabla privada).

const SYNTH_DOMAIN = "users.venezuelatebusca.org";

export interface SessionUser {
  id: string;
  username: string;
}

function synthEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTH_DOMAIN}`;
}

/** Usuario de la sesión actual (o null). Lee la cookie de sesión. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const sb = await getSupabaseServer();
  if (!sb) return null;
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  const username = (data.user.user_metadata?.username as string | undefined) ?? "Usuario";
  return { id: data.user.id, username };
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin
    .from("profiles")
    .select("user_id")
    .eq("username_lower", username.trim().toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

export type AuthResult = { ok: true; username: string } | { ok: false; error: string };

export async function signUp(input: SignupInput): Promise<AuthResult> {
  const admin = getSupabaseAdmin();
  const sb = await getSupabaseServer();
  if (!admin || !sb) {
    return { ok: false, error: "Las cuentas se activan al conectar la base de datos (Supabase)." };
  }

  const username = input.username.trim();
  const email = (input.email ?? "").trim();

  if (await isUsernameTaken(username)) {
    return { ok: false, error: "Ese nombre de usuario ya está en uso. Elige otro." };
  }

  const loginEmail = email || synthEmail(username);

  // Crea el usuario ya confirmado (sin paso de verificación por correo).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: loginEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: { username, has_recovery: Boolean(email) },
  });
  if (createErr || !created.user) {
    return {
      ok: false,
      error: "No se pudo crear la cuenta. Si pusiste un correo, puede que ya esté registrado.",
    };
  }

  // Perfil privado: unicidad de usuario + correo de recuperación (si lo dio).
  const { error: profErr } = await admin.from("profiles").insert({
    user_id: created.user.id,
    username,
    username_lower: username.toLowerCase(),
    login_email: loginEmail,
    recovery_email: email || null,
  });
  if (profErr) {
    // Evita dejar un usuario huérfano si el nombre se tomó en una carrera.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: "Ese nombre de usuario ya está en uso. Elige otro." };
  }

  // Inicia sesión (escribe la cookie de sesión httpOnly).
  const { error: signErr } = await sb.auth.signInWithPassword({
    email: loginEmail,
    password: input.password,
  });
  if (signErr) {
    return { ok: false, error: "Cuenta creada, pero no se pudo iniciar sesión. Intenta entrar." };
  }

  return { ok: true, username };
}

export async function signIn(input: LoginInput): Promise<AuthResult> {
  const admin = getSupabaseAdmin();
  const sb = await getSupabaseServer();
  if (!admin || !sb) {
    return { ok: false, error: "Las cuentas se activan al conectar la base de datos (Supabase)." };
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("login_email, username")
    .eq("username_lower", input.username.trim().toLowerCase())
    .maybeSingle();
  // Mensaje genérico: no revelamos si el usuario existe.
  if (!prof) return { ok: false, error: "Usuario o contraseña incorrectos." };

  const { error } = await sb.auth.signInWithPassword({
    email: prof.login_email as string,
    password: input.password,
  });
  if (error) return { ok: false, error: "Usuario o contraseña incorrectos." };

  return { ok: true, username: prof.username as string };
}

export async function signOut(): Promise<void> {
  const sb = await getSupabaseServer();
  if (sb) await sb.auth.signOut();
}
