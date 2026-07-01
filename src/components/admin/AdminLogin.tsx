"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { loginAdminAction } from "@/app/admin/actions";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await loginAdminAction(new FormData(e.currentTarget));
    if (res.ok) router.refresh();
    else setError(res.error ?? "Error");
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-20">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
        <Lock className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-zinc-900">Panel de moderación</h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Acceso para voluntarios de confianza.
      </p>
      <form onSubmit={onSubmit} className="mt-6 w-full space-y-3">
        <input
          name="password"
          type="password"
          placeholder="Contraseña de administración"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          autoFocus
        />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="press flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  );
}
