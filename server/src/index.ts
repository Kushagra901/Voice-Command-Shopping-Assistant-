import * as dotenv from "dotenv";
dotenv.config();

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
