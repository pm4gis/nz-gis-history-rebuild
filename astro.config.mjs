import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://nzgis-history-stage.pages.dev",
  build: { format: "directory" },
});
