import { useState } from "react";
import type { Product, ItemCategory } from "@voice-shopping/shared";
import { Search, Plus, Star, X, Filter } from "lucide-react";
import { CategoryIcon } from "./CategoryIcons.js";
import { motion, AnimatePresence } from "motion/react";

interface ProductSearchProps {
  products: Product[];
  onSearch: (params: { q?: string; category?: string; maxPrice?: number }) => void;
  onAddProduct: (product: Product) => void;
  isLoading?: boolean;
}

const CATEGORIES: ("All" | ItemCategory)[] = [
  "All",
  "Dairy",
  "Produce",
  "Bakery",
  "Beverages",
  "Snacks",
  "Household",
  "Personal Care"
];

const PRICE_FILTERS = [
  { label: "All Prices", value: undefined },
  { label: "Under $3", value: 3 },
  { label: "Under $5", value: 5 },
  { label: "Under $10", value: 10 }
];

export function ProductSearch({
  products,
  onSearch,
  onAddProduct,
  isLoading = false
}: ProductSearchProps) {
  const [query, setQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | ItemCategory>("All");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | undefined>(undefined);
  const [showSeededBanner, setShowSeededBanner] = useState<boolean>(true);

  const triggerSearch = (qVal: string, catVal: "All" | ItemCategory, maxVal?: number) => {
    const params: { q?: string; category?: string; maxPrice?: number } = {};
    if (qVal.trim()) params.q = qVal.trim();
    if (catVal !== "All") params.category = catVal;
    if (maxVal !== undefined) params.maxPrice = maxVal;
    onSearch(params);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    triggerSearch(val, selectedCategory, selectedMaxPrice);
  };

  const handleCategorySelect = (cat: "All" | ItemCategory) => {
    setSelectedCategory(cat);
    triggerSearch(query, cat, selectedMaxPrice);
  };

  const handlePriceSelect = (price?: number) => {
    setSelectedMaxPrice(price);
    triggerSearch(query, selectedCategory, price);
  };

  return (
    <div className="w-full rounded-3xl glass-panel p-5 border border-slate-800/80 space-y-4 shadow-xl">
      {/* Seeded Demo Product Banner */}
      {showSeededBanner && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-sage-500/25 text-slate-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-base flex-shrink-0">📦</span>
            <span>
              <strong className="text-white">Seeded demo catalog:</strong> Showing {products.length || 28} verified demo products — not a live catalog.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSeededBanner(false)}
            aria-label="Dismiss demo catalog notice"
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sage-500/10 flex items-center justify-center text-sage-400 border border-sage-500/20">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Product Catalog Search</h3>
            <p className="text-[11px] text-slate-400">Browse 28+ grocery items with high-res photography</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 text-slate-300 font-medium">
          {products.length} items
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search organic milk, apples, colgate toothpaste..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          aria-label="Search product catalog"
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sage-500/50 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="Clear search input"
            className="p-1 rounded-lg text-slate-400 hover:text-white absolute right-1.5 top-1 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills & Price Filter Row */}
      <div className="space-y-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 min-h-[44px] shadow-sm ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-sage-600 to-sage-700 text-white shadow-sage-950/30"
                  : "bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800/90"
              }`}
            >
              {cat !== "All" && <CategoryIcon category={cat} size={14} />}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Price Constraint Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3" /> Price:
          </span>
          {PRICE_FILTERS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePriceSelect(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer min-h-[44px] flex items-center justify-center ${
                selectedMaxPrice === p.value
                  ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-emerald-900/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-slate-900/70 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 space-y-2">
          <Filter className="w-7 h-7 text-slate-600 mx-auto" />
          <p>No catalog products found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {products.map((prod) => (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-sky-500/40 transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow-sky-500/5 group"
              >
                {/* Product Image Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-inner">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <CategoryIcon category={prod.category} size={22} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-100 truncate">
                      {prod.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      {prod.brand}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold text-sm">${prod.price.toFixed(2)}</span>
                    <span className="text-slate-500">/ {prod.unit}</span>
                    {prod.rating && (
                      <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-semibold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/30">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {prod.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add Button (Tap target >= 44x44px) */}
                <button
                  type="button"
                  onClick={() => onAddProduct(prod)}
                  aria-label={`Add ${prod.name} to list`}
                  className="min-w-[44px] min-h-[44px] rounded-2xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 flex items-center justify-center transition-all active:scale-90 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
