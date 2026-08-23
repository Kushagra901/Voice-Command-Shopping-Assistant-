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
  ADD_ITEM: { label: "Add Item", color: "bg-[#E8F5E9] text-[#0C2B21] border-emerald-200" },
  REMOVE_ITEM: { label: "Remove Item", color: "bg-rose-50 text-rose-800 border-rose-200" },
  UPDATE_ITEM: { label: "Update Quantity", color: "bg-amber-50 text-amber-900 border-amber-200" },
  MARK_PURCHASED: { label: "Mark Done", color: "bg-[#E8F5E9] text-[#2E7D32] border-emerald-200" },
  SEARCH_PRODUCT: { label: "Search Catalog", color: "bg-sky-50 text-sky-900 border-sky-200" },
  GET_SUGGESTIONS: { label: "Get Ideas", color: "bg-purple-50 text-purple-900 border-purple-200" },
  UNDO: { label: "Undo Action", color: "bg-amber-50 text-amber-900 border-amber-200" },
  UNKNOWN: { label: "Clarify Intent", color: "bg-slate-100 text-slate-700 border-slate-200" }
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
      className="w-full rounded-2xl bg-white p-4 sm:p-5 border border-emerald-200 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Parsed Command Preview
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
            Confidence: {Math.round(parsedCommand.confidence * 100)}%
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss command preview"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Raw Transcript Quote */}
      <p className="text-xs text-slate-500 italic">
        "{parsedCommand.rawText}"
      </p>

      {/* Interactive Editable Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Intent Chip */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${intentMeta.color}`}>
          <Tag className="w-3.5 h-3.5" />
          {intentMeta.label}
        </div>

        {/* Item Name Chip (Editable) */}
        {parsedCommand.itemName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            {isEditing ? (
              <input
                type="text"
                value={editedItem}
                onChange={(e) => setEditedItem(e.target.value)}
                className="bg-white px-1.5 py-0.5 rounded border border-emerald-500 text-slate-900 text-xs w-28 focus:outline-none"
                aria-label="Edit item name"
              />
            ) : (
              <span>{editedItem}</span>
            )}
          </div>
        )}

        {/* Quantity Chip (Editable) */}
        {parsedCommand.quantity !== undefined && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
            <Hash className="w-3.5 h-3.5 text-amber-600" />
            {isEditing ? (
              <input
                type="number"
                min="0.1"
                step="any"
                value={editedQuantity}
                onChange={(e) => setEditedQuantity(parseFloat(e.target.value) || 1)}
                className="bg-white px-1.5 py-0.5 rounded border border-emerald-500 text-slate-900 text-xs w-16 focus:outline-none"
                aria-label="Edit quantity"
              />
            ) : (
              <span>{editedQuantity}</span>
            )}
            <span className="text-slate-500">{editedUnit}</span>
          </div>
        )}

        {/* Brand Chip */}
        {parsedCommand.brand && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
            <span className="text-slate-400">Brand:</span>
            <span>{parsedCommand.brand}</span>
          </div>
        )}

        {/* Price Constraint Chip */}
        {parsedCommand.maxPrice !== undefined && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold">
            <span className="text-slate-400">Max:</span>
            <span className="text-emerald-700 font-bold">${parsedCommand.maxPrice}</span>
          </div>
        )}

        {/* Edit toggle button */}
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline underline-offset-2 px-1 cursor-pointer py-1"
        >
          {isEditing ? "Done editing" : "Edit values"}
        </button>
      </div>

      {parsedCommand.intent === "UNKNOWN" && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>Could not determine shopping action. Try saying "Add milk" or "Remove apples".</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isExecuting}
          className="min-h-[38px] px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          Dismiss
        </button>

        {parsedCommand.intent !== "UNKNOWN" && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExecuting}
            className="min-h-[38px] px-5 rounded-full bg-[#0C2B21] hover:bg-emerald-950 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-lime-400" />
            <span>{isExecuting ? "Executing..." : "Execute Command"}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
