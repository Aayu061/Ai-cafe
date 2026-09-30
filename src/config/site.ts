import { BRAND, NAV_ITEMS } from "@/lib/constants";
import { API_BASE_URL } from "@/lib/api-config";

export const siteConfig = {
  name: BRAND.name,
  tagline: BRAND.tagline,
  supporting: BRAND.supporting,
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ai-cafe-zeta.vercel.app",
  apiUrl: API_BASE_URL,
  navItems: NAV_ITEMS,
  colors: {
    cream: "#F7F1E7",
    deepSage: "#263A2E",
    espresso: "#3A2418",
    naturalBrown: "#795548",
    caramel: "#C98A4A",
    softSage: "#A8B9A3",
    offWhite: "#FFFDF8",
    warmGray: "#8C877F",
  },
  openingSequence: {
    timeoutMs: 5500,
    minTransitionMs: 400,
    storageKey: "ai_cafe_booted",
  },
  social: {
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
  },
};

export default siteConfig;
