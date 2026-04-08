import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon?: ReactNode;
  borderColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  change,
  changeType,
  icon,
  borderColor = "border-emerald-700",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`flex flex-col justify-between rounded-lg border border-border-main bg-surface p-4 transition-colors duration-300 ${className}`}
    >
      <div className={`mb-3 h-1 w-full rounded-full ${borderColor}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
        </div>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-secondary text-text-tertiary">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {change && (
          <span
            className={`text-xs font-medium ${changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-500" : "text-text-tertiary"}`}
          >
            {change}
          </span>
        )}
        {subtitle && !change && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="text-[11px] text-text-tertiary">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
