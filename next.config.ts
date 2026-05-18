import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplicamos la regla a absolutamente todas las páginas de la web
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none", // Apaga el bloqueo de la ventana emergente
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none", // Apaga el bloqueo de comunicación con Google
          },
        ],
      },
    ];
  },
};

export default nextConfig;