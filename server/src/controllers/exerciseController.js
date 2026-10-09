const prisma = require("../lib/prisma");
const { loadCatalog, resolveExercise, normalizeExerciseName, searchCatalog } = require("../analytics");
const { buildUserExerciseIndex } = require("../analytics/userExercises");
const { selectRowsToAdopt } = require("../lib/customExerciseRename");

const MAX_NAMES = 100;
const MAX_EXERCISE_NAME_LENGTH = 120;

function isValidNamesArray(names) {
  if (!Array.isArray(names) || names.length === 0) return false;
  return names.every((n) => typeof n === "string");
}

function deriveMuscleVocabulary(catalog = loadCatalog()) {
  const muscles = new Set();
  for (const entry of catalog.byId.values()) {
    for (const muscle of entry.primaryMuscles || []) {
      muscles.add(muscle);
    }
    for (const muscle of entry.secondaryMuscles || []) {
      muscles.add(muscle);
    }
  }
  return Array.from(muscles).sort();
}

function validateMuscles(muscles, vocabulary) {
  if (
    !muscles ||
    typeof muscles !== "object" ||
    Array.isArray(muscles)
  ) {
    return { ok: false, error: "muscles must be a plain object" };
  }

  const entries = Object.entries(muscles);
  if (entries.length < 1 || entries.length > 17) {
    return {
      ok: false,
      error: "muscles must contain between 1 and 17 entries",
    };
  }

  const vocabSet = new Set(vocabulary);
  let primaryCount = 0;

  for (const [muscle, designation] of entries) {
    if (!vocabSet.has(muscle)) {
      return {
        ok: false,
        error: `muscles contains unknown muscle "${muscle}"`,
      };
    }
    if (designation !== "primary" && designation !== "secondary") {
      return {
        ok: false,
        error: `muscles.${muscle} must be "primary" or "secondary"`,
      };
    }
    if (designation === "primary") {
      primaryCount += 1;
    }
  }

  if (primaryCount < 1) {
    return {
      ok: false,
      error: "muscles must include at least one primary muscle",
    };
  }

  return { ok: true, value: muscles };
}

function mapResolveResult(name, resolution) {
  if (resolution.resolved && resolution.source === "userExercise") {
    return {
      name,
      resolved: true,
      source: "userExercise",
      catalogId: null,
      userExerciseId: resolution.userExercise.id,
      canonicalName: resolution.userExercise.name,
    };
  }

  if (resolution.resolved) {
    return {
      name,
      resolved: true,
      source: "catalog",
      catalogId: resolution.catalogEntry.id,
      userExerciseId: null,
      canonicalName: resolution.catalogEntry.name,
    };
  }

  return {
    name,
    resolved: false,
    source: null,
    catalogId: null,
    userExerciseId: null,
    canonicalName: null,
  };
}

async function getMuscles(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    return res.json({ muscles: deriveMuscleVocabulary() });
  } catch (err) {
    return next(err);
  }
}

/**
 * Name and muscle checks shared by create and update so the two routes
 * cannot drift. Pass only the fields being applied. `excludeId` skips the
 * row being edited when checking the owner's own library.
 */
async function assertCustomExerciseFields(userId, fields, { excludeId = null } = {}) {
  const result = {};

  if (Object.prototype.hasOwnProperty.call(fields, "name")) {
    const name = fields.name;
    if (typeof name !== "string" || !name.trim()) {
      return { ok: false, error: "name is required" };
    }

    const trimmedName = name.trim();
    if (trimmedName.length > MAX_EXERCISE_NAME_LENGTH) {
      return {
        ok: false,
        error: `name must be at most ${MAX_EXERCISE_NAME_LENGTH} characters`,
      };
    }

    const normalizedName = normalizeExerciseName(trimmedName);
    if (!normalizedName) {
      return {
        ok: false,
        error: "name must contain recognizable characters after normalization",
      };
    }

    const catalogResolution = resolveExercise({ exerciseName: trimmedName });
    if (catalogResolution.resolved) {
      return {
        ok: false,
        error: `already tracked as ${catalogResolution.catalogEntry.name}`,
      };
    }

    const existing = await prisma.userExercise.findFirst({
      where: {
        userId,
        normalizedName,
        ...(excludeId != null ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      return {
        ok: false,
        error: "a custom exercise with this name already exists in your library",
      };
    }

    result.trimmedName = trimmedName;
    result.normalizedName = normalizedName;
  }

  if (Object.prototype.hasOwnProperty.call(fields, "muscles")) {
    const muscleCheck = validateMuscles(fields.muscles, deriveMuscleVocabulary());
    if (!muscleCheck.ok) {
      return { ok: false, error: muscleCheck.error };
    }
    result.muscles = muscleCheck.value;
  }

  return { ok: true, ...result };
}

async function createCustomExercise(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name, muscles } = req.body || {};
    const check = await assertCustomExerciseFields(userId, { name, muscles });
    if (!check.ok) {
      return res.status(400).json({ error: check.error });
    }

    const userExercise = await prisma.userExercise.create({
      data: {
        userId,
        name: check.trimmedName,
        normalizedName: check.normalizedName,
        muscles: check.muscles,
      },
    });

    return res.status(201).json({ userExercise });
  } catch (err) {
    return next(err);
  }
}

async function listCustomExercises(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const userExercises = await prisma.userExercise.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return res.json({ userExercises });
  } catch (err) {
    return next(err);
  }
}

async function deleteCustomExercise(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        error: "User exercise not found",
      });
    }

    const existing = await prisma.userExercise.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        error: "User exercise not found",
      });
    }

    await prisma.userExercise.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function adoptNameOnlyRows(tx, model, rows, oldNormalized, id, nextName, ownerWhere) {
  const matches = selectRowsToAdopt(rows, oldNormalized);
  if (matches.length === 0) return 0;
  const updated = await model.updateMany({
    where: {
      id: { in: matches.map((row) => row.id) },
      ...ownerWhere,
    },
    data: { userExerciseId: id, exerciseName: nextName },
  });
  return updated.count;
}

async function updateCustomExercise(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        error: "User exercise not found",
      });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const hasName = Object.prototype.hasOwnProperty.call(body, "name");
    const hasMuscles = Object.prototype.hasOwnProperty.call(body, "muscles");
    if (!hasName && !hasMuscles) {
      return res.status(400).json({
        error: "name or muscles is required",
      });
    }

    const existing = await prisma.userExercise.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({
        error: "User exercise not found",
      });
    }

    const fields = {};
    if (hasName) fields.name = body.name;
    if (hasMuscles) fields.muscles = body.muscles;
    const check = await assertCustomExerciseFields(userId, fields, { excludeId: id });
    if (!check.ok) {
      return res.status(400).json({ error: check.error });
    }

    const nextName = hasName ? check.trimmedName : existing.name;
    const nextNormalized = hasName ? check.normalizedName : existing.normalizedName;
    const data = {};
    if (hasName) {
      data.name = nextName;
      data.normalizedName = nextNormalized;
    }
    if (hasMuscles) {
      data.muscles = check.muscles;
    }

    const nameChanged = nextName !== existing.name || nextNormalized !== existing.normalizedName;

    const outcome = await prisma.$transaction(async (tx) => {
      const written = await tx.userExercise.updateMany({
        where: { id, userId },
        data,
      });
      if (written.count !== 1) {
        const missing = new Error("User exercise not found");
        missing.statusCode = 404;
        throw missing;
      }

      let renamedRows = 0;
      if (nameChanged) {
        const [sessionLinked, templateLinked, blockLinked] = await Promise.all([
          tx.sessionExercise.updateMany({
            where: { userExerciseId: id, workoutSession: { userId } },
            data: { exerciseName: nextName },
          }),
          tx.templateExercise.updateMany({
            where: { userExerciseId: id, workoutTemplate: { userId } },
            data: { exerciseName: nextName },
          }),
          tx.blockWorkoutExercise.updateMany({
            where: {
              userExerciseId: id,
              blockWorkout: { blockWeek: { blockTemplate: { userId } } },
            },
            data: { exerciseName: nextName },
          }),
        ]);
        renamedRows += sessionLinked.count + templateLinked.count + blockLinked.count;

        const [sessionCandidates, templateCandidates, blockCandidates] = await Promise.all([
          tx.sessionExercise.findMany({
            where: {
              exerciseId: null,
              userExerciseId: null,
              workoutSession: { userId },
            },
            select: { id: true, exerciseName: true },
          }),
          tx.templateExercise.findMany({
            where: {
              exerciseId: null,
              userExerciseId: null,
              workoutTemplate: { userId },
            },
            select: { id: true, exerciseName: true },
          }),
          tx.blockWorkoutExercise.findMany({
            where: {
              exerciseId: null,
              userExerciseId: null,
              blockWorkout: { blockWeek: { blockTemplate: { userId } } },
            },
            select: { id: true, exerciseName: true },
          }),
        ]);

        renamedRows += await adoptNameOnlyRows(
          tx,
          tx.sessionExercise,
          sessionCandidates,
          existing.normalizedName,
          id,
          nextName,
          { exerciseId: null, userExerciseId: null, workoutSession: { userId } }
        );
        renamedRows += await adoptNameOnlyRows(
          tx,
          tx.templateExercise,
          templateCandidates,
          existing.normalizedName,
          id,
          nextName,
          { exerciseId: null, userExerciseId: null, workoutTemplate: { userId } }
        );
        renamedRows += await adoptNameOnlyRows(
          tx,
          tx.blockWorkoutExercise,
          blockCandidates,
          existing.normalizedName,
          id,
          nextName,
          {
            exerciseId: null,
            userExerciseId: null,
            blockWorkout: { blockWeek: { blockTemplate: { userId } } },
          }
        );
      }

      const userExercise = await tx.userExercise.findFirst({
        where: { id, userId },
      });
      return { userExercise, renamedRows };
    });

    return res.json(outcome);
  } catch (err) {
    if (err && err.statusCode === 404) {
      return res.status(404).json({ error: "User exercise not found" });
    }
    return next(err);
  }
}

async function resolveExerciseNames(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const names = req.body && req.body.names;

    if (!isValidNamesArray(names)) {
      return res.status(400).json({
        error: "names must be a nonempty array of strings",
      });
    }

    if (names.length > MAX_NAMES) {
      return res.status(400).json({
        error: `names must contain at most ${MAX_NAMES} entries`,
      });
    }

    const userRows = await prisma.userExercise.findMany({
      where: { userId },
    });
    const userIndex = buildUserExerciseIndex(userRows);

    const results = names.map((name) => {
      const resolution = resolveExercise({ exerciseName: name }, undefined, userIndex);
      return mapResolveResult(name, resolution);
    });

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

async function searchExercises(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const q = req.query && req.query.q;

    if (typeof q !== "string") {
      return res.status(400).json({
        error: "q is required",
      });
    }

    let limit = 10;
    if (req.query && req.query.limit !== undefined && req.query.limit !== "") {
      const parsed = Number.parseInt(String(req.query.limit), 10);
      if (!Number.isInteger(parsed)) {
        return res.status(400).json({
          error: "limit must be an integer",
        });
      }
      limit = Math.min(50, Math.max(1, parsed));
    }

    // At most two indexed, user-scoped queries: custom-exercise index + usage.
    // Usage unions logged session appearances with saved-block appearances.
    const [userRows, usageRows] = await Promise.all([
      prisma.userExercise.findMany({
        where: { userId },
      }),
      prisma.$queryRaw`
        SELECT key, SUM(n)::int AS n
        FROM (
          SELECT
            CASE
              WHEN se."exerciseId" IS NOT NULL THEN 'catalog:' || se."exerciseId"
              WHEN se."userExerciseId" IS NOT NULL THEN 'user:' || se."userExerciseId"::text
              ELSE NULL
            END AS key,
            1 AS n
          FROM "SessionExercise" se
          INNER JOIN "WorkoutSession" ws ON ws.id = se."workoutSessionId"
          WHERE ws."userId" = ${userId}
          UNION ALL
          SELECT
            CASE
              WHEN bwe."exerciseId" IS NOT NULL THEN 'catalog:' || bwe."exerciseId"
              WHEN bwe."userExerciseId" IS NOT NULL THEN 'user:' || bwe."userExerciseId"::text
              ELSE NULL
            END AS key,
            1 AS n
          FROM "BlockWorkoutExercise" bwe
          INNER JOIN "BlockWorkout" bw ON bw.id = bwe."blockWorkoutId"
          INNER JOIN "BlockWeek" bwk ON bwk.id = bw."blockWeekId"
          INNER JOIN "BlockTemplate" bt ON bt.id = bwk."blockTemplateId"
          WHERE bt."userId" = ${userId}
        ) t
        WHERE key IS NOT NULL
        GROUP BY key
      `,
    ]);

    const usageByKey = new Map();
    for (const row of usageRows) {
      const key = row && row.key != null ? String(row.key) : "";
      const n = Number(row && row.n);
      if (key && Number.isFinite(n) && n > 0) usageByKey.set(key, n);
    }

    const userIndex = buildUserExerciseIndex(userRows);
    const { results, total, hasMore } = searchCatalog(loadCatalog(), userIndex, q, {
      limit,
      usageByKey,
    });

    return res.json({ results, total, hasMore });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMuscles,
  createCustomExercise,
  listCustomExercises,
  updateCustomExercise,
  deleteCustomExercise,
  resolveExerciseNames,
  searchExercises,
};
