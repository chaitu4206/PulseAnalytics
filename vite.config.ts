
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "charts",
              test: /node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    clearMocks: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
