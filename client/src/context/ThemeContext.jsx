import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "workoutdb-theme";
const PALETTE_STORAGE_KEY = "workoutdb-palette";

export const PALETTES = ["champ", "iron", "forest", "crimson", "chill"];
const DEFAULT_PALETTE = "champ";

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

function readStoredPalette() {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (PALETTES.includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_PALETTE;
}

function getSystemDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode) {
  if (mode === "dark" || mode === "light") return mode;
  return getSystemDark() ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    typeof window !== "undefined" ? readStoredTheme() : "system"
  );

  const [palette, setPaletteState] = useState(() =>
    typeof window !== "undefined" ? readStoredPalette() : DEFAULT_PALETTE
  );

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setPalette = useCallback((next) => {
    if (!PALETTES.includes(next)) return;
    setPaletteState(next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const resolved = useMemo(() => resolveTheme(theme), [theme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  useEffect(() => {
    if (theme !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolved, palette, setPalette }),
    [theme, setTheme, resolved, palette, setPalette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
