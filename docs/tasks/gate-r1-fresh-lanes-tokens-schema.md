# TASK gate-r1: Gate fuel - fresh lanes, tokens sweep, module load, schema vs migrations (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Pre-main gate for `ai-connector-wave` (BK + bkr + sr3 waves, 142 commits ahead
of `main` @ `7d3b91e`). This is a REPORT lane for the reviewing seat: no code
changes, no git operations. Your report is search fuel; the reviewer makes
every judgment.

FILES TO TOUCH:
- REPORT-GATE-R1.md at the repo root (new, the ONLY file you write)
Do NOT modify, create or delete anything else. No `npm install`, no
`prisma migrate`, no `prisma generate` writes outside node_modules you
already have, no DB connection of any kind.

CHANGE (report only, write each section with verbatim command output):

1. **Fresh lanes.** From `server/`: `npm run test:unit`. From `client/`:
   `npm run build`. Paste the summary lines verbatim (and any failure in
   full).
2. **Module graph loads.** From `server/`, run
   `node -e "process.env.NODE_ENV='test'; require('./src/app.js'); console.log('app.js loaded')"`
   and paste the output. If it fails on a missing env var only, say so and
   paste the error; do NOT create a `.env`.
3. **Tokens-only sweep across the WHOLE wave.** `git diff 7d3b91e...HEAD --
   'client/src/**/*.css' 'client/src/**/*.jsx' 'client/src/**/*.js'` and list
   every ADDED line outside `client/src/index.css` that contains a raw colour
   (`#` hex, `rgb(`, `rgba(`, `hsl(`, or a named colour like `white`/`black`
   used as a colour value), with file:line. Then list every `var(--...)` name
   ADDED in the wave diff and whether it is defined anywhere in
   `client/src/index.css` or `client/src/styles/**` (name -> defining file, or
   UNDEFINED).
4. **Schema vs migrations.** Read `server/prisma/schema.prisma` and the two
   new migrations `server/prisma/migrations/20260929120000_blocks_v2/migration.sql`
   and `.../20261006200000_block_exercise_per_side/migration.sql`. For every
   model/field/index/FK the wave added or changed in `schema.prisma`
   (`git diff 7d3b91e...HEAD -- server/prisma/schema.prisma`), say which SQL
   statement creates it, and flag any schema change with NO matching SQL, any
   SQL with no matching schema change, any FK `ON DELETE` behaviour that
   differs from the schema's `onDelete`, and any NOT NULL column added to an
   existing table without a default. Also report the line endings of both
   migration files (`file` command or a byte check for `\r\n`).
5. **New runtime dependency surface.** `client/package.json` gained
   `read-excel-file`. Report where it is imported (file:line) and whether it
   is loaded lazily (dynamic `import()`) or in the main bundle.

ACCEPTANCE CRITERIA (machine-checkable):
- `REPORT-GATE-R1.md` exists with sections 1-5, each with verbatim output.
- `git status --porcelain` shows ONLY `?? REPORT-GATE-R1.md` (paste it at the
  end of the report).

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
