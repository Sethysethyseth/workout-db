# AGENTS.md  (LogChamp - shared agent context, SINGLE SOURCE)

> Read by ALL agents. Cursor reads this file directly at session start;
> Claude Code imports it from CLAUDE.md (`@AGENTS.md`). Shared conventions,
> architecture, and the command-running gate live HERE and ONLY here - do not
> duplicate them into CLAUDE.md or HANDOFF. Current work-state lives in
> `docs/HANDOFF.md`, never in this file.

---

## Project

LogChamp (formerly WorkoutDB) - an analytics-first weightlifting tracker for
intermediate lifters. Differentiates on the insight layer (volume analytics, PR
detection, 1RM estimation, progressive-overload trends), not logging UX. Sole
dev: Seth. Claude = planning/review partner, Cursor = code-execution agent,
Claude Code = mechanical jobs + DB inspection + repo hygiene.

Anti-goals worth knowing before adding scope: no max-data-for-its-own-sake, no
out-featuring Strong/Hevy on logging UX, no over-built motion (~150-250ms,
ease-out, restraint - flashy reads as amateur).

**Rename boundary (WorkoutDB -> LogChamp is DISPLAY-LAYER ONLY):** never rename
for a rebrand - repo/remote, Render/Neon/Vercel service names, env var names,
`package.json` name fields, cookie names (`workoutdb.sid`), localStorage keys
(`workoutdb-theme`, `workoutdb-palette`), route paths, component filenames,
CSS class prefixes, internal identifiers, migration content, API messages.
Rebrand text lives in: rendered UI, `<title>`, PWA manifest name fields.

## Stack

- Frontend: React + Vite (Vercel)
- Backend: Express + Node (Render), Prisma 6 - config in `prisma.config.ts`,
  not `package.json`
- Database: PostgreSQL via Neon - SEPARATE prod and staging projects
- Repo: Sethysethyseth/workout-db
- Auth: cookie-based sessions (primary) + JWT Bearer (fallback)

## How to run / test

- Server (from `server/`): `npm install` -> copy `.env.example` to `.env` ->
  `npm run prisma:generate` -> `npm run prisma:migrate` -> `npm run dev`
  (listens on `localhost:3000`)
- Client (from `client/`): `npm install` -> `npm run dev` (calls API at
  `localhost:3000` by default; `npm run dev:mobile` for LAN/phone testing)
- Tests, two lanes (from `server/`):
  - `npm run test:unit` - pure-function tests (`test/analytics/**`), NO DB,
    no migrate, safe anywhere. Runs in CI on every push.
  - `npm test` - both lanes; `pretest` runs `prisma migrate deploy` and the
    integration lane resets the staging DB. Integration suite is known-flaky
    on shared staging (FK pollution, not the code under test) - check whether
    `main` fails the same way before treating a failure as a regression.
- CI (`.github/workflows/ci.yml`): client build + server unit tests on every
  push. No secrets, no DB. Integration stays manual/local by design.
- Build: `npm run build` from `client/` (Vite)

## Structure

- `client/src/components` - UI components
- `client/src/context` - `ThemeContext` owns both `data-theme` and
  `data-palette` axes via the `useTheme()` accessor
- `client/src/assets/scenes` - palette scene rasters (champ, iron, chill,
  forest, crimson). Shipping assets ONLY - design references live in
  `docs/design/mocks/` and must never be imported from `client/src/`.
- `server/` - Express API, Prisma schema, migrations
- `server/src/analytics/` - the analytics engine: pure, composable,
  fixture-tested functions (no DB, no Prisma imports - keep it that way)
- `server/data/` - exercise catalog + muscle-weights curation + rationale
  docs, vendored not hot-linked. Rationale docs update in the SAME commit as
  any value change.
- `docs/HANDOFF.md` - current state + next unit, rewritten every session.
  THE work-state channel for all agents.
- `docs/RUNBOOK.md` - copy-paste command rituals (schema deploys, merges, etc.)
- `docs/specs/` - architecture specs (analytics engine, schema sentinel)
- `WORKOUTDB_MASTER_PROMPT_17.md` - full stable context for planning work

## UI architecture - palettes/tokens (load-bearing, read before touching styles)

- Two independent axes on `<html>`: `data-theme` (light/dark/system) x
  `data-palette` (`champ | iron | forest | crimson`). Absent/unknown palette
  renders as champ.
- **Tokens-only.** Never hardcode colors - every surface must render correctly
  across all 4 palettes x 2 modes (8 combos). New colors go through the CSS
  custom properties in `client/src/index.css`.
- Accent-adjacent states (rings, nav-active, pills) derive from
  `--color-interactive` via `color-mix` - follow this pattern so new palettes
  inherit them for free.
- Palette surfaces are hand-authored hexes per palette, not algorithmic tints
  (a `color-mix`-tint mechanism was built and replaced - reads as "a hue over
  it," not a distinct environment).
- `card--live` (accent L-bar) means exactly one thing: a live in-progress
  workout. Don't reuse it for other emphasis - the semantics are the point.
- Scene layer is a fixed `body::before` (full-viewport, `z-index 0`); `#root`
  is `position: relative; z-index: 1` as the stacking fix - check anything
  rendered via portal (outside `#root`) against this.

## Conventions

- Match existing component/file patterns before inventing new ones.
- Scope discipline: only touch files named in the current task. Don't refactor
  unrelated code. Stop when acceptance criteria are met.
- ASCII-only commit messages; hyphens, never em-dashes (PowerShell mangles
  non-ASCII in `-m`).
- Stage files individually - never `git add .`.
- OS is Windows + PowerShell: chain with `;` not `&&`.

## Command-running gate (HANDS-OFF by default)

Default is HANDS-OFF. Agents (Cursor, Claude Code) run commands freely WITHOUT
asking - including staging files, local commits, AND `git push` to staging.
Only the items below stop and ask first. Everything not listed runs automatically.

ASK BEFORE RUNNING (the short gate):

1. MERGE INTO `main` - gated behind a trigger phrase. Do not start the
   merge/push sequence until the user says "push to main" verbatim. Once
   triggered, run one command at a time and wait for explicit manual approval
   before each next one - never batch or auto-run the sequence. After the
   push lands, report exactly what was merged (commits, SHAs, confirmed
   `origin/main` HEAD) before considering the task done.
2. PRODUCTION touches - prod Neon (`ep-solitary-sea-an56mioq`), prod Render
   (`workout-db-l3gc`), any prod data operation, or any `git push` that deploys
   to production. Staging pushes are fine; prod-bound pushes ask first.
3. MIGRATIONS - ANY environment. Separate manual track. Code push != DB migrate.
   A bad migration corrupts live data and is not locally reversible.
4. LOCAL-DESTRUCTIVE / IRREVERSIBLE ops - `reset --hard`, `git clean`,
   `push --force`, branch deletion. These can destroy work on disk.
5. DEPENDENCY installs - anything mutating `package.json` / lockfiles.
   (Adding an npm SCRIPT is a normal scoped edit; adding a PACKAGE asks first.)

Everything else - reads, dev server, scoped file edits, branch creation,
individual staging, local commits, and pushes to staging - runs without asking.

Schema changes specifically: DB migration always lands before the code that
depends on it deploys (code-ahead-of-DB crashes prod login). Exact steps:
`docs/RUNBOOK.md` -> "Schema-change deploy."

## Verify-before-trust (still holds, even when hands-off)

- SHA check after every commit via `git log --oneline`.
- Confirm the commit reached `origin` before treating a deploy as evidence
  (`git log origin/<branch> --oneline`). A redeploy rebuilds the OLD HEAD until
  the push lands.
- Render Events tab confirms the right commit deployed.
- Smoke on device - build-passing + diff-looking-right do NOT prove the visual.

## Current state / next up

Read `docs/HANDOFF.md`. It is rewritten every session and is the ONLY
work-state channel - this file never carries state, and the DB is app data
only (never route work-state through it).

## Durable gotchas

- **Two agents, one working tree:** if Cursor and Claude Code are active
  simultaneously, check `git status --untracked-files=all` immediately before
  every commit (untracked directories collapse to one line and hide new
  files), let writes settle, and let only ONE agent commit at a time.
- The repo lives under OneDrive: expect sync lag on file writes (a
  stale-looking file is usually that) and occasional file-lock hangs
  (`git stash` once hung; use `git worktree` for merge mechanics).
- Never commit `.env` or hardcode secrets. `server/.env` only ever points at
  staging or localhost, never prod. `dbHostGuard` enforces this two ways:
  `assertSafeForBoot()` runs automatically at server boot (`server.js`);
  `assertSafeForReset()` covers the test/reset path (`test/jest.setup.js`)
  and must be called explicitly by any new DB-connecting script at the top
  of `main()`.
- Migrations are a separate manual track - pushing code does not migrate any
  DB.
