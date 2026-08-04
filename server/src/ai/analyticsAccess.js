const prisma = require("../lib/prisma");
const {
  enrichSet,
  buildSummary,
  buildExerciseIndex,
  buildExerciseDetail,
} = require("../analytics");
const { buildUserExerciseIndex } = require("../analytics/userExercises");

// Matches client ExercisesView: active = trained within trailing 8 weeks.
const ACTIVE_WINDOW_DAYS = 8 * 7;

// Shared set-include shape for the exercise index/detail queries (identity
// fields only - no template plan data, which only the summary needs).
const EXERCISE_SET_INCLUDE = {
  sets: {
    include: {
      sessionExercise: {
        select: { exerciseName: true, exerciseId: true, userExerciseId: true },
      },
      templateExercise: {
        select: { exerciseName: true, exerciseId: true, userExerciseId: true },
      },
    },
  },
};

/**
 * All-time enriched sets for one user. Cross-user isolation happens here
 * and only here (same doctrine as getSummary): every set is reached
 * exclusively through a session where-clause scoped by `userId`.
 */
async function fetchAllTimeEnrichedSets(userId) {
  const [sessions, userExerciseRows] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId },
      include: EXERCISE_SET_INCLUDE,
    }),
    prisma.userExercise.findMany({ where: { userId } }),
  ]);

  const userIndex = buildUserExerciseIndex(userExerciseRows);
  const enriched = [];
  for (const session of sessions) {
    for (const set of session.sets) {
      enriched.push(
        enrichSet(
          {
            performedAt: session.performedAt,
            exerciseName:
              set.sessionExercise?.exerciseName ??
              set.templateExercise?.exerciseName ??
              null,
            exerciseId:
              set.sessionExercise?.exerciseId ??
              set.templateExercise?.exerciseId ??
              null,
            userExerciseId:
              set.sessionExercise?.userExerciseId ??
              set.templateExercise?.userExerciseId ??
              null,
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
            rpe: set.rpe,
            order: set.order,
          },
          userIndex
        )
      );
    }
  }
  return enriched;
}

/**
 * Same Prisma query + buildSummary path the Analytics screen uses.
 * `from` / `to` must already be validated Date instances.
 */
async function loadSummary(userId, { from, to }) {
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
                exerciseId: true,
                userExerciseId: true,
                templateExerciseId: true,
                templateExercise: {
                  select: {
                    id: true,
                    templateSets: {
                      select: {
                        order: true,
                        reps: true,
                        weight: true,
                        rir: true,
                        rpe: true,
                      },
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
                exerciseId: true,
                userExerciseId: true,
                templateSets: {
                  select: {
                    order: true,
                    reps: true,
                    weight: true,
                    rir: true,
                    rpe: true,
                  },
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
            exerciseId:
              set.sessionExercise?.exerciseId ??
              set.templateExercise?.exerciseId ??
              null,
            userExerciseId:
              set.sessionExercise?.userExerciseId ??
              set.templateExercise?.userExerciseId ??
              null,
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

  const allTimeEnriched = await fetchAllTimeEnrichedSets(userId);

  return buildSummary(enriched, {
    from,
    to,
    planLookup,
    userExercises: userExerciseRows,
    allTimeEnrichedSets: allTimeEnriched,
  });
}

/**
 * Same all-time enriched sets + buildExerciseDetail path as the controller.
 * Returns null when no logged sets match the identity.
 */
async function loadExerciseDetail(
  userId,
  { exerciseId, userExerciseId, from, to }
) {
  const enriched = await fetchAllTimeEnrichedSets(userId);
  return buildExerciseDetail(enriched, {
    exerciseId,
    userExerciseId,
    from,
    to,
  });
}

/**
 * Roster from the same exercise index the Analytics Exercises tab uses,
 * sorted most-recently-trained first. activeOnly (default true) keeps the
 * trailing 8-week window the client uses for its "Active" lens.
 */
async function loadExerciseRoster(userId, { activeOnly = true } = {}) {
  const enriched = await fetchAllTimeEnrichedSets(userId);
  let exercises = buildExerciseIndex(enriched).slice();
  exercises.sort(
    (a, b) =>
      new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime()
  );
  if (activeOnly) {
    const cutoffMs = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    exercises = exercises.filter(
      (row) => new Date(row.lastPerformed).getTime() >= cutoffMs
    );
  }
  return { exercises };
}

/**
 * Session headers only - date, name, exercise count, set count. Never sets.
 */
async function loadRecentSessions(userId, { limit = 10 } = {}) {
  const take = Math.min(Math.max(1, limit), 50);
  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    take,
    include: {
      workoutTemplate: {
        select: { name: true },
      },
      _count: {
        select: {
          sets: true,
          sessionExercises: true,
        },
      },
    },
  });

  return {
    sessions: sessions.map((s) => ({
      date: s.performedAt.toISOString(),
      name: s.name ?? s.workoutTemplate?.name ?? null,
      exerciseCount: s._count.sessionExercises,
      setCount: s._count.sets,
    })),
  };
}

module.exports = {
  fetchAllTimeEnrichedSets,
  loadSummary,
  loadExerciseDetail,
  loadExerciseRoster,
  loadRecentSessions,
  ACTIVE_WINDOW_DAYS,
};
