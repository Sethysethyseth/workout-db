# TASK BK3: import preview / import / export / format endpoints

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Wires BK2's pure format + parsers to HTTP so the client (BK6), the coach
(BK12) and anyone holding an AI's answer can bring a block in, and so a block
can go back out. Design of record: `docs/specs/blocks-v2.md` sections 2, 3
and 4.4 (read 3.4 for the format endpoint). Needs BK1 (`createBlockTemplateForUser`
in `server/src/blocks/blockTemplateStore.js`) and BK2 (`validateBlockDraft`,
`parseDelimited`, `tableToBlock`, `historyToBlock`, `formatToCreatePayload`,
`blockTreeToFormat`, `aiFormatPrompt.js`) - both LANDED; read them first.

Exercise matching must reuse the existing resolver, not a new one:
`resolveExercise` (`server/src/analytics/resolve.js`: exact normalized name ->
curated alias -> plural fold -> the user's custom exercise), the same path
`POST /exercises/resolve` uses (`exerciseController.js`, `mapResolveResult`).

Body size: `server/src/app.js:135` installs a global `express.json()` with
the default 100 KB limit, which runs BEFORE any route - a real 6-week sheet
fits, a Strong history export often does not. The fix is a path-scoped
parser registered ahead of the global one.

FILES TO TOUCH:
- `server/src/blocks/importPreview.js`       (NEW - orchestration, pure:
                                              text + options + an injected
                                              `resolveName` -> preview result)
- `server/src/controllers/blockImportController.js` (NEW)
- `server/src/routes/blockTemplateRoutes.js` (four routes)
- `server/src/app.js`                        (the scoped body limit only)
- `server/test/lib/blocks/importPreview.test.js` (NEW)
Do NOT modify anything outside these files.

CHANGE:
Endpoints (under the existing block-templates mount; register the literal
paths BEFORE any `/:id` route so `format` / `import` are never read as ids):

1. `GET /block-templates/format` - no auth. `{ version: 1, instructions:
   BLOCK_FORMAT_AI_INSTRUCTIONS, example: BLOCK_FORMAT_EXAMPLE, jsonSchema:
   BLOCK_FORMAT_JSON_SCHEMA }`.
2. `POST /block-templates/import/preview` - auth. Body `{ text, kind?,
   options? }`; `kind` is `"auto"` (default) | `"table"` | `"json"` |
   `"history"`; `options` = `{ unit: "lb"|"kg" (the importing device's unit
   - required), sourceUnit?, skipWarmups?, historyWeeks?, name? }`. `text`
   must be a string of at most 1,000,000 characters (400 otherwise).
   - auto: text whose first non-space character is `{` -> json; text that
     CONTAINS a fenced code block or a `{...}` object inside prose (an AI's
     answer) -> extract the first JSON object and treat as json; otherwise
     `parseDelimited` -> `historyToBlock` -> (null) `tableToBlock`.
   - JSON that does not parse -> 422 `{ errors: [{ path: "", message:
     "That isn't valid JSON: <parser message>" }], warnings: [] }`.
   - Then `validateBlockDraft(candidate, { targetUnit: options.unit })`.
     Invalid -> 422 `{ kind, errors, warnings }`. Valid -> 200 `{ kind,
     block, stats, warnings, notices, exercises }` where `exercises` lists
     each DISTINCT exercise name once, in first-appearance order: `{ name,
     resolved, exerciseId, userExerciseId, matchedName }` (`matchedName` =
     the library's display name when it differs from `name`).
   - No database writes.
3. `POST /block-templates/import` - auth. Body `{ block, renames? }`.
   Re-validate (never trust the client) with `targetUnit: block.unit`;
   apply `renames` (`{ "<name as in block>": "<new name>" }`, each new name
   trimmed 1-120, unknown keys ignored) to every exercise with that exact
   name; `formatToCreatePayload`; `createBlockTemplateForUser(userId,
   payload, { source: "import" })` -> 201 `{ blockTemplate }`. Invalid ->
   422 `{ errors }`.
4. `GET /block-templates/:id/export?unit=lb|kg` - the same visibility rule
   as `GET /block-templates/:id` (public, or owner). `{ block:
   blockTreeToFormat(tree, { unit }) }`; `unit` defaults to `"lb"`; a draft
   is exportable by its owner.
5. `app.js`: a `express.json({ limit: "2mb" })` scoped to the import paths,
   registered before the global parser (which then skips the already-parsed
   body). Nothing else in `app.js` changes.

Keep controller handlers thin: everything decidable without a database
lives in `importPreview.js` (`buildImportPreview(text, kind, options,
resolveName)`, `applyRenames(block, renames)`, the JSON extraction) so the
unit lane covers it.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line).
- `server/test/lib/blocks/importPreview.test.js` pins, with a fake
  `resolveName`:
  - text = `BLOCK_FORMAT_EXAMPLE` stringified -> kind `json`, `ok`, stats
    match.
  - text = "Sure! Here is your block:\n```json\n<example>\n```\nEnjoy." ->
    kind `json`, same block (AI-answer extraction).
  - text = `{ "format": "logchamp.block", ` (truncated) -> the 422-shaped
    result with the "isn't valid JSON" message.
  - a TSV table fixture -> kind `table`; a Strong CSV fixture -> kind
    `history`.
  - `exercises` lists each distinct name once, in order, with `resolved`
    from the fake resolver; a name the resolver matches to a different
    display name carries `matchedName`.
  - `applyRenames(block, { "Bench": "Bench Press" })` renames every
    exercise named exactly `Bench` and no other; the input is not mutated.
  - `options.unit` missing -> a validation error, not a crash.
- Route order: `grep -n "router\.\(get\|post\|patch\|delete\)" server/src/routes/blockTemplateRoutes.js`
  shows `/format` and `/import...` registered before the first `/:id` route.
- `node -e "require('./src/app.js')"` from `server/` exits 0.
- DELIVERY.md includes, for the reviewer's LIVE check after deploy (the
  lane has no server), copy-paste `curl` commands for: `GET /format`; a
  preview of a 3-row TSV; a preview of a ~300 KB body (proves the scoped
  limit); an import; an export of the imported block - with the expected
  status code of each.

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
