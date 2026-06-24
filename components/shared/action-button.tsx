import type { ReactNode } from "react";
import { ThemeButton, type ThemeButtonVariant } from "./theme-button";

interface ActionButtonProps {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "renew"
    | "redeem"
    | "buyback"
    | "pawn"
    | "sales";
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
}

function mapVariant(variant: NonNullable<ActionButtonProps["variant"]>): ThemeButtonVariant {
  switch (variant) {
    case "secondary":
      return "secondary";
    case "outline":
      return "outline";
    case "ghost":
      return "ghost";
    case "danger":
      return "danger";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "info":
      return "info";
    case "renew":
    case "redeem":
    case "buyback":
    case "sales":
      return "warning";
    case "pawn":
      return "secondary";
    case "primary":
    default:
      return "primary";
  }
}

export function ActionButton({
  children,
  variant = "primary",
  onClick,
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  title,
  type = "button",
}: ActionButtonProps) {
  return (
    <ThemeButton
      type={type}
      variant={mapVariant(variant)}
      size={size}
      disabled={disabled}
      loading={loading}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      fullWidth={fullWidth}
      title={title}
      onClick={disabled ? undefined : onClick}
      className={className}
    >
      {children}
    </ThemeButton>
  );
}
