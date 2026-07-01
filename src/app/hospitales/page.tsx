import { Building2 } from "lucide-react";
import { getHospitals, getPatientCounts } from "@/lib/data";
import { HOSPITAL_STATUS_LABEL, type HospitalStatus } from "@/lib/types";
import { HospitalCard, HOSPITAL_STATUS_STYLE } from "@/components/HospitalCard";
import { RegisterHospitalButton } from "@/components/RegisterHospitalButton";

export const dynamic = "force-dynamic";

export default async function HospitalesPage() {
  const [hospitals, counts] = await Promise.all([getHospitals(), getPatientCounts()]);

  const byStatus = (s: HospitalStatus) => hospitals.filter((h) => h.status === s).length;
  const summary: HospitalStatus[] = ["operativo", "saturado", "lleno", "cerrado"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Hospitales</h1>
            <p className="mt-1 max-w-2xl text-zinc-500">
              Capacidad en tiempo real, especialidades e insumos que necesitan, para saber a dónde
              trasladar a cada persona. Abre un hospital para ver la lista de personas atendidas.
            </p>
          </div>
        </div>
        <RegisterHospitalButton />
      </div>

      {/* Resumen de capacidad: fila horizontal (antes iba en rejilla 2x2, se veía
          apilada y grande en móvil). Sin movimiento: solo se desliza a mano si
          no entran los 4 en una línea. */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s}
            className="w-24 shrink-0 rounded-xl border border-zinc-200 bg-white p-2 text-center sm:w-auto sm:p-3"
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${HOSPITAL_STATUS_STYLE[s].dot}`} />
              <span className="text-base font-bold text-zinc-900 sm:text-xl">{byStatus(s)}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{HOSPITAL_STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>

      {hospitals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          Aún no hay hospitales registrados. Sé el primero en publicar uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((h) => (
            <HospitalCard key={h.id} hospital={h} patientCount={counts[h.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
