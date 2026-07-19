# TASK FP2: This-week strip coherence + vertical recent workouts

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
FP-wave Home unit. Evidence base: `docs/tasks/
fp0-frontier-parity-report-FINDINGS.md` sections R3 and R4 - the R3
diagnosis is verified: the Workouts tile counts client sessions by
`completedAt` in LOCAL bounds (WeeklyReport.jsx:31-44) while Sets/Top
set/Top gain ride `/analytics/summary` filtered by `performedAt` in
UTC bounds. One strip, two clocks, two sources. The call: ONE window
and ONE data source - the summary's.

FILES TO TOUCH:
- server/src/analytics/summary.js        (workoutCount field)
- server/test/analytics/                 (fixture coverage for it)
- server/src/analytics/index.js          (only if a re-export is needed)
- client/src/components/analytics/WeeklyReport.jsx
- client/src/pages/DashboardPage.jsx
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:
1. `buildSummary` gains `workoutCount`: the number of DISTINCT sessions
   that contributed enriched sets in the range (same sets it already
   aggregates - no new query, no controller change expected). Fixture
   tests: multi-session count, zero-set sessions NOT counted, empty
   range -> 0.
2. WeeklyReport's Workouts tile (both windows, delta included) reads
   `summary.workoutCount` from the summaries it ALREADY fetches. Delete
   the `countWorkoutsInWindow`/`windowBounds` client path and the
   `useActiveSession().sessions` dependency if nothing else uses it.
   A session with zero countable sets now shows 0 workouts - that is
   the intended coherence, not a bug.
3. R4: replace the horizontal snap-scroll recent-workouts strip on the
   dashboard with a VERTICAL stack of the 3 most recent completed
   workouts (`.slice(0, 3)`), full-width rows, titles wrap (remove the
   line-clamp), date/time line kept, "View all" link kept. Reuse the
   existing row idioms named in the FINDINGS R4 section (`card
   sub-card-list`/`sub-card` per SessionsPage, or de-scrolled notched
   cards) - match, don't invent. Remove the now-dead horizontal-scroll
   CSS for `.workout-tab-recent__*`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from server/ incl. the new workoutCount
  fixtures (node-eval example: two sessions with sets + one empty
  session in range -> workoutCount 2).
- Grep: `countWorkoutsInWindow` has zero definitions/references left.
- Grep: no `overflow-x` / `scroll-snap` rules remain on the
  recent-workouts classes; no `-webkit-line-clamp` on its title.
- client `npm run build` green; `node scripts/check-hex.mjs` clean.

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
