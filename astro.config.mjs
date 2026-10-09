import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://gishistory.pm4gis.nz",
  build: { format: "directory" },
});
