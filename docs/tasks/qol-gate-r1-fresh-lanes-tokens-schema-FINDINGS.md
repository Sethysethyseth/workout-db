# REPORT qol-gate-r1

Report lane only. Range used for sweeps: `git diff b5c6777...HEAD`. No code edits, no `.env`, no install, no Prisma, no DB connection. Judgments below are search results for the reviewing seat.

HEAD at search time: `ac40874` (`git rev-list --count b5c6777..HEAD` = 62). The task context said 61 commits; the extra commit is `ac40874` (this gate's task files).

## 1. Fresh lanes

### `server/` — `npm run test:unit`

Exit 0. Verbatim:

```
> server@1.0.0 test:unit
> cross-env NODE_ENV=test jest --selectProjects unit

Running one project: unit

Test Suites: 51 passed, 51 total
Tests:       578 passed, 578 total
Snapshots:   0 total
Time:        5.912 s
Ran all test suites.
```

### `client/` — `npm run build`

Exit 0. Verbatim:

```
> workout-db-beta-client@0.0.0 build
> vite build

vite v8.0.0 building client environment for production...
transforming...✓ 303 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            1.20 kB │ gzip:   0.61 kB
dist/assets/wordmark_white-DiUTmlzX.png   22.50 kB
dist/assets/iron-Bep6FDno.jpg             22.75 kB
dist/assets/crimson-8JuOJdCr.jpg          34.58 kB
dist/assets/chill-_inQLnIt.jpg            44.89 kB
dist/assets/forest-nWF7EomM.jpg           50.22 kB
dist/assets/champ-SD9-uA_W.jpg            58.52 kB
dist/assets/index-C7M0q0LR.css           285.68 kB │ gzip:  45.44 kB
dist/assets/browser-CdVpieAu.js           67.30 kB │ gzip:  19.10 kB
dist/assets/index-DH88Oplf.js            796.56 kB │ gzip: 222.08 kB

✓ built in 1.11s
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

### repo root — `node scripts/check-hex.mjs`

Exit 0. This invocation takes no range, so the script diffs `HEAD` (working tree), not `b5c6777...HEAD`. Section 3 covers the wave range. Verbatim:

```
check-hex: clean - no raw colors added outside index.css (diff: HEAD)
```

## 2. Module graph loads

From `server/`:

```
node -e "process.env.NODE_ENV='test'; require('./src/app.js'); console.log('app.js loaded')"
```

Exit 1. Failure is a missing env var only (`DATABASE_URL`). No `.env` was created.

Verbatim:

```
C:\dev\worktrees\cursor-lane\server\src\app.js:144
  throw new Error(
  ^

Error: DATABASE_URL is required — server cannot start without a persistent session store.
    at Object.<anonymous> (C:\dev\worktrees\cursor-lane\server\src\app.js:144:9)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.require (node:internal/modules/cjs/loader:1493:12)
    at require (node:internal/modules/helpers:152:16)
    at [eval]:1:30

Node.js v24.5.0
```

Throw site: `server/src/app.js:143-146`.

## 3. Tokens-only sweep (`b5c6777...HEAD`)

Scope: added lines in `client/src/**/*.css`, `**/*.jsx`, `**/*.js`, excluding `client/src/index.css`.

### Raw colours on added lines outside `index.css`

Patterns: `#` hex (3-8 hex digits), `rgb(`, `rgba(`, `hsl(`, `hsla(`, and `white` / `black` as a colour token.

**None.** Zero added lines matched.

### `var(--...)` names on added lines

23 names. Every one is defined in `client/src/index.css` or `client/src/styles/**`. None are UNDEFINED. No added line uses a custom property that exists only via `setProperty("--` or `style={{ "--`.

Those inline setters exist on the branch and were not needed to resolve this list:

- `client/src/components/blocks/ui/StickyHeader.jsx:35` `setProperty("--bk-sticky-top"`
- `client/src/lib/customPalette.js:103` `setProperty("--scene-image"`
- `client/src/lib/customPalette.js:104` `setProperty("--palette-swatch-custom"`
- `client/src/pages/SessionDetailPage.jsx:1558` and `:1630` `style={{ "--set-cols"`
- `client/src/components/templates/SetRow.jsx:22` `style={{ "--set-cols"`
- `client/src/components/analytics/MuscleVolumeChart.jsx:32` `style={{ "--mv-ticks"`
- `client/src/components/LoadingState.jsx:72` `style={{ "--w"`

| name | defining file:line | added uses | first added use |
|---|---|---|---|
| `--bk-accent-soft` | `client/src/styles/blocks/bk-ui.css:14` | 1 | `client/src/styles/blocks/bk-builder.css:1241` |
| `--bk-bad` | `client/src/styles/blocks/bk-ui.css:20` | 1 | `client/src/styles/blocks/bk-library.css:382` |
| `--bk-ink-2` | `client/src/styles/blocks/bk-ui.css:9` | 1 | `client/src/styles/blocks/bk-library.css:355` |
| `--bk-muted` | `client/src/styles/blocks/bk-ui.css:10` | 3 | `client/src/styles/blocks/bk-builder.css:1298` |
| `--bk-surface` | `client/src/styles/blocks/bk-ui.css:5` | 1 | `client/src/styles/blocks/bk-builder.css:1233` |
| `--bottom-nav-height` | `client/src/index.css:653` | 1 | `client/src/styles/coach-page.css:7` |
| `--color-border` | `client/src/index.css:8` | 24 | `client/src/styles/blocks/bk-builder.css:1684` |
| `--color-btn-primary-bg` | `client/src/index.css:20` | 1 | `client/src/styles/training-prefs.css:341` |
| `--color-btn-primary-fg` | `client/src/index.css:21` | 2 | `client/src/styles/coach-page.css:295` |
| `--color-error-text` | `client/src/index.css:44` | 1 | `client/src/styles/confirm.css:17` |
| `--color-input-border` | `client/src/index.css:9` | 1 | `client/src/styles/logger.css:98` |
| `--color-interactive` | `client/src/index.css:15` | 55 | `client/src/styles/blocks/bk-builder.css:1684` |
| `--color-muted` | `client/src/index.css:66` | 1 | `client/src/styles/rest-timer.css:53` |
| `--color-surface-1` | `client/src/index.css:4` | 29 | `client/src/styles/ai-access.css:29` |
| `--color-surface-2` | `client/src/index.css:5` | 8 | `client/src/styles/coach-page.css:316` |
| `--color-surface-3` | `client/src/index.css:6` | 1 | `client/src/styles/workout-bar.css:136` |
| `--color-text` | `client/src/index.css:11` | 33 | `client/src/styles/ai-access.css:29` |
| `--color-text-secondary` | `client/src/index.css:12` | 11 | `client/src/styles/coach-history.css:48` |
| `--color-warn-accent` | `client/src/index.css:47` | 3 | `client/src/styles/logger.css:108` |
| `--color-warn-text` | `client/src/index.css:46` | 3 | `client/src/styles/logger.css:113` |
| `--font-display` | `client/src/index.css:83` | 5 | `client/src/styles/coach-history.css:34` |
| `--font-sans` | `client/src/index.css:78` | 8 | `client/src/styles/blocks/bk-builder.css:1235` |
| `--radius-control` | `client/src/index.css:26` | 2 | `client/src/styles/logger.css:99` |

## 4. Schema vs migration

Diff: `git diff b5c6777...HEAD -- server/prisma/schema.prisma`. The only schema change is additive: two relation fields on `User`, plus models `UserCoachKey`, `CoachConversation`, `CoachMessage`.

SQL file: `server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql`.

### Schema change -> SQL

| schema | schema line | SQL |
|---|---|---|
| `User.coachKey UserCoachKey?` | `schema.prisma:30` | Prisma relation only. FK is on the child: `migration.sql:42` |
| `User.coachConversations CoachConversation[]` | `schema.prisma:31` | Prisma relation only. FK is on the child: `migration.sql:45` |
| model `UserCoachKey` | `schema.prisma:352-361` | `CREATE TABLE "UserCoachKey"` `migration.sql:2-10` |
| `userId String @id` | `:353` | `"userId" TEXT NOT NULL` + `PRIMARY KEY ("userId")` `:3`, `:9` |
| relation `onDelete: Cascade` | `:354` | `ON DELETE CASCADE` `:42` |
| `ciphertext String` | `:356` | `"ciphertext" TEXT NOT NULL` `:4` |
| `last4 String` | `:358` | `"last4" TEXT NOT NULL` `:5` |
| `createdAt DateTime @default(now())` | `:359` | `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` `:6` |
| `updatedAt DateTime @updatedAt` | `:360` | `TIMESTAMP(3) NOT NULL` `:7` (no SQL default; new table) |
| model `CoachConversation` | `:363-375` | `CREATE TABLE "CoachConversation"` `:13-22` |
| `id Int @id @default(autoincrement())` | `:364` | `"id" SERIAL NOT NULL` + PK `:15`, `:21` |
| `userId String` | `:365` | `"userId" TEXT NOT NULL` `:16` |
| relation `onDelete: Cascade` | `:366` | `ON DELETE CASCADE` `:45` |
| `title String` | `:367` | `"title" TEXT NOT NULL` `:17` |
| `focus Json?` | `:369` | `"focus" JSONB` (nullable) `:18` |
| `createdAt @default(now())` | `:370` | `DEFAULT CURRENT_TIMESTAMP` `:19` |
| `updatedAt @updatedAt` | `:371` | `TIMESTAMP(3) NOT NULL` `:20` (no SQL default; new table) |
| `messages CoachMessage[]` | `:372` | Prisma relation only. FK is on the child: `:48` |
| `@@index([userId, updatedAt])` | `:374` | `CREATE INDEX "CoachConversation_userId_updatedAt_idx"` `:36` |
| model `CoachMessage` | `:377-387` | `CREATE TABLE "CoachMessage"` `:25-33` |
| `id Int @id @default(autoincrement())` | `:378` | `"id" SERIAL NOT NULL` + PK `:27`, `:32` |
| `conversationId Int` | `:379` | `"conversationId" INTEGER NOT NULL` `:28` |
| relation `onDelete: Cascade` | `:380` | `ON DELETE CASCADE` `:48` |
| `role String` | `:382` | `"role" TEXT NOT NULL` `:29` |
| `content String` | `:383` | `"content" TEXT NOT NULL` `:30` |
| `createdAt @default(now())` | `:384` | `DEFAULT CURRENT_TIMESTAMP` `:31` |
| `@@index([conversationId, createdAt])` | `:386` | `CREATE INDEX "CoachMessage_conversationId_createdAt_idx"` `:39` |

### Flags

- Schema change with no matching SQL: none. The three `User` / `messages` relation fields are Prisma-side; the FKs are the SQL above.
- SQL with no matching schema clause: each of the three `ADD CONSTRAINT` statements also has `ON UPDATE CASCADE` (`migration.sql:42`, `:45`, `:48`). The schema sets `onDelete: Cascade` and does not set `onUpdate`. That `ON UPDATE CASCADE` is Prisma's default, not a named schema change.
- `ON DELETE` vs `onDelete`: all three are `CASCADE` / `Cascade`. No mismatch.
- NOT NULL column added to an EXISTING table without a default: none. All three `CREATE TABLE`s are new tables. `updatedAt` on `UserCoachKey` and `CoachConversation` is `NOT NULL` with no SQL `DEFAULT` (`migration.sql:7`, `:20`); those tables did not exist before this migration.
- `DROP`: none in the migration file.

### Line endings

Byte check of `migration.sql`: 1698 bytes, 0 `\r\n`, 49 `\n` not preceded by `\r`, 0 bare `\r`. LF only.

## 5. Dead code left by the wave

Grep of `client/src` and `server/src`.

| identifier | references |
|---|---|
| `RirRpeToggleRow` | `client/src/pages/CreateTemplatePage.jsx:6` (import), `:207` (JSX); `client/src/pages/EditTemplatePage.jsx:9` (import), `:215` (JSX); `client/src/components/templates/RirRpeToggleRow.jsx:12` (export). `server/src`: none. `git diff b5c6777...HEAD` for `RirRpeToggleRow.jsx` is empty (file unchanged in the wave). |
| `notesPillLabel` | none |
| `SlidersIcon` | none |
| `training-prefs-pill` | none |
| `window.confirm` | `client/src/lib/confirmLeaveLiveSession.js:2`. `server/src`: none. Diff of that file vs `b5c6777` is empty. Caller: `client/src/lib/useGuardedNav.js:3` import, `:21` call of `confirmLeaveLiveSession` (not a `confirm(` call). |
| `confirm(` | the same `window.confirm(` at `client/src/lib/confirmLeaveLiveSession.js:2`. No other `confirm(` in `client/src` or `server/src`. |
| `alert(` | `client/src/pages/HelloPage.jsx:86` `window.alert(TEXT_ME_ALERT)`. `server/src`: none. Diff of `HelloPage.jsx` vs `b5c6777` is empty. |

### Added CSS classes in the named files with no `.jsx`/`.js` reference

Files: `training-prefs.css`, `logger.css`, `workout-bar.css`, `rest-timer.css`, `confirm.css`, `coach-page.css`, `coach-history.css`, `whats-new.css`.

171 unique class tokens were added in that diff. 167 appear as literal tokens in some `client/src` `.js` or `.jsx` file.

Four added selectors have no literal class string in `.js`/`.jsx`. Each is built with a template, and the variant values are passed from JSX:

- `persistent-workout-bar--library` — `client/src/styles/workout-bar.css:74`. Applied by `` `persistent-workout-bar--${column}` `` at `client/src/components/workout/PersistentWorkoutBar.jsx:127`, with `column` `"library"` when `pathname === "/templates"` (`:101-103`).
- `persistent-workout-bar--training` — `workout-bar.css:79`. Same template, `column` `"training"` when `pathname === "/profile/training"` (`:104-105`).
- `training-prefs-form--page` — `client/src/styles/training-prefs.css:6`. Applied by `` `training-prefs-form--${variant}` `` at `client/src/components/prefs/TrainingPrefsForm.jsx:64`. `variant="page"` at `client/src/pages/profile/TrainingPage.jsx:16` (also the default parameter at `TrainingPrefsForm.jsx:59`).
- `training-prefs-form--sheet` — `training-prefs.css:10`. Same template. `variant="sheet"` at `client/src/components/prefs/TrainingPrefsSheet.jsx:78`.

No added class in those eight files is unreferenced once those compositions are counted.

## 6. Cross-doc consistency

Files read: `AGENTS.md`, `CLAUDE.md`, `docs/HANDOFF.md`, `docs/tasks/QUEUE.md` (QOL section), `docs/specs/quality-of-life-wave.md`, `docs/RUNBOOK.md`, plus the code cited below.

`CLAUDE.md` has no QOL unit count, migration name, `COACH_KEY_SECRET`, or What's New id of its own (it imports `AGENTS.md`).

### Wave size N

- `docs/specs/quality-of-life-wave.md:96` — "N = 15."
- `docs/tasks/QUEUE.md:19` — "Wave N = 24 (qol1-qol15 + critic round-1 fixes qolf1-qolf4 + Seth's smoke finding qolf5 + critic round-2 fixes qolf6-qolf7 + Seth's strip move qolf8, Oct 9 + Seth's smoke finding qolf9 hotbar, Oct 9)."
- `docs/HANDOFF.md:4` — "24/24 LANDED".
- `docs/HANDOFF.md:285` — "The wave is 19/19 - HARD STOP for smoke."

The header count (24) matches the QUEUE formula (15 + 4 + 1 + 2 + 1 + 1). The same HANDOFF file still says 19/19 in the older session log. The spec still says 15.

HANDOFF's 24/24 list also includes "the direct auth fix `33cd671`" (`docs/HANDOFF.md:11`). That commit is not in the QUEUE N=24 formula, so the header lists 25 items under a 24 count.

### Critic rounds and "qol15 last"

- `docs/specs/quality-of-life-wave.md:131-132` — "A critic round (ONE, per Seth's Oct 6 rule) runs after qol14 lands and before qol15".
- `docs/specs/quality-of-life-wave.md:116` — qol15 "none - last".
- `docs/tasks/QUEUE.md:29` — "Order: ONE critic round after qol14, then qol15 (What's New) LAST".
- `docs/tasks/QUEUE.md:19` — critic round-1, critic round-2, critic round 3 cancelled, plus qolf5 through qolf9.
- `docs/HANDOFF.md:5-13` — qolf1-qolf4, qolf5, qolf6-qolf7, qolf8, qolf9, and critic round 3 cancelled.
- `docs/HANDOFF.md:283-285` — "qol15 landed last as `9a57cef`" and then "19/19", which disagrees with the header's later qolf5-qolf9 landings.

### Where the logging strip lives

- `docs/specs/quality-of-life-wave.md:13-14` — the preferences form is "reachable from a new Profile page AND from a compact strip under Home's log button."
- `docs/specs/quality-of-life-wave.md:103` — qol2 scope "Profile page, Home strip".
- `docs/HANDOFF.md:43-45` — "Home has no bar any more. Every live workout has a one-line bar under its title".
- Code: `TrainingPrefsStrip` is rendered only from `client/src/pages/SessionDetailPage.jsx:3983` and `:4070`. No other page imports it. It is not on Home.

### `main` SHA inside HANDOFF

- `docs/HANDOFF.md:14` — "`main` = `b5c6777` (unchanged)."
- `docs/HANDOFF.md:176` — "`main` = `ef5e908`" under "Repo / deploy state (Oct 7, late".

The task context and the branch cut in `docs/specs/quality-of-life-wave.md:3` and `docs/tasks/QUEUE.md:10` both use `b5c6777`.

### Whether a push migrates

- `AGENTS.md:242-244` — "Migrations are a separate track from deploys - pushing code does not migrate any DB."
- `docs/specs/quality-of-life-wave.md:127-128` — "Its landing push MIGRATES STAGING (Render's build runs `migrate deploy`)".
- `docs/tasks/QUEUE.md:22-23` — "Its landing push MIGRATES STAGING once Render tracks this branch".
- `docs/HANDOFF.md:185-186` — "Staging DB has the same plus everything via Render's `migrate deploy` (a staging Render DEPLOY is also a staging MIGRATION)."
- `docs/RUNBOOK.md:244-246` — prod build "REQUIRED: it runs `npm run render-build` (= `prisma generate && prisma migrate deploy`)."
- `docs/HANDOFF.md:167-168` — "prod's build never runs `migrate deploy`".
- `docs/HANDOFF.md:184` — "Prod's build never migrates."
- Code: `server/package.json:9` — `"render-build": "prisma generate && prisma migrate deploy"`.

### `COACH_KEY_SECRET` and BYO keys

- `docs/HANDOFF.md:29` — "set `COACH_KEY_SECRET` on prod Render".
- `docs/tasks/QUEUE.md:26` — "qol11 needs `COACH_KEY_SECRET` on staging Render".
- `server/.env.example:37-42` — documents `COACH_KEY_SECRET`; "Unset or invalid: PUT /coach/key returns 503 byo_unavailable."
- `server/src/coach/config.js:34-35` reads `env.COACH_KEY_SECRET`. `server/src/coach/config.js:52` sets `byoStorageAvailable` from that parse.
- `server/src/controllers/coachController.js:134-136` — if storage is unavailable, `PUT /coach/key` returns 503 `byo_unavailable`.
- `docs/RUNBOOK.md:295-322` (section 10b, prod env vars) names `COACH_API_KEY` / `COACH_PROVIDER` and does not name `COACH_KEY_SECRET`.
- `docs/RUNBOOK.md:319-322` — "With no COACH_API_KEY the coach degrades honestly ... Shipping with NO key is a valid choice: the panel renders unavailable and BYO keys still work."

The spec (`quality-of-life-wave.md:29-30`) says the BYO key is encrypted on the server and does not name `COACH_KEY_SECRET`.

### What's New id and date

No contradiction among the files that state them and the code:

- `client/src/data/whatsNew.js:32-33` — `id: "2026-10-quality-of-life"`, `date: "2026-10-09"`.
- `docs/HANDOFF.md:30-31` — bump `2026-10-quality-of-life` if the merge is not on Oct 9.
- `docs/HANDOFF.md:284` — "the date set to 2026-10-09".

The spec does not name this release id. `docs/RUNBOOK.md` does not mention it.

### Migration name

None of the compared files name a migration other than the models this SQL creates. `docs/HANDOFF.md:27-28` says apply the qol1 migration by hand for `UserCoachKey`, `CoachConversation`, `CoachMessage`. The file on the branch is `server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql`. The spec and QUEUE call it the one qol1 migration and do not give a different folder name.

## git status --porcelain

```
?? REPORT-QOL-GATE-R1.md
```
