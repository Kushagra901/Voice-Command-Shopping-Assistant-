import { describe, it, expect } from "vitest";
import { classifyCategory } from "@voice-shopping/shared";

describe("Category Classifier (AGENTS.md §5 & §8)", () => {
  it("should classify Dairy items in English and Hinglish", () => {
    expect(classifyCategory("milk")).toBe("Dairy");
    expect(classifyCategory("doodh")).toBe("Dairy");
    expect(classifyCategory("butter")).toBe("Dairy");
    expect(classifyCategory("makkhan")).toBe("Dairy");
    expect(classifyCategory("paneer")).toBe("Dairy");
    expect(classifyCategory("cheddar cheese")).toBe("Dairy");
  });

  it("should classify Produce items in English and Hinglish", () => {
    expect(classifyCategory("apples")).toBe("Produce");
    expect(classifyCategory("seb")).toBe("Produce");
    expect(classifyCategory("banana")).toBe("Produce");
    expect(classifyCategory("aloo")).toBe("Produce");
    expect(classifyCategory("tamatar")).toBe("Produce");
    expect(classifyCategory("pyaaz")).toBe("Produce");
    expect(classifyCategory("fresh spinach")).toBe("Produce");
  });

  it("should classify Bakery items", () => {
    expect(classifyCategory("whole wheat bread")).toBe("Bakery");
    expect(classifyCategory("croissants")).toBe("Bakery");
    expect(classifyCategory("chocolate cake")).toBe("Bakery");
    expect(classifyCategory("muffins")).toBe("Bakery");
  });

  it("should classify Beverages in English and Hinglish", () => {
    expect(classifyCategory("water")).toBe("Beverages");
    expect(classifyCategory("paani")).toBe("Beverages");
    expect(classifyCategory("orange juice")).toBe("Beverages");
    expect(classifyCategory("chai")).toBe("Beverages");
    expect(classifyCategory("sparkling water")).toBe("Beverages");
  });

  it("should classify Snacks in English and Hinglish", () => {
    expect(classifyCategory("potato chips")).toBe("Snacks");
    expect(classifyCategory("biscuits")).toBe("Snacks");
    expect(classifyCategory("dark chocolate")).toBe("Snacks");
    expect(classifyCategory("popcorn")).toBe("Snacks");
  });

  it("should classify Household items", () => {
    expect(classifyCategory("laundry detergent")).toBe("Household");
    expect(classifyCategory("tissues")).toBe("Household");
    expect(classifyCategory("paper towel")).toBe("Household");
    expect(classifyCategory("trash bags")).toBe("Household");
  });

  it("should classify Personal Care items", () => {
    expect(classifyCategory("toothpaste")).toBe("Personal Care");
    expect(classifyCategory("shampoo")).toBe("Personal Care");
    expect(classifyCategory("toothbrush")).toBe("Personal Care");
    expect(classifyCategory("face wash")).toBe("Personal Care");
  });

  it("should fallback unrecognized items to Other", () => {
    expect(classifyCategory("wooden chair")).toBe("Other");
    expect(classifyCategory("usb cable")).toBe("Other");
    expect(classifyCategory("random gadget")).toBe("Other");
  });
});
