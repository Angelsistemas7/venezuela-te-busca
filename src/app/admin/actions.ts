"use server";

import { revalidatePath } from "next/cache";
import { isAdmin, signInAdmin, signOutAdmin } from "@/lib/admin";
import { findUserByUsername } from "@/lib/auth";
import {
  addResourceManager,
  createNewsItem,
  deleteHero,
  deleteNewsItem,
  dismissReport,
  removeResourceManager,
  setAidPointVerified,
  setHeroVerified,
  setHospitalVerified,
  setPersonVerified,
  setPostPinned,
  verifyAndApplyReport,
} from "@/lib/data";
import type { ManagedEntity } from "@/lib/types";
import { managerAssignSchema, newsItemSchema } from "@/lib/validation";

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

// ── Visto bueno a recursos (puntos de ayuda y hospitales) ────────────────────
export async function toggleAidPointVerifiedAction(
  id: string,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await setAidPointVerified(id, value);
  revalidatePath("/admin");
  revalidatePath("/ayuda");
  revalidatePath(`/ayuda/${id}`);
  revalidatePath("/mapa");
  return { ok: true };
}

export async function toggleHospitalVerifiedAction(
  id: string,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await setHospitalVerified(id, value);
  revalidatePath("/admin");
  revalidatePath("/hospitales");
  revalidatePath(`/hospitales/${id}`);
  revalidatePath("/mapa");
  return { ok: true };
}

// ── Héroes: visto bueno y eliminación de propuestas falsas ───────────────────
export async function toggleHeroVerifiedAction(
  id: string,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await setHeroVerified(id, value);
  revalidatePath("/admin");
  revalidatePath("/noticias");
  return { ok: true };
}

export async function deleteHeroAction(id: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await deleteHero(id);
  revalidatePath("/admin");
  revalidatePath("/noticias");
  return { ok: true };
}

// ── Noticias curadas: las agrega/quita el equipo (admin) ─────────────────────
export async function createNewsItemAction(
  form: FormData,
): Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }> {
  if (!(await isAdmin())) return { ok: false, error: "Solo el equipo puede agregar noticias." };
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const parsed = newsItemSchema.safeParse({
    kind: get("kind"),
    title: get("title"),
    body: get("body"),
    sourceName: get("sourceName"),
    sourceUrl: get("sourceUrl"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const key = String(i.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = i.message;
    }
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors };
  }
  try {
    await createNewsItem(parsed.data, get("photoUrl") || null);
    revalidatePath("/noticias");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la noticia." };
  }
}

export async function deleteNewsItemAction(id: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await deleteNewsItem(id);
  revalidatePath("/admin");
  revalidatePath("/noticias");
  return { ok: true };
}

// ── Fijar/desfijar publicaciones de la comunidad ─────────────────────────────
export async function togglePostPinnedAction(
  id: string,
  value: boolean,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await setPostPinned(id, value);
  revalidatePath("/admin");
  revalidatePath("/comunidad");
  return { ok: true };
}

// ── Gestores delegados por recurso ───────────────────────────────────────────
/** Asigna a un usuario (por nombre de usuario) como gestor de un recurso. */
export async function assignManagerAction(
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "No autorizado." };
  const parsed = managerAssignSchema.safeParse({
    entityType: String(form.get("entityType") ?? ""),
    entityId: String(form.get("entityId") ?? ""),
    username: String(form.get("username") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa el nombre de usuario." };
  }
  const user = await findUserByUsername(parsed.data.username);
  if (!user) {
    return { ok: false, error: "No existe una cuenta con ese nombre de usuario." };
  }
  await addResourceManager(parsed.data.entityType, parsed.data.entityId, user.id, user.username, "admin");
  revalidatePath("/admin");
  return { ok: true };
}

/** Quita a un usuario como gestor de un recurso. */
export async function removeManagerAction(
  entityType: ManagedEntity,
  entityId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  await removeResourceManager(entityType, entityId, userId);
  revalidatePath("/admin");
  return { ok: true };
}
