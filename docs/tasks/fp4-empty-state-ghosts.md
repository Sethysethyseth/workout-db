# TASK FP4: empty analytics tease the wedge - static ghost previews

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
FP-wave visual unit - the design detail IS the spec here; follow it
exactly. Evidence base and per-surface table: `docs/tasks/
fp0-frontier-parity-report-FINDINGS.md` section R5. N6's two-variant
empty states stay; this unit replaces their bare text with ghost
previews + the same text, so data-light screens sell the insight layer
instead of showing dead scene space.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx
- client/src/components/analytics/    (small presentational ghost
                                       subcomponents if cleaner)
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:
Ghost previews are STATIC, tokens-only, no new motion, non-interactive,
aria-hidden. Build them from existing idioms (the `balance-scale--ghost`
track is the in-codebase precedent - reuse its muted-wash approach, e.g.
color-mix washes of --color-interactive / border tokens). Each surface
pairs its ghost with ONE unlock line in the honesty-layer voice:

1. Muscles view (new-user AND empty-range variants): 4 faint horizontal
   volume bars of decreasing width + the ghost balance track. Line:
   "Log 3 workouts and this becomes your volume trend."
2. Strength view empty: one faint sparkline silhouette (a simple muted
   polyline, no data labels) + two ghost row skeletons. Line: "Log sets
   with weight and this becomes your strength trend."
3. Exercises roster empty: 3 ghost list rows (muted name-length bars +
   a small stat bar each). Line: keep/tighten the existing "No exercises
   logged yet" copy above the ghosts.
4. Execution view empty: one ghost plan-vs-actual row. Keep the existing
   unlock sentence.
Existing CTAs/links in those empty states stay. Home/dashboard is OUT
of scope for this unit.

ACCEPTANCE CRITERIA (machine-checkable):
- Each of the four surfaces renders its ghost + line in its empty state
  (name the component/branch per surface in DELIVERY.md).
- Ghosts are aria-hidden and add zero interactive elements (grep: no
  onClick/button/Link inside them).
- No new keyframes/transitions in the CSS diff (grep animation|
  transition over the diff - existing rules untouched).
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
