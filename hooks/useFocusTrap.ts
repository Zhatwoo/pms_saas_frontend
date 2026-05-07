// hooks/useFocusTrap.ts
// Simple focus trap hook for modal dialogs
// When 'active' is true, focus is moved to the supplied ref element and trapped within.
// On deactivation, focus returns to the element that was focused before activation.

import { useEffect, useRef } from "react";

export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Save the element that had focus before opening the modal
    previouslyFocused.current = document.activeElement as HTMLElement;
    // Focus the container or the first focusable child
    const focusable = container.querySelector<HTMLElement>(
      "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    (focusable ?? container).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const isShift = e.shiftKey;

      if (isShift && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!isShift && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      previouslyFocused.current?.focus();
    };
  }, [active, containerRef]);
}
