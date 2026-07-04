# TASK B9: analytics time series + execution concrete summaries (engine)

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

CONTEXT:
The analytics UI wave (weekly report on Home, volume trend view, strength
sparklines, execution comprehension rework) needs data the engine currently
collapses away: everything is one aggregate over the whole [from, to] range,
with no time axis, and execution rows return only derived ratios without the
plan/actual numbers they came from. B9 adds time-bucketed series and concrete
plan/actual summaries to the engine payload. Pure-function engine work only -
no schema change, no controller change, no UI. The engine stays DB-free
(zero Prisma imports under `server/src/analytics/` - this is checked).

FILES TO TOUCH:
- server/src/analytics/aggregate.js      (weekly per-muscle series, per-session e1RM series)
- server/src/analytics/summary.js        (ISO-serialize the new Date fields)
- server/src/analytics/planVsActual.js   (planned/actual concrete summaries)
- server/test/analytics/aggregate.test.js
- server/test/analytics/summary.test.js
- server/test/analytics/planVsActual.test.js
Do NOT modify anything outside these files.

CHANGE:

All three additions are ADDITIVE - every existing output field keeps its
exact current shape and semantics; existing tests must keep passing
unmodified (extend test files, don't rewrite existing cases).

### 1. Weekly per-muscle volume series (`aggregate.js`)

Extend `aggregateMuscleVolume` so each per-muscle row additionally carries:

```
series: [ { weekStart: Date, weekEnd: Date, effectiveSets, stimulatingSets } ]
```

- Week buckets are aligned to the range END (`to`), counting back:
  with `weeks = computeWeeksInRange(from, to)` (already exists), bucket `k`
  (0-based, oldest first, `k = 0..weeks-1`) spans
  `[toMs - (weeks - k) * MS_PER_WEEK, toMs - (weeks - k - 1) * MS_PER_WEEK)`.
  The LAST bucket is inclusive of `to` itself (a set at exactly `to` lands in
  the last bucket). `weekStart`/`weekEnd` are the bucket bounds as Dates.
- `series` always has exactly `weeks` entries for every muscle, oldest first.
  Weeks where the muscle got no sets carry `effectiveSets: 0` (a real zero -
  sparklines need the gap), `stimulatingSets: null`.
- Per-week `effectiveSets` = sum of that muscle's fractional contributions
  from sets in that bucket, `round2`. NOTE the unit difference from the
  existing top-level fields: top-level `effectiveSets` is a per-week AVERAGE
  over the range; each `series` entry is that week's raw sum. Do not divide
  series entries by `weeks`.
- Per-week `stimulatingSets` = sum of `stimulatingContribution[muscle]` over
  that bucket's sets that carry an effort signal (`stimulatingContribution
  !== null`), `round2`; `null` when NO set contributing to this muscle in
  this bucket carries effort data. (This is deliberately a per-bucket rule,
  finer than the existing top-level `hasRirData`-over-the-whole-range rule.)
- Follow the existing single-pass accumulator style in the function; keep
  the existing sort and all existing fields byte-identical.

### 2. Per-session e1RM series (`aggregate.js`)

Extend `aggregateExerciseMetrics` so each per-exercise entry additionally
carries:

```
e1rmSeries: [ { performedAt: Date, epley } ]
```

- One point per SESSION: sets sharing the same `performedAt` time are one
  session (the same dedup rule `computeMatchedEffortTrend` and the
  `frequency` accumulator already use); the session's representative value is
  its MAX `metrics.e1rm.epley` among sets where epley is non-null (same
  representative rule as matchedEffort).
- Sorted by `performedAt` ascending. Sessions with no valid epley set are
  omitted. Unrounded epley (matches `e1rmTrend`'s values - `e1rmSeries[0]`
  must equal `e1rmTrend.first` and the last entry `e1rmTrend.latest`).
- Exercises with zero valid sets get `e1rmSeries: []` (their `e1rmTrend`
  is already the all-null object).

### 3. Serialization (`summary.js`)

`buildSummary` must ISO-serialize the new Date fields the same way it
already does for `bestSet.performedAt`:
- every `series[i].weekStart` / `weekEnd` -> ISO string
- every `e1rmSeries[i].performedAt` -> ISO string
Keep the engine-side functions returning Dates; conversion happens only in
`buildSummary` (existing pattern).

### 4. Execution concrete plan/actual summaries (`planVsActual.js`)

Extend each row returned by `computeExecutionFidelity` with:

```
planned: { setsPerSession, reps, weight, effortRir }
actual:  { setsPerSession, reps, weight, effortRir }
```

Semantics (all `round2`, each field independently `null` when no data):
- `planned.setsPerSession` = plannedSetCount / sessions;
  `actual.setsPerSession` = actualSetCount / sessions (the accumulator
  already tracks all three counts).
- `planned.reps` / `planned.weight` = mean over ALL planned sets in the
  exercise's participating (session, templateExercise) groups where the
  field is non-null. `actual.reps` / `actual.weight` = same over all actual
  sets (`set.input.reps` / `set.input.weight`). Means are over all sets in
  participating groups, NOT just index-paired ones - these feed a concrete
  "Planned 3 x 8 @ 100 -> Did 2 x 8 @ 95" display, so they should describe
  what was planned and what was done, not the pairwise-comparable subset.
  (`loadAdherence`/`effortDrift` stay pairwise - unchanged.)
- `planned.effortRir` = mean of `deriveEffortRir({ rir, rpe })` over planned
  sets where it is non-null; `actual.effortRir` = mean of
  `set.input.effortRir` where non-null.
- Update the function's contract comment block to document the new fields
  (house style: the comment above the function is the contract).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (existing cases untouched and
  passing; new cases added for every behavior below).
- `npm test` NOT required for this unit (no controller/DB surface changed);
  do not run it - it resets the shared staging DB.
- `grep -ri prisma server/src/analytics/` still returns nothing.
- Series bucketing: for `from = 2026-01-01T00:00:00Z`, `to =
  2026-01-15T00:00:00Z` (weeks = 2), a chest set at `2026-01-02T10:00Z`
  lands in bucket 0 and one at `2026-01-14T10:00Z` in bucket 1; chest
  `series` has exactly 2 entries; a muscle-empty week yields
  `{ effectiveSets: 0, stimulatingSets: null }`; a set at exactly `to`
  lands in the LAST bucket (inclusive-end test).
- Series/aggregate consistency: sum of a muscle's `series[i].effectiveSets`
  equals `effectiveSets * weeks` within rounding tolerance (assert with
  `toBeCloseTo`).
- e1RM series: two sets in one session (same `performedAt`) produce ONE
  point carrying the higher epley; three sessions produce three ascending
  points; `e1rmSeries[0].epley === e1rmTrend.first` and last entry
  `=== e1rmTrend.latest`.
- `buildSummary` output contains NO Date instances anywhere in `perMuscle`
  or `perExercise` (walk the new fields; ISO strings only).
- planVsActual: plan of 3 sets (8 reps @ 100, rir 2) with 2 actual sets
  logged (8 @ 95 effort 3, 8 @ 95 effort 3) in one session yields
  `planned: { setsPerSession: 3, reps: 8, weight: 100, effortRir: 2 }` and
  `actual: { setsPerSession: 2, reps: 8, weight: 95, effortRir: 3 }`, with
  existing fields unchanged (`loadAdherence: 0.95`, `volumeAdherence: 0.67`,
  `effortDrift: 1`).
- planVsActual null degradation: planned/actual sets with no weight (e.g.
  bodyweight plan rows) yield `weight: null` while other fields still
  compute; no effort data anywhere yields `effortRir: null` on both sides.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
