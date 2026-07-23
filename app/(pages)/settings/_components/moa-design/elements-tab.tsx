"use client";

import { ELEMENT_ITEMS } from "./palette-catalog";
import { PaletteTile, TabHint } from "./ui";

export function MoaElementsTab({
  enabled,
  onPaletteDragStateChange,
}: {
  enabled: boolean;
  onPaletteDragStateChange?: (dragging: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Elements</h3>
        <TabHint>Drag shapes, media, and structure blocks onto the canvas.</TabHint>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {ELEMENT_ITEMS.map((item) => (
          <PaletteTile
            key={item.kind}
            {...item}
            disabled={!enabled}
            onDragStateChange={onPaletteDragStateChange}
          />
        ))}
      </div>
    </div>
  );
}
