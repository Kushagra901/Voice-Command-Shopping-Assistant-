import type { ItemCategory } from "@voice-shopping/shared";
import { normalizeHinglish } from "./hindiAliases.js";

/**
 * Keyword-based category classification mapping conforming to AGENTS.md §5.
 * Specific compound phrases are prioritized over generic single-word qualifiers.
 */
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

const CATEGORY_KEYWORDS: Record<Exclude<ItemCategory, "Other">, string[]> = {
  Beverages: [
    "juice", "water", "coffee", "tea", "soda", "cola", "lemonade", "beer", "wine",
    "milkshake", "smoothie", "coke", "pepsi", "sprite", "espresso", "latte", "drink", "drinks"
  ],
  Snacks: [
    "chips", "biscuit", "biscuits", "chocolate", "chocolates", "popcorn", "nuts",
    "wafers", "namkeen", "crackers", "peanut", "peanuts", "nachos", "pretzel", "pretzels",
    "cookie", "cookies", "candy", "candies"
  ],
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
  Household: [
    "detergent", "cleaner", "tissue", "tissues", "bleach", "sponge",
    "foil", "aluminum foil", "napkin", "napkins", "mop", "broom", "disinfectant"
  ],
  "Personal Care": [
    "toothpaste", "shampoo", "toothbrush", "toothbrushes", "conditioner",
    "deodorant", "lotion", "soap", "sunscreen", "razor", "razors",
    "mouthwash", "sanitizer", "hand wash"
  ]
};

/**
 * Classifies an item name into one of the 8 canonical categories.
 * Automatically normalizes Hinglish synonyms first.
 */
export function classifyCategory(itemName: string): ItemCategory {
  if (!itemName || typeof itemName !== "string") {
    return "Other";
  }

  // 1. Normalize Hinglish to canonical English keywords
  const normalized = normalizeHinglish(itemName.toLowerCase()).trim();

  // 2. Check exact compound phrase mapping first
  for (const [phrase, category] of Object.entries(COMPOUND_PHRASE_MAPPINGS)) {
    if (normalized === phrase || normalized.includes(phrase)) {
      return category;
    }
  }

  // 3. Tokenize words (reverse check: head noun usually comes at the end)
  const words = normalized.split(/[\s,]+/);

  // Check last word first (head noun in English)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    if (!word) continue;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Exclude<ItemCategory, "Other">, string[]][]) {
      if (keywords.includes(word)) {
        return category;
      }
    }
  }

  // Check substring matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Exclude<ItemCategory, "Other">, string[]][]) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return "Other";
}
