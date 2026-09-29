/**
 * Import preview orchestration (pure).
 * Spec: docs/specs/blocks-v2.md sections 2, 3, 4; task BK3.
 */

const { validateBlockDraft } = require("./blockFormat");
const { parseDelimited, ParseDelimitedError } = require("./parseDelimited");
const { tableToBlock } = require("./tableToBlock");
const { historyToBlock } = require("./historyToBlock");

const MAX_TEXT_CHARS = 1_000_000;
const VALID_KINDS = new Set(["auto", "table", "json", "history"]);

/**
 * Extract the first JSON object from prose / fenced code, or null.
 * @param {string} text
 * @returns {string | null}
 */
function extractJsonObject(text) {
  if (typeof text !== "string") return null;

  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/i;
  const fence = text.match(fenceRe);
  if (fence) {
    const inner = fence[1].trim();
    if (inner.startsWith("{")) {
      // Unbalanced (truncated) fenced JSON is still returned so the caller
      // reports "isn't valid JSON" instead of falling through to the table path.
      return sliceBalancedObject(inner, 0) || inner;
    }
    const nested = findFirstParsableObject(inner);
    if (nested) return nested;
  }

  return findFirstParsableObject(text);
}

// Bounds the brace scan so a hostile paste of many `{` stays linear-ish.
const MAX_OBJECT_CANDIDATES = 50;

/**
 * First balanced `{...}` slice that parses as a JSON object. Stray braces in
 * prose or a table's notes cell ("Tempo {3-1-1}") are skipped, so a table
 * with a brace still imports as a table.
 * @param {string} text
 * @returns {string | null}
 */
function findFirstParsableObject(text) {
  let start = text.indexOf("{");
  let tries = 0;
  while (start >= 0 && tries < MAX_OBJECT_CANDIDATES) {
    tries += 1;
    const slice = sliceBalancedObject(text, start);
    if (slice) {
      try {
        const value = JSON.parse(slice);
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return slice;
        }
      } catch {
        // not JSON - try the next brace
      }
    }
    start = text.indexOf("{", start + 1);
  }
  return null;
}

/**
 * @param {string} text
 * @param {number} start index of '{'
 * @returns {string | null}
 */
function sliceBalancedObject(text, start) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * @param {string} jsonText
 * @returns {{ ok: true, value: object } | { ok: false, message: string }}
 */
function parseJsonCandidate(jsonText) {
  try {
    const value = JSON.parse(jsonText);
    return { ok: true, value };
  } catch (err) {
    const msg = err && err.message ? String(err.message) : "parse error";
    return {
      ok: false,
      message: `That isn't valid JSON: ${msg}`,
    };
  }
}

/**
 * Detect / resolve a candidate block from text.
 * @returns {{
 *   kind: string,
 *   candidate?: object,
 *   warnings: object[],
 *   notices: object,
 *   errors?: { path: string, message: string }[],
 * }}
 */
function resolveCandidate(text, kind, options) {
  const warnings = [];
  let notices = {};

  if (kind === "json") {
    const parsed = parseJsonCandidate(text.trim());
    if (!parsed.ok) {
      return {
        kind: "json",
        warnings: [],
        notices: {},
        errors: [{ path: "", message: parsed.message }],
      };
    }
    return { kind: "json", candidate: parsed.value, warnings, notices };
  }

  if (kind === "table" || kind === "history") {
    return parseDelimitedPath(text, kind, options);
  }

  // auto
  const trimmedStart = text.match(/\S/);
  if (trimmedStart && trimmedStart[0] === "{") {
    const parsed = parseJsonCandidate(text.trim());
    if (!parsed.ok) {
      return {
        kind: "json",
        warnings: [],
        notices: {},
        errors: [{ path: "", message: parsed.message }],
      };
    }
    return { kind: "json", candidate: parsed.value, warnings, notices };
  }

  const extracted = extractJsonObject(text);
  if (extracted) {
    const parsed = parseJsonCandidate(extracted);
    if (!parsed.ok) {
      return {
        kind: "json",
        warnings: [],
        notices: {},
        errors: [{ path: "", message: parsed.message }],
      };
    }
    return { kind: "json", candidate: parsed.value, warnings, notices };
  }

  return parseDelimitedPath(text, "auto", options);
}

/**
 * @param {string} text
 * @param {"auto"|"table"|"history"} kind
 * @param {object} options
 */
function parseDelimitedPath(text, kind, options) {
  let parsed;
  try {
    parsed = parseDelimited(text);
  } catch (err) {
    const message =
      err instanceof ParseDelimitedError || err.name === "ParseDelimitedError"
        ? err.message
        : err && err.message
          ? String(err.message)
          : "Couldn't parse delimited text";
    return {
      kind: kind === "auto" ? "table" : kind,
      warnings: [],
      notices: {},
      errors: [{ path: "", message }],
    };
  }

  const tableOpts = {
    unit: options.unit,
    skipWarmups: options.skipWarmups,
  };
  if (typeof options.name === "string") tableOpts.name = options.name;

  const historyOpts = {
    historyWeeks: options.historyWeeks,
    sourceUnit: options.sourceUnit || options.unit,
  };

  if (kind === "history") {
    const hist = historyToBlock(parsed, historyOpts);
    if (!hist) {
      return {
        kind: "history",
        warnings: [],
        notices: {},
        errors: [
          {
            path: "",
            message:
              "That doesn't look like a Strong or Hevy history export.",
          },
        ],
      };
    }
    return {
      kind: "history",
      candidate: hist.block,
      warnings: hist.warnings || [],
      notices: hist.notices || {},
    };
  }

  if (kind === "table") {
    return runTableToBlock(parsed, tableOpts);
  }

  // auto: history first, then table
  const hist = historyToBlock(parsed, historyOpts);
  if (hist) {
    return {
      kind: "history",
      candidate: hist.block,
      warnings: hist.warnings || [],
      notices: hist.notices || {},
    };
  }
  return runTableToBlock(parsed, tableOpts);
}

function runTableToBlock(parsed, tableOpts) {
  try {
    const result = tableToBlock(parsed, tableOpts);
    return {
      kind: "table",
      candidate: result.block,
      warnings: result.warnings || [],
      notices: result.notices || {},
    };
  } catch (err) {
    const message =
      err && err.message ? String(err.message) : "Couldn't read table";
    return {
      kind: "table",
      warnings: [],
      notices: {},
      errors: [{ path: "", message }],
    };
  }
}

/**
 * Collect distinct exercise names in first-appearance order.
 * @param {object} block
 * @returns {string[]}
 */
function collectDistinctExerciseNames(block) {
  const seen = new Set();
  const names = [];
  const weeks = (block && block.weeks) || [];
  for (const week of weeks) {
    for (const day of week.days || []) {
      for (const ex of day.exercises || []) {
        const name = ex && ex.name;
        if (typeof name !== "string") continue;
        if (seen.has(name)) continue;
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

/**
 * @param {object} block
 * @param {(name: string) => {
 *   resolved: boolean,
 *   exerciseId?: number|null,
 *   userExerciseId?: number|null,
 *   matchedName?: string|null,
 * }} resolveName
 */
function matchExercises(block, resolveName) {
  const names = collectDistinctExerciseNames(block);
  return names.map((name) => {
    const r =
      typeof resolveName === "function"
        ? resolveName(name) || { resolved: false }
        : { resolved: false };
    const resolved = Boolean(r.resolved);
    const exerciseId = resolved && r.exerciseId != null ? r.exerciseId : null;
    const userExerciseId =
      resolved && r.userExerciseId != null ? r.userExerciseId : null;
    let matchedName = null;
    if (resolved && r.matchedName != null && r.matchedName !== name) {
      matchedName = r.matchedName;
    }
    return {
      name,
      resolved,
      exerciseId,
      userExerciseId,
      matchedName,
    };
  });
}

/**
 * @param {string} text
 * @param {string} [kind]
 * @param {object} [options]
 * @param {(name: string) => object} [resolveName]
 * @returns {object}
 */
function buildImportPreview(text, kind = "auto", options = {}, resolveName) {
  const opts = options && typeof options === "object" ? options : {};

  if (typeof text !== "string") {
    return {
      ok: false,
      errors: [{ path: "text", message: "text must be a string" }],
      warnings: [],
    };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      errors: [
        {
          path: "text",
          message: `text must be at most ${MAX_TEXT_CHARS} characters`,
        },
      ],
      warnings: [],
    };
  }

  if (opts.unit !== "lb" && opts.unit !== "kg") {
    return {
      ok: false,
      errors: [
        {
          path: "options.unit",
          message: 'unit is required and must be "lb" or "kg"',
        },
      ],
      warnings: [],
    };
  }

  let resolvedKind = kind == null || kind === "" ? "auto" : kind;
  if (!VALID_KINDS.has(resolvedKind)) {
    return {
      ok: false,
      errors: [
        {
          path: "kind",
          message: 'kind must be "auto", "table", "json", or "history"',
        },
      ],
      warnings: [],
    };
  }

  const resolved = resolveCandidate(text, resolvedKind, opts);
  if (resolved.errors) {
    return {
      ok: false,
      kind: resolved.kind,
      errors: resolved.errors,
      warnings: resolved.warnings || [],
    };
  }

  const validated = validateBlockDraft(resolved.candidate, {
    targetUnit: opts.unit,
  });
  if (!validated.ok) {
    return {
      ok: false,
      kind: resolved.kind,
      errors: validated.errors,
      warnings: resolved.warnings || [],
    };
  }

  const exercises = matchExercises(validated.block, resolveName);

  return {
    ok: true,
    kind: resolved.kind,
    block: validated.block,
    stats: validated.stats,
    warnings: resolved.warnings || [],
    notices: resolved.notices || {},
    exercises,
  };
}

/**
 * Deep-clone block and rename exercises by exact name.
 * Invalid / unknown rename entries are ignored. Input is not mutated.
 * @param {object} block
 * @param {Record<string, string>|null|undefined} renames
 * @returns {object}
 */
function applyRenames(block, renames) {
  const clone = JSON.parse(JSON.stringify(block));
  if (!renames || typeof renames !== "object" || Array.isArray(renames)) {
    return clone;
  }

  const map = new Map();
  for (const [from, to] of Object.entries(renames)) {
    if (typeof to !== "string") continue;
    const trimmed = to.trim();
    if (trimmed.length < 1 || trimmed.length > 120) continue;
    map.set(from, trimmed);
  }
  if (map.size === 0) return clone;

  for (const week of clone.weeks || []) {
    for (const day of week.days || []) {
      for (const ex of day.exercises || []) {
        if (typeof ex.name === "string" && map.has(ex.name)) {
          ex.name = map.get(ex.name);
        }
      }
    }
  }
  return clone;
}

module.exports = {
  buildImportPreview,
  applyRenames,
  extractJsonObject,
  MAX_TEXT_CHARS,
};
