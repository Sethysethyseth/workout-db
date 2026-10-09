# HANDOFF — current state

> **WHERE WE ARE (Oct 8):** the **quality-of-life wave is AUTHORED, nothing
> dispatched.** Branch `quality-of-life-updates` (cut from `main` at
> `b5c6777`, pushed). There are 15 blocks QUEUED (`docs/tasks/QUEUE.md`, top).
> Design of record: `docs/specs/quality-of-life-wave.md` - Seth's Oct 8
> rulings, the wave's design language, order and collisions, and the new
> What's New pipeline. Recon reports: `docs/tasks/qol-r{1,2,3}-*-FINDINGS.md`.
> `ai-connector-wave` stays MERGED and LIVE (`main` = `b5c6777`).

**Next action (human):** two things.
1. Pick A or B on the mock (https://claude.ai/artifact/Ne8y8k6KaLXXY5jACctD9g),
   and OK the chat-bubble coach icon. qol2 and qol6 wait on this.
2. Say "migrate staging" so qol1 (`8ccbbab`, held on `cursor/qol1`) can
   merge and push.

## PICK UP HERE (next session)

1. **Run the QOL relay** with `dispatch-unit` + `land-unit` (one resident
   session). Repoint each lane first: `git checkout -B cursor/<unit>
   quality-of-life-updates`. The lanes sit on `recon/qol-r*` branches,
   clean, holding only stale recon DELIVERY.md files - delete those
   first. Opening pair: qol1 + qol3 (disjoint), then qol2.
2. **Gates inside the wave:**
   - qol1's landing push migrates staging ("migrate staging",
     status -> deploy -> status).
   - qol11 needs `COACH_KEY_SECRET` on staging Render (Seth; the command
     is in `server/.env.example` after qol11).
   - qol6, qol7, qol10 and qol11 are privacy, cross-user or security
     surfaces - audit them as frontier escalations.
3. **Wave end:** ONE critic round after qol14 (Seth's Oct 6 rule), then
   qol15 (What's New) LAST, then N/N -> Seth smokes (What's New copy at
   `/profile/whats-new?preview=1`) -> gate. Prod before merge:
   - the qol1 migration (Seth, by hand)
   - `COACH_KEY_SECRET` on prod Render
4. **New standing process (Oct 8):** every landing appends a plain-language
   entry to `docs/releases/UNRELEASED.md` (`land-unit` section 5), and
   every wave ends with a What's New unit from `docs/tasks/_WHATS_NEW.md`
   (`author-task-block` Finish).

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

**Updated:** October 7, 2026, late (Opus seat). Session log:
- Read HANDOFF and continued: landed sr3-6 `468bab9` (seat-fixed drop
  target), ran Seth's ONE-round feel critic (6/10 FAIL), authored and landed
  the fix round sr3f1 `cf4fdee`, sr3f2 `b64de00`, sr3f3 `ccf468b` (sr3 wave
  10/10), Seth signed off smoke round 4, pre-main gate PASS (+ seat fix
  `1ce8fdb`), Seth applied the prod migrations, merged `7d3b91e..ef5e908`.
- Close-out: HANDOFF split three ways (archive / REFERENCE / this file),
  `scripts/run-lane.ps1` saved from the scratchpad and wired into
  `dispatch-unit`, git cleanup above, lanes reset. Full log in the archive.

**Updated:** October 8, 2026 (Opus seat). Session log:
- Seth opened the next wave: `quality-of-life-updates`, with "all stowed
  changes" plus his 6 asks:
  - prefs out of the logger
  - a What's New system
  - repeat last time
  - finish without effort
  - edit custom exercises
  - coach app help
- Cut the branch and dispatched 3 Cursor recon report lanes (qol-r1/r2/r3,
  auto rung, lanes 1-3, ~6 min each, all clean); reports preserved as
  FINDINGS.
- Asked Seth the batched decisions. Answers (spec section 1):
  - prefs: Profile + Home strip
  - repeat last: ghosts
  - app help works without consent, with no data
  - connector hardening, BYO-key server encryption and coach history
    (Library tab, kept until deleted) all IN
- Authored qol1-qol15 + the spec + the What's New pipeline:
  - `docs/releases/UNRELEASED.md`, seeded with the Aug-Oct catch-up
  - `RELEASED.md`
  - the standing `docs/tasks/_WHATS_NEW.md`
  - `land-unit` and `author-task-block` updates
- Shipped `.gitattributes` directly (migrations `eol=lf`; blobs were
  already LF, so no content change).
- Memory: the Aug 1 effort-mandate memory is marked REVERSED.
- Lanes: `cursor-lane` / `-2` / `-3` on `recon/qol-r1|r-2|r-3` at
  `8090b10`, each holding a stale recon DELIVERY.md (gitignored).
  Delete them before dispatch.

- Oct 8, relay started (same Opus session). Seth repointed staging Render
  to `quality-of-life-updates`. Dispatched qol1 (lane 1), qol3 (lane 2) and
  qol5 (lane 3) on auto, staggered.
  - Built the pre-build mock at
    https://claude.ai/artifact/Ne8y8k6KaLXXY5jACctD9g (Design canvas, 7
    boards, real champ-dark tokens): Home today, strip options A and B, an
    interactive setup sheet, Profile > Training, coach help-only, coach
    thread.
  - **qol5 LANDED `be7334a`.** Live proof: 300 kB to /coach/import-map ->
    401, /templates still 413.
  - **qol1 audited and committed `8ccbbab`** on `cursor/qol1`, NOT merged
    (held for "migrate staging").
  - Dispatched qol8 (lane 3). qol2 and qol6 are held for the mock
    decision.
  - Smoke items so far: history import with 8+ workout titles keeps 7 and
    names the skipped; a huge AI-import paste says "too large".

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
