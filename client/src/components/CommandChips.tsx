import { useState, useEffect } from "react";
import type { ParsedCommand, Intent } from "@voice-shopping/shared";
import { Check, X, Tag, Hash, Package, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface CommandChipsProps {
  parsedCommand: ParsedCommand;
  onExecute: (command: ParsedCommand) => void;
  onDismiss: () => void;
  isExecuting?: boolean;
}

const INTENT_LABELS: Record<Intent, { label: string; color: string }> = {
  ADD_ITEM: { label: "Add Item", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
  REMOVE_ITEM: { label: "Remove Item", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  UPDATE_ITEM: { label: "Update Quantity", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  MARK_PURCHASED: { label: "Mark Done", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  SEARCH_PRODUCT: { label: "Search Catalog", color: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  GET_SUGGESTIONS: { label: "Get Ideas", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  UNDO: { label: "Undo Action", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40" },
  UNKNOWN: { label: "Clarify Intent", color: "bg-slate-700/40 text-slate-300 border-slate-600" }
};

export function CommandChips({
  parsedCommand,
  onExecute,
  onDismiss,
  isExecuting = false
}: CommandChipsProps) {
  const [editedItem, setEditedItem] = useState<string>(parsedCommand.itemName || "");
  const [editedQuantity, setEditedQuantity] = useState<number>(parsedCommand.quantity ?? 1);
  const [editedUnit, setEditedUnit] = useState<string>(parsedCommand.unit || "item");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setEditedItem(parsedCommand.itemName || "");
    setEditedQuantity(parsedCommand.quantity ?? 1);
    setEditedUnit(parsedCommand.unit || "item");
  }, [parsedCommand]);

  const handleConfirm = () => {
    const updated: ParsedCommand = {
      ...parsedCommand,
      ...(editedItem ? { itemName: editedItem.trim() } : {}),
      quantity: editedQuantity,
      unit: editedUnit.trim()
    };
    onExecute(updated);
  };

  const intentMeta = INTENT_LABELS[parsedCommand.intent] || INTENT_LABELS.UNKNOWN;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.18 }}
      className="w-full max-w-xl mx-auto rounded-3xl glass-panel p-5 border border-indigo-500/40 shadow-2xl space-y-3.5 glow-indigo"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Parsed Command Preview
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            Confidence: {Math.round(parsedCommand.confidence * 100)}%
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss command preview"
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Raw Transcript Quote */}
      <p className="text-xs text-slate-400 italic">
        "{parsedCommand.rawText}"
      </p>

      {/* Interactive Editable Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Intent Chip */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${intentMeta.color}`}>
          <Tag className="w-3.5 h-3.5" />
          {intentMeta.label}
        </div>

        {/* Item Name Chip (Editable) */}
        {parsedCommand.itemName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-100">
            <Package className="w-3.5 h-3.5 text-indigo-400" />
            {isEditing ? (
              <input
                type="text"
                value={editedItem}
                onChange={(e) => setEditedItem(e.target.value)}
                className="bg-slate-900 px-1 py-0.5 rounded border border-indigo-500 text-white text-xs w-28 focus:outline-none"
                aria-label="Edit item name"
              />
            ) : (
              <span className="font-semibold text-indigo-200">{editedItem}</span>
            )}
          </div>
        )}

        {/* Quantity Chip (Editable) */}
        {parsedCommand.quantity !== undefined && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-100">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            {isEditing ? (
              <input
                type="number"
                min="0.1"
                step="any"
                value={editedQuantity}
                onChange={(e) => setEditedQuantity(parseFloat(e.target.value) || 1)}
                className="bg-slate-900 px-1 py-0.5 rounded border border-indigo-500 text-white text-xs w-16 focus:outline-none"
                aria-label="Edit quantity"
              />
            ) : (
              <span>{editedQuantity}</span>
            )}
            <span className="text-slate-400">{editedUnit}</span>
          </div>
        )}

        {/* Brand Chip */}
        {parsedCommand.brand && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-500">Brand:</span>
            <span className="text-slate-200 font-medium">{parsedCommand.brand}</span>
          </div>
        )}

        {/* Price Constraint Chip */}
        {parsedCommand.maxPrice !== undefined && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-500">Max:</span>
            <span className="text-emerald-400 font-medium">${parsedCommand.maxPrice}</span>
          </div>
        )}

        {/* Edit toggle button */}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 px-1 cursor-pointer py-1"
        >
          {isEditing ? "Done editing" : "Edit values"}
        </button>
      </div>

      {parsedCommand.intent === "UNKNOWN" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Could not determine shopping action. Try saying "Add milk" or "Remove apples".</span>
        </div>
      )}

      {/* Action Buttons (Tap targets >= 44x44px per accessibility) */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isExecuting}
          className="min-h-[44px] px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
        >
          Dismiss
        </button>

        {parsedCommand.intent !== "UNKNOWN" && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExecuting}
            className="min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md hover:shadow-indigo-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isExecuting ? "Executing..." : "Execute Command"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
