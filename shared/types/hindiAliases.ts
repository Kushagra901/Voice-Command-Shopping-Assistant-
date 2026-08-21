/**
 * Hinglish synonym layer (AGENTS.md §5).
 * Resolves common code-switched Hindi shopping words to canonical items before category lookup.
 */

export const HINDI_ALIASES: Record<string, string> = {
  // Dairy
  doodh: "milk",
  dudh: "milk",
  dood: "milk",
  dahi: "curd",
  makkhan: "butter",
  makhan: "butter",
  paneer: "paneer",
  ghee: "ghee",
  malai: "cream",

  // Produce
  seb: "apple",
  saeb: "apple",
  kela: "banana",
  kele: "bananas",
  aloo: "potato",
  aalu: "potato",
  pyaz: "onion",
  pyaaz: "onion",
  kanda: "onion",
  tamatar: "tomato",
  tamater: "tomato",
  adrak: "ginger",
  lahsun: "garlic",
  palak: "spinach",
  gajar: "carrot",
  nimbu: "lemon",
  mirchi: "chili",

  // Staples & Groceries
  cheeni: "sugar",
  chini: "sugar",
  chawal: "rice",
  namak: "salt",
  tel: "oil",
  atta: "flour",
  aata: "flour",
  maida: "flour",
  daal: "lentils",
  dal: "lentils",
  anda: "egg",
  ande: "eggs",

  // Beverages & Bakery
  paani: "water",
  pani: "water",
  chai: "tea",
  chay: "tea",
  roti: "bread",
  pav: "bread",
  biscuit: "biscuits",

  // Personal Care & Household
  sabun: "soap"
};

export const HINDI_NUMERALS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  tin: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  sat: 7,
  aath: 8,
  ath: 8,
  nau: 9,
  das: 10,
  aadha: 0.5,
  adha: 0.5,
  derh: 1.5,
  dhai: 2.5
};

/**
 * Normalizes a Hinglish input string by translating code-switched Hindi words
 * to their canonical English equivalents.
 */
export function normalizeHinglish(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  const tokens = input.toLowerCase().trim().split(/\s+/);
  const normalizedTokens = tokens.map((token) => {
    const cleaned = token.replace(/[^a-z0-9]/g, "");
    if (HINDI_ALIASES[cleaned]) {
      return HINDI_ALIASES[cleaned];
    }
    return token;
  });

  return normalizedTokens.join(" ");
}
