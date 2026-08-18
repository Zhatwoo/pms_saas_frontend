export type AccentId = "green" | "blue" | "purple" | "rose" | "amber";

export interface AccentPreset {
  id: AccentId;
  label: string;
  /** Primary sidebar/brand color (replaces --brand-green / --pawn-sidebar) */
  primary: string;
  /** Highlight/gold color (replaces --brand-gold / --pawn-gold) */
  accent: string;
  /** Swatch color shown in the picker */
  swatch: string;
}

export const ACCENT_PRESETS: Record<AccentId, AccentPreset> = {
  green: {
    id: "green",
    label: "Green",
    primary: "#0B5D3B",
    accent: "#E8C547",
    swatch: "#0B5D3B",
  },
  blue: {
    id: "blue",
    label: "Blue",
    primary: "#0B4A6F",
    accent: "#4FA8E8",
    swatch: "#1173B8",
  },
  purple: {
    id: "purple",
    label: "Purple",
    primary: "#4C1D7A",
    accent: "#C084F5",
    swatch: "#7C3AED",
  },
  rose: {
    id: "rose",
    label: "Rose",
    primary: "#7A1D3D",
    accent: "#F5738E",
    swatch: "#E11D48",
  },
  amber: {
    id: "amber",
    label: "Amber",
    primary: "#7A4A0B",
    accent: "#F5B84C",
    swatch: "#D97706",
  },
};

export const DEFAULT_ACCENT: AccentId = "green";
export const ACCENT_STORAGE_KEY = "pms-accent";

/** Lightens (positive amount) or darkens (negative amount) a hex color by a 0-1 fraction. */
export function shadeHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel: number) =>
    amount >= 0
      ? Math.round(channel + (255 - channel) * amount)
      : Math.round(channel * (1 + amount));
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export interface AccentCssVars {
  "--brand-green": string;
  "--brand-gold": string;
  "--pawn-sidebar": string;
  "--pawn-sidebar-light": string;
  "--pawn-gold": string;
  "--pawn-gold-light": string;
  "--pawn-section": string;
  "--pawn-content": string;
  "--emerald-surface": string;
  "--emerald-border": string;
  "--emerald-text": string;
}

/** Derives the full accent CSS variable set for a preset and color mode. */
export function getAccentCssVars(id: AccentId, isDark: boolean): AccentCssVars {
  const preset = ACCENT_PRESETS[id];
  return {
    "--brand-green": preset.primary,
    "--brand-gold": preset.accent,
    "--pawn-sidebar": preset.primary,
    "--pawn-sidebar-light": shadeHex(preset.primary, 0.18),
    "--pawn-gold": preset.accent,
    "--pawn-gold-light": shadeHex(preset.accent, 0.15),
    "--pawn-section": shadeHex(preset.primary, 0.35),
    "--pawn-content": isDark
      ? shadeHex(preset.primary, -0.9)
      : shadeHex(preset.primary, 0.92),
    "--emerald-surface": isDark
      ? shadeHex(preset.primary, -0.88)
      : shadeHex(preset.primary, 0.92),
    "--emerald-border": isDark
      ? shadeHex(preset.primary, -0.58)
      : shadeHex(preset.primary, 0.68),
    "--emerald-text": isDark
      ? shadeHex(preset.primary, 0.38)
      : shadeHex(preset.primary, 0.12),
  };
}

export function applyAccentVars(id: AccentId, isDark: boolean) {
  const root = document.documentElement;
  const vars = getAccentCssVars(id, isDark);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

/** Blocking bootstrap script for layout.tsx — prevents accent FOUC before hydration. */
export function getAccentBootstrapScript(): string {
  const presetsJson = JSON.stringify(
    Object.fromEntries(
      Object.values(ACCENT_PRESETS).map((preset) => [
        preset.id,
        { primary: preset.primary, accent: preset.accent },
      ]),
    ),
  );

  return `(function(){try{var a=localStorage.getItem('${ACCENT_STORAGE_KEY}');var presets=${presetsJson};var p=presets[a];if(p){var isDark=!!window.__pmsDark;function shade(hex,amount){var n=parseInt(hex.replace('#',''),16);var r=(n>>16)&255,g=(n>>8)&255,b=n&255;function mix(c){return amount>=0?Math.round(c+(255-c)*amount):Math.round(c*(1+amount));}function clamp(v){return Math.max(0,Math.min(255,v));}function toHex(v){return clamp(v).toString(16).padStart(2,'0');}return '#'+toHex(mix(r))+toHex(mix(g))+toHex(mix(b));}var root=document.documentElement.style;root.setProperty('--brand-green',p.primary);root.setProperty('--brand-gold',p.accent);root.setProperty('--pawn-sidebar',p.primary);root.setProperty('--pawn-sidebar-light',shade(p.primary,0.18));root.setProperty('--pawn-gold',p.accent);root.setProperty('--pawn-gold-light',shade(p.accent,0.15));root.setProperty('--pawn-section',shade(p.primary,0.35));root.setProperty('--pawn-content',isDark?shade(p.primary,-0.9):shade(p.primary,0.92));root.setProperty('--emerald-surface',isDark?shade(p.primary,-0.88):shade(p.primary,0.92));root.setProperty('--emerald-border',isDark?shade(p.primary,-0.58):shade(p.primary,0.68));root.setProperty('--emerald-text',isDark?shade(p.primary,0.38):shade(p.primary,0.12));}}catch(e){}})();`;
}
