// Se ejecuta UNA vez cuando arranca el proceso de Next (soporte nativo,
// sin flag experimental desde Next 15). Sirve para que un redeploy o un
// reinicio de PM2 no deje la caché de noticias (src/lib/news.ts) fría hasta
// la próxima pasada del cron — el primer visitante después de un deploy ya
// encuentra las fotos listas.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getGdeltNews, getWorldPress } = await import("@/lib/news");
  try {
    await Promise.all([getGdeltNews(14), getWorldPress(10)]);
  } catch {
    // Si falla al arrancar, la primera visita real o el próximo cron lo intentan de nuevo.
  }
}
