import { describe, it, expect, beforeEach } from "vitest";
import {
  SUBSTITUTE_MAP,
  getSeasonalPicks,
  generateSuggestions
} from "../services/recommendationEngine.js";
import { rawClient, initDb } from "../data/db.js";

describe("Recommendation Engine (AGENTS.md §8 & Assignment Spec)", () => {
  beforeEach(async () => {
    await initDb();
    await rawClient.execute("DELETE FROM purchase_history;");
  });

  it("should provide hardcoded substitutes for common items", () => {
    expect(SUBSTITUTE_MAP["milk"]).toContain("Almond Milk");
    expect(SUBSTITUTE_MAP["butter"]).toContain("Margarine");
    expect(SUBSTITUTE_MAP["bread"]).toContain("Whole Wheat Bread");
    expect(SUBSTITUTE_MAP["sugar"]).toContain("Jaggery");
    expect(SUBSTITUTE_MAP["toothpaste"]).toContain("Herbal Ayurvedic Toothpaste");
    expect(SUBSTITUTE_MAP["potato"]).toContain("Sweet Potato");
    expect(SUBSTITUTE_MAP["rice"]).toContain("Brown Rice");
  });

  it("should return seasonal picks for any month", () => {
    const summer = getSeasonalPicks(4); // May
    expect(summer.length).toBeGreaterThan(0);
    expect(summer.some(p => p.name.includes("Mango") || p.name.includes("Lemonade"))).toBe(true);

    const winter = getSeasonalPicks(11); // Dec
    expect(winter.length).toBeGreaterThan(0);
    expect(winter.some(p => p.name.includes("Apple") || p.name.includes("Spinach") || p.name.includes("Coffee"))).toBe(true);
  });

  it("should generate suggestions based on frequency and recency", async () => {
    const now = new Date();
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Insert purchase history
    await rawClient.execute({
      sql: `INSERT INTO purchase_history (id, item_name, category, quantity, unit, price, purchased_at) VALUES
        ('h1', 'Whole Milk', 'Dairy', 1, 'bottle', 3.50, ?),
        ('h2', 'Whole Milk', 'Dairy', 1, 'bottle', 3.50, ?),
        ('h3', 'Organic Eggs', 'Dairy', 1, 'dozen', 4.00, ?);`,
      args: [now.toISOString(), now.toISOString(), tenDaysAgo.toISOString()]
    });

    const suggestions = await generateSuggestions(["Whole Wheat Bread"]);

    expect(suggestions.length).toBeGreaterThan(0);
    const hasFrequency = suggestions.some(s => s.reason === "frequency" && s.name === "Whole Milk");
    const hasRecency = suggestions.some(s => s.reason === "recency" && s.name === "Organic Eggs");
    const hasSubstitute = suggestions.some(s => s.reason === "substitute" && s.originalItem === "Whole Wheat Bread");
    const hasSeasonal = suggestions.some(s => s.reason === "seasonal");

    expect(hasFrequency).toBe(true);
    expect(hasRecency).toBe(true);
    expect(hasSubstitute).toBe(true);
    expect(hasSeasonal).toBe(true);
  });
});
