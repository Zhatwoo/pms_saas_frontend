"use client";

import { useRef, type ReactNode } from "react";
import {
  MOA_PALETTE_MIME,
  type MoaPaletteItemKind,
} from "../moa-design-palette";

export function ToolBtn({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded border text-zinc-700 transition disabled:opacity-40 ${
        active
          ? "border-emerald-600 bg-emerald-100 text-emerald-800"
          : "border-zinc-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"
      }`}
    >
      {children}
    </button>
  );
}

export function PaletteTile({
  kind,
  label,
  icon,
  hint,
  disabled,
  onDragStateChange,
  onAdd,
}: {
  kind: MoaPaletteItemKind;
  label: string;
  icon: ReactNode;
  hint: string;
  disabled?: boolean;
  onDragStateChange?: (dragging: boolean) => void;
  onAdd?: (kind: MoaPaletteItemKind) => void;
}) {
  const draggedRef = useRef(false);

  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      title={`${hint}${onAdd ? " · Click to add" : ""}`}
      onDragStart={(event) => {
        if (disabled) return;
        draggedRef.current = true;
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(MOA_PALETTE_MIME, kind);
        event.dataTransfer.setData("text/plain", kind);
        onDragStateChange?.(true);
      }}
      onDragEnd={() => {
        onDragStateChange?.(false);
        // Avoid click-to-add firing right after a drag.
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (disabled || !onAdd || draggedRef.current) return;
        onAdd(kind);
      }}
      className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-2.5 text-center transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
        {icon}
      </span>
      <span className="text-[9px] font-bold text-zinc-700">{label}</span>
    </button>
  );
}

export function TabHint({ children }: { children: ReactNode }) {
  return <p className="mt-0.5 text-[9px] leading-4 text-zinc-500">{children}</p>;
}
