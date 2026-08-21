import { Router } from "express";
import {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  parseAndExecuteCommand
} from "../controllers/shoppingListController.js";
import {
  validateBody,
  addItemSchema,
  updateItemSchema,
  parseCommandSchema
} from "../middleware/validation.js";

export const shoppingListRouter = Router();

shoppingListRouter.get("/", getItems);
shoppingListRouter.post("/", validateBody(addItemSchema), addItem);
shoppingListRouter.patch("/:id", validateBody(updateItemSchema), updateItem);
shoppingListRouter.delete("/:id", deleteItem);
shoppingListRouter.post("/parse-command", validateBody(parseCommandSchema), parseAndExecuteCommand);
