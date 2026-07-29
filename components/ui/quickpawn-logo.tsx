import Image from "next/image";

interface QuickPawnLogoProps {
  /** "mark" = icon only (logo-icon.png), "full"/"wordmark" = icon + wordmark (logo.png) */
  variant?: "mark" | "full" | "wordmark";
  className?: string;
  /** @deprecated The tagline is baked into logo.png; this prop no longer has an effect. */
  showTagline?: boolean;
}

/**
 * QuickPawn logo. Renders the brand's static PNG assets (public/logo-icon.png
 * for the icon-only mark, public/logo.png for the full wordmark) rather than
 * a recolorable SVG — the logo artwork stays fixed regardless of the accent
 * color the user picks.
 */
export function QuickPawnLogo({ variant = "full", className }: QuickPawnLogoProps) {
  if (variant === "mark") {
    return (
      <div className={`relative ${className ?? ""}`}>
        <Image
          src="/logo-icon.png"
          alt="QuickPawn"
          fill
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-[16/9] ${className ?? ""}`}>
      <Image
        src="/logo.png"
        alt="QuickPawn"
        fill
        className="object-contain"
      />
    </div>
  );
}
