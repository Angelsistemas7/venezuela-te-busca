"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { getSessionUserAction } from "@/app/actions";

const HIDE_KEY = "vtb_hide_account_banner";

// Anuncio discreto que invita a crear cuenta (opcional). Se oculta si ya hay
// sesión o si el usuario lo descarta. No estorba: una sola línea, cerrable.
export function AccountBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(HIDE_KEY)) return;
    getSessionUserAction()
      .then((u) => setShow(!u))
      .catch(() => setShow(false));
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* noop */
    }
    setShow(false);
  }

  function openRegister() {
    window.dispatchEvent(new CustomEvent("vtb:auth-open", { detail: { mode: "register" } }));
  }

  return (
    <div className="border-b border-brand-200 bg-brand-50">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm text-brand-900">
        <Sparkles className="h-4 w-4 shrink-0 text-brand-600" />
        <p className="flex-1">
          <span className="font-semibold">Crea tu cuenta (opcional):</span> no pierdas tus
          publicaciones aunque cambies de teléfono, y comenta más fácil.{" "}
          <button onClick={openRegister} className="press font-semibold underline underline-offset-2">
            Crear cuenta
          </button>
        </p>
        <button
          onClick={dismiss}
          aria-label="Ocultar aviso"
          className="press shrink-0 rounded-full p-1 text-brand-700 transition hover:bg-brand-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
