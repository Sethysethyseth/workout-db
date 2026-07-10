# HANDOFF — current state

**Updated:** July 10, 2026, fifth session (Sonnet — N6 LANDED
`28efeba`, the LAST N-wave unit: Cursor's delivery audited, committed +
pushed to `origin/analytics-rebalance-wave` (`5778bae..28efeba`). Unit
lane 167/167 (tripwire, no server touch) + client build re-run fresh;
scope exact (4 files, matches FILES TO TOUCH). Page empty state now
splits new-user (all-time index empty -> warm copy + "Log your first
workout" CTA) from data-exists-but-not-in-range (range chips as the
implied action), verified by direct read of the `isNewUser` gate; range
choice (2/4/8/12 weeks) now persists via `analyticsRangePref.js`,
confirmed byte-for-byte the `weightUnitPref.js` accessor pattern; Top
set / Top gain KPI tiles link to `?view=exercises&exercise=...`, volume
headline links to `?view=muscles`, empty-data tiles confirmed staying
plain (non-link) divs; `.stat-tile--link` >=44px with focus-visible +
color-mix hover, no hex in CSS diff. No deviations. **The N-wave
(analytics UI rebalance) is now CODE-COMPLETE on
`analytics-rebalance-wave` — N1/N5/N2/N4/N7/N3/N6 all landed. Next:
the wave's pre-main Fable review of the full branch diff (grep
`HANDOFF-ARCHIVE.md` for the full session history first), then Seth's
"push to main" trigger.** Visual smoke of N3/N6 together (exercises tab
+ new empty states + tile tap-through) still owed to Seth on staging —
repoint check below still applies before that smoke.

**Seth's note this session (not yet actioned — no task block written):**
the What's New modal/page currently has NO environment gate (`WhatsNewGate.jsx`
shows to any logged-in user regardless of host) - Seth wants it PROD-ONLY,
never on staging. Content-authoring process (prepend an entry to
`client/src/data/whatsNew.js`, the token-efficient data-file-edit pattern
already in use) is fine as-is and should continue. Standing copy
requirement for future releases: keep it non-technical and straight to
the point (no implementation jargon, no internal metric names - user-facing
outcomes only). Worth a small task block (env check in `WhatsNewGate.jsx` -
likely `import.meta.env.MODE` or a prod-hostname check, same family as
`dbHostGuard`'s prod/staging split) whenever Seth wants it queued; not
part of the N-wave.

Previous entry (July 10, third session, Fable — N4 LANDED `4f37361`
AND N7 LANDED `d1b2871`, both Fable-direct in the main working tree, no
worktree needed since Cursor is idle. **N4:** strength tab reframed
progression-first — table columns Exercise | Top set | Top-set trend |
Matched effort, e1RM columns + HOW_BEST_E1RM removed, footer link
"Estimated 1RM has its own view →" targets `?view=exercises` (muscles
fallback until N3, by design — now landed); sparklines re-anchored to
whole-number top-set weights via N2's `topSetSeries`, marks per the
signed July 9 mock (re-fetched and checked against its actual source:
2px accent line, 10% wash, single ringed 9px end dot, no intermediate
dots, 40px plot, bare-number endpoint labels, delta chip "+20 lbs ·
top set 245 × 3"). Unit lane 162/162 + build fresh, scope exact 3
files, e1rm grep clean, no hex. **N7:** Trend view replaced by the
binned 4-step volume heatmap; engine series bucketing parametrized
week|day (granularity derives from range, <= 14 days -> day cells;
series keys now periodStart/periodEnd; meta.seriesGranularity added);
2-weeks range chip added and rangeForWeeks fixed to span exactly N*7
calendar days inclusive (kills a latent 5th-bucket artifact); volume
table de-noised (right-aligned tabular-nums, em-dash + one footnote,
"3d" recency with warn tint at >= 14d, ? buttons out of headers); ramp
validated with the dataviz ordinal checks for all TEN palette x mode
combos — iron light anchors toward text ink (accent-vs-surface can
never clear 2:1 there), everything else on shared per-mode P constants
(light 51/66/81/100, dark 40/60/80/100). Unit lane 167/167 (5 new
fixtures, both bucket modes) + build fresh. Full evidence per unit in
QUEUE.md. Seth's on-device smoke still owed for N4/N7/N3 together.)

- **Wave loose ends still open:** staging Render must be REPOINTED from
  `main` to `analytics-rebalance-wave` before Seth smokes any
  server-touching unit (N1/N2 carry engine tails). Smoke account was
  re-seeded July 10 (TODO 0b done).
Previous entries (incl. the July 10 Fable N-wave skeleton session, the
July 9 spec-complete session and the July 8 A-wave prod rollout)
archived verbatim in `docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

## Repo / deploy state

- **A-wave MERGED to `main` (`13a1e59`), July 8.** `catalog-fk-wave`
  (`13a1e59`) — A1 + A4 + A5 + A6b + the `0e6f32a` db-host-guard split — is now
  fully contained in `main`; prod DB migrated + seeded + smoked. Branch is a
  deletion candidate (gated). Pre-main review was DONE and clean.
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
- **`main` is at `13a1e59` (July 8 Opus)** — A-wave merged (clean ff
  `3767840..13a1e59`, `origin/main` confirmed). Prod DB fully migrated +
  seeded + smoked BEFORE the merge (both catalog/FK migrations applied by
  hand, 873 rows seeded, 16-row ledger drift-free). Prod Vercel/Render track
  `main` and auto-deployed `13a1e59` on push — Seth smoked prod live and
  confirmed working. `catalog-fk-wave` (`13a1e59`) is now fully contained in
  `main` and is a deletion candidate (gated op).
- **`main` was at `3767840` (July 6 Opus)** — T3B basic cold-start
  lifter loader, clean ff from `logging-ux-wave` (`451a3d6..3767840`). Client
  CSS + docs only, no migration/schema/server.
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
0b. ~~Re-seed the staging smoke account~~ **DONE July 10 (Sonnet)**:
   `scripts/seed-staging-smoke.mjs` re-run clean against staging (HTTP
   API only, no direct DB conn) — `smoke_b8` / `SmokeTest-B8-2026`, 8
   weeks Upper A/Lower/Upper B, template-linked execution rows for
   weeks 6-8. Verified live: 12 muscles, 11 exercises, execution rows
   4, bench matchedEffort trend present. Note: the script's own
   verification log reads `s.meta.rirCoverage`, which was renamed to
   `effortCoverage` (B8 pooling) — stale log line only, seed itself is
   correct; not fixed, out of scope.
1. ~~Prod smoke of the L-wave on `main`~~ **DONE — confirmed by Seth July
   7**, no issues reported.
2. ~~**Diff `_prisma_migrations` prod vs staging**~~ **DONE July 8** — prod
   ledger = 16 rows, no drift, shared-name checksums match staging.
3. ~~**Verify the prod `20260603140000_add_user_username` checksum**~~ **DONE
   July 8** — prod's `1c7d13f7…4b9502f` matches the canonical LF-normalized
   file hash exactly. No mismatch.
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

0. **N-WAVE CODE-COMPLETE** (blocks authored July 10, QUEUE.md is the
   index): N1, N5, N2, N4, N7, N3, N6 all LANDED - no units left to
   dispatch. **Next: the wave's pre-main Fable review of the whole
   branch diff, then Seth's "push to main" trigger.** Repoint staging
   Render to `analytics-rebalance-wave` before Seth's first smoke
   (N1/N2/N7/N3 all carry engine tails — the heatmap needs the new
   series shape from the API and the exercises tab needs N5's
   endpoints, so the repoint is REQUIRED before smoking either).
0b. **A-wave follow-up (non-urgent):** optional Step-7 historical backfill:
   `node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply`
   against prod for pre-A4 historical rows (Seth runs the write).
   Idempotent; safe to defer — historical rows carry valid NULL identity
   until then.
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
