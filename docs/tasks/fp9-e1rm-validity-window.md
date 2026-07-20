# TASK FP9: e1RM validity window + estimate-vs-performed display semantics

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Smoke finding (Seth, July 20 staging drive). A single set of `160 lbs x 20`
produced an all-time-best estimated 1RM of 266.7 and cascaded into five
surfaces: the Personal records e1RM row, the Home weekly PR line, the Home
"Top gain - estimated 1RM" tile, the e1RM history sparkline, and - worst -
the "Working weight targets" card, which inverts that estimate to prescribe
working loads (it told a lifter whose real best five was 220 to work at
227.5 x 5).

Two INDEPENDENT defects fire together here. Keep them separate in your head
and in the delivery report:

(A) **No rep-validity window on Epley.** `estimateOneRepMax`
(`server/src/analytics/setMetrics.js:7-16`) computes `weight * (1 + reps/30)`
for any rep count; only Brzycki is guarded, at its `reps >= 37` singularity.
Epley is credible in roughly the 1-12 rep range and extrapolates badly above
it. No downstream consumer filters by reps - `validSets`
(`aggregate.js:176`), matched-effort bucketing (`matchedEffort.js:23-25`),
PR eligibility (`prs.js:56-58`, `:161-162`) and `bestE1rm`
(`exerciseDetail.js:195-197`) all accept any non-null epley.

Note the codebase ALREADY holds this knowledge and applied it to the wrong
side: `REP_TARGET_LADDER` (`exerciseDetail.js:4-8`) deliberately rejects 20
from the OUTPUT ladder because Epley error is large there. The same
principle was never applied to the INPUT.

(B) **The Personal records card renders an estimate as a performed set.**
`formatPRValue` (`client/src/components/analytics/ExercisesView.jsx:246-254`)
routes `e1rmPR` through the SAME `${weight} x ${reps}` branch as `weightPR`,
but for an `e1rmPR` the `value` is the ESTIMATE and `reps` is the source
set's reps - so it renders "266.7 lbs x 20", a set the user never performed.
Home's weekly PR line already handles this correctly
(`WeeklyReport.jsx:114-115` prints the estimate with no reps), so this is one
formatter being wrong, not a systemic pattern.

Units are RULED OUT as a cause: stored weights are unit-agnostic and never
converted (`client/src/lib/weightUnitPref.js:3-7`); display helpers only
append a label. Do not go looking for a lbs/kg bug.

FILES TO TOUCH:
- server/src/analytics/setMetrics.js       (the validity window)
- server/src/analytics/exerciseDetail.js   (insufficient-data handling only
                                            if the window makes bestE1rm null)
- client/src/components/analytics/ExercisesView.jsx
                                           (formatPRValue ONLY - do not
                                            restyle any card; FP11 owns the
                                            visual redesign of this file)
- server/test/analytics/                   (fixtures + new tests)
Do NOT modify anything outside these files. In particular do NOT touch
client/src/index.css - a parallel unit (FP10) owns it this wave.

CHANGE:

**Part A - the validity window, applied at the single producer.**

Add an upper rep bound to `estimateOneRepMax` so that above it, `epley`
returns `null` - the same shape the function already returns for invalid
input, and the same shape every consumer already handles. Follow the
existing `BRZYCKI_SINGULARITY_REPS` constant pattern by NAME: a named
module-level constant with a comment explaining the reasoning, not a magic
number at the call site.

**The window is 1-12 reps inclusive; above 12 reps, `epley` is `null`.**
That bound is the contract - do not choose a different one. Rationale you
should encode in the constant's comment: Epley is only credible to roughly
12 reps, the rep-target ladder already refuses to EMIT above 15 for the same
reason, and 12 keeps every existing in-range fixture honest.

Apply it at the producer, NOT at each consumer. This is deliberate and
load-bearing: there are ~10 consumers of `metrics.e1rm.epley` and all of
them already null-check. One guard at the source means they all inherit it
by construction and cannot drift apart. Adding per-consumer rep filters
would recreate exactly the two-implementations bug that FPFIX1 just fixed in
`prs.js` - do not do it.

Leave `brzycki` behaviour EXACTLY as it is (guarded only at 37). It is
computed, returned, and consumed by nothing; changing it is out of scope.

**Part B - insufficient data, not a wrong number.**

An exercise trained ONLY at high reps now has no valid e1RM. That is
correct. What must not happen is a broken or misleading surface: `bestE1rm`
null must flow to the existing unlock/insufficient-data states rather than
rendering `null`, `NaN`, `0`, or an empty row. `computeRepTargets` already
handles a null best (`exerciseDetail.js:95-107`) and `RepTargetsCard`
already renders unlock copy when `repTargets === null`
(`ExercisesView.jsx:305-313`) - verify that path end-to-end and fix only
what is genuinely broken. Do not invent new empty-state copy if an existing
`analytics-unlock` string already covers it.

**Part C - the display fix.**

Give `e1rmPR` its own branch in `formatPRValue`. An estimated 1RM must read
as an estimate carrying its provenance, never as a performed set. The
required contract:

- the estimate value is shown, labelled or formatted so it cannot be
  mistaken for a lifted load
- the source set that produced it (its weight and reps) is shown as
  subordinate provenance
- the string "266.7 lbs x 20" - estimate paired with source reps by a bare
  multiplication sign - must not be producible for an `e1rmPR`

Exact wording and markup are yours; `formatEstimate`
(`client/src/lib/weightDisplay.js:25-34`) is the existing helper for
estimate formatting and Home's PR line is the in-repo precedent for
estimate-without-reps. `weightPR` and `repsAtWeightPR` formatting must be
unchanged.

**Part D - the tests that pin the bug.**

`server/test/analytics/setMetrics.test.js:28-32` currently ASSERTS that
epley stays a number at 37 reps. That test encodes the defect and must be
updated to assert the new window. This is an expected, intended fixture
change - state it plainly in the delivery report rather than working around
it.

`server/test/analytics/prs.test.js:330-354` uses a `45 x 20` warmup fixture
(from FPFIX1). Under the window its epley becomes null; the assertion that a
standing `e1rmPR` exists should still hold via the working sets. Verify -
do not assume.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with the full count reported.
- `estimateOneRepMax(160, 20)` returns `epley: null`. `estimateOneRepMax(160, 12)`
  returns `epley: 224` (160 * 1.4). `estimateOneRepMax(160, 13)` returns
  `epley: null`. `estimateOneRepMax(100, 5)` is unchanged at `epley: 116.666...`.
- `brzycki` for `(100, 37)` is still `null` and for `(100, 5)` still
  `100 * 36 / 32`; no brzycki behaviour changed anywhere.
- New test proving the reported scenario: an exercise whose sets are
  `220x5`, `210x5` and `160x20` has a `bestE1rm` derived from the 220x5 set
  (256.67), NOT 266.7, and its `repTargets` 5-rep row is therefore <= 220,
  not 227.5.
- New test proving the insufficient-data path: an exercise logged ONLY with
  sets above 12 reps yields `bestE1rm === null` and `repTargets === null`
  (no throw, no NaN).
- `formatPRValue` for an `e1rmPR` of `{ value: 266.7, weight: 160, reps: 20 }`
  produces a string that contains the estimate and the source set 160 x 20,
  and does NOT contain "266.7 lbs x 20" or any bare `<estimate> x <reps>`
  pairing. Quote the exact output string in the delivery report.
- `formatPRValue` output for `weightPR` and `repsAtWeightPR` is byte-identical
  to current behaviour - show before/after for one example of each.
- Client `npm run build` from `client/` compiles with no errors.
- Report the count of every test file you had to update and why, with the
  two expected fixture changes above called out explicitly.

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
