import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { savePresets } from "./vite/savePresets.ts";

export default defineConfig({
  // savePresets is dev-only (apply: "serve") and adds nothing to a production build.
  plugins: [react(), tailwindcss(), savePresets()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
