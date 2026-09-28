# TASK BK11: Claude (and any connected assistant) can create DRAFT blocks - create-only, opt-in, app-guarded

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth, Sept 28: "you should be able to talk to your AI through the connector
and make blocks" - as a draft he confirms in-app. This deliberately amends
the AI layer's "read-only v1" rule (`docs/specs/ai-layer.md` 4.2, with its
Sept 28 amendment note) and is a CROSS-USER ISOLATION SURFACE: the frontier
seat reviews this unit at the pre-main gate. Design of record:
`docs/specs/blocks-v2.md` section 8 (every guard rail there is part of this
contract) and section 3 (the format). WorkOS cannot issue a custom write
scope (`ai-layer.md` CORRECTION 6) and `connectorAuth.js` does not gate on
scopes (~35-39), so the ONLY guards are the ones this unit writes. Tool
annotations are hints to the client, never security.

Ground truth (recon Sept 28): `createMcpServerForUser(connectorUserId,
boundEmail)` builds a fresh server per request (`server/src/ai/mcpServer.js`
~121-125) and every tool closes over the verified user - handlers never take
a userId from model arguments (~117-119); all reads go through
`analyticsAccess.js` ("isolation happens here and only here", ~29-31);
`withBoundAccount` / `toolError` stamp every payload (~26-50); the four
existing tools are `readOnlyHint: true`. Consent: `AiConsent`
grant/revoke at `GET/POST/DELETE /ai/consent` (`server/src/routes/aiRoutes.js`
~17-19, `server/src/controllers/aiController.js` ~25-118),
`connectorAccess` in `server/src/ai/consent.js` ~29-36. Needs BK1 (LANDED:
`AiConsent.blockDraftsAllowedAt`, `BlockTemplate.isDraft/source/sourceUnit`,
`createBlockTemplateForUser`), BK2 (`validateBlockDraft`,
`formatToCreatePayload`, `aiFormatPrompt.js`) and BK3.

FILES TO TOUCH:
- `server/src/ai/blockDraftAccess.js`       (NEW - the ONLY place the
                                             connector writes)
- `server/src/ai/mcpServer.js`              (two tools; an injectable deps
                                             seam for tests)
- `server/src/ai/consent.js`                (`blockDraftsAllowed(consent)`)
- `server/src/controllers/aiController.js`  (the opt-in endpoint; status;
                                             revoke clears the opt-in)
- `server/src/routes/aiRoutes.js`
- `client/src/api/aiApi.js`
- `client/src/pages/profile/AiConnectorPage.jsx` (the toggle)
- `client/src/components/ai/AiConsentFacts.jsx`  (the fourth fact)
- `server/test/lib/blockDraftAccess.test.js` (NEW)
- `server/test/lib/mcpBlockDraftTools.test.js` (NEW)
Do NOT modify anything outside these files.

CHANGE:
1. **`blockDraftAccess.js`** - `createDraftForUser(userId, block, deps)`:
   (a) load the user's consent; not granted or `blockDraftsAllowedAt` null
   -> `{ error: "block_drafts_off" }`; (b) `block.unit` missing ->
   `{ error: "unit_required" }`; (c) `validateBlockDraft(block, {
   targetUnit: block.unit })` failing -> `{ error: "invalid_block", errors }`
   (first 20); (d) count the user's `source "connector"` blocks created in
   the last 24 h (>= 10 -> `{ error: "daily_limit" }`) and open drafts
   (`isDraft` true, `source "connector"`; >= 20 -> `{ error: "too_many_drafts"
   }`); (e) `createBlockTemplateForUser(userId,
   formatToCreatePayload(validated), { source: "connector", isDraft: true })`
   and set `sourceUnit = block.unit`; return `{ blockId, name, stats,
   unmatchedExercises }` (names whose stamped `exerciseId` and
   `userExerciseId` are both null). Prisma and the clock are injectable so
   the unit lane can test it without a database. It never updates or
   deletes anything.
2. **Tools** in `mcpServer.js` (userId ONLY from the closure; the input
   schemas contain no user field and extra fields are ignored):
   - `get_block_format` - no input; `readOnlyHint: true`; returns
     `{ instructions, example, jsonSchema }` from `aiFormatPrompt.js`,
     stamped with `withBoundAccount`.
   - `create_block_draft` - input `{ block }` (an object; `validateBlockDraft`
     is the real validator - do not duplicate its rules in zod);
     annotations `readOnlyHint: false, destructiveHint: false,
     idempotentHint: false, openWorldHint: false`; description (<= 600
     chars): creates a DRAFT block in the user's LogChamp library that they
     review before using, never edits or deletes anything, call
     `get_block_format` first, `unit` is required. Maps every
     `blockDraftAccess` error to `toolError` with a plain message the AI can
     relay - `block_drafts_off`: "Block drafts are turned off. In LogChamp,
     open Profile -> AI access and turn on 'Let assistants draft blocks'.";
     `invalid_block`: the path-addressed errors so the AI can fix and retry;
     the two limits in words. Success -> `{ blockId, name, stats,
     unmatchedExercises, reviewUrl, message: "Draft saved. Open it in
     LogChamp to review and save it to your library." }`, where `reviewUrl`
     = `<client origin>/blocks/<id>/edit` built from the same client-origin
     configuration the connector login flow already uses (name the variable
     in DELIVERY.md; if none exists, omit `reviewUrl` and say so).
3. **Opt-in API:** `PUT /ai/consent/block-drafts { allowed: boolean }`
   (auth): requires active consent (409 otherwise); sets or clears
   `blockDraftsAllowedAt`; `GET /ai/consent` (and whatever the AI-access page
   reads for status) gains `blockDraftsAllowed: boolean`; revoking consent
   (`DELETE /ai/consent`) also clears `blockDraftsAllowedAt`.
4. **AI access page:** in the connector section, a switch "Let assistants
   draft blocks" with the line "A connected assistant like Claude can add
   DRAFT blocks to your library. It can't change or delete anything, and
   nothing is used until you review and save it." Disabled (with the
   reason) while consent is off. Optimistic toggle with rollback on error.
5. **`AiConsentFacts.jsx`:** a fourth fact, "**What it can add.** Only if
   you turn it on: draft blocks you review before they're used. It never
   edits or deletes anything." (This component also renders on the
   connector login page - keep its layout intact there.)

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line).
- `blockDraftAccess.test.js` (fake Prisma + clock) pins: consent missing ->
  `block_drafts_off`; consent granted but opt-in null -> `block_drafts_off`;
  no `unit` -> `unit_required`; an invalid block -> `invalid_block` with a
  path; 10 connector blocks in the last 24 h -> `daily_limit`, 10 blocks
  25 h old -> allowed; 20 open drafts -> `too_many_drafts`; success calls
  the create path with `source "connector"`, `isDraft true`, the SAME
  userId it was given, and records `sourceUnit`; the fake Prisma records NO
  update/delete call in any case.
- `mcpBlockDraftTools.test.js` drives the tools in-process (the SDK's
  in-memory transport + client, with `blockDraftAccess` injected) and pins:
  both tools are listed with the annotations above; `create_block_draft`
  called with `{ block, userId: "someone-else" }` reaches the access layer
  with the CLOSURE's userId; a `block_drafts_off` result comes back as an
  MCP error whose text contains "Profile -> AI access"; every response
  carries `boundAccount`.
- `grep -n "update\|delete" server/src/ai/blockDraftAccess.js` shows no
  Prisma update/delete call (paste the output).
- `node -e "require('./src/app.js')"` from `server/` exits 0.
- `npm run build` from `client/` compiles; `node scripts/check-hex.mjs`
  clean.
- DELIVERY.md lists the reviewer's LIVE staging check (Seth's Claude,
  connected to staging): toggle off -> ask Claude to make a block -> the
  "turned off" message; toggle on -> a draft appears in the library with a
  DRAFT pill -> the builder banner -> Save to library.

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
