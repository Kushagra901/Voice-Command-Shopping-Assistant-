import { useState } from "react";
import type { CommandLogEntry } from "@voice-shopping/shared";
import { History, Trash2, ChevronDown, ChevronUp, CheckCircle, HelpCircle, XCircle } from "lucide-react";

interface CommandHistoryProps {
  logs: CommandLogEntry[];
  onClear: () => void;
}

export function CommandHistory({ logs, onClear }: CommandHistoryProps) {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <div className="w-full rounded-[28px] bg-white border border-slate-100 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#0C2B21]/20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <History className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900">Command Audit Log</span>
            <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-bold">
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
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
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-full hover:bg-rose-50 flex items-center justify-center gap-1 cursor-pointer transition min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Expanded Log Timeline */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-100 max-h-96 overflow-y-auto space-y-3">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No voice or text commands executed in this session yet. Speak or type a command above.
            </div>
          ) : (
            logs.map((entry) => {
              const dateStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">"{entry.rawText}"</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#0C2B21] font-mono text-[10px] font-bold border border-emerald-200">
                        {entry.parsedCommand.intent}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      {entry.parsedCommand.itemName && (
                        <span>Item: <strong className="text-slate-800">{entry.parsedCommand.itemName}</strong></span>
                      )}
                      {entry.parsedCommand.quantity !== undefined && (
                        <span>Qty: <strong className="text-slate-800">{entry.parsedCommand.quantity} {entry.parsedCommand.unit || ""}</strong></span>
                      )}
                      <span>Confidence: <strong className="text-slate-800">{Math.round(entry.parsedCommand.confidence * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">{dateStr}</span>
                    {entry.status === "executed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Executed
                      </span>
                    )}
                    {entry.status === "clarification_needed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <HelpCircle className="w-3 h-3 text-amber-600" /> Clarified
                      </span>
                    )}
                    {entry.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> Rejected
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
