"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { GripVertical } from "lucide-react";

export type SlipSectionId =
  | "shopHeader"
  | "copyMeta"
  | "title"
  | "dates"
  | "agreement"
  | "unitFields"
  | "signatures";

export const DEFAULT_SLIP_SECTION_ORDER: SlipSectionId[] = [
  "shopHeader",
  "copyMeta",
  "title",
  "dates",
  "agreement",
  "unitFields",
  "signatures",
];

export const SLIP_SECTION_LABELS: Record<SlipSectionId, string> = {
  shopHeader: "Shop header",
  copyMeta: "Copy / Unit code",
  title: "MOA title",
  dates: "Dates & IDs",
  agreement: "Agreement text",
  unitFields: "Unit & financial fields",
  signatures: "Signatures & renewals",
};

const LAYOUT_STORAGE_KEY = "pms.moa.slipSectionOrder.v1";

export function loadSlipSectionOrder(categoryKey: string): SlipSectionId[] {
  if (typeof window === "undefined") return [...DEFAULT_SLIP_SECTION_ORDER];
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return [...DEFAULT_SLIP_SECTION_ORDER];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    const stored = parsed[categoryKey];
    if (!Array.isArray(stored)) return [...DEFAULT_SLIP_SECTION_ORDER];
    const known = new Set(DEFAULT_SLIP_SECTION_ORDER);
    const next = stored.filter((id): id is SlipSectionId => known.has(id as SlipSectionId));
    for (const id of DEFAULT_SLIP_SECTION_ORDER) {
      if (!next.includes(id)) next.push(id);
    }
    return next;
  } catch {
    return [...DEFAULT_SLIP_SECTION_ORDER];
  }
}

export function saveSlipSectionOrder(categoryKey: string, order: SlipSectionId[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[categoryKey] = order;
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  if (fromIndex >= list.length || toIndex >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

type DnDContextValue = {
  group: string;
  enabled: boolean;
  activeId: string | null;
  overId: string | null;
  setActiveId: (id: string | null) => void;
  setOverId: (id: string | null) => void;
  onReorder: (fromId: string, toId: string) => void;
};

const MoaDnDContext = createContext<DnDContextValue | null>(null);

export function MoaSortableGroup({
  group,
  enabled,
  itemIds,
  onReorderIds,
  children,
}: {
  group: string;
  enabled: boolean;
  itemIds: string[];
  onReorderIds: (nextIds: string[]) => void;
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const idsRef = useRef(itemIds);
  idsRef.current = itemIds;

  const onReorder = useCallback(
    (fromId: string, toId: string) => {
      const ids = idsRef.current;
      const fromIndex = ids.indexOf(fromId);
      const toIndex = ids.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
      onReorderIds(reorderList(ids, fromIndex, toIndex));
    },
    [onReorderIds],
  );

  const value = useMemo(
    () => ({
      group,
      enabled,
      activeId,
      overId,
      setActiveId,
      setOverId,
      onReorder,
    }),
    [activeId, enabled, group, onReorder, overId],
  );

  return <MoaDnDContext.Provider value={value}>{children}</MoaDnDContext.Provider>;
}

function isNoDndTarget(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest?.("[data-moa-no-dnd]"));
}

export function MoaSortableItem({
  id,
  children,
  className = "",
  handleLabel = "Drag to reorder",
  variant = "block",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  handleLabel?: string;
  variant?: "block" | "field" | "panel";
}) {
  const ctx = useContext(MoaDnDContext);
  const reactId = useId();
  if (!ctx) {
    return <div className={className}>{children}</div>;
  }

  const { group, enabled, activeId, overId, setActiveId, setOverId, onReorder } = ctx;
  const isActive = activeId === id;
  const isOver = overId === id && activeId !== id;

  const beginDrag = (event: DragEvent<HTMLElement>) => {
    if (!enabled) return;
    if (isNoDndTarget(event.target)) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/moa-dnd-group", group);
    event.dataTransfer.setData("text/moa-dnd-id", id);
    event.dataTransfer.setData("text/plain", id);
    setActiveId(id);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled || !activeId) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    const dragGroup = event.dataTransfer.getData("text/moa-dnd-group");
    const fromId = event.dataTransfer.getData("text/moa-dnd-id");
    if (dragGroup !== group || !fromId) return;
    onReorder(fromId, id);
    setActiveId(null);
    setOverId(null);
  };

  const handleDragEnd = (event: DragEvent<HTMLElement>) => {
    event.stopPropagation();
    setActiveId(null);
    setOverId(null);
  };

  const shell =
    variant === "block"
      ? `relative rounded-sm transition-shadow ${
          enabled
            ? "hover:ring-1 hover:ring-sky-300/80 hover:bg-sky-50/40"
            : ""
        } ${isActive ? "opacity-60 ring-2 ring-sky-400 bg-sky-50/70 shadow-md" : ""} ${
          isOver ? "ring-2 ring-emerald-400 bg-emerald-50/50" : ""
        }`
      : variant === "field"
        ? `relative rounded-sm transition-colors ${
            enabled ? "hover:bg-sky-50/60" : ""
          } ${isActive ? "opacity-50 bg-sky-50" : ""} ${
            isOver ? "bg-emerald-50 ring-1 ring-emerald-400" : ""
          }`
        : `relative flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 px-1.5 py-1 transition-colors ${
            enabled ? "hover:border-emerald-300 hover:bg-emerald-50/70" : ""
          } ${isActive ? "opacity-50 border-sky-300 bg-sky-50" : ""} ${
            isOver ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400" : ""
          }`;

  return (
    <div
      className={`${shell} ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={() => {
        if (overId === id) setOverId(null);
      }}
      data-moa-sortable={id}
      data-moa-dnd-react={reactId}
    >
      {enabled && (
        <span
          role="button"
          tabIndex={0}
          draggable
          onDragStart={beginDrag}
          onDragEnd={handleDragEnd}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
            }
          }}
          aria-label={handleLabel}
          title={handleLabel}
          className={`moa-dnd-handle z-20 flex cursor-grab items-center justify-center rounded border border-sky-200 bg-white text-sky-600 shadow-sm active:cursor-grabbing ${
            variant === "block"
              ? "absolute -left-1 top-1 h-5 w-4 opacity-80 hover:opacity-100"
              : variant === "field"
                ? "absolute -left-0.5 top-0.5 h-4 w-3.5 opacity-70 hover:opacity-100"
                : "relative h-6 w-5 shrink-0 opacity-90 hover:opacity-100"
          }`}
        >
          <GripVertical
            className={
              variant === "panel" || variant === "block" ? "h-3.5 w-3.5" : "h-3 w-3"
            }
          />
        </span>
      )}
      <div
        className={
          variant === "panel"
            ? "min-w-0 flex-1"
            : enabled
              ? variant === "block"
                ? "pl-4"
                : "pl-3.5"
              : ""
        }
      >
        {children}
      </div>
    </div>
  );
}
