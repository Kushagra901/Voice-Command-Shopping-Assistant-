import type { Request, Response } from "express";
import type { HealthStatus } from "@voice-shopping/shared";
import { sendSuccess } from "../utils/response.js";
import { getDatabaseConnectionStatus } from "../data/db.js";

const startTime = Date.now();

export function getHealth(_req: Request, res: Response): Response {
  const dbStatus = getDatabaseConnectionStatus();

  const healthData: HealthStatus = {
    status: "healthy",
    database: dbStatus.mode,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  };

  return sendSuccess(res, healthData);
}
