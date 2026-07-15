import { redirect } from "next/navigation";

// /noticias se repartió entre /ayuda (ReliefWeb, héroes, sismos) y /comunidad
// (historias destacadas, noticias curadas). Mantenemos esta ruta para que los
// enlaces antiguos sigan funcionando: redirige a donde vive ahora la mayoría
// del contenido.
export default function NoticiasRedirect() {
  redirect("/ayuda");
}
