export type ThemeMode = "light" | "dark";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setRevealOrigin(x: number, y: number) {
  const root = document.documentElement;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  root.style.setProperty("--theme-reveal-x", `${x}px`);
  root.style.setProperty("--theme-reveal-y", `${y}px`);
  root.style.setProperty("--theme-reveal-r", `${radius}px`);
}

function runFallbackTransition(apply: () => void) {
  const root = document.documentElement;
  root.classList.add("theme-transitioning");
  apply();
  window.setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, 450);
}

/**
 * Applies a theme change with a circular reveal (View Transitions API) or CSS fallback.
 */
export async function applyThemeWithAnimation(
  apply: () => void,
  origin?: { x: number; y: number },
): Promise<void> {
  if (typeof document === "undefined") {
    apply();
    return;
  }

  if (prefersReducedMotion()) {
    apply();
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  setRevealOrigin(x, y);

  const startViewTransition = (
    document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    }
  ).startViewTransition;

  if (!startViewTransition) {
    runFallbackTransition(apply);
    return;
  }

  try {
    const transition = startViewTransition.call(document, () => {
      apply();
    });
    await transition.ready;
  } catch {
    runFallbackTransition(apply);
  }
}
