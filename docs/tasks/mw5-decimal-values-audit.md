# TASK MW5: decimal reps / RPE / RIR - end-to-end audit (DIAGNOSIS, no code)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's open question #14 (July 16): are decimal RPE/RIR values and
decimal rep counts tracked correctly end-to-end (input -> storage ->
analytics -> display)? NOT a bug report - an audit ask. Known ground
truth to start from: in `server/prisma/schema.prisma`, `reps` and `rpe`
are `Float?` but `rir` is `Int?` - so decimal RIR (e.g. 1.5) is
structurally impossible at rest, and what happens to one on the way in
(client rounds? server 400s? Prisma throws/truncates?) is exactly the
kind of thing this audit must pin down. History worth knowing: a May
decimal-reps bug (`9112eda7`) and a July 5 wheel-scroll decimal bug were
both input-layer issues, both fixed; reps inputs carry `step="0.01"`.
This is a DIAGNOSIS block: make NO code changes anywhere.

FILES TO TOUCH:
- (none - read-only trace; the ONLY file you write is DELIVERY.md)
Do NOT modify anything outside these files.

CHANGE:
For each of the three values - reps 8.5, RPE 8.5, RIR 1.5 - trace the
full path and write a verdict per stage into DELIVERY.md, with file:line
evidence and a CORRECT / BROKEN / AMBIGUOUS verdict per stage:

1. Input: the set-row inputs in the live session UI (SessionSetRow /
   DraftSessionSetRow / SessionDetailPage) - what do the number inputs
   accept (step, inputMode, any parse/clamp on change or blur)?
2. Validation/parse: the set create/update path in
   `server/src/controllers/sessionController.js` - how are reps/rpe/rir
   parsed and validated? What EXACTLY happens to `rir: 1.5` (rejected
   with 400, silently truncated, Prisma error -> 500)? Quote the parse
   code.
3. Storage: schema types (already known - state them) and any rounding on
   write.
4. Analytics: `server/src/analytics/` - effort pooling (`effort.js`,
   B8's RPE+RIR unification), e1RM (decimal reps into Epley),
   set metrics, matchedEffort - do decimal reps/RPE flow through the math
   unmangled? Do any formulas assume integer reps?
5. Display: the shared formatters from N1 (`formatWeight`/`formatEffort`
   and friends) plus set-row rendering of stored values - does 8.5 reps
   display as entered, does effort formatting handle fractional values
   (the N1 audit pinned some of this - verify against the current code,
   don't trust the record)?

DELIVERY.md must end with: (a) an overall verdict per value (reps / RPE /
RIR); (b) for each BROKEN verdict the smallest-correct proposed fix
(file:line, mechanism, no code); (c) a explicit recommendation on RIR:
should decimal RIR be REJECTED cleanly at input+validation (likely - RIR
is integer-natured and the schema says Int) or should the column widen -
frame it as a recommendation with reasoning, the ruling stays with the
reviewer tier.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` shows a clean tree except DELIVERY.md (zero source edits).
- All five stages x three values have file:line evidence and explicit
  verdicts in DELIVERY.md (a stage may be answered once when the three
  values share the code path - say so explicitly).
- The `rir: 1.5` behavior claim is demonstrated, not inferred: quote the
  parse/validation code AND, if the parse is a pure function, show a node
  eval of it; engine claims may use `npm run test:unit` or node evals of
  the pure analytics functions with decimal fixtures - include the output.

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
