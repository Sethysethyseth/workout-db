# CLAUDE.md  (LogChamp)

> Repo-root context. Rides along on every turn - keep it lean. Full stable
> context (product vision, schema rationale, incident history) lives in
> `WORKOUTDB_MASTER_PROMPT_17.md` - pull that in for planning/architecture
> work, not every turn.

---

## Project

LogChamp (formerly WorkoutDB) - an analytics-first weightlifting tracker for
intermediate lifters. Differentiates on the insight layer (volume analytics, PR
detection, 1RM estimation, progressive-overload trends), not logging UX. Sole
dev: Seth. Claude = planning/review partner, Cursor = code-execution agent,
Claude Code = mechanical jobs + DB inspection.

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

## How to run

- Server (from `server/`): `npm install` -> copy `.env.example` to `.env` ->
  `npm run prisma:generate` -> `npm run prisma:migrate` -> `npm run dev`
  (listens on `localhost:3000`)
- Client (from `client/`): `npm install` -> `npm run dev` (calls API at
  `localhost:3000` by default; `npm run dev:mobile` for LAN/phone testing)
- Tests: `npm test` from `server/`. Integration suite is known-flaky on shared
  staging (FK pollution, not the code under test) - a failure isn't
  automatically a regression; check whether `main` fails the same way first.
- Build: `npm run build` from `client/` (Vite)

## Structure

- `client/src/components` - UI components
- `client/src/context` - `ThemeContext` owns both `data-theme` and
  `data-palette` axes via the `useTheme()` accessor
- `client/src/assets/scenes` - palette scene rasters (champ, iron, chill,
  forest, crimson)
- `server/` - Express API, Prisma schema, migrations
- `server/data/` - exercise catalog + muscle-weights curation, vendored not
  hot-linked
- `docs/HANDOFF.md` - current state, rewritten every session
- `docs/RUNBOOK.md` - copy-paste command rituals (schema deploys, merges, etc.)
- `WORKOUTDB_MASTER_PROMPT_17.md` - full stable context

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
- ASCII-only commit messages; hyphens, never em-dashes (PowerShell mangles
  non-ASCII in `-m`).
- Stage files individually - never `git add .`.

## Command-running (the rule + the gate)

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

## Verify-before-trust (still holds, even when hands-off)

- SHA check after every commit via `git log --oneline`.
- Confirm the commit reached `origin` before treating a deploy as evidence
  (`git log origin/<branch> --oneline`). A redeploy rebuilds the OLD HEAD until
  the push lands.
- Render Events tab confirms the right commit deployed.
- Smoke on device - build-passing + diff-looking-right do NOT prove the visual.

## Model selection (soft default - you still choose)

Start in Sonnet. Both a Sonnet chat and an Opus chat stay open; reach into the
Opus chat only when a task hits one of the Opus tendencies (see
routing-cheatsheet.md section B). Drop back to Sonnet the moment the hard part
is solved. Nothing auto-routes - "Sonnet first" is just the home base that keeps
the cheap lane cheap and prevents Opus-drift.

## Workflow note (the relay)

Claude plans / Cursor executes. For small changes (1-3 files), Claude produces a
**Cursor task block** (scoped, file-named, acceptance criteria, stop condition)
rather than editing directly. Hand big mechanical jobs + DB inspection to Claude
Code. AGENTS.md carries current-state between sessions - both agents read it.

## Environment / gotchas

- OS: Windows, PowerShell. Use `;` not `&&` to chain.
- Desktop is OneDrive-redirected - expect possible sync lag on file writes; a
  stale-looking file is usually that.
- NEVER set `ANTHROPIC_API_KEY` - subscription login auth; an env key bills
  per-token silently.
- Never commit `.env` or hardcode secrets. `server/.env` only ever points at
  staging or localhost, never prod. `dbHostGuard` enforces this two ways:
  `assertSafeForBoot()` runs automatically at server boot (`server.js`);
  `assertSafeForReset()` covers the test/reset path (`jest.setup.js`) and must
  be called explicitly by any new DB-connecting script at the top of `main()`.
- `HANDOFF.md` rides uncommitted until the `ui-palettes-v2` -> `main` ff-merge.

## Do-nots

- Don't add dependencies without asking (see gate, item 5).
- Don't refactor unrelated code during a scoped task.
- Don't route work-state through the database - AGENTS.md is the work-state
  channel; the DB is app data only.
- Don't hardcode colors or touch infra/env-var/route/cookie/localStorage-key
  names for a rebrand or display-text change (see rename boundary above).

## Gate-sync rule

The gate above is duplicated verbatim in AGENTS.md so both agents see it. If you
change the gate in one file, change it in the other in the same edit. They must
never disagree.
