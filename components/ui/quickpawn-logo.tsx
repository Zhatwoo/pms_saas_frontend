"use client";

interface QuickPawnLogoProps {
  /** "mark" = gear+chip icon only, "full" = icon + wordmark, "wordmark" = text only */
  variant?: "mark" | "full" | "wordmark";
  className?: string;
  /** Show the "PAWNSHOP MANAGEMENT SYSTEM" tagline under the wordmark (full variant only) */
  showTagline?: boolean;
}

/** Gear-and-chip mark. Colors follow the live accent CSS vars, so it recolors with the accent picker. */
function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="QuickPawn"
    >
      {/* 8-tooth gear ring (outer tooth outline minus inner hole, even-odd) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="var(--brand-gold, #E8C547)"
        d="M202.3 15.9 L309.7 15.9 L294.4 84.2 L350.3 107.4 L387.8 48.3 L463.7 124.2 L404.6 161.7 L427.8 217.6 L496.1 202.3 L496.1 309.7 L427.8 294.4 L404.6 350.3 L463.7 387.8 L387.8 463.7 L350.3 404.6 L294.4 427.8 L309.7 496.1 L202.3 496.1 L217.6 427.8 L161.7 404.6 L124.2 463.7 L48.3 387.8 L107.4 350.3 L84.2 294.4 L15.9 309.7 L15.9 202.3 L84.2 217.6 L107.4 161.7 L48.3 124.2 L124.2 48.3 L161.7 107.4 L217.6 84.2 Z
           M256 128a128 128 0 1 0 0 256 128 128 0 0 0 0-256Z"
      />
      <circle cx="256" cy="256" r="118" fill="#fff" />
      <g
        fill="none"
        stroke="var(--brand-green, #0B5D3B)"
        strokeWidth="14"
        strokeLinecap="round"
      >
        <path d="M256 210v-40M226 222l-28-28M300 222l28-28M212 256h-40M212 286l-28 28M300 290l28 28" />
      </g>
      <g fill="var(--brand-green, #0B5D3B)">
        <circle cx="256" cy="160" r="14" />
        <circle cx="196" cy="184" r="14" />
        <circle cx="316" cy="184" r="14" />
        <circle cx="164" cy="256" r="14" />
        <circle cx="176" cy="322" r="14" />
        <circle cx="336" cy="326" r="14" />
        <rect x="216" y="216" width="80" height="80" rx="14" />
      </g>
    </svg>
  );
}

/** "QUICKPAWN" wordmark with a lightning-bolt "I" and underline, using accent CSS vars. */
function Wordmark({
  className,
  showTagline,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 520 150"
      className={className}
      role="img"
      aria-label="QuickPawn"
    >
      <text
        x="0"
        y="72"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="72"
        fill="var(--brand-green, #0B5D3B)"
        letterSpacing="1"
      >
        QU
      </text>
      <path
        d="M158 8 L138 62 L154 62 L134 118 L172 56 L154 56 Z"
        fill="var(--brand-gold, #E8C547)"
      />
      <text
        x="176"
        y="72"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="72"
        fill="var(--brand-green, #0B5D3B)"
        letterSpacing="1"
      >
        CKPAWN
      </text>
      <rect x="2" y="86" width="500" height="4" fill="var(--brand-gold, #E8C547)" />
      {showTagline && (
        <text
          x="2"
          y="122"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="600"
          fontSize="26"
          letterSpacing="2"
          fill="var(--brand-green, #0B5D3B)"
        >
          PAWNSHOP MANAGEMENT SYSTEM
        </text>
      )}
    </svg>
  );
}

/**
 * Accent-aware QuickPawn logo. Reads --brand-green / --brand-gold, which the
 * accent picker (contexts/accent-context.tsx) updates live, so the logo's
 * colors follow whatever accent the user selects instead of being baked into
 * a static image.
 */
export function QuickPawnLogo({
  variant = "full",
  className,
  showTagline = false,
}: QuickPawnLogoProps) {
  if (variant === "mark") return <Mark className={className} />;
  if (variant === "wordmark") {
    return <Wordmark className={className} showTagline={showTagline} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Mark className="h-full aspect-square shrink-0" />
      <Wordmark className="h-full min-w-0 flex-1" showTagline={showTagline} />
    </div>
  );
}
