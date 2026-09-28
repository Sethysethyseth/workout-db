# TASK BK7: run a block - server (active block, start a day, plan snapshot, timed sets)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Today a block can be built but never trained: no start-from-block path, the
"current program" is localStorage only, and `WorkoutSet.blockWorkoutSetId`
is never written (`docs/specs/block-execution-gap.md`). Seth ruled Sept 28:
make blocks runnable. Design of record: `docs/specs/blocks-v2.md` section 7
(read 7.1-7.3 in full) and section 6 for the columns BK1 added (LANDED:
`BlockRun`, `WorkoutSession.blockRunId/blockWeekOrder/blockWorkoutOrder`,
`SessionExercise.plan`, `WorkoutSet.durationSec`).

Why a snapshot and not `blockWorkoutSetId` (spec section 1): block updates
replace every week/workout/set row, so plan-row FKs die on the first edit.
Sessions carry a positional stamp plus a JSON plan written once at start.
Do NOT write `blockWorkoutSetId`.

The template start you mirror: `startSession` (`sessionController.js` ~149+,
`POST /sessions/start/:templateId`) - it creates the session and
`SessionExercise` rows and NO `WorkoutSet` rows. The logger seeds effort
from `session.workoutTemplate.useRIR/useRPE` (`SessionDetailPage.jsx`
~2295-2304); block sessions have no template, so `GET /sessions/:id` must
carry the block's effort flags in `blockContext` (spec 7.2).

FILES TO TOUCH:
- `server/src/blocks/blockRunLogic.js`        (NEW - pure)
- `server/src/controllers/blockRunController.js` (NEW)
- `server/src/routes/blockRunRoutes.js`       (NEW)
- `server/src/routes/index.js`                (mount `/block-runs`)
- `server/src/controllers/sessionController.js` (start-from-block;
                                               `blockContext`; `durationSec`
                                               on set create/update)
- `server/src/routes/sessionRoutes.js`        (the start-from-block route)
- `server/test/lib/blocks/blockRunLogic.test.js` (NEW)
Do NOT modify anything outside these files.

CHANGE:
1. Pure logic (`blockRunLogic.js`):
   - `buildSessionFromBlockWorkout(tree, weekOrder, workoutOrder,
     { blockName })` -> `null` when the week/workout does not exist, else
     `{ name, exercises }` - `name` = `"<blockName> · W<weekOrder> · <day
     name>"`; one entry per block exercise in order, copying `exerciseName`,
     `exerciseId`, `userExerciseId`, `targetSets`, `targetReps`, `notes`,
     plus `plan` = spec 7.3's shape (`v: 1`, `effort` from the block's
     `useRPE`/`useRIR` or null, `effortCap`, `restSec`, `sets` with all six
     planned fields, nulls explicit).
   - `computeRunProgress(tree, sessions)` - `sessions` are this run's
     sessions (`blockWeekOrder`, `blockWorkoutOrder`, `completedAt`, `id`).
     Returns `{ weeks: [{ order, label, done, total, days: [{ order, name,
     status: "todo" | "in_progress" | "done", sessionId }] }],
     currentWeekOrder, nextDay: { weekOrder, workoutOrder } | null }` per
     spec 7.1 (done beats in-progress when both exist; `sessionId` = the
     completed one, else the open one; current week = first week with a day
     not done, all done -> the last week; `nextDay` = first not-done day of
     the current week, null when the block is finished).
2. Runs (`/block-runs`, all auth, every query filtered by the session user):
   - `POST /block-runs { blockTemplateId }` - the block must be the user's
     own (404 otherwise, including other users' public blocks) and not a
     draft (409 `{ error: "Save the draft to your library before starting
     it." }`). In ONE transaction: set `endedAt = now()` on the user's other
     active runs, create the run. 201 `{ run }`.
   - `GET /block-runs/active` - `{ run: null }`, or `{ run, block, progress }`
     where `block` is the run's block tree (weeks -> workouts -> exercises ->
     sets with every planned field incl. `label`, `restSec`, `effortCap`,
     `repsMax`, `durationSec`) and `progress` is `computeRunProgress`.
     Multiple active runs (a race) -> the newest wins.
   - `POST /block-runs/:id/end` - owner only, sets `endedAt` if null,
     idempotent, returns `{ run }`; 404 otherwise.
3. `POST /sessions/start-from-block { blockRunId, weekOrder, workoutOrder }`
   (auth): the run must be the user's and active (404 / 409); an existing
   UNCOMPLETED session for the same run + week + workout -> 200 `{ session,
   resumed: true }`; else create the session and its `SessionExercise`
   rows from `buildSessionFromBlockWorkout` with the stamps -> 201
   `{ session, resumed: false }`. `session` has the same shape the template
   start returns, plus `blockContext`.
4. `GET /sessions/:id` (and the start responses) add `blockContext` per spec
   7.2 - `null` for non-block sessions; the non-block response is otherwise
   byte-identical to today.
5. Sets: create and update accept `durationSec` (integer 1-86400, or null)
   and return it; a set may have `durationSec` with `reps` null. Existing
   validation for every other field is unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line).
- `blockRunLogic.test.js` pins, over a 2-week x 2-day fixture tree:
  - `buildSessionFromBlockWorkout(tree, 2, 1, { blockName: "Phase 1" })`
    -> name `"Phase 1 · W2 · <day 1 name>"`; exercise order preserved; a
    timed set's plan entry is `{ reps: null, repsMax: null, durationSec:
    45, ... }`; `effortCap` and `restSec` copied; `effort` is `"rpe"` for a
    `useRPE` block and `null` when neither flag is set.
  - week 3 or workout 9 -> `null`.
  - progress with no sessions -> every day `todo`, `currentWeekOrder` 1,
    `nextDay` `{ 1, 1 }`.
  - W1D1 completed + W1D2 open -> `done` / `in_progress`, current week 1,
    `nextDay` `{ 1, 2 }`.
  - W1D1 has both a completed and an open session -> `done`, `sessionId` =
    the completed one.
  - all four done -> `currentWeekOrder` 2, `nextDay` null.
- `grep -rn "blockWorkoutSetId" server/src` shows no new write.
- `grep -n "userId" server/src/controllers/blockRunController.js` shows the
  user filter on every Prisma call (list them in DELIVERY.md with lines).
- `node -e "require('./src/app.js')"` from `server/` exits 0.
- DELIVERY.md carries copy-paste `curl` commands (cookie-authed) for the
  reviewer's LIVE staging check: start a run, read it, start W1D1, start it
  again (expect `resumed: true`), end the run - with expected status codes.

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
