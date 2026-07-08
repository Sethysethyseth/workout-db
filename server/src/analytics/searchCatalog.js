const { normalizeExerciseName, foldExerciseNamePlural } = require("./normalize");

const LIFTING_CATEGORIES = new Set([
  "strength",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
]);

const SOURCE_ORDER = { userExercise: 0, catalog: 1 };

function matchRank(key, query) {
  if (key === query) return 0;
  if (key.startsWith(query)) return 1;
  if (key.includes(query)) return 2;
  return -1;
}

function queryVariants(query) {
  const folded = foldExerciseNamePlural(query);
  if (folded !== query) {
    return [query, folded];
  }
  return [query];
}

function primaryMusclesFromUserEntry(entry) {
  if (!entry.muscles || typeof entry.muscles !== "object") {
    return [];
  }
  return Object.entries(entry.muscles)
    .filter(([, designation]) => designation === "primary")
    .map(([muscle]) => muscle)
    .sort();
}

function makeCatalogRow(entry, matchedAlias = null) {
  return {
    source: "catalog",
    exerciseId: entry.id,
    userExerciseId: null,
    name: entry.name,
    matchedAlias,
    primaryMuscles: entry.primaryMuscles || [],
    equipment: entry.equipment ?? null,
  };
}

function makeUserRow(entry) {
  return {
    source: "userExercise",
    exerciseId: null,
    userExerciseId: entry.id,
    name: entry.name,
    matchedAlias: null,
    primaryMuscles: primaryMusclesFromUserEntry(entry),
    equipment: null,
  };
}

function considerHit(hits, dedupeKey, row, rank) {
  const sourceOrder = SOURCE_ORDER[row.source];
  const existing = hits.get(dedupeKey);
  if (!existing) {
    hits.set(dedupeKey, { rank, sourceOrder, name: row.name, row });
    return;
  }

  const betterRank = rank < existing.rank;
  const sameRankBetterSource =
    rank === existing.rank && sourceOrder < existing.sourceOrder;
  const sameRankSameSourceEarlierName =
    rank === existing.rank &&
    sourceOrder === existing.sourceOrder &&
    row.name.localeCompare(existing.name, undefined, { sensitivity: "base" }) < 0;

  if (betterRank || sameRankBetterSource || sameRankSameSourceEarlierName) {
    hits.set(dedupeKey, { rank, sourceOrder, name: row.name, row });
  }
}

function searchCatalog(catalog, userIndex, query, { limit = 10 } = {}) {
  const normalized = normalizeExerciseName(query);
  if (!normalized) {
    return [];
  }

  const clampedLimit = Math.max(1, Math.min(25, Number(limit) || 10));
  const variants = queryVariants(normalized);
  const hits = new Map();

  if (catalog && catalog.byNormalizedName) {
    for (const entry of catalog.byNormalizedName.values()) {
      if (!LIFTING_CATEGORIES.has(entry.category)) {
        continue;
      }

      const key = normalizeExerciseName(entry.name);
      let bestRank = -1;
      for (const variant of variants) {
        bestRank = Math.max(bestRank, matchRank(key, variant));
      }
      if (bestRank < 0) {
        continue;
      }

      considerHit(hits, `catalog:${entry.id}`, makeCatalogRow(entry), bestRank);
    }
  }

  if (catalog && catalog.byAlias) {
    for (const [aliasKey, entry] of catalog.byAlias.entries()) {
      if (!LIFTING_CATEGORIES.has(entry.category)) {
        continue;
      }

      let bestRank = -1;
      for (const variant of variants) {
        bestRank = Math.max(bestRank, matchRank(aliasKey, variant));
      }
      if (bestRank < 0) {
        continue;
      }

      considerHit(
        hits,
        `catalog:${entry.id}`,
        makeCatalogRow(entry, aliasKey),
        bestRank
      );
    }
  }

  if (userIndex && typeof userIndex.entries === "function") {
    for (const [key, entry] of userIndex.entries()) {
      let bestRank = -1;
      for (const variant of variants) {
        bestRank = Math.max(bestRank, matchRank(key, variant));
      }
      if (bestRank < 0) {
        continue;
      }

      considerHit(hits, `user:${entry.id}`, makeUserRow(entry), bestRank);
    }
  }

  return Array.from(hits.values())
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    })
    .slice(0, clampedLimit)
    .map((hit) => hit.row);
}

module.exports = { searchCatalog };
