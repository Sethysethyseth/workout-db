const {
  validatePalette,
  contrastRatio,
  normalizeHex,
  mockPaletteFor,
  parseDescription,
  PALETTE_JSON_SCHEMA,
  LIGHT_KEYS,
  DARK_KEYS,
} = require("../../src/coach/palette");

/* The shipped palettes, lifted from client/src/index.css. The validator's
   thresholds are calibrated so every one of these passes - if a threshold
   ever rejects a house palette, the threshold is wrong, not the palette. */
const SHIPPED = {
  champ: {
    name: "Champ",
    scene: "champ",
    light: {
      interactive: "#5566c4", interactiveHover: "#4453ad", bg: "#f1f5f9", surface1: "#ffffff",
      surface2: "#f8fafc", surface3: "#eef2f7", border: "#e2e8f0", inputBorder: "#cbd5e1",
    },
    dark: {
      interactive: "#8b9bff", interactiveHover: "#aab4ff", bg: "#060913", surface1: "#0f1628",
      surface2: "#141f35", surface3: "#192744", border: "#34465f", inputBorder: "#4a6282",
      btnPrimaryBg: "#5b6ee8", btnPrimaryFg: "#ffffff", btnPrimaryHoverBg: "#6e7ff0", btnPrimaryActiveBg: "#4453ad",
    },
  },
  iron: {
    name: "Iron",
    scene: "iron",
    light: {
      interactive: "#f59e0b", interactiveHover: "#d97706", bg: "#f9f5f0", surface1: "#fffdfa",
      surface2: "#faf6f1", surface3: "#f2ece4", border: "#e7ded2", inputBorder: "#d3c6b6",
    },
    dark: {
      interactive: "#fbbf24", interactiveHover: "#fcd34d", bg: "#171310", surface1: "#211c17",
      surface2: "#2b241e", surface3: "#352c24", border: "#43382e", inputBorder: "#4f4236",
      btnPrimaryBg: "#f59e0b", btnPrimaryFg: "#1c1917", btnPrimaryHoverBg: "#fbbf24", btnPrimaryActiveBg: "#d97706",
    },
  },
  crimson: {
    name: "Crimson",
    scene: "crimson",
    light: {
      interactive: "#b91c1c", interactiveHover: "#991b1b", bg: "#fbf3f3", surface1: "#fffcfc",
      surface2: "#fbf5f5", surface3: "#f5eaea", border: "#ecd9d9", inputBorder: "#d8c2c2",
    },
    dark: {
      interactive: "#f87171", interactiveHover: "#fca5a5", bg: "#190c0e", surface1: "#241114",
      surface2: "#2f171a", surface3: "#3a1c20", border: "#50292e", inputBorder: "#613239",
      btnPrimaryBg: "#b91c1c", btnPrimaryFg: "#ffffff", btnPrimaryHoverBg: "#dc2626", btnPrimaryActiveBg: "#991b1b",
    },
  },
};

function clone(p) {
  return JSON.parse(JSON.stringify(p));
}

describe("validatePalette - the injection and contrast gate", () => {
  test.each(Object.entries(SHIPPED))("accepts the shipped %s palette", (_name, palette) => {
    const result = validatePalette(palette);
    expect(result.errors).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(Object.keys(result.palette.light)).toEqual(LIGHT_KEYS);
    expect(Object.keys(result.palette.dark)).toEqual(DARK_KEYS);
  });

  test("normalizes 3-digit and uppercase hex to lowercase #rrggbb", () => {
    const p = clone(SHIPPED.champ);
    p.light.surface1 = "#FFF";
    p.dark.interactive = "#8B9BFF";
    const result = validatePalette(p);
    expect(result.ok).toBe(true);
    expect(result.palette.light.surface1).toBe("#ffffff");
    expect(result.palette.dark.interactive).toBe("#8b9bff");
  });

  test("rejects anything that is not a plain hex - the injection boundary", () => {
    for (const bad of ["rgb(1,2,3)", "hsl(1 2% 3%)", "var(--x)", "color-mix(in srgb, red, blue)", "url(x)", "red", "#12345", ""]) {
      const p = clone(SHIPPED.champ);
      p.light.bg = bad;
      const result = validatePalette(p);
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toMatch(/light\.bg: not a hex colour/);
    }
  });

  test("rejects missing and extra tokens (shape) and a missing dark mode (cascade parity)", () => {
    const missing = clone(SHIPPED.champ);
    delete missing.dark.btnPrimaryBg;
    expect(validatePalette(missing).errors).toContain("dark.btnPrimaryBg: missing");

    const extra = clone(SHIPPED.champ);
    extra.light.text = "#000000";
    expect(validatePalette(extra).errors).toContain("light.text: unexpected token");

    const noDark = clone(SHIPPED.champ);
    delete noDark.dark;
    expect(validatePalette(noDark).errors).toContain("dark: missing token object");
  });

  test("rejects unreadable surfaces against the fixed text tokens", () => {
    const p = clone(SHIPPED.champ);
    p.light.surface1 = "#6b7280";
    const result = validatePalette(p);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/light\.surface1: text contrast/);
  });

  test("rejects collapsed depth cues (surfaces that cannot be told apart)", () => {
    const p = clone(SHIPPED.champ);
    p.dark.surface2 = p.dark.surface1;
    p.dark.surface3 = p.dark.surface1;
    const result = validatePalette(p);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/surface1 and surface2 are not distinguishable/);
  });

  test("rejects an unreadable primary button label and an unknown scene", () => {
    const p = clone(SHIPPED.champ);
    p.dark.btnPrimaryFg = "#5b6ee8";
    p.scene = "sunset";
    const result = validatePalette(p);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/button label contrast/);
    expect(result.errors.join(" ")).toMatch(/scene: must be one of/);
  });

  test("never repairs: a single failing token fails the whole palette", () => {
    const p = clone(SHIPPED.iron);
    p.light.border = p.light.surface1;
    const result = validatePalette(p);
    expect(result.ok).toBe(false);
    expect(result.palette).toBeUndefined();
  });
});

describe("helpers", () => {
  test("contrastRatio matches the WCAG reference points", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#0f172a", "#ffffff")).toBeGreaterThan(15);
  });

  test("normalizeHex", () => {
    expect(normalizeHex(" #ABC ")).toBe("#aabbcc");
    expect(normalizeHex("#abcdef")).toBe("#abcdef");
    expect(normalizeHex("abcdef")).toBeNull();
    expect(normalizeHex(12)).toBeNull();
  });

  test("parseDescription trims, collapses whitespace and caps length", () => {
    expect(parseDescription("  a   90s   basement gym ")).toBe("a 90s basement gym");
    expect(parseDescription("")).toBeNull();
    expect(parseDescription("x".repeat(500))).toHaveLength(200);
  });

  test("the JSON schema is exactly the token set", () => {
    expect(PALETTE_JSON_SCHEMA.required).toEqual(["name", "scene", "light", "dark"]);
    expect(PALETTE_JSON_SCHEMA.properties.light.required).toEqual(LIGHT_KEYS);
    expect(PALETTE_JSON_SCHEMA.properties.dark.required).toEqual(DARK_KEYS);
    expect(PALETTE_JSON_SCHEMA.properties.dark.additionalProperties).toBe(false);
  });
});

describe("mockPaletteFor", () => {
  test.each(["cold and clinical", "sunrise over the gym", "90s basement gym", "deep sea", "neon arcade"])(
    "produces a palette that passes the validator for %p",
    (description) => {
      const result = validatePalette(mockPaletteFor(description));
      expect(result.errors).toBeUndefined();
      expect(result.ok).toBe(true);
    }
  );

  test("is deterministic", () => {
    expect(mockPaletteFor("sunrise")).toEqual(mockPaletteFor("sunrise"));
    expect(mockPaletteFor("sunrise")).not.toEqual(mockPaletteFor("midnight"));
  });
});
