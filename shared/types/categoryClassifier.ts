import type { ItemCategory } from "./index.js";
import { normalizeHinglish } from "./hindiAliases.js";

/**
 * Canonical category definitions per AGENTS.md §5:
 * - Dairy: milk, cheese, butter, yogurt, curd
 * - Produce: apple(s), banana(s), orange(s), tomato, potato, onion
 * - Bakery: bread, bun, cake
 * - Beverages: water, juice, coffee, tea, soda
 * - Snacks: chips, biscuits, cookies, chocolate, popcorn
 * - Household: detergent, soap, tissue, cleaner
 * - Personal Care: toothpaste, shampoo, toothbrush
 * - Other: fallback for unknown
 */
export const CATEGORY_MAP: Record<Exclude<ItemCategory, "Other">, readonly string[]> = {
  Dairy: [
    "milk", "cheese", "butter", "yogurt", "curd", "paneer", "ghee", "cream",
    "mozzarella", "cheddar", "cottage cheese", "buttermilk"
  ],
  Produce: [
    "apple", "apples", "banana", "bananas", "orange", "oranges", "tomato", "tomatoes",
    "potato", "potatoes", "onion", "onions", "garlic", "ginger", "spinach", "carrot", "carrots",
    "lemon", "lemons", "chili", "chilies", "fruit", "fruits", "vegetable", "vegetables",
    "lettuce", "cucumber", "cucumbers", "grape", "grapes", "strawberry", "berries",
    "avocado", "mango", "mangoes", "cilantro", "coriander", "mint"
  ],
  Bakery: [
    "bread", "bun", "buns", "cake", "cakes", "croissant", "croissants", "muffin", "muffins",
    "bagel", "bagels", "toast", "pastry", "pastries", "donut", "donuts", "loaf", "loaves",
    "pita", "tortilla", "baguette"
  ],
  Beverages: [
    "water", "juice", "coffee", "tea", "soda", "cola", "lemonade", "beer", "wine",
    "milkshake", "smoothie", "coke", "pepsi", "sprite", "espresso", "latte", "drink", "drinks"
  ],
  Snacks: [
    "chips", "biscuit", "biscuits", "cookie", "cookies", "chocolate", "chocolates",
    "popcorn", "nuts", "wafers", "namkeen", "crackers", "peanut", "peanuts", "nachos",
    "pretzel", "pretzels", "candy", "candies"
  ],
  Household: [
    "detergent", "soap", "tissue", "tissues", "cleaner", "paper towel", "bleach", "sponge",
    "trash bag", "trash bags", "garbage bag", "foil", "aluminum foil", "napkin", "napkins",
    "mop", "broom", "disinfectant"
  ],
  "Personal Care": [
    "toothpaste", "shampoo", "toothbrush", "toothbrushes", "conditioner",
    "face wash", "deodorant", "lotion", "sunscreen", "razor", "razors",
    "mouthwash", "sanitizer", "hand wash"
  ]
} as const;

const COMPOUND_PHRASE_MAPPINGS: Record<string, ItemCategory> = {
  "orange juice": "Beverages",
  "apple juice": "Beverages",
  "lemon juice": "Beverages",
  "tomato juice": "Beverages",
  "fruit juice": "Beverages",
  "potato chips": "Snacks",
  "banana chips": "Snacks",
  "apple pie": "Bakery",
  "banana bread": "Bakery",
  "carrot cake": "Bakery",
  "garlic bread": "Bakery",
  "sparkling water": "Beverages",
  "tonic water": "Beverages",
  "dish soap": "Household",
  "laundry detergent": "Household",
  "paper towel": "Household",
  "toilet paper": "Household",
  "trash bag": "Household",
  "trash bags": "Household",
  "face wash": "Personal Care",
  "body wash": "Personal Care",
  "dental floss": "Personal Care"
};

/**
 * Classifies an item into one of the 8 canonical categories.
 * Automatically resolves Hinglish synonyms first.
 */
export function classifyCategory(itemName: string): ItemCategory {
  if (!itemName || typeof itemName !== "string") {
    return "Other";
  }

  // 1. Normalize Hinglish code-switches to canonical English
  const normalized = normalizeHinglish(itemName.toLowerCase()).trim();

  // 2. Priority check: compound phrases (e.g. "orange juice" -> Beverages)
  for (const [phrase, category] of Object.entries(COMPOUND_PHRASE_MAPPINGS)) {
    if (normalized === phrase || normalized.includes(phrase)) {
      return category;
    }
  }

  // 3. Tokenize words (evaluate rightmost/head noun first)
  const words = normalized.split(/[\s,]+/);

  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    if (!word) continue;

    for (const [category, keywords] of Object.entries(CATEGORY_MAP) as [Exclude<ItemCategory, "Other">, readonly string[]][]) {
      if (keywords.includes(word)) {
        return category;
      }
    }
  }

  // 4. Substring inclusion check
  for (const [category, keywords] of Object.entries(CATEGORY_MAP) as [Exclude<ItemCategory, "Other">, readonly string[]][]) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
}
