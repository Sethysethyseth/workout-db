# HANDOFF — current state

**Updated:** July 7, 2026 latest+5 (Opus — EOD; prod choreography PREPPED,
handoff for next session. Seth done for the day.)** No prod writes happened
this session — the whole prod rollout is teed up for the next session to
execute WITH Seth. Decisions locked here:
- **NEW RULE (Seth, this session):** during **Opus/Fable review sessions**
  the reviewing agent gets a **READ-ONLY prod DB connection** for diagnostics
  (dedicated `readonly_agent` Neon role, SELECT-only); **all prod WRITES
  (migrations, seed) still stay with Seth.** Does NOT extend to Sonnet/Cursor.
  Rationale: the May-2026 wipe was a *different, non-frontier* model. Saved to
  memory (`opus-fable-review-prod-access`). **TODO next session: codify this
  scoped exception into AGENTS.md invariant #9 + gate item 2 (get Seth's exact
  wording — do NOT unilaterally rewrite the safety invariants).**
- **Read-only access NOT yet stood up.** To do the agent-side Step-0 read,
  Seth creates the `readonly_agent` role on prod (SELECT-only CREATE ROLE +
  GRANTs) and drops the real conn string in an OFF-TRANSCRIPT scratchpad file;
  OR just pastes the Step-0 query output from the Neon editor and skips the
  role entirely (both queries are in Next-up item 0). Placeholder string Seth
  first pasted had a template password (`choose-a-strong-password-here`) — not
  usable; real creds go via file, never chat.
- **Seed method LOCKED = Option A:** `npx prisma db seed` against prod (tested,
  idempotent, no hand-written SQL, identical 873-row result). It's a WRITE, so
  **Seth runs it** with the write-capable prod owner URL (NOT `readonly_agent`).
  Today's `assertRecognizedHost` guard split is what lets seed run on prod.
- **State unchanged on prod:** prod still has NEITHER catalog nor FK migration;
  `origin/main` still `3767840`; branch `catalog-fk-wave` `6331647` is
  review-clean and pushed. NOT merged. Full ordered choreography = Next-up
  item 0.
Previous entry retained below for continuity.

**Updated:** July 7, 2026 latest+4 (Opus — PRE-MAIN REVIEW DONE + guard-split
fix landed `0e6f32a`.)** Ran the mandated Fable/Opus pre-main branch-diff
review of the whole A-wave (`catalog-fk-wave` vs `main`), with the archived
session logs in hand. **Verdict: code is clean and mergeable** — schema/
migrations additive and consistent (nullable FKs, SET NULL, one-identity
CHECKs, indexed), the `userExerciseId` tier correctly threaded resolve ->
enrichSet -> attribution (the `0d2118e` regression fix holds and is pinned),
write-path controllers enforce cross-user ownership on `userExerciseId` and
reject both-set, backfill is idempotent/dry-run-default/`--apply`-gated, client
picker is debounced+seq-guarded+no-portal+a11y, CSS token-clean. Fresh lanes:
unit 129/129 then 137/137 after the fix, client build green.
**One finding, fixed this session (direct-fix, diagnosis was the work):** the
prod migration choreography needs `npx prisma db seed` (873 catalog rows) and
the A6b backfill `--apply` on prod, but BOTH called `assertSafeForReset`, which
denylists the prod host — the prod rollout would have been blocked by its own
guard at the seed step. Split the guard: new `assertRecognizedHost` (permits
prod deliberately, still rejects unknown/typo'd hosts) now guards seed.js +
backfill; `assertSafeForReset` (staging/localhost only) still guards the
destructive test-reset path (`jest.setup.js`) unchanged. Added first-ever
`dbHostGuard` unit tests (137 total now) routed into the fast unit lane
(`test/lib/**`). Committed `0e6f32a`, pushed, origin confirmed.
**Minor note (not fixed, non-blocking):** `updateSessionExercise` silently
drops a provided identity when the patch carries no `exerciseName` — harmless,
the picker always sends both. **Next: the branch is review-clean — decide
prod-choreography go, run it (seed + linkage migrations + optional backfill;
check prod's `_prisma_migrations` for the old May-27 catalog-migration-name
situation FIRST, still unverified on prod), then "push to main" (gated
trigger).**
Previous entry retained below for continuity.

Older session entries (incl. the July 7 A4-landed entry, the July 6
off-queue login-UX fixes, the relay-v4 restructuring, and the L3
staging-migration verification): moved verbatim to
`docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

## Repo / deploy state

- **Active branch: `catalog-fk-wave` at `0e6f32a`** (code) — A1 + A4 + A5 +
  A6b all landed, plus the `0e6f32a` db-host-guard split (prod seed/backfill
  now permitted; see newest HANDOFF entry). Pushed, origin confirmed.
  Pre-main review DONE and clean. A-wave is code-complete + review-clean.
  Branched off `logging-ux-wave` HEAD `80373e1` (= main + one HANDOFF docs
  commit). **Both catalog/linkage migrations are APPLIED ON STAGING**
  (`ep-bitter-breeze-am81izlh` / noisy-surf) as of July 7 (Sonnet):
  `20260707120000_add_exercise_catalog` was baselined via `prisma migrate
  resolve --applied` (the table already existed under the old May-27
  migration name — see the archived July 7 HANDOFF entry for the full
  story) and `20260707130000_add_exercise_fk_linkage` applied clean via
  `prisma migrate deploy`. Columns + CHECK constraints verified by direct
  SQL query, not just `migrate status`. **Prod has NEITHER migration** — do
  not assume prod's catalog migration situation mirrors staging's without
  checking; no session has touched prod yet. **Render's staging service is
  confirmed pointed at `catalog-fk-wave` on the latest commit** (Seth
  verified July 7 latest+3) — no longer an open question.
- **`main` is at `3767840` (July 6 Opus)** — T3B basic cold-start
  lifter loader, clean ff from `logging-ux-wave` (`451a3d6..3767840`). Client
  CSS + docs only, no migration/schema/server. Prod Vercel/Render track `main`
  and auto-deploy on push — **verify Events show `3767840`** before treating it
  as live. This entry supersedes the historical merge notes below.
- **`main` was at `d927fb8`** — L-wave (L1-L6 + A6) + login-UX/resume-hero
  fixes + relay-v4 docs, merged July 6 (clean ff, prod migrations applied +
  verified first). `451a3d6` was a HANDOFF doc commit on top.
- **`main` was at `750c42b`** (fast-forward: `ui-loading-screens` -> `main`,
  T3 dynamic loading screens), confirmed on `origin/main`. Merged + pushed
  July 4 (Sonnet session). `main` had not moved since the branch point, so
  `git merge --ff-only` applied cleanly - no worktree, no conflicts.
  Seth confirmed the Vercel preview of `ui-loading-screens` looked right
  (pulsing dots / breathing ring / label cross-fade) before triggering
  "push to main" - matches the standing visual-sign-off-before-merge rule.
  No schema/migration coupling (client + docs only, 15 files).
  Render/Vercel prod both track `main` and auto-deploy on push - **verify
  the prod deploy SHA is `750c42b` in Render/Vercel Events before assuming
  it's live.**
- **`main` was previously at `e9ce82c`** (merge: `analytics-engine` -> `main`, "analytics wedge (B1-B9) + UI polish wave (U6-U10)"). Merged July 4 (Sonnet session) via scratch `git worktree` (not stash+checkout — see the worktree-merge gotcha), pushed same session.
  - `git merge --ff-only` was NOT possible — `main`'s `ccd0829` (the ui-palettes-v2 merge commit) postdates `analytics-engine`'s branch point, so the branches had genuinely diverged. Did `git merge --no-ff analytics-engine` instead, matching how `ccd0829` itself was created.
  - **Two conflicts, both resolved by taking `analytics-engine`'s version whole:** `AGENTS.md` and `CLAUDE.md` (add/add — main still had the stale PRE-consolidation duplicated-gate versions of both files from before the July 1 single-source consolidation; `analytics-engine`'s versions are the current v3 ones and fully supersede them, no unique content lost).
  - Verified before committing the merge: server unit lane 103/103 green, client `npm run build` green, both run fresh in the worktree (had to `npm install` there — worktrees don't carry `node_modules`).
  - Pre-merge sign-off (Seth, July 4): smoke test on the d21608c UI wave passed; `analyticsController.js` `findMany` where-clause reviewed and confirmed as the single cross-user isolation point (sets reached only through a session scoped to `{ userId, performedAt }`); the two open forks below settled. **The Fable/Opus pre-main branch-diff review (mandated by the v3 workflow) was explicitly skipped this one time at Seth's instruction** — noted here so it isn't silently treated as having happened.
  - `ui-palettes-v2` (`ec3d85a`) was already fully contained in `analytics-engine` and is now merged too; deletable (branch deletion is gated — ask first).
  - No schema changes rode along — `analytics-engine`'s merge has no migration coupling. The separate `exercise-catalog-seed` branch (A1) still has its own gated migration track.
- **Render/Vercel not yet repointed from the `analytics-engine` staging deploy back to `main`** — RUNBOOK step 6 ("Repoint staging Render back to main. Verify redeploy SHA in Events.") is still open; do this before smoking prod.
- Username feature LIVE and verified on both environments (unchanged).

## Open TODOs (do at next session start)

0. ~~Fix the pre-existing decimal-reps bug~~ **DONE — verified July 7**:
   reps input at SessionDetailPage.jsx:934 now has `step="1"` (L6 shipped
   the step fix; `4d82311` killed the wheel-scroll path). Weight keeps its
   correct `step="0.01"` (line 908).
0b. **Re-seed the staging smoke account**: `smoke_b8` / `SmokeTest-B8-2026`
   (documented in the July 3 session log below) now 401s — wiped by a
   later `npm test` run resetting staging's DB (expected AGENTS.md
   behavior, easy to forget). Either re-run `scripts/seed-staging-smoke.mjs`
   or document whatever throwaway account replaces it (`smoke_lwave` was
   used ad hoc this session, not seeded with fixture data).
1. ~~Prod smoke of the L-wave on `main`~~ **DONE — confirmed by Seth July
   7**, no issues reported.
2. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK -> "Migration history diff"). Unresolved, predates the UI work.
3. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's** for `20260603140000_add_user_username`. Latent hazard — check once, fix if mismatched.
4. Confirm prod Render serving cleanly post-recovery.
5. Low-priority: redundant spare stash on `ui-palettes-v2` (`WIP unrelated to ui-palettes-v2 merge`, July 1) — `git stash drop` once confirmed unneeded.
6. Low-priority: branch graveyard has grown — `ui-palettes-v2`,
   `analytics-engine`, `ui-loading-screens`, `ui-nav-overhaul` (all merged
   to `main`), `exercise-catalog-seed` (superseded by `3a6bc25`), and
   `origin/cursor/prod-migrate-l1-l3-prep-0b4a` (moot; prod migrated by
   hand July 6) are all deletion candidates whenever Seth wants to ask for
   that gated op.

## U5 — UI overhaul (T1/T2/T3 MERGED TO MAIN, T4 not started)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE**, **T2 DONE and merged to main** (`ccd0829`, July 1): all 5 palettes (champ, iron, chill, forest, crimson) on real raster scenes; shared pixel-art chrome; fade-mask band generalized to all palettes; dead-zone glow fix; navbar bleed-through fix. 5-palette x dark/Home smoke matrix closed (`docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`); light mode + non-Home routes not covered (unchanged by fixes, lower risk). Card chrome + trimmed Home reviewed against mocks July 1 and kept as-is (deliberate decisions, not gaps). Merge done via temp `git worktree`, not stash+checkout (Windows/OneDrive file-lock hang on `git stash`).
- **T3 DONE and merged to main** (`750c42b`, July 4). T4 (motion) not started; no design work done yet.
- Full T2 fix-by-fix history: see the July 1 morning HANDOFF in git history (`ec3d85a`).

## Next up (the active task)

0. **PROD CHOREOGRAPHY for the A-wave — teed up, execute WITH Seth.** Branch
   `catalog-fk-wave` (`6331647`) is code-complete + review-clean. Generic
   ritual: RUNBOOK section 3 (DB-before-code). Agent is READ-ONLY on prod
   (Step 0 only); **Seth runs every write.** Ordered steps:

   **Step 0 — read prod state (agent read-only OK, or Seth pastes).** In the
   Neon editor (confirm host `ep-solitary-sea-an56mioq`) or via the read-only
   role, run:
   ```sql
   SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY migration_name;
   SELECT to_regclass('public."Exercise"') AS exercise_table;
   -- if exercise_table non-null: SELECT count(*) AS exercise_rows FROM "Exercise";
   ```
   This decides Step 1's branch. (On STAGING the `Exercise` table already
   existed from an abandoned May-27 migration, which collided with the new
   catalog migration and left a FAILED `_prisma_migrations` record blocking
   deploys — see archived July 7 latest+1 entry. Prod may or may not have the
   same; Step 0 tells us.)

   **Step 1 — catalog migration `20260707120000_add_exercise_catalog` (Seth):**
   - If `Exercise` does NOT exist: apply it (RUNBOOK 3 - Neon-editor DDL +
     hand-insert the `_prisma_migrations` row with the checksum copied from
     STAGING's row for the same migration; OR `prisma migrate deploy` with the
     prod URL).
   - If `Exercise` ALREADY exists (staging's case): first clear any FAILED
     migration record, then baseline via
     `prisma migrate resolve --applied 20260707120000_add_exercise_catalog`.

   **Step 2 — seed (Seth):** `npx prisma db seed` against prod (write-capable
   owner URL; NOT `readonly_agent`). Idempotent upserts. Verify `count(*) = 873`
   and muscleWeights present. (This is the LOCKED Option-A seed method.)

   **Step 3 — FK linkage migration `20260707130000_add_exercise_fk_linkage`
   (Seth):** apply (Neon-editor DDL + `_prisma_migrations` row, or
   `prisma migrate deploy`). Verify by SQL: `exerciseId`/`userExerciseId` on
   TemplateExercise/SessionExercise/BlockWorkoutExercise, `blockWorkoutSetId`
   on WorkoutSet, all three `_one_identity_chk` CHECK constraints present.

   **Step 4 — verify prod == staging schema** (RUNBOOK 4 migration diff; no
   drift, checksums match on shared names).

   **Step 5 — merge to main (gated "push to main" trigger):** `git merge
   --ff-only catalog-fk-wave`, one command at a time, prod auto-deploys.
   Ordering is load-bearing: DB migrated BEFORE code merges (code-ahead-of-DB
   crashes prod login).

   **Step 6 — post-merge:** repoint staging Render back to `main` (RUNBOOK 2
   step 6), verify prod deploy SHA in Render/Vercel Events == new main HEAD,
   smoke prod login + a session/analytics surface that touches `exerciseId`.

   **Step 7 (optional) — historical backfill:** `node
   scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply` against
   prod for pre-A4 historical rows (now unblocked by the guard split; Seth
   runs the write). Idempotent; safe to defer.
1. **T3C sprite loader upgrade** unblocks whenever Seth drops the Gemini
   frames in `claudefiledrop/` (art direction + prompts settled July 6).
   Note: `claudefiledrop/` currently holds two `.url` shortcut files
   pointing at a Discord CDN, not the transparent PNG frames themselves -
   not yet the expected drop.
2. T4 motion (last unstarted U5 unit) — needs a Fable design pass first;
   queued behind the A-wave.

## Analytics/catalog track — state

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction
rationale: `analytics-engine-direction` memory. Full B1-B9 build history:
`docs/HANDOFF-ARCHIVE.md`.*

**Track B v1 (B1-B9) is code-complete and MERGED TO MAIN (`e9ce82c`, July 4).**
**Track A is CODE-COMPLETE on `catalog-fk-wave` (`eeaa30c`, July 7)** — A1,
A4, A5, A6b all landed, both migrations applied + verified on staging (see
QUEUE.md). Awaiting the Fable/Opus pre-main review before merge. Track C
(AI coach) stays dead-last.

**State / open items:**
1. **A2 DONE + committed (`48c1e91`):** muscle-weights curation cleaned (3 bad IDs
   fixed: `Incline_Bench_Press` -> `Barbell_Incline_Bench_Press_-_Medium_Grip`,
   dropped `Bulgarian_Split_Squat` + `Pendlay_Row`; 32 -> 30, all keys resolve,
   sums valid). `scripts/validate-catalog.mjs` disk-only validator included.
2. **A1 DONE (`3a6bc25`, July 7)** — the old `exercise-catalog-seed` branch
   (`c27a6de`) is now fully SUPERSEDED (reconciled by hand, migration
   re-timestamped) and deletable (gated op, ask Seth). **CORRECTION (July 7
   latest+1):** the July 6 claim that "test resets wiped it from staging"
   was WRONG — the old-named migration was applied May 27 and never left
   staging; the table has held all 873 rows since. Bookkeeping was
   reconciled via `prisma migrate resolve --applied` (see the newest
   HANDOFF entry). **Prod's catalog-table status is still genuinely
   unverified** — do not assume prod mirrors staging's history here.
3. **Validator surfaced 29 secondary-less compounds** in the 675-exercise lifting
   subset (mostly ab/isolation, not loaded compounds) — attribution gaps to skim
   during a later curation pass (A3 candidate), not urgent.
4. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.**
   Worth a look before the staging seed runs.
5. **A4 DONE (`0743070`, July 7)** — structural exercise identity (nullable
   exerciseId/userExerciseId FKs) landed on TemplateExercise, SessionExercise,
   BlockWorkoutExercise + blockWorkoutSetId groundwork on WorkoutSet.
   **Migration applied to staging July 7** (verified by direct SQL query).
   Prod does NOT have this migration yet — separate gated op when the wave
   merges.
6. **A5 DONE (`c7c8ca6`, July 7)** — `GET /api/exercises/search` (pure
   `searchCatalog` module) + live-session typeahead; selecting a suggestion
   commits `exerciseId`/`userExerciseId`, free text still commits none.
   No schema/migration coupling.
7. **A6b DONE (`eeaa30c`, July 7)** — idempotent dry-run-default backfill
   script for historical rows. Dry-run against staging: all three tables
   already at zero null-identity rows (A4's write-path stamping already
   covers current data) — nothing to `--apply` on staging right now, but
   the script stays useful for prod once its migration lands.
8. **Bug found + fixed same session (`0d2118e`, July 7, not a task-block
   unit):** `attribution.js` never learned A4's `userExerciseId` resolution
   tier, so custom-exercise volume silently lost all muscle attribution
   once a session resolved via stored id (the normal case post-A4). Caught
   by the first full `npm test` run since staging's migration made the
   tier reachable. Fixed directly (one-line source check), full suite
   re-verified 185/185 after.

## Other branches floating around

- `round-7-unify-set-row` (`f6c2a6f`) — set-row unification, parked, decision pending.

## Issues to open

1. Resolve connect-pg-simple `session` table drift (proposed: option (b) `@@ignore` soon).
2. Integration-suite isolation on shared staging — **Neon supports instant copy-on-write DB branches; a branch-per-test-run would kill the FK-pollution flake entirely. Worth a spike.**
3. ~~Gitignore export/junk artifacts~~ **DONE July 1** (`bf24b46`).
4. User-defined exercise support for movements absent upstream (Bulgarian split squat, Pendlay row).
5. Favicon/PWA icon swap for LogChamp (needs an asset).
6. Long-term call on migration automation vs manual discipline.
7. Schema sentinel — see spec (`docs/specs/schema-sentinel.md`).
8. **NEW: repo lives inside OneDrive** — already caused a `git stash` hang (worktree workaround exists) plus file-lock/sync-lag risk. Decision for Seth: move the repo out of OneDrive (e.g. `C:\dev\workout-db`) or exclude it from sync. Everything is committed+pushed now, so the move is low-risk whenever chosen.

## Known tech debt (queued, not blocking)

- `DraftSessionSetRow` / `SessionSetRow` unification.
- Prisma 6->7 bump.
- Jest open handle.
- pg SSL deprecation.

## Notes / gotchas discovered

- **Two agents, one working tree (July 1):** Cursor wrote B2/B3a files while Claude Code was committing B1 in the same checkout — an in-flight `index.js` edit got swept into the B1 commit (`e4c96be` doesn't build alone; fixed by `cd72e9c`), and HANDOFF was overwritten mid-rewrite twice. When both agents are active: check `git status --untracked-files=all` immediately before every commit (untracked DIRECTORIES collapse to one line and hide new files), wait for writes to settle (check mtimes), and prefer only ONE agent committing at a time.
- Scene mock PNGs are design references with fake UI ghosted in — they now live in `docs/design/mocks/` (`ChampMock`, `IronMock`, `ChillMock`; Forest/Crimson mocks deleted June 30 after crops verified). Never ship from `client/src/`; only ever crop the bottom scene band. `CrimsonMock` had a gray phone-frame surround (inset crop), not full-bleed like the others.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on device.
- When bumping a value produces near-zero visible change, it's not a tuning problem — something is suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate any DB.
- `server/.env` only ever points at staging or localhost, never prod. `dbHostGuard` enforces this two ways: `assertSafeForBoot()` runs automatically at server boot (`server.js`); `assertSafeForReset()` covers the test/reset path (`test/jest.setup.js`) and must be called explicitly by any new DB-connecting script at the top of `main()`.
- `npm run test:unit` is DB-free by construction; `npm test` still requires (and resets) the staging DB.
