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
  labelClassName?: string;
  valueClassName?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function ThreeDotLoader() {
  return (
    <span className="inline-flex items-center gap-[5px] h-[1em]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-[8px] w-[8px] rounded-full bg-text-tertiary"
          style={{
            animation: "dotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

export function StatCard({
  label,
  value,
  subtitle,
  change,
  changeType,
  icon,
  borderColor = "border-[var(--emerald-border)]",
  className = "",
  labelClassName = "",
  valueClassName = "",
  onClick,
  loading = false,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between rounded-lg border border-border-main bg-surface p-5 transition-all duration-300 ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.98]" : ""
      } ${className}`}
    >
      <div className={`mb-4 h-1 w-full rounded-full ${borderColor}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold uppercase tracking-wide text-text-tertiary ${labelClassName}`}>
            {label}
          </p>
          <p className={`mt-1 truncate text-xl sm:text-2xl md:text-3xl font-bold text-text-primary ${valueClassName}`}>
            {loading ? <ThreeDotLoader /> : value}
          </p>
        </div>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-tertiary">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {change && (
          <span
            className={`text-sm font-medium ${changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-500" : "text-text-tertiary"}`}
          >
            {change}
          </span>
        )}
        {subtitle && !change && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="text-xs text-text-tertiary">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
