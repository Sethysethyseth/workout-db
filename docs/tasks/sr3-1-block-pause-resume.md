# TASK sr3-1: Switching blocks pauses the old one - pick it up where you left off

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3, item 1 (`docs/tasks/bk-smoke-FINDINGS.md` -> "Round 3
rulings"). Today `createBlockRun` (`server/src/controllers/blockRunController.js`)
ends every open run and always CREATES a new one, so starting block B and
later starting block A again puts A back at W1 - the logged sessions survive
on the old run but nothing can reach them. Seth's ruling: still ONE block at
a time; switching PAUSES the old one; starting a block that has an
unfinished earlier run offers "Resume at W3 · Day 2" or "Start over". NO
schema change: a "paused" run is an ended run whose progress is unfinished,
and resuming reopens it (`endedAt` back to null). This applies the same way
to a block ended with "End block". Recon: `sr3-r1` (sections A1-A6) - key
facts: `computeRunProgress` (`server/src/blocks/blockRunLogic.js`) never
reads `endedAt`, so it works on an ended run unchanged; start-from-block
refuses an ended run (409), which is fine once the run is reopened.

FILES TO TOUCH:
- server/src/blocks/blockRunLogic.js        (new pure helper)
- server/src/controllers/blockRunController.js
- server/src/routes/blockRunRoutes.js
- server/test/lib/blocks/blockRunLogic.test.js
- client/src/api/blockRunApi.js
- client/src/pages/MyTemplatesPage.jsx
- client/src/components/library/LibraryBlockCard.jsx
- client/src/pages/BlockRunPage.jsx
- client/src/components/blocks/run/RunEmptyState.jsx
- the CSS file(s) that already style the Library card and the run empty
  state, only if the new line needs a rule (tokens only)
Do NOT modify anything outside these files.

CHANGE:

Server

1. `blockRunLogic.js`: add a pure, exported `summarizeLeftOff(tree,
   sessions)` built ON `computeRunProgress` (same inputs). It returns
   `null` when the run is finished (`nextDay == null`) OR when no day is
   `done` or `in_progress` (nothing to resume - starting fresh is the
   same thing). Otherwise it returns
   `{ nextDay: { weekOrder, workoutOrder }, dayName, doneDays, totalDays }`
   where `dayName` is the next day's name (fallback `Day <order>`) and the
   counts are days across the whole block.
2. `GET /block-runs/left-off` (new, `authRequired`): for the signed-in user,
   take the MOST RECENT run (by `startedAt`) of each of their non-draft
   block templates; skip a template whose most recent run is still open
   (that one is the active block); for the rest, return those where
   `summarizeLeftOff` is non-null. Response:
   `{ runs: [{ runId, blockTemplateId, endedAt, nextDay, dayName, doneDays, totalDays }] }`.
   Load trees with the existing `blockWeekInclude` and sessions with the
   same select `getActiveBlockRun` uses. Register it before any `/:id`
   route.
3. `POST /block-runs` gains an optional `resumeRunId` (positive int, parse
   with `parsePositiveInt` like `blockTemplateId`). Without it: today's
   behavior, unchanged (fresh run, 201). With it:
   - 404 `{ error }` unless the run exists, belongs to the user, and its
     `blockTemplateId` matches the body's `blockTemplateId`.
   - 409 `{ error: "A newer run of this block exists." }` if it is not that
     template's most recent run.
   - 409 `{ error: "That run is already finished." }` if
     `summarizeLeftOff` says finished/nothing to resume.
   - Already open (`endedAt == null`): return it, 200, no writes.
   - Otherwise, in ONE `prisma.$transaction` (same shape as the create
     path): end every OTHER open run of the user (`updateMany`, as today),
     then set this run's `endedAt` to null. Return `{ run }` with 200.
4. `getActiveBlockRun` and `endBlockRun` stay as they are.

Client

5. `blockRunApi.js`: `startBlockRun(blockTemplateId, { resumeRunId } = {})`
   (sends `resumeRunId` only when given) and `getLeftOffRuns()`.
6. Library (`MyTemplatesPage.jsx` + `LibraryBlockCard.jsx`): load the
   left-off runs in the existing `Promise.all` (a failure degrades to an
   empty list, like the active-run fetch). A block card with a left-off run
   shows one quiet line under its meta: `Left off at W3 · Upper A` (format
   `W<weekOrder> · <dayName>`, same shape as `UpNextCard`'s day label).
   Tapping Start on any block uses ONE in-page confirm - the existing
   `bk-lib-confirm` pattern, never a browser dialog - whose content depends
   on the case:
   - Left-off run exists: title `Start "<name>"?`; if ANOTHER block is
     active, body `This pauses <active name> - you can pick it up where you
     left off.`; actions: primary `Resume at W3 · Upper A`
     (`resumeRunId`), secondary `Start over` (fresh run), ghost `Cancel`.
   - No left-off run, another block active: today's confirm, body changed
     to the pause sentence above; actions `Start block` / `Keep current`.
   - No left-off run, nothing active: start directly (today).
   After a successful start or resume, navigate to `/blocks/current`
   (today's behavior).
7. Current Block page with no block running (`BlockRunPage.jsx` +
   `RunEmptyState.jsx`): the same left-off line on each listed block, and
   Start on a block with a left-off run opens the same choice (Resume /
   Start over / Cancel) in-page. Nothing is active on this page, so no
   pause sentence.
8. End-block confirm body (`BlockRunPage.jsx`): `You can pick it up where
   you left off from your library.`

Patterns to follow by name: the existing `bk-lib-confirm` block in
`MyTemplatesPage.jsx` (role="alertdialog", button classes), `Chip`/muted
small text already used on `LibraryBlockCard`, `UpNextCard`'s day label.
Tokens only - no raw colors.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, including NEW tests for
  `summarizeLeftOff`:
  - no sessions -> `null`
  - 2-week x 2-day tree, sessions done for W1 D1 and W1 D2 ->
    `{ nextDay: { weekOrder: 2, workoutOrder: 1 }, dayName: <W2 D1 name>, doneDays: 2, totalDays: 4 }`
  - same tree, W1 D1 in progress only -> non-null, `nextDay` = W1 D1,
    `doneDays: 0`
  - every day done -> `null`
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` clean.
- Controller contract (the reviewer proves it live on staging at landing;
  write the request/response pairs you expect in DELIVERY.md):
  - start A (fresh), log a day on A, start B (fresh) ->
    `GET /block-runs/left-off` lists A's run with `doneDays: 1`;
    `GET /block-runs/active` is B.
  - `POST /block-runs { blockTemplateId: A, resumeRunId: <A run> }` -> 200,
    active is A with W1 D1 done, B's run ended, B now in left-off only if B
    had progress.
  - `resumeRunId` of another user's run -> 404; of an older A run after a
    "Start over" -> 409.
- `grep -n "window.confirm\|window.alert" ` over the touched client files
  finds nothing new.

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
