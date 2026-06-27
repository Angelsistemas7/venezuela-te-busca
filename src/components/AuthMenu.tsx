"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Loader2, UserCircle2 } from "lucide-react";
import {
  getSessionUserAction,
  signInAction,
  signOutAction,
  signUpAction,
  type AuthActionResult,
} from "@/app/actions";
import { Modal } from "./Modal";
import { Field, Input } from "./FormControls";
import { Turnstile } from "./Turnstile";

type SessionUser = { id: string; username: string } | null;
type Mode = "login" | "register";

export function AuthMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AuthActionResult | null>(null);

  async function refresh() {
    try {
      setUser(await getSessionUserAction());
    } catch {
      /* sin sesión o sin Supabase */
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // Permite abrir el modal desde otros sitios (p. ej. el banner de invitación).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode?: Mode } | undefined;
      setMode(detail?.mode === "register" ? "register" : "login");
      setResult(null);
      setOpen(true);
    };
    window.addEventListener("vtb:auth-open", onOpen);
    return () => window.removeEventListener("vtb:auth-open", onOpen);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const form = new FormData(e.currentTarget);
      const res = mode === "register" ? await signUpAction(form) : await signInAction(form);
      setResult(res);
      if (res.ok) {
        setOpen(false);
        await refresh();
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await signOutAction();
    await refresh();
    router.refresh();
  }

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <>
      {user ? (
        <div className="flex items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 sm:flex">
            <UserCircle2 className="h-4 w-4 text-zinc-500" />
            {user.username}
          </span>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setMode("login");
            setResult(null);
            setOpen(true);
          }}
          className="flex h-10 items-center gap-1.5 rounded-full border border-zinc-300 px-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
        subtitle={
          mode === "register"
            ? "Para no perder tus publicaciones aunque cambies de teléfono o navegador."
            : "Entra para gestionar tus publicaciones desde cualquier dispositivo."
        }
      >
        {/* El `key` reinicia el formulario al cambiar de modo. */}
        <form key={mode} onSubmit={onSubmit} className="space-y-4">
          <Field label="Nombre de usuario" htmlFor="username" required error={fieldErrors?.username}>
            <Input id="username" name="username" autoComplete="username" placeholder="ej. maria_g" />
          </Field>

          <Field
            label="Contraseña"
            htmlFor="password"
            required
            error={fieldErrors?.password}
            hint={
              mode === "register"
                ? "Mínimo 10 caracteres. No uses la misma de tu correo o redes, pero elige una que recuerdes."
                : undefined
            }
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••••••••"
            />
          </Field>

          {mode === "register" && (
            <Field
              label="Correo (opcional)"
              htmlFor="email"
              error={fieldErrors?.email}
              hint="Solo se usa para recuperar tu clave si la olvidas. Si lo dejas vacío, no podrás recuperarla."
            >
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" />
            </Field>
          )}

          {mode === "register" && <Turnstile />}

          {result && !result.ok && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {result.error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-brand-300 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "register" ? "Crear cuenta" : "Entrar"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            {mode === "register" ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Créala (es opcional)
                </button>
              </>
            )}
          </p>
        </form>
      </Modal>
    </>
  );
}
