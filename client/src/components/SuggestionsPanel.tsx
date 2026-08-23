import React from "react";
import type { SuggestionItem, SuggestionReason } from "@voice-shopping/shared";
import { Plus, Clock, Repeat, Sun, ArrowRightLeft, ArrowRight, Heart } from "lucide-react";
import { CategoryIcon } from "./CategoryIcons.js";
import { motion, AnimatePresence } from "motion/react";

interface SuggestionsPanelProps {
  suggestions: SuggestionItem[];
  onAddSuggestion: (suggestion: SuggestionItem) => void;
  isLoading?: boolean;
}

interface ReasonMeta {
  label: string;
  badgeClass: string;
  renderIcon: (className?: string) => React.ReactNode;
}

const REASON_METADATA: Record<SuggestionReason, ReasonMeta> = {
  frequency: {
    label: "Frequent Buy",
    badgeClass: "bg-[#E8F5E9] text-[#0C2B21] border-[#C8E6C9]",
    renderIcon: (className = "w-3 h-3") => <Repeat className={className} />
  },
  recency: {
    label: "Restock Alert",
    badgeClass: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
    renderIcon: (className = "w-3 h-3") => <Clock className={className} />
  },
  seasonal: {
    label: "Seasonal Pick",
    badgeClass: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
    renderIcon: (className = "w-3 h-3") => <Sun className={className} />
  },
  substitute: {
    label: "Alternative",
    badgeClass: "bg-[#FBE9E7] text-[#D84315] border-[#FFCCBC]",
    renderIcon: (className = "w-3 h-3") => <ArrowRightLeft className={className} />
  }
};

export function SuggestionsPanel({
  suggestions,
  onAddSuggestion,
  isLoading = false
}: SuggestionsPanelProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-44 rounded-[28px] bg-emerald-50/70 border border-emerald-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 rounded-[24px] bg-white border border-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Exclusive Offers Banner matching Insightlancer screenshot */}
      <section aria-labelledby="exclusive-offers-heading" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 id="exclusive-offers-heading" className="text-lg font-bold text-slate-900 tracking-tight">
            Exclusive Offers
          </h2>
          <button type="button" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition cursor-pointer">
            See All
          </button>
        </div>

        <div className="w-full rounded-[28px] bg-gradient-to-r from-[#F2F8F4] via-[#EAF4ED] to-[#FFF9F0] border border-emerald-200/60 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden shadow-sm">
          <div className="space-y-3 max-w-sm z-10">
            <span className="inline-flex items-center text-[11px] font-extrabold px-3 py-1 rounded-full bg-white text-[#0C2B21] border border-emerald-200 shadow-xs">
              Exclusive Offer
            </span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Get <span className="text-emerald-700">Special Offers</span> Up to <span className="text-2xl sm:text-3xl font-black">30%</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Smart recommendations based on your grocery habits & seasonal harvest
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (suggestions[0]) onAddSuggestion(suggestions[0]);
              }}
              className="px-5 py-2.5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Banner Graphic Illustration */}
          <div className="relative z-10 flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=360&q=80"
              alt="Fresh Organic Vegetables"
              className="w-40 h-32 sm:w-48 sm:h-36 rounded-2xl object-cover shadow-md border-2 border-white"
            />
          </div>

          {/* Decorative Pagination Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0C2B21]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </section>

      {/* 2. Recommendation Cards Grid matching Insightlancer screenshot */}
      <section aria-labelledby="smart-ideas-heading" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 id="smart-ideas-heading" className="text-lg font-bold text-slate-900 tracking-tight">
              Featured Recommendations
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {suggestions.length} items
            </span>
          </div>
          <button type="button" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition cursor-pointer">
            See All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((sug, index) => {
              const meta = REASON_METADATA[sug.reason] || REASON_METADATA.seasonal;

              return (
                <motion.div
                  key={sug.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="grocery-card p-4 sm:p-5 flex flex-col justify-between gap-3.5 bg-white"
                >
                  <div className="space-y-2.5">
                    {/* Top Tag & Heart Bookmark */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
                        {meta.renderIcon("w-3 h-3")}
                        {meta.label}
                      </span>

                      <button
                        type="button"
                        aria-label="Add to wishlist"
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition cursor-pointer"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Category & Title */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <CategoryIcon category={sug.category} size={13} />
                        <span>{sug.category}</span>
                        <span>•</span>
                        <span className="text-amber-500 font-bold">★ 4.9 (1.3K)</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                        {sug.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-snug mt-1 line-clamp-2">
                        {sug.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Add to List Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Price</span>
                      <span className="text-base font-black text-[#0C2B21]">
                        ${sug.estimatedPrice ? sug.estimatedPrice.toFixed(2) : "2.55"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddSuggestion(sug)}
                      aria-label={`Add ${sug.name} to shopping list`}
                      className="min-h-[42px] px-4 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/30"
                    >
                      <Plus className="w-4 h-4 text-lime-400" />
                      <span>Add to List</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}


