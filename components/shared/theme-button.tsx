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
    "border-transparent bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/30 dark:shadow-emerald-500/35 dark:hover:shadow-emerald-500/45 focus-visible:ring-emerald-500",
  secondary:
    "border border-emerald-700/35 bg-surface-secondary text-text-primary shadow-sm hover:bg-surface-hover hover:shadow-md dark:shadow-black/35 focus-visible:ring-emerald-500",
  outline:
    "border border-emerald-700 bg-surface text-emerald-700 shadow-sm hover:bg-emerald-700 hover:text-white hover:shadow-md dark:text-emerald-400 dark:hover:text-white focus-visible:ring-emerald-500",
  ghost:
    "border-transparent bg-transparent text-emerald-700 hover:bg-emerald-50/60 dark:text-emerald-400 dark:hover:bg-emerald-900/20 focus-visible:ring-emerald-500",
  danger:
    "border-transparent bg-emerald-800 text-white shadow-sm shadow-emerald-900/25 hover:bg-emerald-900 hover:shadow-md hover:shadow-emerald-900/35 dark:shadow-emerald-500/35 dark:hover:shadow-emerald-500/45 focus-visible:ring-emerald-500",
  success:
    "border-transparent bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/30 dark:shadow-emerald-500/35 dark:hover:shadow-emerald-500/45 focus-visible:ring-emerald-500",
  warning:
    "border-transparent bg-emerald-600 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-900/30 dark:shadow-emerald-500/35 dark:hover:shadow-emerald-500/45 focus-visible:ring-emerald-500",
  info:
    "border-transparent bg-emerald-500 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-600 hover:shadow-md hover:shadow-emerald-900/30 dark:shadow-emerald-500/35 dark:hover:shadow-emerald-500/45 focus-visible:ring-emerald-500",
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
