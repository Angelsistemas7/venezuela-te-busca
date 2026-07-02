import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getMyProfile } from "@/lib/auth";
import { AccountSettings } from "@/components/AccountSettings";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/");

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Configuración</h1>
          <p className="mt-1 text-zinc-500">Contraseña, correo de recuperación, avisos y tu cuenta.</p>
        </div>
      </div>

      <AccountSettings
        username={profile.username}
        recoveryEmail={profile.recoveryEmail}
        emailNotifications={profile.emailNotifications}
      />
    </div>
  );
}
