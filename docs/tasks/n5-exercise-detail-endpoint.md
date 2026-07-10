# TASK N5: Exercise index + detail endpoint (server) with rep-target engine

STATUS: QUEUED (FABLE-DIRECT - not for Cursor dispatch)
MODEL: fable
MODE: 1-relay

> N-WAVE NOTE: unit N5 of `docs/specs/analytics-ui-rebalance.md`.
> FABLE-DIRECT: cross-user isolation surface (standing Fable-escalation
> trigger) - implemented by Fable in Claude Code. Block kept for the
> contract record + audit criteria. The client detail VIEW is N3, not
> here. File-disjoint from N1/N2 by design (parallel-safe).

CONTEXT:
The only server unit of the wave: an all-time exercise index (the stable
roster for N3's lookup) and a whole-exercise detail payload whose hero is
the rep-target calculator (e1RM reframed from scoreboard to engine).

FILES TO TOUCH:
- server/src/analytics/exerciseDetail.js   (NEW pure module - no DB, no Prisma)
- server/src/analytics/index.js            (barrel export)
- server/src/controllers/analyticsController.js (two handlers)
- server/src/routes/analyticsRoutes.js     (route registration)
- server/test/analytics/exerciseDetail.test.js (NEW fixture tests)
Do NOT modify anything outside these files.

CHANGE:

1. **Pure module `exerciseDetail.js`** (fixture-tested, engine purity rule
   holds: no DB, no Prisma imports). Reuse `resolve.js`, `enrichSet.js`,
   `setMetrics.js`, `matchedEffort.js` - no formula duplication.
   - `buildExerciseIndex(enrichedSets)` -> all-time roster: one row per
     resolved identity (catalog `exerciseId` OR `userExerciseId` tier -
     mirrors the summary engine's identity tiers so legacy name-matched
     rows aggregate with id-stamped rows), NOT e1RM-gated (bodyweight/
     isometric movements included):
     `[{ identity: { exerciseId|userExerciseId }, name, lastPerformed,
     sessionCount }]`, name-sorted.
   - `buildExerciseDetail(enrichedSets, { from, to })` -> for ONE resolved
     identity's sets:
     `{ identity, totals: { sessions, sets, effectiveSets,
     stimulatingSets|null }, topSet, topSets (<=5, weight-desc),
     bestE1rm|null, e1rmHistory: [{ date, e1rm }], matchedEffortTrend,
     weeklyVolume: [{ weekStart, effectiveSets, stimulatingSets|null }],
     repTargets, loggedRepRange: { min, max }|null }`.
   - **Rep targets:** from best e1RM, invert Epley
     `weight = e1rm / (1 + reps/30)` over the fixed ladder
     `REP_TARGET_LADDER = [1, 3, 5, 8, 10, 12, 15]` (SETTLED July 10:
     15 in for hypertrophy-range lifters; 20 REJECTED - that far above
     the trained range Epley's error exceeds a plate increment, so the
     number is noise even flagged). Each entry
     `{ reps, weight (raw, unrounded - plate rounding is client-side per
     the display-unit pref), extrapolated: reps < min || reps > max of
     loggedRepRange }`. `repTargets` is null when no computable e1RM.
2. **Controller + routes**, following `getSummary`'s exact shape
   (auth guard, DATE_ONLY_RE validation, error paths):
   - `GET /api/analytics/exercises` -> the all-time index. Session fetch
     is the SAME `workoutSession.findMany({ where: { userId, ... } })`
     pattern - **sets reached ONLY through sessions scoped by
     `{ userId }`; the where-clause is THE isolation point** (all-time =
     no performedAt bounds, userId scoping mandatory).
   - `GET /api/analytics/exercise?exerciseId=...|userExerciseId=...&from=...&to=...`
     -> detail. Exactly one identity param required (400 otherwise);
     range optional (defaults all-time); sets fetched through the same
     userId-scoped session query, then filtered to the requested identity
     IN THE ENGINE (controller fetches, engine computes - no new Prisma
     imports into `server/src/analytics/`).
3. Totals/weekly buckets reuse the existing metric definitions
   (`effectiveContribution` sums, stimulating null-when-no-effort-data) -
   consistency with the summary engine is a correctness requirement, not
   a style preference.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; fixtures cover: RPE-logged
  sets, no-effort sets, legacy name-matched rows aggregating with
  id-stamped rows of the same exercise, bodyweight/no-e1RM rows (index
  row present, `repTargets` null), rep-target extrapolation flags
  (ladder entries outside `loggedRepRange` flagged), ladder = exactly
  1/3/5/8/10/12/15.
- Isolation: an integration-style assertion or explicit reviewed
  assertion that neither query can return another user's sets (userId in
  every where-clause; grep + reviewer sign-off).
- Purity grep: no `prisma`/`require(".../lib/` imports inside
  `server/src/analytics/exerciseDetail.js`.
- Epley inversion example: bestE1rm 300 -> reps 5 target = 300 / (1 + 5/30)
  = 257.14... (raw, unrounded in the payload).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
