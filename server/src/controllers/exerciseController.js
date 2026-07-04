const { resolveExercise } = require("../analytics/resolve");

const MAX_NAMES = 100;

function isValidNamesArray(names) {
  if (!Array.isArray(names) || names.length === 0) return false;
  return names.every((n) => typeof n === "string");
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

    const results = names.map((name) => {
      const resolution = resolveExercise({ exerciseName: name });
      return {
        name,
        resolved: resolution.resolved,
        catalogId: resolution.catalogEntry ? resolution.catalogEntry.id : null,
        canonicalName: resolution.catalogEntry ? resolution.catalogEntry.name : null,
      };
    });

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
}

module.exports = { resolveExerciseNames };
