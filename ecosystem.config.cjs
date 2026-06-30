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
        // OJO: el VPS es compartido. Los puertos 3000/3001/3002/3100/3500/4000/
        // 4500/8000/8081 ya los usan contenedores Docker del equipo. Usamos 3200.
        PORT: "3200",
        HOSTNAME: "127.0.0.1",
      },
      max_memory_restart: "450M",
    },
  ],
};
