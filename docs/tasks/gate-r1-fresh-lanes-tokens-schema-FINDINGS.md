# REPORT gate-r1: fresh lanes, tokens sweep, module load, schema vs migrations

Report lane only. No code changes. Range is `7d3b91e...HEAD` (merge-base is `7d3b91e`; HEAD is `a4970c8`). Commands ran from the repo root unless a section says `server/` or `client/`.

## 1. Fresh lanes

### `server/` — `npm run test:unit`

```
> server@1.0.0 test:unit
> cross-env NODE_ENV=test jest --selectProjects unit

Running one project: unit

Test Suites: 45 passed, 45 total
Tests:       542 passed, 542 total
Snapshots:   0 total
Time:        5.226 s
Ran all test suites.
```

Exit code 0.

### `client/` — `npm run build`

```
> workout-db-beta-client@0.0.0 build
> vite build

vite v8.0.0 building client environment for production...
transforming...✓ 282 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            1.20 kB │ gzip:   0.60 kB
dist/assets/wordmark_white-DiUTmlzX.png   22.50 kB
dist/assets/iron-Bep6FDno.jpg             22.75 kB
dist/assets/crimson-8JuOJdCr.jpg          34.58 kB
dist/assets/chill-_inQLnIt.jpg            44.89 kB
dist/assets/forest-nWF7EomM.jpg           50.22 kB
dist/assets/champ-SD9-uA_W.jpg            58.52 kB
dist/assets/index-CtMF6VaS.css           254.40 kB │ gzip:  40.64 kB
dist/assets/browser-CdVpieAu.js           67.30 kB │ gzip:  19.10 kB
dist/assets/index-BbSacy8O.js            721.24 kB │ gzip: 201.58 kB

✓ built in 813ms
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

Exit code 0. The leading cursor-control sequence from Vite's progress line is omitted above; the rest is the command output. No failure.

## 2. Module graph loads

From `server/`:

```
node -e "process.env.NODE_ENV='test'; require('./src/app.js'); console.log('app.js loaded')"
```

Fails on a missing env var only (`DATABASE_URL`). No `.env` was created.

```
C:\dev\worktrees\cursor-lane\server\src\app.js:141
  throw new Error(
  ^

Error: DATABASE_URL is required — server cannot start without a persistent session store.
    at Object.<anonymous> (C:\dev\worktrees\cursor-lane\server\src\app.js:141:9)
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

Exit code 1. `app.js loaded` was not printed.

## 3. Tokens-only sweep

Command:

```
git diff 7d3b91e...HEAD -- client/src/**/*.css client/src/**/*.jsx client/src/**/*.js
```

Every added line of that diff was scanned. The `client/src` tree in the wave is exactly those extensions:

```
113 files changed, 19165 insertions(+), 1799 deletions(-)
```

The full unified patch is not inlined (113 files). Matching added lines are quoted below.

### Hex, `rgb(`, `rgba(`, `hsl(`, `hsla(`

Added lines outside `client/src/index.css`: **none**.

Added lines inside `client/src/index.css`: **none** of these either (recorded so the exclusion is checkable).

### Named colours used as a colour value

`white` does not appear as a colour value on any added line (`white-space` is listed under exclusions). `black`, `transparent`, and `currentColor` do.

`black` (mask gradient):

- `client/src/styles/blocks/bk-builder.css:685` `mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);`
- `client/src/styles/blocks/bk-builder.css:686` `-webkit-mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);`

`currentColor`:

- `client/src/pages/profile/AiConnectorPage.jsx:499` `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">`
- `client/src/pages/profile/AiConnectorPage.jsx:503` `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">`
- `client/src/styles/blocks/bk-builder.css:725` `stroke: currentColor;`
- `client/src/styles/blocks/bk-log.css:387` `stroke: currentColor;`

`transparent` (colour value, including inside `color-mix`):

- `client/src/styles/blocks/bk-builder.css:142` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:254` `background: color-mix(in srgb, var(--color-interactive) 22%, transparent);`
- `client/src/styles/blocks/bk-builder.css:266` `background: color-mix(in srgb, var(--color-interactive) 32%, transparent);`
- `client/src/styles/blocks/bk-builder.css:291` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:483` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:646` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:685` `mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);`
- `client/src/styles/blocks/bk-builder.css:686` `-webkit-mask-image: linear-gradient(to right, black calc(100% - 28px), transparent);`
- `client/src/styles/blocks/bk-builder.css:756` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:1107` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:1237` `border: 1px solid transparent;`
- `client/src/styles/blocks/bk-builder.css:1238` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:1289` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:1334` `background: transparent;`
- `client/src/styles/blocks/bk-builder.css:1555` `background: transparent;`
- `client/src/styles/blocks/bk-import.css:278` `border: 1px solid color-mix(in srgb, var(--bk-bad) 28%, transparent);`
- `client/src/styles/blocks/bk-import.css:429` `background: transparent;`
- `client/src/styles/blocks/bk-import.css:443` `background: transparent;`
- `client/src/styles/blocks/bk-import.css:520` `background: transparent;`
- `client/src/styles/blocks/bk-import.css:573` `background: color-mix(in srgb, var(--bk-bg) 92%, transparent);`
- `client/src/styles/blocks/bk-library.css:32` `background: transparent;`
- `client/src/styles/blocks/bk-library.css:91` `background: transparent;`
- `client/src/styles/blocks/bk-library.css:92` `border-color: transparent;`
- `client/src/styles/blocks/bk-library.css:126` `background: color-mix(in srgb, var(--bk-muted) 16%, transparent);`
- `client/src/styles/blocks/bk-library.css:246` `border-color: transparent;`
- `client/src/styles/blocks/bk-library.css:317` `border-color: transparent;`
- `client/src/styles/blocks/bk-log.css:341` `border-color: color-mix(in srgb, var(--bk-line) 55%, transparent);`
- `client/src/styles/blocks/bk-log.css:342` `background: transparent;`
- `client/src/styles/blocks/bk-run.css:113` `background: transparent;`
- `client/src/styles/blocks/bk-run.css:143` `background: transparent;`
- `client/src/styles/blocks/bk-run.css:318` `background: transparent;`
- `client/src/styles/blocks/bk-run.css:488` `border: 1px solid var(--color-border, transparent);`
- `client/src/styles/blocks/bk-run.css:571` `background: transparent;`
- `client/src/styles/blocks/bk-run.css:613` `border: 1px solid color-mix(in srgb, var(--color-interactive) 55%, transparent);`
- `client/src/styles/blocks/bk-run.css:684` `border: 1px solid transparent;`
- `client/src/styles/blocks/bk-run.css:713` `background: color-mix(in srgb, var(--color-interactive) 14%, transparent);`
- `client/src/styles/blocks/bk-ui.css:12` `--bk-line-2: color-mix(in srgb, var(--color-border) 55%, transparent);`
- `client/src/styles/blocks/bk-ui.css:141` `border-color: transparent;`
- `client/src/styles/blocks/bk-ui.css:147` `border-color: transparent;`
- `client/src/styles/blocks/bk-ui.css:153` `border-color: transparent;`
- `client/src/styles/blocks/bk-ui.css:159` `border-color: transparent;`
- `client/src/styles/blocks/bk-ui.css:228` `background: color-mix(in srgb, var(--bk-bg) 35%, transparent);`
- `client/src/styles/blocks/bk-ui.css:259` `box-shadow: 0 2px 14px color-mix(in srgb, var(--color-interactive) 55%, transparent);`
- `client/src/styles/blocks/bk-ui.css:268` `0 2px 14px color-mix(in srgb, var(--color-interactive) 55%, transparent),`
- `client/src/styles/blocks/bk-ui.css:719` `background: color-mix(in srgb, var(--bk-bg) 92%, transparent);`

### Word hits that are not a colour value (excluded)

`white-space` (the substring `white` is not a colour):

- `client/src/styles/blocks/bk-builder.css:90` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:167` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:321` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:528` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:707` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:1352` `white-space: nowrap;`
- `client/src/styles/blocks/bk-builder.css:1501` `white-space: nowrap;`
- `client/src/styles/blocks/bk-import.css:100` `white-space: nowrap;`
- `client/src/styles/blocks/bk-import.css:133` `white-space: pre;`
- `client/src/styles/blocks/bk-import.css:453` `white-space: normal;`
- `client/src/styles/blocks/bk-import.css:460` `white-space: normal;`
- `client/src/styles/blocks/bk-import.css:508` `white-space: nowrap;`
- `client/src/styles/blocks/bk-import.css:526` `white-space: nowrap;`
- `client/src/styles/blocks/bk-import.css:589` `white-space: nowrap;`
- `client/src/styles/blocks/bk-library.css:176` `white-space: nowrap;`
- `client/src/styles/blocks/bk-library.css:240` `white-space: nowrap;`
- `client/src/styles/blocks/bk-library.css:283` `white-space: normal;`
- `client/src/styles/blocks/bk-log.css:19` `white-space: pre-wrap;`
- `client/src/styles/blocks/bk-log.css:190` `white-space: pre-wrap;`
- `client/src/styles/blocks/bk-run.css:51` `white-space: nowrap;`
- `client/src/styles/blocks/bk-run.css:538` `white-space: nowrap;`
- `client/src/styles/blocks/bk-run.css:547` `white-space: nowrap;`
- `client/src/styles/blocks/bk-run.css:595` `white-space: nowrap;`
- `client/src/styles/blocks/bk-run.css:601` `white-space: nowrap;`
- `client/src/styles/blocks/bk-ui.css:108` `white-space: nowrap;`
- `client/src/styles/blocks/bk-ui.css:136` `white-space: nowrap;`
- `client/src/styles/blocks/bk-ui.css:380` `white-space: nowrap;`
- `client/src/styles/blocks/bk-ui.css:620` `white-space: nowrap;`

Comments (the word `red` is not a colour value):

- `client/src/styles/blocks/bk-ui.css:564` `/* Iron accent IS amber = warn hue. Remap over-cap to the bad/red family so`
- `client/src/styles/blocks/bk-ui.css:576` `overrides warn to red below). */`

### `var(--...)` names added in the wave diff

49 distinct names. Each is defined in `client/src/index.css` or `client/src/styles/**`. None are UNDEFINED.

| name | defining file |
| --- | --- |
| `--ai-wait-crown` | `client/src/styles/ai-wait.css` |
| `--bk-accent` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-accent-soft` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-bad` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-bad-soft` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-bg` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-display` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-field` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-ghost` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-good` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-good-soft` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-ink` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-ink-2` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-line` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-line-2` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-muted` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-on-accent` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-r` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-shadow` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-sticky-top` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-surface` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-surface-2` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-warn` | `client/src/styles/blocks/bk-ui.css` |
| `--bk-warn-soft` | `client/src/styles/blocks/bk-ui.css` |
| `--bottom-nav-height` | `client/src/index.css` |
| `--color-bg` | `client/src/index.css` |
| `--color-border` | `client/src/index.css` |
| `--color-btn-primary-fg` | `client/src/index.css` |
| `--color-error-bg` | `client/src/index.css` |
| `--color-error-text` | `client/src/index.css` |
| `--color-input-border` | `client/src/index.css` |
| `--color-interactive` | `client/src/index.css` |
| `--color-muted` | `client/src/index.css` |
| `--color-scrim` | `client/src/index.css` |
| `--color-success-accent` | `client/src/index.css` |
| `--color-success-bg` | `client/src/index.css` |
| `--color-surface-1` | `client/src/index.css` |
| `--color-surface-2` | `client/src/index.css` |
| `--color-surface-3` | `client/src/index.css` |
| `--color-text` | `client/src/index.css` |
| `--color-text-secondary` | `client/src/index.css` |
| `--color-warn-accent` | `client/src/index.css` |
| `--color-warn-text` | `client/src/index.css` |
| `--ease-standard` | `client/src/index.css` |
| `--font-block` | `client/src/index.css` |
| `--font-display` | `client/src/index.css` |
| `--font-sans` | `client/src/index.css` |
| `--radius-control` | `client/src/index.css` |
| `--shadow-card` | `client/src/index.css` |

## 4. Schema vs migrations

Wave migrations (name-status of `git diff 7d3b91e...HEAD -- server/prisma/migrations`):

```
A	server/prisma/migrations/20260929120000_blocks_v2/migration.sql
A	server/prisma/migrations/20261006200000_block_exercise_per_side/migration.sql
```

Those are the only migration files the wave adds.

### Verbatim `git diff 7d3b91e...HEAD -- server/prisma/schema.prisma`

```
diff --git a/server/prisma/schema.prisma b/server/prisma/schema.prisma
index f5d51a8..1569622 100644
--- a/server/prisma/schema.prisma
+++ b/server/prisma/schema.prisma
@@ -23,20 +23,22 @@ model User {
   coachUsage         CoachUsage[]
   workoutTemplates   WorkoutTemplate[]
   blockTemplates     BlockTemplate[]
+  blockRuns          BlockRun[]
   workoutSessions    WorkoutSession[]
   feedback           Feedback[]
   userExercises      UserExercise[]
 }
 
 model AiConsent {
-  id        Int       @id @default(autoincrement())
-  userId    String    @unique
-  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
-  scope     String
-  grantedAt DateTime
-  revokedAt DateTime?
-  createdAt DateTime  @default(now())
-  updatedAt DateTime  @updatedAt
+  id                   Int       @id @default(autoincrement())
+  userId               String    @unique
+  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
+  scope                String
+  grantedAt            DateTime
+  revokedAt            DateTime?
+  blockDraftsAllowedAt DateTime?
+  createdAt            DateTime  @default(now())
+  updatedAt            DateTime  @updatedAt
 
   @@index([userId])
 }
@@ -135,11 +137,16 @@ model WorkoutSession {
   user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
   workoutTemplateId Int?
   workoutTemplate   WorkoutTemplate?  @relation(fields: [workoutTemplateId], references: [id], onDelete: SetNull)
+  blockRunId        Int?
+  blockRun          BlockRun?         @relation(fields: [blockRunId], references: [id], onDelete: SetNull)
+  blockWeekOrder    Int?
+  blockWorkoutOrder Int?
   sets              WorkoutSet[]
   sessionExercises  SessionExercise[]
 
   @@index([userId])
   @@index([workoutTemplateId])
+  @@index([blockRunId])
 }
 
 model WorkoutSet {
@@ -151,6 +158,7 @@ model WorkoutSet {
   rir                Int?
   notes              String?
   side               String?
+  durationSec        Int?
   workoutSessionId   Int
   workoutSession     WorkoutSession    @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
   templateExerciseId Int?
@@ -178,6 +186,7 @@ model SessionExercise {
   targetSets         Int?
   targetReps         String?
   notes              String?
+  plan               Json?
   workoutSessionId   Int
   workoutSession     WorkoutSession    @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
   templateExerciseId Int?
@@ -196,6 +205,9 @@ model BlockTemplate {
   name            String
   description     String?
   isPublic        Boolean     @default(false)
+  isDraft         Boolean     @default(false)
+  source          String?
+  sourceUnit      String?
   durationWeeks   Int?
   useRIR          Boolean     @default(false)
   useRPE          Boolean     @default(false)
@@ -205,6 +217,7 @@ model BlockTemplate {
   userId          String
   user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
   weeks           BlockWeek[]
+  runs            BlockRun[]
 
   @@index([userId])
   @@index([isPublic])
@@ -213,6 +226,7 @@ model BlockTemplate {
 model BlockWeek {
   id              Int            @id @default(autoincrement())
   order           Int
+  label           String?
   blockTemplateId Int
   blockTemplate   BlockTemplate  @relation(fields: [blockTemplateId], references: [id], onDelete: Cascade)
   workouts        BlockWorkout[]
@@ -244,6 +258,9 @@ model BlockWorkoutExercise {
   targetSets       Int?
   targetReps       String?
   notes            String?
+  restSec          Int?
+  effortCap        Boolean           @default(false)
+  perSide          Boolean?
   blockWorkoutId   Int
   blockWorkout     BlockWorkout      @relation(fields: [blockWorkoutId], references: [id], onDelete: Cascade)
   blockWorkoutSets BlockWorkoutSet[]
@@ -299,10 +316,12 @@ model BlockWorkoutSet {
   id                     Int                  @id @default(autoincrement())
   order                  Int
   reps                   Float?
+  repsMax                Float?
   weight                 Float?
   rpe                    Float?
   rir                    Int?
   notes                  String?
+  durationSec            Int?
   blockWorkoutExerciseId Int
   blockWorkoutExercise   BlockWorkoutExercise @relation(fields: [blockWorkoutExerciseId], references: [id], onDelete: Cascade)
   workoutSets            WorkoutSet[]
@@ -310,3 +329,17 @@ model BlockWorkoutSet {
   @@unique([blockWorkoutExerciseId, order])
   @@index([blockWorkoutExerciseId])
 }
+
+model BlockRun {
+  id              Int              @id @default(autoincrement())
+  userId          String
+  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
+  blockTemplateId Int
+  blockTemplate   BlockTemplate    @relation(fields: [blockTemplateId], references: [id], onDelete: Cascade)
+  startedAt       DateTime         @default(now())
+  endedAt         DateTime?
+  sessions        WorkoutSession[]
+
+  @@index([userId])
+  @@index([blockTemplateId])
+}
```

### Scalar / index / FK -> SQL

`20260929120000_blocks_v2` unless noted.

| schema change | SQL |
| --- | --- |
| `AiConsent.blockDraftsAllowedAt DateTime?` | `ALTER TABLE "AiConsent" ADD COLUMN "blockDraftsAllowedAt" TIMESTAMP(3);` nullable, no default |
| `WorkoutSession.blockRunId Int?` | `ADD COLUMN "blockRunId" INTEGER` nullable |
| `WorkoutSession.blockWeekOrder Int?` | `ADD COLUMN "blockWeekOrder" INTEGER` nullable |
| `WorkoutSession.blockWorkoutOrder Int?` | `ADD COLUMN "blockWorkoutOrder" INTEGER` nullable |
| `@@index([blockRunId])` on `WorkoutSession` | `CREATE INDEX "WorkoutSession_blockRunId_idx" ON "WorkoutSession"("blockRunId");` |
| `WorkoutSession.blockRun` `onDelete: SetNull` | `WorkoutSession_blockRunId_fkey` ... `ON DELETE SET NULL ON UPDATE CASCADE` |
| `WorkoutSet.durationSec Int?` | `ALTER TABLE "WorkoutSet" ADD COLUMN "durationSec" INTEGER;` nullable |
| `SessionExercise.plan Json?` | `ALTER TABLE "SessionExercise" ADD COLUMN "plan" JSONB;` nullable |
| `BlockTemplate.isDraft Boolean @default(false)` | `ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false` |
| `BlockTemplate.source String?` | `ADD COLUMN "source" TEXT` nullable |
| `BlockTemplate.sourceUnit String?` | `ADD COLUMN "sourceUnit" TEXT` nullable |
| `BlockWeek.label String?` | `ALTER TABLE "BlockWeek" ADD COLUMN "label" TEXT;` nullable |
| `BlockWorkoutExercise.effortCap Boolean @default(false)` | `ADD COLUMN "effortCap" BOOLEAN NOT NULL DEFAULT false` |
| `BlockWorkoutExercise.restSec Int?` | `ADD COLUMN "restSec" INTEGER` nullable |
| `BlockWorkoutExercise.perSide Boolean?` | `20261006200000_block_exercise_per_side`: `ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "perSide" BOOLEAN;` nullable, no default |
| `BlockWorkoutSet.repsMax Float?` | `ADD COLUMN "repsMax" DOUBLE PRECISION` nullable |
| `BlockWorkoutSet.durationSec Int?` | `ADD COLUMN "durationSec" INTEGER` nullable |
| model `BlockRun` | `CREATE TABLE "BlockRun"` with `id SERIAL` PK, `"userId" TEXT NOT NULL`, `"blockTemplateId" INTEGER NOT NULL`, `"startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`, `"endedAt" TIMESTAMP(3)` nullable |
| `@@index([userId])` on `BlockRun` | `CREATE INDEX "BlockRun_userId_idx"` |
| `@@index([blockTemplateId])` on `BlockRun` | `CREATE INDEX "BlockRun_blockTemplateId_idx"` |
| `BlockRun.user` `onDelete: Cascade` | `BlockRun_userId_fkey` ... `ON DELETE CASCADE ON UPDATE CASCADE` |
| `BlockRun.blockTemplate` `onDelete: Cascade` | `BlockRun_blockTemplateId_fkey` ... `ON DELETE CASCADE ON UPDATE CASCADE` |

Relation fields with no column of their own (the FK column is already in the table above): `User.blockRuns`, `BlockTemplate.runs`, `BlockRun.sessions`, and the relation sides `WorkoutSession.blockRun`, `BlockRun.user`, `BlockRun.blockTemplate`.

### Flags

- Schema change with no matching SQL: **none**.
- SQL with no matching schema change: **none**. Every statement in both migration files is in the table above.
- FK `ON DELETE` that differs from schema `onDelete`: **none**. `WorkoutSession.blockRunId` is `SET NULL` / `SetNull`. Both `BlockRun` FKs are `CASCADE` / `Cascade`. SQL also says `ON UPDATE CASCADE`. The schema does not set `onUpdate` (Prisma's default is Cascade). That is not an `onDelete` mismatch.
- NOT NULL column added to an existing table without a default: **none**.
  - `BlockTemplate.isDraft` and `BlockWorkoutExercise.effortCap` are `NOT NULL` and both have `DEFAULT false`.
  - `perSide` is nullable.
  - `BlockRun` is a new table. Its `NOT NULL` columns are `id` (SERIAL), `userId`, `blockTemplateId`, and `startedAt` (`DEFAULT CURRENT_TIMESTAMP`).

### Line endings

`file` is not required; byte check for `\r\n` (0x0d 0x0a):

```
server/prisma/migrations/20260929120000_blocks_v2/migration.sql
bytes 2057 CRLF 58 LF-only 0 CR-only 0
starts 2d 2d 20 41 6c 74 65 72

server/prisma/migrations/20261006200000_block_exercise_per_side/migration.sql
bytes 66 CRLF 1 LF-only 0 CR-only 0
starts 41 4c 54 45 52 20 54 41
```

Both files are CRLF throughout. Neither contains a lone LF.

## 5. New runtime dependency surface

`client/package.json` dependency (line 18): `"read-excel-file": "^9.3.10"`.

Import sites under `client/`:

- `client/src/components/blocks/import/ImportSourceStep.jsx:155` — loaded lazily:

```
const mod = await import("read-excel-file/browser");
```

- `client/src/components/blocks/import/xlsxToTsv.js:22` — comment only (`Convert a 2-D sheet (read-excel-file rows) to TSV text.`). No import.

No static `import` / `require` of `read-excel-file` exists under `client/src`.

The production build puts the library in its own chunk, not in the main bundle:

```
dist/assets/browser-CdVpieAu.js           67.30 kB │ gzip:  19.10 kB
dist/assets/index-BbSacy8O.js            721.24 kB │ gzip: 201.58 kB
```

`client/dist/assets/browser-CdVpieAu.js` contains `XLS_FILE_NOT_SUPPORTED` and `READ_EXCEL_FILE_CHECKPOINTS`. `client/dist/assets/index-BbSacy8O.js` does not contain the string `read-excel-file` or `READ_EXCEL_FILE`. It loads the chunk from the click path:

```
async function F(e){w(!0);try{let t=(await S(()=>import(`./browser-CdVpieAu.js`),[])).default,n=(await t(e)||[]).map(e=>({name:String(e.sheet??``),rows:Array.isArray(e.data)?e.data:[]}));
```

The `XLS_FILE_NOT_SUPPORTED` string in the main bundle is the app's error-code check (`e.code===\`XLS_FILE_NOT_SUPPORTED\``), not the parser.

## git status --porcelain

```
?? REPORT-GATE-R1.md
```
