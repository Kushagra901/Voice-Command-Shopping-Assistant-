import React from "react";
import type { SuggestionItem, SuggestionReason } from "@voice-shopping/shared";
import { Sparkles, Plus, Clock, Repeat, Sun, ArrowRightLeft } from "lucide-react";
import { CategoryIcon } from "./CategoryIcons.js";

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
    badgeClass: "bg-blue-950/80 text-blue-300 border-blue-800/40",
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
    badgeClass: "bg-purple-950/80 text-purple-300 border-purple-800/40",
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
      <div className="w-full rounded-2xl glass-panel p-4 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Loading Recommendations...
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl glass-panel p-4 border border-slate-800/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recommended for You</h3>
            <p className="text-[11px] text-slate-400">AI picks based on frequency, restock cycle, season & alternatives</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
          {suggestions.length} items
        </span>
      </div>

      {/* Grid of Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {suggestions.map((sug) => {
          const meta = REASON_METADATA[sug.reason] || REASON_METADATA.seasonal;

          return (
            <div
              key={sug.id}
              className="group p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm hover:shadow-indigo-500/5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}>
                    {meta.renderIcon("w-3 h-3")}
                    {meta.label}
                  </span>

                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <CategoryIcon category={sug.category} size={14} />
                    <span className="text-[10px]">{sug.category}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition">
                    {sug.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5 line-clamp-2">
                    {sug.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                {sug.estimatedPrice !== undefined ? (
                  <span className="text-xs font-semibold text-emerald-400">
                    ~${sug.estimatedPrice.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Suggested staple</span>
                )}

                <button
                  type="button"
                  onClick={() => onAddSuggestion(sug)}
                  aria-label={`Add ${sug.name} to shopping list`}
                  className="min-h-[44px] px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to List</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
