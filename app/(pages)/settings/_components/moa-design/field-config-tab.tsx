"use client";

import type { DragEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  MOA_CONFIG_FIELD_MIME,
  type MoaConfigFieldPayload,
} from "../moa-design-palette";
import { MoaSortableGroup, MoaSortableItem } from "../moa-dnd";
import { TabHint } from "./ui";

export type MoaFieldConfigOption<T extends string> = {
  key: T;
  label: string;
};

export type MoaCustomField = {
  id: string;
  label: string;
};

function startConfigFieldDrag(
  event: DragEvent,
  payload: MoaConfigFieldPayload,
  onPaletteDragStateChange?: (dragging: boolean) => void,
) {
  event.stopPropagation();
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(MOA_CONFIG_FIELD_MIME, JSON.stringify(payload));
  event.dataTransfer.setData("text/plain", `moa-field:${payload.key}`);
  onPaletteDragStateChange?.(true);
}

type FieldSectionProps<T extends string> = {
  title: string;
  enabled: boolean;
  groupKey: string;
  activeKeys: T[];
  options: Array<MoaFieldConfigOption<T>>;
  customFields: MoaCustomField[];
  newFieldValue: string;
  newFieldPlaceholder: string;
  onReorderActive: (nextIds: string[]) => void;
  onReorderCustom: (nextIds: string[]) => void;
  onRemoveActive: (key: T) => void;
  onAddActive: (key: T) => void;
  onCustomLabelChange: (id: string, label: string) => void;
  onRemoveCustom: (id: string) => void;
  onNewFieldChange: (value: string) => void;
  onAddCustom: () => void;
  onPaletteDragStateChange?: (dragging: boolean) => void;
};

function FieldSection<T extends string>({
  title,
  enabled,
  groupKey,
  activeKeys,
  options,
  customFields,
  newFieldValue,
  newFieldPlaceholder,
  onReorderActive,
  onReorderCustom,
  onRemoveActive,
  onAddActive,
  onCustomLabelChange,
  onRemoveCustom,
  onNewFieldChange,
  onAddCustom,
  onPaletteDragStateChange,
}: FieldSectionProps<T>) {
  const inactive = options.filter((field) => !activeKeys.includes(field.key));
  const labelByKey = new Map(options.map((field) => [field.key, field.label]));

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-700">{title}</p>

      <MoaSortableGroup
        group={`${groupKey}-active`}
        enabled={enabled && activeKeys.length > 1}
        itemIds={activeKeys}
        onReorderIds={onReorderActive}
      >
        <div className="space-y-1">
          {activeKeys.map((key) => {
            const label = labelByKey.get(key) ?? key;
            return (
              <MoaSortableItem
                key={key}
                id={key}
                variant="panel"
                handleLabel={`Reorder ${label}`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span
                    draggable={enabled}
                    title="Drag onto canvas"
                    onDragStart={(event) =>
                      startConfigFieldDrag(
                        event,
                        { key: String(key), label },
                        onPaletteDragStateChange,
                      )
                    }
                    onDragEnd={() => onPaletteDragStateChange?.(false)}
                    className={`min-w-0 flex-1 truncate rounded px-1 py-0.5 text-[10px] font-semibold text-zinc-800 ${
                      enabled
                        ? "cursor-grab hover:bg-white active:cursor-grabbing"
                        : ""
                    }`}
                  >
                    {label}
                  </span>
                  <button
                    type="button"
                    data-moa-no-dnd
                    disabled={!enabled}
                    onClick={() => onRemoveActive(key)}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    aria-label={`Delete ${label}`}
                    title={`Delete ${label}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </MoaSortableItem>
            );
          })}
          {activeKeys.length === 0 ? (
            <p className="px-1 py-1.5 text-[9px] text-zinc-400">No fields yet — add from below.</p>
          ) : null}
        </div>
      </MoaSortableGroup>

      {inactive.length > 0 ? (
        <div className="space-y-1 border-t border-zinc-100 pt-2">
          <p className="px-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-400">
            Available
          </p>
          {inactive.map((field) => (
            <div key={field.key} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onAddActive(field.key)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-left text-[10px] font-semibold text-zinc-500 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-40"
              >
                <Plus className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="truncate">{field.label}</span>
              </button>
              <span
                draggable={enabled}
                title="Drag onto canvas"
                onDragStart={(event) =>
                  startConfigFieldDrag(
                    event,
                    { key: String(field.key), label: field.label },
                    onPaletteDragStateChange,
                  )
                }
                onDragEnd={() => onPaletteDragStateChange?.(false)}
                className={`shrink-0 rounded border border-dashed border-emerald-300 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 ${
                  enabled ? "cursor-grab hover:bg-emerald-50 active:cursor-grabbing" : "opacity-40"
                }`}
              >
                Drag
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <MoaSortableGroup
        group={`${groupKey}-custom`}
        enabled={enabled && customFields.length > 1}
        itemIds={customFields.map((field) => field.id)}
        onReorderIds={onReorderCustom}
      >
        <div className="space-y-1">
          {customFields.map((field) => (
            <MoaSortableItem
              key={field.id}
              id={field.id}
              variant="panel"
              handleLabel={`Reorder ${field.label}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span
                  draggable={enabled}
                  title="Drag onto canvas"
                  onDragStart={(event) =>
                    startConfigFieldDrag(
                      event,
                      { key: field.id, label: field.label || "Custom field" },
                      onPaletteDragStateChange,
                    )
                  }
                  onDragEnd={() => onPaletteDragStateChange?.(false)}
                  className={`shrink-0 rounded border border-dashed border-emerald-300 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 ${
                    enabled ? "cursor-grab hover:bg-emerald-50 active:cursor-grabbing" : "opacity-40"
                  }`}
                >
                  Drag
                </span>
                <input
                  data-moa-no-dnd
                  value={field.label}
                  onChange={(event) => onCustomLabelChange(field.id, event.target.value)}
                  disabled={!enabled}
                  className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  data-moa-no-dnd
                  onClick={() => onRemoveCustom(field.id)}
                  disabled={!enabled}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  aria-label={`Delete ${field.label}`}
                  title={`Delete ${field.label}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </MoaSortableItem>
          ))}
        </div>
      </MoaSortableGroup>

      <div className="flex gap-1 pt-0.5">
        <input
          value={newFieldValue}
          onChange={(event) => onNewFieldChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddCustom();
            }
          }}
          disabled={!enabled}
          placeholder={newFieldPlaceholder}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[10px] outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onAddCustom}
          disabled={!enabled || !newFieldValue.trim()}
          className="rounded bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export type MoaFieldConfigTabProps = {
  enabled: boolean;
  categoryLabel: string;
  groupSuffix: string;
  financialOptions: Array<MoaFieldConfigOption<string>>;
  unitOptions: Array<MoaFieldConfigOption<string>>;
  financialFields: string[];
  unitFields: string[];
  customFinancialFields: MoaCustomField[];
  customUnitFields: MoaCustomField[];
  newFinancialField: string;
  newUnitField: string;
  onReorderFinancial: (nextIds: string[]) => void;
  onReorderUnit: (nextIds: string[]) => void;
  onReorderCustomFinancial: (nextIds: string[]) => void;
  onReorderCustomUnit: (nextIds: string[]) => void;
  onToggleFinancial: (key: string) => void;
  onToggleUnit: (key: string) => void;
  onCustomFinancialLabelChange: (id: string, label: string) => void;
  onCustomUnitLabelChange: (id: string, label: string) => void;
  onRemoveCustomFinancial: (id: string) => void;
  onRemoveCustomUnit: (id: string) => void;
  onNewFinancialChange: (value: string) => void;
  onNewUnitChange: (value: string) => void;
  onAddCustomFinancial: () => void;
  onAddCustomUnit: () => void;
  onPaletteDragStateChange?: (dragging: boolean) => void;
};

export function MoaFieldConfigTab({
  enabled,
  categoryLabel,
  groupSuffix,
  financialOptions,
  unitOptions,
  financialFields,
  unitFields,
  customFinancialFields,
  customUnitFields,
  newFinancialField,
  newUnitField,
  onReorderFinancial,
  onReorderUnit,
  onReorderCustomFinancial,
  onReorderCustomUnit,
  onToggleFinancial,
  onToggleUnit,
  onCustomFinancialLabelChange,
  onCustomUnitLabelChange,
  onRemoveCustomFinancial,
  onRemoveCustomUnit,
  onNewFinancialChange,
  onNewUnitChange,
  onAddCustomFinancial,
  onAddCustomUnit,
  onPaletteDragStateChange,
}: MoaFieldConfigTabProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">MOA Field Config</h3>
        <TabHint>
          Configure fields for {categoryLabel}. Drag a field label onto the canvas. Use the grip to
          reorder, trash to remove.
        </TabHint>
      </div>

      <FieldSection
        title="Financial Details"
        enabled={enabled}
        groupKey={`panel-financial-${groupSuffix}`}
        activeKeys={financialFields}
        options={financialOptions}
        customFields={customFinancialFields}
        newFieldValue={newFinancialField}
        newFieldPlaceholder="New financial field"
        onReorderActive={onReorderFinancial}
        onReorderCustom={onReorderCustomFinancial}
        onRemoveActive={onToggleFinancial}
        onAddActive={onToggleFinancial}
        onCustomLabelChange={onCustomFinancialLabelChange}
        onRemoveCustom={onRemoveCustomFinancial}
        onNewFieldChange={onNewFinancialChange}
        onAddCustom={onAddCustomFinancial}
        onPaletteDragStateChange={onPaletteDragStateChange}
      />

      <FieldSection
        title="Unit Description"
        enabled={enabled}
        groupKey={`panel-unit-${groupSuffix}`}
        activeKeys={unitFields}
        options={unitOptions}
        customFields={customUnitFields}
        newFieldValue={newUnitField}
        newFieldPlaceholder="New unit field"
        onReorderActive={onReorderUnit}
        onReorderCustom={onReorderCustomUnit}
        onRemoveActive={onToggleUnit}
        onAddActive={onToggleUnit}
        onCustomLabelChange={onCustomUnitLabelChange}
        onRemoveCustom={onRemoveCustomUnit}
        onNewFieldChange={onNewUnitChange}
        onAddCustom={onAddCustomUnit}
        onPaletteDragStateChange={onPaletteDragStateChange}
      />
    </div>
  );
}
