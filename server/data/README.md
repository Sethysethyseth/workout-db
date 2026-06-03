# Exercise catalog data

## `exercises.json`

Upstream exercise catalog from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (`dist/exercises.json`).

- **Source:** https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
- **License:** Public Domain
- **Used by:** `server/prisma/seed.js` to populate the `Exercise` table

Each record includes fields such as `id`, `name`, `force`, `level`, `mechanic`, `equipment`, `category`, `primaryMuscles`, `secondaryMuscles`, `instructions`, and `images`.

### Updating

1. Download the latest `dist/exercises.json` from the upstream repo (link above).
2. Replace `server/data/exercises.json`.
3. Verify JSON parses: `node -e "require('./server/data/exercises.json')"`.
4. Run `npx prisma db seed` against **staging only** to refresh upstream-derived fields.

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

Each weight is a number from 0 to 1. When an exercise id is present in this file, analytics prefers these weights over the default primary/secondary muscle multiplier model. Curation work happens in a later unit; the file starts as an empty object `{}`.

### Updating

1. Add or edit entries in `muscle-weights.json` using the shape above.
2. Run `npx prisma db seed` against **staging only** to apply overrides (`muscleWeights` column). Exercises without an entry get `muscleWeights = null`.
