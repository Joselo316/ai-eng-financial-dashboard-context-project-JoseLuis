import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Performance optimization: Strategic code splitting
          // Keep main bundle focused on above-the-fold content (KPIs)
          // Split heavy charting libraries into separate chunks

          // Split recharts (charting library, used in lazy-loaded components)
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }

          // Split lucide-react (icons) for better tree-shaking
          if (id.includes("node_modules/lucide-react")) {
            return "lucide-react";
          }

          // Split Radix UI components
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }

          // Keep vendor code separate from app code
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
    // Performance target: Keep initial JS bundle under 200KB gzipped
    chunkSizeWarningLimit: 500,
  },
});
