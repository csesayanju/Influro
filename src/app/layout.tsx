import { Sora } from "next/font/google";
import { defaultMetadata } from "@/config/site";
import type { Metadata } from "next";
import "./globals.css";

/**
 * next/font/google downloads Sora at build time and serves it from the same
 * origin. This eliminates the render-blocking Google Fonts @import that was
 * causing ~780ms of LCP render delay:
 *   Before: CSS parse → external DNS → fonts.googleapis.com → fonts.gstatic.com
 *   After:  self-hosted font, preloaded via <link rel="preload">, font-display:swap
 */
const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sora",
  preload: true,
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="antialiased">{props.children}</body>
    </html>
  );
}
