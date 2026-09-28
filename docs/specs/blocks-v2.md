# Blocks v2 - build, import, run (design of record)

**Status: ACTIVE - the BK wave, opened September 28, 2026 (Opus frontier seat).**
Supersedes the PARKED fork in `block-execution-gap.md`: Seth chose **Finish
it**. Every unit block in `docs/tasks/bk*.md` cites this file by section;
where a block and this file disagree, this file wins and the block is a bug.

**Provenance:** Seth's Sept 28 request ("a better version of blocks": import
from previous apps, make blocks by talking to your AI through the connector,
a reworked responsive block builder that feels nice, the recovery-site look,
the built-in coach able to help but never load-bearing, and a coach-persona
critique loop scored to 8/10 in at most 3 rounds). Grounded by three Cursor
recon lanes the same day (B1 block/session/styling NOW-state, B2
connector/coach/import plumbing, B3 web research - B3 preserved as
`blocks-v2-import-research-2026-09-28.md`). Design inputs: the recovery
"Pain-Free Logbook" artifact (`https://claude.ai/artifact/QXnAbofUDjAFfom3UBBZme`)
and `RecoveryProgram/workout-program/logchampIssues.md` (Seth's own import
requirements for his Phase-1 program - the wave's real-world acceptance test).

---

## 1. Seth's rulings (Sept 28, asked and answered in session)

| # | Question | Ruling |
|---|---|---|
| R1 | Scope | **Build + run + Execution.** Blocks become trainable: an active block, start today's workout from it, the Execution tab judges block sessions against the plan. |
| R2 | Connector writes | **Both:** the connector can create a DRAFT block the user confirms in-app, AND the import format is written so ANY AI (ChatGPT, Gemini, Claude without the connector) can produce a block the user pastes into the importer. |
| R3 | Look and feel | **Block surfaces + shared primitives.** Builder, import and current-block views get the full recovery-site treatment; primitives are built for later reuse; colors stay on the 5 palettes (tokens-only); the rest of the app is untouched this wave. |
| R4 | New block fields | **All four:** timed sets, rest per exercise, effort as a cap, week labels. |

**Frontier-seat calls made on top (stated so nobody "fixes" them):**

- **Rep ranges (`repsMax`).** "3 x 8-12" is the most common hypertrophy
  prescription; importing it as "3 x 8" would misrepresent the program ("the
  program wins" - `logchampIssues.md` section 10). Additive nullable column.
- **Snapshot, not `blockWorkoutSetId`** (section 7.3). The block update path
  replaces every week/workout/set row on each save
  (`blockTemplateController.js` update, `weeks: { deleteMany: {}, create }`),
  so any FK from a logged set to a plan row is nulled by the first edit. Block
  sessions therefore carry a positional stamp plus a JSON plan snapshot.
  `WorkoutSet.blockWorkoutSetId` stays a dead column, now documented as such.
- **Clone re-stamps exercise identity for the cloner** (B1 finding 5): today a
  clone of a PUBLIC block copies the donor's `userExerciseId`s, i.e. foreign
  keys into another user's private custom exercises. Cross-user isolation
  surface - fixed in BK1.
- **Block surfaces get their own stylesheets** (section 10.1), not more lines
  in the 9,971-line `index.css`. Only tokens live in `index.css`. This is what
  lets client units avoid serializing on one file; `check-hex` still scans them.
- **No new dependencies.** CSV/TSV parsing is hand-rolled (the grammar is
  small and fully specified here). `.xlsx` = "copy the cells and paste" -
  pasted spreadsheet cells arrive as TSV. Direct `.xlsx` upload is deferred.
- **Coach block drafts count as one coach question** against the 7-per-week
  hosted cap (CQ1 machinery, refund if no valid draft is returned). Cost-safe
  default; one config line to change if Seth disagrees.
- **Privacy page + ToS** (Seth's Sept 26 ruling: first unit of the next wave)
  rides this wave as BK0, DRAFT until Seth supplies the publishable facts. It
  must now also describe the draft-block write.

## 2. Architecture - one format, many front doors

```
 paste cells / CSV / TSV --+
 Strong or Hevy CSV -------+--> parsers (pure) --+
 any AI's answer (JSON) ---+                     |
 coach "convert" (optional)----------------------+--> LogChamp Block Format v1
                                                 |        |
 builder (manual) -------------------------------|        v
                                                 |   validateBlockDraft  (reject, never repair)
 connector create_block_draft -------------------+        |
                                                          v
                                   preview: stats, warnings, exercise matching
                                                          |
                                                          v
                      createBlockTemplateForUser  (normalize + stamp identity for THIS user)
                                                          |
                                                          v
                                   BlockTemplate tree (isDraft only via connector)
                                                          |
                                     start a run -> start a day -> session with plan snapshot
                                                          |
                                                logger shows the plan -> Execution judges it
```

**The core never needs AI.** Paste/CSV/history import, the builder, running
and Execution are deterministic. AI paths (any-AI paste, connector, coach) all
funnel into the SAME validator and preview, so an AI can never produce a block
the manual path could not.

Pure modules live in `server/src/blocks/` and are tested in
`server/test/lib/blocks/` - **not** `server/test/blocks/`, which the unit
lane's globs (`test/analytics/**`, `test/lib/**`) do not match (B2 finding 9).

## 3. LogChamp Block Format v1 (the interchange contract)

JSON. Example (both set forms):

```json
{
  "format": "logchamp.block",
  "version": 1,
  "name": "Upper/Lower - 4 weeks",
  "description": "Optional, up to 2000 characters.",
  "unit": "lb",
  "effort": "rpe",
  "weeks": [
    {
      "label": "Deload",
      "days": [
        {
          "name": "Upper A",
          "exercises": [
            {
              "name": "Bench Press",
              "notes": "Pause 1s on the chest",
              "restSec": 180,
              "effortCap": false,
              "sets": [
                { "reps": 5, "weight": 225, "rpe": 8 },
                { "reps": 8, "repsMax": 10, "weight": 185, "rpe": 7 }
              ]
            },
            { "name": "Plank", "sets": 3, "durationSec": 45 }
          ]
        }
      ]
    }
  ]
}
```

### 3.1 Fields and rules

| Path | Rule |
|---|---|
| `format` | required, exactly `"logchamp.block"` |
| `version` | required, exactly `1` |
| `name` | required string, trimmed length 1-120 |
| `description` | optional string, max 2000 |
| `unit` | optional `"lb"` or `"kg"` - the unit the file's weights are in. Absent = already in the importing user's unit (no conversion). |
| `effort` | optional `"rpe"`, `"rir"` or `"none"`. Absent = derived: any set has `rpe` -> `"rpe"`; any has `rir` -> `"rir"`; neither -> `"none"`. Present and contradicted by set values -> error. `rpe` and `rir` values in one block -> error ("pick one"). |
| `weeks` | required array, 1-52 |
| `weeks[].label` | optional string, max 40 (e.g. "Deload", "Test week") |
| `weeks[].days` | required array, 1-14 |
| `days[].name` | required string, trimmed 1-60 |
| `days[].exercises` | required array, 1-40 |
| `exercises[].name` | required string, trimmed 1-120 - matched to the library exactly as typed (byte-identical names are one exercise; section 4.4) |
| `exercises[].notes` | optional string, max 1000 (setup, cues, lead side, tempo) |
| `exercises[].restSec` | optional integer 0-3600 |
| `exercises[].effortCap` | optional boolean, default false. true = every set's `rpe` is a CEILING (RPE at most N) / every `rir` a FLOOR (at least N in reserve) instead of a target |
| `exercises[].sets` | required: EITHER an integer 1-20 (uniform shorthand - then the exercise itself carries the set fields below, applied to every set) OR an array of 1-20 set objects (then set fields on the exercise are an error) |
| set `reps` | optional number > 0, max 1000 |
| set `repsMax` | optional number > `reps`, max 1000; requires `reps` (a range "8-12" is `reps: 8, repsMax: 12`) |
| set `durationSec` | optional integer 1-3600 (a timed set) |
| set `weight` | optional number > 0, max 2000. **Omit for bodyweight - never 0** (Seth's ISSUE-04 rule) |
| set `rpe` | optional number 1-10 in steps of 0.5 |
| set `rir` | optional integer 0-10 |
| set-level exclusivity | `reps` and `durationSec` never both. Neither is allowed (an open set, e.g. AMRAP, explained in notes). |
| totals | at most 5000 sets in the whole block |
| unknown keys | **error at every level** (`...exercises[1].tempo: unknown field - put it in notes`). Strictness is what catches an AI's drift (`load` for `weight`, `rest` for `restSec`). |

### 3.2 Validator contract - `validateBlockDraft(input, { targetUnit })`

- Returns `{ ok: true, block, stats }` or `{ ok: false, errors }`. Never both,
  never a partially repaired block.
- `block` is the NORMALIZED form: shorthand expanded to set arrays, strings
  trimmed, `effort` resolved, weights converted to `targetUnit` when `unit`
  differs (1 kg = 2.20462 lb, result rounded to the nearest 0.5), `unit`
  rewritten to `targetUnit`. Expansion and conversion are defined transforms,
  not repairs; anything else invalid is an error.
- `errors`: array of `{ path, message }`, at most 50, `path` in the
  `weeks[1].days[0].exercises[2].sets[3].reps` form, message plain English.
- `stats`: `{ weeks, days, exercises, sets, timedSets }`.

### 3.3 Format -> database mapping

| Format | Row / column |
|---|---|
| block | `BlockTemplate` `name`, `description`, `useRPE = effort === "rpe"`, `useRIR = effort === "rir"`, `useDuration false`, `durationWeeks null`, `isPublic false` |
| `weeks[i]` | `BlockWeek` `order = i + 1`, `label` |
| `days[j]` | `BlockWorkout` `order = j + 1`, `name` |
| `exercises[k]` | `BlockWorkoutExercise` `order = k + 1`, `exerciseName`, `notes`, `restSec`, `effortCap`, `targetSets = sets.length`, `targetReps` derived by the existing normalizer |
| `sets[m]` | `BlockWorkoutSet` `order = m + 1`, `reps`, `repsMax`, `durationSec`, `weight`, `rpe`, `rir` |

`formatToCreatePayload(block)` produces the EXISTING create body shape (B1
section "Save flow + payload": `weeks[].workouts[].exercises[].sets[]`,
`name`, `exerciseName`) extended with the new fields, so the one create path
serves builder, import and connector. `blockTreeToFormat(apiBlockTemplate,
{ unit })` is the inverse (export; always the array set form; lossless for
every field in 3.1).

### 3.4 The any-AI instructions (single source)

`server/src/blocks/aiFormatPrompt.js` exports `BLOCK_FORMAT_AI_INSTRUCTIONS`
(plain text, under ~2,500 characters: what the format is, the field table in
prose, the two set forms, "omit weight for bodyweight, never 0", "one of RPE
or RIR", "reply with ONLY the JSON in one code block"), a compact
`BLOCK_FORMAT_EXAMPLE` object, and `BLOCK_FORMAT_JSON_SCHEMA` (a JSON Schema
object for structured-output providers). Served verbatim by
`GET /block-templates/format` (BK3), quoted by the connector's
`get_block_format` tool (BK11) and the coach's draft prompt (BK12). Nobody
else writes a second description of the format.

## 4. Table import grammar (paste / CSV / TSV)

`parseDelimited(text)` -> rows; `tableToBlock(rows, options)` ->
`{ block, warnings, notices }` where `block` is UN-validated format input
(the caller runs `validateBlockDraft` next) and every warning is
`{ row, message }` (1-based source row) or `{ message }`.

### 4.1 Delimiters and structure

- First non-blank line is the header. A tab anywhere in it -> TSV. Otherwise
  CSV, comma-delimited unless the header has more `;` than `,` (Strong's
  European variant). CSV quoting per RFC 4180: double quotes, `""` escape,
  delimiters and newlines inside quotes.
- Header keys normalize to lowercase alphanumerics (`Load_lb` -> `loadlb`,
  `Day Name` -> `dayname`).
- Wholly blank rows are skipped silently. A row with cells but no exercise
  name is skipped with a warning (Seth: a spacer row must not truncate the
  import).
- No `Exercise`-family column -> hard error: "Couldn't find an Exercise
  column. Name one column Exercise."

### 4.2 Header synonyms (normalized)

| Role | Headers |
|---|---|
| week | `week`, `wk`, `weeknumber`, `weekno` - cell `3`, `Week 3`, `W3` |
| week label | `weeklabel`, `phase` |
| day key | `day`, `dayid`, `dayno` |
| day name | `dayname`, `workout`, `workoutname`, `session`, `sessionname` |
| order | `order`, `seq` - sorts rows within a day when present |
| ignored silently | `slot`, `slotid` (Seth's sheet: workbook-side only) |
| exercise | `exercise`, `exercisename`, `movement`, `lift`, `name` |
| sets | `sets`, `setcount` |
| reps | `reps`, `rep`, `repstime`, `repsduration`, `target` |
| weight | `load`, `loadlb`, `loadlbs`, `loadkg`, `weight`, `weightlb`, `weightlbs`, `weightkg`, `lb`, `lbs`, `kg` - an `lb`/`kg` in the header is the column's unit |
| load type | `loadtype` -> note line `Load: <value>` |
| rpe | `rpe`, `targetrpe`; `rpecap`, `maxrpe` also set `effortCap` |
| rir | `rir`, `targetrir`; `rircap`, `minrir` also set `effortCap` |
| rest | `restsec`, `restseconds` (seconds); `restmin` (minutes); `rest` (see 4.3) |
| section | `block`, `section`, `settype` - values `warmup`, `warm-up`, `wu`, `w` mark warm-up rows |
| notes | `notes`, `note`, `comments`, `cue`, `cues` -> first note line; `setup` -> `Setup: x`; `tempo` -> `Tempo: x`; `leadside` -> `Lead side: x`; `job` -> `Job: x` |

Any other column: one warning per column, "Column 'X' was ignored".
Composed notes are newline-joined in the order: notes, Setup, Tempo, Lead
side, Job, Load. (Seth's `logchampIssues.md` ISSUE-05: lead side and setup
must reach a field he sees mid-session; the per-exercise note is that field.)

### 4.3 Cell grammar

**Reps** (case-insensitive, trimmed): `""` no target - `8` - `8-10` / `8 to
10` / en dash -> `reps 8, repsMax 10` - `3x8`, `3 x 8`, `3×8` -> sets 3 +
reps 8 (a filled Sets cell wins on conflict, with a warning) - `3x8-12` -
`5+` -> reps 5 plus note `AMRAP last set` - `AMRAP` / `max` -> no reps, note
`AMRAP` - `45 sec`, `45s`, `45 secs`, `45 seconds` -> durationSec 45 -
`5 min`, `5m` -> durationSec 300 - `1:30` -> durationSec 90 - `3x45s` - any of
these followed by `/side`, `per side`, `each`, `ea`, `/leg`, `/arm` -> the
same plus note `Per side` - anything else -> no reps, note `Reps: <raw>`,
warning.

**Sets:** integer 1-20; otherwise default 1 with a warning.

**Weight:** number with optional `lb`/`lbs`/`kg` suffix (a suffix unlike the
column/declared unit is converted, with a warning) - `bw`, `bodyweight`,
`body weight` -> blank plus note `Bodyweight` - `75%`, `75% TM`, `75% 1RM` ->
blank plus note `Load: 75% TM` plus warning "Percent loads aren't calculated
yet - kept as a note" - `0` -> blank plus warning (never store 0) - other
text (`light band`) -> blank plus note `Load: <raw>`.

**RPE:** `8`, `7.5`; range `7-8` -> 8 plus note `RPE 7-8`; `<=6`, `≤6`, `<6`,
`max 6`, `6 max` -> 6 with `effortCap`; out of 1-10 -> dropped with warning.
**RIR:** same shape; `>=2`, `≥2`, `min 2`, `2+` -> 2 with `effortCap`.
Values in BOTH an RPE and an RIR column -> hard error ("LogChamp plans use
one effort scale - remove one column").

**Rest:** `90s`, `2m`, `2 min`, `2:30` -> seconds. A bare number in a
`restsec` column is seconds, in `restmin` minutes; in a plain `rest` column
<= 10 reads as minutes (warning "Rest 3 read as 3 minutes"), > 10 as seconds.
`3-4 min` -> the low end with a warning.

### 4.4 Grouping

- Weeks: distinct week values ascending -> orders 1..n (a gap warns "Week 3
  wasn't in the file - weeks were renumbered"). No week column -> one week.
  A week-label column: first non-blank value per week.
- Days within a week: keyed by day name, else day key, else `Day 1`; ordered
  by numeric day key when present, else first appearance. Name = day-name
  cell, else `Day <key>`.
- Exercises within a day: rows sorted by `order` when present; CONSECUTIVE
  rows with a byte-identical exercise name merge into one exercise (each row
  appends its set group - top set + back-offs); non-consecutive repeats stay
  separate exercises. Merged notes: first row's, then any differing lines;
  `restSec` from the first row that has one; `effortCap` if any row has it.
- `options.skipWarmups` drops section-marked warm-up rows; `notices`
  reports `{ warmupRows: n }` so the preview can offer the toggle only when it
  matters (ISSUE-07: some warm-ups are therapeutic - the user decides).

## 5. History import (Strong / Hevy exports)

Programs rarely export from other apps (B3 section 2: Hevy, Strong, Fitbod,
Stronglifts export HISTORY CSVs only; routines stay in-app). So "import from
my old app" = rebuild a block from the recurring workouts in a history export.
`historyToBlock(rows, options)`:

- **Detect** by header signature. Strong: `Date`, `Workout Name`, `Exercise
  Name`, `Set Order`, `Weight`, `Reps`, `Seconds`, `RPE` (older `Weight (kg)`
  / `Weight (lbs)` headers name the unit). Hevy: `title`, `start_time`,
  `exercise_title`, `set_index`, `set_type`, `weight_lbs` or `weight_kg`,
  `reps`, `duration_seconds`, `rpe`. Neither -> hand the rows to
  `tableToBlock`.
- **Window:** sessions within 56 days of the NEWEST date in the file (files
  are often old; never compare to today).
- **Days:** each distinct workout title in the window, its MOST RECENT
  session, ordered by that session's date (oldest first). Exercises in
  first-appearance order; sets from that session. Warm-ups skipped (Hevy
  `set_type = warmup`; Strong `Set Order` = `W`). A set with reps -> reps;
  no reps but seconds > 0 -> durationSec; distance-only rows skipped with one
  warning ("cardio rows were skipped").
- **Weeks:** `options.historyWeeks` (1-12, default 4) identical copies of
  that week - the user then shapes progression in the builder.
- **Unit:** Hevy's column names it; Strong's plain `Weight` has none, so the
  preview asks (`options.sourceUnit`, default the user's unit).
- Name: `From Strong` / `From Hevy` plus the window's date range.

## 6. Schema (ONE migration: `20260929120000_blocks_v2`, all additive)

```prisma
model BlockTemplate {        // + fields
  isDraft    Boolean  @default(false) // true only for connector drafts
  source     String?                  // "builder" | "import" | "connector"; server-set, never client-set
  sourceUnit String?                  // "lb" | "kg" - connector drafts only: the unit the AI wrote loads in
  runs       BlockRun[]
}
model BlockWeek            { label String? }
model BlockWorkoutExercise { restSec Int?   effortCap Boolean @default(false) }
model BlockWorkoutSet      { repsMax Float? durationSec Int? }
model WorkoutSet           { durationSec Int? }
model WorkoutSession {       // + fields
  blockRunId        Int?
  blockRun          BlockRun? @relation(fields: [blockRunId], references: [id], onDelete: SetNull)
  blockWeekOrder    Int?     // BlockWeek.order at start (positional stamp)
  blockWorkoutOrder Int?     // BlockWorkout.order at start
  @@index([blockRunId])
}
model SessionExercise      { plan Json? }   // snapshot, section 7.3
model BlockRun {
  id              Int              @id @default(autoincrement())
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  blockTemplateId Int
  blockTemplate   BlockTemplate    @relation(fields: [blockTemplateId], references: [id], onDelete: Cascade)
  startedAt       DateTime         @default(now())
  endedAt         DateTime?
  sessions        WorkoutSession[]
  @@index([userId])
  @@index([blockTemplateId])
}
model AiConsent            { blockDraftsAllowedAt DateTime? }  // section 8 opt-in
// User gains the back-relation `blockRuns BlockRun[]`.
```

**Why `sourceUnit`:** stored weights are unit-less numbers in the user's
display unit, and that preference lives per device (`loadWeightUnit()`,
U6), so the SERVER never knows it. Paste/file imports and coach drafts are
converted client-side-informed (`targetUnit` comes with the request). A
connector draft has no client in the loop, so its numbers are stored as the
AI wrote them and `sourceUnit` records which unit that was; the builder's
draft banner offers a one-tap conversion when it differs from the device's
unit.

Nothing is dropped or renamed. "One active run per user" is enforced in the
start transaction (end the others, then create), NOT by a partial unique
index - Prisma cannot express one, and hand-added SQL indexes read as drift.

**Migration track (gate item 3):** BK1 only WRITES the migration. Pushing the
BK1 landing commit to `ai-connector-wave` deploys staging Render, whose build
runs `migrate deploy` - so that push waits for Seth's "migrate staging".
Prod: Seth hand-applies the migration BEFORE the merge (ordering invariant),
per `RUNBOOK.md` "Schema-change deploy". Prod's build never migrates.

## 7. Running a block

### 7.1 Model

A `BlockRun` is "I'm doing this block, started on this date." At most one
active (`endedAt null`) per user. Drafts cannot be started (409). Only the
owner can start a block (public blocks are cloned first). Deleting a block
deletes its runs; its sessions survive (`blockRunId` -> null).

**Progress** is derived, never stored: a day (week order W, workout order D)
is DONE when the run has a completed session stamped (W, D), IN PROGRESS
when it has only an uncompleted one. The **current week** is the first week
with a day not done (all done -> the last week). This replaces the
localStorage "Set as current" for blocks (`currentProgramStorage.js` keeps
serving workout templates only).

### 7.2 Starting a day

`POST /sessions/start-from-block { blockRunId, weekOrder, workoutOrder }`:

- Owner-checked run (active), existing week/workout (404 otherwise).
- An UNCOMPLETED session for the same (run, W, D) already exists -> return it
  with `resumed: true` instead of creating a second one.
- Else create `WorkoutSession` (`name` = `<block name> · W<W> · <day name>`,
  `blockRunId`, `blockWeekOrder`, `blockWorkoutOrder`, `workoutTemplateId`
  null) and one `SessionExercise` per block exercise copying `exerciseName`,
  `exerciseId`, `userExerciseId`, `targetSets`, `targetReps`, `notes`, plus
  `plan` (7.3). No `WorkoutSet` rows at start (same as template starts).
- `GET /sessions/:id` for a block session adds
  `blockContext: { runId, blockTemplateId, blockName, weekOrder, weekLabel,
  workoutOrder, dayName, useRIR, useRPE }` (null otherwise) - the logger's
  effort seeding reads it exactly where it reads `session.workoutTemplate`
  today (`SessionDetailPage.jsx` ~2295-2304), same resolution rules.

### 7.3 The plan snapshot (`SessionExercise.plan`)

```json
{ "v": 1, "effort": "rpe", "effortCap": false, "restSec": 180,
  "sets": [ { "reps": 8, "repsMax": 10, "durationSec": null, "weight": 185, "rpe": 7, "rir": null } ] }
```

Written once at start, never updated. Editing the block later cannot rewrite
what a past session is judged against - which also closes, for block
sessions, the "planned numbers are read live" defect that
`block-execution-gap.md` flagged for templates (template sessions keep today's
live behavior; out of scope). The positional stamp survives the replace-all
update; a reordered week can mis-attribute progress, accepted and documented.

### 7.4 Logging against the plan

For a session exercise with a `plan`: planned per-set values show as
placeholders (reps or `8-10`, weight, RPE/RIR), a one-tap "as planned" fill
per set, an rx line (`3 × 8-10 @ 185 lb · RPE ≤ 7 · Rest 2:00`), a logged
effort beyond a cap flagged in the warn tone, and **timed sets**: a planned
`durationSec` set logs seconds (`WorkoutSet.durationSec`, reps null). The
F-wave mandatory-effort rules apply unchanged (mind the archived `rir = 0`
blank-vs-truthiness gotcha).

### 7.5 Execution semantics (block branch)

Logged sets of a planned session exercise pair with `plan.sets` by order,
exactly as the template branch pairs with `TemplateSet`s, and reuse its rules
for single reps / weight / effort targets. Extensions: a `repsMax` range is
hit when logged reps fall inside `[reps, repsMax]`; a `durationSec` target is
hit when logged seconds >= planned; with `effortCap`, RPE at or UNDER the cap
(RIR at or OVER) counts as hit. Timed sets contribute nothing to volume,
e1RM, strength or PRs (reps are null) - pinned by tests, not assumed.

## 8. Connector draft tool (amends `ai-layer.md` 4.2 - see its Sept 28 note)

- Two tools on the existing MCP server: `get_block_format` (read-only,
  returns 3.4's instructions + example + schema) and `create_block_draft`
  (`{ block }` in the section-3 format; annotations `readOnlyHint false,
  destructiveHint false, idempotentHint false, openWorldHint false`).
- **Create-only.** No tool edits, deletes, or touches existing blocks,
  sessions or sets. Writes happen in ONE new module
  (`server/src/ai/blockDraftAccess.js`) with the same "isolation happens here
  and only here" doctrine as `analyticsAccess.js`; the userId comes ONLY from
  the verified connector closure - an argument named `userId` is ignored.
- **Opt-in, off by default:** `AiConsent.blockDraftsAllowedAt`. Off -> the
  tool returns an error telling the user where to turn it on (Profile -> AI
  access -> "Let assistants draft blocks"). Revoking AI consent clears it.
- **Guard rails:** `validateBlockDraft` (errors returned so the AI can fix and
  retry); at most 10 connector drafts per user per rolling 24 h and 20 open
  drafts; `unit` is REQUIRED on connector drafts (the server cannot know the
  user's unit - section 6) and is stored unconverted with `sourceUnit`; the
  draft lands `isDraft true, source "connector"` through
  `createBlockTemplateForUser`, identity stamped for the bound user.
- The tool returns `{ blockId, name, stats, reviewUrl, unmatchedExercises }`;
  `reviewUrl` opens the builder, where a banner says "From Claude - review,
  then save to your library" with Save / Discard.
- WorkOS cannot issue a custom write scope (`ai-layer.md` CORRECTION 6), so
  the guard is app-side by construction; the tool annotations are hints for
  the client, never security.

## 9. Coach assist (optional by construction)

- `POST /coach/block-draft { mode: "convert" | "generate", text }` - the
  palette-studio pipeline (`coachController.js` `generatePalette`: prompt ->
  structured output / `extractFirstJsonText` -> parse -> validate ->
  reject-not-repair), with `BLOCK_FORMAT_JSON_SCHEMA` and
  `validateBlockDraft`. Returns `{ block, warnings, source }`; persists
  nothing. `generate` grounds loads in the same training summary the ask path
  loads; `convert` turns messy text (a PDF's text, a forum post) into the
  format.
- "Ask about this block": the existing ask stream with a new focus
  `{ type: "block", blockId }` (owner-checked; the prompt gets a compact text
  rendering of the block).
- Both count as one coach question each (section 1), are consent-gated like
  ask, and are HIDDEN when `/coach/status` says unavailable. Every coach
  result goes through the same preview as a paste import.

## 10. Visual language - the recovery site, in LogChamp tokens

Judgment-heavy visual work: the detail IS the spec. Source of truth for feel:
the recovery artifact's CSS (preserved in the BK4 block).

### 10.1 Mechanics

- **Fonts:** add Barlow Condensed 500/600/700 to the existing Google Fonts
  `<link>` in `client/index.html` (Chakra Petch stays for the rest of the
  app). Token in `index.css` `:root`: `--font-block: "Barlow Condensed",
  "Arial Narrow", var(--font-display), sans-serif`. Body text stays
  `--font-sans`.
- **Stylesheets:** `client/src/styles/blocks/` - `bk-ui.css` (BK4
  primitives), one file per later surface (`bk-builder.css`,
  `bk-import.css`, `bk-run.css`, `bk-log.css`), each imported by its
  top-level component. Class prefix `bk-`. Raw colors are banned in them
  (`check-hex` scans every `client/src` file except `index.css`).
- **Scoped aliases:** the root `.bk` class maps the recovery vocabulary onto
  palette tokens, so the ported CSS reads like the original:

| Recovery | `.bk` alias | LogChamp token |
|---|---|---|
| `--bg` | `--bk-bg` | `var(--color-bg)` |
| `--surface` | `--bk-surface` | `var(--color-surface-1)` |
| `--surface-2` | `--bk-surface-2` | `var(--color-surface-2)` |
| `--field` | `--bk-field` | `color-mix(in srgb, var(--color-surface-2) 60%, var(--color-surface-1))` |
| `--ink` | `--bk-ink` | `var(--color-text)` |
| `--ink-2` | `--bk-ink-2` | `var(--color-text-secondary)` |
| `--muted` | `--bk-muted` | `var(--color-muted)` |
| `--line` | `--bk-line` | `var(--color-border)` |
| `--line-2` | `--bk-line-2` | `color-mix(in srgb, var(--color-border) 55%, transparent)` |
| `--accent` | `--bk-accent` | `var(--color-interactive)` |
| `--accent-soft` | `--bk-accent-soft` | `color-mix(in srgb, var(--color-interactive) 14%, var(--color-surface-1))` |
| `--on-accent` | `--bk-on-accent` | `var(--color-btn-primary-fg)` |
| `--good` / `-soft` | `--bk-good` / `--bk-good-soft` | `var(--color-success-accent)` / `var(--color-success-bg)` |
| `--warn` / `-soft` | `--bk-warn` / `--bk-warn-soft` | `var(--color-warn-accent)` / `color-mix(in srgb, var(--color-warn-accent) 14%, var(--color-surface-1))` |
| `--bad` / `-soft` | `--bk-bad` / `--bk-bad-soft` | `var(--color-error-text)` / `var(--color-error-bg)` |
| `--shadow` | `--bk-shadow` | `var(--shadow-card)` |
| `--display` | `--bk-display` | `var(--font-block)` |
| `--r` | `--bk-r` | `14px` |

- **Inverted = selected, never = CTA.** The recovery site's ink-on-bg
  inversion marks SELECTED state (week tile, segmented option, done set).
  Primary actions keep LogChamp's `.btn` primary tokens so the palette's
  identity carries into block surfaces.

### 10.2 Primitive inventory (dimensions from the recovery CSS)

| Primitive | Spec |
|---|---|
| Eyebrow | 11px/1.2, 600, letter-spacing .12em, uppercase, `--bk-muted` |
| Display title | `--bk-display` 700, 30px/1 (36px at >= 640px), uppercase, letter-spacing .01em, `text-wrap: balance`; optional inline sub-label in `--bk-accent`, 600, .62em, letter-spacing .06em |
| Section rule | `--bk-display` 700 14px, letter-spacing .14em, uppercase, `--bk-ink-2`, then a flex-1 1px `--bk-line` rule; optional trailing chip |
| Chip | height 24px, padding 0 9px, radius 999px, 11px 600 uppercase letter-spacing .06em; neutral = `--bk-surface-2` + 1px `--bk-line-2`; tones accent/good/warn/bad = soft bg + tone text, transparent border |
| Card | `--bk-surface`, 1px `--bk-line`, radius `--bk-r`, padding 14px, `--bk-shadow` |
| Week strip | horizontal scroll (hidden scrollbar), gap 6px; tile flex 1 0 52px, min-height 44px, radius 10px, 1px `--bk-line`, `--bk-surface`, padding 6px 8px 7px; label `W1` in display 600 15px letter-spacing .04em; 3px progress bar (track `--bk-line-2`, fill `--bk-ink-2`); SELECTED = `--bk-ink` bg, `--bk-bg` text, fill `--bk-bg`; CURRENT week = 5px `--bk-accent` dot after the label |
| Day picker | grid, equal auto columns, gap 6px; tile min-height 58px, radius 12px, 1px `--bk-line`, padding 7px 4px 6px; weekday 10px 600 uppercase .1em `--bk-muted`; name display 700 16px, single-line ellipsis; 14px progress ring top-right (track `--bk-line`, fill `--bk-accent`, `--bk-good` when complete, round caps, starts at 12 o'clock; omitted when a tile has no progress); SELECTED = `--bk-ink` border + 1px inset ring; TAG (the run view's `NEXT`, the recovery site's `TODAY`) = centered on the bottom edge, 9px 700 .1em, `--bk-accent` bg, `--bk-on-accent` text, radius 4px |
| Progress bar | 6px, radius 3px, track `--bk-line-2`, fill `--bk-accent`, width transition .3s |
| Exercise card | card + column gap 10px; top row: slot badge (display 500 12px, 1px `--bk-line`, radius 5px, padding 3px 5px, `--bk-muted`, e.g. `A1`) and a right-aligned count (display 600 13px `--bk-muted`, `--bk-good` when full); name display 700 23px/1.05 uppercase .015em; rx line 14px `--bk-ink-2` with values in display 700 18px `--bk-ink` (`3 × 8-10`, `@ 185 lb`, `RPE ≤ 7`, `Rest 2:00`); notes 14px `--bk-ink-2` with a 2px `--bk-line` left rule, padding-left 10px |
| Set grid | columns `40px repeat(4, minmax(0,1fr)) 34px`, gap 6px; header 10px 600 uppercase .1em `--bk-muted`; field height 44px, radius 10px, 1px `--bk-line`, `--bk-field` bg, centered display 600 19px tabular-nums, placeholder `--bk-muted` at .55 opacity; set-number button 40x44, radius 10px, 1.5px border, display 700 17px, DONE = inverted |
| Stepper | grid `44px 52px 44px`, 1px `--bk-line`, radius 10px, `--bk-field`; buttons display 600 22px; value display 700 22px with 1px side rules |
| Segmented | inline-flex, 1px `--bk-line`, radius 10px, `--bk-field`; options min-width 48px, height 44px, display 700 16px .04em; SELECTED = inverted |
| Disclosure | summary 12px 600 uppercase .1em `--bk-muted`, min-height 28px, a `+` / `–` glyph in display 700 16px; body 14px, max-width 65ch |
| Sticky header | `position: sticky; top: 0`, `color-mix(in srgb, var(--bk-bg) 92%, transparent)` + 8px backdrop blur, 1px `--bk-line-2` bottom rule, padding 14px 16px 10px; eyebrow + display title left, status right, week strip below |
| Touch + motion | every control >= 44px tall; `:focus-visible` 2px `--bk-accent` outline, offset 2px; selection transitions 150-200ms ease-out; `prefers-reduced-motion` disables all of it |
| Layout | content max-width 720px centered, 16px gutters (24px at >= 640px), no horizontal page scroll at 390px |

## 11. The coach-persona critique loop (Seth's condition)

Run by the FRONTIER SEAT itself (Opus, Playwright MCP) - Seth asked Claude to
critique it; never a Claude subagent, never a Cursor lane (judgment does not
fan out).

- **When:** round 1 fires once every UI unit (BK5, BK5b, BK6, BK8, BK9,
  BK12) has landed and staging is migrated and deployed. Rounds 2-3 follow a fix block.
- **Persona:** a strength coach who programs for intermediate lifters, on a
  phone between clients, moving a client (Seth) off a spreadsheet.
- **Tasks every round:** (T1) import Seth's real Phase-1 program - the
  `Program` sheet of `RecoveryProgram/workout-program/Phase-1-Program.xlsx`,
  exported to TSV and pasted, week 1 first, then all 6 weeks - and walk
  `logchampIssues.md` section 8 (every row present, the 24 names distinct,
  blanks stay blank, timed sets survive, Lead side and Setup visible
  mid-session); (T2) build a 4-week, 4-day upper/lower block from scratch on a
  390px phone with a labeled deload week and the progression helper; (T3)
  start the block, open today, log two exercises including a timed set, read
  targets / caps / rest mid-set; (T4) Execution judges that session; (T5)
  export and re-import - identical; (T6) the any-AI path: copy the
  instructions, paste an AI-shaped answer, preview; (T7) coach convert and
  ask, when available.
- **Environment:** the staging Vercel deploy of `ai-connector-wave`, the
  `demo.critic` staging account, 390x844 and 1280x800, champ light + dark plus
  one rotating palette per round. Coach checks on the local mock recipe if the
  staging cap bites.
- **Rubric (each 0-10):** first-block speed; mid-set legibility; import trust
  (nothing silently dropped, every transform explained); feel (instant
  feedback, no layout jump, calm motion, clear save state); visual coherence
  (recovery language applied consistently, all palettes, no clash with the
  rest of the app); coaching fidelity (caps read as caps, ranges as ranges,
  rest, week labels, the progression view makes week-to-week intent legible);
  AI optionality (everything works with the coach off; AI output always
  arrives as a reviewable draft).
- **Score:** one overall 0-10. **PASS = 8+, with no criterion below 7 and no
  P0/P1 open.** Findings ranked P0 (broken / data loss) - P1 (blocks the
  coach) - P2 (friction) - P3 (polish), each with a screenshot reference and a
  concrete fix direction.
- **Artifacts:** `docs/tasks/bk-critic-round-<N>-FINDINGS.md` (committed at
  the end of the round - never left in a gitignored folder); screenshots
  local-only under `.playwright-mcp/bk-critic/round-<N>/`.
- **Loop:** a non-passing round -> the frontier seat authors
  `bkf<N>-critic-fixes.md` from the ranked list -> dispatch, land -> next
  round. **At most 3 rounds.** Round 3 below 8 -> stop and report the
  remaining gap to Seth; there is no round 4. The loop sits INSIDE the wave:
  critic done -> N/N -> Seth smokes -> pre-main gate.

## 12. Units, order, collisions

| n | Unit | Side | Needs landed | Runs beside |
|---|---|---|---|---|
| - | BK0 privacy + ToS pages | client | Seth's facts (DRAFT) | anything not touching `App.jsx` |
| 1 | BK1 schema + block persistence + clone fix | server | - | BK2, BK4 |
| 2 | BK2 format, validator, parsers (pure) | server | - | BK1, BK4 |
| 3 | BK4 block UI primitives | client | - | BK1, BK2 |
| 4 | BK3 import / export / format API | server | BK1, BK2 | BK5, BK7 |
| 5 | BK5 block builder rework (core) | client | BK1, BK4 | BK3, BK7 |
| 6 | BK7 run a block - server | server | BK1 | BK3, BK5 |
| 7 | BK5b copy-forward + progression view | client | BK5 | BK10, BK11 |
| 8 | BK10 Execution + timed-set analytics safety | server | BK7 | client units |
| 9 | BK6 import + export UI | client | BK3, BK5b | BK10, BK11 |
| 10 | BK8 run a block - client | client | BK6, BK7 | BK9, BK11 |
| 11 | BK9 logger: plan targets + timed sets | client | BK7 | BK8 |
| 12 | BK11 connector drafts + opt-in | server + AI-access UI | BK3 | BK8, BK9 |
| 13 | BK12 coach assist | server + client | BK6, BK8 | - |

Hot-file owners: `schema.prisma` BK1 only; `app.js` BK3 only (import body
limit); `routes/index.js` BK7 only; `App.jsx` BK6 then BK8 (and BK0);
`MyTemplatesPage.jsx` BK6 then BK8; `index.css` BK4 only (tokens);
`SessionDetailPage.jsx` BK9 only; `mcpServer.js` BK11 only;
`coachController.js` BK12 only; `blockTemplateController.js` BK1 then BK3;
`client/src/components/blocks/builder/*` BK5 -> BK5b -> BK6 -> BK12 (serial).
**Lanes cannot run the integration lane** - server units prove the module
graph loads (`node -e "require('./src/app.js')"` from `server/` with the
lane's env) and the reviewer proves routes live against staging after deploy
(HANDOFF gotcha: a green unit lane is not coverage of an endpoint).

## 13. Deferred (named so they are not silently dropped)

Percent-of-training-max loads resolved against e1RM (a genuine
analytics-first differentiator - its own wave); per-side plan structure
(the logger's MW6 heuristics decide L/R pairing today); supersets/circuits;
a progression-rules engine beyond the builder's copy-forward helper; importing
HISTORY into analytics; Liftoscript import; direct `.xlsx` upload (needs a
dependency, gate 5); snapshotting TEMPLATE session plans; connector tools that
edit or delete; a What's New entry for this wave (write it at merge time,
plain language, prod-only per standing rule).
