# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

FP-wave (frontier parity), opened July 18 (Fable), branch
`frontier-parity-wave` (off maintenance-wave HEAD `0206d30` = main
`3b325db` + two post-merge docs commits). Source: the July 17 product
review (hands-on staging drive + Cursor competitor research). Direction
calls made by Fable July 18 and baked into FP0 - the report grounds
them. Seth APPROVED the critiques July 18 and added two insights, both
designed same session: the active-exercise lens (FP3, from his
strength-view screenshot - single-session rows bury the real trends)
and gym-context analytics (spec'd, next wave - see below).

**FABLE HANDOVER (Fable unavailable after July 18 - Opus runs
everything from here; no unit below needs another Fable pass):**
- Wave order (Seth's rider: icons LAST, his intervention needed):
  FP1+FP2 back-to-back (file-disjoint), then FP3 -> FP4 (share
  AnalyticsPage/ExercisesView/index.css - serialize; FP2/FP3 share
  index.css - serialize too), then FP5, then FP6 (needs FP2 AND FP5
  landed), then FP8 (DRAFT until Seth's PNGs land in claudefiledrop/;
  an authoring session may first emit docs/design/logchamp-icon.svg
  for him to export from).
- R6 tagline: Seth has NOT picked - one-line AuthLayout.jsx swap
  whenever he does; keep out of every block until then.
- R9/per-side + Strength Score: design DONE in
  docs/specs/strength-score-per-side.md - Opus authors SS1/SS2/SS3
  from it after the FP core lands.
- Gym context (Seth's location insight): design DONE in
  docs/specs/gym-context.md - Opus authors G1/G2/G3 from it; G1 is
  MIGRATION-CARRYING (Seth's manual track, non-autonomous gate).
- Wave end for this wave (July 20 rule): at N/N the relay STOPS and
  hands Seth the consolidated smoke checklist. FP9-FP11 landed the
  wave to 3/3 July 21; **Seth SIGNED OFF on smoke same session**
  ("smoke test is passed, this looks much better") - no open findings.
- Pre-main gate for this wave: Opus runs it now that sign-off has
  landed, ritual = the `pre-main-review` skill; grep HANDOFF-ARCHIVE per
  that ritual (thirtieth/thirty-first session entry has the FP9-FP11
  arc in full), and fan gate fuel out to Cursor report lanes, not
  subagents. THIS IS THE IMMEDIATE NEXT STEP - nothing is blocking it.

LANDED 8dc799f | fp1-rebrand-copy-polish.md | title -> LogChamp, two
  HelloPage WorkoutDB strings, never-gate-history guarantee line
  ("Your history stays yours - every set, no time limit.") | MODEL
  auto -> Channel B auto rung, dispatched + landed July 18 (Fable).
  Audited per land-unit: scope exact (2 files), full diff read (three
  string swaps + one muted line in the existing HelloPage inline-style
  idiom), lanes fresh in lane (build green 129 modules, unit 170/170),
  check-hex clean, WorkoutDB grep clean in client (README-only hits,
  not rendered). No deviations. Lane rebased onto a115f35 then
  ff-merged. SMOKE: tab title reads LogChamp; HelloPage welcome +
  save-to-home-screen lines say LogChamp; guarantee line renders
LANDED 056be0c | fp2-home-strip-coherence.md | buildSummary.workoutCount
  (one ledger for the This-week strip, kills the completedAt/
  performedAt dual-clock incoherence) + vertical 3-row recent workouts
  | MODEL auto -> Channel B auto rung, dispatched July 18 (Fable),
  landed July 19 (resident session). Audited per land-unit: scope
  exact (5 files, index.js untouched - buildSummary already
  re-exported), lanes fresh in lane (unit 171/171 incl. the new
  workoutCount fixture, build green 129 modules, check-hex clean),
  acceptance greps verified directly (countWorkoutsInWindow zero refs;
  no overflow-x/scroll-snap/line-clamp on recent classes; sub-card
  idiom matches SessionsPage; View all kept). ONE declared deviation,
  ACCEPTED: enriched sets carry no sessionId, so workoutCount keys on
  distinct in-range performedAt.getTime() - same session key the
  engine's per-session aggregates already use; commented in code.
  Lane rebased onto 05f893a then ff-merged. SMOKE: This-week Workouts
  tile now agrees with Sets/Top-set windows (a session with zero
  countable sets shows 0 workouts - intended); recent workouts render
  as 3 vertical full-width rows, titles wrap, View all works.
LANDED 3de1749 | fp3-active-exercise-lens.md | strength list sorts noteworthy
  first + collapses single-session rows; roster gains Active|All
  segmented lens (ACTIVE_WINDOW_WEEKS=8), history never hidden for good
  | MODEL auto -> Channel B auto rung. Dispatched + landed July 19
  (resident session). BOUNCE 1 (July 19): first delivery partitioned
  only the TABLE view; the default CHART view (StrengthTrendChart
  sparkline rows - the surface in Seth's screenshot, where a
  single-session row got delta=0 and sorted ABOVE negative trends) was
  left unpartitioned and undeclared - automatic bounce per land-unit.
  Bounce fix audited clean: shared partition + one showSingles state
  drives both views, StrengthTrendChart's internal raw-topSet-delta
  sort REMOVED (caller order wins; DeltaChip display-only), row JSX
  extraction verified verbatim, StrengthTrendChart.jsx touched OUTSIDE
  original FILES TO TOUCH by reviewer direction (bounce findings named
  it - declared this time). Lanes fresh in lane post-fix: unit 171/171,
  build green, check-hex clean; ACTIVE_WINDOW_WEEKS single definition
  verified; detail deep-link independence verified by direct read.
  Lane rebased onto 3eae347 then ff-merged. SMOKE: Strength chart
  (default) and table both show noteworthy-first order with a muted
  "N exercises with a single session" Show/Hide line; Exercises roster
  defaults Active with All one tap away; a deep link to a dormant
  exercise still opens its detail under the Active lens.
LANDED d6180cf | fp4-empty-state-ghosts.md | static tokens-only ghost previews +
  honesty-voice unlock lines on all four empty analytics surfaces |
  MODEL auto (design fully specified) -> Channel B auto rung.
  Dispatched July 19 by one resident session that stepped out with the
  run in flight; a SECOND July 19 resident session picked the delivery
  up out of the lane worktree and landed it (relay handover worked as
  written). Audited per land-unit: scope exact (5 files, all inside
  FILES TO TOUCH - the two existing components touched,
  StrengthTrendChart + ExercisesView, own the in-section empty states
  the block names as surfaces 2 and 3, and both were declared), lanes
  fresh in lane (unit 171/171 in 14 suites, build green 130 modules,
  check-hex clean). Verified by direct read: every ghost root carries
  aria-hidden + pointer-events:none and the new component file has zero
  onClick/button/Link/<a>; CSS diff has no animation/transition/
  @keyframes and no raw color (all color-mix over --color-interactive /
  --color-border / --color-surface-2 / --chart-track); every class and
  token the ghosts lean on pre-exists and behaves (.analytics-unlock
  :5654, --chart-track :5682, .mv-track IS position:relative :5970 so
  the absolute ghost bar anchors, .balance-scale--ghost :6397,
  .st-row/.exec-row are plain grids so the reuse cannot conflict);
  AnalyticsViewTabs prop contract matches its definition (value/
  onChange). TWO DECLARED DEVIATIONS, both ACCEPTED: (1) view tabs now
  render on the page-empty branch (N6 hid them) - not cosmetic but
  REQUIRED by the contract, since four per-view teases are unreachable
  without a URL edit otherwise; the exercises tab still routes to
  ExercisesView's own empty branch via the existing
  `isEmpty && view !== "exercises"` condition, so nothing dead-ends.
  (2) exercises empty copy split into title + unlock line so the ghost
  sits between them - exactly the block's "keep/tighten ... above the
  ghosts" ask. Lane rebased onto 9fcd547 then ff-merged. SMOKE: with a
  range that has no sets, Muscles shows 4 stepped ghost bars + the
  ghost balance track + "Log 3 workouts and this becomes your volume
  trend."; the tabs above it switch to Strength (sparkline silhouette +
  2 row skeletons) and Execution (one plan-vs-actual ghost row) without
  a URL edit; a brand-new account's Exercises tab shows 3 ghost roster
  rows between "No exercises logged yet." and the unlock line with the
  Log CTA intact; ghosts read as muted furniture in all 4 palettes x
  light/dark, never as real data, and nothing in them is tappable
LANDED 9eb7e8d | fp5-pr-detection.md | pure prs.js detector (weight/
  reps-at-weight/e1RM, first-session suppression) + summary.prs stub
  filled + exerciseDetail standing records + PR card + quiet completed-
  view chip | MODEL opus -> Channel B NAMED rung (judgment tier, no
  descent - first named-rung dispatch of the wave). Dispatched July 19
  (second resident session), lane branch cursor/fp5-pr-detection off
  04ce6bf in C:\dev\worktrees\cursor-lane; serialization gate satisfied
  (FP2 summary.js landed 056be0c, FP4 ExercisesView landed d6180cf).
  **BOUNCE 1 FIX re-dispatched and LANDED July 19 (third resident
  session), same lane, same branch, engine half untouched.** Cursor's
  bounce-fix delivery threaded `setHasPR` through as a real prop (F1)
  and re-keyed the chip match to include `exerciseName` (F2 partial) -
  lanes fresh in lane (195/195 in 15 suites, build green, check-hex
  clean) - but its OWN evidence for F1 was inadequate exactly as
  warned against ("Vite/esbuild catch undefined variable references at
  bundle time" is false for plain JS; no render test, no browser
  drive, verification punted to Seth as manual steps), so the reviewer
  did not trust it and drove the completed view live instead: spun up
  the server against the staging DB + client in the lane worktree
  (`server/.env` copied in for the run, deleted after), registered a
  throwaway test account, built a two-session fixture via direct API
  calls (session A baseline Bench 135x5 + Curl 200x5 completed; session
  B Bench 145x5 = real weight+e1rm PR, Curl 145x5 sharing the exact
  weight/reps but NOT a PR for curl) and loaded the completed session B
  in a real browser. Found TWO more defects live: (1) F2 as literally
  built matched by `exerciseName` alone, not identity - the block's
  explicit instruction - which the reviewer fixed directly (trivia
  tier): added `prMatchKey(exerciseId, userExerciseId, exerciseName)`
  keying on `se.exerciseId`/`se.userExerciseId` (confirmed present on
  the full session-exercise row) with a name fallback, matching
  `pr.identity` from `summary.js`'s `identityFromKey`; (2) NEW,
  undeclared, found only by driving the browser - the chip could NEVER
  render at all: `setHasPR`'s date-scoping compared
  `session.performedAt` to each PR's `performedAt` for EXACT
  millisecond equality, but `session.performedAt` reflects the most
  recently written set's timestamp, not any specific PR set's - so the
  check was always false. Fixed by dropping it entirely (trivia tier):
  the summary fetch's own from/to window already scopes PRs to the
  session's calendar day, so no extra date check was needed. Re-verified
  live after both reviewer fixes: exactly one PR chip rendered, correctly
  attributed to Bench Press, NOT Bicep Curl, zero console errors. Lanes
  re-run fresh once more post-fix (195/195, build green, check-hex
  clean). Verification servers torn down, copied `.env` deleted, no
  writes to prod (staging Neon `ep-bitter-breeze-am81izlh` only, via the
  main tree's existing `.env`). Lane rebased onto d1cd3fb then ff-merged
  `9eb7e8d`, pushed, origin HEAD confirmed. Engine half unchanged from
  BOUNCE 1's audit (still accepted: prs.js 24 fixtures, index.js
  re-export, summary.js stub fill, exerciseDetail.js personalRecords,
  analyticsController.js all-time fetch, ExercisesView Personal records
  card). SMOKE: complete a session with a genuine PR - the set gets a
  small muted "PR" chip; a different exercise sharing that weight/reps
  in the same session does NOT get chipped; completed session pages
  load without console errors
  **BOUNCE 1 (July 19), delivery NOT landed, work left uncommitted in
  the lane for the fix run.** Lanes verified fresh in lane and GREEN
  (unit 195/195 in 15 suites incl. 24 new prs fixtures, build green,
  check-hex clean, purity grep clean) - the bounce is not a lane
  failure, it is a defect the lanes cannot see. Engine half AUDITED
  CLEAN and accepted as delivered: identity keying verified correct by
  direct read (enrichSet.js:25 synthesizes a `user:<id>` catalogEntry
  for custom exercises, so summary.js's identityKeyOf/identityFromKey -
  copied verbatim from exerciseDetail.js's landed N5 pattern - covers
  catalog AND custom); isolation verified (the new all-time fetch
  reuses the pre-existing userId-scoped `fetchAllTimeEnrichedSets`,
  `where: { userId }` on both queries, no new query written); the
  removed HONESTY_PR_DETECTION note is now correct to drop. TWO
  FINDINGS, both in SessionDetailPage.jsx, written into the block:
  **F1 BLOCKER, UNDECLARED** - `setHasPR` is a const in
  `SessionDetailPage` (:2036) but called inside the top-level
  `SessionExerciseBlock` (:1709, :1738) with no prop threading it
  (:2914/:2979 pass nothing), so every COMPLETED session detail page
  throws `ReferenceError: setHasPR is not defined`; live sessions
  survive only via the `isCompleted &&` short-circuit. Invisible to
  both lanes (Vite does not resolve undefined identifiers, no client
  render tests) and the report claimed the chip worked - automatic
  bounce per land-unit. **F2** - the chip matches PRs to rows by
  `weight:reps` alone, so any set sharing a weight/reps pair with a PR
  in the same session gets chipped (bench 135x5 and curl 135x5 both
  light up); declared as deviation 1 but not acceptable as built - the
  payload already carries `identity` + `exerciseName`, so the match
  must key on exercise identity too. A false PR badge is a
  honesty-layer violation. Re-dispatch SAME lane with the findings
  (bounce channel, engine half untouched). Two bounces on one unit =
  hard stop, page Seth.
LANDED 0805064 | fp6-weekly-digest.md | digest layer under the Home band:
  muscle movers, PR line, execution line, one deterministic nudge |
  MODEL opus -> Channel B NAMED rung. Gate (FP2 + FP5 both LANDED)
  satisfied; dispatched and landed July 19 (third resident session), lane
  branch cursor/fp6-weekly-digest in C:\dev\worktrees\cursor-lane,
  file-disjoint from all prior FP units. Audited per land-unit: scope
  exact (2 files = FILES TO TOUCH), lanes fresh in lane (unit 195/195 in
  15 suites, build green 130 modules, check-hex clean), no deviations
  (matches DELIVERY.md's "None" claim). Verified by direct read against
  server shapes, not just trusted: `execution` array shape confirmed
  exactly `{loadAdherence, volumeAdherence, effortDrift}` per exercise
  (planVsActual.js:27-31) so the digest's per-field averaging into the
  pre-existing `buildExecutionVerdict` is sound; `meta.effortCoverage`
  confirmed real (summary.js:143/177) for the nudge-rule-(a) gate;
  `sumEffectiveSets` confirmed pre-existing (not newly added, no
  ReferenceError risk); empty-week guard verified structurally - both-
  empty bails at line 267 before DigestSection is ever reached, and the
  current-empty/prior-has-data branch returns its own JSX at line 271
  without reaching it either, so the digest cannot appear in either
  existing empty state. CSS diff tokens-only (`var(--color-border)`,
  layout-only, no raw color). Rebased onto ac9bc69 (the FP6-dispatch
  docs commit, routine 1-commit divergence) then ff-merged `0805064`,
  pushed, origin HEAD confirmed. **This is the wave's last code unit
  after FP2/FP5's gate cleared - FP-wave is now CODE-COMPLETE except
  FP8** (still DRAFT, blocked on Seth's icon PNGs landing in
  claudefiledrop/). Next gate is the pre-main review (Opus, per the
  standing fallback), not another dispatch. SMOKE: Home's weekly report
  band, under the four stats - a week with real data shows up to 3
  muscle movers ("Chest +6 sets - Back -4 sets - Quads +3 sets"), a PR
  line when the week had any PRs, one execution-verdict sentence when
  planned-vs-actual data exists, and at most one nudge line (never more
  than one); a week with nothing new shows none of the four lines and
  the band looks exactly as it did before FP6; the both-weeks-empty and
  nudge-only empty states are unchanged
LANDED f144fee | fpfix1-standing-pr-semantics.md | standing PR records derive
  from detectPRs instead of reimplementing it (kills the warmup-set
  "Reps - 45 lb x 20" record + the first-session leak on the Exercises
  PR card); deletes the dead getPRsForSet export | MODEL opus -> Channel
  B named rung. FROM THE JULY 20 PRE-MAIN GATE (verdict: PASS WITH
  FIXES; this is the one required-before-merge fix). Root cause is a
  SECOND implementation of the same PR vocabulary: `computeStandingPRs`
  selected repsAtWeightPR by global max reps ignoring weight, contra
  FP5's contract and contra `detectPRs`, and dropped first-session
  suppression via an isFirstSession field that clean() stripped without
  ever gating on it. Proven by node-eval at the gate, not inferred.
  Untested by construction - the lone standing fixture (100x10 vs
  120x5) passes under both the buggy and the correct logic. Serializes
  against nothing currently in flight; file-disjoint from FP8.
  DISPATCHED July 20, Channel B named rung (`--model opus`, chosen over
  auto because FP5's two prior deliveries both under-verified on this
  exact file), lane `C:\dev\worktrees\cursor-lane` on branch
  `cursor/fpfix1-standing-pr-semantics` off `1a643f3`. LANDED same
  session, no bounce. Audited per land-unit: scope exact (3 files),
  lanes re-run FRESH in the lane (198/198 in 15 suites, client build
  green), delivery's node-evals NOT replayed but re-derived from
  independent fixtures - warmup case returns null, anti-drift invariant
  holds (standing record always matches a real detectPRs event), and a
  warmup-progression case confirms real work outranks a 45x25.
  ONE REVIEWER FIX on top of the delivery, undeclared by it (trivia
  tier, direct-fix exception - diagnosis was the whole job): removing
  the vestigial isFirstSession block also removed the chronological
  sort, so weightPR/e1rmPR tie resolution became caller-input-order
  dependent (proved by node-eval: same sets reversed gave Jan 15/4 reps
  vs Jan 22/6 reps). Restored the sort and added a determinism fixture
  matching the module's existing "chronological ordering independence"
  idiom. SMOKE: Exercises detail -> Personal records card shows Weight
  and e1RM rows, and a Reps row ONLY when a genuine reps-at-weight
  record exists - never a warmup set, never dated to the exercise's
  first session.
DRAFT | fp8-pwa-icons.md | manifest icons + manifest/apple-touch links
  in index.html | LAST per Seth; flips QUEUED when his exported PNGs
  land in claudefiledrop/

**SMOKE-FINDINGS ARC (FP9-FP11), authored July 20 (Opus) from Seth's
staging smoke.** Seth ruled the wave does NOT merge to main yet - it gets
edited and improved first, so these land on `frontier-parity-wave` ahead
of a re-smoke and a re-run gate. Authored from three Cursor recon lanes
(exec-blocks / ux-surfaces / e1rm-blast, session-scoped, reports in the
session scratchpad, not committed). Dispatch order: FP9 + FP10 in
PARALLEL (file-disjoint - FP9 owns setMetrics/exerciseDetail/
ExercisesView-formatter and touches NO css; FP10 owns WeeklyReport +
index.css), then FP11 alone (collides with FP9 on ExercisesView.jsx and
FP10 on index.css).

PARKED (not a unit) | docs/specs/block-execution-gap.md | the multi-week
  block layer is fully authored in schema + API + builder UI but cannot be
  TRAINED: no start-session-from-block, WorkoutSet.blockWorkoutSetId never
  written, "set as current" is localStorage only, planVsActual has no
  BlockWorkoutSet branch | Found by the July 20 recon lane while authoring
  FP9-FP11. **Seth RULED July 20: "don't do anything with the block builder
  for now, that's for another wave."** Doc exists to preserve the evidence -
  do NOT author against it. The fork (finish it vs cut the dead-end UI) is
  Seth's product call.

LANDED a356e4a | fp9-e1rm-validity-window.md | 1-12 rep validity window on Epley
  at the single producer (estimateOneRepMax), + e1rmPR renders as an
  estimate with provenance, not as a performed set | MODEL opus. Root
  cause of Seth's "266.7 lbs x 20 never happened": uncapped Epley on a
  160x20 set became all-time bestE1rm and cascaded to 5 surfaces incl.
  the PRESCRIPTIVE Working-weight-targets card (told him 227.5x5 when
  his real best five was 220). Units RULED OUT as a cause. Guard goes at
  the producer, not per-consumer - avoids recreating FPFIX1's
  two-implementations bug. Expected fixture changes: setMetrics.test.js
  :28-32 (currently ASSERTS uncapped epley at 37 reps - pins the bug),
  prs.test.js:330-354 (45x20 warmup, verified unchanged - passes via
  working sets). Audited per land-unit: scope exact (4 files, matches
  FILES TO TOUCH), lanes fresh in lane (202/202 unit tests, client build
  clean), check-hex clean. Diffs hand-verified against every acceptance
  criterion: EPLEY_VALIDITY_MAX_REPS=12 named constant with rationale
  comment; formatPRValue gives e1rmPR its own branch
  ("~267 lbs (from 160 lbs x 20)"), weightPR/repsAtWeightPR branches
  untouched. No deviations. Lane rebased onto b365914 then ff-merged.
  SMOKE: Personal records e1RM row reads as an estimate with its source
  set; Working weight targets no longer inflated by high-rep sets; an
  exercise trained only above 12 reps shows the existing
  insufficient-data unlock copy, not a broken card.
LANDED 6ddda4b | fp10-weekly-digest-hierarchy.md | Home weekly digest: PRs become
  structured rows (existing .session-set-pr-chip, grouped by exercise,
  3 + "+N more"), four digest lines get a rank instead of four identical
  muted paragraphs | MODEL opus. Presentation only - server already ships
  structured prs[]; the client flattened it into a run-on sentence that
  repeated the exercise name per PR. Tokens-only, card--live forbidden,
  every existing empty/partial state must survive. Audited per land-unit:
  scope exact (2 files, matches FILES TO TOUCH), lanes fresh in lane
  (198/198 unit unchanged, client build clean), check-hex clean.
  `.session-set-pr-chip` reused not redefined; e1rmPR row omits reps
  ("e1RM 267 lbs"); every null/empty-state branch preserved. No
  deviations. Lane rebased onto 9cc98f4 then ff-merged. SMOKE: a week
  with two PRs on one exercise names it once; a week with 5 PRs shows 3
  + "+2 more"; a week with no PRs looks unchanged; digest lines read as
  Movers/Execution/Note labels instead of a bare "Execution: " prefix.
LANDED 5ca24f4 | fp11-exercise-detail-cards.md | Top sets dedupe by (weight,reps)
  keeping earliest date + React key fix, and a visual pass on the three
  exercise-detail cards | MODEL opus, Channel B named rung, lane
  `C:\dev\worktrees\cursor-lane` branch `cursor/fp11`. Carries a real
  defect, not just polish: no dedupe at exerciseDetail.js:213-223 means 3
  working sets of 220x5 take 3 of the 5 slots, and the client key omits
  reps (ExercisesView.jsx:422) so those rows DUPLICATE React keys.
  Audited per land-unit: scope exact (4 files, matches FILES TO TOUCH),
  lanes fresh in lane (204/204 unit incl. two new dedupe tests, client
  build clean, check-hex clean). Dedupe applied at the engine before
  slicing to MAX_TOP_SETS=5, earliest performedAt kept per (weight,reps)
  key, sort order otherwise unchanged; React key now includes reps as
  defense in depth. No `card--live`, no raw colors, all empty/unlock
  states verified present in the diff. No deviations. Lane rebased onto
  d9775c4 then ff-merged. SMOKE: five distinct top sets, no console key
  warning; Working weight targets reads as a ladder/curve, not a bare
  table; Personal records e1RM row stays visually distinct as an
  estimate (FP9's contract intact).

LANDED 137e0ea | fp0-frontier-parity-report.md | report-only unit, NO
  code: per-item NOW (file:line evidence) + CHANGE + SIZE for the six
  Tier-0 review findings, four Tier-1 frontier-parity features, Tier-2
  horizon paragraph | MODEL auto -> Channel B auto rung, dispatched +
  landed July 18 same session (Fable). Audited per land-unit: lane tree
  porcelain-EMPTY (zero source mods, criterion verified directly), unit
  lane re-run fresh in lane 170/170 (14 suites), spot-checks confirmed
  by direct read (R3 dual-clock mechanism real: WeeklyReport.jsx:31-44
  counts workouts by completedAt in LOCAL bounds while Sets/Top-set ride
  /analytics/summary filtered by performedAt in UTC bounds; prs:[] stub
  at summary.js:113; "PR detection coming" at ExercisesView.jsx:386;
  HelloPage.jsx:17,49 rebrand leaks). One non-deviation noted: "WorkoutDB
  API running" in server routes/index.js:13 not listed - API messages
  are rename-boundary OUT and the sweep was scoped to client rendered
  text. No deviations declared, none found. Report preserved verbatim in
  fp0-frontier-parity-report-FINDINGS.md; R6 (tagline) + R9 (Strength
  Score design pass) + wave composition await Seth's read - NO
  implementation blocks authored yet by design

MW-wave (maintenance wave), authored July 16 (Fable), branch
`maintenance-wave` (off not-tracked-ux-wave HEAD `5e3d981` = main
`c473e21` + the CW dev-tooling arc, which therefore rides this wave's
pre-main gate). Sources: Seth's July 16 candidate list (HANDOFF items
10-16) + the NT-gate's surviving findings (issues 8/9 + the nested
`<button>`). Scope settled with Seth July 16: item 12 = custom
EXERCISES (not templates); un-finish IS the edit path for 10+11 (one
mechanism, no second editing surface); item 16 (catalog/search review
pass) NOT authored - stays a candidate alongside A3. Gate-tier rulings
baked into the blocks, do not re-litigate: the server WILL accept an
id-only identity PATCH (issue 8, ruled July 16 - fixes BOTH :531 and
:575); reopen = `completedAt`-only flip, and a reopened session leaving
history/analytics until re-finished is intended semantics.

Dispatch order: MW1+MW2 may go back-to-back (file-disjoint: client
SessionDetailPage/index.css vs server controllers + sheet + tests),
then MW3 (shares sessionController.js with MW2 AND SessionDetailPage.jsx
with MW1), then MW7 (index.css possibly overlaps MW1/MW3 - when in
doubt they collide, serialize). MW4 and MW5 are no-code diagnosis
blocks: dispatch solo anytime between reviews, never back-to-back with
anything (every block writes DELIVERY.md). MW6 stays DRAFT until MW4's
audit lands and its findings are folded into the contract.

July 16 addendum (Fable, post-rulings): MW6 finalized and QUEUED; MW8
authored and QUEUED. MW6 (SessionDetailPage.jsx +
PlanningSetCountControl.jsx + index.css-if-needed) and MW8 (5 analytics
display files + one NEW lib file, no CSS) are fully file-disjoint and
may dispatch back-to-back for one review session. These are the LAST
two code units of the wave - after they land and Seth smokes, the
pre-main gate (Fable) closes the wave.

**WAVE CODE-COMPLETE July 16 (Opus resident session): all 8 units
LANDED** (MW1 f9a6dfd, MW2 859f3d3, MW3 9511e8f, MW4 c005c2a, MW5
87d6b37, MW6 bfbbe56, MW7 b6c885f, MW8 52e84cf). Remaining: Seth
smokes MW6+MW8 on staging (MW1/2/3/7 already PASSED July 16), then
the pre-main gate (Fable + Seth).

**PRE-MAIN GATE CODE REVIEW PASSED July 17 (Fable, twenty-fifth
session).** Full accumulated diff `c473e21..a5294e3` (34 commits,
MW1-MW8 + CW arc + one off-flow fix) reviewed against the blocks, the
per-unit records above, and the archived session logs; lanes re-run
fresh at the gate (unit 170/170 in 14 suites, Vite build green,
check-hex clean); server contract, detector/auto-pair guards, and all
5 formatter swaps verified by direct diff read; cursor-watch.mjs
confirmed never imported by client or server. NO fix blocks, nothing
bounced. **Same session: Seth confirmed the MW6+MW8 smoke PASSED and
triggered the merge — MW-WAVE MERGED TO MAIN `3b325db` July 17**
(ff-only `c473e21..3b325db`, 35 commits, scratch-worktree ritual,
origin/main HEAD verified). All entries below are in `main`; they
stay for history. `maintenance-wave` becomes a deletion candidate
(gated) once Seth repoints staging Render to `main`.

- LANDED a5294e3 | (NO BLOCK FILE - off-flow direct fix, July 16
  evening Fable session) | single confirm when deleting a FILLED
  per-side L/R pair (was three dialogs: one pair-level + one per set),
  no confirm at all on a blank pair, single-set deletes keep the
  per-set confirm; mechanism: onDeleteSet gains { skipConfirm } and
  handleDeleteSet's pair branch passes it after its own pair-level
  window.confirm | 1 file (SessionDetailPage.jsx, 3 lines). Committed
  outside land-unit during what was evidently Seth's MW6 smoke and
  left unrecorded in QUEUE/HANDOFF until the July 17 gate; reviewed
  DIRECTLY at the gate (diff read, lanes fresh) - clean, on origin

- LANDED f9a6dfd | mw1-heading-pill-unnest.md | tracked pill lifted out
  of the live heading toggle - pill + summary are now SIBLINGS of the
  toggle in a shared .session-exercise-heading-lead wrapper (live and
  completed branches unified, the block's optional invite taken) |
  MODEL opus -> DELIBERATE DESCENT to B auto rung (Seth's July 16 call,
  Opus audit compensates); landed same day, audited per land-unit:
  lanes fresh (unit 170/170, Vite build, check-hex clean), full diff
  read, un-nest verified in the JSX tree (toggle children = chevron +
  name/sets only), slot-sizer idiom untouched (slot margin-left 8px
  supplies the gap, toggle padding-right zeroed to avoid doubling -
  commented), stopPropagation/preventDefault removal verified SAFE by
  direct read (pill is type=button, no ancestor click handler remains),
  CSS additions layout-only. No deviations. SMOKE (wave checklist):
  live heading at 360px with a long name - order chevron/name/sets/
  pill/summary, pill tap opens sheet without toggling collapse,
  no layout shift when pill flips Tracked/Not-tracked, completed
  view unchanged
- LANDED 859f3d3 | mw2-identity-stamp-contract.md | issues 8+9 in one
  unit: id-only identity PATCH accepted (guard counts
  identityParse.provided, identity application un-nested from the name
  branch as its own if-arm, validation helpers byte-untouched), resolve
  rows uniformly carry userExerciseId (id on userExercise, null on
  catalog/unresolved), "Use that name" gains the mutually-exclusive
  userExercise arm | MODEL opus -> DELIBERATE DESCENT to B auto rung
  (Seth's July 16 call, Opus audit compensates); landed same day,
  audited per land-unit: scope exact (5 files = FILES TO TOUCH), lanes
  fresh in lane (unit 170/170, build, check-hex clean), guard order
  verified by direct read (404 :553 -> 403 :560 -> SESSION_COMPLETED
  :570 -> identity :577, all in-transaction, userId passed to
  validateOptionalExerciseIdentity), integration tests RUN AT LAND TIME
  in the main tree per the block - 2 suites 17/17 green incl. the new
  5-row PATCH matrix (owned-id 200/name-unchanged, catalog-id converse,
  {} still 400, foreign-id 400, completed 400) and exact-shape resolve
  asserts. One flagged non-deviation accepted: userExercise.findMany
  index build now runs only in the name-derivation branch (was wasted
  work when identity provided). Bonus verified: handleLinkRow :341
  already forwards userExerciseId, so the suggest-list path gains
  custom stamping for free. SMOKE (wave checklist): resolve a custom
  exercise in the sheet -> "Use that name" -> pill flips Tracked
  without rename side effect; issue-9 path now stamps structural id
- LANDED 9511e8f | mw3-reopen-completed-session.md | POST
  /sessions/:id/reopen + two-step-confirm "Reopen workout" on the
  completed view: un-finish IS the edit path (asks 10+11) | MODEL opus
  -> DELIBERATE DESCENT to B auto rung (Seth's July 16 call); landed
  same day, audited per land-unit: scope 6 of 7 allowed files
  (index.css untouched - permitted "only if needed", affordance reuses
  btn/row/stack), lanes fresh in lane (unit 170/170, build, check-hex
  clean), handler verified by direct read (guard ladder 401 -> 400
  bad-id -> findFirst{id,userId} 404 -> 400 not-completed; update
  touches ONLY completedAt; include shape byte-identical to
  completeSession), "reopened" local-apply branch string-compares ids,
  confirm copy carries all three consequences (back to in-progress,
  leaves history/analytics until re-finished, nothing lost),
  integration RUN AT LAND TIME in main tree: lifecycle suite 11/11
  green incl. all 3 new reopen tests (round trip with post-reopen set
  write + re-complete, live 400, foreign 404). ONE DECLARED DEVIATION
  accepted: confirm auto-dismiss 10s not the idiom's 5s (three-sentence
  consequence copy needs reading time; commented at the effect).
  SMOKE (wave checklist): complete a workout -> Reopen workout ->
  confirm copy reads right -> live builder + finish dock take over in
  place -> dashboard resume hero reappears -> finish again puts it
  back in history/analytics
- LANDED c005c2a | mw4-per-side-analytics-audit.md | DIAGNOSIS, no code:
  unilateral L/R end-to-end trace with per-surface verdicts | MODEL auto
  -> Channel B auto rung, dispatched + landed July 16 (Opus resident
  session), audited per land-unit: lane 170/170 fresh, zero source
  edits, spot-checks all confirmed by direct read/grep/count (analytics
  side-blind - zero side refs in server/src/analytics; detection is
  exactly \bsingle\b at SessionDetailPage.jsx:207-211; heading :1359
  raw-row count vs toolbar :1318 pair count mismatch real; catalog 50
  one-arm / 16 single of 873 exact). VERDICTS: storage+enrichment
  CORRECT (side persists, engine side-blind by construction); volume /
  set counts / e1RM all AMBIGUOUS (L+R = 2 full sets everywhere -
  coherent but needs the pair=1-or-2 product ruling; series bucketing
  does NOT double-count sessions; planned-vs-actual adherence hits 2.0
  on paired work); display BROKEN (heading says "2 sets" while per-side
  toolbar says 1 pair); detection BROKEN (misses all ~50 One-Arm
  catalog names, false-positives on "single response"). Overall:
  trustworthy WITH CAVEATS; MW6 must NOT ship on the \bsingle\b
  detector alone. Full report preserved verbatim in
  mw4-per-side-analytics-audit-FINDINGS.md (DELIVERY.md is gitignored);
  5 product-ruling questions for Seth/Fable recorded there - MW6's
  contract finalizes against it
- LANDED 87d6b37 | mw5-decimal-values-audit.md | DIAGNOSIS, no code:
  decimal reps/RPE/RIR end-to-end trace | MODEL auto -> Channel B auto
  rung, dispatched + landed July 16 (Opus resident session), audited
  per land-unit: lane 170/170 fresh, zero source edits, spot-checks all
  confirmed by direct read/grep (parseNullableInt quote exact at :40-52;
  rir-1.5 -> clean 400 on BOTH create :822-827 and update :1037-1042;
  Math.round(reps) on exactly the 5 claimed surfaces; live reps input
  really is step=1). VERDICTS: reps 8.5 trustworthy except ONE display
  bug - analytics top-set strings Math.round to integer (AnalyticsPage
  :73, WeeklyReport :228, StatTiles :126, ExercisesView :352,
  StrengthTrendChart :22 - 8.5 renders as 9); RPE 8.5 CORRECT
  end-to-end (Float, effort pooling derives 1.5, formatEffort keeps
  fractions); RIR 1.5 NOT SUPPORTED by design - clean 400, never
  stored, never truncated. RECOMMENDATION (ruling stays Fable/Seth):
  REJECT decimal RIR, do NOT widen the column - half-steps already
  expressible via RPE 8.5; optional client-side integer gate to avoid
  the flash-error-and-reload UX. Factual correction to the block's
  context: step="0.01" is TEMPLATES only (SetRow.jsx:43); live session
  reps use step="1" (AMBIGUOUS, not broken). Fix-block candidate: the
  shared reps formatter to replace the 5 Math.round sites. Full report
  verbatim in mw5-decimal-values-audit-FINDINGS.md
- LANDED bfbbe56 | mw6-per-side-auto-first-pair.md | per-side detection
  fix (One-Arm/one-leg names covered, "single response" dodged) +
  auto-create the first L/R pair on qualifying commit or override-on
  with zero sets (delete respected, no re-trigger loop) + stepper
  relabeled "Pairs" in per-side mode (PlanningSetCountControl gains a
  default-"Sets" label prop) + collapsed-summary side cue + decimal-RIR
  client input gate | MODEL opus -> DELIBERATE DESCENT to Channel B auto
  rung, dispatched + landed July 16 (Seth's standing "run on auto, Opus
  audits" call); finalized July 16 by Fable against MW4's findings +
  Seth's rulings (mw6-seth-rulings.md) - rulings baked in: pair = 2
  sets, heading keeps raw row count, RIR stays rejected. Audited per
  land-unit: scope exact (2 files; index.css untouched - permitted
  "only if needed", RIR hint reuses muted/small), lanes fresh in lane
  (unit 170/170, build, check-hex clean IN THE LANE), full diff read,
  detector name table re-run INDEPENDENTLY by node eval with the real
  isBlankSessionExerciseName (13/13), single creation path verified by
  direct read (onCreateSet {perSide:true} -> onCreateSetForExercise
  :2238 -> createSetPairForExercise :285, L then R), commit-vs-draft
  discipline verified (onExerciseCommitted fires only from
  commitExercise PATCH success :515), override-false-wins verified
  (derivePerSideMode :221 returns early), completed path triple-guarded
  (chip unrendered, exerciseCommitted undefined, isCompleted guard),
  no-respawn verified (no effect watches empty sets; busyRef +
  sets.length guards). No deviations declared, none found. ONE JUDGED
  NOTE (accepted, not a deviation): detector narrows bare \bsingle\b -
  names like "Squat (single)" no longer auto-trigger; the block made
  the name table the contract and existing sided data keeps per-side
  mode via anySetHasSide regardless of name. SMOKE (wave checklist):
  commit "One-Arm Dumbbell Row" on a zero-set live exercise -> one L/R
  pair appears (L then R), stepper reads "Pairs" while heading says
  "2 sets", collapsed summary shows "Last R 60 x 10", typing 1.5 in RIR
  is blocked with the inline whole-numbers hint (no error flash), RPE
  8.5 still saves
- LANDED 52e84cf | mw8-reps-display-formatter.md | shared reps formatter
  (client/src/lib/repsDisplay.js, formatEffortValue semantics) replaces
  Math.round(reps) at the 5 analytics top-set sites (AnalyticsPage,
  WeeklyReport, StatTiles, ExercisesView, StrengthTrendChart) so 8.5
  reps stops rendering as 9; null-reps gating per site untouched |
  MODEL auto -> Channel B auto rung, dispatched + landed July 16 (Opus
  resident session, after MW6 landed bfbbe56); authored July 16 from
  MW5's fix-block candidate. Audited per land-unit: scope exact (6
  files = FILES TO TOUCH incl. the one NEW lib file), lanes fresh in
  lane (unit 170/170, build 129 modules), full diff read, formatter
  verified byte-for-byte the formatEffortValue body (the block's
  "mirror" ask taken literally), node eval re-run INDEPENDENTLY
  (8.5->"8.5", 8->"8", 10.25->"10.3" one-decimal policy, stated in the
  report), remaining Math.round in AnalyticsPage confirmed
  adherence/effort-coverage percentages only (out of scope), single
  definition + 5 imports verified by grep, null-reps ternaries
  untouched at all 5 sites. No deviations. One reviewer trivia fix: a
  stray blank line the swap left in StrengthTrendChart.jsx (build
  re-run green after). SMOKE (wave checklist): log 8.5 reps on a top
  set -> analytics Top set tile, weekly report, exercise detail
  top-set list, and strength trend delta chip all read "x 8.5", not
  "x 9"; integer reps still render bare (no "8.0")
- LANDED b6c885f | mw7-custom-exercise-library-view.md | third
  "Custom exercises" tab in the Library yours-area: rows with
  Main/Assists summaries, confirm-guarded delete with honest SET-NULL
  consequence copy, actionable empty state naming the "Not tracked -
  add?" pill; client half only | MODEL auto -> Channel B auto rung;
  landed July 16, audited per land-unit: scope exact (3 files), lanes
  fresh (unit 170/170, build, check-hex clean), claims verified by
  direct read/grep (window.confirm IS the page's existing delete idiom
  at :176/:201 so matching it satisfies the block; server really
  returns { userExercises } with validated {muscle:
  primary|secondary} designations; .programs-type-tablist has exactly
  one consumer so the 1fr 1fr -> repeat(3,1fr) base-rule change is
  sound, <=420px collapse untouched; community area zero-diff). FOUR
  DECLARED DEVIATIONS, all accepted: tab titled "Custom exercises"
  (matches Saved-workouts/Saved-blocks idiom), visibility filter
  hidden on the exercises tab (no public/private axis - dead UI
  otherwise), template empty-state cards gated tab!=="exercises"
  (no-op on template tabs), compact card presentation (block left it
  open). SMOKE (wave checklist): Library -> Custom exercises tab shows
  count + rows, delete confirms with the honest copy and removes the
  row without reload, empty state actionable, community area
  unchanged, 3-up tablist reads right at 360px

Off-wave dev-tooling unit, authored July 15 (Fable, Seth's go-ahead after
the build-path question). Rides `not-tracked-ux-wave` for landing (one
standalone new file added to the pending pre-main gate diff - flagged
here so the gate expects it); dev tooling only, never enters the client
build or server runtime.

- LANDED 018a6ae | cw1-cursor-watch-dashboard.md | zero-dependency local dashboard
  (`scripts/cursor-watch.mjs`, Node built-ins only, 127.0.0.1) for
  watching Channel B Cursor runs live: fs.watch + git-diff polling of the
  lane worktree, SSE to an embedded dark mission-control page (activity
  feed, diff-stat bars, typing pane, DELIVERY.md flips DELIVERY READY);
  zero tokens to run by design | MODEL auto -> B-auto rung (free);
  file-disjoint from everything (single new file), no serialization
  constraints; dispatched + LANDED July 15 same day, Channel B auto rung
  (headless CLI in the lane worktree), Fable-audited per land-unit:
  lanes re-run fresh in the lane (unit 170/170, Vite build 128 modules),
  live contract spot-checked against a scratch dir (200 text/html, file
  write -> WORKING event, DELIVERY.md -> DELIVERY READY, missing lane
  exits 1), imports all node: built-ins, no external URLs, scope exactly
  the 1 new file, no deviations
- LANDED a26a2c8 | cw2-cursor-watch-autoopen.md | auto-open flags for the CW1
  watcher (--open at startup, --open-on-activity with once-per-run
  re-arm on DELIVERY.md removal/branch change, --open-cmd test override)
  so the dashboard POPS the moment Cursor starts working; dispatch-unit
  skill amended same day to start/open the watcher at dispatch time |
  MODEL auto -> B-auto rung; SAME FILE as CW1 - serialized after CW1
  landed 018a6ae; dispatched + LANDED July 15 same day, Channel B auto
  rung, Fable-audited per land-unit: lanes re-run fresh (unit 170/170,
  Vite 128 modules), full diff read, live once-per-run + re-arm cycle
  spot-checked (atStart=False, afterFirst=1, afterSecond=1,
  afterRearmWrite=2), no deviations. Watcher now runs persistent via a
  Startup shortcut with --open-on-activity (Seth's "anything ever" ask)
- LANDED 6907d4a | cw3-cursor-watch-frontier-visuals.md | frontier-agent
  visual overhaul (phase-driven accent system, agent-presence orb,
  tool-call card feed, event-rate sparkline) + the unmissable DONE
  moment (page sweep + title/favicon state + --notify OS toast with
  --notify-cmd test override); design fully specified in the block -
  MODEL auto is DELIBERATE, named rung exhausted until 7/17 reset |
  SAME FILE as CW1/CW2 - serialized after CW2 landed a26a2c8;
  dispatched + LANDED July 15 same day, Channel B auto rung,
  Fable-audited per land-unit: lanes fresh (170/170, Vite 128), page
  driven in a REAL browser (Playwright: WAITING/WORKING/DELIVERY all
  render, titles flip, zero console errors), notify contract live
  (afterDelivery=1, afterMoreWrites=1), scope exact, no deviations;
  papercut logged (non-git watch dir lets git walk up to an enclosing
  repo - totals chip can count foreign files; real lane is always a
  worktree, unaffected). Seth's visual sign-off owed on the next live
  run. Resident watcher + Startup shortcut now run
  --open-on-activity --notify

NT-wave — **COMPLETE: MERGED TO MAIN `c473e21`, July 15** (gate passed,
smoke passed, ff-only `57b1fc8..c473e21`, 28 commits, no migration). All
five units below are in `main`; the entries stay for history. Gate
results, the rename ruling, and the one knowingly-shipped finding (nested
`<button>` on the live path) are in `docs/HANDOFF.md`. NOTE: the branch
`not-tracked-ux-wave` LIVES ON as CW1's landing branch — not a deletion
candidate.

Authored July 11
(Fable), branch `not-tracked-ux-wave` (off `e960645` = main `57b1fc8` +
one docs commit). Design/contract source:
`docs/design/not-tracked-add-flow-brainstorm.md` - direction A (catalog-
seeded stepped flow) with direction B's explicit-role picker as its final
step; body-map C parked. Seth settled the doc's three open questions July
11: (1) variant-of seeding IS in scope, (2) the retroactive-attribution
message lives in the sheet's success moment only - brief, every time,
(3) the pain is BOTH structural and visual, so NT2 carries a visual bar,
not just flow criteria. No schema change, no migration anywhere in the
wave.

Dispatch order: NT1 -> NT2 -> NTFIX1 -> NT3, strictly in that order (NT2
depends on NT1's payload; NTFIX1 fixes NT2's smoke findings and NT3 shares
both client files with NTFIX1 and NT2). NT1 and NT2 are file-disjoint
(server-only vs client-only) and may be dispatched back-to-back for one
review session per the batching rule. NTFIX1 and NT3 both touch
AddExerciseToLibrarySheet.jsx + SessionDetailPage.jsx, so they are NOT
disjoint - serialize: NTFIX1 lands, then NT3.

- LANDED f4baee3 | nt1-search-secondary-muscles.md | searchCatalog rows
  gain secondaryMuscles (additive, pure) so the client gets the full
  seeding profile from the existing search endpoint | MODEL auto,
  mechanical - audited clean (170/170 unit lane fresh, no scope creep),
  pushed to staging
- LANDED f26e783 | nt2-add-exercise-stepped-sheet.md | rebuild
  AddExerciseToLibrarySheet as the stepped flow (suggest-link / seed /
  curate with segmented Main-Assists picker / done with retroactive
  line) + link wiring into SessionDetailPage | MODEL opus (Seth's call
  July 11; Fable withheld for the pre-main gate). Delivered by Composer
  (Cursor out of Opus tokens), audited by Opus in Claude Code instead of
  Sonnet: both lanes re-run fresh green (client build; server 170/170
  tripwire), all 11 acceptance criteria verified, API row/resolve shapes
  and CSS tokens confirmed against source. One reviewer fix folded in
  (dropped a vestigial getMuscles fetch that gated the picker on discarded
  data). Findings B-D (dead ternary, create-succeeds/stamp-fails edge,
  tablist a11y) logged for the pre-main Fable gate. Pushed to staging.
- LANDED e0ba383 | ntfix1-nt2-smoke-bugs.md | NT2 smoke-test fixes B/C/D/E
  landed July 12 (Sonnet audit): cloud-branch delivery
  `cursor/ntfix1-nt2-smoke-bugs-1341` (PR #3, now MERGED) ff-merged
  `804b65b..e0ba383`; both lanes re-run fresh green (client build; server
  170/170 tripwire). (F) "Failed to fetch" = DIAGNOSED, no client defect
  (Render cold-start/502 ranked cause; did NOT reproduce on a warm backend
  in the live Playwright test) - stays open for the pre-main gate. NEW
  finding G from the live test (pre-existing NT2, for the gate): the
  id-only `{ userExerciseId }` stamp PATCH 400s every time (server merges
  identity only inside the exerciseName branch) - needs a client/server
  contract reconciliation block. (This entry was stale-QUEUED until July
  14 - the landing session updated HANDOFF but not QUEUE.)
- LANDED 98963f6 | nt3-entry-deferability-polish.md | completed-session
  pill goes interactive, create-only sheet context (skip suggest, hide
  "Use that name", no userExerciseId stamp on locked rows - which also
  sidesteps bug G on this path), tokens-only tracked-pill fade-in |
  FIRST AUTONOMOUS DISPATCH LANDED (relay v5 trial, July 14): MODEL auto
  -> Channel B auto rung, CLI headless in C:\dev\worktrees\cursor-lane,
  Fable-audited per land-unit: both lanes re-run fresh (unit 170/170,
  client build green), scope exact (3 files = FILES TO TOUCH), all 7
  criteria verified incl. by direct read (open-reset seeds name +
  clears hadSuggestStep before the completed branch forces seed; parent
  create handler skips the stamp PATCH without userExerciseId but still
  invalidates + refreshes name resolution; live path a no-op change;
  check-hex clean, motion tokens defined, slot-pill class real on both
  crossfade variants). Declared addition (fade-in) within the block's
  pill-polish allowance. One dispatch hiccup, lesson pinned in
  dispatch-unit: the CLI remembers the last-used --model, so the first
  flagless dispatch inherited the exhausted haiku and quota-refused -
  ALWAYS pass --model explicitly. **NT-WAVE IS NOW CODE-COMPLETE - next
  gate is the pre-main Fable/Opus review of the full branch diff**
  (open items for it: finding F cold-start confirmation, finding G
  stamp-contract reconciliation, NTFIX1 + NT3 staging smoke)
- LANDED 888e44d | (NO BLOCK FILE - see notes) | NTFIX2: four
  not-tracked findings-fixes - (1) finding G/HIGH stamp-contract fix,
  (2) stuck seed spinner, (3) pill interactive on a stale committed name
  mid-edit, (4) suggest->seed duplicate-search dedupe | **UNUSUAL
  PROVENANCE, recorded so it is not mistaken for a normal unit.**
  Authored July 14 by Claude Code session ee60a330 at Seth's "fix all
  findings" request - NOT by Cursor, NOT from a task block, so there is
  no block file and no DELIVERY.md (the session's own final report stood
  in for one). It fixed the four findings, ran its lanes, asked "want me
  to land this?", got no answer, and closed - leaving the work
  uncommitted in the main tree, where a pre-gate check found it July 15.
  Parked verbatim on parked/unattributed-g-fix (532125d), then audited
  per land-unit BEFORE landing: lanes re-run FRESH in the lane worktree
  (unit 170/170 in 14 suites, client build green 128 modules), never
  trusted from the report; check-hex clean; scope exactly the 2 claimed
  files, nothing unexpected; all four criteria verified by direct read,
  incl. finding G's mechanism confirmed independently against
  sessionController.js:531 (empty-patch guard counts only
  exerciseName/notes) and :575 (identity stamping nested inside the
  name-change branch). Deviations stated, not hidden: Claude Code
  authoring product code (covered by the AGENTS.md direct-fix exception
  + Seth's explicit ask, but a deviation), and fix 4 being an
  optimization beyond the findings. Behavior note for the gate: the
  stamp PATCH now carries exerciseName, so the row RENAMES to the
  sheet's name on create - NT2's handler always anticipated this
  (pre-existing oldName !== name invalidation) but the rename never
  fired while the PATCH 400'd, so it is newly LIVE behavior, not new
  code. Cursor exonerated for the orphaned work: every recorded
  cursor-agent session July 14 ended by 10:11 and all NT3 relay activity
  clusters 10:00-10:53 - no lane-isolation breach.

## Landed - N-wave (analytics UI rebalance)

N-wave, authored July 10 (Fable), branch
`analytics-rebalance-wave` (off catalog-fk-wave HEAD `3d4e874`, which is
main `13a1e59` + N-wave spec docs + one settings commit). Spec/contract
source: `docs/specs/analytics-ui-rebalance.md` (passes 1-4 + F-test).
A-wave is fully MERGED TO MAIN + prod-rolled (July 8) - see Landed.

**FILENAME COLLISION NOTE:** the June nav-wave shipped task files named
`n1-bottom-tab-bar.md` / `n2-profile-hub.md` / `n3-analytics-subviews.md`
(all LANDED, see below). The N-wave's n1/n2/n3 are DIFFERENT units with
different slugs - always dispatch by full filename, never by bare "n1".

**Split (settled with Seth July 10): Cursor takes the relay lane, Fable
implements the judgment-heavy/security units directly.** Cursor lane:
N1 -> N2 -> N3 -> N6. Fable-direct: N5 -> N4 -> N7 (N5 is the isolation
surface; N4/N7 are the mock-signed visual units). Parallel-safe pairs:
N1 (Cursor) with N5 (Fable) are file-disjoint by design; N2 (Cursor) may
run while Fable finishes N5. N4/N7 share `AnalyticsPage.jsx` with each
other AND with N3 - strictly sequential: N4 -> N7 -> N3.

- LANDED 11b9c71 | n1-effort-neutral-formatting.md | shared weight/effort
  formatters + component sweep + engine effort-unit serialization |
  Cursor delivery, FABLE-audited (deeper than the standard pass - Fable
  authored the block): unit lane 157/157 + client build re-run fresh;
  both node-eval contracts re-run independently incl. extra formatEffort
  cases (10-rir RPE display conversion, fractional, null "- RIR");
  format-definition grep = only the shared module; remaining RIR hits
  all label/HOW_*/unlock copy; formatWeight-vs-formatEstimate semantics
  spot-checked (logged weights use formatWeight, e1RMs formatEstimate);
  AnalyticsPage's kept loadWeightUnit import verified live (execution
  verdict formatters). No deviations
- LANDED 46b8736 | n2-headline-stat-rebalance.md | engine topSet +
  topSetSeries, adaptive volume headline, Top set replaces Best lift |
  Cursor delivery, Sonnet-audited: unit lane 162/162 + client build
  re-run fresh; scope exact (6 files, matches FILES TO TOUCH); topSet
  tie-break (weight then reps) and topSetSeries session-bucketing
  verified by direct read against e1rmSeries's existing pattern - same
  performedMs grouping key, confirmed mirrored as required; new fixture
  tests read (not just trusted): topSet != bestSet case, no-e1RM case,
  tie-break case, topSetSeries chronological-without-e1RM case, all 4
  substantive; grep clean for e1rm access in StatTiles/WeeklyReport and
  single EFFORT_COVERAGE_HEADLINE_THRESHOLD definition; stat order
  verified in both components (adaptive headline pair, then Top set,
  then Top gain / Workouts-Sets-Top set-Top gain). One documented
  deviation: Top set omits "x reps" when reps is null (weight-only
  sets) instead of printing "x 0" - sensible, not bounced. pickTopSet
  helper duplicated verbatim between StatTiles.jsx and WeeklyReport.jsx
  (not factored to a shared lib) - minor, not in the block's scope, not
  worth a bounce. N4 (Fable-direct) is next per the wave order
- LANDED c4e3ba8 (FABLE-DIRECT) | n5-exercise-detail-endpoint.md |
  all-time exercise index + detail endpoint + rep-target engine | built
  in worktree C:\dev\worktrees\n5 (branch unit/n5-exercise-detail,
  merged ff); unit lane 153/153 (16 new fixture tests) run fresh in BOTH
  trees; isolation verified by grep (userId in every findMany where);
  purity grep clean; routes/controller load-checked. Documented
  deviations: detail core stats ALL-TIME, from/to bounds only
  weeklyVolume (default trailing 12w); totals.effectiveSets = attributed
  count. N3 unblocked on the server side (still waits on n7 for
  AnalyticsPage)
- LANDED 4f37361 (FABLE-DIRECT) | n4-strength-tab-rework.md | strength
  tab progression-first + mock-signed top-set sparklines | built in the
  main working tree (Cursor idle, no worktree race); scope exact (3
  files); client build green; unit lane 162/162 fresh (tripwire only,
  no server touch); implementation checked against the July 9 mock
  artifact's actual source (bare-number endpoint labels, no
  intermediate dots, 2px line + 10% wash + ringed 9px end dot + 40px
  plot, delta chip "+20 lbs · top set 245 × 3"); e1rm grep clean in the
  strength view, HOW_BEST_E1RM removed; no hex in CSS diff, all new
  colors token-derived; footer link ?view=exercises (muscles fallback
  until n3 - by design). Visual smoke owed to Seth on staging. N7
  unblocked (AnalyticsPage.jsx now free)
- LANDED d1b2871 (FABLE-DIRECT) | n7-muscles-heatmap.md | binned volume
  heatmap + table de-noise + 2W day-granularity preset | unit lane
  167/167 (5 new fixtures: 14 day cells for a 2W range incl. inclusive
  range-end cell + per-week averages preserved, weekly-unchanged at 28d,
  granularity rule day<=14d/week>14d, summary day-mirror + meta key) +
  client build re-run fresh after all edits. Ramp validated with the
  dataviz ordinal validator for ALL TEN palette x mode combos (block
  asked for 8; chill exists too): shared light P 51/66/81/100 and dark P
  40/60/80/100 vs surface-2 all PASS (light-end contrast 2.01-2.94:1,
  all gaps >= 0.06, single hue); iron light is unfixable by P constants
  (raw amber = 2.12:1 ceiling on its near-white card, total dL span <
  3 gaps) so its ramp anchors DOWN toward --color-text (accent
  100/74/49/25) - PASSES (gaps >= 0.13, hue spread 6deg), same relief
  precedent as the index.css chart-emphasis note. Empty cell = border-
  token neutral, legend-keyed "not trained", not ramp step 1. In-scope
  fix: rangeForWeeks now spans exactly N*7 calendar days inclusive
  (before this the end-of-day `to` produced a 5th mostly-empty weekly
  bucket on a "4 weeks" chip and would have made 2W = 15 day cells,
  violating the 14-cell criterion). perMuscle series keys renamed
  periodStart/periodEnd (only consumer was the replaced Trend
  component). Two documented deviations outside FILES TO TOUCH, both
  export wiring: analytics/index.js re-exports the new helpers;
  StatTiles.jsx gains ONE export keyword so
  EFFORT_COVERAGE_HEADLINE_THRESHOLD stays single-definition (N2's
  landed criterion) instead of being duplicated. Day cells are hover-
  enhancement only (no focus targets), weekly cells keep per-cell
  focus + aria labels; execution table's unlock cells deliberately
  untouched (this block de-noised the muscles table only). Visual smoke
  owed to Seth on staging. N3 unblocked (n5 + n7 both landed)
- LANDED 537309c | n3-exercises-tab-shell.md | 4th tab: all-time lookup +
  inline detail with rep-target hero | Cursor delivery, Sonnet-audited:
  unit lane 167/167 + client build re-run fresh; scope exact (5 files,
  matches FILES TO TOUCH); both mandatory F-test traps verified fixed by
  direct read - tabs grid repeat(3,...) -> repeat(4,...) with shrunk
  font/padding, setView/setExerciseParam both use the functional
  URLSearchParams-merge pattern (grep for bare `setSearchParams({ view`
  = no matches); client endpoints (`/analytics/exercises`,
  `/analytics/exercise`) confirmed matching n5's landed server routes;
  getExerciseDetail sends exactly one identity param (exerciseId else
  userExerciseId); rep-target rows verified using roundToPlate + muted
  `--extrapolated` class + shared footnote; both empty states
  (no-exercises-ever links to /log-workout, no-data-in-range names a
  longer-range action) read as actionable, not bare; no hex in CSS diff.
  Two documented deviations, both sensible: exercise param encodes user
  exercises as `user:<id>` (mirrors server identity key, block named the
  param not the exact encoding); AnalyticsPage renders the exercises
  view even when the range summary is empty (so all-time lookup still
  works pre-N6 empty-state work). One un-bounced addition: tapping an
  already-selected roster row toggles the detail closed (inline-expand
  consistency, not specified but harmless). Visual smoke (4 tabs at
  360px) still owed to Seth on staging. N6 unblocked (last N-wave unit)
- LANDED 28efeba | n6-frontier-polish.md | two-variant empty state,
  range persistence, KPI tap-through | Cursor delivery, Sonnet-audited:
  unit lane 167/167 (tripwire, no server touch) + client build re-run
  fresh; scope exact (4 files, matches FILES TO TOUCH, `analyticsRangePref.js`
  is the one NEW file). New-user vs out-of-range empty-state matrix
  verified by direct read (`isNewUser` gated on `indexReady && exerciseIndex
  != null && indexExerciseCount === 0`, rides N3's `getExerciseIndex` as
  instructed, no new endpoint added); range accessor confirmed byte-for-byte
  the `weightUnitPref.js` pattern (key `workoutdb-analytics-weeks`, Set of
  2/4/8/12, invalid/missing falls back to 4, try/catch on both read and
  write); KPI tile tap-through verified - Top set and Top gain resolve
  `exerciseId` and link to `?view=exercises&exercise=...`, volume headline
  links to `?view=muscles`, `StatTile` only wraps in `<Link>` when `to` is
  truthy so the empty-stimulating tile (`to` omitted) stays a plain div, no
  dead links; `.stat-tile--link` verified >=44px with `:focus-visible` and
  `:hover` both via `color-mix(var(--color-interactive) ...)`, same idiom
  as `.range-chip`; no hex in CSS diff. No deviations. **This was the LAST
  N-wave unit - the wave is now code-complete on `analytics-rebalance-wave`,
  next gate is the pre-main Fable review of the full branch diff.**
  (Gate since passed: pre-main Opus review clean July 10, N-wave MERGED TO
  MAIN `8068ffb`, What's New follow-up `57b1fc8` - see HANDOFF.)

Settled during authoring (were "still open" in the spec): rep ladder =
1/3/5/8/10/12/15 (20 rejected - Epley error exceeds a plate increment
that far out); coverage threshold = 0.6 named constant; plate increments
2.5 lbs / 1.25 kg. Spec open item 3 (Strength folding into Exercises)
stays a post-N flag.

## Candidates (next units, not yet authored as blocks)

- **Per-side L/R comparison analytics (ruling 3, Seth-confirmed July 16:
  own unit, NEXT wave, needs a frontier-seat design pass first).** Scope sketch
  recorded in mw6-seth-rulings.md's interpretation section: plumb `side`
  from the analytics controllers into enrichSet (engine is side-blind by
  construction today), per-side splits in exerciseDetail, comparison UI
  in the Exercises tab (each side's numbers + same/different verdict
  with the delta). Plan-adherence pairs/planned (ruling 2) rides the
  same unit - same plumbing.
- A5B: extend the picker to template + block builders (after A5 proves the
  pattern in live sessions)
- A3 curation skim: the 29 secondary-less compounds the validator surfaced
  (content pass, not urgent; A5's lifting-subset filter already handles the
  category question mechanically)
- T4 motion (last unstarted U5 unit) - needs a frontier-seat design pass first
- T3C sprite loader upgrade: BLOCKED on Seth's Gemini frames landing in
  claudefiledrop/ (art direction + prompts settled July 6, see HANDOFF)
- (U11 "what's new" candidate PROMOTED into the L-wave July 5 and shipped
  as L5. Kept here as a pointer only.)
- (prod-migrate-l1-l3-prep.md task file DELETED July 7: Seth applied both
  prod migrations by hand July 6, verified with real checksums - the
  bundle-prep task was moot before dispatch; Cursor's
  `origin/cursor/prod-migrate-l1-l3-prep-0b4a` branch is likewise
  redundant, deletable whenever.)

## Landed

- LANDED eeaa30c | a6b-exercise-id-backfill.md | idempotent dry-run-default
  backfill script stamping exerciseId/userExerciseId onto historical
  Template/Session/BlockWorkoutExercise rows | scope exact (1 file); dry-run
  against staging re-run fresh twice, identical both times, all three tables
  report zero null-identity rows (A4's write-path stamping already covers
  current staging data); assertSafeForReset guard + --apply-gating verified
  by direct grep, not just the delivery report; --apply not run anywhere per
  RUN RULES
- LANDED c7c8ca6 | a5-exercise-picker.md | GET /exercises/search (pure
  searchCatalog module, no Prisma/fs) + live-session typeahead writing
  exerciseId/userExerciseId on commit; free text stays first-class | scope
  exact (11 files, matches FILES TO TOUCH); full suite re-run fresh 185/185
  (not the 129-unit number alone - see the attribution-fix note below for
  why the full run mattered here); searchCatalog fixture tests independently
  read, not just trusted - all 5 pin real behavior (exact>prefix>substring,
  userExercise-before-catalog, alias with matchedAlias, stretching-category
  exclusion, limit); purity grep clean; no portal; no hex in CSS diff
- LANDED 0d2118e | (no task block - Sonnet direct, direct-fix exception) |
  fixed a real A4 regression surfaced while auditing A5/A6b: attribution.js's
  source check only matched "userExercise", never learned the
  "userExerciseId" tier A4 added to resolve.js/enrichSet.js, so any session
  exercise resolved via stored id (the normal case post-A4) silently got
  zero muscle attribution | root-caused by tracing resolve.js -> enrichSet.js
  -> attribution.js after `exercises.integration.test.js`'s custom-exercise
  analytics test failed on the first full suite run since staging's
  migration made the tier reachable; one-line fix, diagnosis was the bulk of
  the work so shipped directly per the stated exception rather than a
  Cursor diagnosis-block round trip; not in A5/A6b's FILES TO TOUCH, kept as
  its own commit
- LANDED 0743070 | a4-exercise-fk-linkage.md | nullable exerciseId/
  userExerciseId on TemplateExercise/SessionExercise/BlockWorkoutExercise
  (+ at-most-one CHECK), blockWorkoutSetId groundwork on WorkoutSet,
  write-path stamping helper (catalog beats userExercise, mirrors
  resolveExercise tier order), resolve.js gains a stored-userExerciseId
  tier ahead of name resolution | scope exact (13 files, matches FILES TO
  TOUCH); unit lane 124/124 + prisma validate re-run fresh; migration SQL
  verified 7 ADD COLUMN / 7 indexes / 7 SET-NULL FKs / 3 CHECK, no DROP/
  NOT NULL/DEFAULT; schema types match the block's exact spec (String? on
  Exercise FK, Int? on UserExercise FK - L3's wrong-FK-type lesson
  avoided); analyticsController id-selection precedence spot-checked
  against existing exerciseName derivation (sessionExercise ?? template
  Exercise ?? null) - identical shape; integration lane written (4 tests)
  but NOT run per the block's sequencing flag; migration NOT applied to
  any environment yet - staging needs A1's catalog migration + seed first
  (choreography below)
- LANDED 3a6bc25 | (A1, no task block - Fable direct) | Exercise catalog
  table + idempotent dbHostGuard-protected seed, reconciled from
  exercise-catalog-seed with re-timestamped migration | branch
  catalog-fk-wave; unit 119/119 + prisma validate green; migration NOT
  applied anywhere yet (wave choreography above)
- LANDED 73becdc | t3b-coldstart-lifter-loader.md | cold-start boot loader
  (the sole `tone="page"` LoadingState) swaps the breathing ring for the
  accent-tinted pixel lifter doing slow reps - mask-tint idiom, asymmetric
  rep motion + lockout glow, reduced-motion static fallback | MERGED TO
  MAIN `3767840`; deliberate placeholder pending the Gemini sprite upgrade
- LANDED c0d37fb | (no task block - Seth-directed Fable direct, off-queue) | resume-workout hero clears immediately after finishing: completeSession/deleteSession dispatch sessions:changed, ActiveSessionContext applies the completion/deletion locally (string-compared ids) then re-fetches | 2 files (sessionApi.js, ActiveSessionContext.jsx), disjoint from all L-wave units; verified end-to-end via Playwright (local server on staging DB): finish -> home shows Start hero + saved flash + workout in Recents with no poll wait; rides the combined smoke + pre-main review
- LANDED 3a530a7 | (no task block - Seth-directed Fable direct, off-queue) | logged-out first-open goes straight to /login instead of holding on the boot spinner while a cold server answers /auth/me: no stored authToken -> immediate redirect; /login self-heals valid-cookie/cleared-storage by bouncing signed-in users onward; definitive /auth/me 401 clears the dead token | 3 files (ProtectedRoute.jsx, AuthContext.jsx, LoginPage.jsx); verified end-to-end via Playwright: fresh profile -> instant /login, logout -> instant /login, logged-in reload + /login visit both land on the dashboard
- LANDED 33d613d | l5-whats-new-visuals.md | patch-notes visual treatment: hero accent band (gradient wash + 3px top rule), small-caps accent section headers with left bars, diamond list markers, overlay-fade + 12px card-rise entrance at --motion-base, reduced-motion opt-out, mobile bottom-sheet, pinned footer outside scroll; archive cards reuse the treatment | landed July 6 (Fable audited); scope exact (4 files); build + unit 119/119 fresh; zero hex in added CSS, motion/color tokens verified defined; whatsnew gate/storage/data untouched (seen-key single-hit confirmed); WhatsNewContent split into presentation subcomponents; visual sign-off deferred to Seth's combined smoke (4 palettes x 2 modes, 360px)
- LANDED 62b3ec2 | l4-custom-exercise-ui.md | "Add to library" sheet: portal overlay (start-workout-picker z-80 tier), prefilled name, 17-muscle tap-chip picker (off -> Main -> Assists), live summary line, already-tracked guard, interactive "Not tracked - add?" pill in live sessions only; success invalidates + re-resolves so the indicator flips without reload | landed July 6 (Fable audited); scope exact (4 files, FILES TO TOUCH match); unit 119/119 + client build re-run fresh; no hex (0 matches in 207-line CSS diff), all 10 referenced tokens verified defined; client muscle constant verified 17/17 identical to server catalog-derived vocabulary (getMuscles fetch doubles as availability check - accepted, block itself prescribed the client-side grouping constant); manual contract deferred to Seth's combined smoke
- LANDED fbb054b | l3-custom-exercises-server.md | UserExercise schema + CRUD + engine resolver/attribution overlay | landed July 5, scope exact (12 files); one accepted deviation: userId String not the block's Int (User.id is String cuid - the block's snippet was a wrong FK); unit lane 119/119, purity grep clean, integration tests written but NOT run (migration gate); UserExercise migration applied + verified on staging July 6 (Seth, RUNBOOK, same precedent as L1) after the review caught the same code-ahead-of-DB sequencing flag as L1
- LANDED cac5999 | l6-logging-focus-interruptions.md | draft-row focus handoff on set promotion + server-echo resync suppression + layout-stable tracked-pill slot + reps step fix | landed July 5, clean delivery (2 files); same-wave follow-ups fixed directly: wheel-scroll decimal bug 4d82311 (onWheel blur on both number inputs), residual promotion glitch ae49cbe (div-vs-Fragment branch type change remounted the draft row - unified shell + stable slot key; L6's rAF refocus hack removed as dead)
- LANDED 3f7fe14 | (A6, no task block - Fable direct) | colloquial-name alias layer: 92 curated vendored aliases + rationale doc + guarded plural fold; alias tier in resolveExercise (exerciseId > exact name > alias) | unit lane 111/111 (8 new tests incl. the 10-name smoke list pinned 10/10); integration lane deliberately NOT run (endpoint untouched, avoids wiping staging smoke accounts pre-sign-off); no client change, no schema, no migration
- LANDED ef4ac98 | l2b-tracked-indicator-visibility.md | tracked/untracked glyph becomes labeled status pills ("Tracked" / "Not tracked") on the exercise heading | scope exact (2 files), client build green, server unit 103/103 (no server touch), package.json byte-identical, no new hex (success-token family + existing color-mix pattern); labels present as JSX text children (grep for literal `>Tracked<` found nothing since that's compiled-HTML shape, not JSX source - verified by direct read instead, same precedent as N1's tryNavigate); pill moved out of the muted meta span per spec
- LANDED 4ae0fbf | l1-unilateral-side-logging.md | nullable WorkoutSet.side ("L"/"R"); exercises named "single" (or L/R toggle) log sets as Left/Right pairs, Right weight autofills from Left on blur (one-way, one-time, no focus steal); set-count/add/remove operate on pairs | scope exact (6 files), server unit 103/103 + client build green pre-migration, then migration applied to staging (Seth, RUNBOOK) and independently re-verified: `prisma migrate status` clean (13 migrations, no drift), full `npm test` 16/143 green including the side-round-trip integration test for real; reviewer flag caught pre-deploy: side is unconditionally in every create-set call, so deploying before the migration would break ALL set logging app-wide, not just per-side (sharper version of the June 8 code-ahead-of-DB incident) - migration landed first, no incident
- LANDED f66f9ea | l2-tracked-exercise-indicator.md | POST /exercises/resolve (batched, authRequired) + quiet check/hollow-circle indicator next to exercise headings, live + completed sessions | scope exact (6 files), server unit 103/103, client build green, integration 3/3 (401/400/happy path) re-run fresh; no client-side catalog duplication (the one grep hit is a pre-existing unrelated smartWorkoutName.js helper, not touched by this diff); package.json byte-identical, no new hex; module-level resolution cache + post-commit re-resolve verified by diff read
- LANDED f5767f8 | n3-analytics-subviews.md | analytics page reorg: persistent header (chips + StatTiles) + page-level Muscles\|Strength\|Execution segmented control via ?view= param; DataQuality always renders last | scope exact (3 files), build green, no hex, fetch effect deps unchanged ([weeks] only - confirmed by grep), package.json/other analytics/ files untouched; ?view=bogus and absent both default to muscles per spec
- LANDED 4dcd829 | n2-profile-hub.md | Profile becomes identity header (avatar/name/member-since) + stat strip (workouts/this week/week streak) + drill-in Appearance/Security/Feedback sub-routes | scope exact (9 files), build green, no hex, package.json byte-identical; profileStats.js weekStreak/countThisWeek contract verified 5/5 by direct node eval; sub-pages confirmed verbatim extractions (same classes/api calls) against pre-N2 ProfilePage.jsx; copy fix "Help improve LogChamp." present, old string gone; parseReviewerEmails centralized, Navbar diff is import-swap only
- LANDED b366e17 | n1b-mobile-chrome-fix.md | scene band lifted flush above tab bar; mobile top bar removed (Home masthead + page-title standardization); resume bar as frosted pill above tabs; empty-wrap phantom strip fixed | scope exact (5 files), build green, no hex, no new deps; reviewer fix: session-sticky-top mobile override was dead (placed before the base rule, same specificity - source order decides), relocated after it; block's own placement spec caused it, not a Cursor error
- LANDED d266242 | n1-bottom-tab-bar.md | mobile bottom tab bar (Home/Analytics/History/Library/Profile) + slim top bar; desktop nav unchanged; shared useGuardedNav hook | on branch ui-nav-overhaul (not main/staging-pointed yet); scope exact match, build green, no hex, no new deps, guard logic consolidated to one file; one acceptance-criterion string (literal `tryNavigate` grep hit in Navbar.jsx) didn't literally match since Navbar only needs `guardedClick` - substantive intent (single guard location, zero behavior change) verified independently, not bounced
- LANDED de03801 | t3-dynamic-loading-screens.md | animated soft-tone (pulsing three-dot indicator) + page-tone (breathing accent ring, cross-faded label/slowLabel swap) + slowLabel="Waking up the server..." wired onto all 10 LoadingState call sites | on branch ui-loading-screens (not main/staging yet); review clean - scope exact, hook/props untouched, no hex, no new deps, build green; timing skeleton (useDelayedReveal) built directly by Claude Code same session, block covered visual/animation layer only
- LANDED d21608c | u10-home-hero-dead-space.md | home layout fix (align-content: start) + weekly-report set-count formatting | Cursor ran U10/U8/U9 in ONE working tree (against the serialized-dispatch plan) - reviewed and committed together; reviewer added the rounded-delta tone fix
- LANDED d21608c | u8-volume-trend-strength-sparklines.md | volume Bars|Trend|Table small multiples + strength e1RM sparklines | reviewer fixes: sparkline dots as non-scaling round-cap strokes (circles stretched to ellipses under preserveAspectRatio=none), single-session dot centered + no duplicate value, mvt last-week label moved to a fixed third grid column (was overflowing the card edge)
- LANDED d21608c | u9-execution-legibility-balance-polish.md | execution verdict + planned-vs-did line; balance zone band + ghost tracks | reviewer fixes: weight formatting in formatPlanActual failed the block's own acceptance string ("100.0 lbs" vs "100 lbs"), newsy verdict clauses now outrank on-plan filler, sub-rep effort drift no longer reads "stopped ~0 reps early"

- LANDED f22989d | u7-home-weekly-report.md | weekly report band on Home (last-7-days vs prior-7-days, under the hero) | review clean (build re-run, no-hex grep, sessions endpoint unlimited); Seth smoked it July 3 on staging - band accepted, two layout/formatting critiques spun off as U10
- LANDED c7acb43 | b9-analytics-time-series.md | weekly volume series + per-session e1RM series + execution planned/actual summaries | reviewer tightened the inclusive-end bucket assertion; 103/103 unit lane
- LANDED 00c67dc | b8-rpe-effort-pooling.md | RPE pooled with RIR as one effort signal engine-wide
- LANDED d4b1d72 | u6-weight-unit-pref.md | lbs/kg display pref in log prefs + analytics
