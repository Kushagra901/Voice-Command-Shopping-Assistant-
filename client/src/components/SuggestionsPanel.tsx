import React from "react";
import type { SuggestionItem, SuggestionReason } from "@voice-shopping/shared";
import { Sparkles, Plus, Clock, Repeat, Sun, ArrowRightLeft } from "lucide-react";
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
    badgeClass: "bg-sky-950/80 text-sky-300 border-sky-800/40",
    renderIcon: (className = "w-3 h-3") => <Repeat className={className} />
  },
  recency: {
    label: "Restock Alert",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-800/40",
    renderIcon: (className = "w-3 h-3") => <Clock className={className} />
  },
  seasonal: {
    label: "Seasonal Pick",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-800/40",
    renderIcon: (className = "w-3 h-3") => <Sun className={className} />
  },
  substitute: {
    label: "Smart Alternative",
    badgeClass: "bg-terracotta-950/80 text-terracotta-300 border-terracotta-800/40",
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
      <div className="w-full rounded-3xl glass-panel p-5 border border-slate-800/80 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-sage-400 animate-spin" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Loading Recommendations...
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-3xl glass-panel p-5 border border-slate-800/80 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sage-500/10 flex items-center justify-center text-sage-400 border border-sage-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recommended for You</h3>
            <p className="text-[11px] text-slate-400">Based on seeded demo purchase history, frequency, seasons & substitutes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sage-950/90 text-sage-300 border border-sage-800/40 font-semibold">
            Seeded Demo History
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
            {suggestions.length} items
          </span>
        </div>
      </div>

      {/* Grid of Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
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
                className="group p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-sage-500/40 transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm hover:shadow-sage-950/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shadow-sm ${meta.badgeClass}`}>
                      {meta.renderIcon("w-3 h-3")}
                      {meta.label}
                    </span>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-950/60 px-2 py-0.5 rounded-lg border border-slate-800/60">
                      <CategoryIcon category={sug.category} size={13} />
                      <span className="text-[10px] font-medium">{sug.category}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-sage-200 transition">
                      {sug.name}
                    </h4>
                    <p className="text-xs text-slate-400 leading-snug mt-1 line-clamp-2">
                      {sug.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
                  {sug.estimatedPrice !== undefined ? (
                    <span className="text-xs font-bold text-emerald-400">
                      ~${sug.estimatedPrice.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Suggested staple</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onAddSuggestion(sug)}
                    aria-label={`Add ${sug.name} to shopping list`}
                    className="min-h-[44px] px-3.5 rounded-xl bg-sage-600/20 hover:bg-sage-600 border border-sage-500/30 hover:border-sage-500 text-sage-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500/50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to List</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
