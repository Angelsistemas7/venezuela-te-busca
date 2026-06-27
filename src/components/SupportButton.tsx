"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { supportComplaintAction } from "@/app/actions";
import { cn } from "@/lib/utils";

// "Apoyar" una denuncia (uno por dispositivo). Exige sesión: si no hay, el
// servidor lo rechaza y mostramos el aviso para iniciar sesión.
export function SupportButton({ id, supports }: { id: string; supports: number }) {
  const router = useRouter();
  const [count, setCount] = useState(supports);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(`vtb_support_${id}`)) setSupported(true);
  }, [id]);

  async function support() {
    if (supported) return;
    setError(null);
    const res = await supportComplaintAction(id);
    if (res.ok) {
      setSupported(true);
      setCount((n) => n + 1);
      localStorage.setItem(`vtb_support_${id}`, "1");
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo apoyar.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={support}
        disabled={supported}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95",
          supported
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        <ThumbsUp className={cn("h-4 w-4", supported && "fill-emerald-500 text-emerald-500")} />
        Apoyar
        <span className="tabular-nums">{count > 0 ? count : ""}</span>
      </button>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
}
