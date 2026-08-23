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
import { CommandPalette } from "./components/CommandPalette.js";
import { AudioWaveform } from "./components/AudioWaveform.js";
import { CommandChips } from "./components/CommandChips.js";
import { CommandHistory } from "./components/CommandHistory.js";
import { ShoppingList } from "./components/ShoppingList.js";
import { SuggestionsPanel } from "./components/SuggestionsPanel.js";
import { ProductSearch } from "./components/ProductSearch.js";
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

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    executeCommandMutation.mutate(manualText.trim());
  };

  const handleExecutePreviewCommand = (command: ParsedCommand) => {
    executeCommandMutation.mutate(command.rawText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-5xl mx-auto selection:bg-sage-600 selection:text-white">
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
      <main className="flex-1 w-full my-6 space-y-6">
        {/* Offline PWA Banner */}
        {!isOnline && (
          <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-sm text-amber-100 font-bold">Offline Mode Active</strong>
                <span className="text-slate-300 text-[11px] sm:text-xs">
                  You are working offline. Shopping items and voice commands will be stored locally and synced automatically once reconnected.
                </span>
              </div>
            </div>
            {queuedCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-900/90 text-amber-200 border border-amber-600/60 text-xs font-semibold flex-shrink-0 whitespace-nowrap">
                {queuedCount} {queuedCount === 1 ? "change" : "changes"} queued
              </span>
            )}
          </div>
        )}

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
              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/50 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Voice Interaction Hub */}
        <section
          aria-labelledby="voice-control-heading"
          className="w-full rounded-3xl glass-panel p-5 sm:p-7 border border-sage-500/20 shadow-2xl space-y-5 relative overflow-hidden"
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
                Say what you need in English or Hinglish — e.g. <em className="text-sage-300 font-medium">"Add 2 bottles of milk"</em> or <em className="text-sage-300 font-medium">"2 kilo aloo add kar do"</em>.
              </p>
            </div>

            {/* Quick Language Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-400" />
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
                style={{
                  transform: voice.voiceState === "listening" ? `scale(${1 + micAmplitude * 0.18})` : undefined,
                  boxShadow:
                    voice.voiceState === "listening"
                      ? `0 0 ${24 + micAmplitude * 36}px rgba(244, 63, 94, ${0.45 + micAmplitude * 0.45})`
                      : undefined
                }}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-150 cursor-pointer focus:outline-none focus:ring-4 ${
                  voice.voiceState === "listening"
                    ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/30 ring-rose-500/50"
                    : voice.isSpeaking
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/30 ring-emerald-500/50"
                    : "bg-gradient-to-br from-sage-600 via-sage-700 to-sage-800 hover:from-sage-500 hover:to-sage-700 text-white shadow-sage-950/40 ring-sage-500/40 hover:scale-105 active:scale-95"
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
                onAmplitudeChange={setMicAmplitude}
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
              <span className="font-semibold uppercase tracking-wider text-slate-400">Live Transcript</span>
              {voice.voiceState === "listening" && (
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording audio...
                </span>
              )}
            </div>

            {voice.voiceState === "idle" && !voice.finalTranscript && !voice.interimTranscript && (
              <p className="text-xs text-slate-500 italic py-1">
                Press the microphone or spacebar to begin voice input...
              </p>
            )}

            {/* Finalized text in high-contrast styling */}
            {voice.finalTranscript && (
              <p className="text-sm font-semibold text-slate-100 py-0.5">
                {voice.finalTranscript}
              </p>
            )}

            {/* Interim text in muted distinct styling per voice-ui-style §2 */}
            {voice.interimTranscript && (
              <p className="text-sm text-terracotta-300/80 italic py-0.5 animate-pulse">
                {voice.interimTranscript}
              </p>
            )}
          </div>

          {/* Parsed Command Preview Chips (AGENTS.md §6.2) */}
          {previewCommand && (
            <CommandChips
              parsedCommand={previewCommand}
              onExecute={handleExecutePreviewCommand}
              onDismiss={() => setPreviewCommand(null)}
              isExecuting={executeCommandMutation.isPending}
            />
          )}

          {/* Text Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Or type a command (e.g. 'Add 2 milk', '2 packet doodh add karo')..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                aria-label="Text command input"
                className="w-full pl-4 pr-24 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sage-500/50 shadow-inner"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1.5">
                {!manualText && (
                  <button
                    type="button"
                    onClick={commandPalette.open}
                    aria-label="Open Command Palette"
                    className="cursor-pointer text-[10px] px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono hidden sm:flex items-center gap-1 transition"
                  >
                    <span>⌘K</span>
                    <span className="text-[9px] text-slate-400">Palette</span>
                  </button>
                )}
                {manualText && (
                  <button
                    type="button"
                    onClick={() => setManualText("")}
                    aria-label="Clear manual input"
                    className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={!manualText.trim() || executeCommandMutation.isPending}
              aria-label="Submit text command"
              className="min-w-[44px] min-h-[44px] px-5 rounded-2xl bg-sage-600 hover:bg-sage-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sage-950/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {/* Quick-Try Command Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Try Commands
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  onClick={() => executeCommandMutation.mutate(ex.text)}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sage-500/40 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-terracotta-400 flex-shrink-0" />
                  <span>"{ex.text}"</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Navigation Navigation Bar */}
        <nav
          aria-label="Main View Navigation"
          className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "list"
                  ? "bg-sage-600 text-white shadow-lg shadow-sage-950/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>Shopping List</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "list" ? "bg-sage-700 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {items.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("suggestions")}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "suggestions"
                  ? "bg-sage-600 text-white shadow-lg shadow-sage-950/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>Ideas</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "suggestions" ? "bg-sage-700 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {suggestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "search"
                  ? "bg-sage-600 text-white shadow-lg shadow-sage-950/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>Search</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "search" ? "bg-sage-700 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-sage-600 text-white shadow-lg shadow-sage-950/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>History</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === "history" ? "bg-sage-700 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {commandLogs.length}
              </span>
            </button>
          </div>
        </nav>

        {/* Tab Views */}
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
      <footer className="w-full max-w-4xl mx-auto pt-8 pb-4 border-t border-slate-900 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span>Voice Shopping Assistant</span>
          <span>•</span>
          <span>Technical Assessment</span>
          <span>•</span>
          <span className="text-slate-400">Seeded Demo Data</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Deterministic NLU</span>
          <span>•</span>
          <span className="text-slate-400">Turso libSQL</span>
        </div>
      </footer>

      {/* Sonner Toaster */}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          className: "glass-panel border border-slate-700/80 rounded-2xl shadow-2xl font-sans text-xs sm:text-sm"
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
