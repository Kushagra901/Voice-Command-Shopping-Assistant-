import { useState } from "react";
import { Command } from "cmdk";
import {
  Search,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Languages,
  ArrowRight,
  X,
  ListOrdered,
  History,
  ShoppingBag,
  CornerDownLeft
} from "lucide-react";

export interface CommandOption {
  id: string;
  category: "Add Item" | "Remove Item" | "Update Quantity" | "Mark Purchased" | "Search" | "Suggestions" | "Hinglish" | "Navigation" | "Undo";
  label: string;
  commandText: string;
  description: string;
  icon: typeof PlusCircle;
  navigationTab?: "list" | "suggestions" | "search" | "history";
}

export const DEFAULT_COMMANDS: CommandOption[] = [
  // Add Item
  {
    id: "add-milk",
    category: "Add Item",
    label: "Add Milk",
    commandText: "Add 2 bottles of milk",
    description: "Add 2 bottles of milk to dairy list",
    icon: PlusCircle
  },
  {
    id: "add-apples",
    category: "Add Item",
    label: "Add Apples",
    commandText: "Add 6 apples",
    description: "Add 6 fresh apples to produce list",
    icon: PlusCircle
  },
  {
    id: "add-bread",
    category: "Add Item",
    label: "Add Bread",
    commandText: "Add 1 loaf of bread",
    description: "Add 1 loaf of bread to bakery list",
    icon: PlusCircle
  },
  {
    id: "add-water",
    category: "Add Item",
    label: "Add Water",
    commandText: "I want to buy two bottles of water",
    description: "Add 2 bottles of water to beverages",
    icon: PlusCircle
  },
  // Remove Item
  {
    id: "remove-apples",
    category: "Remove Item",
    label: "Remove Apples",
    commandText: "Remove apples from my list",
    description: "Delete apples from your active shopping list",
    icon: Trash2
  },
  {
    id: "remove-milk",
    category: "Remove Item",
    label: "Remove Milk",
    commandText: "Remove milk from list",
    description: "Delete milk from your active shopping list",
    icon: Trash2
  },
  // Update Quantity
  {
    id: "update-milk-qty",
    category: "Update Quantity",
    label: "Change Milk Quantity to 3",
    commandText: "Change milk quantity to 3",
    description: "Update the quantity of milk to 3 items",
    icon: Edit3
  },
  {
    id: "update-water-qty",
    category: "Update Quantity",
    label: "Change Water Quantity to 4",
    commandText: "Change water quantity to 4",
    description: "Update water count on your list",
    icon: Edit3
  },
  // Mark Purchased
  {
    id: "mark-bread-purchased",
    category: "Mark Purchased",
    label: "Mark Bread as Purchased",
    commandText: "Mark bread as purchased",
    description: "Toggle bread as bought in shopping list",
    icon: CheckCircle2
  },
  {
    id: "mark-milk-purchased",
    category: "Mark Purchased",
    label: "Mark Milk as Purchased",
    commandText: "Mark milk as purchased",
    description: "Toggle milk status to purchased",
    icon: CheckCircle2
  },
  // Undo Action
  {
    id: "undo-last",
    category: "Undo",
    label: "Undo Last Action",
    commandText: "Undo that",
    description: "Revert the last shopping list mutation",
    icon: RotateCcw
  },
  // Hinglish Commands
  {
    id: "hinglish-doodh",
    category: "Hinglish",
    label: "2 Packet Doodh Add Karo",
    commandText: "2 packet doodh add karo",
    description: "Add 2 packets of milk (Hinglish alias)",
    icon: Languages
  },
  {
    id: "hinglish-aloo",
    category: "Hinglish",
    label: "Do Kilo Aloo Chahiye",
    commandText: "do kilo aloo chahiye",
    description: "Add 2 kg potatoes (Hinglish alias)",
    icon: Languages
  },
  {
    id: "hinglish-seb",
    category: "Hinglish",
    label: "Seb List Mein Daalo",
    commandText: "seb list mein daalo",
    description: "Add apples to list (Hinglish alias)",
    icon: Languages
  },
  {
    id: "hinglish-pyaz",
    category: "Hinglish",
    label: "Pyaz Hata Do",
    commandText: "pyaz hata do",
    description: "Remove onions from list (Hinglish alias)",
    icon: Languages
  },
  // Search
  {
    id: "search-toothpaste",
    category: "Search",
    label: "Find Toothpaste Under $5",
    commandText: "Find toothpaste under 5 dollars",
    description: "Search catalog with max price constraint",
    icon: Search
  },
  {
    id: "search-coffee",
    category: "Search",
    label: "Search Coffee",
    commandText: "Search coffee",
    description: "Search product catalog for coffee items",
    icon: Search
  },
  // Suggestions
  {
    id: "get-suggestions",
    category: "Suggestions",
    label: "Smart Suggestions",
    commandText: "What should I buy?",
    description: "Get smart recommendations based on history",
    icon: Sparkles
  },
  // Navigation
  {
    id: "nav-list",
    category: "Navigation",
    label: "View Shopping List",
    commandText: "",
    description: "Switch to main shopping list view",
    icon: ListOrdered,
    navigationTab: "list"
  },
  {
    id: "nav-suggestions",
    category: "Navigation",
    label: "View Smart Recommendations",
    commandText: "",
    description: "Switch to smart recommendations view",
    icon: Sparkles,
    navigationTab: "suggestions"
  },
  {
    id: "nav-search",
    category: "Navigation",
    label: "View Catalog Search",
    commandText: "",
    description: "Switch to product search tab",
    icon: ShoppingBag,
    navigationTab: "search"
  },
  {
    id: "nav-history",
    category: "Navigation",
    label: "View Audit Log",
    commandText: "",
    description: "View timeline of past commands",
    icon: History,
    navigationTab: "history"
  }
];

const CATEGORY_ORDER: CommandOption["category"][] = [
  "Add Item",
  "Remove Item",
  "Update Quantity",
  "Mark Purchased",
  "Undo",
  "Hinglish",
  "Search",
  "Suggestions",
  "Navigation"
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (commandText: string) => void;
  onNavigateTab?: (tab: "list" | "suggestions" | "search" | "history") => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onExecuteCommand,
  onNavigateTab
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const executeOption = (item: CommandOption) => {
    if (item.navigationTab && onNavigateTab) {
      onNavigateTab(item.navigationTab);
      onClose();
    } else if (item.commandText) {
      onExecuteCommand(item.commandText);
      onClose();
    }
  };

  const handleCustomExecute = () => {
    if (!searchQuery.trim()) return;
    onExecuteCommand(searchQuery.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md transition-all duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl glass-panel bg-slate-900/95 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Command Palette"
          className="flex flex-col h-full w-full"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
            <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <Command.Input
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Type a command or search (e.g. 'Add 2 milk', '2 packet doodh', 'undo')..."
              aria-label="Command Palette input"
              className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear query"
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close command palette"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <kbd className="text-[10px] px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400">
                ESC
              </kbd>
            </button>
          </div>

          {/* Command List / Results */}
          <Command.List
            className="overflow-y-auto max-h-[60vh] p-2 space-y-3 focus:outline-none"
            aria-label="Command suggestions"
          >
            {/* Custom Execute Option if query is typed */}
            {searchQuery.trim().length > 0 && (
              <Command.Item
                value={`custom-execute-${searchQuery}`}
                onSelect={handleCustomExecute}
                className="group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer text-xs sm:text-sm text-indigo-200 bg-indigo-950/40 border border-indigo-500/40 data-[selected=true]:bg-indigo-600 data-[selected=true]:text-white transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-300 group-data-[selected=true]:text-white flex-shrink-0">
                    <CornerDownLeft className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">Execute: "{searchQuery}"</div>
                    <div className="text-[11px] text-indigo-300/80 group-data-[selected=true]:text-white/80">
                      Send typed command to voice parser
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700/50 group-data-[selected=true]:bg-indigo-700 group-data-[selected=true]:text-white">
                  <span>Enter</span>
                  <CornerDownLeft className="w-3 h-3" />
                </div>
              </Command.Item>
            )}

            <Command.Empty className="py-8 px-4 text-center text-xs text-slate-400 space-y-3">
              <Search className="w-7 h-7 text-slate-600 mx-auto" />
              <p>No preset commands found. Press Enter to execute as custom command.</p>
            </Command.Empty>

            {CATEGORY_ORDER.map((category) => {
              const categoryItems = DEFAULT_COMMANDS.filter((cmd) => cmd.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <Command.Group
                  key={category}
                  heading={category}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400"
                >
                  <div className="space-y-1">
                    {categoryItems.map((cmd) => {
                      const IconComponent = cmd.icon;
                      return (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.commandText} ${cmd.description} ${cmd.category}`}
                          onSelect={() => executeOption(cmd)}
                          className="group flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs sm:text-sm text-slate-300 transition-all border border-transparent data-[selected=true]:bg-indigo-600/25 data-[selected=true]:border-indigo-500/40 data-[selected=true]:text-white"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-data-[selected=true]:bg-indigo-600 group-data-[selected=true]:text-white transition-colors flex-shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate text-slate-100 group-data-[selected=true]:text-white">
                                {cmd.label}
                              </div>
                              <div className="text-[11px] text-slate-400 group-data-[selected=true]:text-slate-200 truncate">
                                {cmd.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {cmd.commandText && (
                              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 group-data-[selected=true]:text-slate-200">
                                "{cmd.commandText}"
                              </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-slate-500 group-data-[selected=true]:text-white transition-transform group-data-[selected=true]:translate-x-0.5" />
                          </div>
                        </Command.Item>
                      );
                    })}
                  </div>
                </Command.Group>
              );
            })}
          </Command.List>

          {/* Footer Guide */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↵</kbd> Select
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              {DEFAULT_COMMANDS.length} commands available
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
