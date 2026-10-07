# TASK sr3f3: Add to library from the builder or import in 3 taps, not 5

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the sr3 feel critic, round 1 (`docs/tasks/sr3-critic-round-1-FINDINGS.md`,
6/10 FAIL): its P2-4. sr3-4 let the builder's exercise search and the import
preview's "Not in your library" rows add a name to the library through
`AddExerciseToLibrarySheet` in a new `context="library"` mode. The critic counted
5 taps across 4 sheets for a name with no similar exercise: "Add 'X' to your
library" -> "Start from a similar exercise?" (its search is pre-filled with the
new name and finds nothing) -> "Start from scratch" -> pick a muscle -> "Add
exercise" -> an "Added to your library" sheet -> Done. The header style also
switches between steps. Lands AFTER sr3f2 (both touch `BlockBuilder.jsx`) -
rebase onto it.

FILES TO TOUCH:
- client/src/components/workout/AddExerciseToLibrarySheet.jsx
- client/src/index.css   (ONLY the `.add-exercise-library-sheet` rules)
- client/src/components/blocks/builder/BlockBuilder.jsx   (only the toast on a successful add)
Do NOT modify anything outside these files. The live and completed WORKOUT
contexts (`context="live"` / `"completed"`, used by `SessionDetailPage.jsx`) must
behave and look exactly as today - every change below is library-context only.

CHANGE (all in `context="library"`):

1. **Skip an empty "similar" step.** When the seed step's search for the
   pre-filled name returns no results, go straight to the curate step (the
   muscle form) instead of showing "Start from a similar exercise?" with an
   empty list. Back from the curate step returns to where the lifter came from
   (the previous step, or closes the sheet if there was none). When similar
   exercises DO exist, the seed step shows as today.
2. **No "Added" sheet.** After a successful add, skip the "Added to your
   library" step: the sheet closes and the parent's existing success path runs
   as today (the builder lands the exercise linked, with no "Not in library"
   chip; the import row moves out of "Not in your library"). The builder shows
   a short toast through its existing `setToast`: "Added 'X' to your library."
   The import preview has no toast - the row moving is the feedback there.
3. **One header style.** Every step's header in library context uses the same
   style as the builder's Add exercise sheet header ("ADD EXERCISE":
   uppercase, left-aligned), with the back arrow where a step has one.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run test:unit`
  from `server/` still green; `node scripts/check-hex.mjs` clean and every new
  `var(--...)` resolves.
- `git diff --stat` lists only files in FILES TO TOUCH; in `index.css` every
  changed line is inside an `.add-exercise-library-sheet` rule (paste the
  `git diff client/src/index.css`).
- `SessionDetailPage.jsx` is unchanged, and the live-context path is unchanged:
  state in DELIVERY.md how each change is gated on library context (quote the
  conditions).
- Evidence from a local run at 390x844 (stub or non-prod API - `client/.env` is
  PRODUCTION, never use it), screenshots under `.playwright-mcp/sr3f3/`:
  (a) builder search "Zercher Carry Hold" -> "Add 'Zercher Carry Hold' to your
  library" opens straight on the muscle form with the library-context header;
  (b) after "Add exercise": the builder with the exercise in the day, no "Not in
  library" chip, and the toast. Count and state the taps from the "Add ... to
  your library" row to (b): at most 3.
  (c) a name WITH similar exercises (e.g. "Calf Raise Machine") still shows the
  similar step.

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
