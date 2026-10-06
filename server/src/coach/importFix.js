/**
 * Coach import-fix helpers (bkr3). Pure route choice + token cost tier for
 * POST /coach/import-fix. Reuses the standard delimited reader for "is this
 * a table?" - never invents a second detector.
 */

const { parseDelimited } = require("../blocks/parseDelimited");
const {
  IMPORT_FIX_MAX_COST,
  IMPORT_FIX_TIER_1_MAX_TOKENS,
  IMPORT_FIX_TIER_2_MAX_TOKENS,
  IMPORT_FIX_TIER_3_MAX_TOKENS,
} = require("./weeklyCap");
const { MAX_TEXT_CHARS: IMPORT_MAP_MAX_TEXT } = require("./importMap");

const MAX_PROBLEMS = 20;
/** Table test (seat fix at landing): see looksLikeTable. */
const MAX_HEADER_CELL_CHARS = 40;
const MIN_ALIGNED_ROW_SHARE = 0.7;
const MAX_PROBLEM_CHARS = 200;

/**
 * True when the text looks like a spreadsheet table: a header row that
 * splits into multiple columns under the standard delimited reader, plus
 * at least one data row. Prose / notes / single-column dumps are false.
 */
function looksLikeTable(text) {
  if (typeof text !== "string" || !text.trim()) return false;
  try {
    const parsed = parseDelimited(text);
    const { header, rows } = parsed;
    if (!Array.isArray(header) || header.length < 2) return false;
    if (!Array.isArray(rows) || rows.length < 1) return false;
    // A header is short labels, not sentences.
    if (header.some((cell) => String(cell).trim().length > MAX_HEADER_CELL_CHARS)) {
      return false;
    }
    // Most rows line up with the header (+/- 1 cell for a ragged last column).
    // Prose that happens to contain commas splits into ragged rows.
    const aligned = rows.filter((r) => Math.abs(r.length - header.length) <= 1).length;
    return aligned / rows.length >= MIN_ALIGNED_ROW_SHARE;
  } catch {
    return false;
  }
}

/** Route choice for import-fix: table -> recipe, else convert. */
function chooseImportFixPath(text) {
  return looksLikeTable(text) ? "recipe" : "convert";
}

/**
 * Token-total -> uses charged (1..IMPORT_FIX_MAX_COST).
 * <= 4k -> 1; <= 8k -> 2; <= 14k -> 3; above -> 4.
 */
function importFixCostForTokens(totalTokens) {
  const n =
    typeof totalTokens === "number" && Number.isFinite(totalTokens)
      ? Math.max(0, totalTokens)
      : 0;
  if (n <= IMPORT_FIX_TIER_1_MAX_TOKENS) return 1;
  if (n <= IMPORT_FIX_TIER_2_MAX_TOKENS) return 2;
  if (n <= IMPORT_FIX_TIER_3_MAX_TOKENS) return 3;
  return IMPORT_FIX_MAX_COST;
}

/** Cursor / no-usage fallback: ceil(chars / 4). */
function estimateTokensFromChars(chars) {
  const n =
    typeof chars === "number" && Number.isFinite(chars) ? Math.max(0, chars) : 0;
  return Math.ceil(n / 4);
}

/**
 * Sum provider usage tokens when present; else estimate from prompt+reply chars.
 * @returns {{ tokens: number, estimated: boolean }}
 */
function resolveImportFixTokens({ usage, promptChars, replyChars } = {}) {
  const input =
    usage && typeof usage.input_tokens === "number" ? usage.input_tokens : null;
  const output =
    usage && typeof usage.output_tokens === "number" ? usage.output_tokens : null;
  if (input != null || output != null) {
    return {
      tokens: (input || 0) + (output || 0),
      estimated: false,
    };
  }
  const chars =
    (typeof promptChars === "number" ? promptChars : 0) +
    (typeof replyChars === "number" ? replyChars : 0);
  return { tokens: estimateTokensFromChars(chars), estimated: true };
}

/**
 * @returns {{ ok: true, value } | { ok: false, status: number, error: string }}
 */
function parseImportFixRequest(body) {
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
  if (text.length > IMPORT_MAP_MAX_TEXT) {
    return {
      ok: false,
      status: 400,
      error: `text must be at most ${IMPORT_MAP_MAX_TEXT} characters`,
    };
  }
  let unit;
  if (body.unit != null) {
    if (body.unit !== "lb" && body.unit !== "kg") {
      return { ok: false, status: 400, error: "unit must be 'lb' or 'kg'" };
    }
    unit = body.unit;
  }
  let problems;
  if (body.problems != null) {
    if (!Array.isArray(body.problems)) {
      return { ok: false, status: 400, error: "problems must be an array of strings" };
    }
    if (body.problems.length > MAX_PROBLEMS) {
      return {
        ok: false,
        status: 400,
        error: `problems must have at most ${MAX_PROBLEMS} items`,
      };
    }
    problems = [];
    for (const item of body.problems) {
      if (typeof item !== "string") {
        return {
          ok: false,
          status: 400,
          error: "problems must be an array of strings",
        };
      }
      const trimmed = item.trim();
      if (!trimmed) continue;
      problems.push(
        trimmed.length > MAX_PROBLEM_CHARS
          ? trimmed.slice(0, MAX_PROBLEM_CHARS)
          : trimmed
      );
      if (problems.length >= MAX_PROBLEMS) break;
    }
    if (problems.length === 0) problems = undefined;
  }
  return { ok: true, value: { text, unit, problems } };
}

/** Append the preview's problem list to a user message body. */
function formatProblemsForPrompt(problems) {
  if (!Array.isArray(problems) || problems.length === 0) return "";
  const lines = problems.map((p) => `- ${p}`);
  return [
    "",
    "The standard reader reported these problems - fix them if you can:",
    ...lines,
  ].join("\n");
}

module.exports = {
  looksLikeTable,
  chooseImportFixPath,
  importFixCostForTokens,
  estimateTokensFromChars,
  resolveImportFixTokens,
  parseImportFixRequest,
  formatProblemsForPrompt,
  MAX_PROBLEMS,
  MAX_PROBLEM_CHARS,
  IMPORT_FIX_MAX_COST,
};
