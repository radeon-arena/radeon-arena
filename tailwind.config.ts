import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AMD Radeon brand palette
        radeon: {
          DEFAULT: "#ED1C24",
          50: "#FEE7E8",
          100: "#FDC9CB",
          200: "#FA969A",
          300: "#F66369",
          400: "#F33038",
          500: "#ED1C24",
          600: "#C30E15",
          700: "#920A10",
          800: "#62070B",
          900: "#310306",
        },
        ink: {
          950: "#0A0A0B",
          900: "#101012",
          850: "#16161A",
          800: "#1C1C21",
          700: "#26262D",
          600: "#34343D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
