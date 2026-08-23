import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Sparkles,
  AlertTriangle,
  X,
  WifiOff
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "./services/api.js";
import { useVoiceRecognition } from "./hooks/useVoiceRecognition.js";
import { useCommandPalette } from "./hooks/useCommandPalette.js";
import { useOnlineStatus, type QueuedMutation } from "./hooks/useOnlineStatus.js";
import { Header } from "./components/Header.js";
import { FloatingNav } from "./components/FloatingNav.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { AudioWaveform } from "./components/AudioWaveform.js";
import { CommandChips } from "./components/CommandChips.js";
import { CommandHistory } from "./components/CommandHistory.js";
import { ShoppingList } from "./components/ShoppingList.js";
import { SuggestionsPanel } from "./components/SuggestionsPanel.js";
import { ProductSearch } from "./components/ProductSearch.js";
import { OnboardingTour, resetOnboardingTour } from "./components/OnboardingTour.js";
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
  const [micAmplitude, setMicAmplitude] = useState<number>(0);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>("");
  const [productSearchParams, setProductSearchParams] = useState<{ q?: string; category?: string; maxPrice?: number }>({});

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setScreenReaderAnnouncement(message);
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast.info(message);
    }
  }, []);

  // 0. Offline Status & Mutation Queue
  const { isOnline, queuedCount, queueMutation, processQueue } = useOnlineStatus({
    onSyncComplete: (syncedCount) => {
      showToast(`Back online — synced ${syncedCount} queued action(s)`, "success");
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onSyncError: (err) => {
      showToast(`Sync notice: ${err.message}`, "info");
    }
  });

  // Replay queued mutations upon network recovery
  useEffect(() => {
    if (isOnline && queuedCount > 0) {
      processQueue(async (mut: QueuedMutation) => {
        if (mut.type === "ADD_ITEM") {
          await api.addItem(mut.payload);
        } else if (mut.type === "UPDATE_ITEM") {
          await api.updateItem(mut.payload.id, mut.payload.updates);
        } else if (mut.type === "REMOVE_ITEM") {
          await api.deleteItem(mut.payload.id);
        } else if (mut.type === "EXECUTE_COMMAND") {
          await api.parseAndExecuteCommand(mut.payload.text, true);
        }
      });
    }
  }, [isOnline, queuedCount, processQueue]);

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
    data: items = [],
    isLoading: isItemsLoading
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
    mutationFn: async (text: string) => {
      if (!isOnline) {
        queueMutation("EXECUTE_COMMAND", { text });
        return {
          command: {
            intent: "ADD_ITEM" as const,
            rawText: text,
            confidence: 0.9,
            itemName: text
          },
          executed: true,
          message: `Saved offline: Queued "${text}" for sync`
        };
      }
      return api.parseAndExecuteCommand(text, true);
    },
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

      if (data.command.intent === "SEARCH_PRODUCT") {
        setProductSearchParams({
          ...(data.command.itemName ? { q: data.command.itemName } : {}),
          ...(data.command.brand ? { brand: data.command.brand } : {}),
          ...(data.command.maxPrice !== undefined ? { maxPrice: data.command.maxPrice } : {})
        });
        setActiveTab("search");
      } else if (data.command.intent === "GET_SUGGESTIONS") {
        setActiveTab("suggestions");
      } else if (
        data.command.intent === "ADD_ITEM" ||
        data.command.intent === "REMOVE_ITEM" ||
        data.command.intent === "UPDATE_ITEM" ||
        data.command.intent === "MARK_PURCHASED" ||
        data.command.intent === "UNDO"
      ) {
        setActiveTab("list");
      }

      setPreviewCommand(null);
      setManualText("");
    },
    onError: (err: Error) => {
      showToast(`Command error: ${err.message}`, "error");
    }
  });

  // Direct Add Item Mutation (Optimistic + Offline Queue)
  const addItemMutation = useMutation({
    mutationFn: async (dto: CreateItemDto) => {
      if (!isOnline) {
        queueMutation("ADD_ITEM", dto);
        return {
          id: `offline-${Date.now()}`,
          name: dto.name,
          quantity: dto.quantity || 1,
          unit: dto.unit || "item",
          category: dto.category || "Other",
          isPurchased: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return api.addItem(dto);
    },
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
      showToast(isOnline ? `Added ${newItem.name} to list` : `Saved ${newItem.name} offline`, "success");
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (!isOnline) {
        // Kept optimistically offline
        return;
      }
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to add item to list", "error");
    },
    onSettled: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
        queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      }
    }
  });

  // Update Item Mutation (Optimistic + Offline Queue)
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { quantity?: number; isPurchased?: boolean } }) => {
      if (!isOnline) {
        queueMutation("UPDATE_ITEM", { id, updates });
        return { id, ...updates } as unknown as ShoppingItem;
      }
      return api.updateItem(id, updates);
    },
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
      if (!isOnline) return;
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to update item", "error");
    },
    onSettled: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
      }
    }
  });

  // Delete Item Mutation (Optimistic + Offline Queue)
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline) {
        queueMutation("REMOVE_ITEM", { id });
        return;
      }
      return api.deleteItem(id);
    },
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
      if (!isOnline) return;
      if (context?.previousItems) {
        queryClient.setQueryData(["shopping-items"], context.previousItems);
      }
      showToast("Failed to delete item", "error");
    },
    onSettled: () => {
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
        queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      }
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

  // Initialize Command Palette Hook
  const commandPalette = useCommandPalette();

  // Initialize Voice Hook
  const voice = useVoiceRecognition({
    onCommandFinalized: handleCommandFinalized
  });

  // Spacebar push-to-talk shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        voice.toggleListening();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [voice]);

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    executeCommandMutation.mutate(manualText.trim());
  };

  const handleExecutePreviewCommand = (command: ParsedCommand) => {
    executeCommandMutation.mutate(command.rawText);
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F6F2] text-slate-900 flex flex-col justify-between p-3 sm:p-6 md:p-8 max-w-7xl mx-auto selection:bg-[#0C2B21] selection:text-white pb-32">
      {/* First-Time User Onboarding Tour */}
      <OnboardingTour />

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
        onOpenCommandPalette={commandPalette.open}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full my-5 space-y-6">
        {/* Offline PWA Banner */}
        {!isOnline && (
          <div className="p-4 rounded-[24px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-sm text-amber-950 font-bold">Offline Mode Active</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">
                  You are working offline. Shopping items and voice commands will be stored locally and synced automatically once reconnected.
                </span>
              </div>
            </div>
            {queuedCount > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-amber-200 text-amber-950 text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                {queuedCount} {queuedCount === 1 ? "change" : "changes"} queued
              </span>
            )}
          </div>
        )}

        {/* Web Speech Error State Warning Banners */}
        {voice.voiceState === "unsupported" && (
          <div className="p-4 rounded-[24px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong>Web Speech API Not Supported:</strong> Your browser does not support native speech recognition.
                Please use the text command input below for identical feature support.
              </div>
            </div>
          </div>
        )}

        {voice.errorState && (
          <div className="p-4 rounded-[24px] bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <strong>{voice.errorState.message}</strong> {voice.errorState.suggestion}
              </div>
            </div>
            <button
              type="button"
              onClick={voice.resetTranscript}
              className="p-1 rounded-full text-rose-500 hover:bg-rose-100 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Voice Interaction Hub */}
        <section
          id="tour-voice-section"
          aria-labelledby="voice-control-heading"
          className="w-full rounded-[28px] bg-white p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Instant Voice Assistant
                </span>
                {voice.voiceState === "listening" && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold animate-pulse">
                    Listening Live...
                  </span>
                )}
                {voice.isSpeaking && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Speaking Response
                  </span>
                )}
              </div>
              <h2 id="voice-control-heading" className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-0.5">
                Speak your grocery request
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                English or Hinglish — e.g. <em className="text-emerald-800 font-semibold">"Add 2 bottles of milk"</em> or <em className="text-emerald-800 font-semibold">"2 kilo aloo add kar do"</em>.
              </p>
            </div>

            {/* Quick Language & Capability Badge */}
            <div id="tour-nlu-badge" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5E9] text-[#0C2B21] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bilingual NLU Active</span>
            </div>
          </div>

          {/* Voice Waveform & Dominant Mic Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-1 relative z-10">
            {/* Dominant Mic Button (Tap target >= 44x44px) */}
            <div className="relative flex items-center justify-center">
              {voice.voiceState === "listening" && (
                <div className="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
              )}
              {voice.isSpeaking && (
                <div className="absolute -inset-2 rounded-full bg-lime-400/40 animate-pulse pointer-events-none" />
              )}

              <button
                id="mic-primary-button"
                type="button"
                onClick={voice.toggleListening}
                aria-label={voice.voiceState === "listening" ? "Stop listening" : "Start voice command"}
                style={{
                  transform: voice.voiceState === "listening" ? `scale(${1 + micAmplitude * 0.18})` : undefined
                }}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer focus:outline-none focus:ring-4 active:scale-95 ${
                  voice.voiceState === "listening"
                    ? "bg-rose-500 text-white ring-rose-300"
                    : voice.isSpeaking
                    ? "bg-lime-400 text-[#0C2B21] ring-lime-200"
                    : "bg-[#0C2B21] hover:bg-emerald-950 text-white ring-emerald-100 hover:scale-105"
                }`}
              >
                {voice.voiceState === "listening" ? (
                  <MicOff className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                ) : voice.isSpeaking ? (
                  <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
                ) : (
                  <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400" />
                )}
              </button>
            </div>

            {/* Live Audio Waveform Canvas */}
            <div id="tour-waveform" className="w-full sm:w-72 md:w-80 flex flex-col items-center sm:items-start gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Mic Audio Waveform
              </span>
              <div className="w-full p-2 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-inner">
                <AudioWaveform
                  isListening={voice.voiceState === "listening"}
                  isSpeaking={voice.isSpeaking}
                  onAmplitudeChange={setMicAmplitude}
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>

          {/* Transcript Display (Interim vs Final Separation) */}
          <div
            id="tour-transcript"
            aria-live="polite"
            className="w-full rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-1 shadow-inner"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold uppercase tracking-wider">Live Transcript</span>
              {voice.voiceState === "listening" && (
                <span className="flex items-center gap-1 text-rose-600 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording speech...
                </span>
              )}
            </div>

            {voice.voiceState === "idle" && !voice.finalTranscript && !voice.interimTranscript && (
              <p className="text-xs text-slate-400 italic py-0.5">
                Tap the microphone or hold Spacebar to begin voice input...
              </p>
            )}

            {/* Finalized text in high-contrast styling */}
            {voice.finalTranscript && (
              <p className="text-sm font-bold text-slate-900 py-0.5">
                "{voice.finalTranscript}"
              </p>
            )}

            {/* Interim text in muted distinct styling */}
            {voice.interimTranscript && (
              <p className="text-sm text-emerald-700 font-medium italic py-0.5 animate-pulse">
                "{voice.interimTranscript}"
              </p>
            )}
          </div>

          {/* Parsed Command Preview Chips */}
          {previewCommand && (
            <CommandChips
              parsedCommand={previewCommand}
              onExecute={handleExecutePreviewCommand}
              onDismiss={() => setPreviewCommand(null)}
              isExecuting={executeCommandMutation.isPending}
            />
          )}

          {/* Text Input Fallback */}
          <form id="tour-text-input" onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Or type a command (e.g. 'Add 2 milk', '2 packet doodh add karo')..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                aria-label="Text command input"
                className="w-full pl-4 pr-24 py-3 rounded-full bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20 shadow-inner"
              />
              <div className="absolute right-2.5 top-1.5 flex items-center gap-1.5">
                {!manualText && (
                  <button
                    type="button"
                    onClick={commandPalette.open}
                    aria-label="Open Command Palette"
                    className="cursor-pointer text-[10px] px-2.5 py-1 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-mono hidden sm:flex items-center gap-1 transition"
                  >
                    <span>⌘K</span>
                  </button>
                )}
                {manualText && (
                  <button
                    type="button"
                    onClick={() => setManualText("")}
                    aria-label="Clear manual input"
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!manualText.trim() || executeCommandMutation.isPending}
              aria-label="Submit text command"
              className="min-w-[42px] min-h-[42px] px-5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {/* Quick-Try Command Chips */}
          <div id="tour-quick-try" className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Try Commands
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  onClick={() => executeCommandMutation.mutate(ex.text)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-xs text-slate-700 hover:text-[#0C2B21] flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>"{ex.text}"</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Active Tab View */}
        <section className="w-full space-y-6" aria-label="Active Tab View">
          {activeTab === "list" && (
            <ShoppingList
              items={items}
              isLoading={isItemsLoading}
              onTogglePurchased={(item) =>
                updateItemMutation.mutate({
                  id: item.id,
                  updates: { isPurchased: !item.isPurchased }
                })
              }
              onUpdateQuantity={(item, qty) =>
                updateItemMutation.mutate({
                  id: item.id,
                  updates: { quantity: qty }
                })
              }
              onDeleteItem={(id) => deleteItemMutation.mutate(id)}
              onQuickAdd={(name, category) =>
                addItemMutation.mutate({ name, category, quantity: 1, unit: "item" })
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
              onSearch={(params) => setProductSearchParams(params)}
              onAddProduct={(prod) =>
                addItemMutation.mutate({
                  name: prod.name,
                  category: prod.category,
                  brand: prod.brand,
                  price: prod.price,
                  unit: prod.unit,
                  quantity: 1
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
        </section>
      </main>

      {/* Screen Reader Live Region for updates per accessibility rules */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderAnnouncement}
      </div>

      {/* Footer Notice per AGENTS.md §9 */}
      <footer className="w-full max-w-4xl mx-auto pt-8 pb-12 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span>Voice Shopping Assistant</span>
          <span>•</span>
          <span>Technical Assessment</span>
          <span>•</span>
          <span className="text-slate-500">Seeded Demo Data</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetOnboardingTour();
              window.location.reload();
            }}
            className="text-slate-400 hover:text-emerald-700 underline underline-offset-2 cursor-pointer transition text-xs"
          >
            Restart Tour
          </button>
          <span>•</span>
          <span className="text-slate-500">Deterministic NLU</span>
          <span>•</span>
          <span className="text-slate-500">Turso libSQL</span>
        </div>
      </footer>

      {/* Floating Bottom Navigation Dock matching Insightlancer screenshot */}
      <FloatingNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isListening={voice.voiceState === "listening"}
        isSpeaking={voice.isSpeaking}
        onToggleVoice={voice.toggleListening}
        totalListCount={items.length}
      />

      {/* Sonner Toaster */}
      <Toaster
        position="bottom-right"
        theme="light"
        richColors
        closeButton
        toastOptions={{
          className: "rounded-2xl shadow-xl font-sans text-xs sm:text-sm border border-slate-200"
        }}
      />

      {/* Keyboard Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        onExecuteCommand={(cmd) => executeCommandMutation.mutate(cmd)}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}

export default App;
