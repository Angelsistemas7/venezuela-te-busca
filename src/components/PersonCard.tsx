import Link from "next/link";
import { MapPin, IdCard, Clock, BadgeCheck } from "lucide-react";
import type { Person } from "@/lib/types";
import { PERSON_STATUS_LABEL } from "@/lib/types";
import { cn, statusStyle, timeAgo } from "@/lib/utils";
import { PersonPhoto } from "./PersonPhoto";

export function PersonCard({ person }: { person: Person }) {
  const s = statusStyle(person.status);
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const meta = [
    person.cedula,
    person.age != null ? `${person.age} años` : null,
    person.gender,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/persona/${person.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/60"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        <PersonPhoto
          src={person.photoUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          isUnidentified={person.isUnidentified}
          className="transition group-hover:scale-[1.02]"
        />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
            s.bg,
            s.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          {PERSON_STATUS_LABEL[person.status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="flex items-center gap-1 font-semibold text-zinc-900">
          <span className="line-clamp-1">
            {person.isUnidentified && !fullName ? "Persona sin identificar" : fullName}
          </span>
          {person.verified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Verificado" />
          )}
        </h3>
        {meta && (
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <IdCard className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{meta}</span>
          </p>
        )}
        {person.locationText && (
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {person.locationText}
              {person.estado ? `, ${person.estado}` : ""}
            </span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-1 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {timeAgo(person.createdAt)}
          </span>
          {(() => {
            const total =
              person.reactions.fuerza + person.reactions.corazon + person.reactions.difundir;
            return total > 0 ? <span className="text-zinc-500">🙏 {total}</span> : null;
          })()}
        </div>
      </div>
    </Link>
  );
}
