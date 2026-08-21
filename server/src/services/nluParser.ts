import type { ParsedCommand } from "@voice-shopping/shared";
import { normalizeHinglish, HINDI_NUMERALS } from "@voice-shopping/shared";

const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
};

const COMMON_UNITS = [
  "bottle", "bottles",
  "packet", "packets", "pack", "packs", "pkg",
  "kg", "kilo", "kilos", "kilogram", "kilograms",
  "g", "gm", "gram", "grams",
  "l", "ltr", "litre", "litres", "liter", "liters",
  "loaf", "loaves",
  "can", "cans",
  "box", "boxes",
  "piece", "pieces",
  "carton", "cartons",
  "item", "items"
];

const KNOWN_BRANDS = [
  "amul", "colgate", "nestle", "pepsi", "coke", "coca cola", "lays",
  "oreo", "britannia", "tata", "dabur", "gillette", "tropicana",
  "parle", "cadbury", "heinz", "kelloggs", "dove", "nivea"
];

/**
 * Extracts numeric quantity and optional unit from text.
 */
function extractQuantityAndUnit(text: string): {
  quantity?: number;
  unit?: string;
  remainingText: string;
} {
  let workingText = text;
  let quantity: number | undefined;
  let unit: string | undefined;

  // 1. Handle dozen variants ("half dozen", "1 dozen", "one dozen", "2 dozen", "two dozen", "dozen")
  const dozenMatch = workingText.match(/\b(?:(half|\d+|one|two|three|four|five|six|ek|do|teen|chaar|paanch)\s+)?dozen\b/i);
  if (dozenMatch) {
    const multiplierStr = dozenMatch[1]?.toLowerCase();
    if (!multiplierStr || multiplierStr === "one" || multiplierStr === "ek" || multiplierStr === "1") {
      quantity = 12;
    } else if (multiplierStr === "half") {
      quantity = 6;
    } else if (multiplierStr === "two" || multiplierStr === "do" || multiplierStr === "2") {
      quantity = 24;
    } else if (multiplierStr === "three" || multiplierStr === "teen" || multiplierStr === "3") {
      quantity = 36;
    } else {
      const parsedNum = parseFloat(multiplierStr);
      quantity = !isNaN(parsedNum) ? parsedNum * 12 : 12;
    }
    unit = "item";
    workingText = workingText.replace(dozenMatch[0], "");
  }

  // 2. Check for digit + unit pattern e.g. "2 kg", "2.5 l", "3 bottles", "1 loaf", "2 kilo"
  if (!quantity) {
    const digitUnitRegex = new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(${COMMON_UNITS.join("|")})\\b`, "i");
    const match = workingText.match(digitUnitRegex);
    if (match && match[1] && match[2]) {
      quantity = parseFloat(match[1]);
      unit = match[2].toLowerCase();
      workingText = workingText.replace(match[0], "");
    }
  }

  // 3. Check for written word number + unit e.g. "two bottles", "do packet", "three loaves"
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

  // 4. Standalone digits e.g. "quantity to 3", "buy 2 apples"
  if (!quantity) {
    const standaloneDigitMatch = workingText.match(/\b(\d+(?:\\.\\d+)?)\b/);
    if (standaloneDigitMatch && standaloneDigitMatch[1]) {
      quantity = parseFloat(standaloneDigitMatch[1]);
      workingText = workingText.replace(standaloneDigitMatch[0], "");
    }
  }

  // 5. Standalone number words e.g. "buy two apples", "do seb add karo"
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

  // Normalize plural/singular units to standard form
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

/**
 * Extracts max price from constraints like "under 5 dollars", "below $10", "less than 20".
 */
function extractMaxPrice(text: string): { maxPrice?: number; remainingText: string } {
  let workingText = text;
  let maxPrice: number | undefined;

  const priceRegex = /\b(?:under|below|less than|max|cheaper than)\s+(?:\$|usd|rs|rupees)?\s*(\d+(?:\.\d+)?)\s*(?:dollars|bucks|rs|rupees)?\b/i;
  const match = workingText.match(priceRegex);
  if (match && match[1]) {
    maxPrice = parseFloat(match[1]);
    workingText = workingText.replace(match[0], "");
  }

  const result: { maxPrice?: number; remainingText: string } = {
    remainingText: workingText.trim()
  };
  if (maxPrice !== undefined) result.maxPrice = maxPrice;

  return result;
}

/**
 * Extracts recognized brand from text.
 */
function extractBrand(text: string): { brand?: string; remainingText: string } {
  let workingText = text;
  let brand: string | undefined;

  for (const knownBrand of KNOWN_BRANDS) {
    const regex = new RegExp(`\\b${knownBrand}\\b`, "i");
    if (regex.test(workingText)) {
      brand = knownBrand.charAt(0).toUpperCase() + knownBrand.slice(1);
      workingText = workingText.replace(regex, "");
      break;
    }
  }

  const result: { brand?: string; remainingText: string } = {
    remainingText: workingText.trim()
  };
  if (brand !== undefined) result.brand = brand;

  return result;
}

/**
 * Strips common stop-words and intent markers to leave clean item name.
 */
function cleanItemName(text: string): string {
  return text
    .replace(/\b(i want to buy|i need to buy|need to buy|want to buy|put on the list|on my list|from my list|to my list|on list|from list|to list|in list|in my list)\b/gi, "")
    .replace(/\b(add|remove|delete|update|change|mark|purchased|bought|check off|find|search for|search|get|buy|look for|show|give me|suggest|suggestions)\b/gi, "")
    .replace(/\b(karo|kar do|daalo|hata do|nikal do|badlo|badal do|khareed liya|mil gaya|kharidna hai|le lo|dhoondo|batao|dikhao)\b/gi, "")
    .replace(/\b(quantity|qty|amount|to|as|for|some|of|the|my|please|item|items)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Primary deterministic NLU parsing engine conforming to AGENTS.md §5.
 */
export function parseCommand(rawText: string): ParsedCommand {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    return {
      intent: "UNKNOWN",
      rawText: rawText || "",
      confidence: 0
    };
  }

  const trimmed = rawText.trim();
  // Apply Hinglish translation dictionary
  const normalizedHinglish = normalizeHinglish(trimmed);
  const lower = normalizedHinglish.toLowerCase();

  // 1. Check for SUGGESTIONS intent
  if (
    /\b(what should i buy|suggestions|recommendations|suggest items|what else do i need|kya khareedu|suggestion dikhao)\b/i.test(lower)
  ) {
    return {
      intent: "GET_SUGGESTIONS",
      rawText: trimmed,
      confidence: 0.95
    };
  }

  // 2. Check for SEARCH intent
  if (
    /\b(find|search|look for|dhoondo)\b/i.test(lower) ||
    /\b(under|below|less than)\s+\$?\d+/i.test(lower)
  ) {
    const { maxPrice, remainingText: afterPrice } = extractMaxPrice(lower);
    const { brand, remainingText: afterBrand } = extractBrand(afterPrice);
    const itemName = cleanItemName(afterBrand);

    return {
      intent: "SEARCH_PRODUCT",
      ...(itemName ? { itemName } : {}),
      ...(brand ? { brand } : {}),
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      rawText: trimmed,
      confidence: itemName ? 0.92 : 0.75
    };
  }

  // 3. Check for UPDATE_ITEM intent
  if (
    /\b(change|update|set|badlo|badal do)\b.*\b(quantity|qty|to|number)\b/i.test(lower) ||
    /\b(quantity|qty)\b.*\b(to|badlo|change)\b/i.test(lower)
  ) {
    const { quantity, unit, remainingText: afterQty } = extractQuantityAndUnit(lower);
    const { brand, remainingText: afterBrand } = extractBrand(afterQty);
    const itemName = cleanItemName(afterBrand);

    return {
      intent: "UPDATE_ITEM",
      ...(itemName ? { itemName } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit ? { unit } : {}),
      ...(brand ? { brand } : {}),
      rawText: trimmed,
      confidence: itemName && quantity !== undefined ? 0.95 : 0.70
    };
  }

  // 4. Check for MARK_PURCHASED intent
  if (
    /\b(mark|bought|purchased|check off|got the|done|khareed liya|mil gaya)\b/i.test(lower)
  ) {
    const { quantity, unit, remainingText: afterQty } = extractQuantityAndUnit(lower);
    const { brand, remainingText: afterBrand } = extractBrand(afterQty);
    const itemName = cleanItemName(afterBrand);

    return {
      intent: "MARK_PURCHASED",
      ...(itemName ? { itemName } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit ? { unit } : {}),
      ...(brand ? { brand } : {}),
      rawText: trimmed,
      confidence: itemName ? 0.95 : 0.60
    };
  }

  // 5. Check for REMOVE_ITEM intent
  if (
    /\b(remove|delete|take off|hata do|nikal do|clear)\b/i.test(lower)
  ) {
    const { quantity, unit, remainingText: afterQty } = extractQuantityAndUnit(lower);
    const { brand, remainingText: afterBrand } = extractBrand(afterQty);
    const itemName = cleanItemName(afterBrand);

    return {
      intent: "REMOVE_ITEM",
      ...(itemName ? { itemName } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(unit ? { unit } : {}),
      ...(brand ? { brand } : {}),
      rawText: trimmed,
      confidence: itemName ? 0.95 : 0.60
    };
  }

  // 6. Check for ADD_ITEM intent
  const hasAddVerb = /\b(add|buy|get|put|need|want to buy|need to buy|daalo|kharidna hai|le lo)\b/i.test(lower);
  const { quantity, unit, remainingText: afterQty } = extractQuantityAndUnit(lower);
  const { brand, remainingText: afterBrand } = extractBrand(afterQty);
  const itemName = cleanItemName(afterBrand);

  // Check if non-empty item name contains valid shopping item or add verb
  if (itemName && (hasAddVerb || quantity !== undefined || brand !== undefined)) {
    return {
      intent: "ADD_ITEM",
      itemName,
      quantity: quantity ?? 1,
      unit: unit ?? "item",
      ...(brand ? { brand } : {}),
      rawText: trimmed,
      confidence: hasAddVerb ? 0.95 : 0.85
    };
  }

  // Check if it's a simple shopping item phrase e.g. "milk", "apples", "bread"
  if (itemName && itemName.length > 1 && !/\b(weather|who is|play|sing|joke|time|capital|president)\b/i.test(lower)) {
    return {
      intent: "ADD_ITEM",
      itemName,
      quantity: quantity ?? 1,
      unit: unit ?? "item",
      ...(brand ? { brand } : {}),
      rawText: trimmed,
      confidence: 0.80
    };
  }

  // Fallback to UNKNOWN for irrelevant / garbage inputs
  return {
    intent: "UNKNOWN",
    rawText: trimmed,
    confidence: 0.1
  };
}
