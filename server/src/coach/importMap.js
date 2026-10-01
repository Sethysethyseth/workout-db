/**
 * Coach import-map helpers (bks1). Prompt assembly + response parsing for
 * POST /coach/import-map. Modelled on blockDraft.js. Pure where possible.
 */

const { extractFirstJsonText } = require("./cursorProvider");
const {
  validateImportRecipe,
  sampleForRecipe,
  headersForRecipe,
  CANONICAL_ROLES,
} = require("../blocks/importRecipe");
const { IMPORT_MAP_COST } = require("./weeklyCap");

const MAX_TEXT_CHARS = 1_000_000;
const IMPORT_MAP_MAX_TOKENS = 2000;

const ROLE_LIST = [...CANONICAL_ROLES].filter((r) => r !== "ignore").concat("ignore");

const IMPORT_RECIPE_INSTRUCTIONS = [
  "You map a weightlifting program spreadsheet layout to a small JSON layout recipe.",
  "LogChamp's deterministic parser will apply your recipe to EVERY row. You never rewrite the rows.",
  "",
  "Return ONLY one JSON object with this shape (version must be 1):",
  '{',
  '  "version": 1,',
  '  "headerRow": 0,',
  '  "unit": "lb" | "kg",',
  '  "columns": { "<exact source header>": "<canonical role>" },',
  '  "prescriptionColumn": "<header with combined sets/reps/load text>",',
  '  "dayHeaderRows": { "column": "<header>" },',
  '  "carryDown": ["<header>", "..."],',
  '  "weekColumns": [{ "header": "<Week 1 header>", "week": 1 }]',
  '}',
  "",
  "Rules:",
  "- Use the EXACT header text from the sheet as object keys (including punctuation/spacing).",
  `- Canonical roles (pick one per mapped column): ${ROLE_LIST.map((r) => JSON.stringify(r)).join(", ")}.`,
  "- Map every useful column. Columns you omit are ignored with a warning.",
  "- headerRow: 0-based index of the real header among non-empty sheet rows (skip title rows above it).",
  "- prescriptionColumn: when one cell holds combined text like \"3x8 @ 185\" or \"4 x 6-8\".",
  "- dayHeaderRows: when a row whose only filled cell is a day name (e.g. \"Upper A\") starts a day.",
  "- carryDown: headers whose blank cells inherit the value above (merged-cell exports).",
  "- weekColumns: when each week is its own column of prescriptions; one source row expands per week. Blank cell = absent that week.",
  "- unit: \"lb\" or \"kg\" only when the sheet makes the load unit clear.",
  "- Do not invent headers that are not in the sample. Do not include unknown top-level keys.",
  "- Return ONLY the JSON object. A ```json fence is allowed. No prose before or after.",
].join("\n");

function importMapErrorForStopReason(stopReason) {
  if (stopReason === "refusal") {
    return { status: 422, body: { error: "import_map_refused" } };
  }
  if (stopReason === "max_tokens") {
    return {
      status: 422,
      body: {
        error: "import_map_truncated",
        message: "The model ran out of room.",
      },
    };
  }
  return null;
}

/**
 * @returns {{ ok: true, value: { text: string, unit?: string } } | { ok: false, status: number, error: string }}
 */
function parseImportMapRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "request body must be JSON" };
  }
  if (typeof body.text !== "string") {
    return { ok: false, status: 400, error: "text is required" };
  }
  const text = body.text;
  if (!text.trim()) {
    return { ok: false, status: 400, error: "text is required" };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `text must be at most ${MAX_TEXT_CHARS} characters`,
    };
  }
  let unit;
  if (body.unit != null) {
    if (body.unit !== "lb" && body.unit !== "kg") {
      return { ok: false, status: 400, error: "unit must be 'lb' or 'kg'" };
    }
    unit = body.unit;
  }
  return { ok: true, value: { text, unit } };
}

function buildImportMapSystemPrompt({ unit } = {}) {
  const lines = [IMPORT_RECIPE_INSTRUCTIONS];
  if (unit === "lb" || unit === "kg") {
    lines.push("", `The lifter's preferred unit is ${unit}. Set recipe.unit when the sheet agrees or is silent.`);
  }
  return lines.join("\n");
}

function buildImportMapMessages({ sample }) {
  return [
    {
      role: "user",
      content: `Map this spreadsheet sample to a layout recipe:\n\n${sample}`,
    },
  ];
}

function buildCursorImportMapSystem({ unit } = {}) {
  return [
    {
      type: "text",
      text: [
        buildImportMapSystemPrompt({ unit }),
        "",
        "Return ONLY one JSON object. No prose before or after. A ```json fence is allowed.",
      ].join("\n"),
    },
  ];
}

/**
 * @returns {{ ok: true, candidate: object } | { ok: false, error: string }}
 */
function parseImportMapCandidate(raw, { provider } = {}) {
  let text = typeof raw === "string" ? raw : "";
  if (provider === "cursor") {
    const extracted = extractFirstJsonText(text);
    if (!extracted) {
      return { ok: false, error: "The model did not return a layout recipe." };
    }
    text = extracted;
  } else if (Array.isArray(raw)) {
    text = raw
      .filter(
        (block) => block && block.type === "text" && typeof block.text === "string"
      )
      .map((block) => block.text)
      .join("");
    const extracted = extractFirstJsonText(text) || text;
    text = extracted;
  } else {
    const extracted = extractFirstJsonText(text);
    if (extracted) text = extracted;
  }
  try {
    const candidate = JSON.parse(text);
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return { ok: false, error: "The model did not return a layout recipe." };
    }
    return { ok: true, candidate };
  } catch {
    return { ok: false, error: "The model did not return a layout recipe." };
  }
}

/**
 * Validate a candidate recipe against the full text's real headers.
 * @returns {{ ok: true, recipe } | { ok: false, status: number, body: object }}
 */
function validateImportMapCandidate(candidate, text) {
  const headers = headersForRecipe(text, candidate || {});
  const validated = validateImportRecipe(candidate, headers);
  if (!validated.ok) {
    return {
      ok: false,
      status: 422,
      body: {
        error: "import_map_invalid",
        errors: validated.errors.slice(0, 20),
      },
    };
  }
  return { ok: true, recipe: validated.recipe };
}

function mockImportRecipeFor(text) {
  // Lazy require - same pattern as mockBlockDraftFor.
  return require("./mockProvider").mockImportRecipeFor(text);
}

module.exports = {
  IMPORT_MAP_COST,
  MAX_TEXT_CHARS,
  IMPORT_MAP_MAX_TOKENS,
  IMPORT_RECIPE_INSTRUCTIONS,
  importMapErrorForStopReason,
  parseImportMapRequest,
  buildImportMapSystemPrompt,
  buildImportMapMessages,
  buildCursorImportMapSystem,
  parseImportMapCandidate,
  validateImportMapCandidate,
  sampleForRecipe,
  mockImportRecipeFor,
};
