# TASK L1: Unilateral (per-side L/R) set logging

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Second unit of the L-wave (logging + exercise-library UX). Dispatch AFTER
L2 lands: L2 runs the integration lane, and once THIS unit's unapplied
migration is in the tree, `npm test`'s pretest would silently apply it to
staging (gated). Both units also touch `SessionDetailPage.jsx` +
`index.css`, so they serialize anyway. Single-arm /
single-leg movements are logged today as undifferentiated sets. This unit
adds a per-side logging mode: when the exercise name says "single" (or the
user flips a toggle), each logical set becomes a Left/Right pair with its
own weight/reps/RIR/RPE, and the Right side defaults its weight from the
Left side (most lifters use the same weight on both sides). Includes a
SCHEMA CHANGE (nullable `side` column on WorkoutSet) - the migration is
authored in this unit but NEVER applied by Cursor (migrations are gated,
any environment; Seth applies per RUNBOOK "Schema-change deploy").

FILES TO TOUCH:
- server/prisma/schema.prisma                       (WorkoutSet gains `side String?`)
- server/prisma/migrations/20260704120000_add_workout_set_side/migration.sql
                                                    (NEW - hand-authored, see below)
- server/src/controllers/sessionController.js       (accept + validate `side`
                                                     in createSetForSession and
                                                     updateSet)
- server/test/sessions.lifecycle.test.js            (side round-trip + 400 cases;
                                                     WRITE the tests, do NOT run
                                                     the integration lane - see
                                                     acceptance)
- client/src/pages/SessionDetailPage.jsx            (per-side mode)
- client/src/index.css                              (pair grouping + side badge)
Do NOT modify anything outside these files. In particular do NOT touch
`WorkoutTemplateTableView.jsx` (table view shows no side column in v1 -
deliberate non-goal) or anything under `server/src/analytics/` (the engine
ignores `side`; a per-side set is honestly just a set for volume purposes).

CHANGE:

1. **Schema**: `side String?` on WorkoutSet (after `notes`). Values are
   `"L"` / `"R"` enforced at the API layer, not a DB enum (codebase uses no
   Prisma enums - match that). Migration file content is exactly:
   `ALTER TABLE "WorkoutSet" ADD COLUMN "side" TEXT;`
   Run `npm run prisma:generate` (codegen only, allowed). Do NOT run any
   `prisma migrate` command in any form.

2. **Server**: `createSetForSession` and `updateSet` accept optional
   `side`. Valid: `"L"`, `"R"`, or null/absent (updateSet: explicit null
   clears it, matching how the other optional fields patch). Anything else
   -> 400 with a descriptive error, following the existing
   `validateOptionalNonNegDecimal`-style pattern (add a tiny validator,
   e.g. `validateOptionalSide`). Returned set rows include `side` (Prisma
   returns the full row already - just verify nothing strips it).

3. **Client - mode derivation** (SessionDetailPage): an exercise block is
   in per-side mode when
   `manualOverride ?? (anySetHasSide || /\bsingle\b/i.test(exerciseName))`.
   - `anySetHasSide`: any of the exercise's sets has `side` set (so a
     reloaded/resumed session stays in per-side mode without client state).
   - The name test makes "Single Arm Dumbbell Row" light up automatically
     as the user types the name (re-derive on name commit).
   - `manualOverride` is component state: a small toggle chip labeled
     "L/R" (title: "Log left/right sides separately") in the set toolbar
     row next to `PlanningSetCountControl`, visible only while the session
     is live. It lets split squats / lunges opt IN and false positives opt
     OUT. Override wins over the name test both directions.
   - Toggling affects how sets are CREATED and LABELED from now on; it
     never mutates or deletes existing sets.

4. **Client - per-side set creation**: in per-side mode, one logical set =
   two WorkoutSet rows with consecutive orders, L first then R.
   - "+ Add set" and `PlanningSetCountControl` operate on PAIRS: the
     control's value shows `Math.ceil(sideSets/2)`; incrementing creates
     an L and an R row (two `createSet` calls, orders from `nextSetOrder`),
     each copying weight/rpe/rir/notes from the previous row of the SAME
     side (reuse the existing last-set copy rules, including the
     do-NOT-copy-reps comment's intent); decrementing removes the last
     pair (both rows), with the existing filled-sets `window.confirm`
     guard treating the pair as the unit.
   - The zero-sets draft-promotion row is NOT used in per-side mode: with
     zero sets and per-side mode on, render only the "+ Add set" button
     (which creates the first blank pair). Non-per-side flow unchanged.

5. **Client - rendering + the weight default**: keep using `SessionSetRow`
   for each side row (all save semantics - debounce, blur flush,
   trackSetSave - come for free). In per-side mode:
   - Label rows `Set ${pairOrdinal} - Left` / `Set ${pairOrdinal} - Right`
     (pairOrdinal = position of the pair, 1-based) instead of
     `Set ${setOrdinal}`, plus a compact side badge (one letter, derived
     from `--color-interactive` via color-mix like the sync badge - tokens
     only). Completed sessions render the same labels/badges read-only,
     since `side` persists.
   - Group each pair visually: wrap the two rows in a
     `session-set-pair` div (tighter gap, shared left border or similar -
     restrained, ~existing card chrome, no new hex).
   - THE DEFAULT SETH ASKED FOR: when the LEFT row's weight commits (blur)
     and its paired RIGHT row's weight is still blank and the right row is
     not core-logged, autofill the right row's weight to the same value
     (local input state + persist through the normal PATCH path). One-way
     (L -> R), one-time (never overwrite a nonblank R weight), and it must
     not steal focus.
   - Per-side rows hide the per-row remove button's independent semantics:
     removing either row of a pair asks about and removes the PAIR (both
     sets) - half-pairs are confusing and break the pairing math.

6. **Pairing math**: pair sets by consecutive order within the exercise
   after sorting (existing `setsByExercise` sort): rows 0+1 are pair 1,
   rows 2+3 pair 2, etc. An odd trailing row (legacy data, mid-creation
   failure) renders as a normal unpaired row labeled with its plain set
   ordinal - degrade gracefully, never crash.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from server/ (unchanged - engine untouched).
- Client `npm run build` green.
- DO NOT run `npm test` (its pretest applies migrations - gated). Write
  the integration tests so the reviewer can run them after Seth applies
  the migration to staging: create-set with side "L" round-trips; side
  "X" -> 400; PATCH side null clears it.
- Migration file exists with exactly the one ALTER TABLE statement; no
  other schema drift in `schema.prisma` (diff shows only the `side` line).
- Manual contract (reviewer verifies in dev): typing a name containing
  "single" flips the exercise to per-side mode; the L/R toggle overrides
  both ways; add-set creates an L+R pair; entering Left weight 50 and
  blurring autofills Right weight 50 while a Right weight typed first is
  never overwritten; lowering pair count removes whole pairs with confirm
  when filled.
- No new hex colors in changed CSS; `client/package.json` and
  `server/package.json` byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
