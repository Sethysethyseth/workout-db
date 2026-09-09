import champScene from "../assets/scenes/champ.jpg";
import ironScene from "../assets/scenes/iron.jpg";
import forestScene from "../assets/scenes/forest.jpg";
import crimsonScene from "../assets/scenes/crimson.jpg";
import chillScene from "../assets/scenes/chill.jpg";

/**
 * Device-local storage and application of an AI-generated palette
 * (docs/specs/ai-theming.md). The stored object is the validated token
 * record the server returned - hex values only. It reaches the document as
 * inline custom properties on <html>, never as CSS text, which is the
 * spec's injection boundary: the worst a bad record can do is look ugly.
 */

const STORAGE_KEY = "workoutdb-custom-palette";
export const CUSTOM_PALETTE_ID = "custom";

const SCENE_URLS = {
  champ: champScene,
  iron: ironScene,
  forest: forestScene,
  crimson: crimsonScene,
  chill: chillScene,
};

const TOKEN_TO_VAR = {
  interactive: "--color-interactive",
  interactiveHover: "--color-interactive-hover",
  bg: "--color-bg",
  surface1: "--color-surface-1",
  surface2: "--color-surface-2",
  surface3: "--color-surface-3",
  border: "--color-border",
  inputBorder: "--color-input-border",
  btnPrimaryBg: "--color-btn-primary-bg",
  btnPrimaryFg: "--color-btn-primary-fg",
  btnPrimaryHoverBg: "--color-btn-primary-hover-bg",
  btnPrimaryActiveBg: "--color-btn-primary-active-bg",
};

const HEX_RE = /^#[0-9a-f]{6}$/;

function isHexRecord(obj, keys) {
  if (!obj || typeof obj !== "object") return false;
  return keys.every((k) => typeof obj[k] === "string" && HEX_RE.test(obj[k]));
}

const LIGHT_KEYS = ["interactive", "interactiveHover", "bg", "surface1", "surface2", "surface3", "border", "inputBorder"];
const DARK_KEYS = [...LIGHT_KEYS, "btnPrimaryBg", "btnPrimaryFg", "btnPrimaryHoverBg", "btnPrimaryActiveBg"];

/** Client-side shape check only; the server's validator is authoritative. */
export function isCustomPaletteShape(p) {
  return Boolean(
    p &&
      typeof p === "object" &&
      typeof p.name === "string" &&
      p.name.trim() &&
      typeof p.scene === "string" &&
      p.scene in SCENE_URLS &&
      isHexRecord(p.light, LIGHT_KEYS) &&
      isHexRecord(p.dark, DARK_KEYS)
  );
}

export function loadCustomPalette() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isCustomPaletteShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCustomPalette(palette) {
  try {
    if (!isCustomPaletteShape(palette)) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
    return true;
  } catch {
    return false;
  }
}

export function clearCustomPalette() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Set the palette's tokens for one mode as inline properties on <html>. */
export function applyCustomPalette(palette, mode) {
  const root = document.documentElement;
  const values = mode === "dark" ? palette.dark : palette.light;
  for (const [token, cssVar] of Object.entries(TOKEN_TO_VAR)) {
    if (values[token]) root.style.setProperty(cssVar, values[token]);
    else root.style.removeProperty(cssVar);
  }
  const scene = SCENE_URLS[palette.scene] || SCENE_URLS.champ;
  root.style.setProperty("--scene-image", `url("${scene}")`);
  root.style.setProperty("--palette-swatch-custom", values.interactive);
}

export function clearCustomPaletteVars() {
  const root = document.documentElement;
  for (const cssVar of Object.values(TOKEN_TO_VAR)) root.style.removeProperty(cssVar);
  root.style.removeProperty("--scene-image");
  root.style.removeProperty("--palette-swatch-custom");
}
