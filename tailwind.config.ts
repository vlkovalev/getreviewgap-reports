import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101014",
        paper: "#f6f2ea",
        lime: "#c7ff3d",
        cyan: "#72e4dd",
        coral: "#ff8ea3",
        violet: "#7667ff"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(16,16,20,.16)"
      }
    }
  },
  plugins: []
}

export default config
