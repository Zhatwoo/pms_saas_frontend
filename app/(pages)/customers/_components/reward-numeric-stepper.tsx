"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  adjustRewardNumericValue,
  formatRewardAmountInput,
  formatRewardIntegerInput,
  normalizeRewardNumericInput,
  parseRewardNumericInput,
} from "@/lib/reward-form";

type RewardNumericStepperProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: readonly number[];
  min?: number;
  formatMode?: "amount" | "integer" | "percent";
  required?: boolean;
};

function formatDisplayValue(value: string, formatMode: RewardNumericStepperProps["formatMode"]) {
  if (formatMode === "amount") return formatRewardAmountInput(value);
  if (formatMode === "integer") return formatRewardIntegerInput(value);
  return normalizeRewardNumericInput(value);
}

function formatPresetLabel(preset: number) {
  return preset.toLocaleString("en-PH", { maximumFractionDigits: 0 });
}

export function RewardNumericStepper({
  label,
  value,
  onChange,
  presets,
  min = 0,
  formatMode = "amount",
  required,
}: RewardNumericStepperProps) {
  const defaultPreset = presets[0] ?? 1;
  const [selectedPreset, setSelectedPreset] = useState<number | "other">(defaultPreset);
  const [customStep, setCustomStep] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isFocused) {
      setDraft(value);
    }
  }, [value, isFocused]);

  const effectiveStep = useMemo(() => {
    if (selectedPreset === "other") {
      return Math.max(0, parseRewardNumericInput(customStep));
    }
    return selectedPreset;
  }, [customStep, selectedPreset]);

  const commitDraft = () => {
    setIsFocused(false);
    const normalized = normalizeRewardNumericInput(draft);
    const parsed = parseRewardNumericInput(normalized);
    const next = min !== undefined ? Math.max(min, parsed) : parsed;
    onChange(normalizeRewardNumericInput(String(next)));
  };

  const adjust = (direction: 1 | -1) => {
    onChange(adjustRewardNumericValue(value, direction, effectiveStep || defaultPreset, min));
  };

  const displayValue = isFocused ? draft : formatDisplayValue(value, formatMode);

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-text-secondary">{label}</label>
      <div className="inline-flex w-full items-stretch overflow-hidden rounded-lg border border-border-main bg-surface-secondary">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => adjust(-1)}
          className="inline-flex w-10 shrink-0 items-center justify-center border-r border-border-main text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          required={required}
          onFocus={() => {
            setIsFocused(true);
            setDraft(normalizeRewardNumericInput(value));
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraft();
              event.currentTarget.blur();
            }
          }}
          onChange={(event) => setDraft(event.target.value.replace(/,/g, ""))}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-text-primary outline-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => adjust(1)}
          className="inline-flex w-10 shrink-0 items-center justify-center border-l border-border-main text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-tertiary">By:</span>
        {presets.map((preset) => {
          const isActive = selectedPreset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => setSelectedPreset(preset)}
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {formatPresetLabel(preset)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSelectedPreset("other")}
          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
            selectedPreset === "other"
              ? "border-brand-green bg-brand-green/10 text-brand-green"
              : "border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover"
          }`}
        >
          Other
        </button>
        {selectedPreset === "other" && (
          <input
            type="text"
            inputMode="decimal"
            value={customStep}
            onChange={(event) => setCustomStep(event.target.value.replace(/,/g, ""))}
            placeholder="Custom"
            className="w-20 rounded-md border border-border-main bg-surface px-2 py-0.5 text-[11px] text-text-primary outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        )}
      </div>
    </div>
  );
}
