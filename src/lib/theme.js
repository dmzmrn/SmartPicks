export const ACCENTS = [
  { key: "indigo", label: "Indigo", swatch: "#6366f1" },
  { key: "violet", label: "Violet", swatch: "#a855f7" },
  { key: "sky", label: "Sky", swatch: "#0ea5e9" },
  { key: "emerald", label: "Emerald", swatch: "#10b981" },
  { key: "rose", label: "Rose", swatch: "#f43f5e" },
  { key: "amber", label: "Amber", swatch: "#f59e0b" },
];

export const SURFACES = [
  { key: "default", label: "Default" },
  { key: "midnight", label: "Midnight" },
  { key: "slate", label: "Slate" },
  { key: "forest", label: "Forest" },
];

export const MODES = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
];

export const DEFAULT_THEME = {
  mode: "dark",
  accent: "indigo",
  surface: "default",
};

const STORAGE_KEY = "lotto-theme";

export const loadTheme = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw);
    return {
      mode: MODES.some((m) => m.key === parsed.mode) ? parsed.mode : DEFAULT_THEME.mode,
      accent: ACCENTS.some((a) => a.key === parsed.accent) ? parsed.accent : DEFAULT_THEME.accent,
      surface: SURFACES.some((s) => s.key === parsed.surface) ? parsed.surface : DEFAULT_THEME.surface,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
};

export const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch (err) {
    console.error("theme save failed", err);
  }
};
