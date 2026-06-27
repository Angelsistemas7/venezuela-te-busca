import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldX } from "lucide-react";
import { getAidPointById, verifyResourceOwner } from "@/lib/data";
import { AidPointManagePanel } from "@/components/AidPointManagePanel";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AidPointGestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const token = str(sp.token) ?? "";

  const point = await getAidPointById(id);
  if (!point) notFound();

  const isOwner = await verifyResourceOwner("aid_point", id, token);

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <ShieldX className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">Enlace de gestión no válido</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Este enlace privado no es correcto o ha cambiado. Solo quien publicó el punto tiene el
          enlace de gestión que se mostró al momento de publicar.
        </p>
        <Link href={`/ayuda/${id}`} className="mt-6 inline-block rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Ver el punto de ayuda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/ayuda/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" />
        Ver el punto de ayuda
      </Link>

      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestionar punto de ayuda</h1>
          <p className="mt-1 text-zinc-500">
            {point.name} · Estás identificado como autor (enlace privado o cuenta) o gestor designado.
          </p>
        </div>
      </div>

      <AidPointManagePanel point={point} token={token} />
    </div>
  );
}
