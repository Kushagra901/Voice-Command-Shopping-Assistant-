import { useState } from "react";
import type { ShoppingItem, ItemCategory } from "@voice-shopping/shared";
import { CategoryIcon } from "./CategoryIcons.js";
import { Plus, Minus, Trash2, Check, ShoppingBag, Sparkles, Filter, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "./ui/dialog.js";
import { Tooltip } from "./ui/tooltip.js";

interface ShoppingListProps {
  items: ShoppingItem[];
  isLoading?: boolean;
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
  isLoading = false,
  onTogglePurchased,
  onUpdateQuantity,
  onDeleteItem,
  onQuickAdd
}: ShoppingListProps) {
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  if (isLoading) {
    return (
      <div className="w-full space-y-4" data-testid="shopping-list-skeleton">
        {/* Skeleton Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
          <div className="h-9 w-44 rounded-2xl bg-slate-900/70 border border-slate-800/60 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-48 rounded-2xl bg-slate-900/70 border border-slate-800/60 animate-pulse" />
            <div className="h-9 w-32 rounded-2xl bg-slate-900/70 border border-slate-800/60 animate-pulse" />
          </div>
        </div>

        {/* Skeleton Category Sections & Items */}
        <div className="space-y-5">
          <div className="space-y-2.5">
            <div className="h-5 w-24 rounded-lg bg-slate-800/70 animate-pulse" />
            <div className="space-y-2.5">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="h-5 w-28 rounded-lg bg-slate-800/70 animate-pulse" />
            <div className="space-y-2.5">
              {[3, 4].map((n) => (
                <div
                  key={n}
                  className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-semibold">
              {pendingCount} to buy
            </span>
            {completedCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 font-semibold">
                {completedCount} bought
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search query in list */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              placeholder="Filter list items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter shopping list"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
            />
          </div>

          {/* Filter Pills */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[44px] flex items-center justify-center ${
                filterMode === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[44px] flex items-center justify-center ${
                filterMode === "pending" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[44px] flex items-center justify-center ${
                filterMode === "completed" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bought ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full rounded-3xl glass-panel p-8 text-center border border-dashed border-slate-800 space-y-4 my-4 shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-900/60 to-sky-900/40 border border-indigo-500/30 text-indigo-300 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-100">Your shopping list is empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tap the microphone to speak, or tap one of the quick suggestions below to start adding groceries.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onQuickAdd("Whole Milk", "Dairy")}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              + Add Milk
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd("Fresh Apples", "Produce")}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              + Add Apples
            </button>
            <button
              type="button"
              onClick={() => onQuickAdd("Whole Wheat Bread", "Bakery")}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              + Add Bread
            </button>
          </div>
        </motion.div>
      )}

      {/* No matching results in filter */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="w-full rounded-2xl glass-panel p-6 text-center text-xs text-slate-400 space-y-2">
          <Filter className="w-6 h-6 text-slate-500 mx-auto" />
          <p>No items found matching the selected filter or search query.</p>
        </div>
      )}

      {/* Category Grouped Sections */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = groupedByCategory[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <section key={category} className="space-y-2.5" aria-labelledby={`category-heading-${category}`}>
              {/* Category Header */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <CategoryIcon category={category} size={14} />
                </div>
                <h3 id={`category-heading-${category}`} className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {category}
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({categoryItems.length})
                </span>
                <div className="flex-1 h-px bg-slate-800/80 ml-2" />
              </div>

              {/* Items in Category */}
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {categoryItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className={`group w-full rounded-2xl p-3.5 transition-all duration-200 flex items-center justify-between gap-3 border shadow-sm ${
                        item.isPurchased
                          ? "bg-slate-950/40 border-slate-900 text-slate-500"
                          : "glass-card hover:border-indigo-500/40 text-slate-100"
                      }`}
                    >
                      {/* Completion Checkbox (Tap target >= 44x44px) */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Tooltip content={item.isPurchased ? "Mark as pending" : "Mark as purchased"}>
                          <button
                            type="button"
                            onClick={() => onTogglePurchased(item)}
                            aria-label={`Mark ${item.name} as ${item.isPurchased ? "pending" : "purchased"}`}
                            className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-shrink-0 ${
                              item.isPurchased
                                ? "bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 shadow-sm"
                                : "bg-slate-900 border border-slate-700 hover:border-indigo-500 text-transparent hover:text-slate-400"
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </Tooltip>

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
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                                {item.brand}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                            <span className="text-indigo-300">
                              {item.quantity} {item.unit}
                            </span>
                            {item.price !== undefined && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-emerald-400 font-semibold">${item.price.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Actions (Tap targets >= 44x44px) */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 p-0.5 shadow-inner">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item, Math.max(0.5, item.quantity - 1))}
                            aria-label={`Decrease quantity for ${item.name}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                            aria-label={`Increase quantity for ${item.name}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Button (Tap target >= 44x44px) */}
                        <Tooltip content={`Remove ${item.name}`}>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            aria-label={`Delete ${item.name}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/50 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog (shadcn/ui primitive) */}
      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogClose onClose={() => setItemToDelete(null)} />
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
            <AlertCircle className="w-6 h-6" />
          </div>
          <DialogTitle>Remove {itemToDelete?.name}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{itemToDelete?.name}</strong> from your shopping list? You can restore it anytime with the voice command "Undo that".
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setItemToDelete(null)}
            className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (itemToDelete) {
                onDeleteItem(itemToDelete.id);
                setItemToDelete(null);
              }
            }}
            className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
          >
            Remove Item
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
