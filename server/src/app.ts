import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { healthRouter } from "./routes/healthRoutes.js";
import { shoppingListRouter } from "./routes/shoppingListRoutes.js";
import { suggestionsRouter } from "./routes/suggestionsRoutes.js";
import { productsRouter } from "./routes/productsRoutes.js";
import { categoriesRouter } from "./routes/categoriesRoutes.js";
import { sendError } from "./utils/response.js";
import { logger } from "./utils/logger.js";

export function createApp(): express.Express {
  const app = express();

  const allowedOrigin = process.env["CLIENT_ORIGIN"] || "http://localhost:5173";

  // CORS configuration locked to frontend origin per security rules
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === allowedOrigin || origin.startsWith("http://localhost:")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true
    })
  );

  app.use(express.json());

  // Mount API endpoints conforming to specification
  app.use("/api/health", healthRouter);
  app.use("/api/shopping-list", shoppingListRouter);
  app.use("/api/suggestions", suggestionsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);

  // 404 Fallback
  app.use((_req: Request, res: Response) => {
    sendError(res, "Route not found", "NOT_FOUND", 404);
  });

  // Global Error Handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("Unhandled server exception", err);
    sendError(res, "Internal server error", "INTERNAL_ERROR", 500);
  });

  return app;
}
