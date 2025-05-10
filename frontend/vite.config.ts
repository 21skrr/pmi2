// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Set frontend to use port 5173
    open: true, // Optional: automatically open browser
  },
});
