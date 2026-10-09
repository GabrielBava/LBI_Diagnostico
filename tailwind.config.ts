import type { Config } from "tailwindcss";

// As cores vêm das variáveis CSS definidas em src/index.css (tema escuro e claro).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: v("background"),
        foreground: v("foreground"),
        card: v("card"),
        "card-foreground": v("foreground"),
        border: v("border"),
        input: v("input"),
        muted: v("muted"),
        "muted-foreground": v("muted-foreground"),
        secondary: v("secondary"),
        primary: v("primary"),
        "primary-foreground": v("primary-foreground"),
        accent: v("accent"),
        success: v("success"),
        warning: v("warning"),
        destructive: v("destructive"),
        popover: v("popover"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
