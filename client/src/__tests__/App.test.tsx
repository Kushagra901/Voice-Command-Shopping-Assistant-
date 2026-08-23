import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App.js";
import { api } from "../services/api.js";

vi.mock("../services/api.js", () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({
      status: "healthy",
      database: "fallback",
      timestamp: new Date().toISOString(),
      uptimeSeconds: 10
    }),
    getItems: vi.fn().mockResolvedValue([]),
    getSuggestions: vi.fn().mockResolvedValue([]),
    searchProducts: vi.fn().mockResolvedValue([]),
    addItem: vi.fn().mockResolvedValue({
      id: "item-new",
      name: "Milk",
      quantity: 1,
      unit: "bottle",
      category: "Dairy",
      isPurchased: false
    }),
    updateItem: vi.fn().mockResolvedValue({
      id: "item-1",
      name: "Milk",
      quantity: 2,
      unit: "bottle",
      category: "Dairy",
      isPurchased: true
    }),
    deleteItem: vi.fn().mockResolvedValue({ id: "item-1", deleted: true }),
    parseAndExecuteCommand: vi.fn().mockResolvedValue({
      command: {
        intent: "ADD_ITEM",
        itemName: "milk",
        quantity: 2,
        unit: "bottle",
        rawText: "add 2 bottles of milk",
        confidence: 0.95
      },
      executed: true,
      message: "Added 2 bottle milk to your list."
    }),
    getCategories: vi.fn().mockResolvedValue([])
  }
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity
      }
    }
  });

describe("App Component UI & Navigation Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("renders voice shopping assistant title and dominant microphone button", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: /voice shopping assistant/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start voice command/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
  });

  it("navigates between main tabs (List, Recommendations, Search, Audit Log)", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Click Recommendations Tab
    const recTab = screen.getByRole("button", { name: /smart recommendations/i });
    fireEvent.click(recTab);
    expect(recTab).toBeInTheDocument();

    // Click Search Tab
    const searchTab = screen.getByRole("button", { name: /catalog search/i });
    fireEvent.click(searchTab);
    expect(screen.getByPlaceholderText(/search organic milk/i)).toBeInTheDocument();

    // Click Audit Log Tab
    const historyTab = screen.getByRole("button", { name: /audit log/i });
    fireEvent.click(historyTab);
    expect(screen.getByText("Command Audit Log")).toBeInTheDocument();
  });

  it("handles manual command input submission", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/type a command/i);
    fireEvent.change(input, { target: { value: "add 2 bottles of milk" } });

    const submitBtn = screen.getByRole("button", { name: /submit text command|send/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.parseAndExecuteCommand).toHaveBeenCalledWith("add 2 bottles of milk", true);
    });
  });

  it("opens Command Palette on Ctrl+K or button click and executes command", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Open via Header Palette button
    const paletteBtn = screen.getByRole("button", { name: /open command palette/i });
    fireEvent.click(paletteBtn);

    // Palette modal dialog should be visible
    const paletteDialog = screen.getByRole("dialog", { name: /command palette/i });
    expect(paletteDialog).toBeInTheDocument();

    // Select Add Milk from palette
    const addMilkOption = screen.getByText("Add Milk");
    fireEvent.click(addMilkOption);

    await waitFor(() => {
      expect(api.parseAndExecuteCommand).toHaveBeenCalledWith("Add 2 bottles of milk", true);
    });
  });

  it("renders shopping list loading skeleton during initial fetch", async () => {
    let resolveItemsPromise: (items: unknown[]) => void;
    const itemsPromise = new Promise((resolve) => {
      resolveItemsPromise = resolve;
    });

    (api.getItems as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(itemsPromise);

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Verify skeleton container is in the document while query is loading
    expect(screen.getByTestId("shopping-list-skeleton")).toBeInTheDocument();

    // Resolve items
    resolveItemsPromise!([]);

    await waitFor(() => {
      expect(screen.getByText("Your shopping list is empty")).toBeInTheDocument();
    });
  });

  it("displays the offline mode banner when disconnected and hides it on reconnect", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // Trigger offline event
    fireEvent(window, new Event("offline"));

    await waitFor(() => {
      expect(screen.getByText("Offline Mode Active")).toBeInTheDocument();
      expect(screen.getByText(/You are working offline/i)).toBeInTheDocument();
    });

    // Trigger online event
    fireEvent(window, new Event("online"));

    await waitFor(() => {
      expect(screen.queryByText("Offline Mode Active")).not.toBeInTheDocument();
    });
  });
});
