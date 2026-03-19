import type { Metadata } from "next";

export const siteConfig = {
  name: "Influro",
  description: "Influro influencer campaign tracking",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://influro.vercel.app",
} as const;

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: "%s · Influro",
  },
  description: siteConfig.description,
};
