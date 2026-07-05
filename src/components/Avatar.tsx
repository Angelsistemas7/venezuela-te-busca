import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE = { sm: "h-7 w-7", md: "h-9 w-9" } as const;

/**
 * Foto de perfil de quien publicó/comentó, con enlace a su perfil público
 * cuando lo hizo con cuenta (`username` presente). Sin cuenta (anónimo) se ve
 * el ícono genérico y sin enlace — es un caso normal en esta app, no un error.
 */
export function Avatar({
  src,
  username,
  size = "sm",
  className,
}: {
  src?: string | null;
  username?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = SIZE[size];
  const content = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={cn(dim, "shrink-0 rounded-full object-cover", className)} />
  ) : (
    <UserCircle2 className={cn(dim, "shrink-0 text-zinc-300", className)} />
  );

  if (!username) return content;

  return (
    <Link
      href={`/perfil/publico/${username}`}
      className="shrink-0 transition hover:opacity-80"
      aria-label={`Perfil de ${username}`}
    >
      {content}
    </Link>
  );
}
