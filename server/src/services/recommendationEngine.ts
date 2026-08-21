import type { SuggestionItem, ItemCategory } from "@voice-shopping/shared";
import { classifyCategory, normalizeHinglish } from "@voice-shopping/shared";
import { rawClient } from "../data/db.js";
import { logger } from "../utils/logger.js";

/**
 * Hardcoded substitute dictionary conforming to assessment specification.
 */
export const SUBSTITUTE_MAP: Record<string, string[]> = {
  milk: ["Almond Milk", "Soy Milk", "Oat Milk"],
  butter: ["Margarine", "Vegan Butter", "Olive Oil Spread"],
  bread: ["Whole Wheat Bread", "Multigrain Bread", "Sourdough Bread"],
  sugar: ["Jaggery", "Organic Honey", "Stevia"],
  toothpaste: ["Herbal Ayurvedic Toothpaste", "Charcoal Toothpaste", "Fluoride-Free Toothpaste"],
  potato: ["Sweet Potato"],
  rice: ["Brown Rice", "Organic Quinoa"]
};

/**
 * Monthly seasonal recommendation picks.
 */
export function getSeasonalPicks(monthIndex: number = new Date().getMonth()): { name: string; category: ItemCategory; description: string }[] {
  // monthIndex: 0 = Jan, 1 = Feb, ... 11 = Dec
  if (monthIndex >= 2 && monthIndex <= 5) {
    // Summer (Mar - Jun)
    return [
      { name: "Fresh Mangoes", category: "Produce", description: "In-season sweet summer mangoes" },
      { name: "Chilled Lemonade", category: "Beverages", description: "Refreshing summer cooler" },
      { name: "Mineral Sunscreen", category: "Personal Care", description: "Summer UV skin protection" }
    ];
  } else if (monthIndex >= 6 && monthIndex <= 8) {
    // Monsoon / Late Summer (Jul - Sep)
    return [
      { name: "Assam Black Tea", category: "Beverages", description: "Warm monsoon chai favorite" },
      { name: "Fresh Ginger", category: "Produce", description: "Seasonal immunity booster" },
      { name: "Corn Popcorn", category: "Snacks", description: "Rainy day snack" }
    ];
  } else {
    // Autumn / Winter (Oct - Feb)
    return [
      { name: "Fresh Red Apples", category: "Produce", description: "Crisp winter harvest apples" },
      { name: "Organic Spinach", category: "Produce", description: "Nutritious seasonal winter green" },
      { name: "Organic Jaggery", category: "Produce", description: "Traditional winter sweetener" },
      { name: "Dark Roast Coffee", category: "Beverages", description: "Warm morning coffee brew" }
    ];
  }
}

/**
 * Generates recommendations combining:
 * 1. Frequency (items bought frequently in purchase history)
 * 2. Recency (items purchased > 7 days ago needing restocking)
 * 3. Seasonal picks (current calendar month recommendations)
 * 4. Substitutes (healthier/dietary alternatives for active list items)
 */
export async function generateSuggestions(currentListItems: string[] = []): Promise<SuggestionItem[]> {
  const suggestions: SuggestionItem[] = [];
  const seenNames = new Set<string>(currentListItems.map(i => i.toLowerCase().trim()));

  try {
    // 1. Frequency-based recommendations (items purchased 2+ times in history)
    const freqResult = await rawClient.execute(`
      SELECT item_name, category, COUNT(*) as count, AVG(price) as avg_price
      FROM purchase_history
      GROUP BY item_name, category
      HAVING count >= 2
      ORDER BY count DESC
      LIMIT 3;
    `);

    for (const row of freqResult.rows) {
      const name = String(row["item_name"]);
      const category = (String(row["category"]) as ItemCategory) || classifyCategory(name);
      const avgPrice = row["avg_price"] ? Number(row["avg_price"]) : undefined;
      const count = Number(row["count"]);

      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        suggestions.push({
          id: `sug-freq-${name.toLowerCase().replace(/\s+/g, "-")}`,
          name,
          category,
          reason: "frequency",
          description: `Frequently purchased item (bought ${count} times)`,
          ...(avgPrice !== undefined ? { estimatedPrice: avgPrice } : {}),
          confidence: 0.92
        });
      }
    }

    // 2. Recency-based recommendations (purchased > 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recencyResult = await rawClient.execute({
      sql: `
        SELECT item_name, category, purchased_at, price
        FROM purchase_history
        WHERE purchased_at <= ?
        ORDER BY purchased_at ASC
        LIMIT 3;
      `,
      args: [sevenDaysAgo.toISOString()]
    });

    for (const row of recencyResult.rows) {
      const name = String(row["item_name"]);
      const category = (String(row["category"]) as ItemCategory) || classifyCategory(name);
      const price = row["price"] ? Number(row["price"]) : undefined;

      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        suggestions.push({
          id: `sug-rec-${name.toLowerCase().replace(/\s+/g, "-")}`,
          name,
          category,
          reason: "recency",
          description: "Purchased over a week ago — might need restocking",
          ...(price !== undefined ? { estimatedPrice: price } : {}),
          confidence: 0.88
        });
      }
    }
  } catch (error) {
    logger.error("Error querying purchase history for suggestions", error);
  }

  // 3. Current-Month Seasonal Picks
  const seasonal = getSeasonalPicks();
  for (const pick of seasonal) {
    if (!seenNames.has(pick.name.toLowerCase())) {
      seenNames.add(pick.name.toLowerCase());
      suggestions.push({
        id: `sug-season-${pick.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: pick.name,
        category: pick.category,
        reason: "seasonal",
        description: pick.description,
        confidence: 0.85
      });
    }
  }

  // 4. Substitute Suggestions for items currently in list
  for (const currentItem of currentListItems) {
    const normalizedItem = normalizeHinglish(currentItem.toLowerCase().trim());
    for (const [key, subs] of Object.entries(SUBSTITUTE_MAP)) {
      if (normalizedItem.includes(key)) {
        for (const sub of subs) {
          if (!seenNames.has(sub.toLowerCase())) {
            seenNames.add(sub.toLowerCase());
            suggestions.push({
              id: `sug-sub-${sub.toLowerCase().replace(/\s+/g, "-")}`,
              name: sub,
              category: classifyCategory(sub),
              reason: "substitute",
              description: `Healthy / alternative substitute for ${currentItem}`,
              originalItem: currentItem,
              confidence: 0.90
            });
          }
        }
      }
    }
  }

  return suggestions;
}
