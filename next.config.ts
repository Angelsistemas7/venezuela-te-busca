import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empaqueta un servidor Node autocontenido en `.next/standalone` (server.js +
  // solo las dependencias necesarias). Es lo que se sube al VPS y corre con PM2.
  // Vercel lo ignora, así que no afecta el despliegue actual.
  output: "standalone",
  images: {
    // Permite mostrar fotos servidas desde Supabase Storage cuando esté configurado.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default nextConfig;
