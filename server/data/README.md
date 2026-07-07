# Exercise catalog data

## `exercises.json`

Upstream exercise catalog from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (`dist/exercises.json`), vendored - never hot-linked.

- **Source:** https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
- **License:** Public Domain
- **Used by:** the analytics engine (`server/src/analytics/catalog.js`, loaded
  from disk - the engine never touches the DB) and `server/prisma/seed.js`,
  which mirrors it into the `Exercise` table (FK target for A4 linkage).

Each record includes fields such as `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `category`, `primaryMuscles`, `secondaryMuscles`, `instructions`, and `images`.

### Updating

1. Download the latest `dist/exercises.json` from the upstream repo (link above).
2. Replace `server/data/exercises.json`.
3. Verify: `node scripts/validate-catalog.mjs` from the repo root (disk-only).
4. Run `npx prisma db seed` against **staging only** to refresh upstream-derived fields (idempotent upserts; the seed refuses non-staging hosts via `dbHostGuard`).

## `muscle-weights.json`

Curated muscle-weight overrides keyed by Free Exercise DB exercise `id`.

**Shape:**

```json
{
  "<exercise_id>": {
    "<muscle_name>": 0.75
  }
}
```

Each weight is a number from 0 to 1. When an exercise id is present in this file, analytics prefers these weights over the default primary/secondary muscle multiplier model. Curation rationale lives in `muscle-weights-rationale.md` - **any value change updates the rationale doc in the SAME commit** (AGENTS.md rule).

### Updating

1. Add or edit entries in `muscle-weights.json` using the shape above.
2. Update `muscle-weights-rationale.md` in the same commit.
3. Run `node scripts/validate-catalog.mjs` (all keys must resolve, sums valid).
4. Run `npx prisma db seed` against **staging only** to apply overrides (`muscleWeights` column). Exercises without an entry get `muscleWeights = null`.

## `exercise-aliases.json`

Curated colloquial-name aliases (`"<alias>": "<exercise_id>"`) resolved by the
engine's alias tier (`resolveExercise`: exerciseId > exact name > alias >
plural fold > user exercise). Rationale in `exercise-aliases-rationale.md` -
same same-commit rule as muscle weights. Aliases are disk-only; they are not
seeded into the DB.
