"use client";

import { useEffect, useRef } from "react";

// Widget de Cloudflare Turnstile. Si no hay site key configurada, renderiza
// una nota discreta y el formulario sigue funcionando (modo desarrollo).

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function Turnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const el = ref.current;

    function renderWidget() {
      if (!window.turnstile || !el) return;
      widgetId.current = window.turnstile.render(el, { sitekey: siteKey });
    }

    if (window.turnstile) {
      renderWidget();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          renderWidget();
        }
      }, 200);
      return () => clearInterval(t);
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* noop */
        }
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
        Verificación anti-bot activa en producción (Cloudflare Turnstile).
      </p>
    );
  }

  return <div ref={ref} className="min-h-[65px]" />;
}
