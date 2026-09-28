# TASK BK2: LogChamp Block Format v1 - validator, table + history parsers, export mapping (pure)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The heart of the blocks-v2 import story: every way a block enters LogChamp
(paste, CSV, a Strong/Hevy export, any AI's answer, the coach, the Claude
connector) funnels into ONE format and ONE validator. Design of record:
`docs/specs/blocks-v2.md` sections 2, 3, 4 and 5 - they are the contract;
read them in full. Everything in this unit is PURE (no Prisma, no Express,
no network, no new dependencies) and new-files-only, so it runs beside BK1.

The real-world acceptance case is Seth's own Phase-1 rehab program sheet.
Its columns are exactly: `Week, Day, Day_Name, Slot_ID, Order, Block,
Exercise, Job, Sets, Reps, Load_lb, Load_Type, Setup, Tempo, Rest_Sec,
RPE_Cap, Lead_Side, Notes` (source: `logchampIssues.md`, quoted in the spec).
Do NOT commit his program; build a SYNTHETIC fixture with the same columns
and the same hard cases.

FILES TO TOUCH:
- `server/src/blocks/blockFormat.js`      (NEW - `validateBlockDraft`,
                                           constants, limits)
- `server/src/blocks/parseDelimited.js`   (NEW - CSV/TSV text -> rows)
- `server/src/blocks/tableToBlock.js`     (NEW - spec section 4)
- `server/src/blocks/historyToBlock.js`   (NEW - spec section 5)
- `server/src/blocks/blockFormatMapping.js` (NEW - `formatToCreatePayload`,
                                           `blockTreeToFormat`)
- `server/src/blocks/aiFormatPrompt.js`   (NEW - spec section 3.4)
- `server/test/lib/blocks/*.test.js`      (NEW)
- `server/test/lib/blocks/fixtures/*`     (NEW - synthetic CSV/TSV/JSON)
Do NOT modify anything outside these files.

CHANGE:
Implement spec sections 3-5 exactly. Module contracts:

- `validateBlockDraft(input, { targetUnit })` - spec 3.1 and 3.2: returns
  `{ ok: true, block, stats }` or `{ ok: false, errors }`; normalized block
  (shorthand expanded, effort resolved, weights converted to `targetUnit`
  and rounded to the nearest 0.5); path-addressed errors, max 50; unknown
  keys are errors at every level; reject, never repair.
- `parseDelimited(text)` - spec 4.1 (TSV when the header line has a tab;
  CSV with RFC 4180 quoting; `;` when the header has more `;` than `,`).
  Returns `{ header: string[], rows: string[][], rowNumbers: number[] }` or
  throws a typed error with a plain-English message.
- `tableToBlock(parsed, { name, unit, skipWarmups })` - spec 4.2-4.4 ->
  `{ block, warnings, notices }` (block is NOT yet validated; warnings carry
  the 1-based source row). Header synonyms, cell grammar and grouping rules
  are exactly the spec's tables - implement all of them, not a subset.
- `historyToBlock(parsed, { historyWeeks, sourceUnit })` - spec 5; returns
  `null` when neither the Strong nor the Hevy signature matches (the caller
  then uses `tableToBlock`), else `{ block, warnings, notices: { app,
  windowStart, windowEnd, sessionsUsed } }`.
- `formatToCreatePayload(block)` - spec 3.3 -> the existing
  `POST /block-templates` body shape (see `docs/specs/blocks-v2.md` 3.3 and
  the payload example in `CreateTemplatePage.jsx` save flow:
  `weeks[].workouts[].exercises[].sets[]` with `exerciseName`), extended
  with `label`, `restSec`, `effortCap`, `repsMax`, `durationSec`.
- `blockTreeToFormat(tree, { unit })` - the inverse, from the API response
  shape (`weeks[].workouts[].exercises[].blockWorkoutSets[]`, `name`,
  `exerciseName`) to format v1, always the array set form, `format` and
  `version` set, `effort` from `useRPE` / `useRIR`.
- `aiFormatPrompt.js` - `BLOCK_FORMAT_AI_INSTRUCTIONS` (plain text, at most
  2,500 characters, written for ChatGPT / Gemini / Claude: the field rules
  in prose, both set forms, "omit weight for bodyweight, never 0", "use RPE
  or RIR, not both", "reply with ONLY the JSON in one code block"),
  `BLOCK_FORMAT_EXAMPLE` (a small valid block that passes the validator),
  `BLOCK_FORMAT_JSON_SCHEMA` (JSON Schema for the format; draft 2020-12
  keywords only).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line). Tests
  live under `server/test/lib/blocks/` (the unit lane matches
  `test/lib/**`; `test/blocks/` would NOT run - spec section 2).
- `git diff --stat` touches only the paths above; `grep -rn "require(" server/src/blocks/`
  shows no `@prisma/client`, `express`, `fs`, or network module.
- Validator examples (each a test):
  - the spec 3 example block -> `ok: true`, stats `{ weeks: 1, days: 1,
    exercises: 2, sets: 5, timedSets: 3 }`.
  - `{ ..., weeks: [] }` -> error at path `weeks`.
  - a set `{ reps: 8, durationSec: 30 }` -> error whose path ends
    `.sets[0]`.
  - a set `{ weight: 0 }` -> error on `.weight`.
  - an exercise with `sets: [ { "reps": 5 } ]` plus exercise-level
    `reps: 8` -> error (set fields belong inside each set in the list form).
  - an exercise key `load` -> error `...load: unknown field`.
  - `unit: "kg"`, weight 100, `targetUnit: "lb"` -> 220.5.
  - one set with `rpe` and another with `rir` -> error.
  - validating the SAME input twice returns deep-equal results; the input
    object is not mutated.
- Table examples (each a test, over fixtures):
  - a synthetic Phase-1-shaped TSV (the 18 columns above, 2 weeks x 2 days,
    at least 12 rows) containing: `45 sec`, `30 sec/side`, `5 min`, `8-10`,
    a blank `Load_lb` with `Load_Type` `bodyweight`, an `RPE_Cap` of 6, a
    `Rest_Sec` of 90, `Setup` and `Lead_Side` text, a warm-up `Block` row,
    and a spacer row -> after `validateBlockDraft`: no row silently lost
    (every non-blank row is either in the block or in a warning), the timed
    sets carry `durationSec` 45 / 30 / 300, the bodyweight set has NO
    weight and notes contain `Load: bodyweight`, the capped exercise has
    `effortCap: true` and `rpe: 6`, notes contain `Setup:` and `Lead side:`
    lines, `Slot_ID` produces no warning, `skipWarmups: true` drops exactly
    the warm-up row and `notices.warmupRows` is 1.
  - a CSV with quoted commas and a quoted newline parses to the right cells.
  - two consecutive `Bench Press` rows (`1x5 @ 225`, `3x8 @ 185`) merge into
    one exercise with 4 sets; the same name later in the day stays separate.
  - `75% TM` in a load cell -> no weight, a note, and a warning.
  - a table with no Exercise-family column -> the documented error message.
  - values in both an RPE and an RIR column -> the documented error.
- History examples: a synthetic Strong CSV (headers from spec 5) with two
  workout titles repeated over three weeks -> 2 days taken from each title's
  most recent session, warm-up `W` rows skipped, `historyWeeks: 3` -> 3
  identical weeks; a synthetic Hevy CSV with `weight_kg` -> unit `kg`; a
  plain table -> `historyToBlock` returns `null`.
- Round trip: for the spec 3 example and the Phase-1 fixture,
  `blockTreeToFormat(fakeTreeFrom(formatToCreatePayload(validated)))`
  validates and deep-equals the validated block (write the small
  `fakeTreeFrom` test helper that mimics the API response shape).
- `BLOCK_FORMAT_EXAMPLE` passes `validateBlockDraft`;
  `BLOCK_FORMAT_AI_INSTRUCTIONS.length <= 2500`.

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
