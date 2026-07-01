import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Quita la cabecera "X-Powered-By: Next.js" (info gratis para un atacante).
  poweredByHeader: false,
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
  // Cabeceras de seguridad en todas las rutas. Sin esto la app no tenía NINGUNA
  // (ni siquiera clickjacking en /admin). No se usa CSP estricta porque cargamos
  // scripts de terceros (Turnstile, mapas) por dominio variable; el resto sí.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
