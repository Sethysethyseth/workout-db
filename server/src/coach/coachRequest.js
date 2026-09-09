/**
 * Pure validation for POST /coach/ask bodies. No env, no Prisma.
 *
 * The client sends the SAME date-only range it used for the analytics
 * summary, so the coach reads exactly the window the lifter is looking at.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUESTION_CHARS = 1000;
const MAX_HISTORY_TURNS = 12;
const MAX_HISTORY_CHARS = 4000;
const MAX_RANGE_DAYS = 12 * 7 + 1;
const ANALYTICS_VIEWS = new Set(["muscles", "strength", "exercises", "execution"]);

function fail(error) {
  return { ok: false, status: 400, error };
}

function parseDateOnly(raw, name, endOfDay) {
  if (typeof raw !== "string" || !DATE_ONLY_RE.test(raw.trim())) {
    return { ok: false, error: `${name} must be a date (YYYY-MM-DD)` };
  }
  const trimmed = raw.trim();
  const date = new Date(
    endOfDay ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`
  );
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `${name} must be a valid date` };
  }
  return { ok: true, date, label: trimmed };
}

function parseRange(raw) {
  if (raw == null) return { ok: true, range: null };
  if (typeof raw !== "object") return { ok: false, error: "range must be an object" };
  const from = parseDateOnly(raw.from, "range.from", false);
  if (!from.ok) return from;
  const to = parseDateOnly(raw.to, "range.to", true);
  if (!to.ok) return to;
  if (from.date.getTime() > to.date.getTime()) {
    return { ok: false, error: "range.from must not be after range.to" };
  }
  const days = Math.ceil((to.date - from.date) / (24 * 60 * 60 * 1000));
  if (days > MAX_RANGE_DAYS) {
    return { ok: false, error: `range may cover at most ${MAX_RANGE_DAYS} days` };
  }
  return {
    ok: true,
    range: { from: from.date, to: to.date, fromLabel: from.label, toLabel: to.label },
  };
}

function parseFocus(raw) {
  if (raw == null) return { ok: true, focus: null };
  if (typeof raw !== "object") return { ok: false, error: "focus must be an object" };
  if (raw.type === "view") {
    if (!ANALYTICS_VIEWS.has(raw.view)) {
      return { ok: false, error: "focus.view is not an analytics view" };
    }
    return { ok: true, focus: { type: "view", view: raw.view } };
  }
  if (raw.type === "session") {
    const id = Number(raw.sessionId);
    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, error: "focus.sessionId must be a positive integer" };
    }
    return { ok: true, focus: { type: "session", sessionId: id } };
  }
  return { ok: false, error: "focus.type must be 'view' or 'session'" };
}

/**
 * Normalize prior turns into strictly alternating user/assistant messages
 * that END with an assistant turn (the new question is appended after).
 * Consecutive same-role turns merge; a leading assistant turn is dropped; a
 * trailing user turn is dropped (it never got an answer).
 */
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const merged = [];
  for (const turn of raw.slice(-MAX_HISTORY_TURNS)) {
    if (!turn || typeof turn !== "object") continue;
    const role = turn.role === "assistant" ? "assistant" : turn.role === "user" ? "user" : null;
    if (!role) continue;
    const content =
      typeof turn.content === "string" ? turn.content.trim().slice(0, MAX_HISTORY_CHARS) : "";
    if (!content) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n\n${content}`.slice(0, MAX_HISTORY_CHARS);
    } else {
      merged.push({ role, content });
    }
  }
  while (merged.length > 0 && merged[0].role !== "user") merged.shift();
  while (merged.length > 0 && merged[merged.length - 1].role !== "assistant") merged.pop();
  return merged;
}

function parseCoachRequest(body) {
  if (!body || typeof body !== "object") return fail("request body must be JSON");

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return fail("question is required");
  if (question.length > MAX_QUESTION_CHARS) {
    return fail(`question must be at most ${MAX_QUESTION_CHARS} characters`);
  }

  const unit = body.unit === "kg" ? "kg" : "lbs";

  const focusParsed = parseFocus(body.focus);
  if (!focusParsed.ok) return fail(focusParsed.error);

  const rangeParsed = parseRange(body.range);
  if (!rangeParsed.ok) return fail(rangeParsed.error);

  return {
    ok: true,
    value: {
      question,
      unit,
      focus: focusParsed.focus,
      range: rangeParsed.range,
      history: normalizeHistory(body.history),
    },
  };
}

module.exports = {
  parseCoachRequest,
  normalizeHistory,
  MAX_QUESTION_CHARS,
  MAX_HISTORY_TURNS,
  MAX_RANGE_DAYS,
};
