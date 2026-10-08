# HANDOFF — current state

> **WHERE WE ARE (Oct 7, late):** `ai-connector-wave` is **MERGED and LIVE**.
> `main` = `ef5e908` (fast-forward `7d3b91e..ef5e908`, 147 commits - the BK
> blocks wave, the bkr fix wave and the sr3 wave + its critic fix round), gate
> PASS, prod DB migrated first (`blocks_v2`, `block_exercise_per_side`), prod
> API + Vercel verified serving it, and Seth smoked prod ("looks beautiful").
> **Nothing is in flight:** no wave open, nothing QUEUED, all three lanes idle
> and clean. The full wave record (gate verdict, prod steps, smoke rounds,
> session logs) is in `docs/HANDOFF-ARCHIVE.md` (top block); standing
> reference moved to **`docs/REFERENCE.md`** (Seth's call, Oct 7).

**Next action (human):** repoint staging Render `workout-db-staging` to
`main` (M2, Housekeeping below), then tell the next session which candidates
make the next wave.

## ▶ PICK UP HERE (next session)

1. **No wave is open.** Start by asking Seth which candidates below form the
   next wave - batched, with a recommendation (Seth's standing ask).
2. Read `docs/REFERENCE.md` -> "Durable gotchas" once before planning; the
   frontier seat greps `docs/HANDOFF-ARCHIVE.md` for history.
3. Author with `author-task-block`; dispatch with `dispatch-unit` +
   `scripts/run-lane.ps1` (repoint a lane with `git checkout -B
   cursor/<unit> <wave-branch>` first - they sit detached at `ef5e908`).
4. Wave branch: decide with Seth at wave start. The staging WorkOS sign-in
   URI is pinned to the `ai-connector-wave` Vercel PREVIEW host (see M2), so
   either keep using `ai-connector-wave` (fast-forward it to `main` first) or
   cut a new branch and move that URI.

## Next-wave candidates (none authored)

- **Exercise hold-to-move (Seth, Oct 7, after smoke round 4):** "you can
  hold and move exercises like days and weeks, when held app adjusts so you
  can move them easier" - long-press reorder for exercise cards in the
  builder (reuse sr3-6's `useHoldToReorder`, vertical axis), with the list
  adapting while held (e.g. cards collapse to one line) so a long day is
  easy to drag across.
- **Exercise search synonyms - HELD for Seth's own planned change (Oct 7).**
  The sr3 critic's "multi-word search fails" was a misdiagnosis: the pure
  `searchCatalog` already AND-matches words ("one leg calf" finds "Dumbbell
  Seated One-Leg Calf Raise"); "single leg calf" misses on a SYNONYM gap
  ("single" vs "one"). Fold into Seth's change (likely
  `server/data/exercise-aliases.json` + its rationale doc, or query-side
  synonyms in `server/src/analytics/searchCatalog.js`).
- **sr3 critic deferred P3s** (`docs/tasks/sr3-critic-round-1-FINDINGS.md`):
  P3-1 the builder name gets its own row, P3-2 coach box placement / title
  wrap, P3-5 one action-sheet style, P3-8 recent exercises on an empty
  search, P3-10 Library load time.
- **Gate follow-up (Oct 7):** `/coach/import-map` and the import-fix recipe
  path accept 1,000,000 chars but sit behind the default 100 kB JSON body
  limit - a >100 kB paste gets a raw 413. Route-level limit or a friendly
  message. (Also noted: no rate limiter on `/block-templates/import*` or
  `/block-runs` - authed, DB-only.)
- **sr3 follow-ups:** history import keeps the 7 most-used titles with a
  "skipped" warning (today 8+ distinct titles hard-fail the preview); swap an
  exercise for today on a block day (PARKED by Seth); a `.gitattributes`
  `*.sql text eol=lf` rule so migration checksums stop depending on the
  machine that applied them.
- **Known and deferred from the BK smokes:** no rest timer after a set;
  fractional Execution numbers; desktop In-progress bar width; "Per side"
  offered on bilateral lifts; the builder's week pill is a bright white bar;
  crimson's "good" colour reads amber; the old quick-log set-count / L-R pair
  confirms are still browser dialogs; a ~1 s Login flash after iOS clears
  site data for 7+ idle days.
- **Privacy page + ToS** (BK0, `ai-layer.md` section 6) - DRAFT until Seth
  supplies its open facts (below).
- **Connector hardening - offered Sept 28, NOT decided:** make the site root
  forward `?external_auth_id=` to `/connector/login`, so a wrong sign-in URI
  can no longer strand the handshake (bit twice: Aug 8, Sept 26-28).
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- Coach discoverability and CR2 polish - REFERENCE "Still governing".

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

- **M2 - repoint staging Render to `main` (now unblocked).** Staging Render
  `workout-db-staging` still tracks `ai-connector-wave`. The STAGING WorkOS
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

## Lanes + verification (Oct 7, late)

- `cursor-lane`, `-2`, `-3`: all detached at `ef5e908`, porcelain clean,
  stale reports removed. Lane 2's `server` has its own install WITH
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

- The connector-hardening yes/no; the R6 tagline pick (one-line
  `AuthLayout.jsx` swap); FP8 icon PNGs (drop into `claudefiledrop/`); the
  Cursor model-routing question; the `docs/parked/*` ruling; BK0's open facts
  (operator name, contact email, US state); the BYO-key encryption design
  and the coach-history product call (both in "Seth's asks" above).

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

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
