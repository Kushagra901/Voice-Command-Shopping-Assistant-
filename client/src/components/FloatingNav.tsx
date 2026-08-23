import { Home, ShoppingBag, Heart, Mic, MicOff, Volume2, User } from "lucide-react";

interface FloatingNavProps {
  activeTab: "list" | "suggestions" | "search" | "history";
  onTabChange: (tab: "list" | "suggestions" | "search" | "history") => void;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleVoice: () => void;
  totalListCount: number;
}

export function FloatingNav({
  activeTab,
  onTabChange,
  isListening,
  isSpeaking,
  onToggleVoice,
  totalListCount
}: FloatingNavProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[92vw]">
      <nav
        id="tour-floating-nav"
        aria-label="Floating Navigation Bar"
        className="floating-dock rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 sm:gap-6 border border-emerald-800/40 shadow-2xl backdrop-blur-lg text-white"
      >
        {/* 1. Home / List Icon with Badge */}
        <button
          id="tour-nav-list"
          type="button"
          onClick={() => onTabChange("list")}
          aria-label="Home Feed"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "list"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-bold"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <Home className="w-5 h-5" />
          {totalListCount > 0 && activeTab !== "list" && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lime-400 text-[#0C2B21] text-[10px] font-black flex items-center justify-center shadow-sm">
              {totalListCount}
            </span>
          )}
        </button>

        {/* 2. Catalog Search */}
        <button
          id="tour-nav-search"
          type="button"
          onClick={() => onTabChange("search")}
          aria-label="Browse Catalog"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "search"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-bold"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        {/* 3. Central Dominant Voice Microphone Button */}
        <div className="relative flex items-center justify-center px-1">
          {isListening && (
            <div className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
          )}
          {isSpeaking && (
            <div className="absolute -inset-2 rounded-full bg-lime-400/40 animate-pulse pointer-events-none" />
          )}
          <button
            type="button"
            onClick={onToggleVoice}
            aria-label={isListening ? "Mute Mic" : "Mic Input"}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-95 ${
              isListening
                ? "bg-rose-500 text-white shadow-rose-500/50 ring-4 ring-rose-400/40 animate-pulse"
                : isSpeaking
                ? "bg-emerald-400 text-[#0C2B21] shadow-emerald-400/50 ring-4 ring-emerald-300/40"
                : "bg-lime-500 hover:bg-lime-400 text-[#0C2B21] shadow-lime-500/40 hover:scale-105"
            }`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : isSpeaking ? (
              <Volume2 className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6 text-[#0C2B21]" />
            )}
          </button>
        </div>

        {/* 4. Smart Ideas / Heart */}
        <button
          id="tour-nav-suggestions"
          type="button"
          onClick={() => onTabChange("suggestions")}
          aria-label="Saved Ideas"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "suggestions"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-bold"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <Heart className="w-5 h-5" />
        </button>

        {/* 5. History / Profile */}
        <button
          id="tour-nav-history"
          type="button"
          onClick={() => onTabChange("history")}
          aria-label="User Profile"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-lime-500 text-[#0C2B21] shadow-md font-bold"
              : "text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <User className="w-5 h-5" />
        </button>


      </nav>
    </div>
  );
}
