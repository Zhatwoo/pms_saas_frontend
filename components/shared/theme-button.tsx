import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ThemeButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type ThemeButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ThemeButtonVariant, string> = {
  primary:
    "border-transparent bg-brand-green text-white shadow-sm shadow-brand-green/20 hover:brightness-110 hover:shadow-md hover:shadow-brand-green/30 focus-visible:ring-brand-green",
  secondary:
    "border border-brand-green/35 bg-surface-secondary text-text-primary shadow-sm hover:bg-surface-hover hover:shadow-md dark:shadow-black/35 focus-visible:ring-brand-green",
  outline:
    "border border-brand-green bg-surface text-brand-green shadow-sm hover:bg-brand-green hover:text-white hover:shadow-md focus-visible:ring-brand-green",
  ghost:
    "border-transparent bg-transparent text-brand-green hover:bg-brand-green/10 focus-visible:ring-brand-green",
  danger:
    "border-transparent bg-red-700 text-white shadow-sm shadow-red-900/25 hover:bg-red-800 hover:shadow-md hover:shadow-red-900/35 dark:shadow-red-500/35 dark:hover:shadow-red-500/45 focus-visible:ring-red-500",
  success:
    "border-transparent bg-brand-green text-white shadow-sm shadow-brand-green/20 hover:brightness-110 hover:shadow-md hover:shadow-brand-green/30 focus-visible:ring-brand-green",
  warning:
    "border-transparent bg-brand-gold text-brand-green shadow-sm shadow-brand-gold/20 hover:brightness-105 hover:shadow-md hover:shadow-brand-gold/30 focus-visible:ring-brand-gold",
  info:
    "border-transparent bg-brand-green/80 text-white shadow-sm shadow-brand-green/20 hover:bg-brand-green hover:shadow-md hover:shadow-brand-green/30 focus-visible:ring-brand-green",
};

const sizeClasses: Record<ThemeButtonSize, string> = {
  sm: "h-9 px-3 text-xs font-bold",
  md: "h-10 px-4 text-sm font-bold",
  lg: "h-11 px-5 text-sm font-black tracking-wide",
  icon: "h-10 w-10 p-0",
};

export interface ThemeButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeButtonVariant;
  size?: ThemeButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
  (
    {
      type = "button",
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border transition-all duration-200 outline-none",
          "focus-visible:ring-4 focus-visible:ring-offset-0",
          "active:translate-y-[1px]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          fullWidth && "w-full",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        ) : null}
        {!loading && leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
        {children ? (
          <span className="inline-flex min-w-0 items-center gap-2 truncate">
            {children}
          </span>
        ) : null}
        {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    );
  },
);

ThemeButton.displayName = "ThemeButton";
