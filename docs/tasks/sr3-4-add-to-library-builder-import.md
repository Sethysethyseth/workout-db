# TASK sr3-4: Add a not-in-library exercise to your library - from the builder and from import

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3 items 6 and 8 (`docs/tasks/bk-smoke-FINDINGS.md`). Seth:
"if an exercise isnt in library in the block builder you should be able to
put it in your library from the block builder" and "if you import a block
and it has workouts that arent saved the app should probably catch that
and have you add them to the library". What exists (seat recon, Oct 6):
- Builder picker (`client/src/components/blocks/builder/ExercisePicker.jsx`)
  ends its list with `Use 'X'` + a `Not in library` chip (`pickCustom`),
  adding a free-text exercise. The builder state already marks such
  exercises (`exercise.notInLibrary`) and `ExerciseCard.jsx` shows the
  `Not in library` chip in the card header.
- The live logger already has the full add-to-library flow:
  `client/src/components/workout/AddExerciseToLibrarySheet.jsx` (props
  `open, initialName, sessionExerciseId, context, onClose, onLink,
  onCreateCommitted`; steps suggest -> seed -> curate muscles; creates via
  `exerciseApi.createCustomExercise({ name, muscles })`; used by
  `SessionDetailPage.jsx`). Its "use an existing exercise" choices are
  disabled without a `sessionExerciseId` (they link a SESSION exercise).
- Saving a block re-resolves every exercise name against the catalog and
  the user's custom exercises (`stampBlockWeeksArray`), so once a custom
  exercise with that exact name exists, the next save links it. No server
  change is needed for linking.
- Import preview (`client/src/components/blocks/import/ImportPreviewStep.jsx`,
  page `client/src/pages/ImportBlockPage.jsx`) lists unmatched names under
  `Not in your library (N)` (`formatUnmatchedSection.js`,
  `splitMatchedExercises.js`) with the existing rename / match-to-library
  controls.
Lands AFTER sr3-3 (BlockBuilder.jsx) and sr3-5 (ExerciseCard.jsx,
blockBuilderState.js) - rebase onto both.

FILES TO TOUCH:
- client/src/components/workout/AddExerciseToLibrarySheet.jsx
- client/src/components/blocks/builder/ExercisePicker.jsx
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/builder/BlockBuilder.jsx   (only the picker
  / card wiring for this feature)
- client/src/components/blocks/builder/blockBuilderState.js (only if
  `notInLibrary` needs a setter)
- client/src/components/blocks/import/ImportPreviewStep.jsx
- client/src/pages/ImportBlockPage.jsx
- client/src/components/blocks/import/formatUnmatchedSection.js /
  splitMatchedExercises.js (only if copy or grouping must change)
- the CSS files that already style these surfaces (`bk-builder.css`, the
  import CSS, and `index.css` only for the sheet's existing rules) - tokens
  only
Do NOT modify anything outside these files. No server changes.

CHANGE:

1. **Sheet without a session.** `AddExerciseToLibrarySheet` gets a mode
   for callers that have no session exercise (builder, import). In that
   mode its "use this existing exercise" choices are ENABLED and call back
   with the chosen library exercise (`{ name, exerciseId?,
   userExerciseId? }`) instead of linking a session exercise; creating a
   custom exercise calls back with `{ name, userExerciseId }` as today.
   The live and completed logger flows (`SessionDetailPage.jsx`) must
   behave exactly as before - do not change that file; say in DELIVERY.md
   how you verified its props/paths are untouched.
2. **Builder picker.** When the search has text and there is no exact
   (case-insensitive) library match, the list ends with TWO rows: the
   existing `Use 'X'` (+ `Not in library` chip) and a new
   `Add 'X' to your library` row. The new row closes the picker and opens
   the sheet with `initialName = X`. On a create or a pick-existing
   callback, the exercise is added to the day under the LIBRARY name with
   `notInLibrary` false - exactly as if it had been picked from the list.
   Closing the sheet without finishing adds nothing.
3. **Builder card.** For an exercise with `notInLibrary` true, the card's
   actions sheet ("..." on the card) gets `Add to library` (above the
   divider, not red). It opens the same sheet with the exercise's name; on
   success the card's exercise takes the library name and `notInLibrary`
   becomes false (the header chip disappears). Sets and settings are kept.
4. **Import preview.** Each row in `Not in your library (N)` gets an
   `Add to library` action next to its existing controls. It opens the same
   sheet with that name. On success the preview re-resolves (re-run the
   preview request the page already makes, or move the row to matched
   locally - pick one and say which) so the row leaves the unmatched list
   and the count drops. The saved block then links it (server stamps by
   name).
5. Copy: `Add 'X' to your library` (picker), `Add to library` (card action
   and import row). No browser dialogs.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run
  test:unit` from `server/` still green.
- `node scripts/check-hex.mjs` clean; every new `var(--...)` resolves.
- `git diff --stat` shows no file outside FILES TO TOUCH and no change to
  `SessionDetailPage.jsx`.
- DELIVERY.md walks each path with what the UI showed, from a local run
  against a non-prod API (`client/.env` is PRODUCTION - never use it; the
  staging-DB local API recipe is `COACH_PROVIDER=mock PORT=3000 node
  src/server.js` from `server/` IF a `server/.env` exists in this tree -
  otherwise a stub, and say which):
  (a) builder: type "Zercher Carry Hold" -> both rows show; Add -> sheet ->
      create -> the day gains "Zercher Carry Hold" with no Not-in-library
      chip;
  (b) builder: an existing free-text exercise -> card "..." -> Add to
      library -> chip gone;
  (c) import: paste a sheet with one unknown name -> `Not in your library
      (1)` -> Add to library -> the section disappears or shows (0).
  Screenshots at 390px under `.playwright-mcp/sr3-4/`.

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
