# TASK bksf1c: Import - critic round 1 fixes (units from headers, AI read diff + undo, copy)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The separate feel critic scored the bks work 5/10 in round 1
(`docs/tasks/bks-critic-round-1-FINDINGS.md`; finding IDs refer to it). On import
it found two problems:
- A "Load (kg)" column read through an AI layout recipe was shown as pounds
  without saying so (P1-6). Import trust means nothing silently transformed.
- The AI read replaced the deterministic preview with no comparison and no
  way back (P2-7).
The AI-layout design of record is `docs/tasks/bks1-ai-layout-import.md`.

Root cause seen by the seat: `applyImportRecipe` in
`server/src/blocks/importRecipe.js` renames the weight column with
`weightHeaderForUnit(recipe.unit)`. When the recipe has no `unit`, the source
header's own unit ("(kg)", "kg", "lbs"...) is dropped and the column becomes a
generic weight column.

FILES TO TOUCH:
- server/src/blocks/importRecipe.js, server/src/blocks/importPreview.js,
  server/src/blocks/tableToBlock.js (only if the unit notice must come from there)
- server/test/lib/blocks/importRecipe.test.js (and other `server/test/lib/blocks/*`
  import tests if a notice shape changes)
- client/src/pages/ImportBlockPage.jsx, client/src/components/blocks/import/*
- client/src/styles/blocks/bk-import.css
Do NOT modify anything outside these files. NOT `index.css`, NOT `bk-ui.css`,
NOT the builder, logger, library or Home files (parallel units).

CHANGE:
1. **Units from headers (P1-6):**
   - In the recipe path, a weight column's unit comes from, in order: the
     recipe's `unit`, then the SOURCE header text (`kg`, `kgs`, `kilo`, `lb`,
     `lbs`, `pounds`, case-insensitive, with or without parentheses), then a
     per-cell suffix, then the import's chosen unit.
   - Values are then handled exactly as the deterministic path already handles
     a kg column for an lb user, so both paths agree. Follow the existing
     column-unit handling in `tableToBlock.js` by name.
   - The preview ALWAYS states what happened in its changes list, e.g. "Load
     (kg) read as kilograms" (plus "converted to lb" if a conversion happens).
2. **AI read diff + undo (P2-7):**
   - When "Let AI read this layout" succeeds, keep the previous deterministic
     preview in page state.
   - Show a one-line comparison above the new preview: "AI read: 6 weeks · 30
     days · 216 sets (was 1 week · 3 days · 40 sets)".
   - Add a "Use the original read" control that restores the previous preview
     and clears the recipe. It must not spend another coach question.
   - If the AI read produces FEWER days or sets than the original, show the
     comparison as a warning, not a success.
3. **Copy:**
   - Pluralise every count in the import surfaces ("1 thing", "2 things"; fix
     "1 THINGS"). Grep the import components for other count strings built
     without pluralisation and fix them the same way.
   - The AI wait (about 50 s against the real coach) shows a calm in-progress
     state that says it can take up to a minute. No layout jump.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` green, with new tests:
  - Recipe `{columns: {"Movement":"exercise","Load (kg)":"weight","Session":"day
    name","Sets x Reps":"ignore"}, prescriptionColumn:"Sets x Reps"}` with NO
    `unit` on a table with row `Squat,3x5,100,Lower`, previewed with
    `options.unit` "lb": the squat's weight is 100 kg handled as the
    deterministic kg column path handles it (state the resulting stored
    value), and the preview notices/warnings include a sentence naming
    "Load (kg)" and kilograms.
  - The same with header "Weight lbs" stays pounds, with a notice saying so.
  - A recipe with `unit: "kg"` and a header without a unit uses kg (existing
    behaviour kept).
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md.
- DELIVERY.md shows:
  - the restore-original code path (file:line), proving it makes no
    `/coach/import-map` call
  - the pluralisation helper and every string it now covers

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
