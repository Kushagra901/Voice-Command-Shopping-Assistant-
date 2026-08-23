import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandChips } from "../components/CommandChips.js";
import type { ParsedCommand } from "@voice-shopping/shared";

const mockCommand: ParsedCommand = {
  intent: "ADD_ITEM",
  itemName: "Almond Milk",
  quantity: 2,
  unit: "cartons",
  brand: "Silk",
  rawText: "Add 2 cartons of Silk almond milk",
  confidence: 0.95
};

describe("CommandChips Component", () => {
  const onExecute = vi.fn();
  const onDismiss = vi.fn();

  it("renders parsed command fields as interactive preview chips", () => {
    render(
      <CommandChips
        parsedCommand={mockCommand}
        onExecute={onExecute}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText(/parsed command preview/i)).toBeInTheDocument();
    expect(screen.getByText("Confidence: 95%")).toBeInTheDocument();
    expect(screen.getByText('"Add 2 cartons of Silk almond milk"')).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Almond Milk")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("cartons")).toBeInTheDocument();
    expect(screen.getByText("Silk")).toBeInTheDocument();
  });

  it("allows editing item and quantity in edit mode and dispatches updated command", () => {
    render(
      <CommandChips
        parsedCommand={mockCommand}
        onExecute={onExecute}
        onDismiss={onDismiss}
      />
    );

    // Click Edit values
    const editToggle = screen.getByRole("button", { name: /edit values/i });
    fireEvent.click(editToggle);

    // Edit item name
    const itemInput = screen.getByLabelText(/edit item name/i);
    fireEvent.change(itemInput, { target: { value: "Oat Milk" } });

    // Edit quantity
    const qtyInput = screen.getByLabelText(/edit quantity/i);
    fireEvent.change(qtyInput, { target: { value: "3" } });

    // Click Execute Command
    const executeBtn = screen.getByRole("button", { name: /execute command/i });
    fireEvent.click(executeBtn);

    expect(onExecute).toHaveBeenCalledWith({
      ...mockCommand,
      itemName: "Oat Milk",
      quantity: 3,
      unit: "cartons"
    });
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    render(
      <CommandChips
        parsedCommand={mockCommand}
        onExecute={onExecute}
        onDismiss={onDismiss}
      />
    );

    const dismissBtn = screen.getByRole("button", { name: /dismiss command preview/i });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalled();
  });
});
