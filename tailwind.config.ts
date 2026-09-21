import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7F1E7",
          light: "#FFFDF8",
          dark: "#EFE6D8",
        },
        sage: {
          DEFAULT: "#263A2E",
          soft: "#A8B9A3",
          light: "#Dbe4d8",
          dark: "#1A2820",
        },
        espresso: {
          DEFAULT: "#3A2418",
          light: "#523624",
          dark: "#25160E",
        },
        brown: {
          DEFAULT: "#795548",
          light: "#9A7163",
          dark: "#5A3D33",
        },
        caramel: {
          DEFAULT: "#C98A4A",
          light: "#DE9F5F",
          dark: "#AB6F33",
        },
        warmgray: {
          DEFAULT: "#8C877F",
          light: "#ABA69F",
          dark: "#6D6861",
        },
        offwhite: "#FFFDF8",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(58, 36, 24, 0.06)",
        card: "0 8px 30px -4px rgba(38, 58, 46, 0.08)",
        floating: "0 14px 40px -6px rgba(58, 36, 24, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
