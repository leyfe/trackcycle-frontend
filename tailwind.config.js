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
      pattern:
        /(bg|text|border|ring|shadow|fill|hover:bg|hover:text|hover:border|focus:bg|focus:text|focus:border)-(rose|orange|yellow|lime|emerald|sky|indigo|purple|fuchsia|slate)-(400|500|600|700)/,
    },
    // optional: Light + Dark Ringe separat
    {
      pattern:
        /(ring-offset|ring)-(rose|orange|yellow|lime|emerald|sky|indigo|purple|fuchsia|slate)-(300|400|500)/,
    },
    // generate the selected-state variant
    {
      pattern:
        /(bg|text|border|ring)-(rose|orange|yellow|lime|emerald|sky|indigo|purple|fuchsia|slate)-(400|500|600)/,
      variants: ["group-data-[selected=true]"],
    },
    // generate the selected+hover chain
    {
      pattern:
        /(bg|text|border|ring)-(rose|orange|yellow|lime|emerald|sky|indigo|purple|fuchsia|slate)-(400|500|600)/,
      variants: ["group-data-[selected=true]:hover"],
    },
  ],
  plugins: [nextui()],
}