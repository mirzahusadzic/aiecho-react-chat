import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/aiecho-react-chat/", // Add this line for GitHub Pages deployment
  server: {
    host: true, // This makes the server accessible externally
  },
  build: {
    sourcemap: true,
  },
});
