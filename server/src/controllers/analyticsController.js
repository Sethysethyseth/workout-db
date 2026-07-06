const prisma = require("../lib/prisma");
const { enrichSet, buildSummary } = require("../analytics");
const { buildUserExerciseIndex } = require("../analytics/userExercises");

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
    const [sessions, userExerciseRows] = await Promise.all([
      prisma.workoutSession.findMany({
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
                  templateExerciseId: true,
                  templateExercise: {
                    select: {
                      id: true,
                      templateSets: {
                        select: { order: true, reps: true, weight: true, rir: true, rpe: true },
                        orderBy: { order: "asc" },
                      },
                    },
                  },
                },
              },
              templateExercise: {
                select: {
                  id: true,
                  exerciseName: true,
                  templateSets: {
                    select: { order: true, reps: true, weight: true, rir: true, rpe: true },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.userExercise.findMany({
        where: { userId },
      }),
    ]);

    const userIndex = buildUserExerciseIndex(userExerciseRows);

    const enriched = [];
    // templateExerciseId -> planned sets, harvested from whichever linkage
    // path (direct set FK or via sessionExercise) surfaced the plan.
    const planLookup = {};
    for (const session of sessions) {
      for (const set of session.sets) {
        const planSource =
          set.templateExercise ?? set.sessionExercise?.templateExercise ?? null;
        if (planSource && planSource.templateSets.length > 0) {
          planLookup[planSource.id] = planSource.templateSets;
        }
        enriched.push(
          enrichSet(
            {
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
              rpe: set.rpe,
              order: set.order,
              templateExerciseId: planSource ? planSource.id : null,
            },
            userIndex
          )
        );
      }
    }

    return res.json(
      buildSummary(enriched, { from, to, planLookup, userExercises: userExerciseRows })
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getSummary,
};
