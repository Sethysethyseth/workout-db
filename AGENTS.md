# AGENTS.md  (LogChamp - shared-state bridge)

> Cursor + Claude Code read this at session start. Claude maintains the
> "current state" and "next up" sections. This is the file-based bridge that
> keeps both agents in sync - no metered automation.

---

## Project conventions (for any agent working here)

- Stack: React/Vite (Vercel) . Express/Prisma 6/Node (Render, config in
  `prisma.config.ts` not `package.json`) . PostgreSQL (Neon, separate prod +
  staging) . repo Sethysethyseth/workout-db.
- Run dev: server (`server/`) - `npm install`, `.env` from `.env.example`,
  `npm run prisma:generate`, `npm run prisma:migrate`, `npm run dev` (port
  3000). Client (`client/`) - `npm install`, `npm run dev` (port 5173, calls
  :3000 by default).
- Tests: `npm test` from `server/`. Integration suite is flaky on shared
  staging (FK pollution, not the code under test) - check whether `main` fails
  the same way before treating a failure as a regression.
- Match existing component/file patterns; don't invent new styles.
- Scope discipline: only touch files named in the current task. Don't refactor
  unrelated code. Stop when acceptance criteria are met. Anti-goals worth
  knowing before expanding scope: no max-data-for-its-own-sake, no
  over-built motion (restraint over flashy).
- Rename boundary: WorkoutDB -> LogChamp is DISPLAY-LAYER ONLY. Never rename
  for a rebrand - repo/remote, service names, env vars, `package.json` name
  fields, cookie/localStorage keys (`workoutdb.sid`, `workoutdb-theme`,
  `workoutdb-palette`), route paths, component filenames, CSS class prefixes,
  migration content.
- ASCII-only commit messages, hyphens not em-dashes. Stage individually, never
  `git add .`. PowerShell: `;` not `&&`.

## UI architecture - palettes/tokens (load-bearing, mirrors CLAUDE.md)

- Two axes on `<html>`: `data-theme` (light/dark/system) x `data-palette`
  (`champ | iron | forest | crimson`). Absent/unknown palette renders as champ.
- Tokens-only - never hardcode colors. New colors go through the CSS custom
  properties in `client/src/index.css` so all 4 palettes x 2 modes render
  correctly.
- Accent-adjacent states (rings, nav-active, pills) derive from
  `--color-interactive` via `color-mix`. Palette surfaces are hand-authored
  hexes per palette, not algorithmic tints.
- `card--live` (accent L-bar) means exactly one thing: a live in-progress
  workout. Don't reuse it for other emphasis.
- Scene layer is `body::before` (full-viewport, `z-index 0`); `#root` is
  `position: relative; z-index: 1` - check anything rendered via portal
  against this stacking.

## Command-running gate (HANDS-OFF by default)

Default is HANDS-OFF. Agents (Cursor, Claude Code) run commands freely WITHOUT
asking - including staging files, local commits, AND `git push` to staging.
Only the items below stop and ask first. Everything not listed runs automatically.

ASK BEFORE RUNNING (the short gate):

1. MERGE INTO `main` - always a manual human step. Never auto-merge.
2. PRODUCTION touches - prod Neon (`ep-solitary-sea-an56mioq`), prod Render
   (`workout-db-l3gc`), any prod data operation, or any `git push` that deploys
   to production. Staging pushes are fine; prod-bound pushes ask first.
3. MIGRATIONS - ANY environment. Separate manual track. Code push != DB migrate.
   A bad migration corrupts live data and is not locally reversible.
4. LOCAL-DESTRUCTIVE / IRREVERSIBLE ops - `reset --hard`, `git clean`,
   `push --force`, branch deletion. These can destroy work on disk.
5. DEPENDENCY installs - anything mutating `package.json` / lockfiles.

Everything else - reads, dev server, scoped file edits, branch creation,
individual staging, local commits, and pushes to staging - runs without asking.

Schema changes specifically: DB migration always lands before the code that
depends on it deploys (code-ahead-of-DB crashes prod login). Exact steps:
`docs/RUNBOOK.md` -> "Schema-change deploy."

> This gate is duplicated verbatim in CLAUDE.md so both agents see it. Change
> one, change both in the same edit - they must never disagree.

## Current state

<Claude keeps this current.>
- DONE  champ + iron palette scenes wired and tuned at design fidelity
- DONE  shared pixel-art chrome (crown, notched cards, dumbbell, glints) - all
        five palettes inherit
- DONE  notch invisibility bug - root-caused (equal-specificity cascade
        collision) and fixed via compound selector
- TODO  forest scene raster -> forest.jpg, then wire
- TODO  crimson scene raster (band-model crop) -> crimson.jpg, then wire
- TODO  chill scene wiring (raster exists)
- TODO  empty middle dead-zone between Start Workout and Recent workouts (layout call)

## Next up (the active task)

<Claude drops the current Cursor task block here, or a one-line pointer.>

## Notes / gotchas discovered

- A commit can land locally while a redeploy rebuilds the OLD HEAD until the
  push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual - smoke on device.
- When bumping a value produces near-zero visible change, it's not a tuning
  problem - something is suppressing it. Diagnose, don't tune.
- Scene assets must be art/skyline only - a full mockup ghosts fake UI behind
  real cards.
- Migrations are a separate manual track - pushing code does not migrate any DB.
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces this two ways: `assertSafeForBoot()` runs
  automatically at server boot (`server.js`); `assertSafeForReset()` covers
  the test/reset path (`jest.setup.js`) and must be called explicitly by any
  new DB-connecting script at the top of `main()`.

---

### Optional later: the "inbox" upgrade

Don't reach for it day one. Get the manual relay smooth first; adopt the
poll-for-tasks inbox pattern only once you want to trim the last paste step.
