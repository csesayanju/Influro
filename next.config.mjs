/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel sets VERCEL_URL per deployment; expose for client/server auth base URL fallbacks.
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL ?? "",
  },

  async headers() {
    /**
     * Block the vercel.live toolbar script in production.
     *
     * The instrument.js script is injected by Vercel's CDN layer and consumes
     * ~584ms of main thread on load. It cannot be removed via next/script because
     * it runs before Next.js. A Content-Security-Policy header that excludes
     * vercel.live from script-src stops it executing.
     *
     * Scoped to production only (VERCEL_ENV === "production") so the preview
     * toolbar remains available for your team on PR deployments.
     *
     * Also set this in Vercel Dashboard → Settings → Vercel Toolbar → Off (production)
     * for belt-and-suspenders coverage at the CDN level.
     */
    const isProd = process.env.VERCEL_ENV === "production";

    const csp = [
      "default-src 'self'",
      // Allow Next.js inline scripts + eval (required by some RSC internals)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Supabase realtime + auth — no vercel.live
      "connect-src 'self' *.supabase.co wss://*.supabase.co https://api.supabase.com",
      // Tailwind + CSS Modules inline styles
      "style-src 'self' 'unsafe-inline'",
      // Self-hosted fonts only (next/font serves from same origin)
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "frame-src 'none'",
      "object-src 'none'",
    ].join("; ");

    if (!isProd) return [];

    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
