import type { Request, Response } from "express";
import { searchProducts, type ProductSearchParams } from "../services/productService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export async function getProducts(req: Request, res: Response): Promise<Response> {
  try {
    const params = req.query as unknown as ProductSearchParams;
    const products = await searchProducts(params);
    return sendSuccess(res, products);
  } catch (error) {
    logger.error("Failed to search products", error);
    return sendError(res, "Failed to search product catalog", "INTERNAL_ERROR", 500);
  }
}
