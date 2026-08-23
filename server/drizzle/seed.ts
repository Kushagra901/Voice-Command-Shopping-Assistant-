import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

import { rawClient, initDb } from "../src/data/db.js";
import { logger } from "../src/utils/logger.js";

const ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/products");
const PRODUCE_DIR = path.join(ASSETS_DIR, "produce");

async function downloadOpenFoodFactsImage(name: string, targetPath: string): Promise<boolean> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return false;

    const data = await res.json() as { products?: { image_front_url?: string; image_url?: string }[] };
    const firstProduct = data.products?.[0];
    const imageUrl = firstProduct?.image_front_url || firstProduct?.image_url;

    if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(buffer));
        return true;
      }
    }
  } catch {
    // Open Food Facts lookup optional/fallback
  }
  return false;
}

async function seed(): Promise<void> {
  await initDb();

  // Ensure assets folders exist
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(PRODUCE_DIR, { recursive: true });

  // Clear existing items and insert explicit seeded starter data
  await rawClient.execute("DELETE FROM shopping_items;");
  await rawClient.execute("DELETE FROM purchase_history;");
  await rawClient.execute("DELETE FROM products;");

  const now = new Date();
  const nowIso = now.toISOString();

  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  // 1. Initial Shopping Items (labeled as seeded demo data)
  const initialItems = [
    { id: "item-1", name: "Whole Milk", quantity: 1, unit: "bottle", category: "Dairy", is_purchased: 0, brand: "Local Farm", price: 3.50, created_at: nowIso, updated_at: nowIso },
    { id: "item-2", name: "Fresh Apples", quantity: 6, unit: "item", category: "Produce", is_purchased: 0, brand: "Orchard Pick", price: 4.20, created_at: nowIso, updated_at: nowIso },
    { id: "item-3", name: "Whole Wheat Bread", quantity: 1, unit: "loaf", category: "Bakery", is_purchased: 1, brand: "Baker's Choice", price: 2.80, created_at: nowIso, updated_at: nowIso },
    { id: "item-4", name: "Sparkling Water", quantity: 2, unit: "bottle", category: "Beverages", is_purchased: 0, brand: "PureSpring", price: 2.00, created_at: nowIso, updated_at: nowIso }
  ];

  for (const item of initialItems) {
    await rawClient.execute({
      sql: `INSERT INTO shopping_items (id, name, quantity, unit, category, is_purchased, brand, price, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [item.id, item.name, item.quantity, item.unit, item.category, item.is_purchased, item.brand, item.price, item.created_at, item.updated_at]
    });
  }

  // 2. 20+ Product Catalog with high-quality grocery imagery
  const productCatalog = [
    // Dairy
    { id: "prod-1", name: "Organic Whole Milk", category: "Dairy", brand: "Amul", price: 3.99, unit: "bottle", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-2", name: "Almond Milk Unsweetened", category: "Dairy", brand: "Silk", price: 4.29, unit: "carton", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1568651316377-511598f828a2?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-3", name: "Oat Milk Barista Blend", category: "Dairy", brand: "Oatly", price: 4.99, unit: "carton", in_stock: 1, rating: 4.9, fallback_url: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-4", name: "Pure Salted Butter", category: "Dairy", brand: "Amul", price: 3.49, unit: "packet", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-5", name: "Fresh Greek Yogurt", category: "Dairy", brand: "Chobani", price: 5.20, unit: "box", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-6", name: "Fresh Paneer Block", category: "Dairy", brand: "Amul", price: 4.50, unit: "packet", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80" },

    // Produce
    { id: "prod-7", name: "Red Crisp Apples", category: "Produce", brand: "FreshFarm", price: 3.99, unit: "kg", in_stock: 1, rating: 4.5, fallback_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-8", name: "Organic Yellow Bananas", category: "Produce", brand: "FreshFarm", price: 1.99, unit: "kg", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-9", name: "Russet Potatoes", category: "Produce", brand: "FarmDirect", price: 2.99, unit: "kg", in_stock: 1, rating: 4.4, fallback_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-10", name: "Roma Tomatoes", category: "Produce", brand: "FarmDirect", price: 2.49, unit: "kg", in_stock: 1, rating: 4.5, fallback_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-11", name: "Red Onions", category: "Produce", brand: "FarmDirect", price: 2.20, unit: "kg", in_stock: 1, rating: 4.3, fallback_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-12", name: "Organic Baby Spinach", category: "Produce", brand: "GreenLeaf", price: 2.99, unit: "packet", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80" },

    // Bakery
    { id: "prod-13", name: "Artisan Sourdough Bread", category: "Bakery", brand: "Baker's Choice", price: 4.50, unit: "loaf", in_stock: 1, rating: 4.9, fallback_url: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-14", name: "Whole Grain Multigrain Bread", category: "Bakery", brand: "Britannia", price: 3.20, unit: "loaf", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-15", name: "Butter Croissants (4-pack)", category: "Bakery", brand: "LeBakery", price: 5.50, unit: "box", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80" },

    // Beverages
    { id: "prod-16", name: "Natural Spring Water (1L)", category: "Beverages", brand: "PureSpring", price: 1.49, unit: "bottle", in_stock: 1, rating: 4.5, fallback_url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-17", name: "100% Pure Orange Juice", category: "Beverages", brand: "Tropicana", price: 3.89, unit: "bottle", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-18", name: "Classic Ground Coffee (Dark Roast)", category: "Beverages", brand: "Starbucks", price: 8.99, unit: "packet", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-19", name: "Assam Black Tea", category: "Beverages", brand: "Tata", price: 4.20, unit: "box", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80" },

    // Snacks
    { id: "prod-20", name: "Classic Salted Potato Chips", category: "Snacks", brand: "Lays", price: 1.99, unit: "packet", in_stock: 1, rating: 4.4, fallback_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-21", name: "Dark Chocolate 70% Cocoa", category: "Snacks", brand: "Cadbury", price: 3.50, unit: "item", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-22", name: "Oreo Creme Biscuits", category: "Snacks", brand: "Oreo", price: 2.50, unit: "packet", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80" },

    // Household
    { id: "prod-23", name: "Liquid Laundry Detergent (2L)", category: "Household", brand: "Tide", price: 11.99, unit: "bottle", in_stock: 1, rating: 4.8, fallback_url: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-24", name: "Ultra Soft Facial Tissues (3-pack)", category: "Household", brand: "Kleenex", price: 4.99, unit: "box", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80" },

    // Personal Care
    { id: "prod-25", name: "Total Whitening Toothpaste", category: "Personal Care", brand: "Colgate", price: 3.49, unit: "item", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1559591937-e1032b492984?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-26", name: "Herbal Ayurvedic Toothpaste", category: "Personal Care", brand: "Dabur", price: 3.20, unit: "item", in_stock: 1, rating: 4.6, fallback_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-27", name: "Moisturizing Hair Shampoo (400ml)", category: "Personal Care", brand: "Dove", price: 6.99, unit: "bottle", in_stock: 1, rating: 4.7, fallback_url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80" },
    { id: "prod-28", name: "Soft Bristle Toothbrush (2-pack)", category: "Personal Care", brand: "Colgate", price: 2.99, unit: "packet", in_stock: 1, rating: 4.5, fallback_url: "https://images.unsplash.com/photo-1559591937-9750fefd4e5f?auto=format&fit=crop&w=400&q=80" }
  ];

  for (const p of productCatalog) {
    let finalImageUrl = p.fallback_url;
    const localPackagedPath = path.join(ASSETS_DIR, `${p.id}.jpg`);
    const localProducePath = path.join(PRODUCE_DIR, `${p.id}.jpg`);

    if (p.category === "Produce") {
      if (fs.existsSync(localProducePath)) {
        finalImageUrl = `/assets/products/produce/${p.id}.jpg`;
      }
    } else {
      if (fs.existsSync(localPackagedPath)) {
        finalImageUrl = `/assets/products/${p.id}.jpg`;
      } else {
        const downloaded = await downloadOpenFoodFactsImage(p.name, localPackagedPath);
        if (downloaded) {
          finalImageUrl = `/assets/products/${p.id}.jpg`;
        }
      }
    }

    await rawClient.execute({
      sql: `INSERT INTO products (id, name, category, brand, price, unit, in_stock, rating, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.name, p.category, p.brand, p.price, p.unit, p.in_stock, p.rating, finalImageUrl]
    });
  }

  // 3. Purchase History for frequency/recency recommendations (marked as seeded demo data)
  const historyItems = [
    // Frequent items (bought 3+ times)
    { id: "hist-1", item_name: "Whole Milk", category: "Dairy", quantity: 2, unit: "bottle", price: 7.00, purchased_at: daysAgo(2) },
    { id: "hist-2", item_name: "Whole Milk", category: "Dairy", quantity: 2, unit: "bottle", price: 7.00, purchased_at: daysAgo(8) },
    { id: "hist-3", item_name: "Whole Milk", category: "Dairy", quantity: 1, unit: "bottle", price: 3.50, purchased_at: daysAgo(15) },
    { id: "hist-4", item_name: "Whole Wheat Bread", category: "Bakery", quantity: 1, unit: "loaf", price: 2.80, purchased_at: daysAgo(3) },
    { id: "hist-5", item_name: "Whole Wheat Bread", category: "Bakery", quantity: 1, unit: "loaf", price: 2.80, purchased_at: daysAgo(10) },
    { id: "hist-6", item_name: "Whole Wheat Bread", category: "Bakery", quantity: 1, unit: "loaf", price: 2.80, purchased_at: daysAgo(17) },

    // Recency items (bought > 7 days ago, e.g. eggs, olive oil, detergent)
    { id: "hist-7", item_name: "Eggs (Dozen)", category: "Dairy", quantity: 1, unit: "dozen", price: 3.99, purchased_at: daysAgo(12) },
    { id: "hist-8", item_name: "Laundry Detergent", category: "Household", quantity: 1, unit: "bottle", price: 11.99, purchased_at: daysAgo(21) },
    { id: "hist-9", item_name: "Olive Oil", category: "Produce", quantity: 1, unit: "bottle", price: 9.50, purchased_at: daysAgo(25) }
  ];

  for (const h of historyItems) {
    await rawClient.execute({
      sql: `INSERT INTO purchase_history (id, item_name, category, quantity, unit, price, purchased_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [h.id, h.item_name, h.category, h.quantity, h.unit, h.price, h.purchased_at]
    });
  }

  logger.info(`Seeded demo data successfully: ${initialItems.length} list items, ${productCatalog.length} products, ${historyItems.length} history items.`);
}

seed().catch((err: unknown) => {
  logger.error("Error seeding database", err);
  process.exit(1);
});

