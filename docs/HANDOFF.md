# HANDOFF — current state

**Updated:** July 1, 2026 (late — analytics B4 endpoint + B5 analytics screen built via Cursor, reviewed, committed, pushed)
**Rule:** rewritten in place at the end of every working session. Dated, never versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy state from ground truth before trusting it.

---

## Repo / deploy state

- **`main` is at `ccd0829`** (merge: ui-palettes-v2 -> main, palette scene system + navbar bleed-through fix), confirmed on `origin/main`. Unchanged since the morning merge.
- **Render prod (`workout-db-l3gc`) deploy of `ccd0829` NOT YET VISUALLY CONFIRMED** — Events-tab SHA check and on-device smoke pass still outstanding (see Open TODOs).
- **NEW branch `analytics-engine`** (branched from `ui-palettes-v2` @ `ec3d85a`, pushed to origin). Carries ALL previously-untracked work — **nothing critical rides untracked anymore**:
  - `e4c96be` analytics B1 (resolver + attribution) — NOTE: this commit alone doesn't build; its `index.js` got swept ahead by a concurrent edit (see gotchas). Tree is consistent from `cd72e9c` onward.
  - `48c1e91` vendored catalog + muscle weights (A2) + validator + export script
  - `859595d` master prompt v16 -> v17 (committed as a rename), analytics spec, cursor task-block template
  - `bf24b46` gitignore (export artifacts, `.claude/settings.local.json`), brand asset, mocks -> `docs/design/mocks/`
  - `cd72e9c` analytics B2 (stimulus curve + set metrics + rationale doc)
  - `dfd04ef` jest unit/integration split + `npm run test:unit`
  - `7f044da`/`ce9e199` GitHub Actions CI cheap lane — **first runs green**
  - `7192e2c` analytics B3a (enrichSet composition + weekly per-muscle aggregation)
  - (+ final docs commit: this handoff + CLAUDE/AGENTS consolidation)
- `ui-palettes-v2` (`ec3d85a`) is fully contained in `analytics-engine`; deletable after analytics merges (branch deletion is gated — ask first). Merging `analytics-engine` to main also brings `ec3d85a` (gate-protocol docs commit) along.
- No schema changes on `analytics-engine`, so its eventual merge has no migration coupling. The separate `exercise-catalog-seed` branch (A1) still has its own gated migration track.
- Username feature LIVE and verified on both environments (unchanged).

## Open TODOs (do at next session start)

1. **Confirm Render prod (`workout-db-l3gc`) Events tab shows `ccd0829` deployed**, then smoke-test the merged UI on prod (5 palettes x dark x Home at minimum, per `docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`).
2. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK -> "Migration history diff"). Unresolved, predates the UI work.
3. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's** for `20260603140000_add_user_username`. Latent hazard — check once, fix if mismatched.
4. Confirm prod Render serving cleanly post-recovery.
5. Low-priority: redundant spare stash on `ui-palettes-v2` (`WIP unrelated to ui-palettes-v2 merge`, July 1) — `git stash drop` once confirmed unneeded.

## Session log (July 1 evening — repo hygiene + infra, Claude Code)

- **All untracked critical work committed** onto `analytics-engine` and pushed — closes the "one `git clean` from gone" exposure (master prompt v17, analytics spec, engine code + tests, catalog data, scripts, brand asset).
- **Jest split into `unit` and `integration` projects** (`server/jest.config.js`). `npm run test:unit` runs the pure analytics tests with ZERO DB contact — no `pretest` migrate, no `jest.setup.js` reset (npm pre-hooks are exact-name, so `test:unit` skips `pretest`). `npm test` unchanged (both lanes, staging DB, serialized). This restores the spec's "pure, fixture-tested, no DB" promise, which the old single config silently broke: every test file, including the pure ones, ran `resetDb()` against staging beforeEach.
- **CI cheap lane added** (`.github/workflows/ci.yml`): client build + server unit tests on every push, no secrets, no DB. Integration suite deliberately stays manual/local. First runs green (~34s). Actions pinned at v5 (node-20 runner deprecation).
- **Housekeeping:** export artifacts + `.claude/settings.local.json` gitignored; remaining scene mocks moved `client/src/assets/scenes/` -> `docs/design/mocks/` (references only, never ship from src); `lifter.png` (unused pending brand asset) committed; Claude Code permission allowlist pruned ~50 one-offs -> prefix rules (destructive ops deliberately NOT allowlisted so they always prompt).
- **CLAUDE.md / AGENTS.md consolidated (done last, per instruction):** AGENTS.md is now the single source for shared agent context (conventions, UI architecture, the gate); CLAUDE.md imports it via `@AGENTS.md` and keeps only Claude-Code-specific content. AGENTS.md's "Current state / Next up" sections replaced by a pointer here — **HANDOFF is the only state channel now.** The old gate-sync rule is retired; there is no duplicate to sync.
- **Concurrent-agent note:** a Cursor session executed B2/B3a in the same working tree while this session ran. Its output was reviewed, folded into commits `cd72e9c`/`7192e2c`, and its HANDOFF records are preserved below. See the new gotcha before running two agents on one checkout again.

## U5 — UI overhaul (T1/T2 MERGED TO MAIN, T3/T4 not started)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE**, **T2 DONE and merged to main** (`ccd0829`, July 1): all 5 palettes (champ, iron, chill, forest, crimson) on real raster scenes; shared pixel-art chrome; fade-mask band generalized to all palettes; dead-zone glow fix; navbar bleed-through fix. 5-palette x dark/Home smoke matrix closed (`docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`); light mode + non-Home routes not covered (unchanged by fixes, lower risk). Card chrome + trimmed Home reviewed against mocks July 1 and kept as-is (deliberate decisions, not gaps). Merge done via temp `git worktree`, not stash+checkout (Windows/OneDrive file-lock hang on `git stash`).
- T3 (dynamic loading screens) and T4 (motion) not started; no design work done yet.
- Full T2 fix-by-fix history: see the July 1 morning HANDOFF in git history (`ec3d85a`).

## Next up (the active task)

1. Open TODOs #1-4 (prod verification — manual, browser).
2. **Analytics B4 (`bb05bc5`) and B5 (`e287a29`) DONE + committed** — endpoint live and the Analytics tab is now a real screen. **B5 needs an on-device smoke** (see track section) before it can be called visually done. Seth: a quick personal read of the `findMany` where-clause in `analyticsController.js` is still worthwhile before this branch merges (the isolation test covers it, but it is the one cross-user-leak surface).
3. Decide merge timing for `analytics-engine` -> main (gated: requires "push to main" verbatim).
4. T3 remains the next unstarted UI unit if/when UI resumes.

## Open forks (settle before merge)

1. **Theme storage** — *proposed default:* device-local now (matches existing appearance setting, zero schema change), all reads through one accessor so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — *proposed default:* keep, with a trigger condition: it changes the day a stranger can sign up. One constant either way.

## Analytics/catalog track — ACTIVE (B1-B5 committed, B5 smoke + merge decision next)

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction rationale:
`analytics-engine-direction` memory.*

**Vision (decided July 1, Opus session):** analytics engine = the wedge. Layered
L0 attribution (fractional weighted sets/muscle) -> L1 descriptive -> L2 diagnostic.
Differentiators flow only from data competitors lack: fractional attribution, per-set
RIR/RPE (already in schema), first-class plan snapshot. RIR near-mandatory (onboarding
nudge); **Stimulating Sets** (attribution x proximity-to-failure) is the headline unit.
v1 L2 = Stimulating Sets + matched-effort progression + execution fidelity. Deferred
(need history): personalized volume landmarks, fatigue signalling. AI coach (Track C,
BYO-key experiment then monetized) is dead-LAST, off the critical path.

**Phased roadmap (full detail in the spec, section 9):** Track A = data plumbing
(catalog merge, FK linkage, backfill). Track B = the engine (resolver -> set metrics
-> aggregation -> API -> screen -> progression -> fidelity). Track C = AI, last.

**B1 attribution resolver DONE + committed (`e4c96be`).** Built via Cursor task block,
verified independently (files read, tests re-run, grep confirms zero Prisma references).
`server/src/analytics/{normalize,catalog,resolve,attribution,index}.js` (all CommonJS,
pure, no DB) + `server/test/analytics/{resolve,attribution}.test.js`. Exact-normalized-
name match only (no fuzzy/alias matching — deferred to A6).

**B2 set-level metrics DONE + committed (`cd72e9c`).** Verified independently.
`stimulusCurve.js` (RIR -> multiplier via named `STIMULUS_CURVE` band array at spec
values, null RIR -> null, never guessed), `server/data/stimulus-curve-rationale.md`
(house-style, matches `muscle-weights-rationale.md`; same-commit update rule),
`setMetrics.js` (`estimateOneRepMax` Epley+Brzycki with the reps>=37 Brzycki-
singularity guard, `computeTonnage`, `computeSetMetrics` returning distinct
`effectiveContribution` (always-on) vs `stimulatingContribution` (RIR-weighted,
null when RIR missing) per muscle).

**B3a weekly per-muscle aggregation DONE + committed (`7192e2c`).** Verified
independently (43 unit tests green via the new DB-free lane). `enrichSet.js`
(composes Stages 1-3 into one call: `{ performedAt, resolution, attribution,
metrics }`; imports underlying modules directly to avoid a require cycle through
`./index`), `aggregate.js` (`computeWeeksInRange` + `aggregateMuscleVolume` —
per-muscle `effectiveSets`/`stimulatingSets`/`frequency`/`daysSinceLast` over a
`[from, to]` range, session-deduped by shared `performedAt`, `stimulatingSets` is
`null` not `0` when a muscle has no RIR data at all, `landmarkBand` correctly
deferred).

**B3b per-exercise aggregation + balance ratios + Stage 6 summary object DONE
+ committed (`c954185`).** Built via Cursor task block, verified independently
(files read, `npm run test:unit` + full `npm test`: 11 suites / 84 tests pass,
grep confirms zero Prisma references). Delivered: `aggregate.js` extended with
`aggregateExerciseMetrics` (per-exercise `e1rmTrend` + `bestSet`, grouped by
resolved catalog id only) and `computeBalanceRatios` (`pushPull`/`quadHam` off
`effectiveSets`, null on zero-denominator; `frontRearDelt` always `null` — the
catalog's muscle taxonomy has no front/rear delt split, verified by inspecting
`exercises.json`'s muscle vocabulary, so this is an honest gap not a bug);
`summary.js` (`buildSummary` — the Stage 6 entrypoint: `range`, `perMuscle`,
`perExercise`, `prs: []` (deferred — needs full history beyond the range, a
separate design problem), `balance`, `execution: []`, `meta.rirCoverage` +
`meta.honestyNotes`). Info equivalent to a `resolutionCoverage` % (an earlier
placeholder note above anticipated this as a separate `meta` field) is instead
surfaced as a prose count in `honestyNotes` when nonzero — not added as its own
numeric field; revisit only if the UI needs it as a number.
**Post-Cursor fix (this session):** `bestSet.weight`/`reps` were `null` in
Cursor's delivery (comment cited "floating-point noise" from reconstructing
them) — actually exactly recoverable via `weight = epley - tonnage/30`, `reps =
tonnage / weight` (algebraic inverse of the formulas that produced them, both
already present on the enriched set), so fixed directly in `aggregate.js` with
a new test assertion; `rir` correctly stays `null` (genuinely unrecoverable,
lossy stimulus-curve mapping). Also committed separately (`98b897e`): the
Fable brain/hands division-of-labor doc update (CLAUDE.md/AGENTS.md/
cursor-task-block-template.md) that had been left uncommitted from the prior
session - Claude Code owns git+state, Cursor stops after tests green, plus
the new unit-scale task-block variant. Both commits pushed to origin
(`analytics-engine`).

**B4 `GET /api/analytics/summary` endpoint DONE + committed (`bb05bc5`).**
Built via Cursor task block (unit-scale), reviewed independently (all four
files read against the spec, both test lanes re-run by the reviewer: unit
55/55 DB-free, full suite 89/89 across 12 suites; engine purity re-verified —
zero Prisma under `server/src/analytics/`). Delivered:
`server/src/controllers/analyticsController.js` (getSummary — from/to
required + validated with descriptive 400s, date-only `to` treated as
inclusive end-of-day `T23:59:59.999Z`, `workoutSession.findMany` scoped to
`{ userId, performedAt: { gte, lte } }` — the single cross-user-isolation
point; sets reach the engine only through user-owned sessions; exerciseName
from sessionExercise ?? templateExercise, `exerciseId` always null until A4,
nulls passed through unfiltered per the engine's degradation contract),
`server/src/routes/analyticsRoutes.js` (one route behind `authRequired`),
mounted at `/analytics` in `routes/index.js`,
`server/test/analytics.integration.test.js` (5 tests: 401 unauth, four 400
cases, cross-user isolation with a non-vacuous sanity check that user B sees
their own data, happy path with exact Epley e1rm + chest effectiveSets +
rirCoverage 1, inclusive date-only `to` at 18:00 on the boundary day).

**B5 analytics screen UI DONE + committed (`e287a29`).** Built via Cursor
task block (unit-scale), reviewed independently (all six files read against
the block, client `npm run build` re-run green, server unit lane re-run
55/55, every referenced CSS token/class grep-verified to exist). Delivered:
`client/src/api/analyticsApi.js` (getSummary via shared `http`),
`client/src/pages/AnalyticsPage.jsx` (SessionsPage pattern; 4/8/12-week
preset chips, date-only from/to with stale-response guard; four card
sections — per-muscle table with "log RIR to unlock" degradation state,
per-exercise best-set/e1RM/trend with null guards, balance ratios with the
Front:Rear delt row visibly "not available" per the honesty contract, data
quality with rirCoverage % + verbatim honestyNotes; single empty-state card
when both tables are empty), `HowCalculatedButton.jsx` (MetricInfoButton
portal-popover pattern copied, props-driven `{title, copy}`, reuses
`metric-info-*` classes so scene-layer stacking is already handled;
MetricInfoButton itself untouched), `/analytics` route + Navbar tab enabled
(same liveSessionGuard pattern as History), tokens-only CSS (chips derive
active/hover/focus from `--color-interactive` via color-mix; v1 is
deliberately chart-free — numbers + degradation states, no viz deps).

**B5 OUTSTANDING: on-device smoke NOT done** (no browser in either agent
lane this session). Before calling B5 visually done: /analytics with real
logged data — sections render, chip refetch works, RIR-unlock state shows,
honestyNotes verbatim, nav tab active state — across the 4 palettes in dark
mode minimum. Build-passing + diff-looking-right do NOT prove the visual.

**NEXT UNIT -> B6: matched-effort progression (L2)** (spec sections 1-2, 9)
— engine-side, pure functions + fixtures again (back to the DB-free lane),
plus wiring into `buildSummary`/`perExercise.matchedEffortTrend`. B4/B5
closed the endpoint+screen loop, so B6's output lands on a live surface;
alternatively pause Track B here and settle the merge decision (see below).
Sonnet-appropriate; escalate to Opus only for A1 (prod migration), A4 (FK
schema design), and Track C productization security.

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
