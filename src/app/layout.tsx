import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/auth-context";
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

export const metadata: Metadata = {
  title: "AI CAFÉ — Your Drink. Your Way.",
  description: "AI-powered personalized café experience. Crafted by AI. Inspired by You.",
  keywords: ["AI Cafe", "Specialty Coffee", "Personalized Drink", "Cold Brew", "Smart Barista"],
  authors: [{ name: "AI Café Team" }],
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
      <body className="font-sans bg-cream text-espresso antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
