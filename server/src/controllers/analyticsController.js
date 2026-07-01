const prisma = require("../lib/prisma");
const { enrichSet, buildSummary } = require("../analytics");

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

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

    // Cross-user isolation happens here and only here: every set is reached
    // exclusively through a session owned by the authed user.
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        performedAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        sets: {
          include: {
            sessionExercise: {
              select: {
                exerciseName: true,
              },
            },
            templateExercise: {
              select: {
                exerciseName: true,
              },
            },
          },
        },
      },
    });

    const enriched = [];
    for (const session of sessions) {
      for (const set of session.sets) {
        enriched.push(
          enrichSet({
            performedAt: session.performedAt,
            exerciseName:
              set.sessionExercise?.exerciseName ??
              set.templateExercise?.exerciseName ??
              null,
            // No exercise FK exists yet (A4 pending), so resolution is
            // name-only. Null weight/reps/rir and unresolvable names are
            // handled by the engine - pass them through unfiltered.
            exerciseId: null,
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
          })
        );
      }
    }

    return res.json(buildSummary(enriched, { from, to }));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSummary,
};
