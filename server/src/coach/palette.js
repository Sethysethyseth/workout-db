/**
 * AI-generated palettes (docs/specs/ai-theming.md). The model emits a
 * fixed-shape record of hex values - never CSS - and this module is the
 * gate: shape, format, cascade parity, contrast against the FIXED text
 * tokens, and surface separation. It rejects, never repairs. Pure functions
 * only (house style of server/src/analytics): no env, no Prisma, no fetch.
 */

const HEX_RE = /^#[0-9a-f]{6}$/;
const MAX_NAME_CHARS = 24;
const MAX_DESCRIPTION_CHARS = 200;

const SCENES = ["champ", "iron", "forest", "crimson", "chill"];

const LIGHT_KEYS = [
  "interactive",
  "interactiveHover",
  "bg",
  "surface1",
  "surface2",
  "surface3",
  "border",
  "inputBorder",
];
const DARK_KEYS = [
  ...LIGHT_KEYS,
  "btnPrimaryBg",
  "btnPrimaryFg",
  "btnPrimaryHoverBg",
  "btnPrimaryActiveBg",
];

/** Text tokens are never overridden (index.css :root / dark). */
const FIXED_TEXT = {
  light: { text: "#0f172a", textSecondary: "#64748b" },
  dark: { text: "#f1f5f9", textSecondary: "#94a3b8" },
};

/* Thresholds, calibrated so every SHIPPED palette passes them. */
const MIN_TEXT_CONTRAST = 4.5; // WCAG AA, normal text
const MIN_SECONDARY_CONTRAST = 3; // muted labels
// The accent mostly lives in rings, pills and bars derived via color-mix; the
// shipped iron light accent (#f59e0b on white) sits at 2.1:1, so the floor is
// "visible", not "body text".
const MIN_INTERACTIVE_CONTRAST = 2;
// Bold button labels: the WCAG large/UI threshold (champ dark ships at 4.3:1).
const MIN_BUTTON_CONTRAST = 3;
const MIN_SURFACE_SEPARATION = 1.03; // adjacent elevation steps
const MIN_BORDER_SEPARATION = 1.1; // border against its surface

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function normalizeHex(raw) {
  if (typeof raw !== "string") return null;
  let v = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return HEX_RE.test(v) ? v : null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function checkMode(mode, values, keys, errors) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    errors.push(`${mode}: missing token object`);
    return null;
  }
  const out = {};
  const present = Object.keys(values);
  const errorsBefore = errors.length;
  for (const key of keys) {
    if (!(key in values)) {
      errors.push(`${mode}.${key}: missing`);
      continue;
    }
    const hex = normalizeHex(values[key]);
    if (!hex) {
      errors.push(`${mode}.${key}: not a hex colour`);
      continue;
    }
    out[key] = hex;
  }
  for (const key of present) {
    if (!keys.includes(key)) errors.push(`${mode}.${key}: unexpected token`);
  }
  if (errors.length > errorsBefore) return null;

  const text = FIXED_TEXT[mode];
  const surfaces = ["bg", "surface1", "surface2", "surface3"];
  for (const s of surfaces) {
    const c = contrastRatio(out[s], text.text);
    if (c < MIN_TEXT_CONTRAST) {
      errors.push(`${mode}.${s}: text contrast ${round2(c)}:1 is below ${MIN_TEXT_CONTRAST}:1`);
    }
    const cs = contrastRatio(out[s], text.textSecondary);
    if (cs < MIN_SECONDARY_CONTRAST) {
      errors.push(
        `${mode}.${s}: secondary text contrast ${round2(cs)}:1 is below ${MIN_SECONDARY_CONTRAST}:1`
      );
    }
  }
  const ci = contrastRatio(out.interactive, out.surface1);
  if (ci < MIN_INTERACTIVE_CONTRAST) {
    errors.push(`${mode}.interactive: contrast on surfaces ${round2(ci)}:1 is below ${MIN_INTERACTIVE_CONTRAST}:1`);
  }
  for (const [a, b] of [
    ["surface1", "surface2"],
    ["surface2", "surface3"],
    ["surface1", "surface3"],
  ]) {
    if (out[a] === out[b] || contrastRatio(out[a], out[b]) < MIN_SURFACE_SEPARATION) {
      errors.push(`${mode}: ${a} and ${b} are not distinguishable`);
    }
  }
  if (out.border === out.surface1 || contrastRatio(out.border, out.surface1) < MIN_BORDER_SEPARATION) {
    errors.push(`${mode}: border does not separate from surface1`);
  }
  if (mode === "dark") {
    const cb = contrastRatio(out.btnPrimaryBg, out.btnPrimaryFg);
    if (cb < MIN_BUTTON_CONTRAST) {
      errors.push(`dark.btnPrimaryFg: button label contrast ${round2(cb)}:1 is below ${MIN_BUTTON_CONTRAST}:1`);
    }
  }
  return out;
}

/**
 * Validate a candidate palette. Returns { ok: true, palette } with every
 * hex normalized to lowercase #rrggbb, or { ok: false, errors }.
 */
function validatePalette(candidate) {
  const errors = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ok: false, errors: ["palette must be an object"] };
  }
  const name =
    typeof candidate.name === "string" ? candidate.name.trim().slice(0, MAX_NAME_CHARS) : "";
  if (!name) errors.push("name: missing");
  const scene = SCENES.includes(candidate.scene) ? candidate.scene : null;
  if (!scene) errors.push("scene: must be one of " + SCENES.join(", "));

  const light = checkMode("light", candidate.light, LIGHT_KEYS, errors);
  const dark = checkMode("dark", candidate.dark, DARK_KEYS, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, palette: { name, scene, light, dark } };
}

/** JSON schema for the model's structured output - exactly the token set. */
function hexProperty(description) {
  return { type: "string", description: `${description}, six-digit lowercase hex like #1a2b3c` };
}

function modeSchema(keys) {
  const properties = {};
  for (const key of keys) properties[key] = hexProperty(`${key} as #rrggbb`);
  return {
    type: "object",
    properties,
    required: keys,
    additionalProperties: false,
  };
}

const PALETTE_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", description: "A short palette name, two or three words" },
    scene: {
      type: "string",
      enum: SCENES,
      description:
        "The shipped scene photograph whose mood fits best: champ (night skyline, cool blue), iron (dark forge, amber), forest (night canopy, green), crimson (blood moon, red), chill (moonlit pines, cool grey-blue)",
    },
    light: modeSchema(LIGHT_KEYS),
    dark: modeSchema(DARK_KEYS),
  },
  required: ["name", "scene", "light", "dark"],
  additionalProperties: false,
};

const PALETTE_SYSTEM_PROMPT = [
  "You design colour palettes for LogChamp, a weightlifting tracker. The lifter describes a look in a few words; you answer with ONE palette as JSON matching the schema, nothing else.",
  "",
  "The app keeps its text colours fixed: light mode text #0f172a and #64748b, dark mode text #f1f5f9 and #94a3b8. Your surfaces must stay readable under them:",
  "- light mode: bg, surface1, surface2 and surface3 are near-white tints (each at least 4.5:1 against #0f172a and 3:1 against #64748b); surface1 is the card, surface2 one step darker, surface3 one step darker again; border and inputBorder are visibly darker than surface1.",
  "- dark mode: bg, surface1, surface2 and surface3 are near-black tints (each at least 4.5:1 against #f1f5f9 and 3:1 against #94a3b8); surface1 lighter than bg, surface2 lighter than surface1, surface3 lighter still; border and inputBorder visibly lighter than surface1.",
  "- interactive is the accent for links, rings and highlights, at least 3:1 against surface1 in each mode; interactiveHover is a slightly stronger version of it.",
  "- dark mode only: btnPrimaryBg is a filled button in the accent family with btnPrimaryFg readable on it (at least 4.5:1), btnPrimaryHoverBg a little lighter, btnPrimaryActiveBg a little darker.",
  "",
  "Give the palette a mood, not just a hue: the surfaces should carry a faint cast of the accent so the environment feels of a piece. Pick the scene photograph whose atmosphere is closest to the description. Use six-digit lowercase hex.",
].join("\n");

function parseDescription(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_DESCRIPTION_CHARS);
}

/**
 * Deterministic mock palette from a description, for servers without a
 * key. Hue comes from a hash of the words; everything else follows the
 * same rules the validator enforces, so the mock always passes it.
 */
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function mockPaletteFor(description) {
  let hash = 7;
  for (const ch of description.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  const sceneByHue = hue < 40 || hue >= 330 ? "crimson" : hue < 70 ? "iron" : hue < 170 ? "forest" : hue < 260 ? "champ" : "chill";
  const words = description.split(" ").slice(0, 3).join(" ");
  const btnBg = hslToHex(hue, 0.6, 0.5);
  const btnFg = contrastRatio(btnBg, "#ffffff") >= contrastRatio(btnBg, "#0f172a") ? "#ffffff" : "#0f172a";
  return {
    name: words.charAt(0).toUpperCase() + words.slice(1),
    scene: sceneByHue,
    light: {
      interactive: hslToHex(hue, 0.55, 0.42),
      interactiveHover: hslToHex(hue, 0.55, 0.34),
      bg: hslToHex(hue, 0.3, 0.955),
      surface1: hslToHex(hue, 0.4, 0.995),
      surface2: hslToHex(hue, 0.35, 0.975),
      surface3: hslToHex(hue, 0.3, 0.945),
      border: hslToHex(hue, 0.25, 0.88),
      inputBorder: hslToHex(hue, 0.22, 0.8),
    },
    dark: {
      interactive: hslToHex(hue, 0.7, 0.72),
      interactiveHover: hslToHex(hue, 0.75, 0.8),
      bg: hslToHex(hue, 0.35, 0.05),
      surface1: hslToHex(hue, 0.3, 0.1),
      surface2: hslToHex(hue, 0.28, 0.14),
      surface3: hslToHex(hue, 0.26, 0.18),
      border: hslToHex(hue, 0.22, 0.28),
      inputBorder: hslToHex(hue, 0.2, 0.36),
      btnPrimaryBg: btnBg,
      btnPrimaryFg: btnFg,
      btnPrimaryHoverBg: hslToHex(hue, 0.6, 0.56),
      btnPrimaryActiveBg: hslToHex(hue, 0.6, 0.42),
    },
  };
}

module.exports = {
  SCENES,
  LIGHT_KEYS,
  DARK_KEYS,
  FIXED_TEXT,
  MAX_DESCRIPTION_CHARS,
  PALETTE_JSON_SCHEMA,
  PALETTE_SYSTEM_PROMPT,
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  normalizeHex,
  validatePalette,
  parseDescription,
  mockPaletteFor,
  hslToHex,
};
