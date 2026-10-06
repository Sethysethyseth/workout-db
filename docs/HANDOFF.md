# HANDOFF — current state

> **WHERE WE ARE (Oct 6):** the **bkr fix wave is COMPLETE - 12/12 LANDED** on
> `ai-connector-wave` (pushed). It came out of Seth's BK smoke round 2 (Oct 5,
> `docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round 2"): coach guardrails
> (bkr2 - usage ledger under a per-user lock, palette costs 1, coach on-topic
> only), Finish bar on the iOS keypad (bkr-f1), the crown AI loader + client
> timeouts (bkr1), one "Have AI fix this file" button priced 1-4 by tokens
> (bkr3), builder settings chips + actions sheet (bkr4, Seth picked option 2),
> Home logging-first with the block card under it (bkr5, Seth picked A + one
> week strip), then critic round 1 (6/10 FAIL, no P0/P1) and its fix round
> bkrf1a-c. **Critic round 2 was SKIPPED by Seth (Oct 6: "the critic isnt
> working, lets skip it for now")** - his re-smoke is the check. Prod
> unchanged: `main` = `7d3b91e`.
>
> **Oct 6, later: Seth's smoke round 3 INTAKE is waiting** - 10 notes (one
> suspected P0 data loss, one bug with a screenshot, six CRs, one open
> question for the agent's opinion, one undecided CR to talk through) recorded verbatim in
> `docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round 3". The session that took
> them proposed NO solutions on purpose (Seth: "leave this to the next
> chat"). The 11-item re-smoke checklist below is still un-run.

**Next action (human):** open a fresh Claude Code session on Opus and say
"work the smoke round 3 intake" - it starts with the suspected block-progress
data loss.

## ▶ PICK UP HERE (Oct 6 - smoke round 3 intake, FRONTIER seat)

Seth handed the next chat his round-3 notes (FINDINGS "Smoke round 3", items
1-10; item 10 is undecided - discuss, don't author). Do them in this order and ask Seth the open calls batched at the start
(memory: ask-seth-the-decisions):

1. **Item 1 first - suspected P0:** starting a second block may wipe the
   running block's progress (Seth unsure whether the first block was still
   running - cover both cases). DIAGNOSIS block to Cursor (report lane) before
   anything else; if confirmed, it is the top fix of the next wave.
2. **Item 2 - bug:** "+ Add exercise" in the builder opens wrong the first
   time (keyboard up, no search/list; second tap is fine). Screenshot in
   `claudefiledrop/smoke-r3-add-exercise-first-open.png`. DIAGNOSIS block.
3. **Ask Seth in one batch, with a recommendation each:** item 5 (is block
   Settings the right home for the RPE/RIR choice? he wants your opinion),
   item 3 (hard cap at 7 days per week: disable "+ Day" at
   7?). Item 7 is answered ("single" = one-arm/one-leg exercise -> log a left
   and a right side). Items 4, 6, 7, 8, 9 are clear enough to author (item 9's copy is Seth's,
   verbatim: "this hasnt been implemented yet bro stop prying").
4. Author the next wave from the answers (`author-task-block`), Home/builder
   design units get an Artifact mock first when they change layout (memory:
   preview-big-changes-as-artifacts).
5. **Critic rule changed (Oct 6):** the separate-agent feel critic runs ONE
   iteration by default (scored 0-10); more rounds only when Seth says so.
6. The pre-main gate waits until Seth signs off a smoke of everything,
   including the 11-item checklist below.

### Agent sitting with Seth on the 11-item re-smoke (when he runs it)

You sit with Seth while he smokes, ONE item at a time, and record results. You
do NOT fix code and do NOT run the gate. Any model can do this.

1. Where: the staging Vercel preview of `ai-connector-wave`
   (`https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`,
   behind Vercel login), phone first. NEVER local dev (`client/.env` = prod).
2. Accounts: `test123` / `password` (running block "Upper/Lower Strength -
   4wk", W4 · Upper A next, nothing in progress), or Seth's own staging
   account. Coach uses are capped at 7 per rolling 7 days.
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
- Before any merge: Seth hand-applies BK1's migration
  `20260929120000_blocks_v2` to PROD (RUNBOOK "Schema-change deploy") and the
  prod-vs-staging migration drift (Housekeeping) gets reconciled. bkr added
  NO migration.

### Open on prod - Seth's checks, none blocking

1. **Connector ID1 live checks - DONE Sept 29 (Seth).** Sign-in and the
   sign-out button both work on prod.
2. **Prod AuthKit session lifetime - DONE Sept 29.** Prod matches staging:
   max session 7 days, access token 5 minutes, inactivity timeout 2 days.
3. **Patch-wave post-deploy checks - DONE Sept 29 (Seth), with two product
   findings** (below): Render shows `7d3b91e`; coach's second answer is
   visibly faster (CP2 confirmed by feel; `ttft_ms` not recorded); Render
   logs clean, no "Ripgrep path not configured".
4. **`COACH_UNCAPPED_EMAILS=sethjknisel@gmail.com` - DONE on PROD only**
   (Seth has no staging/preview coach use); the "N of 7 left" counter no
   longer shows for that account on prod. Staging stays capped by design.
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

- **The BK wave** - 28/28 landed; Seth's smoke round 2, then the gate.
  Nothing else is queued.
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


**Updated:** October 1, 2026 (Opus, frontier seat running the relay). Landed
bksf2b `10cfb3a`, bksf2c `848ff3b`, bksf2a `d1c1940` (run 1 died on a Cursor
connection loss; resumed in place) + seat fix `bd0e4b3`; ran critic round 3
(7/10 FAIL, final); direct fixes `9f6b2a0`; authored + dispatched bksf3a-b
after Seth chose fix-before-smoke; landed bksf3a `2fd8773` and bksf3b
`b5e42f2` with landing fix `9633c20` (live replay caught bksf3b PATCHing
blanks over a just-logged set); rewrote this file for the smoke agent;
built the before/after gallery Artifact at Seth's ask
(https://claude.ai/artifact/BYfQuLW677z67Ap7WaDfwH; screenshots local-only
under `.playwright-mcp/land-oct1/` and the critic round folders).
Seth asked (Oct 1) for a way to preview big UI changes without changing the
app - an Artifact mock before a wave, a before/after gallery at wave end;
recorded as agent memory, suggested at the seat's discretion. Prior:
Sept 30 sessions (BK smoke reopen, critic rounds 1-2). Older sessions archived.

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

**All three lanes are LANDED and clean (Oct 1):** `cursor-lane` on
`cursor/bksf3b`, `cursor-lane-2` on `cursor/bksf3a`, `cursor-lane-3` on
`cursor/bksf2b`, each fully merged into `ai-connector-wave`. Lane 2's
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
