import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bdd3ff",
          300: "#90b6ff",
          400: "#5c8dff",
          500: "#3b66fb",
          600: "#2546f0",
          700: "#1d34dc",
          800: "#1e2db2",
          900: "#1e2c8c",
          950: "#171d55",
        },
      },
      screens: {
        "3xl": "1920px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
