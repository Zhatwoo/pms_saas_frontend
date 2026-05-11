const variants = {
  blue: "bg-sky-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  green: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  purple: "bg-pink-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400",
  orange: "bg-yellow-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  black: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
} as const;

interface StatusBadgeProps {
  label: string;
  variant: keyof typeof variants;
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${variants[variant]}`}
    >
      {label}
    </span>
  );
}
