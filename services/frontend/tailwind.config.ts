import type { Config } from "tailwindcss";

// Single source of design tokens. Components must use these names only (no raw hex, no arbitrary colours).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",    // page background
        surface: "#FFFFFF",  // cards, inputs
        sand: "#EFE9E0",     // image tiles, skeletons, subtle fills
        line: "#E4DDD1",     // borders
        ink: { DEFAULT: "#1B1A17", soft: "#4A463F", muted: "#6B665D" },
        accent: { DEFAULT: "#B4491F", dark: "#8F3715", soft: "#F6E4DA" }, // the one accent: clay
        success: "#2F6B4F",
        warn: "#8A5A00",
        danger: "#B3261E",
      },
      borderRadius: { control: "0.625rem", card: "1rem", pill: "9999px" },
      boxShadow: {
        card: "0 1px 2px rgba(27,26,23,.05), 0 4px 16px rgba(27,26,23,.06)",
        pop: "0 12px 40px rgba(27,26,23,.18)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-text)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
