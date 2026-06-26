import { Info } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

// Banner visible solo cuando la base de datos real no está conectada.
export function DevModeNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">Modo demostración.</span> Estás viendo datos de ejemplo en
        memoria. Conecta Supabase (ver <code className="rounded bg-amber-100 px-1">.env.example</code>{" "}
        y <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code>) para guardar datos
        reales de forma permanente.
      </p>
    </div>
  );
}
