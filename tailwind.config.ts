import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2328",
        paper: "#faf9f6",
        line: "#e5e1d8",
        coral: "#e85d4f",
        mint: "#1c8f73"
      },
      boxShadow: {
        soft: "0 10px 25px rgba(31, 35, 40, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
