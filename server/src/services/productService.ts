import { rawClient } from "../data/db.js";
import type { Product, ItemCategory } from "@voice-shopping/shared";
import { normalizeHinglish } from "@voice-shopping/shared";
import { logger } from "../utils/logger.js";

export interface ProductSearchParams {
  q?: string;
  category?: string;
  maxPrice?: number;
  brand?: string;
  limit?: number;
}

export async function searchProducts(params: ProductSearchParams): Promise<Product[]> {
  try {
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (params.q) {
      const normalized = normalizeHinglish(params.q.toLowerCase().trim());
      conditions.push("(LOWER(name) LIKE ? OR LOWER(name) LIKE ?)");
      args.push(`%${params.q.toLowerCase()}%`, `%${normalized}%`);
    }

    if (params.category && params.category !== "All") {
      conditions.push("category = ?");
      args.push(params.category);
    }

    if (params.brand) {
      conditions.push("LOWER(brand) = ?");
      args.push(params.brand.toLowerCase());
    }

    if (params.maxPrice !== undefined) {
      conditions.push("price <= ?");
      args.push(params.maxPrice);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limitClause = `LIMIT ${params.limit || 20}`;

    const query = `
      SELECT id, name, category, brand, price, unit, in_stock, rating, image_url
      FROM products
      ${whereClause}
      ORDER BY rating DESC, price ASC
      ${limitClause};
    `;

    const result = await rawClient.execute({ sql: query, args });

    return result.rows.map((row) => {
      const p: Product = {
        id: String(row["id"]),
        name: String(row["name"]),
        category: (String(row["category"]) as ItemCategory) || "Other",
        brand: String(row["brand"]),
        price: Number(row["price"]),
        unit: String(row["unit"]),
        inStock: Boolean(row["in_stock"])
      };
      if (row["rating"] !== null && row["rating"] !== undefined) p.rating = Number(row["rating"]);
      if (row["image_url"]) p.imageUrl = String(row["image_url"]);
      return p;
    });
  } catch (error) {
    logger.error("Error searching products catalog", error);
    return [];
  }
}
