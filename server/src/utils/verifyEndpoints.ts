import { createApp } from "../app.js";
import http from "http";

interface EndpointTest {
  method: string;
  path: string;
  body?: unknown;
  description: string;
}

const tests: EndpointTest[] = [
  {
    method: "GET",
    path: "/api/health",
    description: "1. Health Check"
  },
  {
    method: "GET",
    path: "/api/shopping-list",
    description: "2. Get Shopping List"
  },
  {
    method: "POST",
    path: "/api/shopping-list",
    body: { name: "Whole Milk", quantity: 2, unit: "bottle" },
    description: "3. Add Item (Testing Duplicate Quantity Merging with item-1 Whole Milk)"
  },
  {
    method: "PATCH",
    path: "/api/shopping-list/item-2",
    body: { quantity: 10, isPurchased: true },
    description: "4. Update Item (item-2 Fresh Apples)"
  },
  {
    method: "POST",
    path: "/api/shopping-list/parse-command",
    body: { text: "2 packet doodh add karo" },
    description: "5. Voice Command Parse & Execute (Hinglish)"
  },
  {
    method: "GET",
    path: "/api/suggestions",
    description: "6. Smart Recommendations (Frequency, Recency, Seasonal, Substitutes)"
  },
  {
    method: "GET",
    path: "/api/products/search?q=toothpaste&maxPrice=5",
    description: "7. Product Catalog Search with Price Filter"
  },
  {
    method: "GET",
    path: "/api/categories",
    description: "8. Categories with Dynamic Item Counts"
  },
  {
    method: "DELETE",
    path: "/api/shopping-list/item-4",
    description: "9. Delete Item (item-4 Sparkling Water)"
  }
];

async function runTranscript(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 3001;

  console.log("===============================================================");
  console.log("           LIVE BACKEND ENDPOINT VERIFICATION TRANSCRIPT        ");
  console.log("===============================================================\n");

  for (const t of tests) {
    const payload = t.body ? JSON.stringify(t.body) : undefined;
    const res = await new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: t.path,
          method: t.method,
          headers: {
            "Content-Type": "application/json",
            ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
          }
        },
        (r) => {
          let data = "";
          r.on("data", chunk => (data += chunk));
          r.on("end", () => {
            try {
              resolve({ status: r.statusCode || 500, body: JSON.parse(data) });
            } catch {
              resolve({ status: r.statusCode || 500, body: data });
            }
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });

    console.log(`### ${t.description}`);
    console.log(`> ${t.method} http://localhost:3001${t.path}`);
    if (t.body) {
      console.log(`> Request Body: ${JSON.stringify(t.body)}`);
    }
    console.log(`< HTTP/1.1 ${res.status}`);
    console.log(`< Response Payload:`);
    console.log(JSON.stringify(res.body, null, 2));
    console.log("\n---------------------------------------------------------------\n");
  }

  server.close();
}

runTranscript().catch(console.error);
