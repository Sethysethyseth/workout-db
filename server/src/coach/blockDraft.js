/**
 * Coach block-draft helpers (blocks-v2.md section 9). Prompt assembly,
 * stop-reason mapping, mock draft, and compact block text for ask focus.
 * Pure where possible - no Prisma, no env.
 */

const {
  BLOCK_FORMAT_AI_INSTRUCTIONS,
  BLOCK_FORMAT_JSON_SCHEMA,
} = require("../blocks/aiFormatPrompt");
const { validateBlockDraft } = require("../blocks/blockFormat");
const { extractFirstJsonText } = require("./cursorProvider");

const MAX_TEXT_CHARS = 20000;
const BLOCK_DRAFT_MAX_TOKENS = 8000;

/**
 * Sentinel block name for generate-mode off-topic declines. Structured
 * output cannot return free prose; the model returns a minimal valid
 * block with this name and the controller rejects it with a 4xx + refund.
 */
const OFF_TOPIC_BLOCK_NAME = "[[OFF_TOPIC]]";

const OFF_TOPIC_DRAFT_MESSAGE = "The coach can only build training blocks.";

/**
 * Palette-shaped stop errors for block drafts. max_tokens is its own code
 * so a truncated answer is never mistaken for block_invalid.
 */
function blockErrorForStopReason(stopReason) {
  if (stopReason === "refusal") {
    return { status: 422, body: { error: "block_refused" } };
  }
  if (stopReason === "max_tokens") {
    return {
      status: 422,
      body: {
        error: "block_truncated",
        message: "The model ran out of room.",
      },
    };
  }
  return null;
}

/**
 * Parse POST /coach/block-draft body.
 * @returns {{ ok: true, value } | { ok: false, status: number, error: string }}
 */
function parseBlockDraftRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "request body must be JSON" };
  }
  const mode = body.mode;
  if (mode !== "convert" && mode !== "generate") {
    return { ok: false, status: 400, error: "mode must be 'convert' or 'generate'" };
  }
  if (typeof body.text !== "string") {
    return { ok: false, status: 400, error: "text is required" };
  }
  const text = body.text.trim();
  if (!text) {
    return { ok: false, status: 400, error: "text is required" };
  }
  if (text.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `text must be at most ${MAX_TEXT_CHARS} characters`,
    };
  }
  if (body.unit !== "lb" && body.unit !== "kg") {
    return { ok: false, status: 400, error: "unit must be 'lb' or 'kg'" };
  }
  return { ok: true, value: { mode, text, unit: body.unit } };
}

function buildBlockDraftSystemPrompt({ mode, unit, trainingSummary }) {
  const lines = [
    BLOCK_FORMAT_AI_INSTRUCTIONS,
    "",
    `Target unit for loads: ${unit}. Put "${unit}" in the block's unit field.`,
  ];
  if (mode === "generate") {
    lines.push(
      "",
      "Mode: generate. The user describes the block they want. Invent a coherent program that matches the description. Prefer loads grounded in the training summary when one is provided; otherwise use sensible intermediate-lifter defaults and omit weight when unsure.",
      "",
      "Scope - training blocks only:",
      "- Build a program only when the description is about the lifter's training, lifting technique/programming, or a LogChamp training block.",
      "- For anything else (code, general math, homework, trivia, other apps), do NOT invent a real program. Return a minimal valid block (one week, one day, one placeholder exercise) whose name is exactly " +
        JSON.stringify(OFF_TOPIC_BLOCK_NAME) +
        ". The server will reject it."
    );
    if (trainingSummary) {
      lines.push(
        "",
        "Training summary for this lifter (JSON, computed by LogChamp - quote numbers, do not invent PRs):",
        JSON.stringify(trainingSummary)
      );
    }
  } else {
    lines.push(
      "",
      "Mode: convert. Turn the user's messy text (notes, a PDF extract, a forum post, an AI dump) into LogChamp Block Format v1. Preserve the program's intent; do not invent weeks or exercises that are not implied."
    );
  }
  return lines.join("\n");
}

function buildBlockDraftMessages({ mode, text }) {
  const prefix =
    mode === "generate"
      ? "Describe the block you want:"
      : "Convert this into a LogChamp block:";
  return [{ role: "user", content: `${prefix}\n\n${text}` }];
}

/**
 * Cursor path: schema inlined in system text; Anthropic path uses
 * outputFormat separately.
 */
function buildCursorBlockDraftSystem({ mode, unit, trainingSummary }) {
  return [
    {
      type: "text",
      text: [
        buildBlockDraftSystemPrompt({ mode, unit, trainingSummary }),
        "",
        "Return ONLY one JSON object matching this schema. No prose before or after. A ```json fence is allowed.",
        JSON.stringify(BLOCK_FORMAT_JSON_SCHEMA),
      ].join("\n"),
    },
  ];
}

/**
 * Parse a provider answer into a candidate object. Cursor uses
 * extractFirstJsonText; Anthropic expects bare JSON from structured output.
 * @returns {{ ok: true, candidate } | { ok: false, error: string }}
 */
function parseBlockCandidate(raw, { provider } = {}) {
  let text = typeof raw === "string" ? raw : "";
  if (provider === "cursor") {
    const extracted = extractFirstJsonText(text);
    if (!extracted) {
      return { ok: false, error: "The model did not return a block." };
    }
    text = extracted;
  } else if (Array.isArray(raw)) {
    // Anthropic message.content blocks
    text = raw
      .filter((block) => block && block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("");
  }
  try {
    const candidate = JSON.parse(text);
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return { ok: false, error: "The model did not return a block." };
    }
    return { ok: true, candidate };
  } catch {
    return { ok: false, error: "The model did not return a block." };
  }
}

/**
 * Deterministic mock draft. Always validates; name mentions the mode.
 * Implementation lives in mockProvider.js (same pattern as mockPaletteFor
 * living next to the palette path that consumes it - here the controller
 * imports from mockProvider; this re-export keeps blockDraft the single
 * import surface for tests that only touch draft helpers).
 */
function mockBlockDraftFor(mode, unit) {
  // Lazy require to avoid a hard cycle if mockProvider ever imports us.
  return require("./mockProvider").mockBlockDraftFor(mode, unit);
}

function formatLoad(set, unit) {
  const parts = [];
  if (set.durationSec != null) {
    parts.push(`${set.durationSec}s`);
  } else if (set.reps != null) {
    if (set.repsMax != null) parts.push(`${set.reps}-${set.repsMax}`);
    else parts.push(`${set.reps}`);
  }
  if (set.weight != null) {
    parts.push(`@ ${set.weight} ${unit || "lb"}`);
  }
  if (set.rpe != null) parts.push(`RPE ${set.rpe}`);
  if (set.rir != null) parts.push(`RIR ${set.rir}`);
  return parts.join(" ");
}

/**
 * Compact text rendering of a format-v1 block (or API tree via blockTreeToFormat)
 * for the ask focus. Weeks, labels, days, exercises with sets x reps/time @ load.
 */
function blockToCompactText(block, unitHint) {
  if (!block || typeof block !== "object") return "(empty block)";
  const unit = block.unit || unitHint || "lb";
  const lines = [];
  lines.push(`Block: ${block.name || "Untitled"}`);
  if (block.description) lines.push(`Description: ${block.description}`);
  lines.push(`Effort scale: ${block.effort || "none"}; unit: ${unit}`);
  const weeks = Array.isArray(block.weeks) ? block.weeks : [];
  weeks.forEach((week, wi) => {
    const label = week.label ? ` (${week.label})` : "";
    lines.push(`Week ${wi + 1}${label}:`);
    const days = Array.isArray(week.days) ? week.days : [];
    days.forEach((day) => {
      lines.push(`  ${day.name || "Day"}:`);
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      exercises.forEach((ex) => {
        const meta = [];
        if (ex.restSec != null) meta.push(`rest ${ex.restSec}s`);
        if (ex.effortCap) meta.push("effort cap");
        const metaStr = meta.length ? ` [${meta.join(", ")}]` : "";
        let setsDesc;
        if (typeof ex.sets === "number") {
          const sample = {
            reps: ex.reps,
            repsMax: ex.repsMax,
            durationSec: ex.durationSec,
            weight: ex.weight,
            rpe: ex.rpe,
            rir: ex.rir,
          };
          setsDesc = `${ex.sets} x ${formatLoad(sample, unit)}`;
        } else if (Array.isArray(ex.sets)) {
          setsDesc = ex.sets.map((s) => formatLoad(s, unit)).join("; ");
          setsDesc = `${ex.sets.length} sets: ${setsDesc}`;
        } else {
          setsDesc = "(no sets)";
        }
        lines.push(`    - ${ex.name}${metaStr}: ${setsDesc}`);
      });
    });
  });
  return lines.join("\n");
}

/** True when generate-mode returned the off-topic sentinel block. */
function isOffTopicDraft(candidate) {
  return (
    !!candidate &&
    typeof candidate === "object" &&
    !Array.isArray(candidate) &&
    candidate.name === OFF_TOPIC_BLOCK_NAME
  );
}

/**
 * Validate a candidate against the block format. Returns the validated
 * result or a 422-shaped payload (first 10 errors).
 */
function validateDraftCandidate(candidate, unit) {
  const validated = validateBlockDraft(candidate, { targetUnit: unit });
  if (!validated.ok) {
    return {
      ok: false,
      status: 422,
      body: {
        error: "block_invalid",
        errors: validated.errors.slice(0, 10),
      },
    };
  }
  return {
    ok: true,
    block: validated.block,
    stats: validated.stats,
  };
}

module.exports = {
  MAX_TEXT_CHARS,
  BLOCK_DRAFT_MAX_TOKENS,
  BLOCK_FORMAT_JSON_SCHEMA,
  OFF_TOPIC_BLOCK_NAME,
  OFF_TOPIC_DRAFT_MESSAGE,
  blockErrorForStopReason,
  parseBlockDraftRequest,
  buildBlockDraftSystemPrompt,
  buildBlockDraftMessages,
  buildCursorBlockDraftSystem,
  parseBlockCandidate,
  mockBlockDraftFor,
  blockToCompactText,
  isOffTopicDraft,
  validateDraftCandidate,
};
