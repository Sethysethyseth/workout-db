# TASK F0: make a template's effort setting reach the live session

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
F-wave unit 1 of 4 (effort mandatory). Before any of the mandate work can be
built, a bug has to be closed: **a template's stored `useRIR`/`useRPE` never
reaches the live logging session.** Verified in-seat August 2 against the
current tree, not assumed:

- `liveUseRIR` / `liveUseRPE` initialize to `false`
  (`client/src/pages/SessionDetailPage.jsx:1790-1791`).
- The session init effect's template branch (`:2190-2196`) sets the three NOTE
  toggles and then `return`s. It never calls `setLiveUseRIR`/`setLiveUseRPE`.
  Only the quick-log branch (`:2199-2206`) resolves them, from localStorage.
- The server never even sends the flags: `FULL_SESSION_RELATIONS`'s
  `workoutTemplate.select` (`server/src/controllers/sessionController.js:9-16`)
  returns `id, name, description, isPublic, userId` only.

Net effect today: build a template with RIR on, start a workout from it, and no
RIR field appears - the user must tick a checkbox every single session. This is
NOT a regression from E1; the wiring never existed. It is why E1's "RIR defaults
ON for new templates" is currently inert at logging time.

This unit closes ONLY that gap. It does not introduce either-or, does not remove
the Off state, and does not touch enforcement - those are F1/F2/F3.

FILES TO TOUCH:
- server/src/controllers/sessionController.js   (select the two columns)
- client/src/pages/SessionDetailPage.jsx        (seed the live toggles)
Do NOT modify anything outside these files. In particular do NOT touch
server/prisma/schema.prisma - the columns already exist and this unit is
explicitly NOT migration-carrying.

CHANGE:

1. Server: add `useRIR` and `useRPE` to the `workoutTemplate.select` inside
   `FULL_SESSION_RELATIONS`. Additive only - do not remove or rename existing
   selected fields, and do not change any other relation in that object.

2. Client: in the session init effect's `if (session.workoutTemplate)` branch,
   seed `liveUseRIR` / `liveUseRPE` from the template's flags in addition to the
   note toggles that branch already sets. Keep the existing
   `sessionNoteTogglesInitRef` once-per-session-id guard exactly as it is - this
   must stay a one-time seed, NOT a continuous sync, so a user's mid-session
   checkbox change is never stomped by a refetch.

RESOLUTION RULE (this is the contract, not a suggestion). From the template's
stored pair:
- `useRIR = true`, `useRPE = false`  -> live RIR on, RPE off
- `useRIR = false`, `useRPE = true`  -> live RPE on, RIR off
- BOTH true                          -> **RIR wins**: live RIR on, RPE off.
  (Legacy data can hold both-true from the current two-toggle UI. RIR is the
  product's default signal, so it takes precedence.)
- BOTH false                         -> both stay off, exactly as today. This
  is the legacy case F2 handles; do NOT auto-select a signal here, because
  silently choosing one rewrites a stored user choice.

The quick-log branch (`!session.workoutTemplate`) must be left BYTE-IDENTICAL.
This unit changes template-driven sessions only.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `git diff --stat` shows exactly TWO files changed, the two named above.
- `server/prisma/schema.prisma` does NOT appear in the diff.
- `FULL_SESSION_RELATIONS.workoutTemplate.select` contains `useRIR: true` and
  `useRPE: true` alongside the five fields it already selected; quote the whole
  object in DELIVERY.md.
- The quick-log branch of the init effect is byte-identical to before - state
  this explicitly in DELIVERY.md.
- Walk all four rows of the RESOLUTION RULE table in DELIVERY.md, quoting the
  code that produces each outcome. Reading the branches is acceptable evidence;
  there is no test harness for this page.

LANE NOTE - READ THIS:
This unit changes a SERVER response shape, and neither runnable lane covers it:
the unit lane is analytics-only (no DB, no Prisma) and the integration lane
cannot run in a dispatch worktree (no `server/.env`). So a green unit lane does
NOT prove this works. Say so plainly in DELIVERY.md rather than implying
coverage you do not have. The reviewer will treat live verification as a smoke
item.

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
