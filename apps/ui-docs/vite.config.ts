import { execSync } from "node:child_process";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Last date the UI library or its docs changed, read from git
 */
function lastUpdatedDate(): string {
  try {
    return execSync("git log -1 --format=%cs -- packages/ui apps/ui-docs", {
      cwd: "../..",
      encoding: "utf8",
    }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __LAST_UPDATED__: JSON.stringify(lastUpdatedDate()),
  },
  server: {
    port: 5175,
    strictPort: true,
  },
});
