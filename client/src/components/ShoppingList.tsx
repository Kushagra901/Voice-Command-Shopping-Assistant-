import { useState } from "react";
import type { ShoppingItem, ItemCategory } from "@voice-shopping/shared";
import { CategoryIcon } from "./CategoryIcons.js";
import { Plus, Minus, Trash2, Check, ShoppingBag, Sparkles, Filter } from "lucide-react";

interface ShoppingListProps {
  items: ShoppingItem[];
  onTogglePurchased: (item: ShoppingItem) => void;
  onUpdateQuantity: (item: ShoppingItem, newQuantity: number) => void;
  onDeleteItem: (id: string) => void;
  onQuickAdd: (name: string, category: ItemCategory) => void;
}

const CATEGORY_ORDER: ItemCategory[] = [
  "Dairy",
  "Produce",
  "Bakery",
  "Beverages",
  "Snacks",
  "Household",
  "Personal Care",
  "Other"
];

export function ShoppingList({
  items,
  onTogglePurchased,
  onUpdateQuantity,
  onDeleteItem,
  onQuickAdd
}: ShoppingListProps) {
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter items based on mode and query
  const filteredItems = items.filter((item) => {
    if (filterMode === "pending" && item.isPurchased) return false;
    if (filterMode === "completed" && !item.isPurchased) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by category
  const groupedByCategory = CATEGORY_ORDER.reduce<Record<ItemCategory, ShoppingItem[]>>(
    (acc, cat) => {
      acc[cat] = filteredItems.filter((i) => i.category === cat);
      return acc;
    },
    {
      Dairy: [],
      Produce: [],
      Bakery: [],
      Beverages: [],
      Snacks: [],
      Household: [],
      "Personal Care": [],
      Other: []
    }
  );

  const pendingCount = items.filter((i) => !i.isPurchased).length;
  const completedCount = items.filter((i) => i.isPurchased).length;

  return (
    <div className="w-full space-y-4">
      {/* List Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>Shopping List</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40">
              {pendingCount} to buy
            </span>
            {completedCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                {completedCount} bought
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search query in list */}
          <div className="relative flex-1 sm:w-44">
            <input
              type="text"
              placeholder="Filter list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter shopping list"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer min-h-[32px] ${
                filterMode === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer min-h-[32px] ${
                filterMode === "pending" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("completed")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer min-h-[32px] ${
                filterMode === "completed" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bought ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="w-full rounded-2xl glass-panel p-8 text-center border border-dashed border-slate-800 space-y-4 my-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-semibold text-slate-100">Your shopping list is empty</h3>
            <p className="text-xs text-slate-400">
              Tap the microphone to speak, or click one of the quick suggestions below to start adding groceries.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onQuickAdd("Whole Milk", "Dairy")}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              + Add Milk
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd("Fresh Apples", "Produce")}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              + Add Apples
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd("Whole Wheat Bread", "Bakery")}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              + Add Bread
            </button>
          </div>
        </div>
      )}

      {/* No matching results in filter */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="w-full rounded-2xl glass-panel p-6 text-center text-xs text-slate-400 space-y-2">
          <Filter className="w-6 h-6 text-slate-500 mx-auto" />
          <p>No items found matching the selected filter or search query.</p>
        </div>
      )}

      {/* Category Grouped Sections */}
      <div className="space-y-5">
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = groupedByCategory[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="space-y-2" aria-labelledby={`category-heading-${category}`}>
              {/* Category Header */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <CategoryIcon category={category} size={15} />
                </div>
                <h3 id={`category-heading-${category}`} className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {category}
                </h3>
                <span className="text-[11px] font-medium text-slate-500">
                  ({categoryItems.length})
                </span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>

              {/* Items in Category */}
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group w-full rounded-2xl p-3.5 transition-all duration-200 flex items-center justify-between gap-3 border ${
                      item.isPurchased
                        ? "bg-slate-950/40 border-slate-900 text-slate-500"
                        : "glass-panel border-slate-800/80 hover:border-indigo-500/30 text-slate-100 shadow-sm"
                    }`}
                  >
                    {/* Completion Checkbox (Tap target >= 44x44px) */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onTogglePurchased(item)}
                        aria-label={`Mark ${item.name} as ${item.isPurchased ? "pending" : "purchased"}`}
                        className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          item.isPurchased
                            ? "bg-emerald-950/80 border border-emerald-800/60 text-emerald-400"
                            : "bg-slate-900 border border-slate-700 hover:border-indigo-500 text-transparent hover:text-slate-400"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      {/* Item Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-sm truncate ${
                              item.isPurchased ? "line-through text-slate-500" : "text-slate-100"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                              {item.brand}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          {item.price !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400/90">${item.price.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Actions (Tap targets >= 44x44px) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item, Math.max(0.5, item.quantity - 1))}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Delete Button (Tap target >= 44x44px) */}
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
