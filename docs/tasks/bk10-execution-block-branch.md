# TASK BK10: Execution judges block sessions against their plan snapshot; timed sets stay out of strength math

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
LogChamp is analytics-first; a block you can train but that the Execution
tab ignores is half a feature. Today `computeExecutionFidelity`
(`server/src/analytics/planVsActual.js` ~36-50) understands only template
plans: the harvest in `server/src/ai/analyticsAccess.js` (~146-155) builds
`planLookup` from `TemplateSet`s via `templateExerciseId`, and the UI says
so (`client/src/pages/AnalyticsPage.jsx` ~59: "Only sets logged from a
template count - block plans aren't linked yet."). The header comment at
`planVsActual.js` ~1-5 is also stale (it claims no schema path exists).
Design of record: `docs/specs/blocks-v2.md` sections 7.3 and 7.5. Needs BK7
(LANDED: block sessions carry `SessionExercise.plan`; timed sets store
`WorkoutSet.durationSec` with reps null).

FILES TO TOUCH:
- `server/src/analytics/planVsActual.js`
- `server/src/ai/analyticsAccess.js`         (select + harvest the plan
                                              snapshot)
- `server/src/analytics/*`                   (ONLY where a test below proves
                                              a timed set breaks a metric;
                                              name each file in DELIVERY.md)
- `client/src/pages/AnalyticsPage.jsx`       (the one copy line)
- `server/test/analytics/planVsActualBlock.test.js` (NEW)
- `server/test/analytics/timedSetsSafety.test.js`   (NEW)
Do NOT modify anything outside these files.

CHANGE:
1. **Block branch.** A logged set whose session exercise carries a `plan`
   is judged against `plan.sets`, paired by order within that session
   exercise exactly as the template branch pairs with `TemplateSet`s. Reuse
   the template branch's rules for single reps, weight and effort targets
   and for missing / extra sets - do not invent new ones. Extensions (spec
   7.5): a range is hit when logged reps are within `[reps, repsMax]`; a
   `durationSec` target is hit when logged `durationSec >= planned`; with
   `effortCap`, RPE at or under the cap (RIR at or over it) is hit. Template
   sessions produce IDENTICAL output to today.
2. **Harvest.** `analyticsAccess.js` selects `SessionExercise.plan` and feeds
   it to the engine; the engine stays pure (no Prisma import in
   `server/src/analytics/`).
3. **Timed-set safety.** Sets with `durationSec` and null reps contribute
   nothing to volume, e1RM, strength scores, PRs or stimulating-set counts,
   and never throw. Prove it with tests first; change engine code only
   where a test fails.
4. Fix the stale header comment in `planVsActual.js` (the FK exists but is
   deliberately unused - block sessions use the snapshot; point at
   `docs/specs/blocks-v2.md` section 1). Change the AnalyticsPage line to:
   "Sets logged from a template or a block count toward execution."

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line; the
  count rises by the new tests only - no existing assertion edited or
  removed: `git diff server/test` shows only added files).
- `planVsActualBlock.test.js` pins: a block session whose sets exactly meet
  plan -> the same fidelity result the template branch gives an exact
  template match; reps 9 against `8-10` -> hit, 11 -> miss; `durationSec`
  44 against 45 -> miss, 45 and 50 -> hit; RPE 7 against cap 7 -> hit, 8
  -> miss; RIR 2 against cap 2 -> hit, 1 -> miss; a template-only fixture's
  output deep-equals the pre-change output (snapshot the old result in the
  test from a fixture run BEFORE editing the engine, and say so in
  DELIVERY.md).
- `timedSetsSafety.test.js` pins, for each exported metric function that
  consumes sets (list them in DELIVERY.md): adding a timed set (reps null,
  `durationSec` 45, weight null or 20) to a fixture leaves the result
  unchanged and does not throw.
- `grep -rn "require(\"@prisma\|require('@prisma" server/src/analytics`
  prints nothing.
- `node -e "require('./src/app.js')"` from `server/` exits 0.
- `npm run build` from `client/` compiles (paste the tail).

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
