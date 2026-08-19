import {
  ACCENT_PRESETS,
  applyAccentVars,
  getAccentCssVars,
  shadeHex,
} from "@/lib/accent-vars";

describe("shadeHex", () => {
  it("returns the same color when amount is 0", () => {
    expect(shadeHex("#0B5D3B", 0)).toBe("#0b5d3b");
  });

  it("lightens a color with a positive amount", () => {
    expect(shadeHex("#000000", 1)).toBe("#ffffff");
  });

  it("darkens a color with a negative amount", () => {
    expect(shadeHex("#ffffff", -1)).toBe("#000000");
  });
});

describe("getAccentCssVars", () => {
  it("uses the selected preset primary and accent colors", () => {
    const vars = getAccentCssVars("blue", false);

    expect(vars["--brand-green"]).toBe(ACCENT_PRESETS.blue.primary);
    expect(vars["--brand-gold"]).toBe(ACCENT_PRESETS.blue.accent);
    expect(vars["--pawn-sidebar"]).toBe(ACCENT_PRESETS.blue.primary);
    expect(vars["--pawn-gold"]).toBe(ACCENT_PRESETS.blue.accent);
  });

  it("derives emerald semantic tokens from the active preset", () => {
    const blueLight = getAccentCssVars("blue", false);
    const blueDark = getAccentCssVars("blue", true);

    expect(blueLight["--emerald-surface"]).toBe(
      shadeHex(ACCENT_PRESETS.blue.primary, 0.92),
    );
    expect(blueLight["--emerald-border"]).toBe(
      shadeHex(ACCENT_PRESETS.blue.primary, 0.68),
    );
    expect(blueLight["--emerald-text"]).toBe(
      shadeHex(ACCENT_PRESETS.blue.primary, 0.12),
    );
    expect(blueDark["--emerald-surface"]).toBe(
      shadeHex(ACCENT_PRESETS.blue.primary, -0.88),
    );
    expect(blueDark["--emerald-border"]).toBe(
      shadeHex(ACCENT_PRESETS.blue.accent, -0.45),
    );
    expect(blueDark["--emerald-text"]).toBe(ACCENT_PRESETS.blue.accent);
  });

  it("changes derived tokens when the accent preset changes", () => {
    const green = getAccentCssVars("green", false);
    const purple = getAccentCssVars("purple", false);

    expect(green["--emerald-border"]).not.toBe(purple["--emerald-border"]);
    expect(green["--pawn-content"]).not.toBe(purple["--pawn-content"]);
  });

  it("uses accent highlight colors for readable dark-mode callout text", () => {
    for (const preset of Object.values(ACCENT_PRESETS)) {
      const dark = getAccentCssVars(preset.id, true);
      expect(dark["--emerald-text"]).toBe(preset.accent);
    }
  });
});

describe("applyAccentVars", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("writes all accent and emerald CSS variables to the document root", () => {
    applyAccentVars("rose", false);

    const style = document.documentElement.style;
    expect(style.getPropertyValue("--brand-green")).toBe(ACCENT_PRESETS.rose.primary);
    expect(style.getPropertyValue("--pawn-gold")).toBe(ACCENT_PRESETS.rose.accent);
    expect(style.getPropertyValue("--emerald-surface")).toBe(
      shadeHex(ACCENT_PRESETS.rose.primary, 0.92),
    );
    expect(style.getPropertyValue("--emerald-border")).toBe(
      shadeHex(ACCENT_PRESETS.rose.primary, 0.68),
    );
    expect(style.getPropertyValue("--emerald-text")).toBe(
      shadeHex(ACCENT_PRESETS.rose.primary, 0.12),
    );
  });

  it("updates emerald tokens when switching between light and dark mode", () => {
    applyAccentVars("amber", false);
    const lightSurface = document.documentElement.style.getPropertyValue(
      "--emerald-surface",
    );

    applyAccentVars("amber", true);
    const darkSurface = document.documentElement.style.getPropertyValue(
      "--emerald-surface",
    );

    expect(lightSurface).not.toBe(darkSurface);
  });
});
