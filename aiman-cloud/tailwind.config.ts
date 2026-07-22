import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aiman Cloud palette — "midnight glass"
        midnight: {
          950: "#070911",
          900: "#0B0F19",
          800: "#121728",
          700: "#1A2036",
          600: "#242C48",
        },
        cloudlight: {
          50: "#F7F8FA",
          100: "#EEF0F4",
          200: "#E2E5EC",
        },
        amber: {
          400: "#F7B84B",
          500: "#F5A623",
          600: "#DB8B0C",
        },
        teal: {
          300: "#5FE3D6",
          400: "#34D3C9",
          500: "#20B5AC",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(6, 10, 20, 0.35)",
        "glass-sm": "0 4px 16px rgba(6, 10, 20, 0.25)",
        glow: "0 0 0 1px rgba(245, 166, 35, 0.15), 0 8px 24px rgba(245, 166, 35, 0.12)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "logo-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(245,166,35,0.25))" },
          "50%": { filter: "drop-shadow(0 0 14px rgba(52,211,201,0.35))" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
        "logo-glow": "logo-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
