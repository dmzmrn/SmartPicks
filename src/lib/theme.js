export const PRESETS = [
  { key: "slate", label: "Slate", swatch: "#0f172a" },
  { key: "blue", label: "Blue", swatch: "#2563eb" },
  { key: "teal", label: "Teal", swatch: "#0f766e" },
];

export const MODES = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

export const DEFAULT_THEME = {
  mode: "dark",
  preset: "slate",
};

const STORAGE_KEY = "lotto-theme";

export const loadTheme = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw);
    return {
      mode: MODES.some((m) => m.key === parsed.mode) ? parsed.mode : DEFAULT_THEME.mode,
      preset: PRESETS.some((p) => p.key === parsed.preset) ? parsed.preset : DEFAULT_THEME.preset,
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
