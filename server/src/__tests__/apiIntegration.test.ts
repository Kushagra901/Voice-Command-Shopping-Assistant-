import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../app.js";
import { rawClient, initDb } from "../data/db.js";
import type { CategoryDetail, ShoppingItem, Product, SuggestionItem, HealthStatus } from "@voice-shopping/shared";
import type { Express } from "express";
import http from "http";

interface TestResponse<T = unknown> {
  status: number;
  body: {
    success: boolean;
    data: T;
    error?: {
      message: string;
      code: string;
    };
  };
}

// Simple test request helper over native HTTP without extra dependencies
function request<T = unknown>(
  app: Express,
  method: string,
  path: string,
  body?: unknown
): Promise<TestResponse<T>> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;

      const payload = body ? JSON.stringify(body) : undefined;
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            "Content-Type": "application/json",
            ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
          }
        },
        (res) => {
          let data = "";
          res.on("data", chunk => (data += chunk));
          res.on("end", () => {
            server.close();
            try {
              resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
            } catch {
              resolve({
                status: res.statusCode || 500,
                body: { success: false, data: data as unknown as T }
              });
            }
          });
        }
      );

      req.on("error", (err) => {
        server.close();
        reject(err);
      });

      if (payload) req.write(payload);
      req.end();
    });
  });
}

describe("REST API Integration Suite (All Endpoints)", () => {
  let app: Express;

  beforeEach(async () => {
    await initDb();
    await rawClient.execute("DELETE FROM shopping_items;");
    await rawClient.execute("DELETE FROM products;");
    app = createApp();
  });

  it("GET /api/health should return 200 with ApiSuccess envelope", async () => {
    const res = await request<HealthStatus>(app, "GET", "/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
  });

  it("GET /api/shopping-list should return empty array on empty state", async () => {
    const res = await request<ShoppingItem[]>(app, "GET", "/api/shopping-list");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it("POST /api/shopping-list should validate input with Zod and return 201", async () => {
    // Valid item
    const res = await request<ShoppingItem>(app, "POST", "/api/shopping-list", {
      name: "Organic Milk",
      quantity: 2,
      unit: "bottle"
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Organic Milk");
    expect(res.body.data.category).toBe("Dairy");
    expect(res.body.data.quantity).toBe(2);

    // Invalid item (empty name)
    const invalidRes = await request<ShoppingItem>(app, "POST", "/api/shopping-list", {
      name: "",
      quantity: 2
    });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH /api/shopping-list/:id should update item", async () => {
    const createRes = await request<ShoppingItem>(app, "POST", "/api/shopping-list", {
      name: "Apples",
      quantity: 4,
      unit: "item"
    });
    const id = createRes.body.data.id;

    const updateRes = await request<ShoppingItem>(app, "PATCH", `/api/shopping-list/${id}`, {
      quantity: 8,
      isPurchased: true
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.quantity).toBe(8);
    expect(updateRes.body.data.isPurchased).toBe(true);
  });

  it("DELETE /api/shopping-list/:id should delete item", async () => {
    const createRes = await request<ShoppingItem>(app, "POST", "/api/shopping-list", {
      name: "Water",
      quantity: 1
    });
    const id = createRes.body.data.id;

    const delRes = await request<{ id: string; deleted: boolean }>(app, "DELETE", `/api/shopping-list/${id}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const getRes = await request<ShoppingItem[]>(app, "GET", "/api/shopping-list");
    expect(getRes.body.data.length).toBe(0);
  });

  it("POST /api/shopping-list/parse-command should parse and execute voice command", async () => {
    const res = await request<{
      command: { intent: string; itemName: string };
      executed: boolean;
      item: ShoppingItem;
    }>(app, "POST", "/api/shopping-list/parse-command", {
      text: "I want to buy two bottles of water"
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.command.intent).toBe("ADD_ITEM");
    expect(res.body.data.command.itemName).toBe("water");
    expect(res.body.data.executed).toBe(true);
    expect(res.body.data.item.name).toBe("water");
    expect(res.body.data.item.category).toBe("Beverages");
  });

  it("GET /api/suggestions should return smart suggestions", async () => {
    const res = await request<SuggestionItem[]>(app, "GET", "/api/suggestions");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("GET /api/products/search should search catalog", async () => {
    // Seed one product
    await rawClient.execute(
      "INSERT INTO products (id, name, category, brand, price, unit, in_stock, rating) VALUES ('p1', 'Colgate Toothpaste', 'Personal Care', 'Colgate', 3.50, 'item', 1, 4.5);"
    );

    const res = await request<Product[]>(app, "GET", "/api/products/search?q=toothpaste&maxPrice=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]?.brand).toBe("Colgate");
  });

  it("GET /api/categories should return all categories with counts", async () => {
    await request<ShoppingItem>(app, "POST", "/api/shopping-list", { name: "Milk", quantity: 1 });
    await request<ShoppingItem>(app, "POST", "/api/shopping-list", { name: "Apples", quantity: 2 });

    const res = await request<CategoryDetail[]>(app, "GET", "/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const dairy = res.body.data.find(c => c.category === "Dairy");
    const produce = res.body.data.find(c => c.category === "Produce");
    expect(dairy?.itemCount).toBe(1);
    expect(produce?.itemCount).toBe(1);
  });
});
