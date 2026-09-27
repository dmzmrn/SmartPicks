import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, loadTheme, saveTheme } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext({
  ...DEFAULT_THEME,
  resolvedMode: "dark",
  setMode: () => {},
  setPreset: () => {},
  reset: () => {},
});

const resolveMode = (mode) =>
  mode === "system" ? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light") : mode;

const applyTheme = (resolvedMode, preset) => {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedMode === "dark");
  root.dataset.theme = preset;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(loadTheme);
  const [resolvedMode, setResolvedMode] = useState(() => resolveMode(theme.mode));

  useEffect(() => {
    const update = () => setResolvedMode(resolveMode(theme.mode));
    update();
    if (theme.mode !== "system") return undefined;
    const query = window.matchMedia(DARK_QUERY);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [theme.mode]);

  useEffect(() => {
    applyTheme(resolvedMode, theme.preset);
  }, [resolvedMode, theme.preset]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  const setMode = useCallback((mode) => setTheme((t) => ({ ...t, mode })), []);
  const setPreset = useCallback((preset) => setTheme((t) => ({ ...t, preset })), []);
  const reset = useCallback(() => setTheme({ ...DEFAULT_THEME }), []);

  return (
    <ThemeContext.Provider value={{ ...theme, resolvedMode, setMode, setPreset, reset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
