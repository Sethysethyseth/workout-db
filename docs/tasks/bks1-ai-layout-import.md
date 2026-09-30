# TASK bks1: Import any spreadsheet layout - the AI reads the layout, the parser reads the rows

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
From Seth's BK smoke (Sept 30, `docs/tasks/bk-smoke-FINDINGS.md` CR1): the block
importer only understands a sheet whose columns use our header words (one row per
exercise, headers matched through the alias sets in
`server/src/blocks/tableToBlock.js`). People have their own layouts. Seth's ruling
is that an AI looks at a SAMPLE of the sheet and returns a small **layout recipe**;
the existing deterministic parser then applies that recipe to EVERY row, and the
normal import preview follows.

Why a recipe instead of having the AI rewrite the whole sheet (the existing "Let
the coach convert it" path, `POST /coach/block-draft` mode=convert):
- A 6-week sheet is about 600 sets. The JSON for that does not fit the 8000-token
  block-draft output, so it truncates.
- A rewrite also varies from run to run. A recipe is small, deterministic once
  returned, and sends only a sample of the file to the AI.

Cost: this action uses **3** of the 7 weekly coach questions. Later it becomes a
paid benefit, so the cost lives in ONE named constant. Design of record for
import and the coach: `docs/specs/blocks-v2.md` sections 4 and 9.

FILES TO TOUCH:
- server/src/blocks/importRecipe.js (NEW, pure - no Prisma, no env: the recipe
  format, its validator, the sampler, and the table transform)
- server/src/blocks/importPreview.js (the delimited path applies `options.recipe`
  when present)
- server/src/blocks/tableToBlock.js (only if the recipe transform needs a hook or
  a new canonical role - prefer emitting canonical headers it already reads)
- server/src/coach/importMap.js (NEW: prompt assembly + response parsing for the
  map call, modelled on `server/src/coach/blockDraft.js`)
- server/src/coach/mockProvider.js (a deterministic mock recipe for mock runs)
- server/src/coach/weeklyCap.js (only to export the cost constant or a
  "remaining >= cost" helper, if that is where it fits best)
- server/src/controllers/coachController.js, server/src/routes/coachRoutes.js
  (the new route `POST /coach/import-map`)
- server/src/controllers/blockImportController.js (only if the preview needs to
  pass the recipe through differently)
- server/test/lib/blocks/importRecipe.test.js, server/test/lib/coachImportMap.test.js (NEW)
- client/src/api/coachApi.js, client/src/api/blockTemplateApi.js
- client/src/pages/ImportBlockPage.jsx, client/src/components/blocks/import/*
- client/src/styles/blocks/bk-import.css
Do NOT modify anything outside these files. In particular: NOT
`client/src/index.css`, NOT `client/src/styles/blocks/bk-ui.css` or
`components/blocks/ui/*`, NOT `SessionDetailPage.jsx`, NOT `MyTemplatesPage.jsx`
(two other units are editing those in parallel).

CHANGE:
1. **Recipe format** (`importRecipe.js`), a versioned plain-JSON object:
   `{ version: 1, headerRow?, unit?, columns, prescriptionColumn?, dayHeaderRows?,
   carryDown?, weekColumns? }`. Every op is applied deterministically:
   - `headerRow`: the 0-based index of the real header row. Rows above it (sheet
     titles, blank lines) are skipped.
   - `columns`: maps each source header, as its exact text, to ONE canonical role
     that `tableToBlock` already understands. The roles are week, week label, day,
     day name, exercise, sets, reps, weight, rpe, rir, rpe cap, rir cap, rest
     seconds, rest minutes, notes, setup, tempo, lead side, section - or `ignore`.
     Headers the recipe leaves out are ignored with a warning, exactly as today.
   - `prescriptionColumn`: a header whose cells hold a combined prescription. The
     parser splits it into sets / reps / repsMax / durationSec / weight / rpe.
     Cells to support (examples, not a complete list):
     - `3x8`, `4 x 6-8`, `3x8 @ 185`, `3×10 @ 60kg`
     - `5x5 @ RPE 8`, `3 x 30s`, `3x45 sec`, `3x8-10 @ 185 RPE 8`
     - `AMRAP` / `%1RM` style cells: never guessed. They become a row warning,
       and the reps cell is left blank.
   - `dayHeaderRows`: `{ column }`. A row whose only non-empty cell is in that
     column starts a new day named by that text. It is not an exercise row; the
     day name carries down to the rows below.
   - `carryDown`: a list of headers. A blank cell inherits the nearest non-blank
     value above it (exports of merged cells).
   - `weekColumns`: `[{ header, week }]`. Each of these columns holds that week's
     prescription for the row's exercise, so one source row expands to one row
     per listed week (unpivot). A blank cell means the exercise is absent that week.
   - `unit`: `"lb"` or `"kg"` when the sheet makes it clear.
   Export these functions:
   - `validateImportRecipe(recipe)`: returns `{ ok, recipe, errors }`. Unknown
     keys, unknown roles and headers that do not exist in the table are errors.
   - `applyImportRecipe(parsedTable, recipe)`: returns a table in the canonical
     header shape, plus warnings.
   - `sampleForRecipe(text)`: the header region plus at most 40 data rows,
     capped at 12,000 characters.
2. **Preview**: `POST /block-templates/import/preview` accepts `options.recipe`.
   When it is present, the delimited path validates it and applies it before
   `tableToBlock`. From there the output is the same `{ kind, block, stats,
   warnings, notices, exercises }` as today, plus one notice saying the sheet
   was read with an AI layout recipe. An invalid recipe returns 422
   `{ errors }`, the same shape the preview uses for other failures. Without
   `options.recipe`, behaviour is byte-for-byte unchanged.
3. **Map call**: add `POST /coach/import-map { text, unit? }` (authRequired).
   - Same access, consent and provider resolution as `POST /coach/block-draft`;
     follow `draftBlock` in `coachController.js` by name.
   - Only `sampleForRecipe(text)` is sent to the model, never the whole text.
   - The prompt documents the recipe format and the canonical roles. The reply
     is parsed with the same first-JSON extraction `blockDraft.js` uses, then
     validated with `validateImportRecipe` against the table's real headers.
   - Success returns `200 { recipe }`. Refusal, truncation and an invalid recipe
     map to palette-shaped 422 errors, following `blockErrorForStopReason`.
   - **Cost:** `IMPORT_MAP_COST = 3`, one exported constant. When the weekly cap
     applies (`weeklyCapApplies`), the call is refused BEFORE calling the model
     unless `remaining >= 3`. The refusal reuses the existing weekly-limit error
     shape and adds `needed: 3` and `remaining`.
   - On success, write exactly 3 `CoachUsage` rows in one transaction. A failed
     or invalid map is not charged; this matches when `draftBlock` charges.
   - Uncapped emails are never charged.
   - The mock provider returns a deterministic recipe for the fixture header set
     so the local mock recipe works end to end.
4. **Client** (Import page):
   - When a delimited paste or file fails to parse, OR parses with
     ignored/unrecognised-column warnings, the preview/error card offers
     **"Let AI read this layout"**. Under it sits a cost line: "Uses 3 of your
     7 weekly coach questions (N left)", using the counter the coach already
     exposes.
   - The action appears only where "Let the coach convert it" would appear, i.e.
     the same AI-consent gate.
   - Fewer than 3 left: the action is disabled and says how many are left and
     when the next one frees up.
   - Tap: call `/coach/import-map`, then re-run the preview with
     `options.recipe`, then show the normal preview. From there Create works
     exactly as it does today.
   - While waiting: one clear in-progress state, no layout jump.
   - Errors land in the existing `ImportErrorCard` pattern.
   - The recipe lives in page state only; there is no persistence.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`. The new tests cover each case below.
- Fixture A, a long table with foreign headers: headers `Movement,Sets x Reps,Load
  (kg),Session,Wk`, plus a recipe that maps Movement=exercise,
  Session=day name, Wk=week and `prescriptionColumn`="Sets x Reps". Row
  `Squat,3x5,100,Lower,1` gives week 1 / day "Lower" / Squat / 3 sets of
  reps 5 at weight 100. A `Load (kg)` column maps to weight in kg.
- Fixture B, day-header rows: a sheet where a row with only `Upper A` in the
  first column precedes three exercise rows gives one day "Upper A" with 3
  exercises. The header row itself is not an exercise.
- Fixture C, weeks as columns: headers `Exercise,Week 1,Week 2,Week 3` with
  `weekColumns` and a row `Bench,3x8 @ 185,3x8 @ 190,` gives Bench in weeks 1-2
  only, weights 185 and 190. A blank Week 3 cell means absent that week, not an
  error.
- Fixture D, title rows: two title rows above the header with `headerRow: 2`
  parse the same as without them.
- Prescription cells:
  - `4 x 6-8` gives 4 sets reps 6 repsMax 8
  - `3 x 30s` gives 3 sets durationSec 30
  - `5x5 @ RPE 8` gives 5 sets reps 5 rpe 8
  - `AMRAP` gives a warning and blank reps, never a thrown error
- `validateImportRecipe`: rejects an unknown role, a header that is not in the
  table, and unknown top-level keys, each with a path-named error.
- `sampleForRecipe` on a 216-data-row TSV returns the header plus exactly 40 data
  rows.
- Preview without `options.recipe` is unchanged. The existing blocks tests stay
  green untouched.
- Cap: unit tests on the pure pieces prove all of the following:
  - with 2 uses left the map call is refused and the model is never called
  - with 3 left it proceeds
  - a success records exactly 3 usage rows
  - an invalid reply records 0
  - an uncapped email records 0
  Use injected deps, as the existing coach tests do.
- `node scripts/check-hex.mjs` passes. Client `npm run build` compiles with no
  errors.
- DELIVERY.md includes the prompt text sent to the model and one example recipe.

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
