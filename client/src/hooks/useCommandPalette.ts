import { useState, useEffect, useCallback, useRef } from "react";

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
      previousActiveElementRef.current.focus();
    }
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        previousActiveElementRef.current = document.activeElement as HTMLElement | null;
        return true;
      } else {
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === "function") {
          previousActiveElementRef.current.focus();
        }
        return false;
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggle();
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggle, close]);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle
  };
}
