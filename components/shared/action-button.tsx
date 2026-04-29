import type { ReactNode } from "react";

const variants = {
  primary: "bg-pawn-sidebar text-amber-400 border-transparent",
  outline: "bg-surface text-text-primary border-border-main",
  danger: "bg-red-50 text-red-600 border-red-300",
  renew: "bg-yellow-100 text-orange-600 border-orange-600",
  redeem: "bg-green-50 text-lime-700 border-lime-700",
  buyback: "bg-sky-100 text-blue-800 border-blue-800",
  pawn: "bg-surface-secondary text-emerald-800 border-emerald-700",
  sales: "bg-purple-800/40 text-purple-800 border-purple-800",
} as const;

interface ActionButtonProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function ActionButton({
  children,
  variant = "primary",
  onClick,
  size = "md",
  className = "",
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded border font-bold transition-opacity hover:opacity-80 ${variants[variant]} ${
        size === "sm" ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
      } ${className}`}
    >
      {children}
    </button>
  );
}
