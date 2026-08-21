import { eq } from "drizzle-orm";
import type {
  ShoppingItem,
  CreateItemDto,
  UpdateItemDto,
  ItemCategory,
  ParsedCommand,
  ParseCommandResponse
} from "@voice-shopping/shared";
import { classifyCategory, normalizeHinglish } from "@voice-shopping/shared";
import { db, rawClient } from "../data/db.js";
import { shoppingItems, type ShoppingItemRow } from "../data/schema.js";
import { generateSuggestions } from "./recommendationEngine.js";
import { searchProducts } from "./productService.js";
import { logger } from "../utils/logger.js";

function rowToShoppingItem(row: ShoppingItemRow): ShoppingItem {
  const item: ShoppingItem = {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    category: (row.category as ItemCategory) || "Other",
    isPurchased: Boolean(row.isPurchased),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
  if (row.brand) item.brand = row.brand;
  if (row.price !== null && row.price !== undefined) item.price = row.price;
  return item;
}

export class ShoppingListService {
  /**
   * Retrieves all current shopping items, sorted by category and creation time.
   * Explicitly handles empty state.
   */
  async getAll(): Promise<ShoppingItem[]> {
    try {
      const rows = await db
        .select()
        .from(shoppingItems)
        .orderBy(shoppingItems.category, shoppingItems.createdAt);

      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map(rowToShoppingItem);
    } catch (error) {
      logger.error("Error fetching shopping items", error);
      return [];
    }
  }

  /**
   * Adds an item to the shopping list.
   * Merges duplicate items by quantity instead of creating a second row.
   */
  async add(dto: CreateItemDto): Promise<ShoppingItem> {
    const rawName = dto.name.trim();
    const normalizedName = normalizeHinglish(rawName);
    const quantityToAdd = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;
    const unit = dto.unit?.trim().toLowerCase() || "item";
    const category = dto.category || classifyCategory(normalizedName);
    const now = new Date().toISOString();

    // Check for existing duplicate item (case-insensitive name & matching unit)
    const existing = await this.findMatchingItem(normalizedName);

    if (existing && existing.unit.toLowerCase() === unit.toLowerCase()) {
      // Merge duplicate item by incrementing quantity
      const newQuantity = Math.round((existing.quantity + quantityToAdd) * 100) / 100;
      await db
        .update(shoppingItems)
        .set({
          quantity: newQuantity,
          updatedAt: now,
          ...(dto.brand ? { brand: dto.brand } : {}),
          ...(dto.price !== undefined ? { price: dto.price } : {})
        })
        .where(eq(shoppingItems.id, existing.id));

      const updated = await this.getById(existing.id);
      return updated || {
        ...existing,
        quantity: newQuantity,
        updatedAt: now
      };
    }

    // Insert new unique row
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRow = {
      id,
      name: rawName,
      quantity: quantityToAdd,
      unit,
      category,
      isPurchased: false,
      brand: dto.brand || null,
      price: dto.price !== undefined ? dto.price : null,
      createdAt: now,
      updatedAt: now
    };

    await db.insert(shoppingItems).values(newRow);

    return {
      id,
      name: rawName,
      quantity: quantityToAdd,
      unit,
      category,
      isPurchased: false,
      ...(dto.brand ? { brand: dto.brand } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Retrieves single item by ID.
   */
  async getById(id: string): Promise<ShoppingItem | null> {
    const rows = await db.select().from(shoppingItems).where(eq(shoppingItems.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return rowToShoppingItem(row);
  }

  /**
   * Updates an item's fields.
   */
  async update(id: string, dto: UpdateItemDto): Promise<ShoppingItem | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: Partial<typeof shoppingItems.$inferInsert> = {
      updatedAt: now
    };

    if (dto.name !== undefined) {
      updates.name = dto.name.trim();
      if (!dto.category) {
        updates.category = classifyCategory(dto.name);
      }
    }
    if (dto.quantity !== undefined) updates.quantity = dto.quantity;
    if (dto.unit !== undefined) updates.unit = dto.unit.trim().toLowerCase();
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.isPurchased !== undefined) updates.isPurchased = dto.isPurchased;
    if (dto.brand !== undefined) updates.brand = dto.brand;
    if (dto.price !== undefined) updates.price = dto.price;

    await db.update(shoppingItems).set(updates).where(eq(shoppingItems.id, id));

    return this.getById(id);
  }

  /**
   * Deletes an item by ID.
   */
  async delete(id: string): Promise<boolean> {
    const result = await rawClient.execute({
      sql: "DELETE FROM shopping_items WHERE id = ?;",
      args: [id]
    });
    return result.rowsAffected > 0;
  }

  /**
   * Finds an item in the list matching a spoken name (handles fuzzy/substring and Hinglish).
   */
  async findMatchingItem(spokenName: string): Promise<ShoppingItem | null> {
    if (!spokenName || !spokenName.trim()) return null;

    const normalizedSpoken = normalizeHinglish(spokenName.toLowerCase().trim());
    const allItems = await this.getAll();

    // 1. Exact match (case-insensitive)
    for (const item of allItems) {
      const normalizedItem = normalizeHinglish(item.name.toLowerCase().trim());
      if (normalizedItem === normalizedSpoken || item.name.toLowerCase() === spokenName.toLowerCase()) {
        return item;
      }
    }

    // 2. Substring match
    for (const item of allItems) {
      const normalizedItem = normalizeHinglish(item.name.toLowerCase().trim());
      if (normalizedItem.includes(normalizedSpoken) || normalizedSpoken.includes(normalizedItem)) {
        return item;
      }
    }

    return null;
  }

  /**
   * Executes a parsed voice command against the database.
   */
  async executeCommand(command: ParsedCommand): Promise<ParseCommandResponse> {
    switch (command.intent) {
      case "ADD_ITEM": {
        if (!command.itemName) {
          return { command, executed: false, message: "What item would you like to add?" };
        }
        const item = await this.add({
          name: command.itemName,
          quantity: command.quantity ?? 1,
          unit: command.unit ?? "item",
          ...(command.brand ? { brand: command.brand } : {})
        });
        return {
          command,
          executed: true,
          message: `Added ${item.quantity} ${item.unit} ${item.name} to your list.`,
          item
        };
      }

      case "REMOVE_ITEM": {
        if (!command.itemName) {
          return { command, executed: false, message: "Which item would you like to remove?" };
        }
        const match = await this.findMatchingItem(command.itemName);
        if (!match) {
          return { command, executed: false, message: `Could not find "${command.itemName}" on your list.` };
        }
        await this.delete(match.id);
        return {
          command,
          executed: true,
          message: `Removed ${match.name} from your list.`,
          item: match
        };
      }

      case "UPDATE_ITEM": {
        if (!command.itemName) {
          return { command, executed: false, message: "Which item would you like to update?" };
        }
        const match = await this.findMatchingItem(command.itemName);
        if (!match) {
          return { command, executed: false, message: `Could not find "${command.itemName}" on your list.` };
        }
        const updated = await this.update(match.id, {
          quantity: command.quantity ?? match.quantity,
          ...(command.unit ? { unit: command.unit } : {})
        });
        return {
          command,
          executed: true,
          message: `Updated ${match.name} quantity to ${updated?.quantity ?? command.quantity}.`,
          item: updated || match
        };
      }

      case "MARK_PURCHASED": {
        if (!command.itemName) {
          return { command, executed: false, message: "Which item would you like to mark as purchased?" };
        }
        const match = await this.findMatchingItem(command.itemName);
        if (!match) {
          return { command, executed: false, message: `Could not find "${command.itemName}" on your list.` };
        }
        const updated = await this.update(match.id, { isPurchased: true });
        return {
          command,
          executed: true,
          message: `Marked ${match.name} as purchased.`,
          item: updated || match
        };
      }

      case "SEARCH_PRODUCT": {
        const searchParams: { q?: string; brand?: string; maxPrice?: number } = {};
        if (command.itemName) searchParams.q = command.itemName;
        if (command.brand) searchParams.brand = command.brand;
        if (command.maxPrice !== undefined) searchParams.maxPrice = command.maxPrice;

        const results = await searchProducts(searchParams);
        return {
          command,
          executed: true,
          message: `Found ${results.length} matching products.`,
          items: []
        };
      }

      case "GET_SUGGESTIONS": {
        const currentItems = (await this.getAll()).map(i => i.name);
        const suggestions = await generateSuggestions(currentItems);
        return {
          command,
          executed: true,
          message: `Generated ${suggestions.length} personalized recommendations.`
        };
      }

      case "UNKNOWN":
      default:
        return {
          command,
          executed: false,
          message: "Sorry, I didn't catch that shopping command. Try saying 'Add milk' or 'Buy 2 bottles of water'."
        };
    }
  }
}

export const shoppingListService = new ShoppingListService();
