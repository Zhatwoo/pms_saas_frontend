import { cn } from "@/lib/utils";

interface LoadingSpinnerLabelProps {
  text: string;
  className?: string;
  spinnerClassName?: string;
}

export function LoadingSpinnerLabel({
  text,
  className,
  spinnerClassName,
}: LoadingSpinnerLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
          spinnerClassName,
        )}
      />
      <span>{text}</span>
    </span>
  );
}