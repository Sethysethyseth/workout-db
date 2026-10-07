# TASK sr3-5: "Per side" on block exercises - builder switch, logger default, Format v1 (one migration)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3 item 7. Seth (Oct 6): in the block builder, choosing a
single-leg exercise "didnt populate as a single", and a custom exercise
can't be made single at all. Seth ruled: a Per-side switch backed by ONE
small DB field. Today per-side exists only in LOGGING: the block logger
(`client/src/components/blocks/log/BlockExerciseCard.jsx`) and the normal
logger (`SessionDetailPage.jsx`) both call `derivePerSideMode(override,
name, sets)` from `client/src/components/blocks/log/perSideMode.js` - a
manual override wins, else existing L/R sets, else the name rule
`exerciseNameImpliesPerSide` (one-arm / one-leg / single-arm|leg|dumbbell /
unilateral). The builder has no per-side concept and the schema has no
per-side field anywhere (`BlockWorkoutExercise`, `UserExercise`,
`Exercise`). Pattern to follow BY NAME end to end: `effortCap` - it is an
optional boolean on block exercises that already flows through the
normalizer (`templateExerciseNormalize.js`), the store
(`blockTemplateStore.js`), the plan snapshot (`blockRunLogic.js`
`buildSessionFromBlockWorkout`), Format v1 (`blockFormat.js`,
`blockFormatMapping.js`, `aiFormatPrompt.js`). `perSide` differs in ONE way:
it is tri-state - `null` = automatic (name rule), `true` / `false` =
explicit.

FILES TO TOUCH:
- server/prisma/schema.prisma            (`BlockWorkoutExercise.perSide Boolean?`)
- server/prisma/migrations/20261006200000_block_exercise_per_side/migration.sql (new)
- server/src/lib/templateExerciseNormalize.js
- server/src/blocks/blockTemplateStore.js
- server/src/controllers/blockTemplateController.js  (only if clone or
  update needs an explicit field)
- server/src/blocks/blockRunLogic.js
- server/src/blocks/blockFormat.js
- server/src/blocks/blockFormatMapping.js
- server/src/blocks/aiFormatPrompt.js
- tests under server/test/lib/ (block format, persistence, run logic)
- client/src/components/blocks/builder/blockBuilderState.js
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/log/BlockExerciseCard.jsx
Do NOT modify anything outside these files. In particular NOT
`BlockBuilder.jsx`, any CSS file, or `client/src/components/blocks/ui/`
(another unit edits those in parallel) - reuse the existing chip markup and
classes the exercise card already renders; if an "on" look truly needs new
CSS, stop and say so in DELIVERY.md instead of adding it.

CHANGE:

1. **Schema + migration.** `perSide Boolean?` on `BlockWorkoutExercise`
   (nullable, NO default). Write the migration SQL OFFLINE with
   `npx prisma migrate diff` (from the current schema file to the new one,
   `--script`), exactly one statement:
   `ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "perSide" BOOLEAN;`.
   NEVER run `prisma migrate dev/deploy/reset` or anything that connects to
   a database - there is no DB here and applying it is the reviewer's job
   under a trigger phrase. Run `npx prisma generate` so the client types
   know the field.
2. **Server.** The block exercise normalizer accepts `perSide`:
   `undefined`/`null` -> `null`; `true`/`false` -> kept; anything else ->
   400 `perSide must be a boolean when provided`. The store persists it on
   create and on weeks PATCH; GET returns it; clone keeps it.
   `buildSessionFromBlockWorkout` writes `perSide` (`true`/`false`/`null`)
   into the session `plan` JSON next to `effortCap`.
3. **Format v1.** Optional exercise field `perSide` (boolean). Validator:
   non-boolean -> error at `<exercise path>.perSide` with `optional
   boolean`. Format -> create payload carries it; block tree -> format
   emits it ONLY when it is not null (so existing exports are unchanged).
   AI instructions list it next to effortCap with one line: `perSide true =
   log each side separately (one-arm / one-leg work); omit to let the app
   decide from the name.` and the JSON schema gets `perSide: { type:
   "boolean" }`.
4. **Builder state** (`blockBuilderState.js`): each exercise carries
   `perSide` (`null` default); hydrate from the API; serialize to the
   payload; a new exercise and a replaced exercise start at `null`;
   duplicate copies it.
5. **Builder card** (`ExerciseCard.jsx`): the expanded card's value-chip
   row gets a `Per side` chip. Displayed state = `exercise.perSide` when not
   null, else `exerciseNameImpliesPerSide(exercise name)` (import it from
   `../log/perSideMode.js` - do not copy the rule). Tapping flips the
   DISPLAYED state and stores it as explicit (`onChange({ perSide: !shown
   })`). `aria-pressed` reflects the displayed state; the chip reads as on
   using the existing chip "on"/accent treatment the card already uses for
   a set value. The collapsed card's one-line prescription summary ends with
   ` · each side` when the displayed state is on. Read-only cards show the
   state but cannot flip it.
6. **Block logger** (`BlockExerciseCard.jsx`): the default for per-side
   mode becomes the plan's explicit value. Pass `plan.perSide` as the
   override when the lifter has not toggled the logger's own "Per side"
   chip in this session, i.e. `derivePerSideMode(perSideOverride ??
   plan?.perSide ?? null, name, sets)`. The logger's chip keeps working as
   today. Normal (non-block) logging is untouched.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with tests for:
  - normalizer: `perSide` absent -> `null`; `true` -> `true`; `"yes"` ->
    400 with `perSide must be a boolean when provided`.
  - `validateBlockDraft`: exercise `perSide: true` -> ok and kept;
    `perSide: "x"` -> error path ending `.perSide`.
  - mapping round trip: a tree exercise with `perSide: true` exports
    `perSide: true`; with `perSide: null` the exported exercise has NO
    `perSide` key.
  - `buildSessionFromBlockWorkout`: plan carries `perSide` true / false /
    null from the block exercise.
  - `BLOCK_FORMAT_JSON_SCHEMA` has `perSide` with type boolean.
- `migration.sql` contains exactly the one ALTER TABLE statement above;
  `git diff server/prisma/schema.prisma` shows only the one new field.
- `node -e "require('./src/app.js')"` from `server/` loads with a
  placeholder `DATABASE_URL` (module graph check; say what you used).
- `npm run build` from `client/` compiles with no errors;
  `node scripts/check-hex.mjs` clean; no CSS files in the diff.
- DELIVERY.md shows the builder card at 390px from a local run against a
  non-prod API or stub (`client/.env` is PRODUCTION - never use it):
  "Single-Leg Calf Raise" shows `Per side` on and the summary ends
  `· each side`; "Back Squat" shows it off; tapping flips each.

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
