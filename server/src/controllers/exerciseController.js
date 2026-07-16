const prisma = require("../lib/prisma");
const { loadCatalog, resolveExercise, normalizeExerciseName, searchCatalog } = require("../analytics");
const { buildUserExerciseIndex } = require("../analytics/userExercises");

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

async function createCustomExercise(req, res, next) {
  try {
    const userId = req.authUserId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { name, muscles } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "name is required",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > MAX_EXERCISE_NAME_LENGTH) {
      return res.status(400).json({
        error: `name must be at most ${MAX_EXERCISE_NAME_LENGTH} characters`,
      });
    }

    const normalizedName = normalizeExerciseName(trimmedName);
    if (!normalizedName) {
      return res.status(400).json({
        error: "name must contain recognizable characters after normalization",
      });
    }

    const catalogResolution = resolveExercise({ exerciseName: trimmedName });
    if (catalogResolution.resolved) {
      return res.status(400).json({
        error: `already tracked as ${catalogResolution.catalogEntry.name}`,
      });
    }

    const existing = await prisma.userExercise.findFirst({
      where: { userId, normalizedName },
    });
    if (existing) {
      return res.status(400).json({
        error: "a custom exercise with this name already exists in your library",
      });
    }

    const muscleCheck = validateMuscles(muscles, deriveMuscleVocabulary());
    if (!muscleCheck.ok) {
      return res.status(400).json({ error: muscleCheck.error });
    }

    const userExercise = await prisma.userExercise.create({
      data: {
        userId,
        name: trimmedName,
        normalizedName,
        muscles: muscleCheck.value,
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
      limit = Math.min(25, Math.max(1, parsed));
    }

    const userRows = await prisma.userExercise.findMany({
      where: { userId },
    });
    const userIndex = buildUserExerciseIndex(userRows);
    const results = searchCatalog(loadCatalog(), userIndex, q, { limit });

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMuscles,
  createCustomExercise,
  listCustomExercises,
  deleteCustomExercise,
  resolveExerciseNames,
  searchExercises,
};
