const variants = {
  blue: "bg-sky-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  purple: "bg-pink-100 text-purple-800",
  orange: "bg-yellow-50 text-orange-600",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-600",
  black: "bg-zinc-200 text-zinc-800",
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
