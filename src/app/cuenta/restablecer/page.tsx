import Link from "next/link";
import { KeyRound, ShieldX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

// A esta página se llega desde el enlace del correo (tras canjear el código en
// /cuenta/confirmar, que abre una sesión de recuperación). Sin esa sesión, no se
// puede cambiar la clave.
export default async function RestablecerPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <ShieldX className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">Enlace inválido o expirado</h1>
        <p className="mt-2 text-sm text-zinc-500">
          El enlace de recuperación no es válido o ya caducó. Vuelve a pedir uno desde
          «Iniciar sesión → ¿Olvidaste tu clave?».
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Elige una contraseña nueva para tu cuenta <strong>{user.username}</strong>.
          </p>
        </div>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
