import { redirect } from "next/navigation";

// El directorio de plataformas externas se movió dentro de /emergencias como
// tarjeta expandible. Mantenemos esta ruta para que los enlaces antiguos
// sigan funcionando: redirige a donde vive ahora.
export default function RecursosRedirect() {
  redirect("/emergencias");
}
