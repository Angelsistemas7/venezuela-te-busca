import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, FileText, Settings, UserRound } from "lucide-react";
import { getMyProfile } from "@/lib/auth";
import { getDigitalVolunteerStats, getMyPublications, getSavedItems } from "@/lib/data";
import { timeAgo } from "@/lib/utils";
import { AvatarUpload } from "@/components/AvatarUpload";
import { DigitalVolunteerCard } from "@/components/DigitalVolunteerCard";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const PUBLIC_PATH: Record<string, (id: string) => string> = {
  person: (id) => `/persona/${id}`,
  aid_point: (id) => `/ayuda/${id}`,
  march: (id) => `/caravanas/${id}`,
  post: () => "/comunidad",
  hospital: (id) => `/hospitales/${id}`,
  complaint: () => "/denuncias",
  pet: (id) => `/mascotas/${id}`,
  hero: () => "/ayuda",
};

const TYPE_LABEL: Record<string, string> = {
  person: "Persona",
  post: "Publicación",
  aid_point: "Punto de ayuda",
  march: "Caravana",
  hospital: "Hospital",
  complaint: "Denuncia",
  pet: "Mascota",
  hero: "Héroe",
};

export default async function PerfilPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/");

  const [publications, saved, volunteerStats] = await Promise.all([
    getMyPublications(profile.id),
    getSavedItems(profile.id),
    getDigitalVolunteerStats(profile.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <PageHeader
          icon={UserRound}
          title="Mi perfil"
          description="Tu foto, tus publicaciones y lo que guardaste."
        />
      </div>

      <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <AvatarUpload initialUrl={profile.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-zinc-900">{profile.username}</p>
          <Link
            href="/configuracion"
            className="press mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            <Settings className="h-3.5 w-3.5" />
            Ir a configuración
          </Link>
        </div>
      </section>

      <DigitalVolunteerCard username={profile.username} stats={volunteerStats} />

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
          <FileText className="h-4.5 w-4.5 text-zinc-500" />
          Mis publicaciones
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
            {publications.length}
          </span>
        </h2>
        {publications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-8 text-center text-sm text-zinc-500">
            Aún no has publicado nada con esta cuenta.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {publications.map((p) => (
              <li key={`${p.type}:${p.id}`}>
                <Link
                  href={PUBLIC_PATH[p.type]?.(p.id) ?? "/"}
                  className="press flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900">{p.title}</span>
                    <span className="text-xs text-zinc-400">
                      {TYPE_LABEL[p.type] ?? p.type} · {timeAgo(p.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
          <Bookmark className="h-4.5 w-4.5 text-zinc-500" />
          Guardados
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
            {saved.length}
          </span>
        </h2>
        {saved.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-8 text-center text-sm text-zinc-500">
            Nada guardado todavía. Usa "Guardar" en cualquier publicación para seguirla desde aquí.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {saved.map((s) => (
              <li key={`${s.type}:${s.id}`}>
                <Link
                  href={PUBLIC_PATH[s.type]?.(s.id) ?? "/"}
                  className="press flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900">
                      {s.title || TYPE_LABEL[s.type] || s.type}
                    </span>
                    <span className="text-xs text-zinc-400">{TYPE_LABEL[s.type] ?? s.type}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
