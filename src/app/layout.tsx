import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { CartProvider } from "@/features/cart/cart-context";
import { BrandOpeningScreen } from "@/components/loading/brand-opening-screen";
import { CookieNotice } from "@/components/layout/cookie-notice";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-cafe-zeta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI CAFÉ — Your Drink. Your Way.",
    template: "%s | AI CAFÉ",
  },
  description: "Specialty coffee house combining handcrafted drinks with intuitive AI personalization. Crafted by AI. Inspired by You.",
  keywords: [
    "AI Cafe",
    "Specialty Coffee",
    "Personalized Drink",
    "Cold Brew",
    "Smart Barista",
    "Coffee Concierge",
    "Drink Builder",
  ],
  authors: [{ name: "AI Café Artisan Team" }],
  creator: "AI Café",
  publisher: "AI Café",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AI CAFÉ",
    title: "AI CAFÉ — Your Drink. Your Way.",
    description: "Specialty coffee house combining handcrafted drinks with intuitive AI personalization. Crafted by AI. Inspired by You.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI CAFÉ — Your Drink. Your Way.",
    description: "Specialty coffee house combining handcrafted drinks with intuitive AI personalization. Crafted by AI. Inspired by You.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link
          rel="preload"
          href="/asset/caramel-cold-brew/frame-0001.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="font-sans bg-cream text-espresso antialiased selection:bg-caramel/30 selection:text-espresso">
        {/* Accessible Skip-to-content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-caramel focus:text-espresso focus:rounded-lg focus:font-semibold focus:shadow-floating transition-all"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <CartProvider>
            <BrandOpeningScreen />
            <div id="main-content">{children}</div>
            <CookieNotice />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
