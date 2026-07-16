# TASK MW8: shared reps formatter - stop rounding half-reps on analytics surfaces

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
MW5's decimals audit (`mw5-decimal-values-audit-FINDINGS.md`) proved
reps 8.5 flows correctly through input, validation, storage, and the
analytics engine, but FIVE analytics display surfaces `Math.round` the
reps in their top-set strings, so a logged 8.5 renders as 9. This unit
is the surfaced fix: one shared formatter, five call-site swaps. Follow
the semantics of the existing `formatEffortValue`
(`client/src/lib/effortDisplay.js`) / `formatDecimalCount`
(executionVerdict) idiom: an integer stays bare ("8"), a fractional
value keeps its meaningful decimal ("8.5") - never `toFixed` an integer
into "8.0".

FILES TO TOUCH:
- client/src/lib/repsDisplay.js                       (NEW - the shared
                                                       formatter, mirror
                                                       effortDisplay.js's
                                                       module style)
- client/src/pages/AnalyticsPage.jsx                  (:73)
- client/src/components/analytics/WeeklyReport.jsx    (:228)
- client/src/components/analytics/StatTiles.jsx       (:126)
- client/src/components/analytics/ExercisesView.jsx   (:352)
- client/src/components/analytics/StrengthTrendChart.jsx (:22)
Do NOT modify anything outside these files.

CHANGE:
Add a small pure formatter (e.g. `formatRepsValue`) to the new
`client/src/lib/repsDisplay.js` and replace `Math.round(<...>.reps)` at
exactly the five listed sites with it. Each site's surrounding null/
presence gating is LOAD-BEARING and must not change: N2's landed
deviation omits the "× reps" fragment entirely when reps is null
(see StrengthTrendChart.jsx:22's `!= null` guard and the ternaries at
the other four sites) - the formatter formats a present value; it does
not take over the decision of whether to render one. No other rounding,
weight formatting (`formatWeight` stays as-is), or copy changes.

ACCEPTANCE CRITERIA (machine-checkable):
- Node eval of the formatter: 8.5 -> "8.5"; 8 -> "8"; 12 -> "12";
  10.25 -> "10.3" (one decimal, matching formatEffortValue's fractional
  handling) or "10.25" if the module instead preserves stored precision -
  state which in the report; the non-negotiables are 8.5 -> "8.5" and
  8 -> "8" with no trailing ".0".
- `grep -n "Math.round" ` on the five touched display files returns zero
  reps-related matches (any unrelated Math.round on other quantities, if
  present, is out of scope and untouched).
- All five sites import from the ONE shared module - grep shows a single
  definition, five imports, no per-file copies.
- Null-reps behavior unchanged at every site: a top set with null reps
  still renders weight-only (no "× ", no "× null").
- `npm run test:unit` from server/ green (tripwire - no server files in
  scope).
- Client `npm run build` compiles with no errors.

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
