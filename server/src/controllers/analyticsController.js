const {
  fetchAllTimeEnrichedSets,
  loadSummary,
  loadExerciseDetail,
} = require("../ai/analyticsAccess");
const { buildExerciseIndex } = require("../analytics");

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Optional date param in getSummary's idiom: date-only `to` bounds at
// end-of-day. Returns { ok: true, date|null } or { ok: false, error }.
function parseOptionalDate(raw, name, endOfDay = false) {
  if (raw == null || raw === "") return { ok: true, date: null };
  if (typeof raw !== "string") {
    return { ok: false, error: `${name} must be a date or ISO 8601 datetime` };
  }
  const trimmed = raw.trim();
  const date =
    endOfDay && DATE_ONLY_RE.test(trimmed)
      ? new Date(`${trimmed}T23:59:59.999Z`)
      : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `${name} must be a valid date or ISO 8601 datetime` };
  }
  return { ok: true, date };
}

async function getSummary(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const rawFrom = req.query && req.query.from;
    const rawTo = req.query && req.query.to;

    if (typeof rawFrom !== "string" || !rawFrom.trim()) {
      return res.status(400).json({
        error: "from query parameter is required (a date or ISO 8601 datetime)",
      });
    }

    if (typeof rawTo !== "string" || !rawTo.trim()) {
      return res.status(400).json({
        error: "to query parameter is required (a date or ISO 8601 datetime)",
      });
    }

    const from = new Date(rawFrom);

    if (Number.isNaN(from.getTime())) {
      return res.status(400).json({
        error: "from must be a valid date or ISO 8601 datetime",
      });
    }

    // A date-only `to` means "through that day" - bound at end-of-day so a
    // session performed later on the `to` date is still included.
    const to = DATE_ONLY_RE.test(rawTo.trim())
      ? new Date(`${rawTo.trim()}T23:59:59.999Z`)
      : new Date(rawTo);

    if (Number.isNaN(to.getTime())) {
      return res.status(400).json({
        error: "to must be a valid date or ISO 8601 datetime",
      });
    }

    if (from.getTime() > to.getTime()) {
      return res.status(400).json({
        error: "from must not be after to",
      });
    }

    // Cross-user isolation happens in loadSummary: every set is reached
    // exclusively through a session owned by the authed user.
    return res.json(await loadSummary(userId, { from, to }));
  } catch (err) {
    return next(err);
  }
}

async function getExerciseIndex(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const enriched = await fetchAllTimeEnrichedSets(userId);
    return res.json({ exercises: buildExerciseIndex(enriched) });
  } catch (err) {
    return next(err);
  }
}

async function getExerciseDetail(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const rawExerciseId = req.query && req.query.exerciseId;
    const rawUserExerciseId = req.query && req.query.userExerciseId;
    const hasExerciseId = typeof rawExerciseId === "string" && rawExerciseId.trim() !== "";
    const hasUserExerciseId =
      typeof rawUserExerciseId === "string" && rawUserExerciseId.trim() !== "";

    if (hasExerciseId === hasUserExerciseId) {
      return res.status(400).json({
        error: "exactly one of exerciseId or userExerciseId is required",
      });
    }

    let userExerciseId = null;
    if (hasUserExerciseId) {
      userExerciseId = Number(rawUserExerciseId.trim());
      if (!Number.isInteger(userExerciseId)) {
        return res.status(400).json({ error: "userExerciseId must be an integer" });
      }
    }

    const fromParsed = parseOptionalDate(req.query && req.query.from, "from");
    if (!fromParsed.ok) return res.status(400).json({ error: fromParsed.error });
    const toParsed = parseOptionalDate(req.query && req.query.to, "to", true);
    if (!toParsed.ok) return res.status(400).json({ error: toParsed.error });
    if (
      fromParsed.date &&
      toParsed.date &&
      fromParsed.date.getTime() > toParsed.date.getTime()
    ) {
      return res.status(400).json({ error: "from must not be after to" });
    }

    const detail = await loadExerciseDetail(userId, {
      exerciseId: hasExerciseId ? rawExerciseId.trim() : undefined,
      userExerciseId: userExerciseId ?? undefined,
      from: fromParsed.date ?? undefined,
      to: toParsed.date ?? undefined,
    });

    if (detail === null) {
      return res.status(404).json({ error: "No logged sets for that exercise" });
    }
    return res.json(detail);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSummary,
  getExerciseIndex,
  getExerciseDetail,
};
