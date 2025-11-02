import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        calculator: {
          bg: "hsl(var(--calculator-bg))",
          display: "hsl(var(--calculator-display))",
          button: "hsl(var(--calculator-button))",
          "button-hover": "hsl(var(--calculator-button-hover))",
          operator: "hsl(var(--calculator-operator))",
          "operator-hover": "hsl(var(--calculator-operator-hover))",
          special: "hsl(var(--calculator-special))",
          "special-hover": "hsl(var(--calculator-special-hover))",
          text: "hsl(var(--calculator-text))",
          disabled: "hsl(var(--calculator-disabled))",
        },
        admin: {
          bg: "hsl(var(--admin-bg))",
          card: "hsl(var(--admin-card))",
          border: "hsl(var(--admin-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
          },
          "50%": {
            transform: "translateY(-20px) translateX(20px)",
          },
        },
        "float-gentle": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsl(30 100% 60% / 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px hsl(30 100% 60% / 0.6)",
          },
        },
        "slide-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-10px)" },
          "75%": { transform: "translateX(10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 20s ease-in-out infinite",
        "float-gentle": "float-gentle 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "shake": "shake 0.5s ease-in-out",
      },
      boxShadow: {
        "glow": "0 0 20px hsl(30 100% 60% / 0.4)",
        "glow-lg": "0 0 40px hsl(30 100% 60% / 0.6)",
        "lift": "0 8px 24px rgba(255, 140, 0, 0.4)",
        "press": "0 2px 8px rgba(255, 140, 0, 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
