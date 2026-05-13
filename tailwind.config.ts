import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        onyx: "#0A0A0A",
        parchment: "#F5F0EC",
        gold: "#C69B3C",
        goldMuted: "#A8842F",
      },
      fontFamily: {
        display: ["var(--font-garamond)", "Garamond", "Cormorant Garamond", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        regal: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
