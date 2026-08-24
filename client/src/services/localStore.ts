import type {
  ShoppingItem,
  CreateItemDto,
  UpdateItemDto,
  SuggestionItem,
  Product,
  CategoryDetail,
  HealthStatus,
  ParseCommandResponse,
  ParsedCommand,
  ItemCategory
} from "@voice-shopping/shared";
import { classifyCategory, CATEGORY_MAP, normalizeHinglish, HINDI_NUMERALS } from "@voice-shopping/shared";

const STORAGE_KEY = "voice-shopping-list-items-v1";

const INITIAL_DEMO_ITEMS: ShoppingItem[] = [
  {
    id: "item-1",
    name: "Whole Milk",
    quantity: 1,
    unit: "bottle",
    category: "Dairy",
    isPurchased: false,
    brand: "Local Farm",
    price: 3.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "item-2",
    name: "Fresh Apples",
    quantity: 6,
    unit: "item",
    category: "Produce",
    isPurchased: false,
    brand: "Orchard Pick",
    price: 4.2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "item-3",
    name: "Whole Wheat Bread",
    quantity: 1,
    unit: "loaf",
    category: "Bakery",
    isPurchased: true,
    brand: "Baker's Choice",
    price: 2.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "item-4",
    name: "Sparkling Water",
    quantity: 2,
    unit: "bottle",
    category: "Beverages",
    isPurchased: false,
    brand: "PureSpring",
    price: 2.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const SEEDED_PRODUCTS: Product[] = [
  { id: "p1", name: "Amul Taaza Homogenised Toned Milk", category: "Dairy", brand: "Amul", price: 3.2, unit: "l", inStock: true, rating: 4.8 },
  { id: "p2", name: "Organic Whole Milk", category: "Dairy", brand: "Organic Valley", price: 4.5, unit: "bottle", inStock: true, rating: 4.9 },
  { id: "p3", name: "Greek Yogurt Plain", category: "Dairy", brand: "Chobani", price: 3.8, unit: "item", inStock: true, rating: 4.7 },
  { id: "p4", name: "Fresh Royal Gala Apples", category: "Produce", brand: "Orchard Pick", price: 4.99, unit: "kg", inStock: true, rating: 4.6 },
  { id: "p5", name: "Organic Ripe Bananas", category: "Produce", brand: "Fresh Produce", price: 1.99, unit: "dozen", inStock: true, rating: 4.8 },
  { id: "p6", name: "Fresh Red Tomatoes", category: "Produce", brand: "Farm Fresh", price: 2.49, unit: "kg", inStock: true, rating: 4.5 },
  { id: "p7", name: "Artisan Sourdough Loaf", category: "Bakery", brand: "Baker's Choice", price: 4.5, unit: "loaf", inStock: true, rating: 4.9 },
  { id: "p8", name: "Whole Grain Sandwich Bread", category: "Bakery", brand: "Britannia", price: 2.5, unit: "loaf", inStock: true, rating: 4.4 },
  { id: "p9", name: "Sparkling Spring Water", category: "Beverages", brand: "PureSpring", price: 1.8, unit: "bottle", inStock: true, rating: 4.7 },
  { id: "p10", name: "Arabica Medium Roast Coffee Beans", category: "Beverages", brand: "Nestle", price: 8.99, unit: "packet", inStock: true, rating: 4.8 },
  { id: "p11", name: "Classic Potato Chips Salted", category: "Snacks", brand: "Lays", price: 1.99, unit: "packet", inStock: true, rating: 4.5 },
  { id: "p12", name: "Colgate Total Clean Mint Toothpaste", category: "Personal Care", brand: "Colgate", price: 3.99, unit: "item", inStock: true, rating: 4.8 },
  { id: "p13", name: "Dove Deep Moisture Body Wash", category: "Personal Care", brand: "Dove", price: 6.49, unit: "bottle", inStock: true, rating: 4.7 },
  { id: "p14", name: "Eco-Friendly Dish Soap Citrus", category: "Household", brand: "Generic", price: 3.29, unit: "bottle", inStock: true, rating: 4.6 }
];

const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
};

const COMMON_UNITS = [
  "bottle", "bottles", "packet", "packets", "pack", "packs", "pkg",
  "kg", "kilo", "kilos", "kilogram", "kilograms", "g", "gm", "gram", "grams",
  "l", "ltr", "litre", "litres", "liter", "liters", "loaf", "loaves",
  "can", "cans", "box", "boxes", "piece", "pieces", "carton", "cartons", "item", "items"
];

function extractQuantityAndUnit(text: string): { quantity?: number; unit?: string; remainingText: string } {
  let workingText = text;
  let quantity: number | undefined;
  let unit: string | undefined;

  const dozenMatch = workingText.match(/\b(?:(half|\d+|one|two|three|four|five|six|ek|do|teen|chaar|paanch)\s+)?dozen\b/i);
  if (dozenMatch) {
    const multiplierStr = dozenMatch[1]?.toLowerCase();
    if (!multiplierStr || multiplierStr === "one" || multiplierStr === "ek" || multiplierStr === "1") quantity = 12;
    else if (multiplierStr === "half") quantity = 6;
    else if (multiplierStr === "two" || multiplierStr === "do" || multiplierStr === "2") quantity = 24;
    else if (multiplierStr === "three" || multiplierStr === "teen" || multiplierStr === "3") quantity = 36;
    else {
      const parsed = parseFloat(multiplierStr);
      quantity = !isNaN(parsed) ? parsed * 12 : 12;
    }
    unit = "item";
    workingText = workingText.replace(dozenMatch[0], "");
  }

  if (!quantity) {
    const digitUnitRegex = new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(${COMMON_UNITS.join("|")})\\b`, "i");
    const match = workingText.match(digitUnitRegex);
    if (match && match[1] && match[2]) {
      quantity = parseFloat(match[1]);
      unit = match[2].toLowerCase();
      workingText = workingText.replace(match[0], "");
    }
  }

  if (!quantity) {
    const numWords = [...Object.keys(ENGLISH_NUMBER_WORDS), ...Object.keys(HINDI_NUMERALS)];
    const wordUnitRegex = new RegExp(`\\b(${numWords.join("|")})\\s+(${COMMON_UNITS.join("|")})\\b`, "i");
    const match = workingText.match(wordUnitRegex);
    if (match && match[1] && match[2]) {
      const numStr = match[1].toLowerCase();
      quantity = ENGLISH_NUMBER_WORDS[numStr] ?? HINDI_NUMERALS[numStr] ?? 1;
      unit = match[2].toLowerCase();
      workingText = workingText.replace(match[0], "");
    }
  }

  if (!quantity) {
    const standaloneDigitMatch = workingText.match(/\b(\d+(?:\.\d+)?)\b/);
    if (standaloneDigitMatch && standaloneDigitMatch[1]) {
      quantity = parseFloat(standaloneDigitMatch[1]);
      workingText = workingText.replace(standaloneDigitMatch[0], "");
    }
  }

  if (!quantity) {
    const numWords = [...Object.keys(ENGLISH_NUMBER_WORDS), ...Object.keys(HINDI_NUMERALS)];
    for (const word of numWords) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(workingText)) {
        quantity = ENGLISH_NUMBER_WORDS[word.toLowerCase()] ?? HINDI_NUMERALS[word.toLowerCase()];
        workingText = workingText.replace(regex, "");
        break;
      }
    }
  }

  if (unit) {
    if (unit === "bottles") unit = "bottle";
    else if (unit === "packets" || unit === "packs" || unit === "pkg") unit = "packet";
    else if (unit === "kilos" || unit === "kilogram" || unit === "kilograms" || unit === "kilo") unit = "kg";
    else if (unit === "grams" || unit === "gm") unit = "g";
    else if (unit === "litres" || unit === "liter" || unit === "liters" || unit === "ltr") unit = "l";
    else if (unit === "loaves") unit = "loaf";
    else if (unit === "cans") unit = "can";
    else if (unit === "boxes") unit = "box";
    else if (unit === "pieces") unit = "piece";
  }

  const result: { quantity?: number; unit?: string; remainingText: string } = {
    remainingText: workingText.trim()
  };
  if (quantity !== undefined) result.quantity = quantity;
  if (unit !== undefined) result.unit = unit;

  return result;
}

function cleanItemName(text: string): string {
  return text
    .replace(/\b(i want to buy|i need to buy|need to buy|want to buy|put on the list|on my list|from my list|to my list|on list|from list|to list|in list|in my list)\b/gi, "")
    .replace(/\b(add|remove|delete|update|change|mark|purchased|bought|check off|find|search for|search|get|buy|look for|show|give me|suggest|suggestions)\b/gi, "")
    .replace(/\b(karo|kar do|daalo|hata do|nikal do|badlo|badal do|khareed liya|mil gaya|kharidna hai|le lo|dhoondo|batao|dikhao|chahiye|mangta|lao)\b/gi, "")
    .replace(/\b(quantity|qty|amount|to|as|for|some|of|the|my|please|item|items)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDeterministic(rawText: string): ParsedCommand {
  if (!rawText || !rawText.trim()) {
    return { intent: "UNKNOWN", rawText: rawText || "", confidence: 0 };
  }

  const trimmed = rawText.trim();
  const normalizedHinglish = normalizeHinglish(trimmed);
  const lower = normalizedHinglish.toLowerCase();

  if (/\b(undo|undo that|take that back|revert|oops|pehle jaisa karo|wapas karo|undo karo)\b/i.test(lower)) {
    return { intent: "UNDO", rawText: trimmed, confidence: 0.98 };
  }

  if (/\b(what should i buy|suggestions|recommendations|suggest items|what else do i need|kya khareedu|suggestion dikhao)\b/i.test(lower)) {
    return { intent: "GET_SUGGESTIONS", rawText: trimmed, confidence: 0.95 };
  }

  if (/\b(remove|delete|hata do|nikal do|remove karo|delete karo)\b/i.test(lower)) {
    const itemName = cleanItemName(lower);
    const cmd: ParsedCommand = { intent: "REMOVE_ITEM", rawText: trimmed, confidence: 0.92 };
    if (itemName) cmd.itemName = itemName;
    return cmd;
  }

  if (/\b(change|update|set|make|badlo|badal do|update karo)\b/i.test(lower) && /\b(to|quantity|qty|as)\b/i.test(lower)) {
    const { quantity, unit, remainingText } = extractQuantityAndUnit(lower);
    const itemName = cleanItemName(remainingText);
    const cmd: ParsedCommand = { intent: "UPDATE_ITEM", rawText: trimmed, confidence: 0.9 };
    if (itemName) cmd.itemName = itemName;
    if (quantity !== undefined) cmd.quantity = quantity;
    if (unit !== undefined) cmd.unit = unit;
    return cmd;
  }

  if (/\b(mark|purchased|bought|check off|mil gaya|khareed liya|done kar do)\b/i.test(lower)) {
    const itemName = cleanItemName(lower);
    const cmd: ParsedCommand = { intent: "MARK_PURCHASED", rawText: trimmed, confidence: 0.94 };
    if (itemName) cmd.itemName = itemName;
    return cmd;
  }

  if (/\b(find|search|look for|dhoondo)\b/i.test(lower)) {
    const itemName = cleanItemName(lower);
    const cmd: ParsedCommand = { intent: "SEARCH_PRODUCT", rawText: trimmed, confidence: 0.9 };
    if (itemName) cmd.itemName = itemName;
    return cmd;
  }

  if (/\b(add|buy|get|need|want|daalo|kharidna hai|le lo|add karo|add kar do)\b/i.test(lower) || lower.length > 0) {
    const { quantity, unit, remainingText } = extractQuantityAndUnit(lower);
    const itemName = cleanItemName(remainingText);
    if (itemName) {
      return { intent: "ADD_ITEM", itemName, quantity: quantity ?? 1, unit: unit ?? "item", rawText: trimmed, confidence: 0.92 };
    }
  }

  return { intent: "UNKNOWN", rawText: trimmed, confidence: 0.3 };
}

export const localStore = {
  getItems(): ShoppingItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ITEMS));
        return INITIAL_DEMO_ITEMS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_ITEMS;
    }
  },

  saveItems(items: ShoppingItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // LocalStorage fallback error handling
    }
  },

  addItem(dto: CreateItemDto): ShoppingItem {
    const items = this.getItems();
    const category = dto.category || classifyCategory(dto.name);
    const normalizedNew = normalizeHinglish(dto.name.toLowerCase().trim());

    // Duplicate detection and quantity merging
    const existingIndex = items.findIndex(
      (item) => !item.isPurchased && normalizeHinglish(item.name.toLowerCase().trim()) === normalizedNew
    );

    if (existingIndex !== -1 && items[existingIndex]) {
      const current = items[existingIndex];
      const updatedItem: ShoppingItem = {
        ...current,
        quantity: current.quantity + (dto.quantity || 1),
        unit: dto.unit || current.unit,
        updatedAt: new Date().toISOString()
      };
      items[existingIndex] = updatedItem;
      this.saveItems(items);
      return updatedItem;
    }

    const newItem: ShoppingItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: dto.name.trim(),
      quantity: dto.quantity || 1,
      unit: dto.unit || "item",
      category,
      isPurchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (dto.brand) newItem.brand = dto.brand;
    if (dto.price !== undefined) newItem.price = dto.price;

    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  },

  updateItem(id: string, dto: UpdateItemDto): ShoppingItem | null {
    const items = this.getItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1 || !items[index]) return null;

    const current = items[index];
    const updated: ShoppingItem = {
      ...current,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
      ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.isPurchased !== undefined ? { isPurchased: dto.isPurchased } : {}),
      ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      updatedAt: new Date().toISOString()
    };

    items[index] = updated;
    this.saveItems(items);
    return updated;
  },

  deleteItem(id: string): boolean {
    const items = this.getItems();
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return false;
    this.saveItems(filtered);
    return true;
  },

  parseAndExecuteCommand(text: string, execute = true): ParseCommandResponse {
    const command = parseDeterministic(text);
    if (!execute || command.intent === "UNKNOWN") {
      return {
        command,
        executed: false,
        message: command.intent === "UNKNOWN" ? `Could not understand "${text}".` : "Command parsed."
      };
    }

    if (command.intent === "ADD_ITEM" && command.itemName) {
      const createDto: CreateItemDto = {
        name: command.itemName,
        quantity: command.quantity || 1,
        unit: command.unit || "item"
      };
      if (command.brand) createDto.brand = command.brand;

      const item = this.addItem(createDto);
      return {
        command,
        executed: true,
        item,
        message: `Added ${item.quantity} ${item.unit} ${item.name} to your list.`
      };
    }

    if (command.intent === "REMOVE_ITEM" && command.itemName) {
      const items = this.getItems();
      const normalizedTarget = normalizeHinglish(command.itemName.toLowerCase().trim());
      const match = items.find((i) => normalizeHinglish(i.name.toLowerCase().trim()).includes(normalizedTarget));
      if (match) {
        this.deleteItem(match.id);
        return {
          command,
          executed: true,
          message: `Removed ${match.name} from your list.`
        };
      }
      return {
        command,
        executed: false,
        message: `Could not find "${command.itemName}" in your list.`
      };
    }

    if (command.intent === "MARK_PURCHASED" && command.itemName) {
      const items = this.getItems();
      const normalizedTarget = normalizeHinglish(command.itemName.toLowerCase().trim());
      const match = items.find((i) => normalizeHinglish(i.name.toLowerCase().trim()).includes(normalizedTarget));
      if (match) {
        const updated = this.updateItem(match.id, { isPurchased: true });
        const res: ParseCommandResponse = {
          command,
          executed: true,
          message: `Marked ${match.name} as purchased.`
        };
        if (updated) res.item = updated;
        return res;
      }
      return {
        command,
        executed: false,
        message: `Could not find "${command.itemName}" in your list.`
      };
    }

    if (command.intent === "UPDATE_ITEM" && command.itemName) {
      const items = this.getItems();
      const normalizedTarget = normalizeHinglish(command.itemName.toLowerCase().trim());
      const match = items.find((i) => normalizeHinglish(i.name.toLowerCase().trim()).includes(normalizedTarget));
      if (match) {
        const updated = this.updateItem(match.id, {
          ...(command.quantity !== undefined ? { quantity: command.quantity } : {}),
          ...(command.unit !== undefined ? { unit: command.unit } : {})
        });
        const res: ParseCommandResponse = {
          command,
          executed: true,
          message: `Updated ${match.name} quantity to ${updated?.quantity}.`
        };
        if (updated) res.item = updated;
        return res;
      }
      return {
        command,
        executed: false,
        message: `Could not find "${command.itemName}" in your list.`
      };
    }

    return {
      command,
      executed: true,
      message: `Processed command: ${command.intent}`
    };
  },

  getSuggestions(): SuggestionItem[] {
    const items = this.getItems();
    const currentNames = items.map((i) => i.name.toLowerCase());
    const suggestions: SuggestionItem[] = [];

    if (currentNames.some((n) => n.includes("milk"))) {
      suggestions.push({
        id: "sug-1",
        name: "Breakfast Cereal",
        category: "Bakery",
        reason: "frequency",
        description: "Frequently bought with milk",
        confidence: 0.95,
        estimatedPrice: 3.5
      });
    }

    if (currentNames.some((n) => n.includes("bread"))) {
      suggestions.push({
        id: "sug-2",
        name: "Amul Butter",
        category: "Dairy",
        reason: "frequency",
        description: "Pairs perfectly with bread",
        confidence: 0.92,
        estimatedPrice: 2.8
      });
    }

    suggestions.push({
      id: "sug-3",
      name: "Fresh Bananas",
      category: "Produce",
      reason: "seasonal",
      description: "Popular seasonal fruit this week",
      confidence: 0.88,
      estimatedPrice: 1.99
    });

    suggestions.push({
      id: "sug-4",
      name: "Green Tea Pack",
      category: "Beverages",
      reason: "recency",
      description: "Top wellness pick from your history",
      confidence: 0.85,
      estimatedPrice: 4.2
    });

    return suggestions;
  },

  searchProducts(params: { q?: string; category?: string; maxPrice?: number; brand?: string }): Product[] {
    let result = [...SEEDED_PRODUCTS];
    if (params.q) {
      const q = params.q.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (params.category && params.category !== "All") {
      result = result.filter((p) => p.category === params.category);
    }
    if (params.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= params.maxPrice!);
    }
    if (params.brand) {
      result = result.filter((p) => p.brand.toLowerCase().includes(params.brand!.toLowerCase()));
    }
    return result;
  },

  getCategories(): CategoryDetail[] {
    const items = this.getItems();
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    const categories: CategoryDetail[] = Object.entries(CATEGORY_MAP).map(([cat, keywords]) => {
      const categoryName = cat as ItemCategory;
      return {
        category: categoryName,
        itemCount: counts[categoryName] || 0,
        keywords
      };
    });

    categories.push({
      category: "Other",
      itemCount: counts["Other"] || 0,
      keywords: []
    });

    return categories;
  },

  getHealth(): HealthStatus {
    return {
      status: "healthy",
      database: "local-storage",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(performance.now() / 1000)
    };
  }
};
