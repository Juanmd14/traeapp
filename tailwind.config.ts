import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-jakarta)", "var(--font-geist-sans)", "sans-serif"],
      },
      colors: {
        // === MARCA ===
        primary: {
          50: "#FFF1F0",
          100: "#FFE0DC",
          200: "#FFC2BB",
          300: "#FF9B8F",
          400: "#FF7565",
          500: "#FF4D29", // brand — coral oficial
          600: "#C8351A", // CTA default — coral-dark oficial
          700: "#A82A14",
          800: "#852010",
          900: "#5F170C",
          DEFAULT: "#C8351A",
          foreground: "#FFFFFF",
        },
        accent: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FFB627", // yellow oficial
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          DEFAULT: "#FFB627",
        },
        // === NEUTROS CÁLIDOS (stone) ===
        neutral: {
          0: "#FFFFFF",
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // === SHADCN tokens (mapeados a nuestro sistema) ===
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "#16A34A",
        info: "#2563EB",
        // === Brand tokens semánticos (paleta oficial) ===
        "brand-carbon": "#1A1614",
        "brand-cream": "#FAF7F5",
      },
      fontSize: {
        // [size, lineHeight]
        "display-xl": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["1.875rem", { lineHeight: "2.375rem", letterSpacing: "-0.015em", fontWeight: "700" }],
        "heading-xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-lg": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "heading-md": ["1.125rem", { lineHeight: "1.625rem", fontWeight: "600" }],
        "heading-sm": ["1rem", { lineHeight: "1.5rem", fontWeight: "500" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem" }],
        "body-md": ["0.875rem", { lineHeight: "1.25rem" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.125rem" }],
        "body-xs": ["0.75rem", { lineHeight: "1rem" }],
        "label": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
      },
      borderRadius: {
        sm: "0.375rem",   // 6
        md: "0.625rem",   // 10
        lg: "0.875rem",   // 14
        xl: "1.25rem",    // 20
        "2xl": "1.75rem", // 28
      },
      boxShadow: {
        card: "0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.04)",
        elevated: "0 4px 16px rgba(28,25,23,0.08), 0 16px 32px rgba(28,25,23,0.06)",
        primary: "0 8px 24px rgba(255,77,58,0.25)",
        "primary-sm": "0 2px 8px rgba(255,77,58,0.20)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
