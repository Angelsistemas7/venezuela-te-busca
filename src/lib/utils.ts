import type { PersonStatus } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Etiqueta de tiempo relativa en español ("hace 5 min"). */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-VE");
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Estilo de color (Tailwind) por estado, para chips y badges. */
export function statusStyle(status: PersonStatus): { bg: string; text: string; dot: string } {
  switch (status) {
    case "localizado":
      return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "hospitalizado":
      return { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" };
    case "fallecido":
      return { bg: "bg-zinc-100", text: "text-zinc-600", dot: "bg-zinc-400" };
    default:
      return { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" };
  }
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
