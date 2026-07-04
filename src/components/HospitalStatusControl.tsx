"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, Pencil } from "lucide-react";
import { HOSPITAL_STATUS_LABEL, type HospitalStatus } from "@/lib/types";
import { canManageHospitalAction, updateHospitalStatusAction } from "@/app/actions";
import { HOSPITAL_STATUS_STYLE } from "./HospitalCard";
import { cn } from "@/lib/utils";

const STATUSES = Object.keys(HOSPITAL_STATUS_LABEL) as HospitalStatus[];

// El estado oficial (capacidad/insumos) lo actualiza el ADMIN, el autor por
// cuenta o un GESTOR delegado. El resto opina con el voto de insumos o por
// comentarios. El servidor también lo exige.
export function HospitalStatusControl({
  id,
  status,
  needsText,
}: {
  id: string;
  status: HospitalStatus;
  needsText: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draftStatus, setDraftStatus] = useState<HospitalStatus>(status);
  const [draftNeeds, setDraftNeeds] = useState(needsText);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    canManageHospitalAction(id)
      .then((ok) => setCanManage(ok))
      .catch(() => setCanManage(false));
  }, [id]);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateHospitalStatusAction(id, draftStatus, draftNeeds);
      if (res.ok) {
        router.refresh();
        setEditing(false);
      } else {
        setError(res.error ?? "No se pudo actualizar.");
      }
    });
  }

  if (!editing) {
    // Mientras carga el permiso (null) no mostramos nada para no parpadear.
    if (canManage === null) return null;
    if (canManage === false) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Solo el gestor designado actualiza el estado oficial
        </span>
      );
    }
    return (
      <button
        onClick={() => setEditing(true)}
        className="press inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Actualizar estado / insumos
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="mb-2 text-sm font-medium text-zinc-700">Capacidad</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setDraftStatus(s)}
            className={cn(
              "press inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
              draftStatus === s ? HOSPITAL_STATUS_STYLE[s].chip : "border-zinc-200 bg-white text-zinc-500",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", HOSPITAL_STATUS_STYLE[s].dot)} />
            {HOSPITAL_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <p className="mb-1.5 mt-4 text-sm font-medium text-zinc-700">Insumos / notas</p>
      <textarea
        value={draftNeeds}
        onChange={(e) => setDraftNeeds(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        placeholder="Qué necesitan, si reciben remisiones, donantes de sangre..."
      />

      {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setEditing(false)} className="press rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-white">
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={pending}
          className="press flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Guardar
        </button>
      </div>
    </div>
  );
}
