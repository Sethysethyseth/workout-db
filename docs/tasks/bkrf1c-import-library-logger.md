# TASK bkrf1c: Import, Library and logger polish after critic R1 - explain the AI fix, no browser dialogs

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
bkr critic round 1 scored 6/10 FAIL (`docs/tasks/bkr-critic-round-1-FINDINGS.md`
- read it; ids below refer to it). This unit fixes the import AI-fix
presentation (bkr3 landed `fb896ec`), the AI wait details (bkr1 `3373a9b`),
the remaining native dialogs in Library and the logger, and the Finish dock
pop. Runs in parallel with bkrf1a (builder + index.css) and bkrf1b (Home) -
stay inside your files. The in-page confirm pattern and its CSS
(`.session-discard-confirm`, `role="alertdialog"`, as on BlockRunPage "End
block") already exist - use them; bkrf1a restyles its question line in
index.css this round, so do not edit index.css.

FILES TO TOUCH:
- client/src/pages/ImportBlockPage.jsx
- client/src/components/blocks/import/ImportPreviewStep.jsx
- client/src/components/blocks/import/AiLayoutOffer.jsx   (AiFileFixOffer)
- client/src/components/blocks/import/aiFixChanges.js     (NEW, pure helper)
- client/src/styles/blocks/bk-import.css
- client/src/components/coach/AiWait.jsx
- client/src/styles/ai-wait.css
- client/src/pages/MyTemplatesPage.jsx
- client/src/components/library/LibraryBlockCard.jsx,
  LibraryWorkoutCard.jsx, LibraryExerciseCard.jsx
- client/src/styles/blocks/bk-library.css
- client/src/pages/SessionDetailPage.jsx   (ONLY the "Leave this workout?"
                                            confirm on Back)
- client/src/styles/blocks/bk-log.css      (ONLY the Finish dock hide/show)
Do NOT modify anything outside these files.

CHANGE:
1. **P2-8 the AI fix explains itself.**
   - Before: when the preview has problems, the problem list renders
     EXPANDED (not behind "+ N things we changed or skipped") with a warning
     tint (existing warn tokens), and the "Have AI fix this file" button sits
     at the foot of that list - the reason comes before the button.
   - Cost line: "Uses 1-4 coach uses - you have N left this week." (N from
     coach status; when the cap does not apply, "Uses 1-4 coach uses.").
   - After: under "AI read: ... (was ...)", an "AI changed" list built by a
     pure helper `aiFixChanges(originalPreview, aiPreview)` in
     `aiFixChanges.js`: one line per changed exercise, "Barbell Row - sets:
     none -> 3 x 10", "Plank - 3 x 45 s (was a note)", up to 8 lines then
     "+N more". Problems still present after the fix are tagged "still needs
     you". "Use the original read" and "AI fix used N coach uses" stay.
2. **P3-7 no shift while busy.** While the fix runs, the status ladder
   REPLACES the cost line in the same slot (no new row, no 48px jump). Give
   `AiWait` an optional `slowCopy` prop; the import passes "Still reading
   your file - long files take up to a minute." (draft keeps the block copy).
3. **P3-6 a crown that reads as alive.** Inline crown 18px (block variant
   stays 28px); breathe = opacity 0.55 -> 1 and scale 0.92 -> 1.06 on the same
   2.4s ease-in-out cycle (drop the translateY); reduced-motion stays static.
4. **P2-5** on a successful import create, clear
   `localStorage['workoutdb-block-builder-draft:new']` (same key the builder
   uses), so the next "New block" opens clean.
5. **P2-1 Library deletes are in-page.** Replace the three `window.confirm`
   calls in MyTemplatesPage (block, workout, custom exercise) with an inline
   confirm on the card (`role="alertdialog"`, the `.session-discard-confirm`
   classes): block -> "Delete "<name>"? Your logged workouts stay." with
   [Delete block] [Keep]; workout -> same shape; custom exercise -> keep the
   analytics warning as the body sentence. Never the word "template" in this
   copy. Focus moves to Keep when it opens; Escape cancels.
6. **P2-1 logger Back.** Remove the "Leave this workout? You can open it again
   from the home screen." `window.confirm` on Back - the action loses nothing.
   Leave the set-count / L-R pair confirms in that file untouched (out of
   scope).
7. **P3-11 Finish dock.** In bk-log.css, hide/show the Finish dock under
   `html.bk-log-kbd` with a 150 ms ease-out translateY(100%) + opacity
   transition instead of an instant `display: none`; hidden = `visibility:
   hidden` + `pointer-events: none` after the transition so it never takes a
   tap; reduced motion = instant. The bkr-f1 keyboard logic is unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Grep: zero `window.confirm(` in MyTemplatesPage.jsx; SessionDetailPage.jsx
  no longer contains "Leave this workout?".
- Grep: `aiFixChanges` exported from `aiFixChanges.js` and used by the
  preview; `slowCopy` accepted by AiWait.
- Grep: ImportBlockPage removes `workoutdb-block-builder-draft:new` after a
  successful create.
- Grep: bk-log.css no longer sets `display: none` on `.session-finish-dock`
  under `bk-log-kbd`, and has a `prefers-reduced-motion` override for it.
- Every new `var(--...)` resolves (index.css or bk-ui.css) - list them.
- Playwright at 390x844 if available (else say so): a messy sheet shows the
  expanded problem list with the button at its foot; Library Delete shows the
  in-page confirm.

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
