import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/novi/",
  server: {
    proxy: {
      "/api": {
        target: "http://172.16.6.118:5100", // backendin juuri
        changeOrigin: true,
      },
    },
  },
});
