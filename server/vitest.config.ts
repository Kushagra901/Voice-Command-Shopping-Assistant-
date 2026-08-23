import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["src/**/*.{test,spec}.ts"],
    env: {
      NODE_ENV: "test",
      TURSO_DATABASE_URL: "file:test.db",
      TURSO_AUTH_TOKEN: ""
    },
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      "@voice-shopping/shared": path.resolve(__dirname, "../shared/types/index.ts")
    }
  }
});
