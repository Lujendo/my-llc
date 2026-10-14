import type { Config } from "tailwindcss";

// shadcn-style tokens. Values are HSL triplets defined in src/react-app/index.css
// under `@layer base` (:root / .dark). `hsl(var(--x))` alone can't take an
// opacity modifier, so we use `hsl(var(--x) / <alpha-value>)` to support `bg-card/50`.
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Preserved existing semantic colors.
        success: "rgb(34 197 94)", // green-500
        warning: "rgb(234 179 8)", // yellow-500
        danger: "rgb(239 68 68)", // red-500
        // Design-system tokens (Phase 0).
        background: token("background"),
        foreground: token("foreground"),
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
  darkMode: "class",
} satisfies Config;
