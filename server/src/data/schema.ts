import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Drizzle SQLite schema for Voice Command Shopping Assistant.
 * Fully compatible with Turso libSQL over HTTP.
 */

export const shoppingItems = sqliteTable("shopping_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").notNull().default("item"),
  category: text("category").notNull().default("Other"),
  isPurchased: integer("is_purchased", { mode: "boolean" }).notNull().default(false),
  brand: text("brand"),
  price: real("price"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString())
});

export const purchaseHistory = sqliteTable("purchase_history", {
  id: text("id").primaryKey(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull().default("Other"),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").notNull().default("item"),
  price: real("price"),
  purchasedAt: text("purchased_at").notNull().$defaultFn(() => new Date().toISOString())
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Other"),
  brand: text("brand").notNull().default("Generic"),
  price: real("price").notNull().default(0),
  unit: text("unit").notNull().default("item"),
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  rating: real("rating"),
  imageUrl: text("image_url")
});

export type ShoppingItemRow = typeof shoppingItems.$inferSelect;
export type NewShoppingItemRow = typeof shoppingItems.$inferInsert;

export type PurchaseHistoryRow = typeof purchaseHistory.$inferSelect;
export type NewPurchaseHistoryRow = typeof purchaseHistory.$inferInsert;

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
