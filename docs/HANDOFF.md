# HANDOFF — current state

**Updated:** July 7, 2026 latest (Sonnet — A4 LANDED `0743070`; L-wave prod
smoke closed.)** Seth confirmed the L-wave prod smoke (Open TODO #1) is
complete — no issues reported. **A4 (`a4-exercise-fk-linkage.md`) audited and
committed `0743070`, pushed, origin confirmed on `catalog-fk-wave`.** Nullable
`exerciseId`/`userExerciseId` on TemplateExercise/SessionExercise/
BlockWorkoutExercise (+ at-most-one CHECK per model), `blockWorkoutSetId`
groundwork on WorkoutSet, write-path stamping helper
(`server/src/lib/exerciseIdentity.js`, catalog beats userExercise, mirrors
`resolveExercise` tier order), `resolve.js` gains a stored-`userExerciseId`
tier ahead of name resolution. Audit re-ran both lanes fresh (unit 124/124,
`prisma validate` clean — matches `DELIVERY.md`'s claims), confirmed scope
exact against FILES TO TOUCH (13 files, no client touch), verified the
migration SQL by hand (7 ADD COLUMN / 7 indexes / 7 SET-NULL FKs / 3 CHECK,
no DROP/NOT NULL/DEFAULT), confirmed schema types match the block's exact
spec (String? on the Exercise FK, Int? on the UserExercise FK — avoids L3's
wrong-FK-type mistake), and spot-checked `analyticsController.js`'s id
precedence against the pre-existing `exerciseName` derivation precedence
(`sessionExercise ?? templateExercise ?? null`) — identical shape, not
invented. Integration lane written (4 tests) but deliberately NOT run per
the block's sequencing flag. **Migration is NOT applied to any environment
yet.** Next: Seth's staging migration choreography (RUNBOOK, gated) — (1)
`20260707120000_add_exercise_catalog`, (2) `npx prisma db seed` from
`server/`, (3) `20260707130000_add_exercise_fk_linkage`, in that order —
then staging Render redeploy, then dispatch A5/A6b.
Previous entry retained below for continuity.

**Updated:** July 7, 2026 (Fable — A-WAVE OPENED: Track A structural
exercise identity. A1 landed direct; A4/A5/A6b authored and queued.)**
New branch `catalog-fk-wave` (off `logging-ux-wave` HEAD `80373e1` = main
`3767840` + one docs commit). **A1 LANDED `3a6bc25` (Fable direct):** the
stale `exercise-catalog-seed` branch (`c27a6de`, May 27) reconciled by
hand, NOT merged - its package.json predated `test:unit` (a blind merge
would have deleted it) and its prisma.config.ts seed shape predated Prisma
6.19 (`migrations.seed` is the current location; the deprecated
package.json `prisma` block was deliberately skipped). Exercise model added
standalone (no FKs), migration re-timestamped `20260527120000` ->
`20260707120000_add_exercise_catalog` (safe: never applied to prod, and
test resets wiped it from staging - July 6 verification showed 14
migrations, zero drift), seed.js verbatim (idempotent upserts,
`assertSafeForReset` guard), `server/data/README.md` updated for the
curated muscle-weights/aliases reality. `exercises.json` was already
byte-identical on main - data shipped with the engine, only the table
never landed. Unit lane 119/119 + `prisma validate` green; deploy-safe
before its migration (nothing queries the table). **Wave blocks authored
(contract-first): `a4-exercise-fk-linkage.md`** (nullable
exerciseId String? / userExerciseId Int? on TemplateExercise /
SessionExercise / BlockWorkoutExercise + CHECK at-most-one + WorkoutSet.
blockWorkoutSetId groundwork for block plan-vs-actual; write-path stamping
helper; engine gains a stored-userExerciseId tier; schema snippet in the
block IS the contract - L3's wrong-FK-type lesson), **`a5-exercise-picker.
md`** (pure searchCatalog + GET /exercises/search + live-session typeahead
writing ids on commit; free text stays first-class), **`a6b-exercise-id-
backfill.md`** (dry-run-default script stamping historical rows; unresolved
report feeds alias curation). **Migration choreography (Seth, RUNBOOK,
gated): after A4 lands - staging gets catalog migration, then `npx prisma
db seed`, then the A4 linkage migration, in that order (stamped FK values
need catalog rows), then Render redeploy, then A5/A6b.** A4's sequencing
flag is app-wide (regenerated client selects new columns on every
template/session/block read). Housekeeping this session: stale TODO #0
closed (reps `step="1"` verified at SessionDetailPage.jsx:934 - L6 fixed
it), moot `prod-migrate-l1-l3-prep.md` task file deleted (prod migrations
were applied by hand July 6), QUEUE rewritten for the A-wave. **Next:
dispatch A4 to Cursor; Seth's prod smoke of the L-wave on `3767840` is
still outstanding (list below).**
Previous entry retained below for continuity.

**Updated:** July 6, 2026 latest+1 (Opus — T3B "basic" cold-start lifter
loader MERGED TO MAIN; Gemini sprite upgrade queued.)** `logging-ux-wave`
fast-forwarded onto `origin/main` again — clean ff `451a3d6..3767840`, two
commits only: `73becdc` (feat: animated lifter mark on the cold-start boot
loader) + `3767840` (QUEUE doc). No migrations, no schema, no server change —
client CSS + docs only; **prod DB untouched**, deploys the client to prod
Vercel. Local + origin `main` both at `3767840` (local ref fast-forwarded to
match; ff push straight to `origin/main`, no checkout — avoids the OneDrive
lock hang). **What shipped:** the page-tone `LoadingState` (ProtectedRoute's
sole `tone="page"` user — the boot screen shown while `/auth/me` wakes a cold
Render server) swapped its breathing ring for an accent-tinted pixel-lifter
mask (`client/src/assets/brand/lifter.png`) doing a CSS-transform "rep"
(translateY + scaleY, `coldstart-lift`/`coldstart-glow` keyframes, lockout
glow, reduced-motion static, label cross-fade + delayed reveal untouched).
**This is a deliberate PLACEHOLDER** — Seth judged the single-silhouette bob
"not professional" (no articulation, no face). **Queued upgrade (decided this
session):** replace it with a real 3-frame full-color expressive pixel sprite —
Rack (bar at shoulders, elbows bent) / Drive (mid, gritted-teeth effort) /
Lockout (bar overhead, arms straight) — looped **A-B-C-B** via CSS `steps()`.
Art direction settled: full-color expressive mascot, ONE master character
recolored per palette (unique-per-theme, like the scene rasters). **Seth
generates the 3 frames in Gemini** (hero-then-image-edit workflow; prompts
handed off this session — flat limited palette, neutral skin / chalk-gray
singlet / steel bar so recolor is clean, feet+hips locked across frames to
prevent jump), drops the transparent PNGs in `claudefiledrop/`; then Claude
Code slices+aligns into a sheet, builds the `steps()` A-B-C-B animation,
generates the 4 palette recolors, wires it into `LoadingState`/`index.css`,
refreshes the preview harness. **Preview harness exists:** a standalone
Artifact (real sprite mask + real per-palette tokens + exact keyframes, with
palette/theme/motion/size controls) to judge the loader without a cold-start
wait or deploy — reuse/refresh it when the real sprite lands. **Verify (Seth,
browser):** Vercel prod Events show `3767840` deployed. Next: Gemini frames ->
sprite upgrade.
Previous entry retained below for continuity.

Older session entries (incl. the July 6 off-queue login-UX fixes, the
relay-v4 restructuring, and the L3 staging-migration verification): moved
verbatim to `docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

## Repo / deploy state

- **Active branch: `catalog-fk-wave` at `0743070`** (July 7 Sonnet) — A1 +
  A4 landed, pushed, origin confirmed. Branched off `logging-ux-wave` HEAD
  `80373e1` (= main + one HANDOFF docs commit). Carries TWO unapplied
  migrations (`20260707120000_add_exercise_catalog`,
  `20260707130000_add_exercise_fk_linkage`) — A1's is deploy-safe alone
  (standalone table), but A4's is NOT (every template/session/block read
  selects the new columns); see the wave choreography in QUEUE.md.
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

0. **A-wave on `catalog-fk-wave` (`0743070`).** A1 + A4 landed. Next: Seth's
   staging migration choreography (catalog migration -> `npx prisma db seed`
   -> A4 linkage migration, in that order - see QUEUE.md), then staging
   Render redeploy, then dispatch A5 + A6b (disjoint files, batchable).
   Then combined smoke -> Fable pre-main branch-diff review -> merge, with
   the SAME choreography on prod first.
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
**Track A is the ACTIVE WAVE (July 7)** — A1 + A4 landed on `catalog-fk-wave`
(`0743070`), A5/A6b queued (see QUEUE.md). Track C (AI coach) stays dead-last.

**State / open items:**
1. **A2 DONE + committed (`48c1e91`):** muscle-weights curation cleaned (3 bad IDs
   fixed: `Incline_Bench_Press` -> `Barbell_Incline_Bench_Press_-_Medium_Grip`,
   dropped `Bulgarian_Split_Squat` + `Pendlay_Row`; 32 -> 30, all keys resolve,
   sums valid). `scripts/validate-catalog.mjs` disk-only validator included.
2. **A1 DONE (`3a6bc25`, July 7)** — the old `exercise-catalog-seed` branch
   (`c27a6de`) is now fully SUPERSEDED (reconciled by hand, migration
   re-timestamped) and deletable (gated op, ask Seth). Its migration was
   NOT still on staging (test resets wiped it; July 6 verification showed
   14 migrations, zero drift) — the July 5-era note claiming staging had it
   was stale. Neither staging nor prod has the catalog table yet; the wave
   choreography in QUEUE.md covers both.
3. **Validator surfaced 29 secondary-less compounds** in the 675-exercise lifting
   subset (mostly ab/isolation, not loaded compounds) — attribution gaps to skim
   during a later curation pass (A3 candidate), not urgent.
4. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.**
   Worth a look before the staging seed runs.
5. **A4 DONE (`0743070`, July 7)** — structural exercise identity (nullable
   exerciseId/userExerciseId FKs) landed on TemplateExercise, SessionExercise,
   BlockWorkoutExercise + blockWorkoutSetId groundwork on WorkoutSet. Neither
   staging nor prod has the migration applied yet — gated on the wave
   choreography in QUEUE.md (A1 migration + seed must land first).

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
