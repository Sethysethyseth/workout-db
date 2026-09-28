# TASK BK1: blocks v2 schema, new block fields end to end, one create path, clone isolation fix

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
First unit of the blocks-v2 wave. Design of record: `docs/specs/blocks-v2.md`
- read sections 1, 3.1, 3.3, 6 and 12 before starting. This unit lands the
wave's ONLY schema change (every later unit builds on it) and teaches the
existing block API to persist and return the new fields. It is
MIGRATION-CARRYING: you WRITE the migration file; you never apply it (no
`prisma migrate`, no database - the lane has none).

Three more things ride here because they live in the same controller:
(1) the block create path becomes ONE exported function every later writer
(import, connector) calls; (2) a draft-accept endpoint; (3) an isolation
fix: `cloneBlockTemplate` copies the SOURCE block's `exerciseId` /
`userExerciseId` without re-stamping (`blockTemplateController.js` clone,
~lines 544-571), so cloning someone's PUBLIC block leaves foreign keys into
the donor's PRIVATE custom exercises in the cloner's rows.

FILES TO TOUCH:
- `server/prisma/schema.prisma`   (every field and model in spec section 6,
                                    nothing else)
- `server/prisma/migrations/20260929120000_blocks_v2/migration.sql` (NEW)
- `server/src/blocks/blockTemplateStore.js` (NEW - the one create path)
- `server/src/lib/templateExerciseNormalize.js` (new block fields)
- `server/src/lib/exerciseIdentity.js` (only if the clone re-stamp needs a
                                    helper here)
- `server/src/controllers/blockTemplateController.js`
- `server/src/routes/blockTemplateRoutes.js` (the accept route)
- `server/test/lib/blockPersistenceV2.test.js` (NEW)
Do NOT modify anything outside these files.

CHANGE:
1. **Schema + migration.** Add exactly spec section 6: `BlockTemplate.isDraft`
   / `source` / `sourceUnit` / `runs`; `BlockWeek.label`; `BlockWorkoutExercise.restSec` /
   `effortCap`; `BlockWorkoutSet.repsMax` / `durationSec`;
   `WorkoutSet.durationSec`; `WorkoutSession.blockRunId` / `blockRun` /
   `blockWeekOrder` / `blockWorkoutOrder` + index; `SessionExercise.plan`;
   the new `BlockRun` model; `AiConsent.blockDraftsAllowedAt`; the `User`
   back-relation. Generate the SQL offline rather than hand-writing it:
   save the pre-change schema (`git show HEAD:server/prisma/schema.prisma`)
   to a temp file OUTSIDE the repo and run `npx prisma migrate diff
   --from-schema-datamodel <old> --to-schema-datamodel
   prisma/schema.prisma --script` from `server/` (needs no database). If
   the command refuses in this Prisma version, hand-write SQL in Prisma's
   conventions (quoted identifiers, `<Model>_<field>_fkey` constraints,
   `<Model>_<field>_idx` indexes) and say so in DELIVERY.md. The file must
   contain only CREATE TABLE / ADD COLUMN / CREATE INDEX / ADD CONSTRAINT -
   no DROP, no type change to an existing column.
2. **The one create path.** Move the body of `createBlockTemplate` (after
   auth) into `createBlockTemplateForUser(userId, body, { source, isDraft })`
   exported from `server/src/blocks/blockTemplateStore.js`: normalize with
   the existing `templateExerciseNormalize.js` functions, stamp identity
   with `stampBlockWeeksArray` against THIS user's `UserExercise` rows,
   write `source` (default `"builder"`) and `isDraft` (default `false`),
   return the same tree shape the controller returns today. The HTTP create
   calls it with defaults; `source` and `isDraft` are NEVER read from
   `req.body` anywhere in the controller.
3. **New fields, end to end** (normalize -> create/update -> response),
   following the rules in spec section 3.1: week `label` (trimmed, max 40,
   empty -> null); exercise `restSec` (integer 0-3600) and `effortCap`
   (boolean, default false); set `repsMax` (> `reps`, requires `reps`) and
   `durationSec` (integer 1-3600, never together with `reps`). Invalid ->
   the same 400 shape the normalizer already uses. Existing field rules are
   unchanged. `targetReps` derivation (normalizer, ~lines 146-164) learns the
   new shapes: uniform range -> `"8-10"`, uniform timed -> `"45s"`, mixed ->
   today's `" / "` join of each set's text. Update (`PATCH`) persists the
   same fields (it replace-alls weeks today - keep that).
4. **Drafts.** `POST /block-templates/:id/accept` - owner only (same
   `findFirst({ id, userId })` idiom as update), sets `isDraft false`,
   returns the block, idempotent, 404 for non-owners and missing ids. A
   draft can never be public: a `PATCH` setting `isPublic: true` while
   `isDraft` is true -> 409 `{ error: "Save the draft to your library
   first." }`.
5. **Clone isolation fix.** Clone builds its payload from the source tree's
   exercise NAMES and new fields (never its ids) and goes through
   `createBlockTemplateForUser` for the CLONER, so identity is re-stamped
   against the cloner's library. Clones are `source "builder"`,
   `isDraft false`, `isPublic false` (as today). Put the id-stripping in a
   pure exported helper (e.g. `buildClonePayload(sourceTree)`) so it is
   unit-testable.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (paste the summary line).
- `npx prisma validate` and `npx prisma generate` succeed from `server/`.
- `server/test/lib/blockPersistenceV2.test.js` pins, at minimum:
  - week `{ label: "  Deload " }` -> `"Deload"`; `{ label: "" }` -> null;
    41 characters -> rejected.
  - exercise `restSec: 90` kept; `restSec: -1` and `restSec: 3601` rejected;
    `effortCap` absent -> false.
  - set `{ reps: 8, repsMax: 10 }` kept; `{ reps: 10, repsMax: 8 }`
    rejected; `{ repsMax: 10 }` rejected; `{ durationSec: 45 }` kept;
    `{ reps: 8, durationSec: 45 }` rejected; `{ durationSec: 0 }` rejected.
  - `targetReps`: three sets `{reps 8, repsMax 10}` -> `"8-10"`; three sets
    `{durationSec 45}` -> `"45s"`; `{reps 5}` + `{reps 3}` -> `"5 / 3"`.
  - `buildClonePayload` on a tree whose exercises carry `exerciseId` and
    `userExerciseId` returns a payload containing neither key anywhere, and
    keeps name, notes, label, restSec, effortCap, repsMax, durationSec.
- `grep -n "req.body" server/src/controllers/blockTemplateController.js`
  shows no read of `source` or `isDraft`.
- `grep -c "DROP" server/prisma/migrations/20260929120000_blocks_v2/migration.sql`
  prints 0; the file creates `BlockRun` and adds every column in spec
  section 6 (list each in DELIVERY.md with its SQL line).
- `node -e "require('./src/app.js')"` from `server/` exits 0 (the module
  graph loads - a green unit lane does not prove a route).

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
