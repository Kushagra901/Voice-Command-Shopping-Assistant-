import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  X
} from "lucide-react";
import { api } from "./services/api.js";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition.js";
import { Header } from "./components/Header.js";
import { AudioWaveform } from "./components/AudioWaveform.js";
import { CommandChips } from "./components/CommandChips.js";
import { CommandHistory } from "./components/CommandHistory.js";
import { ShoppingList } from "./components/ShoppingList.js";
import { SuggestionsPanel } from "./components/SuggestionsPanel.js";
import { ProductSearch } from "./components/ProductSearch.js";
import { ToastContainer, type ToastMessage } from "./components/ToastContainer.js";
import type {
  ShoppingItem,
  CreateItemDto,
  ParsedCommand,
  CommandLogEntry
} from "@voice-shopping/shared";

const QUICK_EXAMPLES = [
  { text: "Add 2 bottles of milk", desc: "English with qty & unit" },
  { text: "2 packet doodh add karo", desc: "Hinglish transliteration" },
  { text: "Find toothpaste under 5 dollars", desc: "Catalog search constraint" },
  { text: "What should I buy?", desc: "Smart recommendations" }
];

export function App() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"list" | "suggestions" | "search" | "history">("list");
  const [manualText, setManualText] = useState<string>("");
  const [previewCommand, setPreviewCommand] = useState<ParsedCommand | null>(null);
  const [commandLogs, setCommandLogs] = useState<CommandLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>("");
  const [productSearchParams, setProductSearchParams] = useState<{ q?: string; category?: string; maxPrice?: number }>({});

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setScreenReaderAnnouncement(message);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Health Status Query
  const {
    data: health,
    isLoading: isHealthLoading,
    isError: isHealthError
  } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: process.env.NODE_ENV === "test" ? false : 15000
  });

  // 2. Shopping Items Query
  const {
    data: items = []
  } = useQuery({
    queryKey: ["shopping-items"],
    queryFn: api.getItems
  });

  // 3. Suggestions Query
  const {
    data: suggestions = [],
    isLoading: isSuggestionsLoading
  } = useQuery({
    queryKey: ["suggestions"],
    queryFn: api.getSuggestions
  });

  // 4. Products Search Query
  const {
    data: products = [],
    isLoading: isProductsLoading
  } = useQuery({
    queryKey: ["products", productSearchParams],
    queryFn: () => api.searchProducts(productSearchParams)
  });

  // Voice Command Execution Mutation
  const executeCommandMutation = useMutation({
    mutationFn: (text: string) => api.parseAndExecuteCommand(text, true),
    onSuccess: (data, variables) => {
      // Refresh list & suggestions
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });

      const logEntry: CommandLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        rawText: variables,
        parsedCommand: data.command,
        status: data.executed ? "executed" : "clarification_needed"
      };
      setCommandLogs((prev) => [logEntry, ...prev]);

      if (data.executed && data.message) {
        showToast(data.message, "success");
        voice.speak(data.message);
      } else if (!data.executed && data.message) {
        showToast(data.message, "info");
        voice.speak(data.message);
      }

      setPreviewCommand(null);
      setManualText("");
    },
    onError: (err: Error) => {
      showToast(`Command error: ${err.message}`, "error");
    }
  });

  // Direct Add Item Mutation (Optimistic)
  const addItemMutation = useMutation({
    mutationFn: (dto: CreateItemDto) => api.addItem(dto),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(["shopping-items"]) || [];

      // Optimistically add or update quantity
      const existing = previousItems.find((i) => i.name.toLowerCase() === newItem.name.toLowerCase());
      let optimisticList: ShoppingItem[];

      if (existing) {
        optimisticList = previousItems.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + (newItem.quantity || 1) } : i
        );
      } else {
        const tempItem: ShoppingItem = {
          id: `temp-${Date.now()}`,
          name: newItem.name,
          quantity: newItem.quantity || 1,
          unit: newItem.unit || "item",
          category: newItem.category || "Other",
          isPurchased: false,
          ...(newItem.brand ? { brand: newItem.brand } : {}),
          ...(newItem.price !== undefined ? { price: newItem.price } : {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        optimisticList = [tempItem, ...previousItems];
      }

      queryClient.setQueryData(["shopping-items"], optimisticList);
      showToast(`Added ${newItem.name} to list`, "success");
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to add item to list", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    }
  });

  // Update Item Mutation (Optimistic)
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { quantity?: number; isPurchased?: boolean } }) =>
      api.updateItem(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(["shopping-items"]) || [];

      const optimisticList = previousItems.map((i) => (i.id === id ? { ...i, ...updates } : i));
      queryClient.setQueryData(["shopping-items"], optimisticList);

      const target = previousItems.find((i) => i.id === id);
      if (updates.isPurchased !== undefined && target) {
        showToast(
          updates.isPurchased ? `Marked ${target.name} as purchased` : `Marked ${target.name} as pending`,
          "info"
        );
      }
      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to update item", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    }
  });

  // Delete Item Mutation (Optimistic)
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(["shopping-items"]) || [];
      const deletedItem = previousItems.find((i) => i.id === id);

      queryClient.setQueryData(
        ["shopping-items"],
        previousItems.filter((i) => i.id !== id)
      );

      if (deletedItem) {
        showToast(`Removed ${deletedItem.name} from list`, "info");
      }
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to delete item", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    }
  });

  // Handle final speech transcript
  const handleCommandFinalized = useCallback(
    async (transcriptText: string) => {
      if (!transcriptText.trim()) return;

      try {
        // First parse to show preview chips
        const parseRes = await api.parseAndExecuteCommand(transcriptText, false);
        setPreviewCommand(parseRes.command);

        // Auto execute if high confidence
        if (parseRes.command.confidence >= 0.85 && parseRes.command.intent !== "UNKNOWN") {
          executeCommandMutation.mutate(transcriptText);
        }
      } catch {
        executeCommandMutation.mutate(transcriptText);
      }
    },
    [executeCommandMutation]
  );

  // Initialize Voice Hook
  const voice = useVoiceRecognition({
    onCommandFinalized: handleCommandFinalized
  });

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    executeCommandMutation.mutate(manualText.trim());
  };

  const handleExecutePreviewCommand = (command: ParsedCommand) => {
    executeCommandMutation.mutate(command.rawText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-5xl mx-auto selection:bg-indigo-500 selection:text-white">
      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        health={health}
        isHealthLoading={isHealthLoading}
        isHealthError={isHealthError}
        totalListCount={items.length}
        suggestionsCount={suggestions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full my-6 space-y-6">
        {/* Web Speech Error State Warning Banners */}
        {voice.voiceState === "unsupported" && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <strong>Web Speech API Not Supported:</strong> Your browser does not support native speech recognition.
                Please use the text command input below for identical feature support.
              </div>
            </div>
          </div>
        )}

        {voice.errorState && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800/70 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong>{voice.errorState.message}</strong> {voice.errorState.suggestion}
              </div>
            </div>
            <button
              type="button"
              onClick={voice.resetTranscript}
              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Voice Interaction Hub */}
        <section
          aria-labelledby="voice-control-heading"
          className="w-full rounded-3xl glass-panel p-5 sm:p-7 border border-indigo-500/20 shadow-2xl space-y-5 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 id="voice-control-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Voice Command Center</span>
                {voice.voiceState === "listening" && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-medium">
                    Listening...
                  </span>
                )}
                {voice.isSpeaking && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-bounce" /> Speaking
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Say what you need in English or Hinglish — e.g. <em className="text-indigo-300">"Add 2 bottles of milk"</em> or <em className="text-indigo-300">"2 kilo aloo add kar do"</em>.
              </p>
            </div>

            {/* Quick Language Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bilingual Parser Active</span>
            </div>
          </div>

          {/* Voice Waveform & Dominant Mic Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* Dominant Mic Button (Tap target >= 44x44px, sized 80x80 / 96x96px per voice-ui-style) */}
            <div className="relative flex items-center justify-center">
              {voice.voiceState === "listening" && (
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
              )}
              {voice.isSpeaking && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
              )}

              <button
                id="mic-primary-button"
                type="button"
                onClick={voice.toggleListening}
                aria-label={voice.voiceState === "listening" ? "Stop listening" : "Start voice command"}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 ${
                  voice.voiceState === "listening"
                    ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/30 ring-rose-500/50 scale-105"
                    : voice.isSpeaking
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/30 ring-emerald-500/50"
                    : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white shadow-indigo-500/25 ring-indigo-500/40 hover:scale-105 active:scale-95"
                }`}
              >
                {voice.voiceState === "listening" ? (
                  <MicOff className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                ) : voice.isSpeaking ? (
                  <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                )}
              </button>
            </div>

            {/* Live Audio Waveform Canvas */}
            <div className="w-full sm:w-72 md:w-96 flex flex-col items-center sm:items-start gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Live Audio Frequency Monitor
              </span>
              <AudioWaveform
                isListening={voice.voiceState === "listening"}
                isSpeaking={voice.isSpeaking}
                className="w-full h-14"
              />
            </div>
          </div>

          {/* Transcript Display (Interim vs Final Separation per voice-ui-style §2) */}
          <div
            aria-live="polite"
            className="w-full rounded-2xl bg-slate-900/90 border border-slate-800/90 p-3.5 sm:p-4 space-y-1.5 shadow-inner"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Live Transcript</span>
              {voice.voiceState === "listening" && (
                <span className="text-rose-400 animate-pulse font-medium">Recording audio...</span>
              )}
            </div>

            <div className="min-h-[36px] flex items-center flex-wrap gap-1.5 text-sm sm:text-base">
              {/* Final Transcript in Full Contrast */}
              {voice.finalTranscript && (
                <span className="text-white font-medium">{voice.finalTranscript}</span>
              )}

              {/* Interim Transcript in Muted/Lower-Contrast Italic */}
              {voice.interimTranscript && (
                <span className="text-indigo-400/70 italic animate-pulse">{voice.interimTranscript}</span>
              )}

              {!voice.finalTranscript && !voice.interimTranscript && (
                <span className="text-slate-500 text-xs sm:text-sm italic">
                  Tap the microphone and speak, or type a command in the input box below...
                </span>
              )}
            </div>
          </div>

          {/* Manual Text Command Input Fallback (100% Feature Parity) */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type a command (e.g. 'Add 2 bottles of milk' or '2 packet doodh add karo')..."
                aria-label="Text command input"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {manualText && (
                <button
                  type="button"
                  onClick={() => setManualText("")}
                  aria-label="Clear input text"
                  className="p-1 text-slate-400 hover:text-white rounded-lg absolute right-3 top-3 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!manualText.trim() || executeCommandMutation.isPending}
              aria-label="Submit command"
              className="min-h-[48px] px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </form>

          {/* Quick Example Command Chips */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Try Commands:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  onClick={() => {
                    setManualText(ex.text);
                    executeCommandMutation.mutate(ex.text);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>"{ex.text}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Command-Preview Chips (AGENTS.md §6.2) */}
          {previewCommand && (
            <CommandChips
              parsedCommand={previewCommand}
              onExecute={handleExecutePreviewCommand}
              onDismiss={() => setPreviewCommand(null)}
              isExecuting={executeCommandMutation.isPending}
            />
          )}
        </section>

        {/* Tab View Switcher Content */}
        {activeTab === "list" && (
          <ShoppingList
            items={items}
            onTogglePurchased={(item) =>
              updateItemMutation.mutate({ id: item.id, updates: { isPurchased: !item.isPurchased } })
            }
            onUpdateQuantity={(item, newQty) =>
              updateItemMutation.mutate({ id: item.id, updates: { quantity: newQty } })
            }
            onDeleteItem={(id) => deleteItemMutation.mutate(id)}
            onQuickAdd={(name, category) =>
              addItemMutation.mutate({ name, quantity: 1, unit: "item", category })
            }
          />
        )}

        {activeTab === "suggestions" && (
          <SuggestionsPanel
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            onAddSuggestion={(sug) =>
              addItemMutation.mutate({
                name: sug.name,
                category: sug.category,
                quantity: 1,
                unit: "item",
                ...(sug.estimatedPrice !== undefined ? { price: sug.estimatedPrice } : {})
              })
            }
          />
        )}

        {activeTab === "search" && (
          <ProductSearch
            products={products}
            isLoading={isProductsLoading}
            onSearch={setProductSearchParams}
            onAddProduct={(prod) =>
              addItemMutation.mutate({
                name: prod.name,
                category: prod.category,
                quantity: 1,
                unit: prod.unit,
                brand: prod.brand,
                price: prod.price
              })
            }
          />
        )}

        {activeTab === "history" && (
          <CommandHistory
            logs={commandLogs}
            onClear={() => setCommandLogs([])}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Voice Command Shopping Assistant</span>
          <span>•</span>
          <span>Technical Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Deterministic NLU</span>
          <span>•</span>
          <span className="text-slate-400">Turso libSQL</span>
        </div>
      </footer>

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
