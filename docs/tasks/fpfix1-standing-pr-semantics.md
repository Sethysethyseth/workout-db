# TASK FPFIX1: standing PR semantics - one definition, derived not reimplemented

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Gate finding from the July 20 pre-main review of `frontier-parity-wave`.
FP5 shipped TWO independent implementations of the same PR vocabulary in
`server/src/analytics/prs.js`: `detectPRs` (the event stream - correct per
FP5's contract) and `computeStandingPRs` (the Exercises "Personal records"
card's data - a parallel reimplementation that drifted). The card is a
honesty-layer surface; FP5's own bounce set the bar: "a PR badge that fires
on a non-PR set is a honesty-layer violation."

The defect, reproduced by node-eval against the real module. A normal bench
log - session 1 `45x20` (warmup) + `225x5`, session 2 `45x20` + `235x5` -
returns:

    repsAtWeightPR: { value: 20, weight: 45, reps: 20, performedAt: <session 1> }

so the card renders "Reps - 45 lb x 20", dated to the first session. Three
things are wrong and they share one root cause (a second implementation):

1. `prs.js:198-218` selects by GLOBAL MAX REPS across all weights, ignoring
   weight. FP5's contract defines `repsAtWeightPR` as "more reps than any
   prior set at the same-or-higher weight" - which `detectPRs` implements
   correctly and this does not. Same type name, two meanings.
2. The code comment at `:198-199` states the CORRECT semantic ("hasn't been
   beaten at same-or-higher weight"); the code below it does something else.
3. First-session suppression is silently dropped: `isFirstSession` is
   computed at `:170`, `:182`, `:193` and then stripped by `clean()` at
   `:221-225` without ever gating anything - so a standing record can be
   dated to a first session, which `detectPRs` explicitly suppresses as
   "trivially a record on day one."

Untested by construction: the single `computeStandingPRs` fixture
(`100x10` vs `120x5`) passes under both the buggy and the correct logic and
contains no warmup set.

FILES TO TOUCH:
- server/src/analytics/prs.js          (the fix + the dead-export removal)
- server/src/analytics/index.js        (drop the `getPRsForSet` re-export)
- server/test/analytics/prs.test.js    (discriminating fixtures)
Do NOT modify anything outside these files. In particular: do NOT touch
`exerciseDetail.js`, `summary.js`, or any client file - the card already
handles a null record, and `detectPRs` is CORRECT and must not change.

CHANGE:

A. Make `computeStandingPRs` DERIVE its `repsAtWeightPR` from `detectPRs`
   instead of recomputing it. This is the point of the unit: one definition,
   one code path, so the two surfaces cannot diverge again. Call `detectPRs`
   on the same set stream and fold its `repsAtWeightPR` events down to the
   single standing record.

   Selection among those events (frontier-seat call - state it in a comment
   so a future reader knows it was decided, not stumbled into): pick the
   event at the HEAVIEST weight; tie-break by more reps, then by more recent
   `performedAt`. Rationale: of the rep records the lifter has actually set
   under the real rule, surface the most impressive one, so a light warmup
   can never outrank real work. If no `repsAtWeightPR` event has ever fired,
   the standing record is `null` - the card renders the remaining rows.

B. `weightPR` and `e1rmPR` KEEP their current all-time-best behavior,
   including first-session sets. This is deliberate and correct: a lifter's
   heaviest-ever bench is their heaviest-ever bench even if it happened on
   day one. Do not "fix" them to match A, and do not route them through
   `detectPRs`. Preserve their existing output shape exactly.

C. Remove the now-vestigial `isFirstSession` tracking from
   `computeStandingPRs` (and the `clean()` helper if it becomes unused) -
   with A in place, suppression is inherited from `detectPRs` rather than
   half-tracked here.

D. Delete `getPRsForSet` entirely: the function in `prs.js`, its re-export
   in `analytics/index.js`, and its `describe` block in the test file. It
   has zero production callers - the completed-view chip routes through
   `summary.prs` instead (the reviewer's live-verified FP5 fix). It is an
   untethered third definition of the same vocabulary and is exactly the
   hazard this unit exists to remove.

Match the module's existing idioms: pure functions, no DB/Prisma imports,
the existing `round2` helper, the established enriched-set input shape.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- Warmup fixture (the reported defect, exact): sets = session 1 `45x20` and
  `225x5`, session 2 `45x20` and `235x5`, all one exercise ->
  `computeStandingPRs(...).repsAtWeightPR` is `null`; `weightPR.value` is
  `235`; `e1rmPR` is non-null. Include this as a named test AND as a
  node-eval example in DELIVERY.md with verbatim output.
- Legitimate rep PR fixture: session 1 `100x5`, session 2 `100x8` ->
  `repsAtWeightPR` is `{ weight: 100, reps: 8, ... }` dated to session 2.
- Heaviest-wins fixture: a stream where rep-PR events fire at BOTH a light
  and a heavy weight -> the standing record is the heavy one. This is the
  test that would have caught the shipped bug; it must fail against the old
  implementation. Say so in DELIVERY.md.
- Consistency invariant, as a test: for a mixed multi-session fixture, if
  `computeStandingPRs(sets).repsAtWeightPR` is non-null then some event in
  `detectPRs(sets)` has `type === "repsAtWeightPR"` and the SAME `weight`,
  `reps`, and `performedAt`. This is the anti-drift guard - do not skip it.
- No standing `repsAtWeightPR` is ever dated to the exercise's first
  session, in any fixture.
- Grep: zero hits for `getPRsForSet` anywhere under `server/`.
- Purity grep: no Prisma/DB imports anywhere under `server/src/analytics/`.
- `detectPRs`'s existing behavior is UNCHANGED - its current fixtures must
  pass untouched. If you find yourself editing a `detectPRs` assertion,
  stop: that is out of contract.

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
