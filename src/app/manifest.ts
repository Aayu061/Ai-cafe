import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI CAFÉ — Your Drink. Your Way.",
    short_name: "AI CAFÉ",
    description: "Specialty coffee house combining handcrafted drinks with intuitive AI personalization.",
    start_url: "/",
    display: "standalone",
    background_color: "#120905",
    theme_color: "#2A1810",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
