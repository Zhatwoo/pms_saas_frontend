"use client";

import { useEffect, useRef, useState } from "react";
import { useAccent } from "@/contexts/accent-context";
import { cn } from "@/lib/utils";

type AccentPickerVariant = "default" | "onDark";

interface AccentPickerProps {
  className?: string;
  variant?: AccentPickerVariant;
}

function PaletteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22a10 10 0 1 1 0-20c5 0 9 3.5 9 8a4.5 4.5 0 0 1-4.5 4.5H14a1.5 1.5 0 0 0-1 2.6c.4.4.6.9.6 1.4 0 1.1-.9 2-2 2z" />
      <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AccentPicker({ className, variant = "default" }: AccentPickerProps) {
  const { accent, presets, setAccent, isTransitioning } = useAccent();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isTransitioning}
        aria-label="Customize theme color"
        aria-expanded={open}
        title="Customize theme color"
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pawn-gold/60 focus-visible:ring-offset-2",
          variant === "onDark"
            ? "text-white/80 hover:bg-white/10 hover:text-amber-300"
            : "text-text-tertiary hover:bg-surface-hover hover:text-pawn-gold",
          isTransitioning && "pointer-events-none opacity-75",
          open && (variant === "onDark" ? "bg-white/10 text-amber-300" : "bg-surface-hover text-pawn-gold"),
          className,
        )}
      >
        <PaletteIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border-main bg-header-bg p-4 shadow-xl"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-tertiary">
            Theme Color
          </p>
          <div className="grid grid-cols-5 gap-3">
            {presets.map((preset) => {
              const isActive = preset.id === accent;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  title={preset.label}
                  onClick={(event) => {
                    setAccent(preset.id, event);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-header-bg transition-all",
                      isActive ? "ring-text-primary" : "ring-transparent hover:ring-border-main",
                    )}
                    style={{ backgroundColor: preset.swatch }}
                  >
                    {isActive && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-text-tertiary">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
