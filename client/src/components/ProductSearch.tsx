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
    <div className="w-full rounded-[28px] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5">
      {/* Seeded Demo Product Banner */}
      {showSeededBanner && (
        <div className="p-3.5 rounded-2xl bg-[#E8F5E9] border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base flex-shrink-0">📦</span>
            <span>
              <strong className="text-emerald-900 font-bold">Verified catalog:</strong> Showing {products.length} grocery items with verified high-res imagery.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSeededBanner(false)}
            aria-label="Dismiss demo catalog notice"
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-full hover:bg-emerald-200/60 transition min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Catalog Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Product Catalog Search</h2>
            <p className="text-xs text-slate-500">Search by name, brand, aisle, or maximum price</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search organic milk, fresh apples, colgate toothpaste, coffee..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          aria-label="Search product catalog"
          className="w-full pl-10 pr-10 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="Clear search input"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 absolute right-2 top-2 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills & Price Filter Row */}
      <div className="space-y-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                selectedCategory === cat
                  ? "bg-[#0C2B21] text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat !== "All" && <CategoryIcon category={cat} size={13} />}
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Price Constraint Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider">
            <Filter className="w-3 h-3 text-slate-400" /> Price:
          </span>
          {PRICE_FILTERS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePriceSelect(p.value)}
              className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center shadow-xs active:scale-95 ${
                selectedMaxPrice === p.value
                  ? "bg-lime-500 text-[#0C2B21] font-black shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Filter className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No products found matching your search</p>
          <p className="text-xs text-slate-400">Try searching for milk, bread, apples, or clearing active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {products.map((prod) => (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="grocery-card p-4 flex flex-col justify-between gap-3 bg-white"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                      {prod.category}
                    </span>
                    {prod.rating && (
                      <span className="flex items-center gap-0.5 text-amber-600 text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {prod.rating}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-xs">
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

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight leading-snug line-clamp-1">
                        {prod.name}
                      </h3>
                      {prod.brand && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold inline-block mt-0.5">
                          {prod.brand}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-[#0C2B21]">${prod.price.toFixed(2)}</span>
                      <span className="text-[11px] text-slate-400">/ {prod.unit}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddProduct(prod)}
                    aria-label={`Add ${prod.name} to shopping list`}
                    className="min-h-[38px] px-3.5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-lime-400" />
                    <span>Add</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
