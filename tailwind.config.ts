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
          // Light theme: surfaces & borders (was a dark ramp)
          950: "#F4F5F7", // page background
          900: "#FFFFFF", // cards
          850: "#F8F9FB", // raised blocks
          800: "#EAECF0", // hover / faint divide
          700: "#DEE1E6", // borders
          600: "#CBCFD6", // strong borders / scrollbar
        },
        // Light theme: text ramp = mirror of Tailwind's default zinc
        zinc: {
          50: "#09090B",
          100: "#18181B",
          200: "#27272A",
          300: "#3F3F46",
          400: "#52525B",
          500: "#71717A",
          600: "#A1A1AA",
          700: "#D4D4D8",
          800: "#E4E4E7",
          900: "#F4F4F5",
          950: "#FAFAFA",
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
