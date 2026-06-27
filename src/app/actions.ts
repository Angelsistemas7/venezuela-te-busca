"use server";

import { revalidatePath } from "next/cache";
import {
  addHospitalPatient,
  createAidPoint,
  createComment,
  createHospital,
  createMarch,
  createPerson,
  createPost,
  createStatusReport,
  likeComment,
  deleteAidPoint,
  deleteMarch,
  deletePerson,
  likeAidPoint,
  likeHospital,
  likeMarch,
  reactToPerson,
  reactToPost,
  updateAidPointFields,
  updateHospitalStatus,
  updateMarchFields,
  updatePersonFields,
  updatePersonStatus,
  verifyOwner,
  verifyResourceOwner,
  voteAidAvailability,
  voteHospitalSupplies,
} from "@/lib/data";
import { verifyTurnstile } from "@/lib/turnstile";
import type { HospitalStatus, PersonReaction, PersonStatus, ReactionKind } from "@/lib/types";
import {
  aidPointSchema,
  hospitalPatientSchema,
  hospitalSchema,
  marchSchema,
  personSchema,
  postSchema,
  statusReportSchema,
} from "@/lib/validation";

export type ActionResult =
  | { ok: true; message: string; id?: string; ownerToken?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function zodToFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function getField(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
}

// ── Registrar persona desaparecida ──────────────────────────────────────────
export async function registerPersonAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = personSchema.safeParse({
    firstName: getField(form, "firstName"),
    lastName: getField(form, "lastName"),
    cedula: getField(form, "cedula"),
    age: getField(form, "age"),
    gender: getField(form, "gender") || undefined,
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    description: getField(form, "description"),
    isUnidentified: getField(form, "isUnidentified") === "on",
    contactName: getField(form, "contactName"),
    contactPhone: getField(form, "contactPhone"),
    contactEmail: getField(form, "contactEmail"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  // La foto: en producción se sube a Supabase Storage desde el cliente y aquí
  // llega la URL. De momento aceptamos la URL ya subida (o null).
  const photoUrl = getField(form, "photoUrl") || null;

  // Un avistamiento "sin identificar" puede no tener nombre, pero algo debe
  // permitir reconocer a la persona: foto, un rasgo/descripción o el lugar.
  if (parsed.data.isUnidentified) {
    const hasClue =
      photoUrl ||
      (parsed.data.firstName ?? "").trim() ||
      (parsed.data.description ?? "").trim() ||
      (parsed.data.locationText ?? "").trim();
    if (!hasClue) {
      return {
        ok: false,
        error:
          "Para alguien sin identificar, sube al menos una foto, o indica un rasgo/descripción o el lugar donde la viste.",
      };
    }
  }

  try {
    const { person, ownerToken } = await createPerson(parsed.data, photoUrl);
    revalidatePath("/");
    revalidatePath("/sin-identificar");
    return {
      ok: true,
      message: "Registro publicado. Gracias por ayudar a localizar a esta persona.",
      id: person.id,
      ownerToken,
    };
  } catch {
    return { ok: false, error: "No se pudo guardar el registro. Intenta de nuevo." };
  }
}

// ── Reportar cambio de estado ("tengo información" / "lo encontré") ──────────
export async function reportStatusAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = statusReportSchema.safeParse({
    personId: getField(form, "personId"),
    reportedStatus: getField(form, "reportedStatus"),
    reporterName: getField(form, "reporterName"),
    reporterPhone: getField(form, "reporterPhone"),
    reporterRelationship: getField(form, "reporterRelationship"),
    locationFound: getField(form, "locationFound"),
    notes: getField(form, "notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    const report = await createStatusReport(parsed.data);
    revalidatePath("/");
    revalidatePath(`/persona/${parsed.data.personId}`);
    return {
      ok: true,
      id: report.id,
      message:
        "Gracias. Tu reporte ya es visible en la ficha de la persona. Un moderador lo verificará para confirmar el cambio de estado oficial; mientras tanto, la información ya ayuda a quien busca.",
    };
  } catch {
    return { ok: false, error: "No se pudo enviar el reporte. Intenta de nuevo." };
  }
}

// ── Registrar punto de ayuda ─────────────────────────────────────────────────
export async function registerAidPointAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = aidPointSchema.safeParse({
    name: getField(form, "name"),
    types: form.getAll("types").filter((v): v is string => typeof v === "string"),
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    scheduleText: getField(form, "scheduleText"),
    description: getField(form, "description"),
    contactName: getField(form, "contactName"),
    contactPhone: getField(form, "contactPhone"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  const photoUrl = getField(form, "photoUrl") || null;

  try {
    const { point, ownerToken } = await createAidPoint(parsed.data, photoUrl);
    revalidatePath("/ayuda");
    revalidatePath("/mapa");
    return {
      ok: true,
      id: point.id,
      ownerToken,
      message: "Punto de ayuda publicado. Aparecerá como 'por verificar' hasta que se confirme.",
    };
  } catch {
    return { ok: false, error: "No se pudo guardar el punto. Intenta de nuevo." };
  }
}

// ── Registrar marcha / caravana ──────────────────────────────────────────────
export async function registerMarchAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = marchSchema.safeParse({
    title: getField(form, "title"),
    originText: getField(form, "originText"),
    destinationText: getField(form, "destinationText"),
    departAt: getField(form, "departAt"),
    organizerName: getField(form, "organizerName"),
    organizerPhone: getField(form, "organizerPhone"),
    whatsappUrl: getField(form, "whatsappUrl"),
    description: getField(form, "description"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    const { march, ownerToken } = await createMarch(parsed.data);
    revalidatePath("/caravanas");
    revalidatePath("/mapa");
    return {
      ok: true,
      id: march.id,
      ownerToken,
      message: "Convocatoria publicada. Comparte el punto de salida con tu comunidad.",
    };
  } catch {
    return { ok: false, error: "No se pudo publicar la convocatoria. Intenta de nuevo." };
  }
}

// ── Comentario en el foro ────────────────────────────────────────────────────
export async function postCommentAction(form: FormData): Promise<ActionResult> {
  const entityType = getField(form, "entityType") as
    | "person"
    | "aid_point"
    | "march"
    | "post"
    | "hospital";
  const entityId = getField(form, "entityId");
  const authorName = getField(form, "authorName").trim();
  const body = getField(form, "body").trim();
  const photoUrl = getField(form, "photoUrl") || null;
  const parentId = getField(form, "parentId") || null;

  if (!entityId || authorName.length < 2 || (body.length < 2 && !photoUrl)) {
    return { ok: false, error: "Escribe tu nombre y un comentario (o adjunta una foto)." };
  }
  if (body.length > 1000) {
    return { ok: false, error: "El comentario es demasiado largo." };
  }

  try {
    await createComment(entityType, entityId, authorName, body, photoUrl, parentId);
    return { ok: true, message: "Comentario publicado." };
  } catch {
    return { ok: false, error: "No se pudo publicar el comentario." };
  }
}

export async function likeCommentAction(id: string): Promise<{ ok: boolean }> {
  try {
    await likeComment(id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── "Me gusta" en publicaciones de recursos ──────────────────────────────────
export async function likeAidPointAction(id: string): Promise<{ ok: boolean }> {
  try {
    await likeAidPoint(id);
    revalidatePath("/ayuda");
    revalidatePath(`/ayuda/${id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function likeMarchAction(id: string): Promise<{ ok: boolean }> {
  try {
    await likeMarch(id);
    revalidatePath("/caravanas");
    revalidatePath(`/caravanas/${id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function likeHospitalAction(id: string): Promise<{ ok: boolean }> {
  try {
    await likeHospital(id);
    revalidatePath("/hospitales");
    revalidatePath(`/hospitales/${id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Comunidad / Feed ─────────────────────────────────────────────────────────
export async function createPostAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = postSchema.safeParse({
    type: getField(form, "type"),
    body: getField(form, "body"),
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    linkUrl: getField(form, "linkUrl"),
    authorName: getField(form, "authorName"),
    contactPhone: getField(form, "contactPhone"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  const photoUrl = getField(form, "photoUrl") || null;

  try {
    const post = await createPost(parsed.data, photoUrl);
    revalidatePath("/comunidad");
    return { ok: true, id: post.id, message: "Publicado. Gracias por mantener informada a la comunidad." };
  } catch {
    return { ok: false, error: "No se pudo publicar. Intenta de nuevo." };
  }
}

export async function reactToPostAction(id: string, kind: ReactionKind): Promise<{ ok: boolean }> {
  try {
    await reactToPost(id, kind);
    revalidatePath("/comunidad");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function reactToPersonAction(
  id: string,
  kind: PersonReaction,
): Promise<{ ok: boolean }> {
  try {
    await reactToPerson(id, kind);
    revalidatePath(`/persona/${id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Gestión por el autor (enlace privado con token) ──────────────────────────
export async function ownerSetStatusAction(
  id: string,
  token: string,
  status: PersonStatus,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifyOwner(id, token))) return { ok: false, error: "Enlace de gestión no válido." };
  try {
    await updatePersonStatus(id, status);
    revalidatePath(`/persona/${id}`);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function ownerUpdateAction(form: FormData): Promise<ActionResult> {
  const id = getField(form, "personId");
  const token = getField(form, "token");
  if (!(await verifyOwner(id, token))) {
    return { ok: false, error: "Enlace de gestión no válido." };
  }

  const parsed = personSchema.safeParse({
    firstName: getField(form, "firstName"),
    lastName: getField(form, "lastName"),
    age: getField(form, "age"),
    gender: getField(form, "gender") || undefined,
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    description: getField(form, "description"),
    // Reflejamos si la persona es "sin identificar" para no exigir nombre al editarla.
    isUnidentified: getField(form, "isUnidentified") === "on",
    contactName: getField(form, "contactName"),
    contactPhone: getField(form, "contactPhone"),
    contactEmail: getField(form, "contactEmail"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    await updatePersonFields(id, parsed.data);
    revalidatePath(`/persona/${id}`);
    return { ok: true, message: "Datos actualizados." };
  } catch {
    return { ok: false, error: "No se pudo actualizar. Intenta de nuevo." };
  }
}

export async function ownerDeleteAction(
  id: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifyOwner(id, token))) return { ok: false, error: "Enlace de gestión no válido." };
  try {
    await deletePerson(id);
    revalidatePath("/");
    revalidatePath("/sin-identificar");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}

// ── Gestión por el autor de puntos de ayuda y caravanas (enlace privado) ─────
export async function ownerUpdateAidPointAction(form: FormData): Promise<ActionResult> {
  const id = getField(form, "aidPointId");
  const token = getField(form, "token");
  if (!(await verifyResourceOwner("aid_point", id, token))) {
    return { ok: false, error: "Enlace de gestión no válido." };
  }

  const parsed = aidPointSchema.safeParse({
    name: getField(form, "name"),
    types: form.getAll("types").filter((v): v is string => typeof v === "string"),
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    scheduleText: getField(form, "scheduleText"),
    description: getField(form, "description"),
    contactName: getField(form, "contactName"),
    contactPhone: getField(form, "contactPhone"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    await updateAidPointFields(id, parsed.data);
    revalidatePath(`/ayuda/${id}`);
    revalidatePath("/ayuda");
    revalidatePath("/mapa");
    return { ok: true, message: "Punto actualizado." };
  } catch {
    return { ok: false, error: "No se pudo actualizar. Intenta de nuevo." };
  }
}

export async function ownerDeleteAidPointAction(
  id: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifyResourceOwner("aid_point", id, token)))
    return { ok: false, error: "Enlace de gestión no válido." };
  try {
    await deleteAidPoint(id);
    revalidatePath("/ayuda");
    revalidatePath("/mapa");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}

export async function ownerUpdateMarchAction(form: FormData): Promise<ActionResult> {
  const id = getField(form, "marchId");
  const token = getField(form, "token");
  if (!(await verifyResourceOwner("march", id, token))) {
    return { ok: false, error: "Enlace de gestión no válido." };
  }

  const parsed = marchSchema.safeParse({
    title: getField(form, "title"),
    originText: getField(form, "originText"),
    destinationText: getField(form, "destinationText"),
    departAt: getField(form, "departAt"),
    organizerName: getField(form, "organizerName"),
    organizerPhone: getField(form, "organizerPhone"),
    whatsappUrl: getField(form, "whatsappUrl"),
    description: getField(form, "description"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    await updateMarchFields(id, parsed.data);
    revalidatePath(`/caravanas/${id}`);
    revalidatePath("/caravanas");
    revalidatePath("/mapa");
    return { ok: true, message: "Caravana actualizada." };
  } catch {
    return { ok: false, error: "No se pudo actualizar. Intenta de nuevo." };
  }
}

export async function ownerDeleteMarchAction(
  id: string,
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await verifyResourceOwner("march", id, token)))
    return { ok: false, error: "Enlace de gestión no válido." };
  try {
    await deleteMarch(id);
    revalidatePath("/caravanas");
    revalidatePath("/mapa");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}

export async function voteAidAvailabilityAction(
  id: string,
  vote: "available" | "depleted",
): Promise<{ ok: boolean }> {
  try {
    await voteAidAvailability(id, vote);
    revalidatePath("/ayuda");
    revalidatePath("/mapa");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function voteHospitalSuppliesAction(
  id: string,
  vote: "yes" | "no",
): Promise<{ ok: boolean }> {
  try {
    await voteHospitalSupplies(id, vote);
    revalidatePath("/hospitales");
    revalidatePath(`/hospitales/${id}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Hospitales ───────────────────────────────────────────────────────────────
export async function registerHospitalAction(form: FormData): Promise<ActionResult> {
  const token = getField(form, "cf-turnstile-response") || null;
  if (!(await verifyTurnstile(token))) {
    return { ok: false, error: "No se pudo verificar que eres una persona. Intenta de nuevo." };
  }

  const parsed = hospitalSchema.safeParse({
    name: getField(form, "name"),
    estado: getField(form, "estado") || undefined,
    locationText: getField(form, "locationText"),
    status: getField(form, "status"),
    specialties: getField(form, "specialties"),
    needsText: getField(form, "needsText"),
    contactName: getField(form, "contactName"),
    contactPhone: getField(form, "contactPhone"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    const hospital = await createHospital(parsed.data);
    revalidatePath("/hospitales");
    revalidatePath("/mapa");
    return { ok: true, id: hospital.id, message: "Hospital publicado. Gracias por mantener la información al día." };
  } catch {
    return { ok: false, error: "No se pudo publicar el hospital. Intenta de nuevo." };
  }
}

export async function updateHospitalStatusAction(
  id: string,
  status: HospitalStatus,
  needsText: string,
): Promise<{ ok: boolean }> {
  try {
    await updateHospitalStatus(id, status, needsText);
    revalidatePath("/hospitales");
    revalidatePath(`/hospitales/${id}`);
    revalidatePath("/mapa");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function addHospitalPatientAction(form: FormData): Promise<ActionResult> {
  const parsed = hospitalPatientSchema.safeParse({
    hospitalId: getField(form, "hospitalId"),
    fullName: getField(form, "fullName"),
    cedula: getField(form, "cedula"),
    condition: getField(form, "condition"),
    status: getField(form, "status"),
    note: getField(form, "note"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: zodToFieldErrors(parsed.error) };
  }

  try {
    await addHospitalPatient(parsed.data);
    revalidatePath(`/hospitales/${parsed.data.hospitalId}`);
    revalidatePath("/hospitales");
    return { ok: true, message: "Paciente agregado a la lista del hospital." };
  } catch {
    return { ok: false, error: "No se pudo agregar. Intenta de nuevo." };
  }
}
