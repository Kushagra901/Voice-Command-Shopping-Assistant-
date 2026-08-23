import { Bell, Search, Activity, CheckCircle2, AlertCircle, Database, ListOrdered, Sparkles, History, SlidersHorizontal, ShoppingBag } from "lucide-react";
import type { HealthStatus } from "@voice-shopping/shared";

interface HeaderProps {
  activeTab: "list" | "suggestions" | "search" | "history";
  onTabChange: (tab: "list" | "suggestions" | "search" | "history") => void;
  health?: HealthStatus | undefined;
  isHealthLoading: boolean;
  isHealthError: boolean;
  totalListCount: number;
  suggestionsCount: number;
  onOpenCommandPalette?: () => void;
  onSearchInput?: (query: string) => void;
}

export function Header({
  activeTab,
  onTabChange,
  health,
  isHealthLoading,
  isHealthError,
  totalListCount,
  suggestionsCount,
  onOpenCommandPalette
}: HeaderProps) {
  return (
    <header className="w-full rounded-[32px] bg-[#0C2B21] text-white p-5 sm:p-6 space-y-4 shadow-xl border border-emerald-900/30">
      {/* Top Bar: Brand Logo & Status Indicators */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-lime-400 shadow-sm flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
              Voice Grocery
            </h1>
            <p className="text-[11px] text-emerald-300/80 font-medium">
              Smart Shopping Assistant
            </p>
          </div>
        </div>


        {/* Status Indicators & Notification Bell */}
        <div className="flex items-center gap-2">
          {/* Health status pill */}
          {isHealthLoading ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/10 text-slate-300 font-medium">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Connecting...
            </span>
          ) : isHealthError ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-rose-950/80 text-rose-300 border border-rose-800/60 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Offline
            </span>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/40 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                API Healthy
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-white/10 text-emerald-200 border border-white/10 font-semibold">
                <Database className="w-3 h-3 text-amber-400" />
                {health?.database === "connected" ? "Turso Cloud" : "Local libSQL"}
              </span>
            </div>
          )}

          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer border border-white/10 relative active:scale-95"
          >
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-lime-400" />
          </button>
        </div>
      </div>

      {/* Hero Welcome & Title (Accessible H1) */}
      <div className="sr-only">
        <h1>Voice Shopping Assistant</h1>
      </div>

      {/* Pill Search & Command Bar matching Insightlancer screenshot */}
      <div className="relative">
        <div
          onClick={onOpenCommandPalette}
          className="w-full bg-white rounded-full p-1.5 pl-4 flex items-center justify-between shadow-lg cursor-pointer group hover:ring-2 hover:ring-lime-400/50 transition-all"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#0C2B21] transition" />
            <span className="text-xs sm:text-sm text-slate-400 font-medium truncate">
              Search Products, Store, or Voice command...
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCommandPalette();
                }}
                aria-label="Open Command Palette (Ctrl+K)"
                className="w-9 h-9 rounded-full bg-[#0C2B21] text-white hover:bg-emerald-900 flex items-center justify-center transition shadow-md cursor-pointer active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4 text-lime-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Nav Pills matching the screenshot */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1" aria-label="Main Navigation">
        <button
          type="button"
          onClick={() => onTabChange("list")}
          aria-label="Shopping List"
          className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === "list"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-black"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Shopping List</span>
          <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${activeTab === "list" ? "bg-[#0C2B21] text-white" : "bg-white/20 text-white"}`}>
            {totalListCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("suggestions")}
          aria-label="Smart Recommendations"
          className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === "suggestions"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-black"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Recommendations</span>
          {suggestionsCount > 0 && (
            <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${activeTab === "suggestions" ? "bg-[#0C2B21] text-white" : "bg-white/20 text-white"}`}>
              {suggestionsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("search")}
          aria-label="Catalog Search"
          className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === "search"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-black"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Catalog Search</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("history")}
          aria-label="Audit Log"
          className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === "history"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-black"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </nav>
    </header>
  );
}


