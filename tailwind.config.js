import { nextui } from "@nextui-org/react";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'border-indigo-400', 'border-emerald-400', 'border-violet-400', 'border-rose-400',
    'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
    'text-indigo-400', 'text-emerald-400', 'text-violet-400', 'text-rose-400'
  ],
  plugins: [nextui()],
}