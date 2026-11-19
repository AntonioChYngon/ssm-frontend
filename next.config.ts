import type { NextConfig } from "next";

const buildEnWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  // Next's standalone file tracing can hit EPERM during its concurrent copy on
  // Windows. The container builds on Linux and still use the standalone output.
  output: buildEnWindows ? undefined : "standalone",
  poweredByHeader: false,
  ...(buildEnWindows ? { experimental: { cpus: 1 } } : {}),
  async headers() {
    // Cabeceras base recomendadas por los Lineamientos de Seguridad de Sitios Web UNAM (DGTIC).
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
