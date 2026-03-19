/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel sets VERCEL_URL per deployment; expose for client/server auth base URL fallbacks.
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL ?? "",
  },
};

export default nextConfig;
