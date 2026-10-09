# TASK qol-gate-r1: Gate fuel - fresh lanes, tokens sweep, schema vs migration for the QOL wave (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Pre-main gate for the quality-of-life wave: branch `quality-of-life-updates`,
61 commits ahead of `main` @ `b5c6777`. This is a REPORT lane for the
reviewing seat: no code changes, no git operations. Your report is search
fuel; the reviewer makes every judgment.

FILES TO TOUCH:
- REPORT-QOL-GATE-R1.md at the repo root (new, the ONLY file you write)
Do NOT modify, create or delete anything else. No `npm install`, no
`prisma migrate`, no `prisma generate`, no DB connection of any kind.

CHANGE (report only, write each section with verbatim command output):

1. **Fresh lanes.** From `server/`: `npm run test:unit`. From `client/`:
   `npm run build`. From the repo root: `node scripts/check-hex.mjs`. Paste
   the summary lines verbatim (and any failure in full).
2. **Module graph loads.** From `server/`, run
   `node -e "process.env.NODE_ENV='test'; require('./src/app.js'); console.log('app.js loaded')"`
   and paste the output. If it fails on a missing env var only, say so and
   paste the error; do NOT create a `.env`.
3. **Tokens-only sweep across the WHOLE wave.** From
   `git diff b5c6777...HEAD -- 'client/src/**/*.css' 'client/src/**/*.jsx' 'client/src/**/*.js'`:
   - list every ADDED line outside `client/src/index.css` that contains a
     raw colour (`#` hex, `rgb(`, `rgba(`, `hsl(`, or a named colour like
     `white`/`black` used as a colour value), with file:line;
   - list every `var(--...)` name used on an ADDED line and whether it is
     defined anywhere in `client/src/index.css` or `client/src/styles/**`
     (name -> defining file:line, or UNDEFINED). Names that are set inline
     from JS (search `setProperty("--` and `style={{ "--`) count as defined;
     say where.
4. **Schema vs migration.** Read `server/prisma/schema.prisma` and
   `server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql`.
   For every model/field/index/FK the wave added or changed in
   `schema.prisma` (`git diff b5c6777...HEAD -- server/prisma/schema.prisma`),
   say which SQL statement creates it. Flag: any schema change with NO
   matching SQL; any SQL with no matching schema change; any FK `ON DELETE`
   that differs from the schema's `onDelete`; any NOT NULL column added to
   an EXISTING table without a default; any `DROP`. Report the migration
   file's line endings (byte check for `\r\n`).
5. **Dead code left by the wave.** For each of these identifiers, grep
   `client/src` and `server/src` and report every remaining reference with
   file:line (or "none"): `RirRpeToggleRow`, `notesPillLabel`,
   `SlidersIcon`, `training-prefs-pill`, `window.confirm`, `confirm(` (bare
   call), `alert(`. Then list every CSS class selector ADDED in the wave in
   `client/src/styles/training-prefs.css`, `logger.css`, `workout-bar.css`,
   `rest-timer.css`, `confirm.css`, `coach-page.css`, `coach-history.css`,
   `whats-new.css` that is referenced by NO `.jsx`/`.js` file under
   `client/src` (class -> css file:line).
6. **Cross-doc consistency.** Read `AGENTS.md`, `CLAUDE.md`,
   `docs/HANDOFF.md`, `docs/tasks/QUEUE.md` (the QOL section only),
   `docs/specs/quality-of-life-wave.md`, `docs/RUNBOOK.md`. List every
   statement that contradicts another of these files or the code on this
   branch (quote both sides with file:line). Examples to check: unit
   counts (N), the migration name, which env vars are needed on prod
   (`COACH_KEY_SECRET`), the What's New release id and date.

ACCEPTANCE CRITERIA (machine-checkable):
- `REPORT-QOL-GATE-R1.md` exists with sections 1-6, each with verbatim
  output or file:line evidence.
- `git status --porcelain` shows ONLY `?? REPORT-QOL-GATE-R1.md` (paste it
  at the end of the report).

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
