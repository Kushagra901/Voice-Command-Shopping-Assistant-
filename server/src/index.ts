import * as dotenv from "dotenv";
import path from "path";
// Resolve .env from workspace root (one level up from server/)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// Also try parent directory in case CWD is server/
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import { createApp } from "./app.js";
import { initDb } from "./data/db.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env["PORT"]) || 3001;

async function bootstrap(): Promise<void> {
  await initDb();

  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`Voice Shopping Server listening on port ${PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  logger.error("Fatal error during server bootstrap", err);
  process.exit(1);
});
