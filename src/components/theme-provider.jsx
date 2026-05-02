import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME, loadTheme, saveTheme } from "@/lib/theme";

const ThemeContext = createContext({
  ...DEFAULT_THEME,
  setMode: () => {},
  setAccent: () => {},
  setSurface: () => {},
  reset: () => {},
});

const applyTheme = ({ mode, accent, surface }) => {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.dataset.accent = accent;
  root.dataset.surface = surface;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const initial = loadTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const setMode = useCallback((mode) => setTheme((t) => ({ ...t, mode })), []);
  const setAccent = useCallback((accent) => setTheme((t) => ({ ...t, accent })), []);
  const setSurface = useCallback((surface) => setTheme((t) => ({ ...t, surface })), []);
  const reset = useCallback(() => setTheme({ ...DEFAULT_THEME }), []);

  return (
    <ThemeContext.Provider value={{ ...theme, setMode, setAccent, setSurface, reset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
