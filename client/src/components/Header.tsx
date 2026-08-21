import { AppLogoIcon } from "./CategoryIcons.js";
import { Activity, Database, CheckCircle2, AlertCircle, Sparkles, Search, History, ListOrdered } from "lucide-react";
import type { HealthStatus } from "@voice-shopping/shared";

interface HeaderProps {
  activeTab: "list" | "suggestions" | "search" | "history";
  onTabChange: (tab: "list" | "suggestions" | "search" | "history") => void;
  health?: HealthStatus | undefined;
  isHealthLoading: boolean;
  isHealthError: boolean;
  totalListCount: number;
  suggestionsCount: number;
}

export function Header({
  activeTab,
  onTabChange,
  health,
  isHealthLoading,
  isHealthError,
  totalListCount,
  suggestionsCount
}: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-800/80 pb-4 space-y-4">
      {/* Top Branding & Status Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <AppLogoIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Voice Shopping Assistant
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.2 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                English & Hinglish NLU
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">Turso libSQL</span>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isHealthLoading ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-900 text-slate-400 border border-slate-800">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Connecting API...
            </span>
          ) : isHealthError ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-rose-950/60 text-rose-300 border border-rose-800/50">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Backend Offline
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                API Healthy
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                {health?.database === "connected" ? "Turso Cloud" : "Local libSQL"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Tap targets >= 44x44px) */}
      <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-800/60 pt-3" aria-label="Main Navigation">
        <button
          type="button"
          onClick={() => onTabChange("list")}
          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap ${
            activeTab === "list"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Shopping List</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "list" ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"}`}>
            {totalListCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("suggestions")}
          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap ${
            activeTab === "suggestions"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Smart Recommendations</span>
          {suggestionsCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "suggestions" ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"}`}>
              {suggestionsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("search")}
          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap ${
            activeTab === "search"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80"
          }`}
        >
          <Search className="w-4 h-4 text-sky-400" />
          <span>Catalog Search</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("history")}
          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 whitespace-nowrap ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80"
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>Audit Log</span>
        </button>
      </nav>
    </header>
  );
}
