interface FilterSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-tertiary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-base text-text-primary outline-none transition-colors duration-200 focus:border-pawn-sidebar"
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
