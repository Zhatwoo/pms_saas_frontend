interface FilterSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "lg";
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  size = "sm",
}: FilterSelectProps) {
  const selectClassName =
    size === "lg"
      ? "h-10 w-full sm:w-48 rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
      : "h-9 rounded-md border border-border-main bg-surface-secondary px-3 text-xs text-text-primary outline-none transition-colors focus:border-emerald-500";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
