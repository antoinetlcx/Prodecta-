import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#18212f",
        ink: "#273244",
        muted: "#6b7484",
        line: "#dbe3ee",
        canvas: "#f7f9fc",
        teal: "#087f7a",
        coral: "#ef6f61",
        gold: "#d99b18",
        navy: "#1f3a5f"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(18, 33, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
