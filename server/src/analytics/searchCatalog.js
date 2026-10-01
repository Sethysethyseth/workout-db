const { normalizeExerciseName, foldExerciseNamePlural } = require("./normalize");

const LIFTING_CATEGORIES = new Set([
  "strength",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
]);

const SOURCE_ORDER = { userExercise: 0, catalog: 1 };

/** Rank tiers (lower = better). Alias-only hits sit after name substring. */
const RANK = {
  EXACT: 0,
  WHOLE_WORD: 1,
  NAME_PREFIX: 2,
  WORD_PREFIX: 3,
  SUBSTRING: 4,
  ALIAS: 5,
};

function tokenize(normalized) {
  return String(normalized || "")
    .split(/\s+/)
    .filter(Boolean);
}

function wordsEquivalent(a, b) {
  if (a === b) return true;
  const fa = foldExerciseNamePlural(a);
  const fb = foldExerciseNamePlural(b);
  return fa === b || a === fb || fa === fb;
}

/**
 * Best rank for a single query token against a normalized name + its words.
 * Returns -1 when the token does not match at all.
 */
function rankSingleToken(nameKey, nameWords, token) {
  if (!token) return -1;
  if (nameKey === token) return RANK.EXACT;

  let best = -1;
  for (const word of nameWords) {
    if (wordsEquivalent(word, token)) {
      best = best < 0 ? RANK.WHOLE_WORD : Math.min(best, RANK.WHOLE_WORD);
      continue;
    }
    if (word.startsWith(token)) {
      best = best < 0 ? RANK.WORD_PREFIX : Math.min(best, RANK.WORD_PREFIX);
      continue;
    }
    if (word.includes(token)) {
      best = best < 0 ? RANK.SUBSTRING : Math.min(best, RANK.SUBSTRING);
    }
  }

  if (nameKey.startsWith(token)) {
    best = best < 0 ? RANK.NAME_PREFIX : Math.min(best, RANK.NAME_PREFIX);
  } else if (nameKey.includes(token)) {
    best = best < 0 ? RANK.SUBSTRING : Math.min(best, RANK.SUBSTRING);
  }

  return best;
}

/**
 * Rank a catalog/user name against the normalized query.
 * Multi-word queries require every word to match (any order); the worst
 * per-word tier becomes the row's rank.
 */
function rankNameMatch(nameKey, queryKey) {
  if (!queryKey || !nameKey) return -1;
  if (nameKey === queryKey) return RANK.EXACT;

  const qWords = tokenize(queryKey);
  const nameWords = tokenize(nameKey);
  if (qWords.length === 0) return -1;

  if (qWords.length === 1) {
    return rankSingleToken(nameKey, nameWords, qWords[0]);
  }

  let worst = RANK.EXACT;
  for (const qw of qWords) {
    const r = rankSingleToken(nameKey, nameWords, qw);
    if (r < 0) return -1;
    if (r > worst) worst = r;
  }
  // Multi-word full-name prefix (rare) still beats a looser all-words match.
  if (nameKey.startsWith(queryKey)) {
    return Math.min(worst, RANK.NAME_PREFIX);
  }
  return worst;
}

function rankAliasMatch(aliasKey, queryKey) {
  if (!queryKey || !aliasKey) return -1;
  // Exact alias match is still an alias hit (last name-tier band), but within
  // the alias band prefer exact over looser alias substring matches.
  if (aliasKey === queryKey) return RANK.ALIAS;
  const r = rankNameMatch(aliasKey, queryKey);
  if (r < 0) return -1;
  return RANK.ALIAS + r; // 5..9 — always after name substring
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

function secondaryMusclesFromUserEntry(entry) {
  if (!entry.muscles || typeof entry.muscles !== "object") {
    return [];
  }
  return Object.entries(entry.muscles)
    .filter(([, designation]) => designation === "secondary")
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
    secondaryMuscles: entry.secondaryMuscles || [],
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
    secondaryMuscles: secondaryMusclesFromUserEntry(entry),
    equipment: null,
  };
}

function nameTightness(nameKey, queryKey) {
  const nameWords = tokenize(nameKey);
  const qWords = tokenize(queryKey);
  const last = nameWords[nameWords.length - 1] || "";
  const tailMatch = qWords.some((qw) => wordsEquivalent(last, qw)) ? 1 : 0;
  return { tailMatch, wordCount: nameWords.length };
}

function considerHit(hits, dedupeKey, row, rank, meta) {
  const { usage = 0, tailMatch = 0, wordCount = 99, queryKey = "" } = meta || {};
  const sourceOrder = SOURCE_ORDER[row.source];
  const existing = hits.get(dedupeKey);
  if (!existing) {
    hits.set(dedupeKey, {
      rank,
      sourceOrder,
      usage,
      tailMatch,
      wordCount,
      queryKey,
      name: row.name,
      row,
    });
    return;
  }

  // Same entry seen again (name + alias paths): keep the better rank, and if
  // equal, prefer attaching matchedAlias metadata when newly available.
  if (rank > existing.rank) {
    if (!existing.row.matchedAlias && row.matchedAlias) {
      hits.set(dedupeKey, {
        ...existing,
        row: { ...existing.row, matchedAlias: row.matchedAlias },
      });
    }
    return;
  }

  const betterRank = rank < existing.rank;
  const sameRankBetterSource =
    rank === existing.rank && sourceOrder < existing.sourceOrder;
  const sameRankBetterUsage =
    rank === existing.rank &&
    sourceOrder === existing.sourceOrder &&
    usage > existing.usage;
  const sameRankBetterTail =
    rank === existing.rank &&
    sourceOrder === existing.sourceOrder &&
    usage === existing.usage &&
    tailMatch > existing.tailMatch;
  const sameRankFewerWords =
    rank === existing.rank &&
    sourceOrder === existing.sourceOrder &&
    usage === existing.usage &&
    tailMatch === existing.tailMatch &&
    wordCount < existing.wordCount;
  const sameRankEarlierName =
    rank === existing.rank &&
    sourceOrder === existing.sourceOrder &&
    usage === existing.usage &&
    tailMatch === existing.tailMatch &&
    wordCount === existing.wordCount &&
    row.name.localeCompare(existing.name, undefined, { sensitivity: "base" }) < 0;

  if (
    betterRank ||
    sameRankBetterSource ||
    sameRankBetterUsage ||
    sameRankBetterTail ||
    sameRankFewerWords ||
    sameRankEarlierName
  ) {
    const nextRow =
      rank === existing.rank && !row.matchedAlias && existing.row.matchedAlias
        ? { ...row, matchedAlias: existing.row.matchedAlias }
        : row.matchedAlias
          ? row
          : existing.row.matchedAlias
            ? { ...row, matchedAlias: existing.row.matchedAlias }
            : row;
    hits.set(dedupeKey, {
      rank,
      sourceOrder,
      usage,
      tailMatch,
      wordCount,
      queryKey,
      name: nextRow.name,
      row: nextRow,
    });
  } else if (!existing.row.matchedAlias && row.matchedAlias) {
    hits.set(dedupeKey, {
      ...existing,
      row: { ...existing.row, matchedAlias: row.matchedAlias },
    });
  }
}

/**
 * Search catalog + user exercises by relevance.
 * @returns {{ results: object[], total: number, hasMore: boolean }}
 */
function searchCatalog(catalog, userIndex, query, { limit = 10, usageByKey } = {}) {
  const normalized = normalizeExerciseName(query);
  if (!normalized) {
    return { results: [], total: 0, hasMore: false };
  }

  const clampedLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const hits = new Map();
  const usageOf = (key) => {
    if (!usageByKey || typeof usageByKey.get !== "function") return 0;
    const n = Number(usageByKey.get(key));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  if (catalog && catalog.byNormalizedName) {
    for (const entry of catalog.byNormalizedName.values()) {
      if (!LIFTING_CATEGORIES.has(entry.category)) {
        continue;
      }

      const key = normalizeExerciseName(entry.name);
      const rank = rankNameMatch(key, normalized);
      if (rank < 0) {
        continue;
      }

      const tight = nameTightness(key, normalized);
      considerHit(hits, `catalog:${entry.id}`, makeCatalogRow(entry), rank, {
        usage: usageOf(`catalog:${entry.id}`),
        ...tight,
        queryKey: normalized,
      });
    }
  }

  if (catalog && catalog.byAlias) {
    for (const [aliasKey, entry] of catalog.byAlias.entries()) {
      if (!LIFTING_CATEGORIES.has(entry.category)) {
        continue;
      }

      const rank = rankAliasMatch(aliasKey, normalized);
      if (rank < 0) {
        continue;
      }

      const nameKey = normalizeExerciseName(entry.name);
      const nameRank = rankNameMatch(nameKey, normalized);
      const tight = nameTightness(nameKey, normalized);
      // Exact alias equality boosts tightness for "dumbbell curl" → Bicep Curl.
      const aliasExact = aliasKey === normalized ? 1 : 0;
      // If the canonical name already matches, keep the better name rank and
      // attach the alias as metadata.
      if (nameRank >= 0 && nameRank <= RANK.SUBSTRING) {
        considerHit(
          hits,
          `catalog:${entry.id}`,
          makeCatalogRow(entry, aliasKey),
          nameRank,
          {
            usage: usageOf(`catalog:${entry.id}`) + aliasExact * 1000,
            ...tight,
            queryKey: normalized,
          }
        );
        continue;
      }

      considerHit(
        hits,
        `catalog:${entry.id}`,
        makeCatalogRow(entry, aliasKey),
        rank,
        {
          usage: usageOf(`catalog:${entry.id}`) + aliasExact * 1000,
          ...tight,
          queryKey: normalized,
        }
      );
    }
  }

  if (userIndex && typeof userIndex.entries === "function") {
    for (const [key, entry] of userIndex.entries()) {
      const rank = rankNameMatch(key, normalized);
      if (rank < 0) {
        continue;
      }

      const tight = nameTightness(key, normalized);
      considerHit(hits, `user:${entry.id}`, makeUserRow(entry), rank, {
        usage: usageOf(`user:${entry.id}`),
        ...tight,
        queryKey: normalized,
      });
    }
  }

  const sorted = Array.from(hits.values()).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.sourceOrder !== b.sourceOrder) return a.sourceOrder - b.sourceOrder;
    if (a.usage !== b.usage) return b.usage - a.usage;
    if (a.tailMatch !== b.tailMatch) return b.tailMatch - a.tailMatch;
    if (a.wordCount !== b.wordCount) return a.wordCount - b.wordCount;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const total = sorted.length;
  const results = sorted.slice(0, clampedLimit).map((hit) => hit.row);
  return {
    results,
    total,
    hasMore: total > clampedLimit,
  };
}

module.exports = { searchCatalog, RANK };
