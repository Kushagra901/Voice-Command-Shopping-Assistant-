import { describe, it, expect } from "vitest";
import { parseCommand } from "../services/nluParser.js";

describe("Deterministic NLU Parser (AGENTS.md §8 Requirements)", () => {
  it("should parse simple 'Add milk' command", () => {
    const result = parseCommand("Add milk");
    expect(result.intent).toBe("ADD_ITEM");
    expect(result.itemName).toBe("milk");
    expect(result.quantity).toBe(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should parse complex 'I want to buy two bottles of water'", () => {
    const result = parseCommand("I want to buy two bottles of water");
    expect(result.intent).toBe("ADD_ITEM");
    expect(result.itemName).toBe("water");
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe("bottle");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("should parse 'Remove apples from my list'", () => {
    const result = parseCommand("Remove apples from my list");
    expect(result.intent).toBe("REMOVE_ITEM");
    expect(result.itemName).toBe("apples");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("should parse 'Change milk quantity to 3'", () => {
    const result = parseCommand("Change milk quantity to 3");
    expect(result.intent).toBe("UPDATE_ITEM");
    expect(result.itemName).toBe("milk");
    expect(result.quantity).toBe(3);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("should parse 'Find toothpaste under 5 dollars'", () => {
    const result = parseCommand("Find toothpaste under 5 dollars");
    expect(result.intent).toBe("SEARCH_PRODUCT");
    expect(result.itemName).toBe("toothpaste");
    expect(result.maxPrice).toBe(5);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should parse Hinglish command '2 packet doodh add karo'", () => {
    const result = parseCommand("2 packet doodh add karo");
    expect(result.intent).toBe("ADD_ITEM");
    expect(result.itemName).toBe("milk");
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe("packet");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should parse Hinglish command '2 kilo aloo add kar do'", () => {
    const result = parseCommand("2 kilo aloo add kar do");
    expect(result.intent).toBe("ADD_ITEM");
    expect(result.itemName).toBe("potato");
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe("kg");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should parse Hinglish removal 'tamatar remove karo'", () => {
    const result = parseCommand("tamatar remove karo");
    expect(result.intent).toBe("REMOVE_ITEM");
    expect(result.itemName).toBe("tomato");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should parse 'Get suggestions' intent", () => {
    const result = parseCommand("What should I buy next?");
    expect(result.intent).toBe("GET_SUGGESTIONS");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("should classify unknown/garbage commands as UNKNOWN", () => {
    const result = parseCommand("What is the weather in Delhi");
    expect(result.intent).toBe("UNKNOWN");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("should parse brands and dozen units correctly", () => {
    const result = parseCommand("Buy one dozen Amul butter");
    expect(result.intent).toBe("ADD_ITEM");
    expect(result.itemName).toBe("butter");
    expect(result.brand).toBe("Amul");
    expect(result.quantity).toBe(12);
  });

  it("should parse 'Undo that' and revert commands (AGENTS.md §6.5)", () => {
    const undo1 = parseCommand("Undo that");
    expect(undo1.intent).toBe("UNDO");
    expect(undo1.confidence).toBeGreaterThanOrEqual(0.95);

    const undo2 = parseCommand("take that back");
    expect(undo2.intent).toBe("UNDO");

    const undo3 = parseCommand("revert");
    expect(undo3.intent).toBe("UNDO");

    const undo4 = parseCommand("oops");
    expect(undo4.intent).toBe("UNDO");
  });
});
