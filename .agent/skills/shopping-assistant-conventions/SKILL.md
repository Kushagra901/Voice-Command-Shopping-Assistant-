---
name: shopping-assistant-conventions
description: The condensed ParsedCommand contract, category mappings, and Hinglish transliteration conventions for the Voice Command Shopping Assistant.
---

# Shopping Assistant Conventions

This skill provides domain rules, contracts, and normalization standards for voice command parsing, categorization, and Hinglish transliteration.

## 1. Consistent API Envelope (AGENTS.md §2)

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: { message: string; code: string } };
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

## 2. ParsedCommand Contract (Fixed Shape - AGENTS.md §5)

```ts
export type Intent =
  | "ADD_ITEM"
  | "REMOVE_ITEM"
  | "UPDATE_ITEM"
  | "MARK_PURCHASED"
  | "SEARCH_PRODUCT"
  | "GET_SUGGESTIONS"
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
```

## 3. Category Map (Unknown → "Other" - AGENTS.md §5)

- **Dairy**: milk, cheese, butter, yogurt, curd, paneer, cream, ghee
- **Produce**: apple(s), banana(s), orange(s), tomato, potato, onion, garlic, ginger, spinach, carrot(s), fruit, vegetables
- **Bakery**: bread, bun, cake, croissant, muffin, bagel, toast
- **Beverages**: water, juice, coffee, tea, soda, cola, lemonade, beer, wine
- **Snacks**: chips, biscuits, cookies, chocolate, popcorn, nuts, wafers, namkeen
- **Household**: detergent, soap, tissue, cleaner, paper towel, bleach, sponge, trash bag
- **Personal Care**: toothpaste, shampoo, toothbrush, conditioner, face wash, deodorant, lotion
- **Other**: fallback for all unmatched items

## 4. Hinglish Synonym & Transliteration Layer (AGENTS.md §5)

Common Hindi shopping words must resolve to their canonical English item before category lookup:
- `doodh` / `dudh` → milk
- `seb` / `saeb` → apple
- `kela` / `kele` → banana
- `paani` / `pani` → water
- `aloo` / `aalu` → potato
- `pyaz` / `pyaaz` / `kanda` → onion
- `tamatar` → tomato
- `cheeni` / `chini` → sugar
- `chawal` → rice
- `dahi` → curd
- `makkhan` / `makhan` → butter
- `chai` / `chay` → tea
- `namak` → salt
- `tel` → oil
- `atta` / `aata` → flour
- `anda` / `ande` → egg

Hinglish command verb phrases:
- Add: `add karo`, `daalo`, `kharidna hai`, `le lo`, `add kar do`
- Remove: `hata do`, `remove karo`, `delete karo`, `nikal do`
- Update: `badlo`, `change karo`, `update karo`
- Mark Purchased: `khareed liya`, `mil gaya`, `done kar do`

## 5. Number & Quantity Conversion

Support written numbers (`one`, `two`, `three` ... `ten`, `ek`, `do`, `teen`, `chaar`, `paanch`, `dozen`, `half dozen`, `aadha`) and standard unit abbreviations (`kg`, `kilo`, `litres`, `l`, `bottles`, `packets`, `boxes`, `cans`, `grams`, `g`).
