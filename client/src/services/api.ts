import type {
  ApiSuccess,
  ShoppingItem,
  CreateItemDto,
  UpdateItemDto,
  SuggestionItem,
  Product,
  CategoryDetail,
  HealthStatus,
  ParseCommandResponse
} from "@voice-shopping/shared";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    let errorMessage = `HTTP error! status: ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error && errJson.error.message) {
        errorMessage = errJson.error.message;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  const json = (await res.json()) as ApiSuccess<T>;
  return json.data;
}

export const api = {
  getHealth: () => fetchJson<HealthStatus>("/api/health"),

  getItems: () => fetchJson<ShoppingItem[]>("/api/shopping-list"),

  addItem: (dto: CreateItemDto) =>
    fetchJson<ShoppingItem>("/api/shopping-list", {
      method: "POST",
      body: JSON.stringify(dto)
    }),

  updateItem: (id: string, dto: UpdateItemDto) =>
    fetchJson<ShoppingItem>(`/api/shopping-list/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto)
    }),

  deleteItem: (id: string) =>
    fetchJson<{ id: string; deleted: boolean }>(`/api/shopping-list/${id}`, {
      method: "DELETE"
    }),

  parseAndExecuteCommand: (text: string, execute = true) =>
    fetchJson<ParseCommandResponse>("/api/shopping-list/parse-command", {
      method: "POST",
      body: JSON.stringify({ text, execute })
    }),

  getSuggestions: () => fetchJson<SuggestionItem[]>("/api/suggestions"),

  searchProducts: (params: { q?: string; category?: string; maxPrice?: number; brand?: string }) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.category && params.category !== "All") query.set("category", params.category);
    if (params.maxPrice !== undefined) query.set("maxPrice", params.maxPrice.toString());
    if (params.brand) query.set("brand", params.brand);
    return fetchJson<Product[]>(`/api/products/search?${query.toString()}`);
  },

  getCategories: () => fetchJson<CategoryDetail[]>("/api/categories")
};
