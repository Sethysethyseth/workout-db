# TASK L3: User-defined exercises - schema, API, resolver overlay

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Third unit of the L-wave (dispatch AFTER L1 lands AND Seth has applied
L1's migration to staging - this unit adds migration #2 of the wave and
runs nothing that applies either; see acceptance). Closes long-standing
issue #4 (user-defined exercise support - Bulgarian split squat, Pendlay
row, and anything else missing upstream): when a user's exercise name
doesn't resolve against the catalog, they can add it to THEIR library with
per-muscle intensities, and the analytics engine attributes it exactly
like a catalog exercise. Schema and precedence below are Fable-designed -
implement as specified, bounce if the spec conflicts with reality rather
than improvising. The UI for this lands separately (L4); this unit is
schema + API + engine overlay only.

FILES TO TOUCH:
- server/prisma/schema.prisma                    (UserExercise model + User relation)
- server/prisma/migrations/20260704130000_add_user_exercise/migration.sql (NEW, hand-authored)
- server/src/controllers/exerciseController.js   (extend L2's controller: CRUD + vocabulary + resolve overlay)
- server/src/routes/exerciseRoutes.js            (new routes)
- server/src/analytics/userExercises.js          (NEW - pure overlay helpers)
- server/src/analytics/resolve.js                (accept an optional user overlay)
- server/src/analytics/attribution.js            (attribute userExercise resolutions)
- server/src/analytics/enrichSet.js + summary.js (thread the overlay through options)
- server/src/controllers/analyticsController.js  (fetch user's exercises, pass into buildSummary)
- server/test/analytics/userExercises.test.js    (NEW - pure, unit lane)
- server/test/exercises.integration.test.js      (extend L2's file; WRITE, do not run)
Do NOT modify anything outside these files. Engine purity rule holds: NO
Prisma/DB imports under `server/src/analytics/` - user exercises enter the
engine as plain data through function arguments only (grep enforced).

CHANGE:

1. **Schema** (exact design):
   ```prisma
   model UserExercise {
     id             Int      @id @default(autoincrement())
     userId         Int
     user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     name           String
     normalizedName String
     muscles        Json     // { "<muscle>": "primary" | "secondary" }
     createdAt      DateTime @default(now())

     @@unique([userId, normalizedName])
     @@index([userId])
   }
   ```
   Migration hand-authored (CREATE TABLE + the unique index + index + FK,
   matching how existing migrations render these). Run
   `npm run prisma:generate` only; NO `prisma migrate` in any form.
   Storing primary/secondary designations (not weights) is deliberate:
   it is the user's source of truth, and the engine already owns the
   designation->weight math (see 4).

2. **Muscle vocabulary**: the 17 catalog muscles (distinct
   primary+secondary values in `server/data/exercises.json`):
   abdominals, abductors, adductors, biceps, calves, chest, forearms,
   glutes, hamstrings, lats, lower back, middle back, neck, quadriceps,
   shoulders, traps, triceps. Expose
   `GET /api/exercises/muscles` (authRequired) -> `{ muscles: [...] }`,
   derived at runtime from `loadCatalog()` (single source; do not
   hardcode the list in the server - the block lists it so you can assert
   against it in tests).

3. **CRUD API** (all authRequired, all scoped `where: { userId }` - this
   is a cross-user isolation surface, test it as one):
   - `POST /api/exercises/custom` `{ name, muscles }` -> 201 `{ userExercise }`.
     Validation, each its own descriptive 400: name required, trimmed,
     <= 120 chars; `normalizeExerciseName(name)` must be nonempty; name
     must NOT already resolve against the catalog ("already tracked as
     <canonicalName>") nor collide with one of the user's existing
     normalizedNames; `muscles` must be a plain object, 1..17 entries,
     every key in the vocabulary, every value "primary" or "secondary",
     at least one "primary".
   - `GET /api/exercises/custom` -> `{ userExercises: [...] }` (own only,
     name asc).
   - `DELETE /api/exercises/custom/:id` -> 204 own / 404 not-own-or-missing
     (the standard not-found-shaped isolation response used elsewhere).
   - L2's `POST /api/exercises/resolve` now also consults the caller's
     UserExercise rows: unresolved-in-catalog names that match a user
     exercise return `resolved: true, source: "userExercise",
     catalogId: null, canonicalName: <user exercise name>` (extend the
     response with `source`; catalog hits say `source: "catalog"`).

4. **Engine overlay** (pure):
   - `userExercises.js`: `buildUserExerciseIndex(rows)` -> Map of
     normalizedName -> `{ id, name, muscles }` (rows are plain objects the
     controller passes; tolerate junk rows by skipping them), and
     `userExerciseWeights(designations)` -> normalized fractional weights
     using EXACTLY the existing fallback convention in `attribution.js`
     (primary 1.0, secondary 0.5, divide by total) so a user exercise and
     an uncurated catalog exercise are attributed by the same math.
   - `resolveExercise(input, catalog, userIndex)` (new optional third
     arg, default empty): catalog match FIRST (canonical wins), then
     userIndex by normalized name ->
     `{ resolved: true, source: "userExercise", userExercise: {...} }`.
   - `attributeSet` handles `source === "userExercise"` via
     `userExerciseWeights`; `source: "userExercise"` appears in the
     attribution result like "muscleWeights"/"primarySecondaryFallback" do.
   - Thread `userIndex` through `enrichSet` -> `buildSummary(sets,
     { from, to, planLookup, userExercises })` following how `planLookup`
     already flows. Per-exercise aggregation keys: user exercises group by
     a synthetic stable id `user:<id>` so they can't collide with catalog
     ids.
   - `analyticsController.getSummary`: one `userExercise.findMany({ where:
     { userId } })` alongside the session fetch, passed as plain rows.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from server/, including new pure tests:
  weights math (`{a: primary, b: secondary}` -> `{a: 2/3, b: 1/3}`);
  catalog-beats-user precedence on a colliding name; a set logged under a
  user exercise name lands its fractional volume in `buildSummary`
  perMuscle; unresolved without overlay stays unresolved with one.
- Purity grep: `grep -rn "prisma\|@prisma" server/src/analytics/` -> no hits.
- DO NOT run `npm test` (pretest applies the unapplied migration - gated).
  Write integration tests for: custom CRUD happy path; user B cannot see
  or delete user A's exercise (404 shape); POST rejects a catalog-
  resolvable name; resolve endpoint returns the userExercise source; the
  analytics summary includes a custom exercise's volume end-to-end.
- Migration file creates exactly the model above; `schema.prisma` diff
  shows only UserExercise + the User relation line.
- Client untouched (`git status` shows no client/ changes).
- `server/package.json` byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
