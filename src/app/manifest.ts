import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI CAFÉ — Your Drink. Your Way.",
    short_name: "AI CAFÉ",
    description: "Specialty coffee house combining handcrafted drinks with intuitive AI personalization. Crafted by AI. Inspired by You.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F1E7",
    theme_color: "#3A2418",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
