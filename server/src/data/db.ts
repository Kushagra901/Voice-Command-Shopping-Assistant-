import * as dotenv from "dotenv";
import path from "path";

const isTestEnv = process.env["NODE_ENV"] === "test";

if (!isTestEnv) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
  dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
}

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { logger } from "../utils/logger.js";

const dbUrl = process.env["TURSO_DATABASE_URL"]?.trim();
const dbAuthToken = process.env["TURSO_AUTH_TOKEN"]?.trim();

// Determine connection strategy: remote Turso if URL provided and not in test mode, otherwise local SQLite file
const isRemoteTurso = Boolean(!isTestEnv && dbUrl && (dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://")));
const effectiveUrl = isRemoteTurso
  ? dbUrl!
  : (dbUrl || (isTestEnv ? "file:test.db" : "file:local.db"));

export const rawClient = createClient(
  isRemoteTurso && dbAuthToken
    ? { url: effectiveUrl, authToken: dbAuthToken }
    : { url: effectiveUrl }
);

export const db = drizzle(rawClient, { schema });

export function getDatabaseConnectionStatus(): {
  mode: "connected" | "fallback" | "disconnected";
  url: string;
} {
  return {
    mode: isRemoteTurso ? "connected" : "fallback",
    url: isRemoteTurso ? "turso://remote" : (isTestEnv ? "file://test.db" : "file://local.db")
  };
}

let isInitialized = false;

/**
 * Initializes database tables if using local development fallback.
 */
export async function initDb(): Promise<void> {
  if (isInitialized) return;
  try {
    if (!isRemoteTurso) {
      // Configure WAL mode and busy timeout for concurrent safety
      await rawClient.execute("PRAGMA busy_timeout = 5000;");
      try {
        await rawClient.execute("PRAGMA journal_mode = WAL;");
      } catch {
        // In-memory or certain drivers may ignore WAL
      }
    }

    await rawClient.execute(`
      CREATE TABLE IF NOT EXISTS shopping_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT 'item',
        category TEXT NOT NULL DEFAULT 'Other',
        is_purchased INTEGER NOT NULL DEFAULT 0,
        brand TEXT,
        price REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await rawClient.execute(`
      CREATE TABLE IF NOT EXISTS purchase_history (
        id TEXT PRIMARY KEY,
        item_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Other',
        quantity REAL NOT NULL DEFAULT 1,
        unit TEXT NOT NULL DEFAULT 'item',
        price REAL,
        purchased_at TEXT NOT NULL
      );
    `);

    await rawClient.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Other',
        brand TEXT NOT NULL DEFAULT 'Generic',
        price REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'item',
        in_stock INTEGER NOT NULL DEFAULT 1,
        rating REAL,
        image_url TEXT
      );
    `);
    isInitialized = true;
  } catch (error) {
    logger.error("Failed to initialize database schema", error);
  }
}
