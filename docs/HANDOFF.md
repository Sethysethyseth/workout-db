# HANDOFF — current state

**Updated:** July 6, 2026 (Fable — relay v4: two-tier state channel +
Cursor rebalance. Docs-only session, no app code touched.)** HANDOFF is now
CAPPED: current state, repo/deploy state, the latest 1-2 session entries,
Open TODOs / Next up, and the short reference sections. Everything older
moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (append-only, newest first —
Fable greps it for pre-main review and big-picture work; Sonnet and Cursor
never load it). Workflow changes codified in CLAUDE.md ("v4"), AGENTS.md,
`cursor-task-block-template.md`, and `docs/tasks/` (template + README):
Cursor now self-verifies and writes a `DELIVERY.md` report (repo root,
gitignored) before stopping; Sonnet AUDITS that report against the tree and
re-runs only the cheap lanes fresh (unit + client build — never trusts the
report for green tests) instead of re-deriving the whole delivery; bugs get
a Cursor DIAGNOSIS block first (root cause + evidence + proposed fix, no
code); the direct-fix exception is now stated (when diagnosis was ~95% of
the work and the fix is trivial, the diagnosing agent ships it — everything
else goes to Cursor, however small); non-colliding units may batch two
Cursor blocks per review session. All gates unchanged: single git/state
writer, migration track, pre-main Fable review, "push to main" verbatim.
**Next: unchanged from the entry below** — Seth's smoke of
`/analytics/summary` end-to-end, then the combined
L1+L2+L2B+A6+L6+wheel-fix backlog, then L4 dispatches.
Previous entry retained below for continuity.

**Updated:** July 6, 2026 (Sonnet — L3's CRITICAL SEQUENCING FLAG resolved:
migration applied to STAGING, independently verified.)** Seth applied the
`UserExercise` migration to staging manually per RUNBOOK "Schema-change
deploy" (same precedent as L1). Independently re-verified this session
(verify-before-trust): `npx prisma migrate status` against staging -
Datasource resolved to `ep-bitter-breeze-am81izlh` (confirmed correct
staging host, never `ep-solitary-sea-an56mioq` prod) - "Database schema is
up to date!", 14 migrations, zero drift. Direct `information_schema.columns`
query confirms the `UserExercise` table exists with the exact columns L3
shipped (`id`, `userId` **text** - matching the deliberate String-not-Int
deviation from the block, `name`, `normalizedName`, `muscles` jsonb,
`createdAt`). Staging Render root (`https://workout-db-staging.onrender.com/`)
responds 200 `{"message":"WorkoutDB API running"}` - not crash-looping, so
the feared app-wide `/analytics/summary` 500 (every user, not just
custom-exercise users, per the flag) is no longer live now that the table
exists ahead of/alongside the deploy. **Not independently verified this
session (needs Seth):** the exact deploy SHA in Render's Events tab (should
read `fbb054b` or later - confirm before treating this as fully live), and
an authenticated end-to-end hit on `/analytics/summary` (root health alone
doesn't exercise the `userExercise.findMany` code path the flag was about).
**Next: Seth's smoke** - `/analytics/summary` end-to-end first (the specific
path the flag threatened), then the still-pending combined
L1+L2+L2B+A6+L6+wheel-fix backlog (custom-exercise CRUD has no UI yet - L4
builds that) - then L4 dispatches.
Previous entry retained below for continuity.

**Updated:** July 5, 2026 latest+4 (Sonnet — L3 landed `fbb054b`, pushed to
`origin/logging-ux-wave`. CRITICAL SEQUENCING FLAG, unresolved.)**
Cursor executed `l3-custom-exercises-server.md`; reviewed and committed (12
files, +830/-65). Scope exact match to the block's FILES TO TOUCH. One
deliberate correct deviation from spec: `UserExercise.userId` is `String`,
not the block's stated `Int` - the block's schema snippet was wrong,
`User.id` is `String @default(cuid())`; `Int` would have been a broken FK.
Delivered: `UserExercise` model + migration (hand-authored, matches
existing migration rendering); `GET /api/exercises/muscles` (17-muscle
vocabulary, catalog-derived, not hardcoded); custom-exercise CRUD (POST
rejects catalog/alias-resolvable names and duplicate normalizedNames,
GET/DELETE both userId-scoped, DELETE 404s in the standard
not-found-shape on not-own-or-missing, matching the existing pattern used
across every other controller); `resolveExercise` gained an optional
third `userIndex` arg, catalog+alias still wins on collision, then the
user overlay, `source: "userExercise"` threaded through
`/exercises/resolve`; `userExercises.js` (pure, no Prisma) has
`buildUserExerciseIndex` + `userExerciseWeights` (primary 1.0/secondary
0.5, same fallback convention as `attribution.js`); `enrichSet` gives a
user-exercise resolution a synthetic `catalogEntry.id = user:<id>` so
`aggregateExerciseMetrics`'s existing id-keyed grouping works unmodified;
`analyticsController.getSummary` now also fetches the caller's
`UserExercise` rows and builds the overlay index. Server unit lane
119/119 (new pure tests: weights math, catalog-beats-user precedence,
unresolved-stays-unresolved-with-overlay, a user-exercise set landing
fractional volume in `perMuscle`). Purity grep
(`prisma\|@prisma` under `server/src/analytics/`) - zero hits. Client
untouched, `server/package.json` byte-identical. Integration tests
WRITTEN (custom CRUD happy path, cross-user isolation 404, catalog-name
rejection, resolve endpoint's `userExercise` source, summary
end-to-end volume) but deliberately NOT RUN - `npm test` would
auto-apply the parked migration, exactly the gate the block specified.
**CRITICAL SEQUENCING FLAG (same class as L1's, caught in review before
any further action):** `analyticsController.getSummary` now
unconditionally runs `prisma.userExercise.findMany({ where: { userId } })`
on EVERY summary request, not just when a custom exercise is involved.
Staging Render is repointed to `logging-ux-wave` and auto-deploys on
push - once it redeploys at `fbb054b`, `/analytics/summary` will 500 for
ALL users (not just custom-exercise users) until the `UserExercise`
migration is applied, because the regenerated Prisma client will expect a
table that doesn't exist yet on staging. **Not yet done: apply the
migration to STAGING per RUNBOOK "Schema-change deploy" (confirm
`noisy-surf`/`ep-bitter-breeze-am81izlh` host, same as L1 - never prod)
before or immediately after this redeploys; verify `npx prisma migrate
status` clean afterward, same as the L1 precedent.** Only after that:
Seth's smoke (custom exercise CRUD via API/client is not built yet - L4
is the UI - so this session's smoke is really "does the rest of the app,
especially analytics, still work" - the summary endpoint end-to-end is
the thing to check first) - then L4 dispatches (custom-exercise UI,
builds on this).
Older session entries: moved verbatim to `docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

## Repo / deploy state

- **`main` is at `750c42b`** (fast-forward: `ui-loading-screens` -> `main`,
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

0. **Fix the pre-existing decimal-reps bug**: Reps `<input type="number">`
   in `client/src/pages/SessionDetailPage.jsx` (~line 883) has
   `step="0.01"` (copied from the adjacent Weight field); should be
   `step="1"`. Native spinner/mouse-wheel-scroll on the focused field can
   silently decrement reps into fractions (e.g. 9.98). Predates L1/L2 by
   ~2 months (`9112eda7`); low severity, small fix, not yet done.
0b. **Re-seed the staging smoke account**: `smoke_b8` / `SmokeTest-B8-2026`
   (documented in the July 3 session log below) now 401s — wiped by a
   later `npm test` run resetting staging's DB (expected AGENTS.md
   behavior, easy to forget). Either re-run `scripts/seed-staging-smoke.mjs`
   or document whatever throwaway account replaces it (`smoke_lwave` was
   used ad hoc this session, not seeded with fixture data).
1. **Repoint staging Render/Vercel back to `main`**, verify redeploy SHA is `750c42b` in Events (now includes T3), then smoke-test on prod (5 palettes x dark x Home at minimum, per `docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`, plus the analytics screen, Home weekly-report band, and the T3 loading screens - soft-tone pulsing dots + page-tone breathing ring + label cross-fade).
1b. **Confirm prod Render + Vercel Events both show `750c42b` deployed** (T3 merge) - not yet checked this session; `main` auto-deploys to both.
2. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK -> "Migration history diff"). Unresolved, predates the UI work.
3. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's** for `20260603140000_add_user_username`. Latent hazard — check once, fix if mismatched.
4. Confirm prod Render serving cleanly post-recovery.
5. Low-priority: redundant spare stash on `ui-palettes-v2` (`WIP unrelated to ui-palettes-v2 merge`, July 1) — `git stash drop` once confirmed unneeded.
6. Low-priority: `ui-palettes-v2` and `analytics-engine` branches are both fully merged to `main` now — candidates for deletion whenever Seth wants to ask for that gated op.

## U5 — UI overhaul (T1/T2/T3 MERGED TO MAIN, T4 not started)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE**, **T2 DONE and merged to main** (`ccd0829`, July 1): all 5 palettes (champ, iron, chill, forest, crimson) on real raster scenes; shared pixel-art chrome; fade-mask band generalized to all palettes; dead-zone glow fix; navbar bleed-through fix. 5-palette x dark/Home smoke matrix closed (`docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`); light mode + non-Home routes not covered (unchanged by fixes, lower risk). Card chrome + trimmed Home reviewed against mocks July 1 and kept as-is (deliberate decisions, not gaps). Merge done via temp `git worktree`, not stash+checkout (Windows/OneDrive file-lock hang on `git stash`).
- **T3 DONE and merged to main** (`750c42b`, July 4). T4 (motion) not started; no design work done yet.
- Full T2 fix-by-fix history: see the July 1 morning HANDOFF in git history (`ec3d85a`).

## Next up (the active task)

0a. **L-wave in progress on `logging-ux-wave`** — L2 LANDED (`f66f9ea`),
   L1 LANDED (`4ae0fbf`), its migration applied + verified on staging,
   Render repointed and redeployed at `4ae0fbf`. **Awaiting Seth's smoke
   test of L2+L1 on the staging deploy before dispatching L3** (L3 also
   carries a migration - UserExercise table). Wave order + migration
   choreography in QUEUE.md. Reconcile this branch after the
   ui-nav-overhaul merge (0b).
0b. **N-wave navigation overhaul: REVIEW DONE, CLEARED FOR MERGE** (July 4).
   All four units smoked + passed by Seth; Fable pre-main branch-diff
   review complete with one fix (`3a1a7fc`, pushed to origin). Branch HEAD
   for the merge is `3a1a7fc`. **Waiting only on Seth's "push to main"
   trigger phrase** — then one command at a time per the gate. No
   schema/migration coupling (client + docs only). Note: Seth has NOT
   visually smoked the `3a1a7fc` fix itself (a one-line placeholder gating
   change on /profile) — worth a 10-second look on the branch deploy if
   desired, not blocking.
1. **B9 LANDED (`c7acb43`)** — Cursor implemented, Claude Code reviewed
   (scope exact, all acceptance criteria tested, reviewer tightened the
   inclusive-last-bucket assertion, re-ran unit lane 103/103, purity grep
   clean), committed + pushed. KNOWN WRINKLE recorded for U8: `e1rmTrend.
   first/latest` are raw first/last SET epley while `e1rmSeries` points are
   session maxes — they can disagree; the U8 block therefore requires the
   strength delta chip to derive from `e1rmSeries` endpoints, not
   `e1rmTrend`.
2. **`analytics-engine` MERGED TO MAIN (`e9ce82c`), July 4 (Sonnet).** Track B
   v1 (B1-B9) and the UI polish wave (U6-U10) are both live on `main`. See
   Repo/deploy state above for merge mechanics and the skipped-Fable-review note.
3. Open TODOs #1-6 (Render/Vercel repoint to main + redeploy SHA check comes
   first, then prod verification — manual, browser).
4. Track A (A1 catalog merge, then A4 FK design — now including
   set->BlockWorkoutSet linkage for block-plan execution fidelity) is the
   next engine-adjacent work; with T3 merged (`750c42b`), T4 (motion) is
   the last unstarted U5 unit — but the N-wave (item 0) is the active UI
   track first.
5. U11 "what's new" one-time modal is queued as a candidate (see
   `docs/tasks/QUEUE.md`) — needs a Fable-authored task block before Cursor
   can pick it up.

## Analytics/catalog track — state

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction
rationale: `analytics-engine-direction` memory. Full B1-B9 build history:
`docs/HANDOFF-ARCHIVE.md`.*

**Track B v1 (B1-B9) is code-complete and MERGED TO MAIN (`e9ce82c`, July 4).**
Track A data plumbing (A1 catalog merge -> A4 FK design, now including
set->BlockWorkoutSet linkage) is the next engine-adjacent work. Track C
(AI coach) stays dead-last.

**State / open items:**
1. **A2 DONE + committed (`48c1e91`):** muscle-weights curation cleaned (3 bad IDs
   fixed: `Incline_Bench_Press` -> `Barbell_Incline_Bench_Press_-_Medium_Grip`,
   dropped `Bulgarian_Split_Squat` + `Pendlay_Row`; 32 -> 30, all keys resolve,
   sums valid). `scripts/validate-catalog.mjs` disk-only validator included.
2. **`exercise-catalog-seed` committed (`c27a6de`) but NOT merged to main.** Staging
   DB has the catalog migration; main's code doesn't. Prod has neither — when the
   catalog merges (A1), its migration must be applied to prod per the schema-change
   deploy discipline. Reconcile before FK work (A4).
3. **Validator surfaced 29 secondary-less compounds** in the 675-exercise lifting
   subset (mostly ab/isolation, not loaded compounds) — attribution gaps to skim
   during a later curation pass (A3), not urgent.
4. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.**
   Look before designing the FK unit (A4).

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
