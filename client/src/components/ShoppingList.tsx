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

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=80";

const ITEM_IMAGES: Record<string, string> = {
  milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
  paneer: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80",
  butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80",
  yogurt: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80",
  cheese: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80",
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80",
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80",
  onion: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80",
  spinach: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80",
  carrot: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80",
  orange: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&q=80",
  garlic: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=400&q=80",
  ginger: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80",
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
  water: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80",
  juice: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80",
  coffee: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80",
  tea: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80",
  soda: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80",
  chips: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80",
  chocolate: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80",
  biscuit: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80",
  detergent: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80",
  tissue: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80",
  toothpaste: "https://images.unsplash.com/photo-1559591937-e1032b492984?auto=format&fit=crop&w=400&q=80",
  shampoo: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80",
  egg: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
  flour: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80"
};

function getItemImage(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes("milk") || n.includes("doodh") || n.includes("dudh")) return ITEM_IMAGES.milk ?? DEFAULT_IMAGE;
  if (n.includes("paneer") || n.includes("cottage cheese")) return ITEM_IMAGES.paneer ?? DEFAULT_IMAGE;
  if (n.includes("butter") || n.includes("makhan") || n.includes("makkhan")) return ITEM_IMAGES.butter ?? DEFAULT_IMAGE;
  if (n.includes("curd") || n.includes("dahi") || n.includes("yogurt")) return ITEM_IMAGES.yogurt ?? DEFAULT_IMAGE;
  if (n.includes("cheese")) return ITEM_IMAGES.cheese ?? DEFAULT_IMAGE;
  if (n.includes("apple") || n.includes("seb") || n.includes("saeb")) return ITEM_IMAGES.apple ?? DEFAULT_IMAGE;
  if (n.includes("banana") || n.includes("kela") || n.includes("kele")) return ITEM_IMAGES.banana ?? DEFAULT_IMAGE;
  if (n.includes("potato") || n.includes("aloo") || n.includes("aalu")) return ITEM_IMAGES.potato ?? DEFAULT_IMAGE;
  if (n.includes("tomato") || n.includes("tamatar")) return ITEM_IMAGES.tomato ?? DEFAULT_IMAGE;
  if (n.includes("onion") || n.includes("pyaz") || n.includes("pyaaz") || n.includes("kanda")) return ITEM_IMAGES.onion ?? DEFAULT_IMAGE;
  if (n.includes("spinach") || n.includes("palak")) return ITEM_IMAGES.spinach ?? DEFAULT_IMAGE;
  if (n.includes("carrot") || n.includes("gajar")) return ITEM_IMAGES.carrot ?? DEFAULT_IMAGE;
  if (n.includes("orange") || n.includes("santra")) return ITEM_IMAGES.orange ?? DEFAULT_IMAGE;
  if (n.includes("garlic") || n.includes("lahsun")) return ITEM_IMAGES.garlic ?? DEFAULT_IMAGE;
  if (n.includes("ginger") || n.includes("adrak")) return ITEM_IMAGES.ginger ?? DEFAULT_IMAGE;
  if (n.includes("croissant")) return ITEM_IMAGES.croissant ?? DEFAULT_IMAGE;
  if (n.includes("cake") || n.includes("muffin")) return ITEM_IMAGES.cake ?? DEFAULT_IMAGE;
  if (n.includes("bread") || n.includes("bun") || n.includes("loaf") || n.includes("sourdough") || n.includes("pav") || n.includes("toast")) return ITEM_IMAGES.bread ?? DEFAULT_IMAGE;
  if (n.includes("water") || n.includes("paani") || n.includes("pani")) return ITEM_IMAGES.water ?? DEFAULT_IMAGE;
  if (n.includes("juice")) return ITEM_IMAGES.juice ?? DEFAULT_IMAGE;
  if (n.includes("coffee") || n.includes("espresso")) return ITEM_IMAGES.coffee ?? DEFAULT_IMAGE;
  if (n.includes("tea") || n.includes("chai") || n.includes("chay")) return ITEM_IMAGES.tea ?? DEFAULT_IMAGE;
  if (n.includes("soda") || n.includes("cola") || n.includes("pepsi") || n.includes("coke")) return ITEM_IMAGES.soda ?? DEFAULT_IMAGE;
  if (n.includes("chip") || n.includes("wafers") || n.includes("lays") || n.includes("namkeen")) return ITEM_IMAGES.chips ?? DEFAULT_IMAGE;
  if (n.includes("chocolate") || n.includes("cocoa") || n.includes("cadbury")) return ITEM_IMAGES.chocolate ?? DEFAULT_IMAGE;
  if (n.includes("biscuit") || n.includes("cookie") || n.includes("oreo")) return ITEM_IMAGES.biscuit ?? DEFAULT_IMAGE;
  if (n.includes("detergent") || n.includes("tide") || n.includes("laundry") || n.includes("cleaner")) return ITEM_IMAGES.detergent ?? DEFAULT_IMAGE;
  if (n.includes("tissue") || n.includes("kleenex") || n.includes("napkin")) return ITEM_IMAGES.tissue ?? DEFAULT_IMAGE;
  if (n.includes("toothpaste") || n.includes("colgate") || n.includes("toothbrush")) return ITEM_IMAGES.toothpaste ?? DEFAULT_IMAGE;
  if (n.includes("shampoo") || n.includes("dove") || n.includes("soap")) return ITEM_IMAGES.shampoo ?? DEFAULT_IMAGE;
  if (n.includes("egg") || n.includes("anda") || n.includes("ande")) return ITEM_IMAGES.egg ?? DEFAULT_IMAGE;
  if (n.includes("rice") || n.includes("chawal")) return ITEM_IMAGES.rice ?? DEFAULT_IMAGE;
  if (n.includes("flour") || n.includes("atta") || n.includes("aata")) return ITEM_IMAGES.flour ?? DEFAULT_IMAGE;
  if (n.includes("oil") || n.includes("tel")) return ITEM_IMAGES.oil ?? DEFAULT_IMAGE;

  if (category === "Produce") return ITEM_IMAGES.apple ?? DEFAULT_IMAGE;
  if (category === "Dairy") return ITEM_IMAGES.milk ?? DEFAULT_IMAGE;
  if (category === "Bakery") return ITEM_IMAGES.bread ?? DEFAULT_IMAGE;
  if (category === "Beverages") return ITEM_IMAGES.juice ?? DEFAULT_IMAGE;
  if (category === "Snacks") return ITEM_IMAGES.chips ?? DEFAULT_IMAGE;
  if (category === "Household") return ITEM_IMAGES.detergent ?? DEFAULT_IMAGE;
  if (category === "Personal Care") return ITEM_IMAGES.toothpaste ?? DEFAULT_IMAGE;
  return DEFAULT_IMAGE;
}

export function ShoppingList({
  items,
  isLoading = false,
  onTogglePurchased,
  onUpdateQuantity,
  onDeleteItem,
  onQuickAdd
}: ShoppingListProps) {
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>("Produce");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);

  if (isLoading) {
    return (
      <div className="w-full space-y-4" data-testid="shopping-list-skeleton" role="status" aria-label="Loading shopping list items">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-slate-200 animate-pulse rounded-full" />
          <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100 p-4" />
          ))}
        </div>
      </div>
    );
  }

  // Filter items based on mode and category
  const filteredItems = items.filter((item) => {
    if (filterMode === "pending" && item.isPurchased) return false;
    if (filterMode === "completed" && !item.isPurchased) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
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
    <div className="w-full space-y-6">
      {/* 1. Explore Categories Horizontal Selector matching Insightlancer screenshot */}
      <section aria-labelledby="explore-categories-heading" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 id="explore-categories-heading" className="text-lg font-bold text-slate-900 tracking-tight">
            Explore Categories
          </h2>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
          >
            See All
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`min-h-[42px] px-4 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
              selectedCategory === "all"
                ? "bg-[#0C2B21] text-white shadow-md"
                : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <CategoryIcon category="Produce" size={14} />
            <span>All Items</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${selectedCategory === "all" ? "bg-lime-400 text-[#0C2B21]" : "bg-slate-100 text-slate-600"}`}>
              {items.length}
            </span>
          </button>

          {CATEGORY_ORDER.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                className={`min-h-[42px] px-4 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? "bg-[#0C2B21] text-white shadow-md"
                    : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <CategoryIcon category={cat} size={14} />
                <span>{cat} Aisle</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-lime-400 text-[#0C2B21]" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Featured Products / Shopping List Toolbar */}
      <section aria-labelledby="featured-products-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
          <div>
            <h2 id="featured-products-heading" className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Shopping List</span>
              <span className="text-xs px-3 py-1 rounded-full bg-[#E8F5E9] text-[#0C2B21] border border-emerald-200 font-bold shadow-xs">
                {pendingCount} to buy
              </span>
              {completedCount > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                  {completedCount} bought
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="inline-flex rounded-full bg-white border border-slate-200 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center justify-center ${
                  filterMode === "all" ? "bg-[#0C2B21] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center justify-center ${
                  filterMode === "pending" ? "bg-[#0C2B21] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("completed")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer min-h-[38px] flex items-center justify-center ${
                  filterMode === "completed" ? "bg-[#0C2B21] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bought ({completedCount})
              </button>
            </div>

            {/* Add Custom Item Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              aria-label="Add custom grocery item"
              className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-lime-400" />
              <span>+ Add Item</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full rounded-[28px] bg-white p-8 sm:p-10 text-center border border-dashed border-emerald-200 space-y-4 my-2 shadow-sm"
          >
            <div className="w-18 h-18 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-bold text-slate-900">Your shopping list is empty</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Tap the microphone below to speak, or tap one of the quick suggestions below to start adding groceries.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onQuickAdd("Whole Milk", "Dairy")}
                className="min-h-[42px] px-4 py-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                + Add Milk
              </button>
              <button
                type="button"
                onClick={() => onQuickAdd("Fresh Apples", "Produce")}
                className="min-h-[42px] px-4 py-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                + Add Apples
              </button>
              <button
                type="button"
                onClick={() => onQuickAdd("Whole Wheat Bread", "Bakery")}
                className="min-h-[42px] px-4 py-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                + Add Bread
              </button>
            </div>
          </motion.div>
        )}

        {/* No matching results in filter */}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="w-full rounded-[24px] bg-white p-8 text-center text-xs text-slate-400 space-y-2 border border-slate-100">
            <Filter className="w-6 h-6 text-slate-400 mx-auto" />
            <p>No items found matching the selected filter or search query.</p>
          </div>
        )}

        {/* Category Grouped Sections & Cards Grid matching Insightlancer screenshot */}
        <div className="space-y-6">
          {CATEGORY_ORDER.map((category) => {
            const categoryItems = groupedByCategory[category] || [];
            if (categoryItems.length === 0) return null;

            return (
              <section key={category} className="space-y-3" aria-labelledby={`category-heading-${category}`}>
                {/* Category Header */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <CategoryIcon category={category} size={14} />
                  </div>
                  <h3 id={`category-heading-${category}`} className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {category}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {categoryItems.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/70 ml-2" />
                </div>

                {/* Grid of Grocery Cards matching Screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {categoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className={`grocery-card p-4 sm:p-5 flex flex-col justify-between gap-3 bg-white ${
                          item.isPurchased ? "opacity-75 bg-slate-50/80" : ""
                        }`}
                      >
                        {/* Top Discount Tag & Delete/Wishlist */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                              item.isPurchased
                                ? "bg-slate-200 text-slate-600"
                                : "bg-[#E8F5E9] text-[#2E7D32]"
                            }`}
                          >
                            {item.isPurchased ? "Bought" : "15% OFF"}
                          </span>

                          <div className="flex items-center gap-1">
                            <Tooltip content={`Remove ${item.name}`}>
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                aria-label={`Delete ${item.name}`}
                                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Product Visual Image + Name & Rating */}
                        <div className="flex items-center gap-3.5">
                          <img
                            src={getItemImage(item.name, item.category)}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xs border border-slate-100 flex-shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                              <span>Dept: {item.category}</span>
                              <span>•</span>
                              <span className="text-amber-500 font-bold">★ 4.9 (1.3K)</span>
                            </div>

                            <h4
                              className={`text-base font-black tracking-tight leading-snug mt-0.5 truncate ${
                                item.isPurchased ? "line-through text-slate-400" : "text-slate-900"
                              }`}
                            >
                              {item.name}
                            </h4>

                            {item.brand && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold inline-block mt-0.5">
                                {item.brand}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Price & Quantity Controls */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
                            <span className="text-base font-black text-[#0C2B21]">
                              ${item.price ? item.price.toFixed(2) : "2.55"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quantity Stepper */}
                            <div className="flex items-center rounded-full bg-slate-100 p-0.5">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item, Math.max(0.5, item.quantity - 1))}
                                aria-label={`Decrease quantity for ${item.name}`}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-700 hover:bg-white hover:shadow-xs transition cursor-pointer active:scale-95"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-black text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item, item.quantity + 1)}
                                aria-label={`Increase quantity for ${item.name}`}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-700 hover:bg-white hover:shadow-xs transition cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Mark as Purchased Checkbox */}
                            <Tooltip content={item.isPurchased ? "Mark as pending" : "Mark as purchased"}>
                              <button
                                type="button"
                                onClick={() => onTogglePurchased(item)}
                                aria-label={`Mark ${item.name} as ${item.isPurchased ? "pending" : "purchased"}`}
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                  item.isPurchased
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-[#0C2B21] text-white hover:bg-emerald-950 shadow-xs"
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* Add Custom Item Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogClose onClose={() => setIsAddModalOpen(false)} />
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <DialogTitle>Add Grocery Item</DialogTitle>
          <DialogDescription>
            Enter the details of the grocery item you would like to add to your list.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newItemName.trim()) return;
            onQuickAdd(newItemName.trim(), newItemCategory);
            setNewItemName("");
            setNewItemQuantity(1);
            setIsAddModalOpen(false);
          }}
          className="space-y-4 py-2"
        >
          <div>
            <label htmlFor="modal-item-name" className="block text-xs font-bold text-slate-700 mb-1">
              Item Name *
            </label>
            <input
              id="modal-item-name"
              type="text"
              required
              placeholder="e.g. Organic Almond Milk, Basmati Rice"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-category" className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="modal-category"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-quantity" className="block text-xs font-bold text-slate-700 mb-1">
                Quantity
              </label>
              <input
                id="modal-quantity"
                type="number"
                min="0.1"
                step="any"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="min-h-[42px] px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
            >
              Add to Shopping List
            </button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogClose onClose={() => setItemToDelete(null)} />
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-1">
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
            className="min-h-[42px] px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
            className="min-h-[42px] px-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
          >
            Remove Item
          </button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}


