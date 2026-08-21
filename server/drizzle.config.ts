import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "./src/data/schema.ts",
  out: "./drizzle/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env["TURSO_DATABASE_URL"] || "file:local.db",
    authToken: process.env["TURSO_AUTH_TOKEN"] || ""
  }
});
