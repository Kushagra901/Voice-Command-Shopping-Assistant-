import { Router } from "express";
import { getProducts } from "../controllers/productsController.js";
import { validateQuery, searchProductSchema } from "../middleware/validation.js";

export const productsRouter = Router();

productsRouter.get("/search", validateQuery(searchProductSchema), getProducts);
