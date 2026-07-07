# TASK a6b-exercise-id-backfill: stamp structural identity onto historical rows

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

DISPATCH GATE: only after a4-exercise-fk-linkage has LANDED and staging has
the full migration choreography applied (catalog migration + seed + linkage
migration - see QUEUE.md Active section). The script reads the new columns,
so it cannot even dry-run before that.

CONTEXT:
Track A backfill (spec section 9 calls it A6; the alias layer already took the
A6 name, hence A6b). A4 stamps identity on NEW writes only - every historical
TemplateExercise / SessionExercise / BlockWorkoutExercise row still has null
ids and analytics still resolve them by name at read time. This script walks
those rows once and persists what the resolver already knows, so history
becomes structurally identified too (and future catalog-name drift can't
silently orphan it).

FILES TO TOUCH:
- scripts/backfill-exercise-ids.mjs   (new - the only file)
Do NOT modify anything else.

CHANGE:
One idempotent script, DRY-RUN BY DEFAULT (writes only with an explicit
`--apply` flag):
1. Top of main(): call `assertSafeForReset(process.env.DATABASE_URL)` from
   `server/src/lib/dbHostGuard` (AGENTS.md rule for any new DB-connecting
   script; `server/prisma/seed.js` is the guard precedent - match how it
   loads env and constructs PrismaClient. `scripts/seed-staging-smoke.mjs`
   shows script structure but predates the guard rule - do not copy its
   missing guard).
2. For each of the three tables, select rows where BOTH `exerciseId` and
   `userExerciseId` are null. Resolve each row's `exerciseName` with the
   engine's `resolveExercise` (loadCatalog once; per-user UserExercise index
   via `buildUserExerciseIndex`, built once per user, not per row). Owner
   userId paths: TemplateExercise -> workoutTemplate.userId; SessionExercise
   -> workoutSession.userId; BlockWorkoutExercise -> blockWorkout.blockWeek
   .blockTemplate.userId.
3. Map resolution to stamps exactly like A4's helper (catalog tiers ->
   exerciseId; userExercise tier -> userExerciseId; unresolved -> leave row
   untouched). Never set both (the DB CHECK would reject it anyway).
4. Output a report: per table - scanned / resolved-by-source counts
   (exerciseId vs userExerciseId) / unresolved count, plus the distinct
   unresolved names with occurrence counts sorted desc (this list feeds
   future alias curation). In dry-run, print the would-be stamps summary and
   write NOTHING.
5. `--apply`: perform the updates (row-level or grouped updateMany - your
   choice, but inside transactions per table), then print the same report
   from what was written. Running it twice must be a no-op the second time
   (the null-ids WHERE clause guarantees it - keep it that way).

RUN RULES for this block: you may run the script in DRY-RUN against staging
(read-only) for the delivery evidence. Do NOT run `--apply` against any
environment - the reviewer applies on staging, Seth applies on prod (gated
prod data operation). Do NOT run `npm test` or any prisma migrate/db command.

ACCEPTANCE CRITERIA (machine-checkable):
- `node scripts/backfill-exercise-ids.mjs` (dry-run) completes green against
  staging; verbatim report output in DELIVERY.md.
- Running dry-run twice produces identical reports (evidence: both outputs).
- `grep -n "assertSafeForReset" scripts/backfill-exercise-ids.mjs` shows the
  guard called at the top of main().
- Grep evidence that writes are unreachable without `--apply` (the update
  call sites are inside the apply branch).
- The unresolved-names list appears in the report (empty is fine if staging
  resolves everything).
- No other file modified; `npm run test:unit` still green from server/
  (nothing it covers changed - cheap regression check).

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
