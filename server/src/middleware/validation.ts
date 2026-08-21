import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { sendError } from "../utils/response.js";

const CATEGORIES = [
  "Dairy",
  "Produce",
  "Bakery",
  "Beverages",
  "Snacks",
  "Household",
  "Personal Care",
  "Other"
] as const;

export const addItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(100, "Item name is too long"),
  quantity: z.number().positive("Quantity must be greater than zero").optional().default(1),
  unit: z.string().trim().max(30).optional().default("item"),
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().trim().max(50).optional(),
  price: z.number().nonnegative().optional()
});

export const updateItemSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  quantity: z.number().positive("Quantity must be greater than zero").optional(),
  unit: z.string().trim().max(30).optional(),
  category: z.enum(CATEGORIES).optional(),
  isPurchased: z.boolean().optional(),
  brand: z.string().trim().max(50).optional(),
  price: z.number().nonnegative().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export const parseCommandSchema = z.object({
  text: z.string().trim().min(1, "Command text is required").max(500, "Command text is too long"),
  execute: z.boolean().optional().default(true)
});

export const searchProductSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  brand: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

/**
 * Express middleware factory to validate request body with a Zod schema.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = (result.error as ZodError).errors
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      sendError(res, errorMsg, "VALIDATION_ERROR", 400);
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Express middleware factory to validate query parameters with a Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errorMsg = (result.error as ZodError).errors
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      sendError(res, errorMsg, "VALIDATION_ERROR", 400);
      return;
    }
    // Type-safe assignment
    req.query = result.data as Record<string, string>;
    next();
  };
}
