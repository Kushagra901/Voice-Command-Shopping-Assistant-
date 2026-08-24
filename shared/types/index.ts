/**
 * Shared domain contracts, API envelopes, and categorization engines.
 * As mandated in AGENTS.md §4 & §5, these contracts are defined once here
 * and imported by both client and server.
 */

export * from "./hindiAliases.js";
export * from "./categoryClassifier.js";

// Consistent API envelope (AGENTS.md §2)
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Voice command parsing contract (AGENTS.md §5)
export type Intent =
  | "ADD_ITEM"
  | "REMOVE_ITEM"
  | "UPDATE_ITEM"
  | "MARK_PURCHASED"
  | "SEARCH_PRODUCT"
  | "GET_SUGGESTIONS"
  | "UNDO"
  | "UNKNOWN";

export type ParsedCommand = {
  intent: Intent;
  itemName?: string;
  quantity?: number;
  unit?: string;
  brand?: string;
  maxPrice?: number;
  rawText: string;
  confidence: number;
};

// Shopping categories (AGENTS.md §5)
export type ItemCategory =
  | "Dairy"
  | "Produce"
  | "Bakery"
  | "Beverages"
  | "Snacks"
  | "Household"
  | "Personal Care"
  | "Other";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ItemCategory;
  isPurchased: boolean;
  brand?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemDto {
  name: string;
  quantity?: number;
  unit?: string;
  category?: ItemCategory;
  brand?: string;
  price?: number;
}

export interface UpdateItemDto {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: ItemCategory;
  isPurchased?: boolean;
  brand?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  category: ItemCategory;
  brand: string;
  price: number;
  unit: string;
  inStock: boolean;
  rating?: number;
  imageUrl?: string;
}

export interface PurchaseHistoryItem {
  id: string;
  itemName: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  purchasedAt: string;
  price?: number;
}

export type SuggestionReason = "frequency" | "recency" | "seasonal" | "substitute";

export interface SuggestionItem {
  id: string;
  name: string;
  category: ItemCategory;
  reason: SuggestionReason;
  description: string;
  originalItem?: string; // If substitute
  estimatedPrice?: number;
  confidence: number;
}

export interface ParseCommandRequest {
  text: string;
  execute?: boolean;
}

export interface ParseCommandResponse {
  command: ParsedCommand;
  executed: boolean;
  message?: string;
  item?: ShoppingItem;
  items?: ShoppingItem[];
}

export interface CategoryDetail {
  category: ItemCategory;
  itemCount: number;
  keywords: readonly string[];
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  database: "connected" | "fallback" | "disconnected" | "local-storage";
  timestamp: string;
  uptimeSeconds: number;
}

export interface CommandLogEntry {
  id: string;
  timestamp: string;
  rawText: string;
  parsedCommand: ParsedCommand;
  status: "executed" | "rejected" | "clarification_needed";
}
