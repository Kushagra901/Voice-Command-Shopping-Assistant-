import { useState } from "react";
import type { CommandLogEntry } from "@voice-shopping/shared";
import { History, Trash2, ChevronDown, ChevronUp, CheckCircle, HelpCircle, XCircle } from "lucide-react";

interface CommandHistoryProps {
  logs: CommandLogEntry[];
  onClear: () => void;
}

export function CommandHistory({ logs, onClear }: CommandHistoryProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="w-full rounded-2xl glass-panel border border-slate-800/80 overflow-hidden transition-all duration-200">
      {/* Header / Toggle (Tap target >= 44px) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between bg-slate-900/80 hover:bg-slate-900 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sage-500/50"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sage-500/10 flex items-center justify-center text-sage-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-semibold text-slate-200">Command Audit Log</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {logs.length} entries
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Clear audit history"
              className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-xl hover:bg-rose-950/40 flex items-center justify-center gap-1 cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Log Timeline */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800/60 max-h-72 overflow-y-auto space-y-2.5">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 italic">
              No voice or text commands executed in this session yet.
            </div>
          ) : (
            logs.map((entry) => {
              const dateStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200">"{entry.rawText}"</span>
                      <span className="px-2 py-0.5 rounded bg-sage-950/90 text-sage-300 font-mono text-[10px] border border-sage-800/60">
                        {entry.parsedCommand.intent}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {entry.parsedCommand.itemName && (
                        <span>Item: <strong className="text-slate-300">{entry.parsedCommand.itemName}</strong></span>
                      )}
                      {entry.parsedCommand.quantity !== undefined && (
                        <span>Qty: <strong className="text-slate-300">{entry.parsedCommand.quantity} {entry.parsedCommand.unit || ""}</strong></span>
                      )}
                      <span>Confidence: <strong className="text-slate-300">{Math.round(entry.parsedCommand.confidence * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-500">{dateStr}</span>
                    {entry.status === "executed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Executed
                      </span>
                    )}
                    {entry.status === "clarification_needed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <HelpCircle className="w-3 h-3" /> Clarified
                      </span>
                    )}
                    {entry.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
