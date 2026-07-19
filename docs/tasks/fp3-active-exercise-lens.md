# TASK FP3: active-exercise lens - stop burying signal under dormant exercises

STATUS: BOUNCED-1 (July 19 - see BOUNCE FINDINGS at the bottom; the
existing delivery in the lane worktree is GOOD, extend it, do not redo it)
MODEL: auto
MODE: 1-relay

CONTEXT:
FP-wave, from Seth's July 18 screenshot: the Strength trends list shows
~20 exercises where most are single-session rows (one dot, no trend) that
bury the handful of real trends; the Exercises roster is all-time and
mixes long-dormant machines with the current program. The call: default
every lens to ACTIVE/NOTEWORTHY, keep everything reachable (the
never-gate-history guarantee means we filter the VIEW, never the data).

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx
- client/src/components/analytics/ExercisesView.jsx
- client/src/index.css     (only if needed)
Do NOT modify anything outside these files.

CHANGE:
1. Strength trends list (AnalyticsPage strength view): partition rows.
   Exercises with >= 2 sessions in range (a computable trend) render as
   today but sorted by absolute matched-effort delta DESCENDING
   (noteworthy first; ties/no-delta rows after, keep their current
   relative order). Exercises with exactly 1 session in range collapse
   into ONE muted row at the bottom: "N exercises with a single session
   in this range" with a "Show" affordance that expands them inline
   (collapsed by default, plain disclosure, no new motion). If ALL rows
   are single-session, render the list as today (nothing to bury).
2. Exercises roster (ExercisesView): add a small segmented control
   `Active | All` above the roster, default Active. Active = exercises
   whose most recent logged session is within the trailing
   ACTIVE_WINDOW_WEEKS = 8 (one named constant; the index rows already
   carry recency data - use what the payload has, name what field you
   used in DELIVERY.md). All = current behavior. Empty Active state:
   honest one-liner + a "Show all" action. Follow the existing
   segmented-control idiom (the Chart|Table toggle or tabs pattern) -
   match, don't invent. The lens must NOT affect the detail view or
   deep links (?exercise=... still resolves regardless of lens).

ACCEPTANCE CRITERIA (machine-checkable):
- Grep: exactly one definition of ACTIVE_WINDOW_WEEKS.
- Strength list with mixed data: single-session rows absent from the
  main list, present after expanding; count line matches their number.
- Roster in Active hides exercises older than the window; All shows
  the full roster; a deep link to a dormant exercise still opens it.
- client `npm run build` green; `npm run test:unit` green (tripwire);
  `node scripts/check-hex.mjs` clean.

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

BOUNCE FINDINGS (July 19 review - first bounce):
Your previous delivery sits UNCOMMITTED in this worktree. It is good
work - keep all of it. One contract miss: you applied the CHANGE-1
partition ONLY to the table view, but the DEFAULT view of "Strength
trends" is the CHART view (`useState("chart")` in PerExerciseSection),
and the block's evidence base ("single-session rows - one dot, no
trend" in Seth's screenshot) IS the chart view: StrengthTrendChart.jsx
renders a per-exercise sparkline row list where a single-session row
gets `delta = 0` and therefore sorts ABOVE negative trends. Fix:
1. Apply the SAME partition to the chart view: noteworthy rows
   (>= 2 sessions) render as sparkline rows sorted by absolute
   matched-effort delta DESCENDING (same comparator as the table -
   reuse partitionStrengthTableRows, lift it if needed; do not
   duplicate the logic); single-session rows collapse into the same
   muted "N exercises with a single session in this range" line with
   the same Show/Hide affordance, rendered below the chart rows.
   All-single lists render as today, same as the table rule.
2. Keep table and chart behavior consistent: one shared partition +
   one shared showSingles state in PerExerciseSection is fine.
3. Note for your report: StrengthTrendChart's own internal
   raw-topSet-delta sort currently disagrees with the block's
   matched-effort-delta ordering for noteworthy rows - the block's
   ordering wins for the main rows; state in DELIVERY.md how you
   resolved the two sorts.
Update DELIVERY.md (append a "Bounce 1 fix" section), re-run the lanes,
same stop conditions.
