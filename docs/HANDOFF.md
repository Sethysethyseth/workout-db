# HANDOFF — current state

> **WHERE WE ARE (Oct 10): MOTION WAVE (MX) OPEN on
> `motion-wave`.** Seth's direction: "wicked" motion and graphics,
> analytics first; Fable 5.1 in Cursor (`claude-fable-5-1-thinking-high`,
> Cursor Pro) is the designer and its suggestions win; the Claude Code seat
> writes broad briefs and audits. The old restraint anti-goal is replaced
> by the motion stance in AGENTS.md.
> - Design of record: `docs/design/mocks/motion/MOTION-DIRECTION.md`
>   (Seth's rulings at the top win: PR celebration RARE, milestones at
>   100/1,000/10,000 workouts, per-palette scenes) + `ROADMAP.md` (the
>   wave's state: MX1-MX16 + MX-S + SRV-1/2, "Last checkpoint" line) +
>   `IDEAS.md` (15 PARKED ideas + IDEAS 16 HELD by Seth: fling-away bars).
> - LANDED: MX0 `f651c21` (direction + previews), MX1-4 `2cdeee0`, MX5-6 `d309919`, MXF1 `97d028d`
>   (motion primitives + Analytics in motion + per-palette scene
>   previews), MX5-6 (shell transitions + History FLIP), MXF1 (critic
>   round 1), MXF2 `20daef5` + MXC1 `266554f` (Seth's Oct 10 smoke fixes:
>   Finish dock, rest timing, crimson charts, Strength draw; the coach keeps
>   working when you leave, coach history on History). Next: MX7 (logger
>   floor) per ROADMAP. Fable + Opus are capped
>   in Cursor until Oct 18 - Seth chose Cursor auto + a harder Opus-seat
>   audit meanwhile.
> - Previews (private Artifacts): analytics X52VRgnoGLer3gGgphQnBU, PR
>   2kWaZboR6dtMGXgwJqhPSN, navigation T5WpDyvFkAX5rdex1Y5k67, session
>   flow 7dk9zTUhc2nxAbjDLS9i2S, scenes PTk4q9Gww5xhBy5cHkgQBx
>   (claude.ai/artifact/<id>).
> - Cursor usage is capped this month: every Fable run must leave
>   ROADMAP.md current. Fable runs RESUME chat
>   `eb56cfff-dfbb-4abc-99f2-6d794c36b307` (`run-lane.ps1 -Resume`) to
>   keep its context. Seth: never dispatch the next unit until the
>   current Fable run has fully delivered; never stop a run mid-flight.
> - Staging Render: Seth was repointing it to `motion-wave` (Oct 9) - no
>   migrations on this branch, so the deploy does not migrate.
> - `main` = `b82ad8c` (QOL wave, live on prod). `quality-of-life-updates`
>   = main + docs; `motion-wave` was cut from it.

**Next action (human):** re-smoke the 11 items under "Smoke for the next
round" on the staging Vercel deploy (`origin/motion-wave`), and answer the
two questions in it (crimson gains colour, History remembering Coach).

## Seth's mid-wave smoke (Oct 10, phone) - MX1-6 + MXF1

Everything he did not name PASSED; the 420ms tab slide STAYS (item 21 -
not flagged). Findings, all now in blocks:
- Finish dock hidden under the bottom nav on a live workout (screenshot:
  crimson dark, its top edge peeks above the nav) -> MXF2.
- Rest timer fires between weight and reps -> MXF2; Seth's ruling: rest
  starts when you LEAVE the set.
- Crimson chart marks are green (MXF1 built crimson `--chart-accent` from
  the success token) -> MXF2.
- Strength trends do not animate, colour reads off -> MXF2.
- "Double check appearance for glitches" -> the Opus seat runs a 10-combo
  screenshot pass of the touched surfaces at each landing.
- Coach: a tab change resets the conversation (CoachPanel aborts on
  unmount; the server aborts and saves nothing); wants a first-open note, a
  "working" bar like resume-workout, a "finished" state; coach history
  moves Library -> History (ruling: Workouts | Coach switch); the masthead
  chat glyph's "..." reads as a glitch -> MXC1.
- HELD (Seth): fling-away resume/coach bars, omni-directional, fade with
  distance, a couple of cm max, dismiss only on release out of range ->
  IDEAS 16; decide after this wave whether it joins it or the next.

## Smoke for the next round (carry forward - fill at each landing)

From MXF2 (`20daef5`), on the phone:
1. Live quick workout AND a block day: Finish sits fully above the tab
   bar and taps; the tab bar still works (block days now show it too).
2. Rest: weight -> reps -> effort in one set never starts it; moving to
   the next set (or tapping away / closing the keyboard) starts it once;
   a block "log as planned" tap starts it right away.
3. Crimson dark + light: Muscles bars and trend lines are rose/blush, not
   green. Gains (end dot, "up" text) are still green - keep or change?
4. Strength draws (line wipes, dot pops, text rises) on first open, on
   switching to Strength, and on a range change; leaving and coming back
   to Analytics stays a quiet fade.
5. Known, not fixed here (MX7): the first set of a brand-new exercise
   drops the keyboard once when it first saves.
From MXC1 (`266554f`):
6. Coach (Home, top right): the icon is a bubble with a small crown, no
   dots. First open shows a note once - never again, even after logging
   out and in.
7. Ask, then switch tabs: a "Coach is working on it" bar, then "Coach
   answered" - tap Read and the full answer is there.
8. Ask, leave, come straight back: the answer is still writing.
9. Coach working while you log a workout: the bar is a small chip at the
   top, never over Finish, the tab bar or the field you're typing in.
10. History: Workouts | Coach switch; your chats sit in month groups;
    open, delete one, delete all; Library no longer has a Coach tab.
11. History remembers the Coach side until you close the app - keep that,
    or always open on Workouts?
Staging Render must be on `motion-wave` for the coach's help answer to say
"History, then Coach" (server/data/app-guide.md).

## PICK UP HERE (next session)

1. **Continue the MX wave** (opened Oct 9, see the top block):
   - next unit = the first non-DONE unit in `ROADMAP.md` (MX7 logger
     floor); write a broad brief (MX0/MX1-4/MX5-6 briefs are the
     pattern), dispatch as a RESUME of Fable's chat, land via `land-unit`.
   - ONE critic round on Analytics + the new shell is owed NOW (Seth agreed
     to run it after MX5-6) - fold its fixes into the
     next brief.
   - every wave ends with a What's New unit (`_WHATS_NEW.md`); release
     bullets stay at 25 words or fewer. The ledger has the MX section.
   - known lint noise from MX1-4 (lint is not in CI): Cascade.jsx `Tag`
     unused (JSX false positive) + mixed exports; useCountUp setState in
     effect - same patterns as pre-existing files.
   - legacy `.exercise-roster-stat*` rules in index.css are now unmatched
     (cleanup later); `--chart-up/down` live on `.analytics-page`
     (promote to `:root` when MX8/MX9 need them).
2. **Prod migration-history drift - reconcile under "migrate prod"
   before anyone points `prisma migrate deploy` at prod** (found Oct 9):
   - prod HAS the schema for `20260929120000_blocks_v2` and
     `20261006200000_block_exercise_per_side` (`BlockRun` exists,
     `perSide` exists) but NO `_prisma_migrations` rows for them; the
     Oct 7 note that their checksums were copied was wrong. Fix: insert the
     two rows with staging's checksums.
   - plus the older Sept 26 drift (Housekeeping).
   - the helper used for the coach migration (staging-checksum,
     prod-precheck, prod-apply, prod-verify, all through `pg` with the
     creds file) was session scratch; rebuild it the same way - the
     RUNBOOK section 3 ritual, one transaction, never print the URL.
3. **Gate follow-ups (not blockers, none authored):**
   - saved coach conversations have no per-user cap (bounded by the 40 per
     15 min coach limit and the hosted weekly cap)
   - the `/coach` 2 MB JSON parser runs before auth (same shape as
     `/block-templates/import`)
   - conversation paging cursors on `updatedAt` alone (a same-millisecond
     tie could skip a row)
   - `.bk-log-effort-slot` (`bk-log.css`) is an unused rule
   - carried: qol13 cold-server "Loading session" for logged-out visitors;
     qolf1 bar column matched by pathname; qolf1 ConfirmPanel focus ring on
     tap; qol11 `scripts/smoke-coach.mjs --key` inert; no rate limiter on
     `/block-templates/import*` or `/block-runs`; STOWED summary endpoint
     should exclude unfinished sessions (qolf7); the bottom nav sits under
     the Finish dock on a live workout (qol12, known)

## Stowed (none authored)

- **Exercise search synonyms - HELD for Seth's own planned change (Oct 7).**
  The pure `searchCatalog` already AND-matches words. "single leg calf"
  misses on a SYNONYM gap ("single" vs "one"). Fold it into Seth's change
  (likely `server/data/exercise-aliases.json` + its rationale doc).
- **Swap an exercise for today on a block day** - PARKED by Seth.
- **Privacy page + ToS (BK0)** - DRAFT until Seth supplies the operator
  name, the contact email and the US state. **BK0's copy must change
  before it queues:**
  - qol10 STORES coach chat content, so the "records only who and when"
    claim is no longer true
  - qol11 makes "encrypted at rest" true for BYO keys
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- **CR2 polish** remains the live UI work order (REFERENCE "Still
  governing").
- **Gate note (Oct 7):** no rate limiter on `/block-templates/import*` or
  `/block-runs` (authed, DB-only).

## Open on prod - Seth's checks, none blocking

- The QOL merge: smoked on prod by Seth Oct 9 ("all done and good"). Done.
- The BK / bkr / sr3 merge: smoked on prod by Seth Oct 7 ("looks
  beautiful"). Done.
- **F/E-wave PROD smoke** - still open:

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed Aug 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on -> the RIR field appears untouched.
- Log a set with effort -> the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** - the highest-value case in the vocabulary.
- Open an OLD completed session -> nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Housekeeping

- **Staging Render tracks `main`** (Seth repointed it Oct 9, after the
  QOL merge). Repoint it to each new wave branch. The STAGING WorkOS
  External Sign-in URI is pinned to the `ai-connector-wave` Vercel PREVIEW
  host - never delete `ai-connector-wave` (or its preview) while that URI
  points at it. If staging ever looks stale, check Render -> Settings ->
  Branch FIRST (Sept 29 lesson).
- **`quality-of-life-updates` = `main` + docs-only state commits** until
  they reach `main` with the next merge.
- **Git cleanup done Oct 7 (Seth's OK):** 112 merged local `cursor/*` and
  `gate/*` branches deleted (`git branch -d`, none refused); the merge
  worktree `merge-main-0927` removed. Old wave branches, `recon/*`,
  `parked/*`, `stash-preserve/*` and all REMOTE branches untouched.
- **Stale `.git/worktrees/merge-main`, `merge-main-0927`, `merge-main-1007` admin dirs**
  (OneDrive lock): git prints `failed to delete ... Permission denied` on
  fetch/commit. Harmless; `git worktree prune` once the lock clears.
- **`claudefiledrop/` (untracked, keep):** Seth cleared it Oct 10; it holds
  his two Oct 10 smoke screenshots (masthead chat glyph; Finish dock under
  the nav). Three older tracked PNGs show as deleted - his call, unstaged.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from any recent wave and not blocking (prod's build never runs `migrate
  deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

## Repo / deploy state (Oct 9, night - verify from the services)

- **`main` = `b82ad8c`.** Prod Render `workout-db-l3gc` and prod Vercel
  `https://workout-db-psi.vercel.app` serve it - probed Oct 9:
  `/coach/conversations`, `/coach/status`,
  `/sessions/:id/last-performance` and `/block-runs/active` all 401;
  bundle `index-d4dwyLkk.js` holds the QOL release and the setup bar. Any
  push to `main` is prod-bound (gate 2).
- **Prod DB migrations:** `add_ai_consent` (Sept 26), `CoachUsage` +
  `WorkoutSession.reopenedAt` (Sept 27), `blocks_v2` +
  `block_exercise_per_side` (Oct 7, by Seth - schema present, history rows
  MISSING, see PICK UP HERE item 2), `coach_key_and_history` (Oct 9, by
  Claude Code under "migrate prod": SQL + `_prisma_migrations` row with
  staging's checksum `e7370e9e...dc64e` in one transaction, verified).
  Prod's build never migrates.
- **Prod migrations are trigger-phrase tier since Oct 9** (AGENTS.md gate
  3): "migrate prod", one command at a time, Seth approves each. The
  write-capable URL is in `C:\dev\secrets\prod-db.env` (bare URL, owner
  role, pooled host - strip `-pooler` for the direct host); the prod
  `COACH_KEY_SECRET` value is `C:\dev\secrets\coach-key-secret.txt`.
  Read both only at run time; never print them.
- **Staging DB** has the same plus everything via Render's `migrate deploy`
  (a staging Render DEPLOY is also a staging MIGRATION).
- Stable topology (prod env, WorkOS, verify-from-services, branch-deletion
  cautions): REFERENCE -> "Deploy topology".

## Lanes + verification (Oct 9)

- `cursor-lane`, `-2`, `-3` (Oct 9): on `cursor/qol-gate-r1|r2|r3` at
  `ac40874`, porcelain clean, no DELIVERY.md (moved to session scratch).
  Before a dispatch: `git checkout -B cursor/<unit> <wave-branch>`. Lane 2's
  `server` has its own install WITH `@cursor/sdk` (live coach calls); lane
  3's `node_modules` are junctions into lane 1; lane 3 holds three
  untracked mock PNGs in `client/src/assets/scenes/` - never stage them.
  Lessons: REFERENCE.
- **Real-app check recipe** (used for every sr3 landing): local API on the
  STAGING DB from the main tree's `server/` (`COACH_PROVIDER=mock PORT=3000
  node src/server.js`; run `npx prisma generate` there first after a schema
  change), the lane's client with `VITE_API_URL=http://localhost:3000 npx
  vite --port 5173` (`client/.env` = PROD - never use it), Playwright MCP at
  390x844. Stop both servers after.
- **Staging accounts:** `test123` / `password` (Seth's smoke account -
  READ-ONLY for agents; running "Imported block" run 8 with W1 D1 in
  progress, "Upper/Lower Strength - 4wk" paused at W1 · Lower A) and
  `demo.critic@example.com` / `CriticDemo!2026` (writable; running "Phase 1"
  run 3, W1 · Day 3 next, no custom exercises - leave it that way).

## Seth items (decisions, not work)

- Still open:
  - **BOOKMARKED for discussion (Oct 9):** which button the "N sets have no
    RIR" finish sheet focuses by default. It stays "Finish anyway" for now;
    critic r2 #10 suggested "Add RIR".
  - the R6 tagline pick (a one-line `AuthLayout.jsx` swap)
  - FP8 icon PNGs (drop them into `claudefiledrop/`)
  - the Cursor model-routing question
  - the `docs/parked/*` ruling
  - BK0's open facts (operator name, contact email, US state)
- Settled Oct 8, recorded in the wave spec section 1: connector hardening
  (in), BYO-key design (server-encrypted), coach history (Library tab,
  kept until deleted).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** October 10, 2026 (Opus seat). Session log:
- Seth smoked `motion-wave` (`97d028d`) on his phone: results above. Read
  his two screenshots (`claudefiledrop/Screenshot_20261009-202409.png` =
  the masthead chat glyph; `Screenshot_20261010-122250.png` = the Finish
  dock under the nav). He removed the older claudefiledrop files himself
  (the three tracked PNG deletions are his, left unstaged).
- Asked his three calls (rest trigger, History layout, where the "..."
  is); rulings recorded in the blocks.
- In-seat grounding (targeted greps, no recon lanes - two-block fix
  round): crimson `--chart-accent` from `--color-success-accent`
  (index.css ~6826); `.mx-route` carries `view-transition-name` at all
  times (stacking context) vs `.bottom-nav` z-index 5 and the dock's 40;
  quick-logger rest fires on core-logged (SessionDetailPage ~3035), block
  logger on `onRestLoggedChange`; CoachPanel `abortRef` unmount abort +
  server `res.on("close")` abort; app guide 11,923 / 12,000 chars.
- Authored MXF2 (`mxf2-smoke-round-1-fixes.md`) and MXC1
  (`mxc1-coach-keeps-working.md`), both MODEL auto (Fable + Opus capped
  until Oct 18), FILES TO TOUCH disjoint so they may run in parallel
  (lanes 1 + 2). ROADMAP gained MXF2 + MXC1 entries; IDEAS 16 = the held
  swipe idea.
- Dispatched both on auto, parallel (lane 1 resumed chat eb56cfff, lane
  2 fresh). Seth (mid-run): the first-open coach note must be once for
  real, not every login - amended MXC1 (`9eb652e`), audit enforces it.
- MXF2 landed `20daef5` after a harder audit + real-app check (QUEUE has
  the detail). Reviewer fixes: rest never started for a set saved after
  focus left it (draft rows save on blur) - both loggers fixed; block
  log-as-planned tap counts as leaving. Found pre-existing: first set of a
  new exercise drops focus on its first save (MX7).
- MXC1 landed `266554f` after a harder audit + real-app check on top of
  MXF2 (mock coach; QUEUE has the detail). Reviewer fixes: once-means-once
  (mark on show); bar placement stale after a route change (re-fits on
  page-tree changes); ?c= / ?view= written onto the NEXT page's URL in the
  route-transition window (guarded); finished copy fits at 390; masthead
  crown filled. Test data removed. Known pre-existing: the route layer's
  flushSync-in-lifecycle console warning.
- Mid-wave fix round complete (2/2 landed). The wave stays open: MX7 next.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
