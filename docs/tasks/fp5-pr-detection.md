# TASK FP5: PR detection - engine module + quiet surfacing

STATUS: BOUNCED (bounce 1, July 19 - see BOUNCE 1 FINDINGS at the bottom)
MODEL: opus
MODE: 1-relay

CONTEXT:
FP-wave's biggest unit, the review's top frontier gap. Evidence base:
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` section R7 - the
engine already computes topSet/e1rmSeries, `buildSummary` ships a
`prs: []` stub, and ExercisesView has a "PR detection coming"
placeholder slot. Engine rules: pure, composable, fixture-tested, NO
DB/Prisma imports (match the existing `server/src/analytics/` modules).
Motion restraint is a product boundary: NO confetti, no celebration
animation - a PR is a quiet chip.

FILES TO TOUCH:
- server/src/analytics/prs.js            (NEW - the detector)
- server/src/analytics/index.js          (re-export)
- server/src/analytics/summary.js        (fill the prs stub)
- server/src/analytics/exerciseDetail.js (all-time PR list)
- server/test/analytics/                 (fixtures for all of it)
- server/src/controllers/analyticsController.js (only if wiring needs it)
- client/src/components/analytics/ExercisesView.jsx (PR section)
- client/src/pages/SessionDetailPage.jsx (completed-view set chip)
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:
Detector semantics (the contract - fixture-test each rule):
- Input: an exercise's enriched sets in chronological order (reuse the
  existing enriched shape; weight-bearing sets with weight > 0 and
  reps >= 1).
- Three PR types, evaluated per set against ALL PRIOR history of that
  exercise: weightPR (heaviest weight ever), repsAtWeightPR (more reps
  than any prior set at the same-or-higher weight), e1rmPR (best Epley
  e1RM, reuse the engine's existing e1RM helper).
- Suppression rule: sets in an exercise's FIRST session never count
  (everything is trivially a record on day one - frontier-standard).
- A set may hold multiple types; report one record per type with
  { type, value, reps/weight as relevant, performedAt, sessionId }.
- Per-side data: detect on the merged stream, ignore side for v1.
Wiring:
- `buildSummary.prs`: PRs whose set falls in the summary range (replaces
  the `[]` stub - shape above plus exercise identity/name).
- `exerciseDetail` gains current standing records (best per type, with
  dates) - the all-time PR card's data.
UI:
- ExercisesView detail: replace the placeholder slot with a "Personal
  records" card listing the standing records (type label, value, date),
  matching the FINDINGS R7 ASCII sketch and existing card idioms.
- SessionDetailPage completed view: a small muted "PR" chip on set rows
  whose set holds any record AT THE TIME OF THAT SESSION (use the
  summary/detail payloads - do NOT re-derive in the client; if the
  completed-session payload lacks the data, extend the analytics
  response you already touch rather than adding a new endpoint, and say
  so in DELIVERY.md).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green with new fixtures covering: first-session
  suppression, each PR type firing, repsAtWeight same-vs-higher weight
  edge, multi-type single set, chronological ordering independence
  (input order != performedAt order).
- Node-eval example in DELIVERY.md: a 3-session fixture stream ->
  exact PR list (types, values, dates).
- Purity grep: no Prisma/DB imports anywhere under server/src/analytics/.
- client `npm run build` green; `node scripts/check-hex.mjs` clean.
- Grep: the "PR detection coming" placeholder string is gone; the Data
  quality bullet about PR detection (if its condition now passes) reads
  correctly - check and report its state.

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

---

## BOUNCE 1 FINDINGS (July 19, reviewer audit of the first delivery)

The first delivery is KEPT IN THE LANE - do not start over. The engine
half passed audit and stays: `prs.js` (24 fixtures), the `index.js`
re-export, `summary.js`'s filled stub, `exerciseDetail.js`'s
`personalRecords`, the `analyticsController.js` all-time fetch, and the
`ExercisesView` Personal records card are all ACCEPTED as delivered.
Fix ONLY the two findings below, both confined to
`client/src/pages/SessionDetailPage.jsx`.

**F1 (BLOCKER, undeclared): the PR chip crashes every completed
session.** `setHasPR` is declared with `const` at :2036 inside the
`SessionDetailPage` component, but it is CALLED at :1709 and :1738
inside `SessionExerciseBlock` - a separate top-level function declared
at :1304 that never receives it. Neither call site (:2914, :2979)
passes such a prop, so the identifier is not in scope and rendering
throws `ReferenceError: setHasPR is not defined`. The
`isCompleted && setHasPR(...)` short-circuit means LIVE sessions
survive and only COMPLETED ones break - which is the exact surface this
block targets. Neither lane catches it: the Vite build does not resolve
undefined identifiers and there are no client render tests. Thread the
helper through as a prop (or lift it), and before you report, PROVE the
completed view renders - drive it in a browser or add a render test;
"build green" is not evidence for this finding.

**F2 (correctness, declared as deviation 1 but not acceptable as
built): the chip false-positives across exercises.** `setHasPR` keys
the match on `` `${weight}:${reps}` `` alone, so within one session
every set sharing a weight/reps pair with any PR gets chipped - bench
135x5 (a real PR) and curl 135x5 (not) both light up. The summary PRs
already carry `identity` (`{ exerciseId }` or `{ userExerciseId }`) and
`exerciseName`, so match on exercise identity AND weight/reps. Resolve
the row's exercise via the identity the session row already has; where
a session exercise carries no id, fall back to name and SAY SO in
DELIVERY.md. A PR badge that fires on a non-PR set is a honesty-layer
violation - this is the bar the chip has to clear.

Not in scope for this bounce, recorded so it is not "fixed" silently:
the extra `GET /analytics/summary` call the completed view now makes is
ACCEPTED (the block explicitly permitted extending the response you
already touch rather than adding an endpoint), and `getSummary` now
fetching all-time sets on every request is inherent to the contract
(PRs need history beyond the range), not a defect.
