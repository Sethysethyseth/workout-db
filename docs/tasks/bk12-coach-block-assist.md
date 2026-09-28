# TASK BK12: the in-app coach can draft a block and talk about one - optional, never load-bearing

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth: "i want the built in ai coach to be able to help as well, but the core
of the block builder cannot rely on this." Design of record:
`docs/specs/blocks-v2.md` section 9 (and section 1: each draft counts as one
coach question). Every coach result enters through the SAME preview a paste
import uses (BK6), so the coach can never produce a block the manual path
could not.

The pattern to reuse, precisely (recon Sept 28): the palette studio's
`generatePalette` (`server/src/controllers/coachController.js` ~278-355) -
prompt -> Anthropic structured output (`outputFormat: { type: "json_schema",
schema }`) or, on the Cursor provider, the schema inlined in the system text
and `extractFirstJsonText` (`server/src/coach/cursorProvider.js` ~232-260)
-> `JSON.parse` -> validate -> reject, never repair (422) - with a mock
branch. The weekly cap: `CoachUsage` row created before the model call and
deleted if no answer was delivered (`coachController.js` ~177-196, ~267-268;
`server/src/coach/weeklyCap.js`). Consent gate: 403 `no_consent` like ask
(~159-161). The ask stream's request shape lives in
`server/src/coach/coachRequest.js` (~100-126; `focus` is `view` or
`session` today). Needs BK2 (`validateBlockDraft`, `BLOCK_FORMAT_JSON_SCHEMA`,
`BLOCK_FORMAT_AI_INSTRUCTIONS`, `blockTreeToFormat`), BK6 and BK8 (LANDED -
BK6's import preview and BK5's builder are where the UI lands).

FILES TO TOUCH:
- `server/src/coach/blockDraft.js`          (NEW - prompt assembly, schema
                                             wiring, block-to-text for the
                                             ask focus; pure where possible)
- `server/src/controllers/coachController.js` (the block-draft handler;
                                             the `block` focus in ask)
- `server/src/routes/coachRoutes.js`
- `server/src/coach/coachRequest.js`        (`focus: { type: "block",
                                             blockId }`)
- `server/src/coach/prompt.js`              (render the block focus)
- `server/src/coach/mockProvider.js`        (a deterministic mock draft)
- `client/src/api/coachApi.js`
- `client/src/components/blocks/import/*`   (the "Let the coach convert it"
                                             entry)
- `client/src/components/blocks/builder/*`  ("Draft with the coach" on a new
                                             block; "Ask about this block")
- `client/src/components/coach/CoachPanel.jsx` (ONLY if it needs a prop to
                                             accept the block focus)
- `server/test/lib/coachBlockDraft.test.js` (NEW)
Do NOT modify anything outside these files.

CHANGE:
1. **`POST /coach/block-draft { mode, text, unit }`** (auth; same rate
   limiter as ask): `mode` `"convert"` (turn messy text - a PDF's text, a
   forum post, notes - into the format) or `"generate"` (a description of
   the block wanted); `text` 1-20,000 chars; `unit` `"lb"|"kg"` required.
   Consent-gated exactly like ask. Counts ONE question against the weekly
   cap (row before the call; deleted when no valid block is returned).
   Prompt: `BLOCK_FORMAT_AI_INSTRUCTIONS` + the user's text; `generate`
   also includes the same training summary the ask path loads, so loads are
   grounded in the user's numbers. Provider handling mirrors
   `generatePalette` with `BLOCK_FORMAT_JSON_SCHEMA`; then
   `validateBlockDraft(candidate, { targetUnit: unit })`. Invalid -> 422
   `{ error: "block_invalid", errors }` (first 10); refusal / max-tokens
   stop -> 422 without repair. Success -> `{ block, stats, source }`.
   Nothing is persisted. Mock provider -> a small valid block that
   mentions the mode in its name.
2. **Ask about a block:** `coachRequest.js` accepts `focus: { type:
   "block", blockId }`; the controller loads the block ONLY if it belongs
   to the requesting user (else 404 - never reveal another user's block)
   and `prompt.js` renders it as compact text (weeks, labels, days,
   exercises with sets x reps / time @ load, effort, caps, rest). Otherwise
   the ask stream is unchanged.
3. **Client - import:** on BK6's Paste and Any AI sources, when
   `/coach/status` reports available, a secondary action "Let the coach
   convert it" -> `coachBlockDraft({ mode: "convert", ... })` -> the SAME
   preview step as a paste (the result's `block` is re-run through
   `previewBlockImport` as JSON so exercise matching and warnings appear).
   Capped -> the calm capped message the coach panel already uses; any
   error -> inline, the pasted text kept.
4. **Client - builder:** on a NEW, empty block, a card "Describe the block
   you want" (textarea + "Draft with the coach") -> generate -> the import
   preview -> Create. On any saved block, the builder menu gains "Ask the
   coach about this block", opening `CoachPanel` in a sheet with the block
   focus and 2-3 suggested questions ("Is the volume balanced?", "Where
   should the deload go?").
5. **Optional by construction:** every entry above is HIDDEN when
   `/coach/status` says unavailable (no consent, not configured); the
   builder, import and run views work identically with the coach off.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line).
- `coachBlockDraft.test.js` pins (using the existing coach test seams -
  injected `fetchImpl` / fake SDK / mock provider): a provider answer that
  is valid format JSON -> 200 with `block`; an answer wrapped in prose with
  a fenced block on the Cursor path -> extracted and accepted; an answer
  with an unknown field -> 422 `block_invalid` with that path, and the
  `CoachUsage` row deleted; a `max_tokens` stop -> 422 without repair;
  consent off -> 403; a `block` focus for a block owned by ANOTHER user ->
  404 and no block text in any prompt.
- `grep -n "outputFormat\|extractFirstJsonText\|validateBlockDraft" server/src/coach/blockDraft.js server/src/controllers/coachController.js`
  shows the palette pattern reused (paste output).
- `node -e "require('./src/app.js')"` from `server/` exits 0.
- `npm run build` from `client/` compiles; `node scripts/check-hex.mjs`
  clean; `npx eslint src/components/blocks` 0 errors.
- DELIVERY.md lists the reviewer's LIVE check: with the coach ON, convert a
  pasted paragraph into a previewed block; with consent OFF, confirm no
  coach entry is visible in import or the builder.

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
