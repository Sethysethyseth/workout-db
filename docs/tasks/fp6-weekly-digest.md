# TASK FP6: weekly insight digest - extend the Home report band

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
FP-wave. Evidence base: `docs/tasks/fp0-frontier-parity-report-
FINDINGS.md` section R8. Depends on FP2 (coherent strip - workoutCount)
and FP5 (summary.prs filled) - dispatch strictly after both LAND. The
existing WeeklyReport band keeps its four stats; this unit adds the
digest layer beneath them. In-app only, no email, no new endpoint - the
band already fetches current + prior summaries, which carry everything
needed (perMuscle, execution, prs).

FILES TO TOUCH:
- client/src/components/analytics/WeeklyReport.jsx
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:
Under the stats grid, a compact digest section (muted, prose-first,
matching the band's existing type scale):
1. Muscle movers: up to 3 muscles with the largest absolute
   effective-set change vs prior week, e.g. "Chest +6 sets - Back -4 -
   Quads +3". Fewer than 3 nonzero movers -> show what exists; none ->
   omit the line.
2. PR line (from the current summary's prs): "2 PRs this week - Bench
   225 x 5, Row e1RM 210". None -> omit.
3. Execution line (from summary.execution / planned-vs-actual): one
   sentence in the existing execution-verdict voice.
4. ONE nudge line, deterministic priority (first match wins, else no
   nudge): (a) effort coverage < 60% this week -> nudge logging RIR/RPE;
   (b) total effective sets down > 20% vs prior -> consistency nudge;
   (c) a muscle with 0 sets this week but >= 3 prior week -> "X went
   quiet this week". Honesty-layer voice, no exclamation marks.
Empty week keeps the existing empty behavior (band hidden / nudge-only
state unchanged).

ACCEPTANCE CRITERIA (machine-checkable):
- Node-eval examples in DELIVERY.md for the movers computation and each
  nudge rule branch (input summaries -> exact rendered strings).
- Digest renders nothing extra when both weeks are empty (band behavior
  unchanged - state which branch guarantees it).
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
