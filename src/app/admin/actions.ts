"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, signInAdmin, signOutAdmin } from "@/lib/admin";
import { dismissReport, setPersonVerified, verifyAndApplyReport } from "@/lib/data";

export async function loginAdminAction(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const password = String(form.get("password") ?? "");
  const ok = await signInAdmin(password);
  if (!ok) return { ok: false, error: "Contraseña incorrecta." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAdminAction(): Promise<void> {
  await signOutAdmin();
  revalidatePath("/admin");
}

export async function approveReportAction(reportId: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await verifyAndApplyReport(reportId);
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function dismissReportAction(reportId: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await dismissReport(reportId);
  revalidatePath("/admin");
  return { ok: true };
}

export async function togglePersonVerifiedAction(
  personId: string,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await setPersonVerified(personId, value);
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
