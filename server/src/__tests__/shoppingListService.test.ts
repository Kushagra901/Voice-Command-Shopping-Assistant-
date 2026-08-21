import { describe, it, expect, beforeEach } from "vitest";
import { shoppingListService } from "../services/shoppingListService.js";
import { rawClient, initDb } from "../data/db.js";
import type { ParsedCommand } from "@voice-shopping/shared";

describe("Shopping List Service & Duplicate Merging (AGENTS.md §8)", () => {
  beforeEach(async () => {
    await initDb();
    await rawClient.execute("DELETE FROM shopping_items;");
  });

  it("should add a new item and auto-detect category", async () => {
    const item = await shoppingListService.add({
      name: "Fresh Milk",
      quantity: 1,
      unit: "bottle"
    });

    expect(item.id).toBeDefined();
    expect(item.name).toBe("Fresh Milk");
    expect(item.category).toBe("Dairy");
    expect(item.quantity).toBe(1);
    expect(item.isPurchased).toBe(false);
  });

  it("should merge duplicate items by quantity instead of creating a second row", async () => {
    // 1. Add 1 bottle of milk
    const item1 = await shoppingListService.add({
      name: "Milk",
      quantity: 1,
      unit: "bottle"
    });

    // 2. Add 2 bottles of milk
    const item2 = await shoppingListService.add({
      name: "Milk",
      quantity: 2,
      unit: "bottle"
    });

    const allItems = await shoppingListService.getAll();

    // Verify only 1 row exists with merged quantity 3
    expect(allItems.length).toBe(1);
    expect(allItems[0]?.id).toBe(item1.id);
    expect(allItems[0]?.quantity).toBe(3);
    expect(item2.quantity).toBe(3);
  });

  it("should update item fields", async () => {
    const item = await shoppingListService.add({
      name: "Apples",
      quantity: 4,
      unit: "item"
    });

    const updated = await shoppingListService.update(item.id, {
      quantity: 6,
      isPurchased: true
    });

    expect(updated?.quantity).toBe(6);
    expect(updated?.isPurchased).toBe(true);
  });

  it("should delete item by id", async () => {
    const item = await shoppingListService.add({
      name: "Bread",
      quantity: 1,
      unit: "loaf"
    });

    const deleted = await shoppingListService.delete(item.id);
    expect(deleted).toBe(true);

    const allItems = await shoppingListService.getAll();
    expect(allItems.length).toBe(0);
  });

  it("should execute parsed voice commands directly", async () => {
    // 1. Execute ADD_ITEM command
    const addCmd: ParsedCommand = {
      intent: "ADD_ITEM",
      itemName: "doodh",
      quantity: 2,
      unit: "bottle",
      rawText: "2 bottle doodh add karo",
      confidence: 0.95
    };
    const addRes = await shoppingListService.executeCommand(addCmd);
    expect(addRes.executed).toBe(true);
    expect(addRes.item?.name).toBe("doodh");
    expect(addRes.item?.category).toBe("Dairy");

    // 2. Execute UPDATE_ITEM command
    const updateCmd: ParsedCommand = {
      intent: "UPDATE_ITEM",
      itemName: "doodh",
      quantity: 5,
      rawText: "Change doodh quantity to 5",
      confidence: 0.95
    };
    const updateRes = await shoppingListService.executeCommand(updateCmd);
    expect(updateRes.executed).toBe(true);
    expect(updateRes.item?.quantity).toBe(5);

    // 3. Execute MARK_PURCHASED command
    const markCmd: ParsedCommand = {
      intent: "MARK_PURCHASED",
      itemName: "doodh",
      rawText: "doodh khareed liya",
      confidence: 0.95
    };
    const markRes = await shoppingListService.executeCommand(markCmd);
    expect(markRes.executed).toBe(true);
    expect(markRes.item?.isPurchased).toBe(true);

    // 4. Execute REMOVE_ITEM command
    const removeCmd: ParsedCommand = {
      intent: "REMOVE_ITEM",
      itemName: "doodh",
      rawText: "doodh remove karo",
      confidence: 0.95
    };
    const removeRes = await shoppingListService.executeCommand(removeCmd);
    expect(removeRes.executed).toBe(true);

    const finalItems = await shoppingListService.getAll();
    expect(finalItems.length).toBe(0);
  });
});
