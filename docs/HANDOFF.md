# HANDOFF — current state

> **WHERE WE ARE (Oct 9, late night):** the **quality-of-life wave is
> COMPLETE, 24/24 LANDED** on `quality-of-life-updates`, **smoke SIGNED OFF
> by Seth**, and the **pre-main gate PASSED WITH FIXES** (both fixes done in
> seat). Ready for the merge ritual. The wave:
> - qol1-qol15
> - critic round-1 fixes qolf1-qolf4
> - Seth's repeat-last effort hint qolf5
> - critic round-2 fixes qolf6-qolf7
> - Seth's strip move qolf8
> - Seth's smoke finding qolf9 (the strip becomes a hotbar)
> - plus the direct auth fix `33cd671` (not a numbered unit)
>
> `main` = `b5c6777` (unchanged). Next-wave look-and-feel input:
> `docs/tasks/qol-critic-round-2-FINDINGS.md` Part B.

**Next action (human):** do the two prod prep steps in PICK UP HERE item 1
(hand-apply the qol1 migration on prod Neon, set `COACH_KEY_SECRET` on prod
Render), then say "push to main" to start the merge.

## PICK UP HERE (next session)

1. **Before the merge (prod, Seth - in this order):**
   - apply migration `20261008120000_coach_key_and_history` to PROD by
     hand (RUNBOOK section 3 + the `_prisma_migrations` row template;
     checksum copied from staging). Prod's build never migrates (RUNBOOK
     10a "V2 RESULT"). Without it the coach breaks on prod (status, ask,
     history all read the new tables); login does not.
   - set `COACH_KEY_SECRET` on prod Render (32 random bytes, base64 -
     generator in `server/.env.example`). Unset is not an outage: saving a
     key returns 503 "byo_unavailable" and the hosted coach still works.
   - the What's New `2026-10-quality-of-life` date is 2026-10-09; bump it
     in `client/src/data/whatsNew.js` if the merge lands later.
2. **Merge:** Seth's verbatim "push to main", RUNBOOK section 2, one
   command at a time; report merged SHAs and `origin/main` HEAD after.
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

## Wave smoke checklist (staging Vercel, on the phone) - SIGNED OFF by Seth, Oct 9

- **Logging setup bar (qolf8 moved it, qolf9 made it a hotbar):**
  - Home has no bar any more.
  - Every live workout has a one-line bar under its title: RIR | RPE,
    Exercise notes, Repeat last, Edit. What is on glows.
  - Quick workout: tap RPE -> RPE glows and the sets ask for RPE. Tap
    Exercise notes or Repeat last -> they turn off and on, and a typed
    but unlogged weight stays.
  - Log a set with RIR, then tap RPE: the sheet opens with a note that
    this workout stays RIR. A block day glows the plan's scale, and
    tapping the other one shows the plan note.
  - Edit opens the full sheet (kg updates live); Profile > Training is
    the same form.
- **The logger:**
  - No unit or RIR toggles inside a workout.
  - Only the exercise name stays pinned. Its trash icon removes the
    exercise after a confirm that counts the logged sets.
  - Builder view / Table view are in sentence case.
- **Repeat last time (on):**
  - Empty sets show grey numbers, including last time's RIR/RPE, and
    "Last time: <date>".
  - The effort hint stays after you log the set, until you type today's.
  - The Sets count matches the rows; picking fewer hides extra grey rows.
  - The set number is outlined with a check, and tapping it logs those
    numbers with no effort.
- **Rest timer:**
  - It starts after a logged set and sits above Finish: -15s, +15s, Skip.
  - It keeps counting when you leave and come back.
  - The Finish dock hides while the phone keypad is up.
- **Finish without effort:**
  - Finish with some RIR missing shows "N sets have no RIR". Add RIR lands
    on the first missing field, highlighted. Finish anyway also works.
  - RIR 0 counts as filled.
- **Discard:**
  - The x on the Home card, or on the In progress bar, asks "Discard this
    workout?".
  - Then a "Workout discarded" notice with a dismiss x.
  - The bar says "Resume" on the phone and lines up with the page on a
    laptop.
- **Coach:**
  - During a workout, the In progress bar no longer covers the text box.
  - The Home chat bubble opens /coach: suggestion rows, and answers come
    into view on their own. Stop is readable.
  - Help questions work with AI access off.
  - Library > Coach lists conversations. Reopening one fills the screen;
    the trash icon and Delete all both confirm first.
- **Own key:** Profile > AI access stacks the form. Save shows "Key ending
  in ...", and Remove confirms.
- **Builder:**
  - Hold an exercise: the list collapses, the card lifts with a glow, and
    a drop reorders it.
  - The selected week, day and Edit tab share one accent look.
  - Recent shows in an empty search. Per side shows only on one-sided lifts.
- **Library > Exercises:** edit your own exercise, rename it, and past
  workouts show the new name.
- **Import:** history with 8+ workout titles keeps 7 and names the
  skipped. A huge AI paste says "too large".
- **Small fixes:**
  - Crimson "good" is green, and Execution shows whole numbers.
  - Analytics > Strength doesn't slide sideways.
  - Opening the app while signed in shows no Login flash.
- **What's New:** read both releases at `/profile/whats-new?preview=1`. The
  Latest update card shows at `/profile?preview=1`.
- **Known, not regressions:**
  - the bottom nav sits under the Finish dock on a live workout (qol12)
  - Last 7 days still counts an unfinished workout (stowed: the summary
    endpoint should exclude it)

## Not in this wave (stowed; none authored)

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

- **M2 - SUPERSEDED Oct 8: repoint staging Render to
  `quality-of-life-updates`** (the Next action above). It still tracks
  `ai-connector-wave`. The STAGING WorkOS
  External Sign-in URI is pinned to the `ai-connector-wave` Vercel PREVIEW
  host - never delete `ai-connector-wave` (or its preview) while that URI
  points at it. If staging ever looks stale, check Render -> Settings ->
  Branch FIRST (Sept 29 lesson).
- **`ai-connector-wave` = `main` + post-merge docs-only commits** until they
  land on `main` (Seth's "push to main" - same pattern as past waves).
- **Git cleanup done Oct 7 (Seth's OK):** 112 merged local `cursor/*` and
  `gate/*` branches deleted (`git branch -d`, none refused); the merge
  worktree `merge-main-0927` removed. Old wave branches, `recon/*`,
  `parked/*`, `stash-preserve/*` and all REMOTE branches untouched.
- **Stale `.git/worktrees/merge-main` + `merge-main-0927` admin dirs**
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

## Repo / deploy state (Oct 7, late - verify from the services)

- **`main` = `ef5e908`** (+ any post-merge docs). Prod Render
  `workout-db-l3gc` and prod Vercel `https://workout-db-psi.vercel.app` serve
  it - probed Oct 7: `/block-templates/format` 200 (Block Format v1),
  `/block-runs/active` 401, bundle `index-DMK9TWHq.js` holds sr3 code. Any
  push to `main` is prod-bound (gate 2).
- **Prod DB migrations, all hand-applied by Seth:** `add_ai_consent` (Sept
  26), `CoachUsage` + `WorkoutSession.reopenedAt` (Sept 27), `blocks_v2` +
  `block_exercise_per_side` (Oct 7, `_prisma_migrations` checksums copied
  from staging, verify queries matched). Prod's build never migrates.
- **Staging DB** has the same plus everything via Render's `migrate deploy`
  (a staging Render DEPLOY is also a staging MIGRATION).
- Stable topology (prod env, WorkOS, verify-from-services, branch-deletion
  cautions): REFERENCE -> "Deploy topology".

## Lanes + verification (Oct 8)

- `cursor-lane`, `-2`, `-3` (Oct 8): on `recon/qol-r1|r-2|r-3` at `8090b10`,
  porcelain clean, each holding a STALE recon DELIVERY.md (gitignored) -
  delete them before the first QOL dispatch. Lane 2's `server` has its own install WITH
  `@cursor/sdk` (live coach calls); lane 3's `node_modules` are junctions
  into lane 1; lane 3 holds three untracked mock PNGs in
  `client/src/assets/scenes/` - never stage them. Lessons: REFERENCE.
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

**Updated:** October 9, 2026, late (Opus seat). Session log:
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

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
