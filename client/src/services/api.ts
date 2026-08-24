import type {
  ShoppingItem,
  CreateItemDto,
  UpdateItemDto,
  SuggestionItem,
  Product,
  CategoryDetail,
  HealthStatus,
  ParseCommandResponse
} from "@voice-shopping/shared";
import { localStore } from "./localStore.js";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

/**
 * When no VITE_API_URL is configured, all API paths resolve to the same
 * Firebase Hosting origin, which returns HTML (index.html) for every route.
 * Detect this upfront so we never make a doomed network call.
 */
const hasRemoteBackend = API_BASE.length > 0;

let backendReachable = hasRemoteBackend; // optimistic if URL exists, false if not

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
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

  // Guard against Firebase Hosting returning HTML instead of JSON
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Response is not JSON — likely no backend server at this URL");
  }

  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export const api = {
  getHealth: async (): Promise<HealthStatus> => {
    if (!hasRemoteBackend) return localStore.getHealth();
    try {
      const health = await fetchJson<HealthStatus>("/api/health");
      backendReachable = true;
      return health;
    } catch {
      backendReachable = false;
      return localStore.getHealth();
    }
  },

  getItems: async (): Promise<ShoppingItem[]> => {
    if (!hasRemoteBackend || !backendReachable) return localStore.getItems();
    try {
      return await fetchJson<ShoppingItem[]>("/api/shopping-list");
    } catch {
      backendReachable = false;
      return localStore.getItems();
    }
  },

  addItem: async (dto: CreateItemDto): Promise<ShoppingItem> => {
    if (!hasRemoteBackend || !backendReachable) return localStore.addItem(dto);
    try {
      return await fetchJson<ShoppingItem>("/api/shopping-list", {
        method: "POST",
        body: JSON.stringify(dto)
      });
    } catch {
      backendReachable = false;
      return localStore.addItem(dto);
    }
  },

  updateItem: async (id: string, dto: UpdateItemDto): Promise<ShoppingItem> => {
    if (!hasRemoteBackend || !backendReachable) {
      const updated = localStore.updateItem(id, dto);
      if (!updated) throw new Error("Item not found");
      return updated;
    }
    try {
      return await fetchJson<ShoppingItem>(`/api/shopping-list/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dto)
      });
    } catch {
      backendReachable = false;
      const updated = localStore.updateItem(id, dto);
      if (!updated) throw new Error("Item not found");
      return updated;
    }
  },

  deleteItem: async (id: string): Promise<{ id: string; deleted: boolean }> => {
    if (!hasRemoteBackend || !backendReachable) {
      localStore.deleteItem(id);
      return { id, deleted: true };
    }
    try {
      return await fetchJson<{ id: string; deleted: boolean }>(`/api/shopping-list/${id}`, {
        method: "DELETE"
      });
    } catch {
      backendReachable = false;
      localStore.deleteItem(id);
      return { id, deleted: true };
    }
  },

  parseAndExecuteCommand: async (text: string, execute = true): Promise<ParseCommandResponse> => {
    if (!hasRemoteBackend || !backendReachable) {
      return localStore.parseAndExecuteCommand(text, execute);
    }
    try {
      return await fetchJson<ParseCommandResponse>("/api/shopping-list/parse-command", {
        method: "POST",
        body: JSON.stringify({ text, execute })
      });
    } catch {
      backendReachable = false;
      return localStore.parseAndExecuteCommand(text, execute);
    }
  },

  getSuggestions: async (): Promise<SuggestionItem[]> => {
    if (!hasRemoteBackend || !backendReachable) return localStore.getSuggestions();
    try {
      return await fetchJson<SuggestionItem[]>("/api/suggestions");
    } catch {
      backendReachable = false;
      return localStore.getSuggestions();
    }
  },

  searchProducts: async (params: { q?: string; category?: string; maxPrice?: number; brand?: string }): Promise<Product[]> => {
    if (!hasRemoteBackend || !backendReachable) return localStore.searchProducts(params);
    try {
      const query = new URLSearchParams();
      if (params.q) query.set("q", params.q);
      if (params.category && params.category !== "All") query.set("category", params.category);
      if (params.maxPrice !== undefined) query.set("maxPrice", params.maxPrice.toString());
      if (params.brand) query.set("brand", params.brand);
      return await fetchJson<Product[]>(`/api/products/search?${query.toString()}`);
    } catch {
      backendReachable = false;
      return localStore.searchProducts(params);
    }
  },

  getCategories: async (): Promise<CategoryDetail[]> => {
    if (!hasRemoteBackend || !backendReachable) return localStore.getCategories();
    try {
      return await fetchJson<CategoryDetail[]>("/api/categories");
    } catch {
      backendReachable = false;
      return localStore.getCategories();
    }
  }
};
