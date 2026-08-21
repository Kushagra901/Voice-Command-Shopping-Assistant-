import type { Request, Response } from "express";
import { shoppingListService } from "../services/shoppingListService.js";
import { defaultParser } from "../services/parser.js";
import { sendSuccess, sendError } from "../utils/response.js";
import type { CreateItemDto, UpdateItemDto, ParseCommandRequest } from "@voice-shopping/shared";
import { logger } from "../utils/logger.js";

export async function getItems(_req: Request, res: Response): Promise<Response> {
  try {
    const items = await shoppingListService.getAll();
    return sendSuccess(res, items);
  } catch (error) {
    logger.error("Failed to fetch shopping list", error);
    return sendError(res, "Failed to fetch shopping list items", "DATABASE_ERROR", 500);
  }
}

export async function addItem(req: Request, res: Response): Promise<Response> {
  try {
    const dto = req.body as CreateItemDto;
    const item = await shoppingListService.add(dto);
    return sendSuccess(res, item, 201);
  } catch (error) {
    logger.error("Failed to add shopping item", error);
    return sendError(res, "Failed to add item to shopping list", "DATABASE_ERROR", 500);
  }
}

export async function updateItem(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Item ID is required", "INVALID_PARAM", 400);
    }
    const dto = req.body as UpdateItemDto;
    const updated = await shoppingListService.update(id, dto);
    if (!updated) {
      return sendError(res, `Item with ID ${id} not found`, "NOT_FOUND", 404);
    }
    return sendSuccess(res, updated);
  } catch (error) {
    logger.error("Failed to update shopping item", error);
    return sendError(res, "Failed to update item", "DATABASE_ERROR", 500);
  }
}

export async function deleteItem(req: Request, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Item ID is required", "INVALID_PARAM", 400);
    }
    const deleted = await shoppingListService.delete(id);
    if (!deleted) {
      return sendError(res, `Item with ID ${id} not found`, "NOT_FOUND", 404);
    }
    return sendSuccess(res, { id, deleted: true });
  } catch (error) {
    logger.error("Failed to delete shopping item", error);
    return sendError(res, "Failed to delete item", "DATABASE_ERROR", 500);
  }
}

export async function parseAndExecuteCommand(req: Request, res: Response): Promise<Response> {
  try {
    const { text, execute = true } = req.body as ParseCommandRequest;
    const parsedCommand = await defaultParser.parse(text);

    if (!execute) {
      return sendSuccess(res, {
        command: parsedCommand,
        executed: false,
        message: "Command parsed without execution"
      });
    }

    const executionResult = await shoppingListService.executeCommand(parsedCommand);
    return sendSuccess(res, executionResult);
  } catch (error) {
    logger.error("Failed to parse and execute voice command", error);
    return sendError(res, "Failed to process voice command", "INTERNAL_ERROR", 500);
  }
}
