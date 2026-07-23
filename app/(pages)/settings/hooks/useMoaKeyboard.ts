// hooks/useMoaKeyboard.ts
"use client";

import { useEffect } from "react";

type UseMoaKeyboardParams = {
  onDelete?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

/**
 * Registers global keyboard shortcuts for the MOA editor.
 * Shortcuts: Delete, Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+C (Copy), Ctrl+X (Cut),
 * Ctrl+V (Paste), Ctrl+D (Duplicate).
 * The handler ignores events originating from input/textarea/contenteditable elements.
 */
export function useMoaKeyboard({
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onUndo,
  onRedo,
}: UseMoaKeyboardParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA";
      if (isEditable) return;

      // Delete or Backspace key without modifiers
      if ((e.key === "Delete" || e.key === "Backspace") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onDelete?.();
        return;
      }

      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            onUndo?.();
            break;
          case "y":
            e.preventDefault();
            onRedo?.();
            break;
          case "c":
            e.preventDefault();
            onCopy?.();
            break;
          case "x":
            e.preventDefault();
            onCut?.();
            break;
          case "v":
            e.preventDefault();
            onPaste?.();
            break;
          case "d":
            e.preventDefault();
            onDuplicate?.();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDelete, onCopy, onCut, onPaste, onDuplicate, onUndo, onRedo]);
}
