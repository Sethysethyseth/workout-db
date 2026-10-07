# TASK sr3-2: A week holds at most 7 days - builder, server save, import, AI

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3, item 3 (`docs/tasks/bk-smoke-FINDINGS.md` -> "Round 3
rulings", "cap everywhere"). Today the cap is 14 days a week and it is
duplicated as literals: client `MAX_DAYS = 14`
(`client/src/components/blocks/builder/blockBuilderState.js`), Block Format
v1 `validateBlockDraft` days 1-14 (`server/src/blocks/blockFormat.js`), the
AI instructions + JSON schema `maxItems: 14`
(`server/src/blocks/aiFormatPrompt.js`). The builder SAVE path has no
server max at all (`normalizeBlockWeeksArray` in
`server/src/lib/templateExerciseNormalize.js`), and "+ Day" silently no-ops
at the cap. Recon: `sr3-r1` section B. Seth's ruling: "+ Day" greys out at
7 with "7 days max"; the server refuses an 8th day on save; import and AI
previews show an 8+ day week as a problem.

FILES TO TOUCH:
- client/src/components/blocks/builder/blockBuilderState.js
- client/src/components/blocks/builder/BlockBuilder.jsx   ("+ Day" control
  and the day actions that add a day, e.g. duplicate day - nothing else in
  this file)
- the builder CSS file that styles "+ Day", only if the disabled state or
  hint needs a rule (tokens only)
- server/src/blocks/blockFormat.js
- server/src/blocks/aiFormatPrompt.js
- server/src/lib/templateExerciseNormalize.js
- server/src/blocks/historyToBlock.js   (only if it can emit a week with
  more than 7 days - see CHANGE 5)
- tests under server/test/lib/ (existing block/format/import tests that pin
  14, plus new ones) - but NOT `server/test/lib/blocks/blockRunLogic.test.js`
  (sr3-1 owns it and runs in parallel)
Do NOT modify anything outside these files.

CHANGE:

1. ONE server constant: `MAX_DAYS_PER_WEEK = 7`, exported from a single
   server module and used by `blockFormat.js`, `aiFormatPrompt.js` (both
   the prose "days (1-7)" and the schema `maxItems`), and the save-path
   normalizer. Pick the module so no import cycle appears; say which in
   DELIVERY.md.
2. Format v1 (`validateBlockDraft`): days 1-7. A week with more than 7
   days produces the error message
   `Week <n> has <count> days - a week holds at most 7.` (n 1-based; keep
   the existing `path` shape `weeks[i].days`). Empty weeks keep their
   current message.
3. Save path (`normalizeBlockWeeksArray`, used by block create and PATCH
   weeks): a week with more than 7 workouts is refused with status 400 and
   the same sentence as the error. Existing blocks are not migrated; one
   that already has 8+ days simply cannot be saved until trimmed.
4. Client (`blockBuilderState.js`): `MAX_DAYS = 7`. `validateState` reports
   an over-cap week with the same sentence (so a legacy 8+ day block shows
   the problem and saving stays blocked, like the existing empty-day rule).
   `addDay` / `duplicateDay` keep their no-op guard at the cap.
5. Client (`BlockBuilder.jsx`): when the selected week has 7 days, the
   "+ Day" control is `disabled` and the text `7 days max` is visible next
   to or inside it (not only a tooltip). Any other day-adding action in the
   builder (duplicate day) is disabled the same way at 7. Below 7, nothing
   changes.
6. `historyToBlock.js`: check whether grouping history into weeks can
   produce more than 7 days in a week (e.g. two sessions on one calendar
   day). If it can, it must not crash - the preview reports the Format v1
   error from (2). Say in DELIVERY.md what you found; change the file only
   if it would otherwise throw or silently drop data.

Import and AI flows already run every block through `validateBlockDraft`,
so (1)-(2) cover "import/AI previews list it as a problem" - confirm in
DELIVERY.md that the 422 `errors` list is what the import page renders
(file:line), without editing the import UI.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with tests (new or updated) for:
  - `validateBlockDraft` on a week with 7 days -> ok; with 8 days -> error
    at `weeks[0].days` with message
    `Week 1 has 8 days - a week holds at most 7.`
  - `normalizeBlockWeeksArray` with a week of 8 workouts -> `ok: false`,
    `status: 400`, that sentence (week number from its position);
    7 workouts -> ok.
  - `BLOCK_FORMAT_JSON_SCHEMA` days `maxItems === 7` and the instructions
    text contains `days (1-7)`.
  - no test anywhere still asserts 14 days.
- `grep -rn "1-14" server/src client/src` finds nothing block-related.
- `npm run build` from `client/` compiles with no errors;
  `node scripts/check-hex.mjs` clean.
- Builder evidence in DELIVERY.md (run the client against a non-prod API
  or a stub - `client/.env` points at PRODUCTION, never use it): at 390px,
  a week with 7 days shows "+ Day" disabled with "7 days max" visible; a
  week with 6 days shows it enabled.

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
