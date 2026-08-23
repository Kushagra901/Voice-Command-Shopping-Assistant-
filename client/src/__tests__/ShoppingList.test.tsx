import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShoppingList } from "../components/ShoppingList.js";
import type { ShoppingItem } from "@voice-shopping/shared";

const mockItems: ShoppingItem[] = [
  {
    id: "item-1",
    name: "Organic Whole Milk",
    quantity: 2,
    unit: "bottle",
    category: "Dairy",
    isPurchased: false,
    price: 3.99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "item-2",
    name: "Fresh Honeycrisp Apples",
    quantity: 6,
    unit: "pcs",
    category: "Produce",
    isPurchased: true,
    price: 5.49,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe("ShoppingList Component", () => {
  const onTogglePurchased = vi.fn();
  const onUpdateQuantity = vi.fn();
  const onDeleteItem = vi.fn();
  const onQuickAdd = vi.fn();

  it("renders shopping items grouped by category", () => {
    render(
      <ShoppingList
        items={mockItems}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    expect(screen.getByText("Shopping List")).toBeInTheDocument();
    expect(screen.getByText("Dairy")).toBeInTheDocument();
    expect(screen.getByText("Organic Whole Milk")).toBeInTheDocument();
    expect(screen.getByText("Produce")).toBeInTheDocument();
    expect(screen.getByText("Fresh Honeycrisp Apples")).toBeInTheDocument();
  });

  it("shows empty state and quick-add buttons when items list is empty", () => {
    render(
      <ShoppingList
        items={[]}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    expect(screen.getByText("Your shopping list is empty")).toBeInTheDocument();
    const quickAddMilk = screen.getByRole("button", { name: /\+ add milk/i });
    expect(quickAddMilk).toBeInTheDocument();

    fireEvent.click(quickAddMilk);
    expect(onQuickAdd).toHaveBeenCalledWith("Whole Milk", "Dairy");
  });

  it("calls onDeleteItem when delete button and modal confirm are clicked", () => {
    render(
      <ShoppingList
        items={mockItems}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    const deleteMilkBtn = screen.getByRole("button", { name: /delete organic whole milk/i });
    fireEvent.click(deleteMilkBtn);

    const confirmDeleteBtn = screen.getByRole("button", { name: /remove item/i });
    fireEvent.click(confirmDeleteBtn);
    expect(onDeleteItem).toHaveBeenCalledWith("item-1");
  });

  it("calls onTogglePurchased when item checkbox button is clicked", () => {
    render(
      <ShoppingList
        items={mockItems}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    const checkMilkBtn = screen.getByRole("button", { name: /mark organic whole milk as purchased/i });
    fireEvent.click(checkMilkBtn);
    expect(onTogglePurchased).toHaveBeenCalledWith(mockItems[0]);
  });

  it("calls onUpdateQuantity when quantity stepper buttons are clicked", () => {
    render(
      <ShoppingList
        items={mockItems}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    const increaseBtn = screen.getByRole("button", { name: /increase quantity for organic whole milk/i });
    fireEvent.click(increaseBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith(mockItems[0], 3);

    const decreaseBtn = screen.getByRole("button", { name: /decrease quantity for organic whole milk/i });
    fireEvent.click(decreaseBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith(mockItems[0], 1);
  });

  it("filters items by status pills (Pending vs Bought)", () => {
    render(
      <ShoppingList
        items={mockItems}
        onTogglePurchased={onTogglePurchased}
        onUpdateQuantity={onUpdateQuantity}
        onDeleteItem={onDeleteItem}
        onQuickAdd={onQuickAdd}
      />
    );

    // Click Pending filter pill
    const pendingPill = screen.getByRole("button", { name: /pending \(1\)/i });
    fireEvent.click(pendingPill);
    expect(screen.getByText("Organic Whole Milk")).toBeInTheDocument();
    expect(screen.queryByText("Fresh Honeycrisp Apples")).not.toBeInTheDocument();

    // Click Bought filter pill
    const boughtPill = screen.getByRole("button", { name: /bought \(1\)/i });
    fireEvent.click(boughtPill);
    expect(screen.getByText("Fresh Honeycrisp Apples")).toBeInTheDocument();
    expect(screen.queryByText("Organic Whole Milk")).not.toBeInTheDocument();
  });
});
