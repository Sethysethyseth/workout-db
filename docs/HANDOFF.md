# HANDOFF — current state

> **WHERE WE ARE (Oct 7, late):** **PRE-MAIN GATE: PASS** (Opus seat) for the
> whole `ai-connector-wave` branch (BK + bkr + sr3, 142+ commits over `main`
> `7d3b91e`) - verdict + Seth's prod steps in "Gate verdict" right below.
> Smoke round 4 signed off. The sr3 wave: 10/10 landed - the 7 sr3 units,
> then Seth's one-round feel critic (6/10 FAIL, one P1) and its fix round
> **sr3f1** `cf4fdee` (Library), **sr3f2** `b64de00` (builder), **sr3f3**
> `ccf468b` (add to library in 3 taps). Rulings: FINDINGS
> "Round 3 rulings" + QUEUE's sr3 header (item 1 was a missing RESUME, not
> data loss; item 10 swap-for-today PARKED). Landed: sr3-d1 + picker-height
> fix `a6f007f`; **sr3-1** `077f4b2` pause/resume ("Left off at Wn · Day",
> Resume / Start over); **sr3-2** `9c7f1f1` a week holds at most 7 days;
> **sr3-3** `ba415bf` (+ `230d4c0`) round "..." for week/day actions, the
> RPE/RIR/"Effort: off" chip, Public says Seth's line; **sr3-5** `c6ae089`
> "Per side" on block exercises (the wave's ONE migration - STAGING applied
> Oct 6 under "migrate staging"; PROD is Seth's hand-apply before the merge,
> next to BK1's); **sr3-4** `f1fbf55` add a not-in-library exercise to the
> library from the builder and import; **sr3-6** `468bab9` hold a day or
> week pill to drag it to a new place (seat-fixed drop target). Every server
> change was proven live on the staging DB. Prod unchanged: `main` =
> `7d3b91e`.

**SMOKE ROUND 4 SIGNED OFF (Oct 7, Seth, verbatim):** "yeah everything else
looks good /pre-main-review" (after a future-wave note on exercise
hold-to-move).

**PROD MIGRATIONS APPLIED (Oct 7, late, Seth: "migrations ran"):**
`20260929120000_blocks_v2` + `20261006200000_block_exercise_per_side` by
hand in the prod Neon SQL editor (steps 1-2 below). Agent-side read-only
verification not done - no read-only prod connection file was found
outside the repo this session.

**Next action (human):** confirm step 3's verify output (or paste it), then
say "push to main".

## ▶ GATE VERDICT (Oct 7, late, Opus seat) - PASS

**PASS** - ready for the merge ritual once prod has both migrations. One
seat fix during the gate: `1ce8fdb` (week/day strips honour reduced motion -
the gate note carried since Sept 29). Nothing else needs code before main.

What was read directly (schema / security / cross-user, never fanned out):
- **Schema + migrations:** `blocks_v2` + `block_exercise_per_side` match the
  schema diff one-to-one; purely ADDITIVE (nullable columns, NOT NULL only
  with defaults, a new `BlockRun` table, indexes, FKs). `BlockRun` cascades
  with its template/user; `WorkoutSession.blockRunId` is SET NULL, so
  deleting a block keeps logged workouts (matches the Library copy).
- **Clone isolation (BK1, carried since Sept 29) - CLOSED.** A clone of a
  foreign public block carries NAMES only (`buildClonePayload`); every write
  path re-stamps `exerciseId`/`userExerciseId` from the REQUESTER's library
  (`stampBlockWeeksArray` -> `stampExerciseIdentityWithIndex` always sets
  both keys) and the normalizers never accept client ids - a stranger's
  custom-exercise id cannot be copied in.
- **Ownership everywhere:** block templates (GET/export public-or-owner;
  PATCH/DELETE/accept owner), block runs (all four routes `userId`-scoped;
  runs only on OWN templates), start-from-block (own OPEN run only), left-off
  (ids derived from own runs), coach block focus (owner-checked before any
  text, 404 otherwise), connector `create_block_draft` (create-only drafts,
  userId from the verified closure, consent + separate opt-in, 10/day + 20
  open), consent toggle (revoke also clears the block-drafts opt-in).
- **Raw SQL:** only two sites, both tagged-template parameters, both scoped
  (advisory lock in `usageLedger.js`; the usage-ranking query in
  `GET /exercises/search`, debounced client-side).
- **Coach cost:** reserve-before-provider on every hosted path; refunds only
  for an undelivered answer or a <=400-char off-topic decline.
- **No What's New entry** in the wave - the merge fires no modal on prod.

Gate fuel (Cursor report lanes, auto rung, kept as FINDINGS):
`gate-r1-fresh-lanes-tokens-schema-FINDINGS.md` (542 unit tests, build clean;
ZERO raw colours added across the whole wave; all 49 new `var()` names
defined; schema/SQL/FK/NOT-NULL cross-check clean; migrations CRLF;
`read-excel-file` lazy-loaded in its own 67 kB chunk) and
`gate-r2-route-ownership-inventory-FINDINGS.md` (every new/changed route and
MCP tool: SCOPED or intended PUBLIC-READ, none unscoped). Spot-checked.

Accepted / follow-up, NOT blockers:
- `/coach/import-map` + the import-fix recipe path accept 1,000,000 chars but
  sit behind the default 100 kB JSON body limit - a >100 kB paste gets a raw
  413. Real sheets are far smaller; follow-up: a route-level limit or a
  friendly message.
- No rate limiter on `/block-templates/import*` or `/block-runs` (authed,
  DB-only, no provider cost).
- BK7 / sr3-1 "two open sessions/runs" race (no unique guard) - accepted.
- Public blocks: UI says "not yet", the API still accepts `isPublic: true`;
  existing public blocks stay public - accepted (sr3-3 ruling).
- The 7-day cap: a prod block with 8+ days in a week still opens and runs;
  saving an edit asks to trim first. Optional check below.
- Prod-vs-staging migration DRIFT (Housekeeping): NOT a merge blocker -
  prod never runs `migrate deploy` (the patch wave merged with it present).
  Stays housekeeping.

### Seth's prod steps (RUNBOOK section 3 - DB first, code second)

In the Neon SQL editor for **PROD** (`snowy-resonance` /
`ep-solitary-sea-an56mioq` - confirm the host in the URL bar first):

1. Paste `server/prisma/migrations/20260929120000_blocks_v2/migration.sql`
   verbatim and run it. Then:
   ```sql
   INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   VALUES
     (gen_random_uuid(), '4e6ec40478ca8e271bad1755d9cf7e635cd0b73ee298fe16fb4f409d01e985d3', now(), '20260929120000_blocks_v2', NULL, NULL, now(), 1);
   ```
2. Then the per-side column and its row:
   ```sql
   ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "perSide" BOOLEAN;
   INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   VALUES
     (gen_random_uuid(), 'dfaa91e1eec253f0bc3a9b14436d71d6f598033ad636062e8888b57338203fe6', now(), '20261006200000_block_exercise_per_side', NULL, NULL, now(), 1);
   ```
   (Checksums read Oct 7 from STAGING's `_prisma_migrations`, host
   `ep-bitter-breeze`, per the RUNBOOK rule "copy it, don't invent it".)
3. Verify:
   ```sql
   SELECT table_name, column_name FROM information_schema.columns
   WHERE (table_name = 'BlockRun')
      OR (table_name = 'BlockWorkoutExercise' AND column_name IN ('restSec','effortCap','perSide'))
      OR (table_name = 'WorkoutSession' AND column_name IN ('blockRunId','blockWeekOrder','blockWorkoutOrder'))
   ORDER BY table_name, column_name;
   SELECT migration_name, checksum FROM "_prisma_migrations"
   WHERE migration_name IN ('20260929120000_blocks_v2','20261006200000_block_exercise_per_side');
   ```
   Expect 5 BlockRun columns, 3 + 3 others, and the two rows.
4. Optional (7-day cap): `SELECT "blockWeekId", count(*) FROM "BlockWorkout"
   GROUP BY 1 HAVING count(*) > 7;` - any rows are old blocks that will ask
   to be trimmed on their next save.
5. Then say **"push to main"** - the merge runs one command at a time
   (RUNBOOK + gate item 1), using a temp worktree (OneDrive lock lesson).
6. After the deploy: smoke prod login, Library, open a block, start a block
   day; then M2 (repoint staging Render `workout-db-staging` to `main`, and
   only then retire the `ai-connector-wave` preview host from the staging
   WorkOS sign-in URI) - Housekeeping below.

## ▶ PICK UP HERE (Oct 7, late - after the gate)

1. Seth runs the prod steps above, then "push to main" -> the merge ritual,
   one command at a time, report the merged SHAs + `origin/main` HEAD.
2. Post-merge: prod smoke, M2 repoint, close the wave in HANDOFF (move the
   sr3/BK/bkr detail to the archive verbatim).
3. Next wave candidates: Seth's exercise hold-to-move note, the HELD search
   synonyms, the deferred critic P3s, the import body-limit follow-up.

### Agent sitting with Seth on smoke round 4 (when he runs it)

You sit with Seth while he smokes, ONE item at a time, and record results. You
do NOT fix code and do NOT run the gate. Any model can do this.

1. Where: the staging Vercel preview of `ai-connector-wave`
   (`https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`,
   behind Vercel login), phone first. NEVER local dev (`client/.env` = prod).
   Confirm `origin/ai-connector-wave` HEAD and the Render staging deploy first.
2. Accounts: `test123` / `password` - state re-read Oct 7 from the staging
   DB: running block = "Imported block" (run 8) with W1 D1 IN PROGRESS
   (session 474). "Upper/Lower Strength - 4wk" has TWO ended runs: run 5
   (W1-W3 done, W4 · Upper A next - ended when Seth switched blocks Oct 6)
   and run 7 (the OLD code's from-scratch restart that same afternoon, 1 of
   16 days). Left-off offers the LATEST run only, by design, so Library
   shows "Left off at W1 · Lower A" (not W4 · Upper A - the Oct 6 note was
   wrong). Prod has no block runs, so no real user is in this state. Or Seth's own
   staging account. Coach uses are capped at 7 per rolling 7 days.
3. Record: append `## Smoke round 4` (round 3 is Seth's intake notes) to
   `docs/tasks/bk-smoke-FINDINGS.md` - one line per item: PASS, or FAIL with
   Seth's words + screenshot (`claudefiledrop/`, untracked) + severity (P0 data
   loss / P1 blocks him / P2 friction / P3 polish). New scope = CR. Commit +
   push the doc at the end.
4. Verify, don't guess: staging API with a cookie login; READ-ONLY Prisma
   reads from `server/` (`server/.env` = staging).
5. Defects become DIAGNOSIS blocks after the last item; sign-off resets.
6. On "smoke signed off": record it, set Next action to the pre-main gate
   (`pre-main-review`, OPUS seat, with the gate notes below), stop.

### Re-smoke checklist - BK + bkr (staging Vercel, phone first)

Already PASSED in round 2, no need to repeat: Library, import from a file,
Sets x Reps, Any AI paste, export round-trip, Execution, desktop builder
header. Connector drafts stay deferred until a staging connector exists.

1. **Home with your running block:** "Start a workout" first ("Start empty
   workout" starts one directly; "Browse templates" opens the picker). Under
   it, a calm "Next in your block" card: W4 · Upper A on one line, the week
   strip, one line of exercises, "Start W4 · Upper A" (starts that day in the
   logger). The stats card is titled "Last 7 days" and has NO day strip while
   the block card shows. Nothing jumps as the page loads (reload twice).
2. **Home with no block running** (Seth's own account, or end-block on a
   spare): hero, then "Last 7 days" WITH its day strip (the same 7 days as the
   numbers), then Recent workouts.
3. **Home during a live workout:** exactly one Resume (the card, with "n of m
   sets logged" on block days); the bottom "In progress" bar is gone on Home
   and on Import, still there on Analytics/History/Library/Profile.
4. **Finish bar (iPhone):** on a block day tap a reps field - the Finish bar
   slides away while the keypad is up; close the keypad WITHOUT tapping
   anything else - it slides back.
5. **Builder card:** expand an exercise: round "...", one scrolling row of
   chips showing values (Rest 3:00, Reps, RPE cap, the note text). Each chip
   opens a small sheet with only that setting (Rest has presets None / 1:00 /
   1:30 / 2:00 / 3:00). "..." (card or header) opens an actions list. Sheets
   darken the page (dark mode). Remove / delete day / delete block ask ON THE
   PAGE, never a browser pop-up; closing with unsaved edits just leaves (the
   draft comes back with Restore).
6. **Library deletes:** deleting a block, workout or custom exercise asks on
   the card ("Your logged workouts stay"), never a browser pop-up.
7. **AI waits:** new block -> "Describe the block you want" -> Draft with the
   coach: breathing crown + "Drafting your block..." on the button; "Still
   working..." at 15 s; gives up with a message at 2 minutes. Costs 1 use.
8. **AI file fix:** paste a messy sheet (odd columns, "three sets") ->
   Preview: the problems are listed first, then "Have AI fix this file" with
   "you have N left". A clean sheet or a LogChamp export shows NO AI button.
   After the fix: "AI read: ... (was ...)", an "AI changed" list, "Use the
   original read", "AI fix used N coach uses" - and the coach counter drops by
   exactly N.
9. **Coach limits:** ask the coach something off-topic ("write me a C#
   script") - a one-line decline, no code, the weekly counter does NOT drop.
   With fewer than 4 uses left the file-fix button is disabled and says when
   uses free up.
10. **Logger Back:** leaving a live workout with Back no longer asks.
11. **Imported file name:** importing `Phase-1-Program.xlsx` names the block
    "Phase-1-Program".

### Smoke round 4 - the sr3 items (same session, after the 11 above)

A. **Pause / resume (sr3-1):** Library -> "Upper/Lower Strength - 4wk" shows
   "Left off at W1 · Lower A" (test123's latest run - see Accounts) ->
   Start -> on-page choice "Resume at W1 · Lower A" / Start over / Cancel;
   the confirm also says "This pauses Imported block - you can pick it up
   where you left off." -> Resume -> Current block shows W1 · Upper A done,
   W1 · Lower A next. Then Library shows
   "Imported block" with its own "Left off" line. (End block's confirm now
   says "You can pick it up where you left off from your library.")
B. **Add exercise opens right (sr3-d1, Android):** builder -> "+ Add
   exercise" the FIRST time -> a tall sheet with the search box visible above
   the keyboard and room for results.
C. **7 days max (sr3-2):** a week with 7 days -> the "+ Day" button reads
   "7 days max" and does nothing; the day "..." -> Duplicate is disabled
   too. Importing a file with 8 days in a week -> "Week 1 has 8 days - a
   week holds at most 7."
D. **Week / day actions (sr3-3):** a round "..." beside "Week n" and at the
   end of the day line, each opening rename / duplicate / move / delete.
E. **Effort chip (sr3-3):** under the block name: "Effort: off" / "RPE" /
   "RIR"; tap -> "Effort scale" sheet; the choice shows in Settings too.
F. **Public (sr3-3):** Settings -> tick Public -> toast "this hasnt been
   implemented yet bro stop prying", box stays unticked; Library "Make
   public" says the same.
G. **Per side (sr3-5):** expand "Single-Leg Calf Raise" in a block -> a "Per
   side" chip that is ON and the summary ends "each side"; "Back Squat" OFF;
   tap to flip either, save, start that day -> the logger shows Right/Left
   grids exactly for the ones that are on.
H. **Add to library (sr3-4):** builder search "Zercher Carry Hold" -> both
   "Use ..." and "Add 'Zercher Carry Hold' to your library" -> add it ->
   it lands in the day with no "Not in library" chip; a free-text exercise's
   card "..." -> "Add to library"; import a sheet with an unknown name -> its
   row's "Add to library" moves it out of "Not in your library".
I. **Hold to reorder (sr3-6), ON THE PHONE:** in the builder, press and
   hold Day 1 about half a second -> it lifts (a little bigger, shadow, a
   buzz on Android). Drag it slowly right past Day 3 - the other days slide
   aside one at a time WITHOUT flickering - let go -> it lands there, the
   days renumber, and if Day 1 was selected it is still selected. Same for
   a week pill (a 5+ week block: drag to the strip's edge and hold - the
   strip scrolls and stops at the end, no empty space). A quick swipe still
   scrolls the strip; hold-and-release without moving changes nothing and
   opens no actions; a tap still selects, a re-tap still opens the actions.
   No text-selection or iOS callout on the long-press. The Current Block
   page, Home and the import preview strips do NOT lift. (Touch drag is the
   one thing desktop Playwright could not prove.) The lifted pill now glows
   in the accent colour and keeps its selected outline (sr3f2).

### Smoke round 4 - the critic fix round (sr3f1-3, after A-I)

J. **Library, paused block (sr3f1):** "Upper/Lower Strength - 4wk" sits
   right under the running block with a "Paused" chip (amber), a "Resume"
   button and "Left off at W1 · Lower A · 1 of 16 days done". Scroll to the
   bottom of Library and tap Start or Resume on a lower card -> the choice
   opens ON THAT CARD, on screen (it used to open at the top of the page,
   off-screen). Library > Exercises empty state mentions "Add to your
   library" from the builder.
K. **Builder state you can see (sr3f2):** Per side ON is accent-coloured
   with a check mark and sits before the RPE/RIR chip; reorder or move days
   -> days still called "Day n" renumber (a pill never reads "DAY 3 / Day
   1"); names you typed stay. A saved block with free-text exercises still
   shows "Not in library" + "Add to library" after reopening.
L. **Effort sheets (sr3f2):** the RPE / RIR / None buttons fill the sheet's
   width with one line under them explaining the choice - in the Effort
   chip's sheet and in Block settings.
M. **Small builder fixes (sr3f2):** after switching weeks, one tap on Day 1
   just selects it (a second tap opens its actions); adding the 7th day
   scrolls so "7 days max" is visible; the day "..." row reads "Duplicate -
   7 days max"; ticking Public in Block settings shows your line UNDER the
   checkbox (no toast over it) and the "Visible to others for clone" text is
   gone.
N. **Add to library in 3 taps (sr3f3):** builder search a made-up name ->
   "Add '...' to your library" -> it opens straight on the muscle list ->
   pick one -> Add exercise -> back in the builder with the exercise in the
   day and a toast "Added '...' to your library." (no "Added" sheet). The
   headers in that sheet match the builder's style. A live workout's "Not
   tracked - add?" flow is unchanged.

**By design - do not log as defects:** one AI button on import (the layout
read and the prose convert merged); the Any AI tab has no AI button; palette
generation costs 1 coach use; the stats are a rolling 7 days ("Last 7 days");
unmatched imported names do not count toward Analytics; timed sets add nothing
to volume; copy forward skips Deload-labeled weeks unless ticked; saving is
blocked while any day is empty; "Create workout" is greyed in Library
(parked); a ~1 s Login flash after iOS clears site data for 7+ idle days
(candidate, not this wave).

**Known and deferred (do not fail the smoke on them):** no rest timer after a
set; fractional Execution numbers; desktop In-progress bar width; "Per side"
offered on bilateral lifts; the builder's week pill is a bright white bar;
crimson's "good" colour reads amber; the old quick-log set-count / L-R pair
confirms are still browser dialogs; critic R1 P3 leftovers not in bkrf1
(session-page skeleton, bk-log-focus before the fetch).

**Gate notes for `pre-main-review` (after sign-off):**
- Carried from Sept 29: clone isolation (BK1, cross-user) - a live clone of
  a FOREIGN public block was not possible on staging; BK11 connector write
  path (cross-user; Claude-side check is the deferred connector item); BK12
  block-focus owner check lives in `askCoach.js` (accepted placement); BK10
  reuses `templateExerciseId` for `block:<id>` keys and `judgePlanHit` is
  unused (spec 7.5 ruling); BK7 start-from-block has no unique guard (race ->
  two sessions); WeekStrip smooth scroll ignores reduced motion.
- Since Sept 30: bksf2a's raw `$queryRaw` in `GET /exercises/search` (user-
  scoped, parameterised; scans every SessionExercise + BlockWorkoutExercise
  row per keystroke - check the cost on a heavy account); `read-excel-file`
  dependency (`fa1ea8b`, Seth-approved); bks2 author notes in the plan
  snapshot.
- Seat fixes outside Cursor units: `aadb365`, BK5 state fixes, `0a92af6`,
  `8da0ae5`, `207c0f2` (Sept 29); `924bc66` (hook-order P0), `8badd2f`,
  `2deedf5`, `bd0e4b3`, `9633c20` (bksf3b: a just-logged row PATCHed blanks -
  review BlockSetRow's managed-draft handoff), `9f6b2a0`.
- bksf3b ruling: block sessions stay POSITIONAL (`blockWorkoutSetId` unused,
  spec 7.3). Out-of-order logging would be a schema change.
- **bkr wave (Oct 5-6) - review hardest:**
  - bkr2 `ed92b31`: `usageLedger.js` takes
    `pg_advisory_xact_lock(hashtext(userId))` via `$executeRaw` inside an
    interactive transaction (proven on staging: 9 parallel single reserves ->
    7 ok / 2 refused). Every hosted path reserves BEFORE the model call (ask 1,
    draft 1, import-map 3, palette 1, import-fix 4 settled 1-4). Off-topic
    asks: the model prefixes `[[OFF_TOPIC]]`, the server strips it and
    refunds only a decline <= 400 chars (seat fix - a prompt that forces the
    marker must not get free answers). Generate-mode off-topic uses a sentinel
    block name (structured output). Seat fix: draft + import-map abort the
    provider call on client disconnect (bkr-d2: a draft finishing after the
    phone gave up stayed charged).
  - bkr3 `fb896ec`: `POST /coach/import-fix` - table vs prose detection (seat
    fix: rows must align with a short-label header, else prose with commas
    went to the recipe path); the convert path keeps block-draft's 20k input
    cap (seat fix - it sent up to 1 MB); tier thresholds 4k/8k/14k tokens are
    product numbers Seth can retune (`weeklyCap.js`).
  - bkr-f1 `eebadf4`: `bk-log-kbd` = focused logger field AND visualViewport
    >150px shorter; proven only with a shadowed-visualViewport harness -
    Seth's iPhone check is the real proof.
  - bkr1 `3373a9b` / bkrf1c `4352e91`: AI calls carry AbortControllers
    (120 s); `AiWait` two-face button slot; `aiFixChanges.js` diff helper.
  - bkr4 `1f6d42a` / bkrf1a `07bd1ea`: every builder `window.confirm`
    replaced (the leave guard too - the local draft covers it); new
    `--color-scrim` token per mode; `font-family: inherit` on form controls
    is APP-WIDE (check nothing that relied on the UA font shifted).
  - bkr5 `52ee633` / bkrf1b `b1ed933`: the Home hero no longer depends on the
    run fetch; sessionStorage `workoutdb-home-has-run` predicts the block-card
    placeholder; the rolling "Last 7 days" strip changed `workout/WeekStrip`
    (Home-only); PersistentWorkoutBar hidden on `/` and `/blocks/import`.
  - Critic: R1 6/10 FAIL (`bkr-critic-round-1-FINDINGS.md`), all R1 P2s
    addressed by bkrf1a-c; R2 skipped by Seth.
- **sr3 wave (Oct 6) - per-unit audits in QUEUE.md:**
  - sr3-1 `077f4b2`: resume REOPENS an ended run (`endedAt` -> null) after
    ending the user's other open runs in one transaction - same "two open
    runs" race class as create (no unique guard); `GET /block-runs/left-off`
    lists each template's LATEST run only when ended + unfinished + has a
    done/in-progress day. A paused run and a deliberately ended one look the
    same (no schema change, by ruling).
  - sr3-2 `9c7f1f1`: `MAX_DAYS_PER_WEEK = 7` in `blockFormat.js` feeds Format
    v1, the AI schema and the save-path normalizer; an existing 8+ day block
    cannot be saved until trimmed (the builder shows why); history import
    with 8+ distinct titles now hard-fails (follow-up candidate).
  - sr3-3 `ba415bf` + `230d4c0`: Public is blocked in the UI only - the API
    still accepts `isPublic: true`, and already-public blocks stay public.
  - sr3-5 `c6ae089`: the wave's ONE migration
    `20261006200000_block_exercise_per_side` (`perSide BOOLEAN`, nullable);
    applied to staging from this Windows tree (CRLF checkout, no
    `.gitattributes`) like BK1 - check checksum drift before any prod
    `migrate deploy`. `ExerciseRx` gained an optional `suffix` (shared ui).
  - sr3-4 `f1fbf55`: `AddExerciseToLibrarySheet` has a new `context="library"`
    path (no session exercise) - review that the live/completed logger paths
    are unchanged.
  - sr3-6 `468bab9`: new `ui/useHoldToReorder.js` (pointer events, a
    non-passive `touchmove` on the strip that cancels the pan ONLY while
    lifted, `body.style.overflow` lock while lifted, click suppression via
    a 400 ms capture-phase window). Seat fix folded in: drop target from
    slot centres snapshotted at lift (live rects flickered), scroll-aware
    offset clamped to first..last slot. Review: the touch path on iOS and
    Android (only desktop mouse was proven), `WeekStrip` is shared with
    Home/run page - confirm nothing changes without `onReorder`.
- **sr3 critic fix round (Oct 7) - per-unit audits in QUEUE.md:**
  - sr3f1 `cf4fdee`: the Start/Resume choice moved INTO `LibraryBlockCard`
    (props from MyTemplatesPage); client-side sort running -> paused (by
    `endedAt`) -> rest; Paused chip uses the `warn` tone (same as Draft).
  - sr3f2 `b64de00`: `renumberDefaultDayNames` runs in add/duplicate/move/
    reorder/delete/removeEmptyDays (`/^Day \d+$/` only); hydrate sets
    `notInLibrary` from `exerciseId`/`userExerciseId`; tap-to-open-actions
    now keyed on two refs reset by every programmatic selection (review the
    coverage of those resets); opt-in `Segmented fill` + `DayPicker
    scrollEndToken`; `BlockSettingsSheet` lost its `onToast` prop.
  - sr3f3 `ccf468b`: library-context-only branches in the shared
    `AddExerciseToLibrarySheet` (also used by the live logger) - review the
    `isLibraryContext` gating; header tokens are :root (`--font-block`).
- Before any merge: Seth hand-applies BOTH migrations to PROD, in order -
  BK1's `20260929120000_blocks_v2`, then sr3-5's
  `20261006200000_block_exercise_per_side` (RUNBOOK "Schema-change deploy") -
  and the prod-vs-staging migration drift (Housekeeping) gets reconciled. bkr
  added NO migration.

### Open on prod - Seth's checks, none blocking

Checks 1-4 (connector ID1, AuthKit lifetime, patch-wave post-deploy,
`COACH_UNCAPPED_EMAILS`) are DONE - archived Oct 6.
5. **F/E-wave PROD smoke** - still open (section below).

### Seth's asks, Sept 29 - NOT scheduled, no unit authored (needs a wave slot)

- **Discard on the live-workout entry points.** The discard X (WD1) exists
  only inside `SessionDetailPage`. Seth wants it reachable from the Home
  "In progress / Resume workout" card and the floating "In progress" bar
  (his screenshot: `claudefiledrop/image0.jpg`, untracked, both circled),
  with a warning confirm before it deletes. Reuse WD1's confirm pattern
  (`.session-discard-confirm`) and the existing race-safe
  `POST /sessions/:id/discard`.
- **Coach "thinking" state.** The first coach question is slow; add a
  custom loading state while the coach is working so users know it is not
  stuck (CoachPanel.jsx).
- **No way to view past coach conversations.** Coach history is not stored
  or browsable today; Seth flagged it. Product decision first (persist
  content? that changes the privacy page's "records only who and when"
  cap statement in BK0).
- **RULING (Seth, Sept 29): the bring-your-own coach key MUST be
  encrypted.** Today it is not - it lives plaintext in the browser's
  `sessionStorage` (`client/src/lib/coachKeyPref.js`) and rides each coach
  request in the `x-coach-key` header; the server stores no user key. BK0's
  block claims "encrypted at rest and never shown again", which is FALSE
  for the current code. Two things follow: (1) BK0 must not publish that
  claim until the design below ships - correct the block first; (2) a
  design decision is owed (server-side encrypted storage with a secret in
  Render env + a schema change, vs keeping it browser-only and saying so).
  Schema + secrets = a frontier-seat / security escalation, not a Sonnet
  unit. Nothing authored yet. Also logged in `docs/legal/LEGAL-QUESTIONS.md`.
- **BK0 (privacy/ToS) facts - Seth took the recommended defaults Sept 29,
  to be critiqued later:** deletion = "email us, we delete within 30 days"
  (manual prod delete, Seth only); effective date = go-live date; contact =
  a dedicated address, not personal Gmail. STILL NEEDED before BK0 flips
  to QUEUED: operator name, the actual contact email, US state.

### Housekeeping

- **M2 is ON HOLD for the BK wave (Sept 28):** staging Render
  `workout-db-staging` KEEPS tracking `ai-connector-wave` - the BK wave lands
  there, so no repoint and the staging connector's sign-in URI (pinned to the
  `ai-connector-wave` Vercel PREVIEW host) keeps working. Repoint to `main`
  only after the BK merge. Never delete `ai-connector-wave` while that URI
  points at its preview host. **Sept 29: it had in fact been tracking
  `main`** (so no BK push deployed for ~1h - the "Render stuck" symptom);
  Seth repointed it to `ai-connector-wave`. If staging ever looks stale
  again, check Render -> Settings -> Branch FIRST.
- **Temp worktree `C:\dev\worktrees\merge-main-0927`** (on `main` @ `7d3b91e`,
  clean) still exists - merge-ritual command 4 (`git worktree remove`) was
  never approved. Ask Seth before running it.
- **Stale `.git/worktrees/merge-main` admin dir** (OneDrive lock): every
  `git fetch`/commit prints `failed to delete '.git/worktrees/merge-main':
  Permission denied`. Harmless; `git worktree prune` once the lock clears.
- **`ai-connector-wave` = `main` + docs-only HANDOFF commits** (`9efcc5a`,
  `bc28d4b`, `6cace99` and this rewrite). Same known pattern as past waves.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from any recent wave and not blocking (prod's build never runs `migrate
  deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

### Next work

- **The BK + bkr + sr3 waves** - all landed on `ai-connector-wave`; Seth's
  consolidated smoke (round 4), then the gate. Nothing else is queued.
- **Seth's note for a FUTURE wave (Oct 7, after smoke round 4):** "you can
  hold and move exercises like days and weeks, when held app adjusts so you
  can move them easier" - long-press reorder for exercise cards in the
  builder (reuse sr3-6's `useHoldToReorder`, vertical axis), with the list
  adapting while held (e.g. cards collapse to one line) so a long day is
  easy to drag across. Not this wave.
- **HELD for Seth's next change (Oct 7, his ruling): exercise search
  synonyms.** The sr3 critic's P2-7 said multi-word search fails ("single leg
  calf" -> 0); the seat checked the pure `searchCatalog` and the diagnosis was
  wrong - it already AND-matches words ("one leg calf" finds "Dumbbell Seated
  One-Leg Calf Raise"); the miss is a SYNONYM gap ("single" vs "one"). Seth
  said one of the changes he wants is related - fold this into that work
  (likely `server/data/exercise-aliases.json` + its rationale doc, or
  query-side synonyms in `server/src/analytics/searchCatalog.js`).
- **sr3 critic deferred P3s** (`sr3-critic-round-1-FINDINGS.md`): P3-1
  builder name gets its own row, P3-2 coach box placement / title wrap, P3-5
  one action-sheet style, P3-8 recent exercises on an empty search, P3-10
  Library load time.
- **sr3 follow-up candidates:** history import keeps the 7 most-used titles
  with a "skipped" warning (today 8+ titles hard-fail the preview, sr3-2);
  swap an exercise for today on a block day (smoke round 3 item 10, PARKED by
  Seth); a `.gitattributes` `*.sql text eol=lf` rule so migration checksums
  stop depending on the machine that applied them.
- **Next-wave candidates:** the duplicate Resume bars on Home + Seth's
  discard-from-entry-points ask (Sept 29, below); the round-3 critic
  leftovers and the deferred P3s in the smoke section.
- **Privacy page + ToS** (`ai-layer.md` section 6, Seth's Sept 26 "first
  unit of the next wave") is BK0 in the BK wave - DRAFT until Seth supplies
  its OPEN FACTS (operator name, contact email, jurisdiction, effective date,
  deletion promise).
- **Connector hardening - offered to Seth Sept 28, NOT decided:** make the
  site root forward `?external_auth_id=` to `/connector/login`, so a wrong
  sign-in URI can no longer strand the handshake (it has bitten twice: Aug 8
  and Sept 26-28). Small client routing change; ships through a normal wave
  and merge.
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- Coach discoverability (Seth, deferred) and CR2 polish - see "Still
  governing" below.

**Seth's merge calls, Sept 26 (settled):** privacy page + ToS
(`ai-layer.md` section 6) = the FIRST unit of the next wave; What's New
`2026-08-ai-assistant` shipped as is, connector only (it fired for every prod
user on the merge deploy); CR2 polish skipped (shipped at 7.5); `zod` declared
(`bdad1c1`, road #14 closed).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** October 7, 2026 (Opus seat, "read handoff and continue").
Session log, Oct 7:
- The Oct 6 rewrite had shipped with four unfilled placeholders
  (`SR3_STATUS_LINE`, `SR3_6_LINE`, `SR3_6_SMOKE`, `SR3_6_GATE`) - that
  session ended before sr3-6 landed. Filled here.
- sr3-6 had delivered Oct 6 22:29 in `cursor-lane-2` (DELIVERY.md by
  timestamp; no Cursor process left running). Landed `468bab9` with a seat
  fix to the drop-target math - proof and numbers in QUEUE's sr3-6 line.
  The seat harness (`client/_h/` in lane 2) and its dev server were removed.
- 7/7 - then Seth asked for the one-round critic: separate Opus agent,
  local app (API `COACH_PROVIDER=mock` on staging :3000, client :5173),
  brief `.playwright-mcp/sr3-critic/BRIEF.md`, 52 screenshots, ~15 min.
  6/10 FAIL, one P1; report kept as `sr3-critic-round-1-FINDINGS.md`;
  demo.critic restored (run 3 "Phase 1", W1 · Day 3 next - critic-verified).
  Seat verified the P1-1, P2-2 and P2-3 code claims; DISPROVED P2-7's
  diagnosis (synonym gap, not tokenizing - held for Seth's next change).
- Also found: smoke item A's expectation was wrong - test123's left-off is
  run 7 (W1 · Lower A, the old code's restart), not run 5 (W4); corrected.
- Seth's rulings -> fix round sr3f1-3 authored (QUEUE). N = 10.
- Fix round run: sr3f1 || sr3f2 then sr3f3, all on the auto rung, all
  landed with a real-app check (QUEUE has each). Seat runner bug on the
  first launch (PowerShell output callbacks on pool threads crash the
  runner) - orphans killed by PID in ~1 min, lanes untouched; the fixed
  runner (`Start-Process` with file redirection + `WaitForExit` + taskkill
  /T) is in the session scratchpad as `run-lane.ps1`. sr3f2's CLI hung
  13 min AFTER its DELIVERY.md (known print-mode hang) - for sr3f3 the
  watch exited on DELIVERY.md instead of waiting on silence.
- Smoke round 4 signed off by Seth ("everything else looks good") ->
  pre-main gate, Opus seat: direct reads of schema/security/cross-user
  surfaces + two Cursor report lanes (gate-r1 ~20 min, gate-r2 ~9 min, auto
  rung, both clean exits, porcelain = report only). Seat fix `1ce8fdb`.
  Staging checksums for the prod INSERTs read-only from `_prisma_migrations`.
  Verdict PASS (section above).
- Seth: the dispatch tab (cursor-watch :4646) "isn't showing" - the watcher
  was healthy (up since his 1:38 AM login, lanes correct); the boot tab had
  been closed. Opened it once. If it vanishes again, bookmark the URL.

Session log, Oct 6 late (Opus, frontier seat authoring AND running the
relay - Seth said "keep going"), sr3 wave:
- Item 1 diagnosed by the seat from code in minutes (no Cursor lane): not
  data loss - `createBlockRun` ends the open run and always creates a new
  one, so the old block's PLACE was lost, never its sessions. Seth's two
  question batches: pause + resume, Settings + header chip, 7-day cap
  everywhere, swap PARKED; then mock approved + long-press reorder added
  (sr3-6), Per-side switch WITH a DB field (sr3-5).
- Builder-header mock: https://claude.ai/artifact/TD1ddiGCaHqrWLScS8w5qY.
- Report lanes: sr3-d1 (diagnosis, 2.4 min; FINDINGS kept, seat applied the
  one-rule CSS fix), sr3-r1 recon (1.9 min, kept only in the scratchpad).
  sr3-r2 recon HUNG twice (print mode, zero model events); split into r2a
  (A/B/E, 2.3 min, fine) and r2b (C/D, hung again) - the seat did C/D itself
  with targeted reads (a bounded exception to "Cursor does the search",
  after three hangs).
- **Cursor auto-rung hangs were the session's main cost:** 5 runs stalled
  before the model's first event (sr3-r2 x2, r2b, sr3-3 x2). Switching to
  `--output-format stream-json` (scratchpad `run-lane-stream.ps1`) made a
  stall visible within minutes instead of at the 40-min kill; a 7-10 min
  silent stretch MID-run (sr3-3 run 3, sr3-4) can still finish - wait it out.
- **Seat errors, on record:** (1) killing the stalled sr3-3 agent by process
  match also killed sr3-5's agent during its final `git status` (after its
  DELIVERY.md) - kill by PID of the lane's own parent, never by pattern;
  (2) a bash one-liner with `npx prisma generate` in backticks inside a
  double-quoted string EXECUTED it from the repo root; npx stopped at its
  "will be installed: prisma@8.0.0-rc.20" prompt and was killed - verified
  nothing installed (no root package.json/node_modules, npx cache clean,
  server prisma still 6.19.2). Use the Edit tool for prose edits.
- Staging migration under "migrate staging" (status -> deploy -> status,
  each approved) - record in QUEUE's sr3-5 line.
- Seat fixes beyond Cursor: `a6f007f` picker height, left-off query shape
  (sr3-1), `ExerciseRx` suffix (sr3-5), `230d4c0` span-in-p (sr3-3, caught
  by a REAL-app Playwright run during sr3-4's audit).
- Real-app checks used the lane-3 Playwright install
  (`C:\dev\worktrees\cursor-lane-3\.playwright-mcp\sr3-3\node_modules`) with
  the local API on the staging DB + a lane client on :5173 - the Playwright
  MCP never connected this session. Local API after a schema change needs
  `npx prisma generate` from `server/` first.
- HANDOFF is still ~600 lines (cap ~300): the standing-reference sections
  (Durable gotchas, Workflow backlog, Still governing) need a home of their
  own - a decision for Seth, not done unilaterally.



### Still governing from the AI wave (full record in the archive)

- **Units on `main`:** AI1-AI9 (the connector, `83d82c8`..`43a4ceb`), Lane B
  (`8455059`..`932fa25` - coach, palette studio, Sept 9 redesign, critic
  rounds 1-2), AI10 `ce51242`, ID1 `ebf7b80`, CP1 `8ab7dcf`, SF1 `ab35aca`,
  gate fix `d49d253`, zod `bdad1c1`; then the patch wave CP2 `b9dd0ae`, CQ1
  `b07fea2`, WD1 `712b696`. Per-unit audits: `docs/tasks/QUEUE.md`.
- **CR2 is still the live UI work order** -
  `docs/tasks/cr2-critic-round-2-FINDINGS.md` (7.5/10). Author any UI polish
  block FROM it, never from memory; CR0/CR1 are superseded.
- **The in-app coach is not discoverable** (Seth, deferred): the panel sits
  under the Analytics stat tiles and on finished workouts; no obvious way to
  chat.
- **Gate follow-ups, not blockers:** show the requesting client's name on the
  connect confirm step if WorkOS exposes it; ID1's `revokeConsent` makes a
  LIVE WorkOS call wherever `WORKOS_API_KEY` is set - including the
  integration lane if `server/.env` carries it.
- **`external_auth_id` TTL is 300 seconds** - a slow password screen can
  expire a handshake; the confirm step says so on the page.
- **MCP revision `2026-07-28` is deliberately NOT targeted** (incompatible
  transport change); `ai-layer.md` section 4.0 "CORRECTIONS" is authoritative.
- **Cross-user isolation surfaces** (AI2's Bearer guard, AI4's token
  verification, ID1's signout) are standing frontier-seat escalations.
- **DO NOT READ A GREEN UNIT LANE AS COVERAGE OF AN ENDPOINT** - it matches
  only `test/analytics/**` and `test/lib/**`; prove a route live.

## Prior waves - CLOSED, detail archived

- **Patch wave** (CP2 faster coach, CQ1 7-per-week coach cap, WD1 discard X) -
  merged `bdad1c1..7d3b91e` Sept 27 (smoke waived by Seth, gate PASS). Gate
  verdict, prod SQL and P-A/P-B research archived Sept 28.
- **AI wave** (the connector, in-app coach, palette studio, Sept 9 redesign) -
  merged `59e27dc..bdad1c1` Sept 26. Gate verdict, road to main, smoke
  checklists and unit tables archived Sept 27.
- **F-wave** (effort MANDATORY) - merged `8541bca..59e27dc`. Gate finding,
  seed-invariant and authoring lesson are in the archive; read before touching
  effort seeding.
- **E-wave** - merged `7d1c9ba..d272930`. Live note: the "two sets of 10"
  sentence ships in FOUR hand-varied forms (E2's nudge, E3's
  `HOW_EFFORT_MATTERS`, E4's `EFFORT_RATIONALE_SHORT`, F2's
  `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`); consolidating them into one shared
  module is a known follow-up that should absorb F2's page-to-page import.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed.

### PROD smoke - Seth, on production, one combined pass (still open)

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed Aug 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on -> the RIR field appears untouched.
- Log a set with effort -> the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** - the highest-value case in the vocabulary.
- Open an OLD completed session -> nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Repo / deploy state

- **`main` is at `7d3b91e`** - the patch-wave merge, Sept 27 (ff from
  `bdad1c1`; the AI-wave merge before it was `59e27dc..bdad1c1`). **Prod Render `workout-db-l3gc`** and **prod Vercel
  `https://workout-db-psi.vercel.app`** are on `main`, deploy live. Any push to
  `main` is a prod-bound push (gate 2).
- **`ai-connector-wave` = `main` + the whole BK wave** (28 units + critic
  and seat fixes + docs, head `9af8464`+). Staging Render `workout-db-staging` tracks
  it (re-confirmed Sept 29 after it was found on `main`).
- **Prod DB:** `20260804180000_add_ai_consent` hand-applied by Seth Sept 26
  (RUNBOOK 10a V2 SQL), checksum identical to staging; `CoachUsage` +
  `WorkoutSession.reopenedAt` hand-applied by Seth Sept 27 (checks passed). Prod's build command is
  `npm install && npx prisma generate` - it never migrates.
- **Prod env on `workout-db-l3gc` (Seth, Sept 26):** `MCP_RESOURCE_URL`
  `https://workout-db-l3gc.onrender.com/mcp`, `MCP_AUTHORIZATION_SERVER`
  `https://palatable-frog-16.authkit.app`, `WORKOS_API_KEY` (the Production
  key `logchamp_prod`), `COACH_PROVIDER=cursor`, `COACH_API_KEY` (a Cursor key,
  Privacy Mode ON). `COACH_MODEL` and `NODE_VERSION` unset (`engines` pins
  Node 22.x).
- **WorkOS:** project "Cool's Project". **Production** unlocked Sept 26
  (billing on file; AuthKit free to 1M MAU), AuthKit domain
  `palatable-frog-16.authkit.app`, DCR + CIMD on, External Sign-in URI
  `https://workout-db-psi.vercel.app/connector/login` (fixed Sept 28; probe
  green). **Staging** AuthKit
  `scientific-mist-64-staging.authkit.app`, External Sign-in URI on the
  `ai-connector-wave` PREVIEW host, session lifetime shortened Sept 26.
- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. A GET of
  `/ai/consent` returns **401** on a host serving the AI wave, **404** on one
  that predates it.
- **A staging Render DEPLOY is also a staging MIGRATION** (`render-build` runs
  `prisma migrate deploy`). Prod's build does not.
- **`effort-mandatory-wave` and `effort-wave` are MERGED and closed** - all their
  CODE is on `main`, but each sits one or two DOCS-ONLY commits ahead (post-merge
  HANDOFF upkeep). **Therefore NOT safe deletion candidates.** Prior waves
  resolved this by landing the post-merge HANDOFF commit on `main` (`f2be093`,
  `869c5f1`) - a docs-only prod-bound push needing Seth's say-so.
  `ai-connector-wave` is in the same state now.
- FP8 (PWA icons) is the only open FP unit - DRAFT, blocked on Seth dropping icon
  PNGs into `claudefiledrop/`. Icons LAST by his rider. `4255782` put ~1.7 MB of
  PNGs under `claudefiledrop/` onto the branch - they rode into `main`.
- **Main-tree `node_modules` is CURRENT** (Sept 26: the `zod` install also
  pulled in `express-rate-limit` and `@cursor/sdk`; unit lane 324/324 there).

### Lane worktree state

**Lanes after the sr3 wave (Oct 7, late):** `cursor-lane` on `cursor/sr3f3`
(= `ccf468b`, clean), `cursor-lane-2` on `cursor/sr3f2` (= `b64de00`,
clean), `cursor-lane-3` on `cursor/sr3-3b` (its
`.playwright-mcp/sr3-3/` holds a working Playwright install - handy while
the Playwright MCP is down), each merged into `ai-connector-wave` once
landed; a stale `cursor/sr3-3` branch (the two hung attempts) can be
deleted with Seth's OK. Lane 2's
`server` has its own full install WITH `@cursor/sdk` (use it for any
unit that needs a LIVE coach call); lane 3's `node_modules` are
junctions into lane 1. Lane 3 still holds three untracked mock PNG
copies in `client/src/assets/scenes/` - never stage them. **Repoint a
lane onto the current wave HEAD before each dispatch.** A dead Cursor
run (connection loss, no DELIVERY.md) can be RESUMED in place: keep the
partial tree and re-dispatch with a resume note (bksf2a, Oct 1).

**Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status`** - it is
gitignored, so a stale report reads as "clean". Prefer a DISTINCT report
filename per lane run (`RECON-R1.md` / `RECON-R2.md`) so a stale file cannot
impersonate a fresh one at all.

**Lane `node_modules` drift is real.** When a lane's failures are
`Cannot find module`, suspect the environment before the code, and verify in a
lane known to be current.

## Other open items

**Seth items:** the "Open on prod" checks and M2 (top of this file); the
connector-hardening yes/no; the R6 tagline pick
(one-line `AuthLayout.jsx` swap); FP8 icon PNGs; the Cursor model-routing
question; the `docs/parked/*` ruling.

### Workflow modernisation backlog - OPEN, agreed August 5, none started

Do them one at a time between waves, never mid-wave:

1. **Rules -> tooling.** Fold `land-unit` section 2's three "things a green build
   cannot catch" into a runnable `scripts/audit-seams.mjs` (unresolved
   `var(--...)` names; identifiers removed but still referenced; server response
   shape vs client destructure). `check-hex.mjs` is the precedent.
2. **Structured `DELIVERY.md`.** Fixed schema per acceptance criterion
   (criterion -> command -> verbatim output) instead of free prose. Template in
   `docs/tasks/cursor-task-block-template.md`.
3. **Preferences -> auto-memory.** `land-unit` carries Seth's standing asks with
   dates; those are user preference, not ritual. The repo contract stays in
   AGENTS.md because Cursor reads it.
4. **Trim provenance out of hot paths.** CLAUDE.md's seat history and the dated
   backport notes are archive material in files loaded every session. *A
   `/doctor` pass scoped this to EXACT line-level cuts (~750 est. tokens/session
   saved); that scoping is in the archive - read it first, it also records what
   must NOT be cut.*

5. **TODO: a workflow that works from ANY device, seamlessly.** Added
   September 17, 2026. Today the relay only runs from Seth's laptop. A Sept 17
   audit confirmed the repo itself is cloud-complete (439 files: all entry
   points, both lockfiles, all four `.claude/skills/`, `.claude/settings.json`,
   every spec/block/QUEUE/HANDOFF, and both `.env.example` files), so a cloud
   session can already clone, `npm ci`, run `test:unit` and build. **Four
   things are what actually pin the workflow to one machine:**
   (a) **agent auto-memory does not travel** - it lives under
   `C:\Users\Sethy\.claude\projects\...` and nothing memory-shaped is tracked,
   so a cloud agent starts without the standing preferences and rulings;
   (b) **no secrets** - `server/.env` / `client/.env` are correctly untracked,
   so no server boot, no integration lane, no DB inspection;
   (c) **the dispatch relay is path-bound** - `dispatch-unit` Channel B drives
   headless Cursor in `C:\dev\worktrees\cursor-lane`, which exists only here;
   (d) **`.claude/settings.local.json` is per-machine**, so every new device
   re-prompts for permissions this one already allows.
   Shape worth considering: export the durable half of memory into `docs/` as
   a committed file (the machine-specific half stays local), a documented
   secret-provisioning step for a fresh environment, and a dispatch channel
   that is not tied to a hardcoded Windows path. Do it BETWEEN waves like the
   other four.

Also agreed in principle, not decided: relaxing gate item 5 so `devDependencies`
installs are hands-off while new RUNTIME deps still ask. Seth's call.

**The block builder - UNPARKED Sept 28 (Seth).** The July "parked" ruling is
superseded by the BK wave; `docs/specs/block-execution-gap.md` is now marked
SUPERSEDED by `docs/specs/blocks-v2.md`. The live-read concern it recorded
(templates judged against LIVE `TemplateSet` rows) is closed for BLOCK
sessions by the plan snapshot and stays open for template sessions (deferred,
`blocks-v2.md` section 13).

**Spec'd, unauthored:** R9/per-side in `docs/specs/strength-score-per-side.md`
(SS1-SS3); gym context in `docs/specs/gym-context.md` (G1 is migration-carrying =
Seth's manual track). Evidence base for FP units stays
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`).

**The AI layer - settled, not to be re-litigated.** `docs/specs/ai-layer.md` is
the design of record (Lane A the connector, Lane B the in-app coach - BYO-key
and hosted over ONE code path, now SHIPPED). `docs/specs/ai-theming.md` -
AI-generated palettes emit a ~20-hex token object, **never CSS** - shipped as of
`d28989b`. `analytics-engine.md` section 8 is AMENDED, not contradicted. Two
premises permanently closed: `.mil`/DoD credentials are out (5 CFR 2635.704) and
consumer-subscription OAuth in third-party apps is a ToS violation, not merely
unavailable. **Correction on record** (`ai-theming.md` section 4):
`check-hex.mjs` CANNOT gate AI-generated palettes - it scans a git diff
(`check-hex.mjs:23`), so runtime output never reaches it; the server-side
validator is the gate, and it rejects rather than repairs.

**Loose ends:** CW3 visual sign-off on the next live watcher run. Finding **F**
stays open ("Failed to fetch" = Render cold-start ranked cause; needs a live
Network-tab repro). A-wave optional Step-7 backfill:
`node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply` against
prod - idempotent, safe to defer. T3C sprite loader unblocks when Seth drops the
Gemini frames in `claudefiledrop/`. T4 motion (last unstarted U5 unit) needs a
frontier-seat design pass.

**Analytics/catalog track.** Track B v1 (B1-B9) MERGED (`e9ce82c`), Track A
MERGED (`13a1e59`), prod migrated + seeded. Residual: (1) validator surfaced 29
secondary-less compounds in the 675-exercise lifting subset - curation-skim
candidate (A3); (2) integration test step-6 output (malformed-key seed behavior)
still UNVIEWED.

**Issues to open:** connect-pg-simple `session` table drift (proposed `@@ignore`);
integration-suite isolation on shared staging (Neon copy-on-write branches would
kill the FK-pollution flake); user-defined exercise support; favicon/PWA icon
swap; migration automation vs manual discipline; schema sentinel
(`docs/specs/schema-sentinel.md`); **repo lives inside OneDrive** (already caused
a `git stash` hang - decision for Seth: move to `C:\dev\workout-db` or exclude
from sync; everything is pushed, so the move is low-risk).

**Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
`SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
deprecation. Also parked: `round-7-unify-set-row` (`f6c2a6f`), decision pending.

## Durable gotchas

- **The WorkOS External Sign-in URI must be the FULL `/connector/login` path.**
  Anything else (the API host on Aug 8, the bare site root on Sept 26) strands
  the handshake silently - AuthKit redirects, nothing reads `external_auth_id`,
  and the client only says it cannot connect (Sept 28, Claude's wording: the
  connector "may not be using OAuth" - misleading; leave Claude's OAuth client
  ID/secret fields BLANK). The setting is per WorkOS ENVIRONMENT, so a working
  staging proves nothing about prod. **Verify with no login:** `curl -sD -
  -o /dev/null "https://<authkit
  domain>/oauth2/authorize?response_type=code&client_id=<urlenc
  https://claude.ai/oauth/mcp-oauth-client-metadata>&redirect_uri=<urlenc
  https://claude.ai/api/mcp/auth_callback>&code_challenge=<any 43-char
  S256>&code_challenge_method=S256&state=probe&resource=<urlenc
  <api>/mcp>"` - the `Location` must end `/connector/login?external_auth_id=`.
  Prod AuthKit `palatable-frog-16`, staging `scientific-mist-64-staging`.
  Harmless: the stranded handshake expires in 300 s.
- **Agents cannot write prod WorkOS auth config** - the auto-mode classifier
  refused it twice on Sept 26, even with Seth's go-ahead. Plan every prod
  identity-provider change as a SETH step with exact values; agents read and
  verify.
- **Opening the prod API in a browser tab proves nothing about auth.** The
  prod session cookie is `partitioned` (`server/src/app.js:169-170`), so a
  top-level visit sends no cookie and every authed route answers 401 while the
  app itself works. Verify authed behaviour in-app.
- **A mock provider is not a proof of the vendor path.** Lane B shipped five
  commits, 28 unit tests and a full UI against `COACH_PROVIDER=mock`; the three
  defects AI10 fixes are all things ONLY a real call surfaces. Same class as
  AI2's swappable verifier hiding `invalid_scope` for three units: **a
  verification seam that stands in for a vendor cannot test the vendor's
  constraints.**
- **Recon about a vendor SDK's ERROR SHAPE is a guess until one live call.**
  CP1's recon said the gated `systemPrompt` error throws from `send()`; the
  installed SDK reports it from `wait()`. The fake SDK encoded the recon's
  belief, so the unit lane was green on a path that failed on first contact.
  Keep a live smoke criterion in every vendor-adapter block.
- **A background agent run needs its OWN hard kill.** Sept 25's CP1 run lost
  its connection and sat in the CLI's reconnect loop ~13 hours before dying.
  `run_in_background` is not a timeout: wrap the CLI in `Start-Process` +
  `WaitForExit(<ms>)` + `taskkill /T /F` (the Sept 26 salvage did - scratchpad
  `run.ps1` shape).
- **Work that skips `land-unit` leaves no audit trail anywhere.** The Sept 9
  commits were good work, but with no QUEUE entry and no HANDOFF record the
  next session opened blind and had to reconstruct them from the diff. If a
  session ships outside the relay, write the QUEUE entry anyway.
- **Anything an agent writes into a gitignored path is one `git clean` from
  gone.** All four critic-loop documents (rounds 0-2 plus the brief) lived only
  in `.playwright-mcp/`, and the rescue took TWO passes - Sept 12 took round 2
  and the brief, Sept 17 caught rounds 0 and 1 that the first pass walked past.
  Preserve report-shaped output as a `-FINDINGS.md` doc at landing (FP0
  precedent), and when rescuing, sweep the whole directory rather than the one
  file you came for. Round screenshots stay local-only by choice.
- **A killed run can leave COMPLETE work with ZERO evidence - check the lane
  before re-running from scratch.** August 6's AI7 run wrote every line and died
  before writing `DELIVERY.md`.
- **Back the lane up BEFORE a salvage re-dispatch** (copy the diff to the
  scratchpad), and **audit a salvage delivery HARDER, not softer** - a second
  run inheriting a diff has every incentive to bless what it finds.
- **If HANDOFF looks stale, QUEUE.md is the file that is current.** `land-unit`
  writes QUEUE per unit; HANDOFF is rewritten per session - and a session that
  ends by dying writes neither.
- **Acceptance criteria can scope a grep too narrowly.** AI7's criterion swept
  `server/src` while the deleted export was imported from `server/test`. Sweep
  the whole worktree for a removed identifier.
- **Two agents, one working tree:** check `git status --untracked-files=all`
  immediately before every commit (untracked DIRECTORIES collapse to one line),
  let writes settle, one agent commits at a time. Lane worktrees sidestep this.
- **Windows env/PATH staleness:** a session may not see User env-var/PATH changes
  even after a restart - read from the registry inline and invoke new CLIs by
  full path.
- **Cursor CLI remembers the last-used `--model`** - always pass it explicitly.
  Its agent binaries run as `node.exe` under `cursor-agent\versions\`, so a
  process-name filter on "cursor" returns 0 and looks like a dead run.
- **`DELIVERY.md` is gitignored** - check lane cleanliness by TIMESTAMP.
- **A deployed service's branch is a CLAIM until you probe it.** August 4: three
  pushes went to prod believing a stale topology note.
- **An ESM-only package in a CommonJS server is a BOOT risk, not a feature risk.**
  `zod` and `jose` are both `"type": "module"`; `require()` works only on Node >=
  22.12 - now pinned by `engines` (CP1). Watch for PHANTOM dependencies - `zod`
  was required by `mcpServer.js` for a whole wave before `bdad1c1` declared it.
- **A green lane proves nothing about a server route this wave.** At minimum
  prove the module graph loads by requiring `src/app.js` in a one-liner, and
  prefer a live request against staging over any assertion.
- **E-wave and F-wave gotchas** (discoverability vs acceptance criteria, the
  CSS-grid child reflow, prop-ABSENCE seams, duplicate state copy, the `rir = 0`
  blank-vs-truthiness trap, `startSession` creating zero `WorkoutSet` rows) are
  in `docs/HANDOFF-ARCHIVE.md`. The `rir = 0` one is still live in the code.
- Scene mock PNGs are design references - `docs/design/mocks/`, never ship from
  `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push
  lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual - smoke on device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track - pushing code does not migrate any DB,
  EXCEPT where a Render build command runs `migrate deploy` (see above).
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces it at boot (`assertSafeForBoot()`) and on the test/reset
  path (`assertSafeForReset()`, called explicitly by any new DB-connecting script
  at the top of `main()`).
- `npm run test:unit` is DB-free; `npm test` requires (and resets) the staging DB.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
