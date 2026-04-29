import type { ReactNode } from "react";

const variants = {
  info: "bg-emerald-900/80 text-white",
  warning: "bg-amber-50 border border-amber-300 text-amber-800",
  error: "bg-red-50 border border-red-300 text-red-700",
} as const;

interface AlertBannerProps {
  message: string | ReactNode;
  variant?: keyof typeof variants;
  icon?: ReactNode;
  rightContent?: ReactNode;
}

export function AlertBanner({
  message,
  variant = "info",
  icon,
  rightContent,
}: AlertBannerProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-5 py-3 text-base ${variants[variant]}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{message}</span>
      </div>
      {rightContent}
    </div>
  );
}
