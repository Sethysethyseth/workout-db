# TASK a4-exercise-fk-linkage: structural exercise identity on the three name-carrying models

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

CONTEXT:
Track A unit A4 (spec: `docs/specs/analytics-engine.md` section 9). Today an
exercise's identity is the `exerciseName` string; analytics resolve it by
name/alias matching at read time and unresolved rows silently drop out of
metrics. This unit adds nullable FK identity columns so identity becomes
structural: rows point at either a catalog `Exercise` (A1, landed `3a6bc25` -
the model exists in schema.prisma) or the user's own `UserExercise` (L3).
`exerciseName` stays NOT NULL and remains the display string everywhere - the
FKs are an annotation layer, and every behavior must degrade to today's
name-resolution when they are null.

FILES TO TOUCH:
- server/prisma/schema.prisma                    (columns + relations below)
- server/prisma/migrations/20260707130000_add_exercise_fk_linkage/migration.sql
                                                 (handwritten SQL - you must NOT
                                                  run prisma migrate dev/deploy;
                                                  L1/L3 precedent)
- server/src/lib/exerciseIdentity.js             (new shared stamping helper)
- server/src/controllers/templateController.js   (stamp on create/update)
- server/src/controllers/sessionController.js    (copy-through + stamp)
- server/src/controllers/blockTemplateController.js (stamp on create/update)
- server/src/controllers/analyticsController.js  (select + pass ids to engine)
- server/src/analytics/resolve.js                (userExerciseId tier)
- server/src/analytics/userExercises.js          (byId index)
- server/src/analytics/enrichSet.js              (plumb ids into resolution input)
- server/src/analytics/index.js                  (only if exports change)
- server/test/analytics/**                       (unit lane tests)
- server/test/**                                 (integration tests - WRITTEN,
                                                  NOT RUN; see sequencing flag)
Do NOT modify anything outside these files. No client changes in this unit.

CHANGE:

1. SCHEMA (this part is the spec - use these exact types; note UserExercise.id
   is Int autoincrement and Exercise.id is String, and L3's block once carried
   a wrong FK type, so do not improvise here). Add to each of TemplateExercise,
   SessionExercise, BlockWorkoutExercise:

   ```prisma
   exerciseId     String?
   exercise       Exercise?     @relation(fields: [exerciseId], references: [id], onDelete: SetNull)
   userExerciseId Int?
   userExercise   UserExercise? @relation(fields: [userExerciseId], references: [id], onDelete: SetNull)

   @@index([exerciseId])
   @@index([userExerciseId])
   ```

   plus the three back-relation lists each on `Exercise` and `UserExercise`.
   Additionally add to WorkoutSet (schema groundwork ONLY - nothing writes it
   yet; block execution does not exist and this unit must not invent it):

   ```prisma
   blockWorkoutSetId Int?
   blockWorkoutSet   BlockWorkoutSet? @relation(fields: [blockWorkoutSetId], references: [id], onDelete: SetNull)

   @@index([blockWorkoutSetId])
   ```

   with the back-relation on BlockWorkoutSet. Rationale for reviewers: this
   future-proofs plan-vs-actual for block plans (see the honest-gap comment at
   the top of `server/src/analytics/planVsActual.js`) inside the same gated
   migration instead of costing a second one.

2. MIGRATION SQL: additive only - 7 nullable columns, FKs (ON DELETE SET NULL
   ON UPDATE CASCADE, matching existing migrations' style), the 7 indexes, and
   one CHECK constraint per exercise-carrying model enforcing at-most-one
   identity, e.g.:

   ```sql
   ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_one_identity_chk"
     CHECK ("exerciseId" IS NULL OR "userExerciseId" IS NULL);
   ```

   (CHECK is raw-SQL-only - Prisma can't express it; that is deliberate.)
   No data rewrite, no NOT NULL, no defaults.

3. WRITE-PATH STAMPING - new helper `server/src/lib/exerciseIdentity.js`.
   Contract: given an exercise name and the user's UserExercise rows (shape
   your own API - but it must reuse `resolveExercise` and
   `buildUserExerciseIndex` from `server/src/analytics`, not reimplement
   matching, and must let batch callers build the user index ONCE), return
   `{ exerciseId, userExerciseId }` where catalog resolution (exact/alias/fold)
   wins over userExercise, mirroring resolveExercise's tier order; unresolved
   -> both null. Wire it in:
   - templateController: TemplateExercise create + any name update.
   - blockTemplateController: BlockWorkoutExercise create + any name update.
   - sessionController: session-start-from-template COPIES the two id columns
     from each TemplateExercise row verbatim (no re-resolve - the tx at
     sessionController.js ~line 123 `sessionExercise.createMany`); ad-hoc
     addSessionExercise (~line 278) and the rename path (~line 407) resolve
     via the helper.
   - exerciseController createCustomExercise: NO change here - historical rows
     get ids from the A6b backfill, not this unit.
   Stamping must never reject a write: resolution failure means null ids, same
   user experience as today.

4. READ PATH (analytics): analyticsController's set query additionally selects
   the id columns from sessionExercise and templateExercise and passes them
   through enrichSet into resolution input. Precedence between
   sessionExercise-vs-templateExercise identity mirrors EXACTLY the existing
   exerciseName derivation precedence for a set - do not invent a new rule.
   resolveExercise gains one tier: stored `userExerciseId` resolves via a byId
   user index (extend `buildUserExerciseIndex` - both existing callers and
   their tests updated) immediately after the existing exerciseId tier;
   stored-id resolution beats all name tiers even when the name string has
   drifted. A stale/unknown stored id (deleted UserExercise arrives as null
   via SetNull, but a bogus catalog id can still occur) falls through to the
   name tiers, never throws.

5. TESTS: unit lane covers the new resolver tier (stored exerciseId beats
   name; stored userExerciseId beats name; unknown ids fall through; null ids
   behave exactly as before - assert at least one pre-existing fixture result
   is byte-identical). Integration tests cover stamping on template create,
   session-from-template copy-through, ad-hoc session exercise, and the CHECK
   constraint rejecting an insert with both ids set - WRITTEN but NOT RUN
   (below).

CRITICAL SEQUENCING FLAG (same class as L1/L3, sharper): once the Prisma
client regenerates from this schema, EVERY read of templates, sessions, and
blocks selects the new columns - deploying this code before the migration is
applied breaks the entire app, not one feature. Additionally the stamped FK
VALUES reference Exercise rows, so staging must have BOTH the A1 catalog
migration (`20260707120000_add_exercise_catalog`) + `npx prisma db seed` AND
this migration applied - in that order - before this code deploys or the
integration lane runs. Do NOT run `npm test` (its pretest auto-applies
migrations - that is the migration gate by side effect) and do NOT run any
prisma migrate/db command. Unit lane + `npx prisma validate` only.

ACCEPTANCE CRITERIA (machine-checkable):
- `npx prisma validate` green from server/.
- `npm run test:unit` green from server/, including the new resolver-tier
  tests described in CHANGE 5.
- Migration SQL contains exactly 7 ADD COLUMN statements, 7 new indexes, 7 FK
  constraints (all SET NULL), and 3 CHECK constraints; grep shows no DROP, no
  NOT NULL, no DEFAULT in it.
- `grep -rn "prisma" server/src/analytics/` shows no Prisma import added -
  the engine stays pure (existing hits, if any, unchanged).
- Session-start-from-template copy-through is visible in the sessionController
  diff (id columns in the createMany data) and covered by a written
  integration test.
- Integration lane NOT run; DELIVERY.md states this and cites this block's
  sequencing flag as the reason.
- No client file touched; `git status` shows changes only in FILES TO TOUCH.

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
