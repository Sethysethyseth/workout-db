# HANDOFF — current state

> **WHERE WE ARE (Oct 9, late night): MOTION WAVE (MX) OPEN on
> `motion-wave`.** Seth's direction: "wicked" motion and graphics,
> analytics first; Fable 5.1 in Cursor (`claude-fable-5-1-thinking-high`,
> Cursor Pro) is the designer and its suggestions win; the Claude Code seat
> writes broad briefs and audits. The old restraint anti-goal is replaced
> by the motion stance in AGENTS.md.
> - Design of record: `docs/design/mocks/motion/MOTION-DIRECTION.md`
>   (Seth's rulings at the top win: PR celebration RARE, milestones at
>   100/1,000/10,000 workouts, per-palette scenes) + `ROADMAP.md` (the
>   wave's state: MX1-MX16 + MX-S + SRV-1/2, "Last checkpoint" line) +
>   `IDEAS.md` (14 PARKED ideas for Seth to pick from).
> - LANDED: MX0 `f651c21` (direction + previews), MX1-4 `2cdeee0`
>   (motion primitives + Analytics in motion + per-palette scene
>   previews). Next code unit per ROADMAP: MX5 (shell transitions).
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

**Next action (human):** smoke the Analytics page on the staging Vercel
deploy of `motion-wave` (list in "MX smoke items" below) and pick any
IDEAS.md entries you want - nothing else is blocked on you.

## MX smoke items (carry forward - Seth smokes once at wave end)

From MX1-4 (`2cdeee0`), on a phone, two palettes, both modes:
1. Cold load `/analytics`: skeleton at once (no blank scene), title
   wipes in, KPI tiles rise in order, numbers roll up from 0 (no flash of
   the final number first), top hairline charges.
2. Range chips: the selected pill slides; KPIs roll from old to new
   values; the page does not replay its entrance.
3. View tabs: the pill slides; the new view slides in from the tab's
   side; Muscles bars charge with a glowing head, Strength sparklines draw
   then dot pops, Execution meters charge.
4. Exercises view at 390: full names wrap (no "..."), one big top-set
   number plus a delta line; tapping a row still opens the detail.
5. Crimson dark and forest dark: gains read in the success color, never
   danger red or the accent green.
6. All card titles one size; only the page title is bigger.
7. Empty state (fresh account / tiny range): ghosts breathe slowly.
8. OS reduce-motion on: everything prints at its final state, pills jump.

## PICK UP HERE (next session)

1. **Continue the MX wave** (opened Oct 9, see the top block):
   - next unit = the first non-DONE unit in `ROADMAP.md` (MX5 shell
     transitions); write a broad brief (MX0/MX1-4 briefs are the
     pattern), dispatch as a RESUME of Fable's chat, land via `land-unit`.
   - after MX1-4, one critic round on the new Analytics page is owed
     (Seth's critic loop, one round by default) - fold its fixes into the
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
- **`claudefiledrop/` (untracked, keep):** `image0.jpg` = Seth's discard
  ask screenshot; `smoke-r3-add-exercise-first-open.png` = smoke round 3.
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

**Updated:** October 9, 2026, night (Opus seat). Session log:
- Seth's smoke finding: the setup strip becomes a hotbar. Authored qolf9
  (no critic round, his call), dispatched on auto in lane 1, landed
  `2d4cb0e` after reviewer fixes (the block's own app-guide copy broke the
  12,000-char guide cap - Cursor stopped correctly; dead pill CSS; chip
  gap). 24/24. Seth smoked and signed off.
- **Pre-main gate (`pre-main-review`) over `b5c6777..HEAD`, 61 commits,
  105 code files.** Read in seat: the migration (3 new tables, cascade FKs,
  no DROP, LF per `.gitattributes`), the key vault (AES-256-GCM, random
  12-byte IV, userId as AAD, 16-byte tag enforced; status returns last4
  only), every new coach/exercise/session handler (all owner-scoped), the
  ask path caps (question 1000, history 12 x 4000, weekly cap covers help),
  and the auth-epoch fix (no stuck loader).
- Gate fuel, three Cursor report lanes (auto, lanes 1-3, ~7-12 min each,
  porcelain-clean), preserved as `qol-gate-r{1,2,3}-*-FINDINGS.md`:
  - r1: unit 578/578, build and hex clean, 23 new tokens all defined, no
    raw colours, schema vs SQL clean, no dead classes; cross-doc drift
    (spec still said N = 15 and the Home strip).
  - r2: every new/changed route SCOPED (none unscoped); vault never logs or
    returns key material; no conversation storage cap (follow-up).
  - r3: 208 criteria re-run on HEAD - 96 hold, 99 reviewer-only, 11
    process-only, 2 "broken", both by qolf9's contract (notes pill removed
    on purpose; the Logging release bullet grew to 29 words).
- **Verdict: PASS WITH FIXES**, both fixed in seat: the What's New Logging
  bullet trimmed to 24 words; the wave spec got a dated amendment (N = 24,
  strip moved and made a hotbar). r1's "does prod's build migrate"
  contradiction is not one - RUNBOOK 10a's "V2 RESULT" already says it
  does not.
- **Rule change (Seth, Oct 9):** prod migrations moved to the staging
  tier - "migrate prod", Claude Code runs them, Seth approves each command
  (AGENTS.md gate 3, RUNBOOK section 9, `b82ad8c`). Seth created
  `C:\dev\secrets\prod-db.env`; the seat generated the prod
  `COACH_KEY_SECRET` into `coach-key-secret.txt` (never shown).
- **"migrate prod"** (4 steps, each approved): staging checksum read
  (matches the file's sha256) -> prod precheck (no row, no tables, User.id
  text; found the blocks_v2/per_side history-row drift) -> apply in one
  transaction (COMMITTED 2026-10-10T00:11:41Z) -> verify (row, 3 tables,
  3 cascade FKs).
- **"push to main":** temp worktree `C:\dev\worktrees\merge-main-1009` on
  `main`, `merge --ff-only origin/quality-of-life-updates`, push
  (`b5c6777..b82ad8c`), worktree removed. Prod API live ~40 s after the
  push; Vercel bundle confirmed. State commit `768f646` kept on the wave
  branch (no docs-only prod redeploy). Seth then set `COACH_KEY_SECRET`,
  repointed staging Render to `main`, and smoked prod: good.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
