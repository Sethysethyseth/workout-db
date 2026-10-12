# HANDOFF — current state

> **WHERE WE ARE (Oct 11): MOTION WAVE (MX) OPEN on
> `motion-wave` - critic loop DONE, Seth's smoke next.** Seth's direction:
> "wicked" motion and graphics, analytics first; Fable 5.1 in Cursor
> (`claude-fable-5-1-thinking-high`, Cursor Pro) is the designer and its
> suggestions win; the Claude Code seat writes broad briefs and audits.
> The old restraint anti-goal is replaced by the motion stance in AGENTS.md.
> - Design of record: `docs/design/mocks/motion/MOTION-DIRECTION.md`
>   (Seth's rulings at the top win: PR celebration RARE, milestones at
>   100/1,000/10,000 workouts, per-palette scenes) + `ROADMAP.md` (the
>   wave's state: MX1-MX16 + MX-S + SRV-1/2, "Last checkpoint" line) +
>   `IDEAS.md` (15 PARKED ideas + IDEAS 16 HELD by Seth: fling-away bars).
> - LANDED: MX0 `f651c21` (direction + previews), MX1-4 `2cdeee0`, MX5-6
>   `d309919`, MXF1 `97d028d` (critic round 1), MXF2 `20daef5` + MXC1
>   `266554f` (Seth's Oct 10 smoke fixes), MXF3 `ff2c4e0` (coach field
>   above the keyboard, test keyboard `scripts/virtual-keyboard-shim.js`),
>   MXF4 `d6ae69b` (critic R1 typing), MXF5 `3378250` (critic R2 visual),
>   MXF6 `f14762d` (critic R3 coach reliability, SERVER-touching: finish +
>   save on disconnect, user-scoped `POST /coach/stop`), MXF7 `fec6d06`
>   (critic R3 app fixes: no native dialog leaving a live workout).
>   Critic R1 3/10, R2 5/10, R3 5/10 - all fixed; findings in
>   `docs/tasks/mxf3-critic-round-{1,2,3}-FINDINGS.md`. After Seth's
>   smoke: MX7 (logger floor) per ROADMAP. Fable + Opus are capped in
>   Cursor until Oct 18 - Seth chose Cursor auto + a harder Opus-seat
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
> - Staging Render serves `motion-wave` (probed Oct 11: `POST
>   /coach/stop` -> 401, a bogus path -> 404). No migrations on this
>   branch, so the deploy does not migrate.
> - `main` = `b82ad8c` (QOL wave, live on prod). `quality-of-life-updates`
>   = main + docs; `motion-wave` was cut from it.

**Next action (human):** smoke items 12-39 below on your phone against the
staging Vercel deploy of `motion-wave` (`fec6d06`), then send findings or
"signed off".

## Smoke for the next round (carry forward - fill at each landing)

Items 1-11 (MXF2 + MXC1) were smoked Oct 10; that list and the Oct 10
mid-wave smoke findings are in the archive (ARCHIVED Oct 11).
From MXF3-MXF5 (`ff2c4e0`, `d6ae69b`, `3378250`) - items 1-11 were
smoked Oct 10 (only the coach keyboard + glyph failed; 3 = keep green,
11 = keep remembering):
12. Home top right: the coach button is a plain centred chat bubble.
13. Coach: tap the box - it sits right above the keyboard, send fully
    visible, still true for a long multi-line question; closing the
    keyboard brings the tab bar back. If a gap remains: open
    `/coach?kbdebug=1`, tap the box, screenshot the readout.
14. Quick workout: type weight then reps fast - nothing lost, keyboard
    stays up; typing in a 3rd "last time" row keeps it in place.
15. Leave and Resume a workout: no search lists pop open; tapping Weight
    never renames the exercise.
16. Exercise search with the keyboard up shows 3+ results above it.
17. Builder > + Add exercise > type: "Add ... to your library" reachable.
18. Coach working + live workout: the chip sits above the exercise name.
19. "Add a workout note" opens the keyboard in one tap.
20. Dark mode: send arrow / Stop readable, Stop centred (send and stop
    are now one 72 px pill - OK?).
21. Analytics chart cards have even margins; no repeated axis numbers.
22. Small x / arrow / -+ icons sit centred (logger, Home, Profile).
23. Iron light: amber text is readable.
24. A rate-limited coach says it is taking a breather, not "check your
    connection".
Questions for Seth: keep the crown on coach answers + the Analytics coach
card, or the bubble everywhere? `/coach/status` counts against the coach
limit (server; not changed).
Staging Render must be on `motion-wave` for the coach's help answer to say
"History, then Coach" (server/data/app-guide.md).
From MXF6 (`f14762d`) - coach:
25. Ask, then tap + while it answers: a sheet offers Keep waiting / Open
    anyway. Open anyway gives a fresh chat and you STAY there; the answer
    still shows up in History > Coach.
26. Ask, then open another chat from History > Coach while it answers:
    the same sheet; Keep waiting puts you back on the live one.
27. Ask, then Stop at once (even in the first second): nothing lands in
    History > Coach. Tap + after Stop: no sheet, the cursor is in the box.
28. Ask, then reload (or lock the phone mid-answer and come back): one
    calm "still being answered" line, then the answer opens by itself.
29. Airplane mode, open Coach: the reason plus Retry. Back online: the
    box returns on its own (or with Retry).
30. A failed question stays in the box with Try again; a very long
    question stops at 1000 characters, with a counter from 900.
31. Coach bar (ask, then switch tab): slides in and out, the same height
    working and answered, the x centred; Read on a long answer lands at
    the start of the answer.
32. History > Coach left open while an answer finishes: the new chat
    appears without leaving the page.
33. Profile > AI access says History, under Coach, and does not jump when
    its status line loads.
From MXF7 (`fec6d06`):
34. Live quick workout: type a weight and tap any tab at once - no
    pop-up; Resume - the weight is there (also on a block day).
35. History > open a workout: nothing jumps; the title is the workout's
    own name, not "Workout summary".
36. Block builder: the ... buttons are centred dots; New block does not
    pop the keyboard; the name field has inner padding.
37. Library: the "Create workout / Parked" button is gone; the running
    strip does not push the tabs down when it loads.
38. Wording: no em dashes on the live-workout or summary lines; the
    in-progress bar reads "Workout, Oct 11"; "2 sets"; "Why have lats gone
    quiet?"; Home says "you logged 2 workouts".
39. Small links are easy to hit: Profile back, See analytics, View all,
    the run page Library link, the Analytics range pills.
New question for Seth: tapping outside the "still answering" sheet counts
as Open anyway (the answer still saves) - fine, or should it mean Keep
waiting?

## PICK UP HERE (next session)

0. **Seth's smoke of items 12-39** (the critic loop is done: R3 ran Oct
   11, MXF6 + MXF7 landed). Fold his findings into a fix block (Cursor
   auto, or direct when trivial), re-smoke, then continue the wave at MX7.

1. **Continue the MX wave** (opened Oct 9, see the top block):
   - next unit = the first non-DONE unit in `ROADMAP.md` (MX7 logger
     floor); write a broad brief (MX0/MX1-4/MX5-6 briefs are the
     pattern), dispatch as a RESUME of Fable's chat, land via `land-unit`.
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
     should exclude unfinished sessions (qolf7)
   - MXF6: `/coach/stop` counts against the app-level coach limiter; a
     dropped connection no longer aborts a hung provider stream (provider
     timeouts govern); early stops are held in memory (2 min, 1000 cap)

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

- **F/E-wave PROD smoke** - still open (the QOL and BK merges were
  smoked on prod Oct 9 / Oct 7 - done):

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

- **Staging Render tracks `motion-wave`** (probed Oct 11). Repoint it to
  each new wave branch. The STAGING WorkOS
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
- **`claudefiledrop/` (untracked, keep):** holds Seth's Oct 10 smoke
  screenshots (`Screenshot_20261010-170614/-171027.png`). Three older
  tracked PNGs show as deleted - his call, unstaged.
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

## Lanes + verification (Oct 11)

- `cursor-lane` on `cursor/mxf6` @ `f14762d`, `-2` on `cursor/mxf7` @
  `fec6d06` (Oct 11), `-3` on `cursor/qol-gate-r3` @ `ac40874`; all
  porcelain clean, no DELIVERY.md (moved to session scratch).
  Before a dispatch: `git checkout -B cursor/<unit> <wave-branch>`. Lane 2's
  `server` has its own install WITH `@cursor/sdk` (live coach calls); lane
  3's `node_modules` are junctions into lane 1; lane 3 holds three
  untracked mock PNGs in `client/src/assets/scenes/` - never stage them.
  Lessons: REFERENCE.
- **Real-app check recipe** (MXF6/7): the LANE's API on the STAGING DB -
  from the lane's `server/`: `DOTENV_CONFIG_PATH=<main tree>/server/.env
  COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=http://localhost:5174,
  http://localhost:5175 node -r dotenv/config src/server.js`; lane clients
  with `VITE_API_URL=http://localhost:3001 npx vite --port 5174`
  (`client/.env` = PROD - never use it); Playwright MCP 390x844. The coach
  limiter (40 / 15 min, ALL `/coach` paths, in memory) trips in testing -
  restart the API. Stop all servers after.
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
  (in), BYO-key design (server-encrypted), coach history (kept until
  deleted; History > Coach since MXC1).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** October 11, 2026 (Opus seat). Session log (Oct 10-11; the
part before a mid-session /clear is rebuilt from QUEUE and the commits):
- MXF3 authored from Seth's second smoke, landed `ff2c4e0` (QUEUE has the
  audit). Three critic rounds by failure type (Seth): R1 typing 3/10 ->
  MXF4 `d6ae69b`; R2 visual 5/10 -> MXF5 `3378250`; R3 coach flow + app
  sweep 5/10 (2 P1 / 7 P2 / 11 P3) -> MXF6 + MXF7 authored (`cf3046b`),
  dispatched in parallel on the auto rung (lanes 1 + 2).
- Landed MXF6 `f14762d` and MXF7 `fec6d06` after harder audits and a
  real-app check of every R3 repro (detail in QUEUE). Reviewer fixes:
  MXF6 - Open anyway pulled you back to the chat you left (reload marker
  poll); a Stop that beat the ask's registration still saved (registry
  now holds early stops, +3 tests, 587); + after Stop claimed an answer
  was live. MXF7 - Analytics lost its range-pref import (runtime crash,
  build green).
- ROADMAP (MXF6/7 DONE + checkpoint), What's New (mxf6, mxf7), staging
  Render probed on `motion-wave`. Test chats and workout 524 removed.
- Critic loop complete; handed Seth smoke items 12-39 and stopped.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
