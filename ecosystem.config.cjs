// Configuración de PM2 para correr el servidor "standalone" de Next.js en el VPS.
// Este archivo se copia DENTRO del paquete desplegado; PM2 lo ejecuta desde la
// carpeta del release, así que las rutas relativas (./.env) resuelven ahí.
module.exports = {
  apps: [
    {
      name: "elmundotebusca",
      script: "server.js",
      // Carga los secretos de runtime desde .env (requiere Node 20.6+). El .env
      // vive SOLO en el VPS — nunca se sube desde el repo ni desde GitHub Actions.
      node_args: "--env-file=.env",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        // El servidor escucha solo en localhost; nginx hace de reverse proxy.
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "450M",
    },
  ],
};
