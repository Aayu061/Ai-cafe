import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-cafe-zeta.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/barista",
          "/builder",
          "/privacy",
          "/terms",
          "/contact",
          "/login",
          "/signup",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/staff",
          "/staff/*",
          "/super-admin",
          "/super-admin/*",
          "/profile",
          "/api/*",
          "/*-login",
          "/*-forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
