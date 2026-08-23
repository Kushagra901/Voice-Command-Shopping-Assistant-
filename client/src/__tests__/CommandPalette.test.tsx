import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { CommandPalette } from "../components/CommandPalette.js";
import { useCommandPalette } from "../hooks/useCommandPalette.js";

describe("CommandPalette Component & useCommandPalette Hook Suite", () => {
  const mockOnClose = vi.fn();
  const mockOnExecuteCommand = vi.fn();
  const mockOnNavigateTab = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCommandPalette Hook", () => {
    it("initializes with isOpen false and responds to toggle/open/close", () => {
      const { result } = renderHook(() => useCommandPalette());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);
    });

    it("listens to global Ctrl+K and Cmd+K shortcuts to toggle palette", () => {
      const { result } = renderHook(() => useCommandPalette());

      expect(result.current.isOpen).toBe(false);

      // Trigger Ctrl+K
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
      });
      expect(result.current.isOpen).toBe(true);

      // Trigger Cmd+K (metaKey) to toggle off
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      });
      expect(result.current.isOpen).toBe(false);
    });

    it("listens to Escape key to close palette when open", () => {
      const { result } = renderHook(() => useCommandPalette());

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe("CommandPalette UI & Interaction", () => {
    it("does not render when isOpen is false", () => {
      const { container } = render(
        <CommandPalette
          isOpen={false}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders modal dialog with search input and default command categories when open", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type a command or search/i)).toBeInTheDocument();
      expect(screen.getByText("Add Milk")).toBeInTheDocument();
      expect(screen.getByText("Undo Last Action")).toBeInTheDocument();
      expect(screen.getByText("2 Packet Doodh Add Karo")).toBeInTheDocument();
    });

    it("filters suggestions as user types into search input", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      const input = screen.getByPlaceholderText(/type a command or search/i);
      fireEvent.change(input, { target: { value: "milk" } });

      // Should show milk related commands
      expect(screen.getByText("Add Milk")).toBeInTheDocument();
      expect(screen.getByText("Change Milk Quantity to 3")).toBeInTheDocument();
      expect(screen.getByText("Mark Milk as Purchased")).toBeInTheDocument();

      // Dynamic execute option should also be displayed
      expect(screen.getByText(/execute:/i)).toBeInTheDocument();
    });

    it("executes standard command option when clicked", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      const milkOption = screen.getByText("Add Milk");
      fireEvent.click(milkOption);

      expect(mockOnExecuteCommand).toHaveBeenCalledWith("Add 2 bottles of milk");
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("switches navigation tab when navigation option is clicked", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      const searchTabOption = screen.getByText("View Catalog Search");
      fireEvent.click(searchTabOption);

      expect(mockOnNavigateTab).toHaveBeenCalledWith("search");
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("executes custom freeform voice command typed by user when clicking execute chip", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      const input = screen.getByPlaceholderText(/type a command or search/i);
      fireEvent.change(input, { target: { value: "add 4 packets of cheese" } });

      const executeChip = screen.getByText(/execute: "add 4 packets of cheese"/i);
      fireEvent.click(executeChip);

      expect(mockOnExecuteCommand).toHaveBeenCalledWith("add 4 packets of cheese");
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("closes modal when clicking outside on backdrop", () => {
      render(
        <CommandPalette
          isOpen={true}
          onClose={mockOnClose}
          onExecuteCommand={mockOnExecuteCommand}
          onNavigateTab={mockOnNavigateTab}
        />
      );

      const backdrop = screen.getByRole("dialog");
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
