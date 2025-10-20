import { nextui } from "@nextui-org/react";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--nextui-background))",
        foreground: "hsl(var(--nextui-foreground))",
        primary: "hsl(var(--nextui-primary))",
        secondary: "hsl(var(--nextui-secondary))",
        // optional weitere Tokens
      },
    },
  },
  safelist: [
    {
      pattern: /(border|shadow|bg|text)-(indigo|emerald|violet|rose)-(400|500|600)/,
    },
  ],
  plugins: [nextui()],
}