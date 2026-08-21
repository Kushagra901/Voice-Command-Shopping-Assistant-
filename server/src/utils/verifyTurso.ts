import { db, rawClient, getDatabaseConnectionStatus } from "../data/db.js";
import { logger } from "./logger.js";

async function verifyTursoConnection(): Promise<void> {
  const status = getDatabaseConnectionStatus();
  logger.info(`Connection Mode: ${status.mode}`);
  logger.info(`Connection Target: ${status.url}`);

  const startTime = Date.now();
  const res = await rawClient.execute("SELECT COUNT(*) as count FROM products;");
  const elapsed = Date.now() - startTime;

  const count = res.rows[0]?.["count"] ?? res.rows[0]?.[0];
  logger.info(`Successfully queried remote Turso DB in ${elapsed}ms. Products count: ${count}`);

  const sample = await rawClient.execute("SELECT name, category, price FROM products LIMIT 3;");
  logger.info(`Sample products from Turso: ${JSON.stringify(sample.rows)}`);
}

verifyTursoConnection()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Turso verification failed", err);
    process.exit(1);
  });
