import type { Request, Response } from "express";
import { CATEGORY_MAP, type ItemCategory, type CategoryDetail } from "@voice-shopping/shared";
import { shoppingListService } from "../services/shoppingListService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export async function getCategories(_req: Request, res: Response): Promise<Response> {
  try {
    const allItems = await shoppingListService.getAll();
    const countsByCategory: Record<string, number> = {};

    for (const item of allItems) {
      countsByCategory[item.category] = (countsByCategory[item.category] || 0) + 1;
    }

    const categories: CategoryDetail[] = Object.entries(CATEGORY_MAP).map(([cat, keywords]) => {
      const categoryName = cat as ItemCategory;
      return {
        category: categoryName,
        itemCount: countsByCategory[categoryName] || 0,
        keywords
      };
    });

    // Add "Other" category
    categories.push({
      category: "Other",
      itemCount: countsByCategory["Other"] || 0,
      keywords: []
    });

    return sendSuccess(res, categories);
  } catch (error) {
    logger.error("Failed to retrieve categories", error);
    return sendError(res, "Failed to retrieve category metadata", "INTERNAL_ERROR", 500);
  }
}
