import { Router } from "express";
import { getSuggestions } from "../controllers/suggestionsController.js";

export const suggestionsRouter = Router();

suggestionsRouter.get("/", getSuggestions);
