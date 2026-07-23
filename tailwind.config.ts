import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "var(--color-brand-50, #fef2f2)",
          100: "var(--color-brand-100, #fee2e2)",
          400: "var(--color-brand-400, #f87171)",
          500: "var(--color-brand-500, #ef4444)",
          600: "var(--color-brand-600, #dc2626)",
          700: "var(--color-brand-700, #b91c1c)",
          900: "var(--color-brand-900, #7f1d1d)",
        },
        primary: "var(--primary-color, #dc2626)",
        secondary: "var(--secondary-color, #1e293b)",
        accent: "var(--accent-color, #ef4444)",
        surface: "var(--surface-color, #0f172a)",
        bodybg: "var(--bg-color, #090d16)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
