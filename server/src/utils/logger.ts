/**
 * Production-safe logger conforming to AGENTS.md §2.
 * Only logs actual errors to prevent cluttering production stdout.
 */

type LogLevel = "error" | "warn" | "info";

export const logger = {
  error: (message: string, error?: unknown): void => {
    const errorDetails = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
    process.stderr.write(
      JSON.stringify({
        level: "error" as LogLevel,
        timestamp: new Date().toISOString(),
        message,
        error: errorDetails
      }) + "\n"
    );
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    if (process.env["NODE_ENV"] !== "production") {
      process.stdout.write(
        JSON.stringify({
          level: "warn" as LogLevel,
          timestamp: new Date().toISOString(),
          message,
          ...meta
        }) + "\n"
      );
    }
  },

  info: (message: string, meta?: Record<string, unknown>): void => {
    if (process.env["NODE_ENV"] !== "production") {
      process.stdout.write(
        JSON.stringify({
          level: "info" as LogLevel,
          timestamp: new Date().toISOString(),
          message,
          ...meta
        }) + "\n"
      );
    }
  }
};
