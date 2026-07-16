# TASK MW4: per-side (unilateral) tracking - end-to-end audit (DIAGNOSIS, no code)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's open question #13 (July 16): are single-movement (unilateral,
"single" L/R) exercises tracked correctly end-to-end in volume and
analytics? NOT a bug report - an audit ask. L1 shipped per-side logging
(`WorkoutSet.side` = "L"/"R", nullable); the client auto-detects per-side
mode from the exercise name (`exerciseNameImpliesPerSide`,
`client/src/pages/SessionDetailPage.jsx` ~:207, `\bsingle\b` regex) and
logs sets as Left/Right pairs. Whether the analytics engine treats those
pairs sensibly has never been verified. This is a DIAGNOSIS block: make
NO code changes anywhere.

FILES TO TOUCH:
- (none - read-only trace; the ONLY file you write is DELIVERY.md)
Do NOT modify anything outside these files.

CHANGE:
Trace a per-side exercise's sets from logging to display and write a
verdict per surface into DELIVERY.md. Surfaces to cover, each with
file:line evidence and a CORRECT / BROKEN / AMBIGUOUS verdict:

1. Storage + enrichment: how `side` flows (or doesn't) through
   `server/src/analytics/enrichSet.js` and the set-metrics layer. Does
   any engine code even see `side`?
2. Volume: in weekly volume and muscle attribution
   (`server/src/analytics/` - aggregate/attribution/summary), do an L set
   and an R set count as TWO sets of volume? State what the code does AND
   whether that is defensible semantics for unilateral work (two sides =
   two sets of stimulus is a coherent position - flag it, don't rule).
3. Set counts / stimulating sets / effort pooling: same question for
   every counting surface (StatTiles "Sets", weekly report set counts,
   stimulating-sets logic if it exists on these paths).
4. e1RM / top set / strength series: does a per-side weight (e.g. a 60 lb
   single-arm row) enter `e1rmSeries`/`topSet` on equal footing with
   bilateral weights? Any pair double-counting in session bucketing?
5. Display: do formatters or summaries anywhere render a pair confusingly
   (e.g. "2 sets" for one L/R pair, mixed L/R in last-logged summaries)?
6. The detection edge: `\bsingle\b` name regex + `anySetHasSide` +
   `derivePerSideMode` - any trap where mode flips mid-session or
   detection misses an obviously-unilateral name? (List, don't fix.)

DELIVERY.md must end with: (a) an overall verdict - is unilateral
tracking trustworthy today, yes/no/with-caveats; (b) the smallest-correct
proposed fix for each BROKEN verdict (file:line, mechanism, no code); and
(c) any semantics question that needs a product ruling (e.g. pair = 1 set
or 2 sets) stated as a question, not a decision.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` shows a clean tree except DELIVERY.md (zero source edits).
- Every one of the six surfaces above has file:line evidence and an
  explicit verdict in DELIVERY.md.
- Claims about engine behavior are backed by quoting the relevant code or
  running the existing unit lane / a node eval of pure functions with a
  per-side fixture - not by inference alone. `npm run test:unit` from
  server/ is allowed and its output included if used.

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
