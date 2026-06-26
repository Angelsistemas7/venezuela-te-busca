"use client";

import { getSupabase } from "./supabase";

// Sube una foto a Supabase Storage (bucket público "photos") desde el
// navegador y devuelve la URL pública. Si Supabase no está configurado,
// devuelve null y la app continúa sin foto persistida.
export async function uploadPhoto(file: File): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from("photos").upload(name, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = sb.storage.from("photos").getPublicUrl(name);
  return data.publicUrl;
}
