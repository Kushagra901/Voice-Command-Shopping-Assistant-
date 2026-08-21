import type { ParsedCommand } from "@voice-shopping/shared";
import { parseCommand as executeDeterministicParse } from "./nluParser.js";

/**
 * Swappable command parser interface.
 * Defines the seam allowing substitution with an LLM parser (e.g. OpenAI/Anthropic/Deepgram NLU)
 * in future iterations without altering controller or service contracts.
 */
export interface ICommandParser {
  parse(rawText: string): Promise<ParsedCommand> | ParsedCommand;
}

const FILLER_WORDS = [
  "please", "can you", "could you", "would you", "kindly", "hey assistant",
  "hey", "hi", "hello", "assistant", "okay", "ok", "um", "uh", "just",
  "now", "quickly", "zara", "kripya", "arey", "yaar", "jaldi se", "ek baar",
  "for me", "to me"
];

/**
 * Strips conversational filler words and pleasantries to isolate shopping intent.
 */
export function stripFillerWords(text: string): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.toLowerCase().trim();
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    cleaned = cleaned.replace(regex, "");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Deterministic command parser implementation adhering to ICommandParser.
 */
export class DeterministicCommandParser implements ICommandParser {
  parse(rawText: string): ParsedCommand {
    if (!rawText || !rawText.trim()) {
      return {
        intent: "UNKNOWN",
        rawText: rawText || "",
        confidence: 0
      };
    }

    // 1. Strip conversational fillers while preserving core intent
    const stripped = stripFillerWords(rawText);

    // 2. Delegate to the deterministic parser with Hinglish alias resolution
    const parsed = executeDeterministicParse(stripped || rawText);

    // Preserve the original unstripped rawText for audit fidelity
    return {
      ...parsed,
      rawText: rawText.trim()
    };
  }
}

// Export singleton default instance
export const defaultParser: ICommandParser = new DeterministicCommandParser();
