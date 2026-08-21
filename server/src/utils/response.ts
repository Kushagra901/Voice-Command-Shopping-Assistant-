import type { Response } from "express";
import type { ApiSuccess, ApiError } from "@voice-shopping/shared";

/**
 * Standard API response envelope helpers conforming to AGENTS.md §2.
 */

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const payload: ApiSuccess<T> = {
    success: true,
    data
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, message: string, code = "INTERNAL_ERROR", statusCode = 500): Response {
  const payload: ApiError = {
    success: false,
    error: {
      message,
      code
    }
  };
  return res.status(statusCode).json(payload);
}
