import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 16px 60px rgba(36, 48, 43, 0.08)",
      },
      colors: {
        ink: "#26312d",
        moss: "#6f7f68",
        blush: "#d78f8f",
        gold: "#bd8b32",
        porcelain: "#f8f7f3",
      },
    },
  },
  plugins: [],
};

export default config;
