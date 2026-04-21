/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FAFAFA",
          card: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          secondary: "#71717A",
          muted: "#52525B",
        },
        border: {
          DEFAULT: "#E4E4E7",
          strong: "#0A0A0A",
        },
        live: {
          DEFAULT: "#EF4444",
        },
      },
      fontFamily: {
        heading: ["DM Sans", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
