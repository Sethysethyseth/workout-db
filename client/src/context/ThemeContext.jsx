/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CUSTOM_PALETTE_ID,
  applyCustomPalette,
  clearCustomPalette,
  clearCustomPaletteVars,
  loadCustomPalette,
  saveCustomPalette,
} from "../lib/customPalette.js";

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

function readStoredPalette(hasCustom) {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (PALETTES.includes(raw)) return raw;
    if (raw === CUSTOM_PALETTE_ID && hasCustom) return CUSTOM_PALETTE_ID;
  } catch {
    /* ignore */
  }
  return DEFAULT_PALETTE;
}

function writeStoredPalette(next) {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
}

function getSystemDark() {
  return Boolean(
    typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    typeof window !== "undefined" ? readStoredTheme() : "system"
  );
  const [systemDark, setSystemDark] = useState(() => getSystemDark());

  // A generated palette lives on this device only (ai-theming.md v1). It is
  // a sixth entry on the same data-palette axis, applied as inline tokens.
  const [customPalette, setCustomPaletteState] = useState(() =>
    typeof window !== "undefined" ? loadCustomPalette() : null
  );
  const customRef = useRef(customPalette);
  useEffect(() => {
    customRef.current = customPalette;
  }, [customPalette]);

  const [palette, setPaletteState] = useState(() =>
    typeof window !== "undefined" ? readStoredPalette(Boolean(loadCustomPalette())) : DEFAULT_PALETTE
  );

  /* A palette being tried out in the Appearance studio: applied, not saved. */
  const [preview, setPreview] = useState(null);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setPalette = useCallback((next) => {
    if (next === CUSTOM_PALETTE_ID) {
      if (!customRef.current) return;
    } else if (!PALETTES.includes(next)) {
      return;
    }
    setPaletteState(next);
    writeStoredPalette(next);
  }, []);

  /** Save (or, with null, forget) the device's generated palette. */
  const setCustomPalette = useCallback((next) => {
    if (!next) {
      clearCustomPalette();
      setCustomPaletteState(null);
      setPaletteState((current) => {
        if (current !== CUSTOM_PALETTE_ID) return current;
        writeStoredPalette(DEFAULT_PALETTE);
        return DEFAULT_PALETTE;
      });
      return;
    }
    if (!saveCustomPalette(next)) return;
    setCustomPaletteState(next);
    setPaletteState(CUSTOM_PALETTE_ID);
    writeStoredPalette(CUSTOM_PALETTE_ID);
  }, []);

  const resolved = useMemo(() => {
    if (theme === "dark" || theme === "light") return theme;
    return systemDark ? "dark" : "light";
  }, [theme, systemDark]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  /* Inline tokens for a generated palette (or a preview of one) follow the
     resolved mode, so an OS theme flip re-applies the right half. */
  useLayoutEffect(() => {
    const active = preview || (palette === CUSTOM_PALETTE_ID ? customPalette : null);
    if (active) applyCustomPalette(active, resolved);
    else clearCustomPaletteVars();
  }, [preview, palette, customPalette, resolved]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Browser chrome (mobile address bar, PWA title bar) follows the page
  // ground, so a palette change never leaves a mismatched strip at the top.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-bg")
      .trim();
    if (bg) meta.setAttribute("content", bg);
  }, [resolved, palette, customPalette, preview]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolved,
      palette,
      setPalette,
      customPalette,
      setCustomPalette,
      preview,
      previewPalette: setPreview,
    }),
    [theme, setTheme, resolved, palette, setPalette, customPalette, setCustomPalette, preview]
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
