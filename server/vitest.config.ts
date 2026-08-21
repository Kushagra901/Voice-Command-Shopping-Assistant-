import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["src/**/*.{test,spec}.ts"]
  },
  resolve: {
    alias: {
      "@voice-shopping/shared": path.resolve(__dirname, "../shared/types/index.ts")
    }
  }
});
