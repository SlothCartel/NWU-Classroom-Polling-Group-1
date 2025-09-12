// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "nwu-primary": "#4B2E83",
        "nwu-accent": "#F59E0B",
      },
      container: { center: true, padding: "1rem" },
    },
  },
  plugins: [],
}
