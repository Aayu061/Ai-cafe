import { Metadata } from "next";
import { BRAND } from "@/lib/constants";

interface PageSeoProps {
  title: string;
  description?: string;
  path?: string;
}

export function constructMetadata({
  title,
  description = BRAND.supporting,
  path = "",
}: PageSeoProps): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-cafe-zeta.vercel.app";
  const fullTitle = `${title} | ${BRAND.name}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: path ? `${siteUrl}${path}` : siteUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path ? `${siteUrl}${path}` : siteUrl,
      siteName: BRAND.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
