# TASK MW2: exercise-identity contract reconciliation (issues 8 + 9)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Two halves of the same contract surface, both surfaced by the NT-wave and
RULED IN by the gate tier July 16 (do not re-litigate the direction):

(8) The server rejects an id-only identity PATCH on a session exercise.
`updateSessionExercise` in `server/src/controllers/sessionController.js`
has two independent blockers: the empty-patch guard (~:531) counts only
`exerciseName`/`notes`, so `{ userExerciseId: 5 }` alone 400s
"No fields to update"; and identity application (~:577-605) is nested
inside `if (data.exerciseName !== undefined)`, so identity never applies
without a name alongside it. The client (NTFIX2) works around this by
always sending name+id together - which forces a rename as a side effect
of stamping. The ruling: the server accepts id-only identity PATCHes.

(9) "Use that name" can never stamp structural identity for CUSTOM
exercises: `mapResolveResult` in
`server/src/controllers/exerciseController.js` (~:74-102) returns
`canonicalName` + `catalogId` but NO `userExerciseId` for
`source: "userExercise"`, so `handleUseThatName` in
`client/src/components/workout/AddExerciseToLibrarySheet.jsx` (~:355)
correctly guards on `source === "catalog"` and links custom exercises by
name alone. Name-based resolution covers behavior; the structural id-link
is missing. Fix starts server-side, then the client consumes it.

FILES TO TOUCH:
- server/src/controllers/sessionController.js      (guard + un-nest identity)
- server/src/controllers/exerciseController.js     (resolve payload)
- client/src/components/workout/AddExerciseToLibrarySheet.jsx
                                                   (handleUseThatName)
- server/test/sessions.lifecycle.test.js           (extend: id-only PATCH rows)
- server/test/exercises.integration.test.js        (extend: resolve shape)
Do NOT modify anything outside these files.

CHANGE:
Server, `updateSessionExercise`:
- Count a provided identity toward the empty-patch guard: a body whose
  only content is a valid `exerciseId` OR `userExerciseId` is a real
  patch, not "No fields to update". Use the existing
  `identityParse.provided` flag - do not re-parse.
- Apply identity independently of the name branch: when
  `identityParse.provided`, run the existing
  `validateOptionalExerciseIdentity` (ownership/existence checks) and set
  `data.exerciseId`/`data.userExerciseId` whether or not `exerciseName`
  is in the body. When a name IS provided without identity, the existing
  `stampExerciseIdentityWithIndex` derivation stays exactly as-is. Do not
  change `parseOptionalExerciseIdentity` / `validateOptionalExerciseIdentity`
  themselves - their validation semantics (mutual exclusion, positive-int,
  owned-row check) are the contract.
- Guard ORDER is load-bearing: 404 (not found), 403 (not owner), and the
  completed-session 400 (`SESSION_COMPLETED`, ~:570) all keep firing
  before any identity write - the live path is the only one in scope.

Server, `mapResolveResult`:
- The `userExercise` branch gains `userExerciseId: resolution.userExercise.id`;
  the `catalog` and unresolved branches gain `userExerciseId: null` so the
  row shape stays uniform. Additive only - no existing field changes.

Client, `handleUseThatName`:
- When `row.source === "userExercise"` and `row.userExerciseId` is
  present, include `userExerciseId` in `linkPayload` (mirroring the
  existing catalog/`exerciseId` arm). The `onLink` handler upstream
  already accepts `userExerciseId` (see `handleLinkRow` ~:337). No other
  sheet behavior changes.

ACCEPTANCE CRITERIA (machine-checkable):
- Integration tests (WRITTEN in the named test files but NOT RUN - no DB
  in the lane; the reviewer runs them in the main tree at land time)
  cover, on a LIVE session exercise:
  - `PATCH { userExerciseId: <owned id> }` -> 200; row has that
    `userExerciseId`, `exerciseId` null, `exerciseName` UNCHANGED.
  - `PATCH { exerciseId: <catalog id> }` -> 200; converse of the above.
  - `PATCH {}` -> still 400 "No fields to update".
  - `PATCH { userExerciseId: <someone else's id> }` -> 400 (existing
    validate rejection).
  - Identity PATCH on a COMPLETED session -> still 400 SESSION_COMPLETED.
  - `POST /exercises/resolve` with a name matching a custom exercise ->
    row carries `source: "userExercise"` AND its `userExerciseId`; a
    catalog-resolved row carries `userExerciseId: null`.
- `npm run test:unit` green from server/ (tripwire).
- Client `npm run build` compiles with no errors.
- Direct-read check: in `handleUseThatName`, a `userExercise`-sourced
  resolution now produces a link payload with `userExerciseId` and NO
  `exerciseId`; catalog arm unchanged.

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
