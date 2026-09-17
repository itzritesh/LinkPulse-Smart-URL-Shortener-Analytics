/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // primary indigo
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        cyanPulse: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        surface: {
          canvas: "#090d16",
          card: "#0f1422",
          elevated: "#141b2d",
          border: "#1c253b",
          "border-subtle": "#161d30",
          hover: "#182035",
        },
      },
      boxShadow: {
        bevel: "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        "bevel-brand": "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 6px 16px -2px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 16px 28px -4px rgba(0, 0, 0, 0.6)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
