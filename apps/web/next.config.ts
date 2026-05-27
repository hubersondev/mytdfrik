import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build optimisé pour conteneur (réduit la taille de l'image runtime)
  output: 'standalone',
  // Source du monorepo : remonte d'un cran pour résoudre les imports workspace
  outputFileTracingRoot: process.env.TURBO_ROOT ?? undefined,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
