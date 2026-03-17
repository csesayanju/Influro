import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influro",
  description: "Influro — influencer campaign tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
