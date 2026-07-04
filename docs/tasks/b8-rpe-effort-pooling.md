# TASK B8: pool RPE with RIR as one effort signal across all analytics

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

CONTEXT:
The analytics engine (Track B, `docs/specs/analytics-engine.md`) currently
reads ONLY `rir` from logged sets. The schema stores both `rir` (Int?) and
`rpe` (Float?) on every set model, and the logging UI lets the user pick
either. A lifter who logs RPE gets the full "no RIR" degradation everywhere
(no stimulating sets, no matched effort, no effort drift). RPE converts to
RIR directly (RIR = 10 - RPE), so RPE-logged sets must feed the same
pipeline. Product decision (Seth, July 2): RIR and RPE are one pooled
effort signal, differing only by which the user chose to type.

FILES TO TOUCH:
- server/src/analytics/effort.js            (NEW - the derivation helper)
- server/src/analytics/enrichSet.js         (accept rpe, carry effortRir)
- server/src/analytics/matchedEffort.js     (bucket on effortRir)
- server/src/analytics/planVsActual.js      (derive effort on both sides)
- server/src/analytics/summary.js           (rirCoverage -> effortCoverage)
- server/src/analytics/index.js             (export deriveEffortRir)
- server/src/controllers/analyticsController.js  (select + pass rpe through)
- server/test/analytics/effort.test.js      (NEW)
- server/test/analytics/enrichSet.test.js   (extend if it exists; else cover
                                             via effort/matchedEffort tests)
- server/test/analytics/matchedEffort.test.js    (extend)
- server/test/analytics/planVsActual.test.js     (extend)
- server/test/analytics/summary.test.js          (rename + coverage cases)
- server/test/analytics.integration.test.js      (rename + one RPE case)
- client/src/pages/AnalyticsPage.jsx        (copy/labels + meta field rename
                                             ONLY - no layout changes)
Do NOT modify anything outside these files.

CHANGE:

1. NEW `server/src/analytics/effort.js` - pure, CommonJS, no imports:
   `deriveEffortRir({ rir, rpe })`:
   - `rir` non-null (not null/undefined) -> return `rir` unchanged. Explicit
     RIR always wins, even when an inconsistent RPE is also present.
   - else `rpe` non-null -> return `Math.max(0, 10 - rpe)`. RPE above 10
     clamps to 0 RIR. Fractional RPE yields fractional RIR (8.5 -> 1.5) -
     do NOT round; `getStimulusMultiplier` already handles fractional input
     (band comparison) and matched-effort buckets by exact value.
   - else -> `null`.
   Doc comment: state the 10 - RPE convention and that this is the ONLY
   place RPE is interpreted - everything downstream sees derived RIR.

2. `enrichSet.js`: accept `rawSet.rpe`. Compute
   `const effortRir = deriveEffortRir({ rir: rawSet.rir, rpe: rawSet.rpe })`
   and pass `effortRir` as the `rir` argument to `computeSetMetrics` (that
   function's internals stay untouched - it already treats its rir input as
   nullable). Extend `input` with `rpe: rawSet.rpe ?? null` and
   `effortRir` (keep the existing raw `rir` field as-is).

3. `matchedEffort.js`: read `set.input.effortRir` instead of
   `set.input.rir`. Update the header comment: buckets match on the exact
   derived effort value, so a set logged at RIR 2 and a set logged at RPE 8
   land in the SAME bucket; RPE 8.5 (-> 1.5) only matches other 1.5s - no
   banding, unchanged policy. Returned field stays named `rir` (it now may
   be fractional; the UI already renders it inline).

4. `planVsActual.js`: import `deriveEffortRir`. Effort pairing uses
   `actualSorted[i].input.effortRir` on the actual side and
   `deriveEffortRir({ rir: planned.rir, rpe: planned.rpe })` on the plan
   side. planLookup rows now carry `rpe` (see 6). Update the doc comment
   (planLookup shape + "effortDrift is actual effort - planned effort,
   RIR-scale").

5. `summary.js`: rename `meta.rirCoverage` -> `meta.effortCoverage`. The
   computation is already correct after (2) (it counts
   `stimulusMultiplier !== null`, which now includes RPE-derived sets) -
   only the name changes. This is a breaking API field rename; the branch
   is unmerged and AnalyticsPage (updated in 8) is the only consumer.

6. `analyticsController.js`: add `rpe: true` to all four set-level selects
   (the two actual-set selects and the two templateSets selects reached via
   `set.templateExercise` and `set.sessionExercise.templateExercise`), map
   `rpe: set.rpe` into the raw sets handed to `enrichSet`, and include
   `rpe` in the planLookup rows alongside `{ order, reps, weight, rir }`.
   No other controller logic changes; isolation surface untouched.

7. `index.js`: export `deriveEffortRir` following the existing barrel style.

8. `AnalyticsPage.jsx` - copy only, no structural changes:
   - `meta.rirCoverage` -> `meta.effortCoverage`; its display line becomes
     "Effort (RIR or RPE) logged on N% of sets".
   - Unlock strings: "log RIR to unlock" -> "log RIR or RPE to unlock";
     "log RIR across 2+ sessions" -> "log RIR or RPE across 2+ sessions";
     "plan + log RIR to unlock" -> "plan + log RIR or RPE to unlock".
   - `HOW_STIMULATING_SETS`, `HOW_MATCHED_EFFORT`, `HOW_EXECUTION`,
     `HOW_EFFECTIVE_SETS`: mention that RPE counts too, converted as
     RIR = 10 - RPE (one short aside each, keep the existing 1-2 sentence
     voice; e.g. "...from the set's RIR (RPE counts too: RIR = 10 - RPE)").

Engine purity is non-negotiable: nothing under `server/src/analytics/`
imports Prisma or touches a DB.

ACCEPTANCE CRITERIA (machine-checkable):
- `deriveEffortRir({ rir: 2, rpe: 8 })` -> 2; `({ rir: 0, rpe: 5 })` -> 0
  (explicit 0 wins); `({ rir: null, rpe: 8 })` -> 2;
  `({ rir: null, rpe: 8.5 })` -> 1.5; `({ rir: null, rpe: 11 })` -> 0;
  `({ rir: null, rpe: null })` -> null.
- A set with rpe 8 and rir null gets a non-null `stimulatingContribution`
  (multiplier 0.95 tier) and counts toward `effortCoverage`.
- Matched-effort pooling test: same exercise, session A set logged
  `{ rir: 2 }`, session B set logged `{ rpe: 8 }` -> trend is non-null with
  `rir: 2, sessions: 2`.
- planVsActual test: actual set `{ rpe: 8 }` paired with planned set
  `{ rir: 2 }` -> `effortDrift: 0`; and actual `{ rpe: 9 }` vs planned
  `{ rir: 2 }` -> `effortDrift: -1` (overreaching).
- Integration test includes at least one RPE-only set flowing to a non-null
  stimulating contribution and `meta.effortCoverage` counting it.
- `rg -i rirCoverage server/ client/` -> no hits.
- `rg -i "prisma" server/src/analytics/` -> no hits.
- `npm run test:unit` green from server/; `npm test` green from server/.
- `npm run build` green from client/.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
