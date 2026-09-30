# HANDOFF — current state

> **UPDATE (Sept 30): the smoke REOPENED the wave.** Seth's item-1 notes became
> four change requests (`docs/tasks/bk-smoke-FINDINGS.md`) that he ruled
> in-wave: N = 20.
> - bks1 AI layout import, bks2 block logger, bks3 Library are QUEUED and
>   dispatched in parallel.
> - After they land, a critic loop runs as a SEPARATE Claude agent, 8/10 or
>   3 rounds.
> - Then the smoke restarts from item 1.
> - Test account `test123` / `password`: block 126, run 5, weeks 1-2 logged.

> **WHERE WE ARE (Sept 29, late):** the **BK (blocks-v2) wave is COMPLETE -
> 17/17 LANDED** on `ai-connector-wave` (`196a10b`): BK1-BK12 + BK5b plus the
> critic fix blocks bkf1a/b/c and bkf2. The coach-persona **critic PASSED in
> round 3 at 8/10** (rounds: 6 -> 7.5 -> 8; `docs/tasks/bk-critic-round-*-FINDINGS.md`).
> BK1's migration is applied to STAGING (not prod). **Staging Render was
> tracking `main`, not `ai-connector-wave`** (found Sept 29; Seth repointed it
> and redeployed - verified live: new routes up, latest server fix live, DB
> "up to date"). The critic ran on the local recipe before that, so Seth's
> smoke is the first run on the deployed stack. HARD STOP for Seth's smoke
> (checklist below). Prod unchanged: `main` = `7d3b91e`.

**Next action (human):** open a Claude Code session, say "smoke the BK wave
with me", and work through the checklist on your phone on the staging
Vercel deploy - the agent guides you item by item and records the results.

## ▶ PICK UP HERE (Sept 29, late - for the agent running the smoke WITH Seth)

> **Your job this session: sit with Seth while he smokes the BK wave, one
> checklist item at a time, and record results. You are NOT fixing code and
> NOT running the gate.** Any model can do this; Sonnet is fine.
>
> **Where things stand:** BK wave 17/17 LANDED on `ai-connector-wave`
> (`e339865`); critic passed 8/10 in round 3; staging Render tracks
> `ai-connector-wave` again (Seth repointed it Sept 29) and is verified live
> (new routes answer, latest server fix live, staging DB "up to date").
>
> **Smoke protocol**
> 1. **Where Seth tests:** the staging Vercel preview of `ai-connector-wave`
>    - branch URL `https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`
>    (behind Vercel login; per-commit URLs also work) - on his PHONE first,
>    then desktop for item 11. Never local dev (the client `.env` points at
>    prod). It talks to staging Render `https://workout-db-staging.onrender.com`.
> 2. **Account:** Seth's own staging account, or `demo.critic@example.com`
>    (password in the memory note `local-run-and-critic-loop`). demo.critic
>    already holds the critic's data: blocks "Phase 1" (6 weeks, an ACTIVE
>    run, W1 Day 1 + Day 2 done), "Phase 1 - week 1", "Upper/Lower 4wk",
>    "R2 skeleton". Starting a different block on demo ends the Phase 1 run
>    (fine).
> 3. **Pace:** give ONE item at a time from the checklist below, in plain
>    words, wait for his result. If something looks off, ask for a
>    screenshot - he drops them in `claudefiledrop/` (untracked; read with
>    the Read tool; never commit that folder).
> 4. **Record:** create `docs/tasks/bk-smoke-FINDINGS.md` at the first result
>    - one line per item: PASS, or FAIL with Seth's words + screenshot name +
>    severity (P0 broken/data loss, P1 blocks him, P2 friction, P3 polish).
>    Commit + push it at the end (docs-only push to staging is allowed).
> 5. **Verify, don't guess:** you can check the server side yourself -
>    staging API calls with a cookie login (pattern: log in via
>    `POST /auth/login`, reuse the `workoutdb.sid` cookie), and READ-ONLY DB
>    reads with a small `node -e` Prisma script from `server/` (`server/.env`
>    points at staging; run `npx prisma generate` first; SELECT-style reads
>    only - no writes, no migrations).
> 6. **Defects:** do NOT fix during the smoke. After the last item, each
>    FAIL becomes a DIAGNOSIS block (`author-task-block`, diagnosis variant)
>    -> Cursor -> `land-unit`, and the sign-off resets. The only exception is
>    AGENTS.md's direct-fix rule (diagnosis ~95% of the work, trivial fix) -
>    still record it.
> 7. **Sign-off:** when Seth says "smoke signed off" (or waives items),
>    record it in the FINDINGS doc and here, set the Next action line to
>    the pre-main gate, and stop. The gate is `pre-main-review` in an OPUS
>    (frontier) session, using the gate notes below.
>
> **Item-specific notes**
> - **Item 1 (Phase-1 sheet):** Seth can select the `Program` sheet cells
>   (header row included) in Excel and paste straight into the Paste tab.
>   For the all-6-weeks File test he can Save As CSV/TSV, or use the local
>   export at `.playwright-mcp/bk-critic/Phase-1-Program.tsv` (gitignored;
>   made from `RecoveryProgram/workout-program/Phase-1-Program.xlsx`,
>   `Program` sheet). Expected: 216 rows -> 6 weeks, 30 days, 216 exercises,
>   602 sets, 84 timed; only warnings = the ignored `Tier` and
>   `Progression_Rule` columns; ~23 names "Not in your library".
> - **Item 8 (connector drafts):** needs Claude connected to the STAGING
>   connector (staging AuthKit `scientific-mist-64-staging.authkit.app`,
>   sign-in URI on the `ai-connector-wave` preview host). If Seth's Claude
>   only has the prod connector, mark item 8 "deferred - needs the staging
>   connector" rather than failing it.
> - **Item 9 (coach):** real coach on staging, capped at 7 questions a week
>   (`COACH_UNCAPPED_EMAILS` is set on prod only, by design). Each convert /
>   draft / ask costs one.
>
> **By design - do not log as defects:** unmatched imported names do not
> count toward Analytics (the preview says so); timed sets add nothing to
> volume or strength; copy forward skips Deload-labeled weeks unless the box
> is ticked; rest 0 reads "None"; the coach range stays date-only; saving
> is blocked while any day is empty (the message names it). Known P3s
> already on file (round 3): the stats line wraps at 390px, "Match..." sits
> on its own line under short names, picker ranking for "bench press".
>
> **Gate notes for `pre-main-review` (after sign-off):** clone isolation
> (BK1, cross-user) - a live clone of a FOREIGN public block was not
> possible on staging; BK11 connector write path (cross-user; live-checked
> in-process, Claude-side check is smoke item 8); BK12 block-focus owner
> check lives in `askCoach.js` (accepted placement); BK10 reuses the
> enriched `templateExerciseId` field for `block:<id>` keys and
> `judgePlanHit` is unused (spec 7.5 ruling, hit rate deferred); BK7
> start-from-block has no unique guard (race -> two sessions); WeekStrip
> smooth scroll ignores reduced motion; direct fixes outside Cursor units:
> `aadb365` (BK3 extraction), BK5 state fixes, `0a92af6` (export legacy
> sets), `8da0ae5` (Any AI json kind), `207c0f2` (set-grid stretch,
> day-picker scrollbar). Before any merge: Seth hand-applies BK1's
> migration `20260929120000_blocks_v2` to PROD (RUNBOOK "Schema-change
> deploy") and the prod-vs-staging migration drift (Housekeeping) gets
> reconciled. Lane `cursor-lane-3` holds three untracked mock PNG copies
> in `client/src/assets/scenes/` - never stage them.

### Wave smoke checklist - BK (Seth, staging Vercel deploy, phone + desktop)

Pre-check (done Sept 29 by the relay): staging Render repointed to
`ai-connector-wave` and redeployed; `/block-runs/active` answers 401 (not
404) and the Any AI json fix is live.

1. **Import your Phase-1 sheet** (Library -> Import a block): paste week 1,
   then File-upload all 6 weeks. Preview opens at the top, program before
   matching, "Not in your library (N)" with the Analytics note, Create sticky.
   Create -> the builder with a toast. Match one name -> it shows as matched.
2. **Any AI**: Copy the instructions -> paste into ChatGPT/Claude with a
   request -> paste the WHOLE answer back -> preview -> create.
3. **Export**: builder Settings -> Export block -> re-import that file on
   the File tab -> identical stats, "Nothing skipped".
4. **Builder**: new block, 4 days, only day 1 filled -> Save names the empty
   day -> "Remove empty days" -> Save. Reps -> Time (30 s), Range, Rest
   stepper, Cap. Label week 4 "Deload", copy week 1 forward +5 -> week 4
   skipped. Progression tab reads week to week.
5. **Run a block**: Library -> Start block -> /blocks/current (week strip,
   day tiles, NEXT, Start near the top); Home shows "Up next" (below any
   live-workout card). End block uses the in-page confirm.
6. **Log a block day**: plan line + coach notes (Setup, Lead side) visible;
   "As planned" fills reps/seconds + load, never effort; a timed set logs
   seconds; RPE over the cap shows "over cap". Finish -> the summary counts
   the timed set ("45 s").
7. **Execution**: Analytics -> Execution lists that session the same
   evening; under-cap effort = no drift, over-cap = overshoot.
8. **Connector drafts** (Claude connected to staging): switch off -> ask
   Claude to make a block -> "turned off" message; switch on -> ask again ->
   DRAFT pill -> Review -> banner -> Save to library. A draft cannot be made
   public before it is saved.
9. **Coach**: "Let the coach convert it" on a pasted paragraph -> preview;
   new block -> "Describe the block you want"; builder Settings -> "Ask the
   coach about this block". With AI consent off, none of these show.
10. **Regressions**: a quick-log workout and a saved-workout session behave
    as before; saved workouts keep "Set as current".
11. **Desktop (1280)**: builder/run header sits under the app nav when
    scrolled.

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

- **The BK wave** (above; QUEUE.md). Nothing else is queued.
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

**Updated:** September 28, 2026, fifty-third session (Opus, frontier -
**the BK wave authored**, tranche 1 dispatched and delivered - BK1 6.1 min,
BK2 7.3 min, BK4 3.5 min, all exit 0 - and deliberately NOT landed: Seth asked
for a handoff so another agent finishes). Seth invoked `author-task-block` for
"a better version of blocks". Recon fanned out to three Cursor REPORT lanes (auto rung,
parallel, all exit 0 in 2.5-5 min): `recon/blocks-b1` in `cursor-lane-2`
(block/session/styling NOW-state), `recon/blocks-b2` in `cursor-lane-3`
(connector/coach/import plumbing, test globs), `recon/blocks-b3` in
`cursor-lane` (web research: Gymvanna NOT FOUND under any spelling - Seth to
supply a link if it matters; program import landscape; MCP write patterns -
preserved as `docs/specs/blocks-v2-import-research-2026-09-28.md`). Reports
B1/B2 are session-scoped (kept outside the repo at
`C:\dev\worktrees\recon-inputs\`); their load-bearing content is in the
spec. Four product calls asked + answered (spec section 1); frontier calls
added: rep ranges, snapshot-not-FK (the block update replace-alls plan rows),
a clone isolation fix, per-surface stylesheets, `sourceUnit` for connector
drafts, no new dependencies. `ai-layer.md` 4.2 AMENDED (one create-only
write); `block-execution-gap.md` SUPERSEDED. The recovery site's CSS is
preserved at `docs/design/recovery-logbook-reference.css`. Prior: September
28, fifty-second session (Opus - the prod connector fixed). Older sessions
archived.

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
- **`ai-connector-wave` = `main` + the whole BK wave** (17 units + critic
  fixes + docs, head `e339865`+). Staging Render `workout-db-staging` tracks
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

**All three HOLD UNLANDED BK deliveries (Sept 28) - NOT free until landed:**
`cursor-lane-2` -> BK1 on `cursor/bk1` (its `server` has its own full install
WITH `@cursor/sdk` - the right lane for the migration unit), `cursor-lane` ->
BK2 on `cursor/bk2`, `cursor-lane-3` -> BK4 on `cursor/bk4`; all branched from
`b9a0fac`. Each lane still holds a
stale untracked Sept 26 `GATE-R<n>.md` - not part of any BK unit. Lane 3's
`server` and `client` `node_modules` are JUNCTIONS into lane 1, which lacks
`@cursor/sdk` - harmless for app loading (`cursorProvider.js` requires the SDK
lazily) but use lane 2 for any unit that needs a LIVE coach call. **Repoint
a lane onto the current wave HEAD before each dispatch.**

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
