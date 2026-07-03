# HANDOFF — current state

**Updated:** July 3, 2026 (analytics UI critique session — Seth reviewed the B8 chart layout, five-point polish wave agreed, B9 engine task block QUEUED, merge to main PENDING Seth's trigger phrase)
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

## Session log (July 3 — analytics polish wave planned, Claude Code)

- **Seth critiqued the B8 analytics screen; five-point polish wave agreed:**
  1. KPI tiles evolve into a "weekly report" — DECIDED: it lives on the HOME
     screen (DashboardPage, under the StartWorkoutHero) as a last-7-days vs
     prior-7-days delta band, so users see stats on login. Range chips keep
     governing only the analytics deep-dive cards.
  2. Volume by muscle: add a time view — extend the Chart|Table toggle to
     Bars|Trend|Table (per-muscle weekly sparklines/small multiples).
  3. Strength trends: replace/augment the first-vs-latest dumbbell with
     per-session e1RM sparklines; the existing Table view stays as the
     raw-data screen.
  4. Execution: comprehension rework — lead with the CONCRETE comparison
     ("Planned 3x8 @ 100 -> Did 2x8 @ 95") + a deterministic plain-language
     verdict line; percentages demoted to annotations; "sandbagging/
     overreaching" demoted to secondary flavor.
  5. Balance: diverging scale with colored deviation fill + shaded
     "balanced zone" band (~0.8-1.3), ghost tracks on degraded rows.
  Seth will critique each visually after it ships (2-5 are "show me" items).
- **Root cause identified:** 1-3 all need TIME SERIES the engine collapses
  away. One engine unit unlocks all three: **B9 task block authored + QUEUED**
  (`docs/tasks/b9-analytics-time-series.md`) — weekly per-muscle volume
  series, per-session e1RM series, execution planned/actual concrete
  summaries. Additive, engine-only, no schema/controller change. UI wave
  U7 (Home weekly report) / U8 (trend view + sparklines) / U9 (execution
  rework + balance polish) listed as QUEUE candidates; U8/U9 blocks get
  authored after B9 lands (they consume its payload shape).
- **Merge to main: DEFERRED by Seth — "i dont think i want to push the
  analytics to main until the visuals are locked in."** The B9/U7-U9 polish
  wave continues on `analytics-engine`; the merge happens after Seth signs
  off on the visuals (still gated on "push to main" verbatim). Pre-merge
  items still open: Seth's personal read of the `analyticsController.js`
  findMany where-clause, and the two open forks below.
- QUEUE.md refreshed: B8 (`00c67dc`) and U6 (`d4b1d72`) moved to Landed.
- Stray smoke screenshots tidied into `docs/smoke-tests/images/`
  (analytics-b8-u6-lbs-default + two smoke-b8 login-error shots) and
  committed.

## Session log (July 2 late — task-queue pilot scaffolding, Claude Code)

- **File-dispatched task queue created (`docs/tasks/`):** README (protocol:
  author -> dispatch-by-pointer-line -> execute -> review/land; Mode 1
  serialized relay first, Mode 2 parallel worktrees after ~3 clean units),
  QUEUE.md (status index, single writer = Claude Code), _TEMPLATE.md
  (unit-scale block with standing no-git/no-state footer + MODEL/MODE
  headers). Replaces chat-pasting task blocks into Cursor; Seth dispatches
  with one pointer line.
- **RUNBOOK section 8 added:** parallel worktree ritual (worktrees under
  `C:\dev\worktrees\`, outside OneDrive; create/review/land/cleanup).
  Old section 8 (safety invariants) renumbered to 9.
- **`docs/specs/poor-mans-agentic-workflow.md` created:** tracking doc for a
  FUTURE public repo (Seth's idea: "$40/mo agentic workflow" - Claude Pro +
  Cursor Pro vs Claude Max). Not publishing yet; append to its log whenever
  the workflow changes so the public repo can be extracted later.
- No task blocks authored yet - next real Cursor-suited units (A5/A6) are
  blocked on A4 FK design; QUEUE.md lists candidates.

## Session log (July 2 evening — B6 built + smoked, Claude Code solo, autonomous)

- **B6 matched-effort progression DONE + committed (`94a1fbf`), pushed, on-device smoked.**
  Details in the track section below. Built directly by Claude Code (not via
  Cursor) under an explicit one-night inversion of the brain/hands split:
  Seth was out, Claude Code tokens were expiring, and running both agents
  unattended on one tree is the known race. The standing division of labor is
  UNCHANGED going forward.
- **Permissions overhaul in `.claude/settings.local.json`:** broad allow rules
  for tonight's lanes (npm/npx/node in PowerShell, curl, more Playwright MCP
  tools, read-only PS cmdlets) PLUS a new `ask` array that force-prompts the
  gate items (git reset/clean/force-push/branch-delete, push to main, merge,
  npm install, prisma migrate). The `ask` list matters beyond tonight: the
  pre-existing `PowerShell(git *)` allow silently covered `git reset --hard`
  etc.; `ask` overrides `allow`, so the gate is now enforced by config, not
  just convention.
- **Staging DB was reset** by tonight's full `npm test` run (expected pretest
  behavior, but easy to forget): the old `smoke-b5` account is GONE. New smoke
  account: `smoke-b6` / `SmokeTest-B6-2026` (email `smoke-b6@example.com`),
  3 completed backdated sessions (Jun 15/22/29) whose data exercises every
  analytics state — bench @ RIR 2 across 3 sessions (matched-effort populated,
  and its plain e1RM trend is deliberately NEGATIVE from a backoff set, the
  honest-vs-dishonest contrast on one row), lat pulldown with no RIR (unlock
  states), rirCoverage 63%.
  **SUPERSEDED (July 3):** `smoke-b6` gone in a later reset. Current smoke
  account: username `smoke_b8` (UNDERSCORE, not hyphen - Cursor created the
  account first and usernames are immutable) / `SmokeTest-B8-2026` (email
  `smoke-b8@example.com`, which also works as the login),
  seeded via the new `scripts/seed-staging-smoke.mjs` (HTTP-only, idempotent,
  re-run after any staging reset): 24 sessions over 8 weeks, 12 muscles / 11
  exercises, matched-effort +39.9, 4 execution rows (template-linked), RIR
  gaps for the honesty states, push:pull 1.01 / quad:ham 0.86.
- **Dev-stack gotcha confirmed:** the long-running nodemon (started Jul 1) did
  NOT pick up the B6 engine changes — OneDrive file-watch flakiness. The
  /analytics endpoint silently served pre-B6 responses (no matchedEffortTrend)
  until the server process was killed and restarted. If a diff looks right but
  the API disagrees, restart the dev server before debugging the code.
- Prisma `generate` also hit the OneDrive/Windows EPERM dll-rename lock (held
  by the running server); worked around by running jest directly — schema is
  unchanged so generate was a no-op requirement. Another point for the
  "move the repo out of OneDrive" issue.

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

1. **Dispatch B9** (`docs/tasks/b9-analytics-time-series.md`, QUEUED) to
   Cursor on `analytics-engine`. Then review/land, then author U7-U9 (see
   July 3 session log for the five-point polish wave). Seth critiques each
   UI unit visually as it ships.
2. **Merge `analytics-engine` -> main DEFERRED until the visuals are locked
   in** (Seth, July 3). When ready: "push to main" verbatim, then
   one-command-at-a-time with approval. Pre-merge: Seth's personal read of
   the `findMany` where-clause + plan-side include in
   `analyticsController.js` (the one cross-user-leak surface), and settle
   the two open forks below.
3. Open TODOs #1-4 (prod verification — manual, browser).
4. Track A (A1 catalog merge, then A4 FK design — now including
   set->BlockWorkoutSet linkage for block-plan execution fidelity) is the
   next engine-adjacent work; T3 remains the next unstarted UI unit if/when
   UI resumes.

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

**B5 on-device smoke DONE (July 2, Playwright via Claude Code):** /analytics
with real logged data — all four card sections render, chip refetch works
(4wk -> 8wk recomputes), per-muscle RIR-unlock state shows, honestyNotes
verbatim, nav tab active state, HowCalculated portal popover renders above
the scene layer — across all 4 palettes in dark mode (champ/iron/forest/
crimson full-page screenshots reviewed). Light mode not covered (matches the
T2 smoke scope). B5 is visually done.

**B6 matched-effort progression DONE + committed (`94a1fbf`) + smoked.**
Implemented directly by Claude Code (see July 2 session log for why).
Delivered: `server/src/analytics/matchedEffort.js` —
`computeMatchedEffortTrend(enrichedSets)`: buckets a resolved exercise's sets
by EXACT integer RIR (no banding in v1), session-dedupes by shared
`performedAt` (max epley = the session's representative), requires
`MIN_MATCHED_SESSIONS = 2`, picks the bucket with most distinct sessions
(tie-break: LOWER RIR — closer to failure, where e1RM is most accurate),
returns `{ rir, sessions, first, latest, best, delta }` (epley, unrounded)
or null. `enrichSet.js` now carries `input: { weight, reps, rir }` through,
which let `aggregate.js` drop the algebraic bestSet reconstruction AND make
`bestSet.rir` real (was hardcoded null as "unrecoverable" — now recovered
from input). Wired into `aggregateExerciseMetrics` -> flows through
`buildSummary` untouched (no Date fields). UI: "Matched effort" column in
the per-exercise table, `+X.X kg @ N RIR · M sessions` populated state,
"log RIR across 2+ sessions" unlock state, HowCalculated copy. Tests: 12 new
(unit lane 55 -> 67; full suite 89 -> 101, all green); engine purity
re-verified (zero prisma under `server/src/analytics/`). Smoke: live
endpoint + UI verified against seeded staging data; the seeded bench row
shows e1RM trend -12.7 kg next to matched effort +6.3 kg — the exact
dishonesty the metric exists to fix, visible on one row.

**B7 execution fidelity Mechanism A DONE + committed (`9cfe7f0`) + smoked.**
Implemented directly by Claude Code (same inverted-split session as B6).
Delivered: `server/src/analytics/planVsActual.js` —
`computeExecutionFidelity(enrichedSets, planLookup)`: pairs actual sets with
TemplateSet plans ORDER-WISE within each (session, templateExercise) group;
`loadAdherence` = mean(actual/planned weight), `volumeAdherence` =
actual/planned set counts (extra sets raise it, skipped sets lower it),
`effortDrift` = mean(actual RIR - planned RIR, positive = sandbagging);
each null when no pair carries its data; resolved template-linked sets only.
**Design finding baked in: the schema has NO path from a WorkoutSet to a
BlockWorkoutSet** — block plans can't join and are an honest gap stated in
the UI how-calculated copy (frontRearDelt pattern), NOT silently
approximated. Fixing that needs a schema change (fold into A4 FK design).
`enrichSet.input` gained `order` + `templateExerciseId`;
`buildSummary(sets, { from, to, planLookup })` fills `execution` (still `[]`
without planLookup). Controller now includes `templateSets` through BOTH
linkage paths (set.templateExercise and set.sessionExercise.
templateExercise — template-started sessions link sets via the latter) and
builds the planLookup; isolation unchanged (plan data reached only through
user-owned sessions). UI: new Execution card (Load %, Volume %, Effort
drift +N RIR sandbagging / -N RIR overreaching / on target), unlock state
when nothing plan-linked. Tests: 10 new — pairing, drift signs, volume
over/under, null degradations, exclusions, wiring, plus an integration test
driving the real template -> startSession -> log -> summary flow (unit lane
76, full suite 111, all green). Smoked: seeded template session (plan 3x100
@2, actual 2x95 @3) renders 95% / 67% / +1 RIR sandbagging in champ dark.

**TRACK B v1 IS CODE-COMPLETE (B1-B7).** What remains before calling the
analytics wedge shipped: the merge decision (below), Seth's personal read of
the `findMany` where-clause, then Track A data plumbing (A1 catalog merge ->
A4 FK linkage — add set->BlockWorkoutSet linkage to the A4 design — -> A5
picker -> A6 backfill) to make resolution robust for real accounts, and the
standing product asks (charts after algorithms; they're now landed). Track C
(AI coach) stays dead-last. Back to the normal relay (Cursor implements)
unless Seth says otherwise.

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
