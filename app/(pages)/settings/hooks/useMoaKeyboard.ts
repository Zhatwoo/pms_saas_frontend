// hooks/useMoaKeyboard.ts
"use client";

import { useEffect, useRef } from "react";

type UseMoaKeyboardParams = {
  enabled?: boolean;
  /** When true, Delete/Backspace apply to canvas selection even if focus is in a page-doc textarea. */
  canvasSelectionActive?: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleUnderline?: () => void;
};

/**
 * Registers global keyboard shortcuts for the MOA editor.
 * Handlers are read from a ref so the listener is registered once (avoids rebind lag).
 */
export function useMoaKeyboard({
  enabled = true,
  canvasSelectionActive = false,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onUndo,
  onRedo,
  onSelectAll,
  onClearSelection,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
}: UseMoaKeyboardParams) {
  const handlersRef = useRef({
    enabled,
    canvasSelectionActive,
    onDelete,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onUndo,
    onRedo,
    onSelectAll,
    onClearSelection,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
  });
  handlersRef.current = {
    enabled,
    canvasSelectionActive,
    onDelete,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onUndo,
    onRedo,
    onSelectAll,
    onClearSelection,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;
      if (!h.enabled) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName;
      const isPageDocTextarea =
        tag === "TEXTAREA" && target.dataset.moaPageDoc === "true";
      const isOtherEditable =
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "SELECT" ||
        (tag === "TEXTAREA" && !isPageDocTextarea);

      // Never steal shortcuts from settings inputs / other forms
      if (isOtherEditable) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd+A — select all text across pages (works inside page-doc)
      if (mod && key === "a") {
        e.preventDefault();
        e.stopPropagation();
        h.onSelectAll?.();
        return;
      }

      // Formatting shortcuts work in page-doc and on canvas selection
      if (mod && key === "b") {
        e.preventDefault();
        h.onToggleBold?.();
        return;
      }
      if (mod && key === "i") {
        e.preventDefault();
        h.onToggleItalic?.();
        return;
      }
      if (mod && key === "u") {
        e.preventDefault();
        h.onToggleUnderline?.();
        return;
      }

      // Escape always clears selection
      if (e.key === "Escape") {
        h.onClearSelection?.();
        return;
      }

      // While typing in a single page-doc (not a canvas multi-selection), let native edit keys work
      if (isPageDocTextarea && !h.canvasSelectionActive) {
        if (mod && (key === "z" || key === "y")) {
          // still allow undo/redo while typing
        } else {
          return;
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !mod) {
        if (isPageDocTextarea && !h.canvasSelectionActive) return;
        e.preventDefault();
        h.onDelete?.();
        return;
      }

      if (!mod) return;

      switch (key) {
        case "z":
          e.preventDefault();
          if (e.shiftKey) h.onRedo?.();
          else h.onUndo?.();
          break;
        case "y":
          e.preventDefault();
          h.onRedo?.();
          break;
        case "c":
          if (isPageDocTextarea && !h.canvasSelectionActive) return;
          e.preventDefault();
          h.onCopy?.();
          break;
        case "x":
          if (isPageDocTextarea && !h.canvasSelectionActive) return;
          e.preventDefault();
          h.onCut?.();
          break;
        case "v":
          if (isPageDocTextarea && !h.canvasSelectionActive) return;
          e.preventDefault();
          h.onPaste?.();
          break;
        case "d":
          e.preventDefault();
          h.onDuplicate?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}





