/**
 * Hosted-coach weekly cap: 7 counted questions per rolling 7 days.
 * Pure rules only - no database client, no I/O. The controller reads/writes rows.
 */

const WEEKLY_LIMIT = 7;
const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;
/** Coach questions charged for one AI layout-import map call (bks1). */
const IMPORT_MAP_COST = 3;
/**
 * Max coach uses reserved for one AI import-fix call (bkr3). Settled at
 * 1-4 after the model returns, by total tokens.
 */
const IMPORT_FIX_MAX_COST = 4;
/** Token ceilings (inclusive) for import-fix settle tiers. */
const IMPORT_FIX_TIER_1_MAX_TOKENS = 4000;
const IMPORT_FIX_TIER_2_MAX_TOKENS = 8000;
const IMPORT_FIX_TIER_3_MAX_TOKENS = 14000;
/** Hosted palette generation costs one weekly use. */
const PALETTE_COST = 1;
/** Ask / block-draft each cost one weekly use when capped. */
const ASK_COST = 1;
const DRAFT_COST = 1;

/** True when remaining weekly questions cover `cost` (default import-map). */
function remainingCoversCost(remaining, cost = IMPORT_MAP_COST) {
  return typeof remaining === "number" && remaining >= cost;
}

/**
 * Clamp settle cost to 0..reservedCount. Pure helper for reservation settle.
 * Non-finite / non-number actualCost treats as 0.
 */
function clampSettleCost(actualCost, reservedCount) {
  const n = typeof reservedCount === "number" && reservedCount > 0 ? reservedCount : 0;
  const cost =
    typeof actualCost === "number" && Number.isFinite(actualCost) ? actualCost : 0;
  return Math.max(0, Math.min(Math.floor(cost), n));
}

/** Cap snapshot shape returned by loadWeeklyCap / reserveUses. */
function capFromEvaluation(evaluated) {
  return {
    limit: WEEKLY_LIMIT,
    used: evaluated.used,
    remaining: evaluated.remaining,
    nextAvailableAt: evaluated.nextAvailableAt,
    allowed: evaluated.allowed,
  };
}

/** Trim, lowercase, drop empties. Unset / empty / non-string -> nobody exempt. */
function parseUncappedEmails(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isUncappedEmail(email, raw) {
  if (!email || typeof email !== "string") return false;
  return parseUncappedEmails(raw).includes(email.trim().toLowerCase());
}

/** Cap applies only to hosted-key questions for non-exempt emails. */
function weeklyCapApplies(keySource, email, raw) {
  return keySource === "hosted" && !isUncappedEmail(email, raw);
}

function timestampMs(value) {
  if (value instanceof Date) return value.getTime();
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * A timestamp exactly WINDOW_MS old is OUT of the window (exclusive start).
 * nextAvailableAt is ISO when the oldest in-window row ages out, else null.
 */
function evaluateWeeklyCap(timestamps, now) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const windowStart = nowMs - WINDOW_MS;
  const inWindow = [];
  for (const value of timestamps || []) {
    const ms = timestampMs(value);
    if (ms != null && ms > windowStart) inWindow.push(ms);
  }
  const used = inWindow.length;
  const remaining = Math.max(0, WEEKLY_LIMIT - used);
  const allowed = used < WEEKLY_LIMIT;
  // Over the limit (concurrent questions can overshoot), a question frees up
  // only once enough rows age out to drop `used` below the limit.
  let nextAvailableAt = null;
  if (!allowed && inWindow.length > 0) {
    inWindow.sort((a, b) => a - b);
    const freeing = inWindow[used - WEEKLY_LIMIT];
    nextAvailableAt = new Date(freeing + WINDOW_MS).toISOString();
  }
  return { allowed, used, remaining, nextAvailableAt };
}

module.exports = {
  WEEKLY_LIMIT,
  WINDOW_DAYS,
  WINDOW_MS,
  IMPORT_MAP_COST,
  IMPORT_FIX_MAX_COST,
  IMPORT_FIX_TIER_1_MAX_TOKENS,
  IMPORT_FIX_TIER_2_MAX_TOKENS,
  IMPORT_FIX_TIER_3_MAX_TOKENS,
  PALETTE_COST,
  ASK_COST,
  DRAFT_COST,
  remainingCoversCost,
  clampSettleCost,
  capFromEvaluation,
  parseUncappedEmails,
  isUncappedEmail,
  weeklyCapApplies,
  evaluateWeeklyCap,
};
