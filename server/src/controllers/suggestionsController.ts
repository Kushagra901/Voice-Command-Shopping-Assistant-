import type { Request, Response } from "express";
import { generateSuggestions } from "../services/recommendationEngine.js";
import { shoppingListService } from "../services/shoppingListService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export async function getSuggestions(_req: Request, res: Response): Promise<Response> {
  try {
    const currentItems = await shoppingListService.getAll();
    const itemNames = currentItems.map(i => i.name);
    const suggestions = await generateSuggestions(itemNames);
    return sendSuccess(res, suggestions);
  } catch (error) {
    logger.error("Failed to generate recommendations", error);
    return sendError(res, "Failed to retrieve smart suggestions", "INTERNAL_ERROR", 500);
  }
}
