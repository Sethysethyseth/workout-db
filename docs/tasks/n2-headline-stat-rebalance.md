# TASK N2: Headline stat rebalance (true topSet + adaptive volume headline)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

> N-WAVE NOTE: unit N2 of `docs/specs/analytics-ui-rebalance.md`. Distinct
> from the June nav-wave file `n2-profile-hub.md` - unrelated, do not open.
> DEPENDS ON N1 (consumes its formatters) - do not start before N1 lands.

CONTEXT:
"Best lift" on both the analytics StatTiles and the Home WeeklyReport is
e1RM-derived, making the estimate read as the headline. This unit gives the
engine a true `topSet` (heaviest weight actually lifted - NOT the
highest-e1RM `bestSet`, which is a different set) and rebalances both stat
surfaces: real numbers first, estimates demoted to the labeled top-gain
fallback only.

FILES TO TOUCH:
- server/src/analytics/aggregate.js   (compute topSet in aggregateExerciseMetrics)
- server/src/analytics/summary.js     (serialize topSet next to bestSet)
- server/test/analytics/              (topSet fixture tests)
- client/src/components/analytics/StatTiles.jsx   (tile rework)
- client/src/components/analytics/WeeklyReport.jsx (tile rework)
Do NOT modify anything outside these files.

CHANGE:

1. **Engine first.** In `aggregateExerciseMetrics`, compute
   `topSet = { weight, reps, performedAt }` = the set with max
   `input.weight` over ALL sorted in-range sets of the exercise (tie-break:
   higher `input.reps`), independent of the `validSets` e1RM filter - it
   must exist even when e1RM is null for every set. Sets with
   `input.weight == null` are skipped; `topSet` is null only when no set
   carries a weight. Serialize in `summary.js` beside `bestSet`
   (`performedAt` to ISO, same pattern).

   Also compute `topSetSeries` = one entry per SESSION:
   `[{ performedAt, weight, reps }]`, the session's heaviest set (same
   tie-break), chronological - mirror the existing `e1rmSeries`
   session-bucketing pattern but keyed on weight and NOT filtered by
   `validSets` (weight-carrying sets only). Serialize like `e1rmSeries`
   (ISO dates). This feeds N4's sparklines (top-set weight per session);
   without it N4 cannot be client-only - that is why it lands here.

2. **StatTiles.jsx** - new order:
   `[adaptive volume headline] [other volume metric, support] [Top set] [Top gain]`.
   - Adaptive volume (spec "Design decisions"): named constant
     `EFFORT_COVERAGE_HEADLINE_THRESHOLD = 0.6` at module top (settled
     value). When `summary.meta.effortCoverage >= 0.6` AND the stimulating
     total is computable, "Stimulating / week" is the headline tile and
     "Sets / week" (effective) the support tile; otherwise "Sets / week"
     leads and the stimulating tile shows the existing locked state
     ("log RIR or RPE to unlock"). Keep existing tile markup/classes -
     this is an order/priority change, not a redesign.
   - **Top set** tile replaces **Best lift**: value
     `{formatWeight(weight)} × {reps}` from the winning exercise's new
     `topSet` (winner = highest `topSet.weight` across `perExercise`;
     tie-break higher reps); sub = exercise name. No e1RM anywhere on this
     tile.
   - **Top gain** stays `pickTopGain`-driven; the e1RM-fallback sub is
     relabeled to say "estimated" explicitly (e.g. `` `${name} · estimated
     1RM` ``) - the matched-effort sub keeps its `formatEffort` treatment
     from N1.
   - Insufficient-data states preserved exactly ("—" / "not enough data" /
     unlock copy).

3. **WeeklyReport.jsx** - stat order: Workouts → Sets → **Top set** → Top
   gain. Top set from the same `topSet` selection (delete the local
   `findBestLift`); workouts/sets comparison mechanics unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, including new fixture cases:
  (a) `topSet` is the heaviest-weight set when the highest-e1RM set is a
  different set (topSet != bestSet); (b) `topSet` exists for an exercise
  whose sets all lack a computable e1RM; (c) tie-break picks higher reps;
  (d) `topSetSeries` has one chronological entry per session with the
  session's heaviest weight, present even when e1RM is null throughout.
- Grep: no `e1rm` property access remains in `StatTiles.jsx` or
  `WeeklyReport.jsx` (the top-gain fallback lives inside `pickTopGain`,
  not the components).
- Grep: `EFFORT_COVERAGE_HEADLINE_THRESHOLD` defined exactly once.
- Client `npm run build` green.
- No new colors/classes beyond existing tile patterns (tokens-only rule).

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
