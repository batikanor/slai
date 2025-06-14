import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: ["plotly.js-dist"],
  },
  resolve: {
    alias: {
      "plotly.js/dist/plotly": "plotly.js",
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
