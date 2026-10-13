import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: "rgb(34 197 94)", // green-500
        warning: "rgb(234 179 8)", // yellow-500
        danger: "rgb(239 68 68)", // red-500
      },
    },
  },
  plugins: [],
  darkMode: "class",
} satisfies Config;
