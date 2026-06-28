import { redirect } from "next/navigation";

// "¿La reconoces?" se unificó en la portada con un interruptor. Mantenemos esta
// ruta para que los enlaces antiguos sigan funcionando: redirige a la vista.
export default function UnidentifiedRedirect() {
  redirect("/?view=reconoces");
}
