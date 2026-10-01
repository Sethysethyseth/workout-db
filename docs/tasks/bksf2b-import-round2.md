# TASK bksf2b: Import - critic round 2 fixes (AI read never sticks, sets x reps without AI, one name, grammar)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Critic round 2 scored 7/10 (`docs/tasks/bks-critic-round-2-FINDINGS.md`; IDs
refer to it). Import trust is at 6/10 and must reach 7+ in the final round. The
critic found two problems in the AI layout flow (bks1 + bksf1c):
- **It sticks.** After an AI read, Back + Preview and even re-pasting the
  identical text return the AI's reading. The original read can't be reached
  again.
- **No comparison.** The before/after line and "Use the original read" did
  not appear on its path: the AI action started from the ERROR card, where no
  deterministic preview existed yet.
It also found that a "Sets x Reps" column (`5x5`) is ignored without the AI,
so every exercise imports as one set (P2-4). Every bksf1c contract stays in
force: unit conversion, pluralisation, wait copy.

FILES TO TOUCH:
- client/src/pages/ImportBlockPage.jsx, client/src/components/blocks/import/*,
  client/src/styles/blocks/bk-import.css
- server/src/blocks/tableToBlock.js, server/src/blocks/importRecipe.js (only to
  share the prescription-cell parser), server/src/blocks/importPreview.js
- server/test/lib/blocks/* (import tests)
Do NOT modify anything outside these files (parallel units own the builder,
search, Home and the run page).

CHANGE:
1. **The recipe is scoped to the exact text it was made for:**
   - Store the recipe with the text it was computed from.
   - Any return to the source step, any text change, re-pasting (even
     identical text), switching source tab, or loading a file clears it, and
     the next Preview is deterministic.
   - The recipe is only reused while the user stays on the preview it
     produced.
2. **The comparison always shows after an AI read:**
   - When the original read was a preview, show "AI read: X (was Y)" as
     bksf1c does.
   - When the original read FAILED (the error card), show "AI read: 6 weeks ·
     30 days · 216 sets (the standard reader couldn't read this sheet)".
   - In both cases show "Use the original read". It returns to the original
     preview or error card, makes no coach call, and clears the recipe.
3. **Combined sets x reps without AI (P2-4):**
   - In the deterministic path, a column whose header normalises to a
     sets-x-reps scheme is parsed with the SAME prescription-cell parser the
     recipe path uses (move it to a shared helper if needed, no duplicate
     logic). Headers covered: "sets x reps", "setsxreps", "sets/reps", "sets
     reps", "scheme", "prescription", "set x rep", "sxr".
   - That covers `5x5`, `4 x 6-8`, `3x8 @ 185`, `3 x 30s`, and the rest.
   - The column is no longer reported as ignored. When separate Sets/Reps
     columns also exist, the separate columns win and the combined one is
     reported as ignored, with that reason.
4. **Copy:**
   - Exactly ONE name for the AI action everywhere: "Let AI read this layout"
     (grep for the other variant and replace it).
   - Fix "6 MATCHES YOUR LIBRARY": count + verb agreement via the existing
     `pluralize` helper ("1 matches" -> "1 match", "6 match").

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` green, with new tests:
  - Deterministic `Exercise,Sets x Reps,Weight` / `Squat,5x5,225` (unit lb):
    5 sets x 5 reps @ 225, and NO "ignored" warning for "Sets x Reps".
  - `Exercise,Sets,Reps,Sets x Reps` / `Bench,3,8,5x5`: 3 sets of 8, plus an
    ignored-with-reason message for "Sets x Reps".
  - Seth's real program TSV (`server/test/lib/blocks/` fixture if one exists;
    otherwise build a 3-row excerpt in the test with its real headers
    `Week,Day,Day_Name,...,Sets,Reps,Load_lb,...`) still parses exactly as
    before.
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md.
- DELIVERY.md:
  - traces every recipe-clearing path (file:line)
  - shows the comparison rendering for both the preview-origin and the
    error-origin case
  - lists every string changed for item 4

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
