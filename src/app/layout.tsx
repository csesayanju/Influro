import { defaultMetadata } from "@/config/site";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = defaultMetadata;

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{props.children}</body>
    </html>
  );
}
