import { Play } from "lucide-react";

export const LANDING_VIDEO_PLACEHOLDER_LABEL = "Video coming soon";
export const LANDING_VIDEO_PLACEHOLDER_NOTE = "Marketing will provide the final tutorial link.";

export function LandingVideoPlaceholder({
  title,
  label = LANDING_VIDEO_PLACEHOLDER_LABEL,
  note = LANDING_VIDEO_PLACEHOLDER_NOTE,
  variant = "dark",
  className = "",
  showPlayIcon = true,
}: {
  title?: string;
  label?: string;
  note?: string;
  variant?: "dark" | "light";
  className?: string;
  showPlayIcon?: boolean;
}) {
  const isDark = variant === "dark";

  return (
    <div
      className={`relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden px-6 text-center ${
        isDark
          ? "bg-gradient-to-br from-[#003830] via-[#004d40] to-[#063827] text-white"
          : "bg-gradient-to-br from-brand-green/8 via-white to-brand-gold/10 text-brand-green"
      } ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-40 ${
          isDark
            ? "bg-[radial-gradient(circle_at_top,rgba(232,197,71,0.18),transparent_55%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(11,93,59,0.12),transparent_55%)]"
        }`}
      />

      {showPlayIcon && (
        <span
          className={`relative mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isDark ? "bg-brand-gold/15 text-brand-gold" : "bg-brand-green/10 text-brand-green"
          }`}
        >
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </span>
      )}

      {title && (
        <p className={`relative text-sm font-bold ${isDark ? "text-white/90" : "text-brand-green"}`}>{title}</p>
      )}
      <p
        className={`relative mt-2 text-[11px] font-black uppercase tracking-[0.22em] ${
          isDark ? "text-brand-gold" : "text-brand-gold"
        }`}
      >
        {label}
      </p>
      <p className={`relative mt-2 max-w-xs text-xs leading-relaxed ${isDark ? "text-white/55" : "text-brand-green/55"}`}>
        {note}
      </p>
    </div>
  );
}
