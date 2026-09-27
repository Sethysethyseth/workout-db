/**
 * Hosted-coach weekly cap: 7 counted questions per rolling 7 days.
 * Pure rules only - no database client, no I/O. The controller reads/writes rows.
 */

const WEEKLY_LIMIT = 7;
const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

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
  parseUncappedEmails,
  isUncappedEmail,
  weeklyCapApplies,
  evaluateWeeklyCap,
};
