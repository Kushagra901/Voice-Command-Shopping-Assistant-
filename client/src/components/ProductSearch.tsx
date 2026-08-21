import { useState } from "react";
import type { Product, ItemCategory } from "@voice-shopping/shared";
import { Search, Plus, Star, X, Filter } from "lucide-react";
import { CategoryIcon } from "./CategoryIcons.js";

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
    <div className="w-full rounded-2xl glass-panel p-4 border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Product Catalog Search</h3>
            <p className="text-[11px] text-slate-400">Browse verified 20+ item inventory & add directly</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
          {products.length} products
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
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            className="p-1 rounded-lg text-slate-400 hover:text-white absolute right-3 top-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills & Price Filter Row */}
      <div className="space-y-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
                selectedCategory === cat
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat !== "All" && <CategoryIcon category={cat} size={13} />}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Price Constraint Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Price:
          </span>
          {PRICE_FILTERS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePriceSelect(p.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer min-h-[32px] ${
                selectedMaxPrice === p.value
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No catalog products found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-xs text-slate-100 truncate">
                    {prod.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {prod.brand}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-semibold">${prod.price.toFixed(2)}</span>
                  <span>/ {prod.unit}</span>
                  {prod.rating && (
                    <span className="flex items-center gap-0.5 text-amber-400">
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
                className="min-w-[44px] min-h-[44px] rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 flex items-center justify-center transition active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
