"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, Clock, MapPin, Phone, ShieldCheck, UserCheck, X } from "lucide-react";
import type { Person, PersonStatus, StatusReport } from "@/lib/types";
import { PERSON_STATUS_LABEL } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import {
  approveReportAction,
  dismissReportAction,
  logoutAdminAction,
  togglePersonVerifiedAction,
} from "@/app/admin/actions";

export type ReportWithName = StatusReport & { personName: string };

export function AdminDashboard({
  reports,
  persons,
  demoOpen,
}: {
  reports: ReportWithName[];
  persons: Person[];
  demoOpen: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function run(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    startTransition(async () => {
      await fn();
      router.refresh();
      setBusy(null);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Panel de moderación</h1>
            <p className="text-sm text-zinc-500">
              Verificar no es obligatorio para que algo aparezca: todo es visible de inmediato. Aquí
              solo confirmas información y aplicas cambios de estado.
            </p>
          </div>
        </div>
        <form action={logoutAdminAction}>
          <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Salir
          </button>
        </form>
      </div>

      {demoOpen && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Panel abierto (demo).</strong> Define <code className="rounded bg-amber-100 px-1">ADMIN_TOKEN</code>{" "}
          en <code className="rounded bg-amber-100 px-1">.env.local</code> para protegerlo con contraseña en producción.
        </div>
      )}

      {/* Cola de reportes por verificar */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
          <Clock className="h-4.5 w-4.5 text-zinc-500" />
          Reportes por verificar
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
            {reports.length}
          </span>
        </h2>

        {reports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-500">
            No hay reportes pendientes. Todo al día. 🤍
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/persona/${r.personId}`}
                        className="font-semibold text-zinc-900 hover:underline"
                      >
                        {r.personName}
                      </Link>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        Reporta: {PERSON_STATUS_LABEL[r.reportedStatus as PersonStatus]}
                      </span>
                      <span className="text-xs text-zinc-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-zinc-600">
                      <p className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-zinc-400" />
                        {r.reporterName} · <span className="text-zinc-500">{r.reporterRelationship}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        <a href={`tel:${r.reporterPhone}`} className="hover:underline">
                          {r.reporterPhone}
                        </a>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        {r.locationFound}
                      </p>
                      {r.notes && <p className="text-zinc-500">“{r.notes}”</p>}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => run(r.id, () => approveReportAction(r.id))}
                      disabled={pending && busy === r.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Verificar y aplicar
                    </button>
                    <button
                      onClick={() => run(r.id, () => dismissReportAction(r.id))}
                      disabled={pending && busy === r.id}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Descartar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Visto bueno a registros recientes */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
          <BadgeCheck className="h-4.5 w-4.5 text-zinc-500" />
          Registros recientes
        </h2>
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {persons.map((p) => {
            const name = `${p.firstName} ${p.lastName}`.trim() || "Sin identificar";
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/persona/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                    {name}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {[p.estado, p.locationText].filter(Boolean).join(" · ")} · {timeAgo(p.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => run(p.id, () => togglePersonVerifiedAction(p.id, !p.verified))}
                  disabled={pending && busy === p.id}
                  className={
                    p.verified
                      ? "flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      : "flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                  }
                >
                  <BadgeCheck className="h-4 w-4" />
                  {p.verified ? "Verificado" : "Dar visto bueno"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
