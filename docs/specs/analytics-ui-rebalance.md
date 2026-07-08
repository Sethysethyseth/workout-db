# Analytics UI rebalance — spec + wave skeleton (N-wave)

> Authored by Fable, July 8 2026, from a design session with Seth; amended
> by Opus same day after a data audit + a second design pass with Seth. This
> is the contract source for the N-wave. Opus lifts units N1–N5 into task
> blocks (`cursor-task-block-template.md`, unit-scale variant) — the
> contracts below are written to transfer nearly verbatim. Do not start N5
> without re-reading its security note.
>
> **Opus amendment (July 8) — what the data audit changed vs. Fable's v1:**
> (1) `perExercise[].bestSet` is selected by highest *Epley e1RM*, NOT by
> weight (`aggregate.js:154-170`) — so "Top set" cannot reuse it honestly;
> the engine gets a real `topSet` (heaviest weight). (2) Per-set effort unit
> IS stored (`WorkoutSet.rir` + `.rpe`, kept through `enrichSet`), so N1 can
> be honest per-set — no "dominant unit" guess needed, but the aggregation
> must serialize the unit through. (3) Volume headline is ADAPTIVE, not
> always-stimulating. (4) Exercise pool is all-time via N5, so N3 is a shell
> dependent on N5, not standalone. (5) e1RM is reframed as the *engine* for
> an actionable rep-target calculator (N5), not a standalone scoreboard.
> Net sequencing: N1 and N2 each carry a small engine tail — the wave is NOT
> "client-only through N4."
>
> **Project-direction context (not this wave):** effort logging (RIR/RPE)
> becomes REQUIRED in the wave AFTER this one, with in-app user education.
> That is why the volume headline is adaptive here — it converges to
> stimulating automatically as the mandate takes hold. See the
> `effort-logging-becoming-mandatory` memory.

## Problem statement (Seth, verbatim intent)

e1RM was built as *an addition* but reads as *the entire theme* of
analytics: "Best lift" and "Top gain" on both the Home "This week" card and
the analytics StatTiles are e1RM-derived, and the Strength tab is framed
top-to-bottom around e1RM. Meanwhile stimulating sets/week — the actual
differentiator — is under-promoted. Goals:

1. The user looks at their stats and *understands them* — real numbers
   first, estimates clearly labeled as estimates.
2. e1RM gets its own dedicated home instead of leaking into every surface.
3. A ranked estimated-1RM list + an exercise lookup ("see this exercise's
   stats as a whole"), both pooled ONLY from exercises the user has done.
4. RIR/RPE neutrality: copy mostly says "RIR or RPE" already, but value
   displays hardcode RIR (`@ 2 RIR`). Keep the display neutral.

## Design decisions (settled — do not re-litigate in blocks)

- **"Best lift" → "Top set" = heaviest weight actually lifted** (Seth,
  settled). NOT `perExercise[].bestSet` (that is the highest-e1RM set, a
  different thing). The engine gains a true `topSet` (max weight; tie-break
  higher reps) — see N2. Display `weight × reps`, sub = exercise name. Real
  data in headline positions; estimates demoted.
- **"Top gain" stays** but matched-effort-first (already implemented in
  `pickTopGain`) with the e1RM fallback explicitly labeled "estimated".
- **Volume headline is ADAPTIVE** (Opus decision): stimulating sets/wk leads
  when effort coverage is sufficient (`meta.effortCoverage`); when coverage
  is low, effective sets/wk is promoted back to the headline and stimulating
  shows as the locked aspiration. Rationale: stimulating is the
  differentiator and deserves the headline, but it is null without effort
  data — an always-stimulating headline would show "—" to the exact
  beginner we want to hook. Adaptive is forward-compatible with the coming
  mandatory-effort direction: as coverage rises it converges to stimulating
  with no rework. The "log RIR or RPE to unlock" treatment stays for the
  low-coverage state.
- **e1RM is reframed from scoreboard to engine.** Seth's original complaint
  is that e1RM reads as a lonely displayed number. The fix is not just to
  move that number to its own tab — it is to make e1RM the *hidden input* to
  an actionable **rep-target calculator**: pick an exercise you've logged →
  see estimated working weights for 1/3/5/8/10/12 reps derived from your own
  best e1RM (invert Epley: `weight = e1rm / (1 + reps/30)`). This is the
  understandable, "easy UI" product; the raw e1RM number is supporting
  detail. Lives in the N5 exercise detail. This is the truest expression of
  "an addition, not the theme."
- **New 4th analytics view: "Exercises"** (`view=exercises`). Contains the
  exercise lookup → whole-exercise detail (totals, top sets, weekly volume,
  matched-effort trend, e1RM history, and the rep-target calculator). Pool =
  ALL-TIME, identity-resolved exercises the user has performed (Opus
  decision — see below), NOT range-scoped and NOT e1RM-gated. Resolved via
  the summary engine's identity tiers (exerciseId → userExerciseId → legacy
  name-match; A4/A6 name-resolution robustness is a standing product ask).
  The all-time index requires N5 server support, so N3 ships as a shell on
  top of it.
  - *Pool decision rationale:* a list whose membership changes when you flip
    the 4/8/12-week chips is confusing ("where did my deadlift go?"). For a
    lookup tool the roster must be stable; the range applies to the *stats
    shown for a selected exercise*, not to whether the exercise appears.
    Also: `perExercise` only contains exercises with a computable e1RM, so
    building the pool from it silently drops bodyweight/isometric movements
    — another reason the real pool is an N5 server concern.
- **Strength tab reframes around progression:** matched-effort trend is
  the headline metric, top-set progression the concrete evidence; e1RM
  columns/framing move OUT (a footnote link points at the Exercises tab).
  The tab keeps its chart/table toggle pattern.
- **Effort neutrality is DISPLAY-LAYER ONLY.** The engine's internal
  RIR normalization (RIR = 10 − RPE) is load-bearing and does not change.
  One shared client formatter decides how a concrete effort value renders;
  labels use the word "effort" where either unit may apply.
- Tab order: `muscles | strength | exercises | execution`. Deep links via
  the existing `?view=` param pattern (`parseAnalyticsView`).
- Anti-goals hold: no new chart libraries, tokens-only styling, ~150–250ms
  motion restraint, insufficient-data warnings on every new metric
  (standing product ask).

## Unit breakdown

Sequencing: N1 → N2 → N4 → (N5 → N3). N1 and N2 each carry a SMALL engine
serialization/compute tail (not client-only — see each). N4 is genuinely
client-only. N3 depends on N5's server data, so N5 lands first and N3 is its
client shell. N1 and N4 have disjoint files and may run back-to-back before
one audit; N2 must land before the StatTiles work it feeds.

### N1 — Effort-neutral display layer (client + small engine serialization)

- New `client/src/lib/effortDisplay.js`: `formatEffort({ rir, rpe }, userPref)`.
  Per-set unit is HONEST, not guessed: `WorkoutSet` stores both `rir` and
  `rpe` and `enrichSet` keeps both (`input.rir` / `input.rpe`). Resolver:
  show the unit the set actually logged (RPE if `rpe != null`, else RIR);
  when a value arrives without its origin unit, fall back to the user's
  `useRIR`/`useRPE` pref, then RIR. No "dominant unit" heuristic.
- **Engine tail:** `aggregate.js` currently serializes only `bestSet.rir`
  (drops `rpe`), and `matchedEffortTrend` surfaces `rir` only. Add the
  companion unit through so the client can render honestly — carry `rpe`
  (or an explicit `effortUnit`) alongside every effort value the summary
  exposes. Keep `effortRir` as the internal normalized value; do not change
  the RIR = 10 − RPE math.
- Sweep value-position usages: `MatchedEffortCell` (`@ {rir} RIR`),
  StatTiles/WeeklyReport top-gain subs (`@ X RIR`), `EffortDriftCell` /
  `EffortDriftCompact` (`+N RIR`). Label copy ("RIR or RPE") is already
  neutral — leave the HOW_* strings alone except where they present RIR
  as the only unit of display.
- Acceptance: no hardcoded "RIR" string in a *value* position outside
  `effortDisplay.js`; unit-lane test for the engine serialization; client
  formatter checked via grep + build + visual (client has no test lane).

### N2 — Headline stat rebalance (client + small engine `topSet`)

Files: `server/src/analytics/aggregate.js` (+ `summary.js` serialization),
`client/src/components/analytics/StatTiles.jsx`,
`client/src/components/analytics/WeeklyReport.jsx`, shared helpers in
`client/src/lib/` as needed.

- **Engine tail (do this first):** in `aggregateExerciseMetrics`, compute a
  true `topSet = { weight, reps, performedAt }` = the set with max
  `input.weight` (tie-break higher `input.reps`), independent of e1RM and
  independent of the `validSets` e1RM filter (so it exists even when e1RM is
  null — e.g. weight logged, effort/ reps edge cases). Serialize it in
  `summary.js` next to `bestSet`. Fixture test.
- Both surfaces: **Top set** tile replaces **Best lift** — value
  `{weight} × {reps}` from the new `topSet` (NOT `bestSet`); sub = exercise
  name; the winning exercise is the one whose `topSet.weight` is highest.
  e1RM appears nowhere on these tiles except the labeled top-gain fallback.
- Volume headline is ADAPTIVE (see design decisions): compute effort
  coverage; stimulating/wk leads when sufficient, else effective/wk is
  promoted and stimulating shows locked. Define the coverage threshold in
  the block (start ~0.6; single named constant).
- StatTiles order: [adaptive volume headline] → [the other volume metric,
  support] → Top set → Top gain. WeeklyReport: Workouts → Sets → Top set →
  Top gain (workouts/sets comparison mechanics unchanged).
- Insufficient-data states preserved exactly (— / "not enough data" /
  unlock copy).
- Acceptance: no `e1rm` read anywhere in StatTiles/WeeklyReport except the
  top-gain fallback path; `topSet` never reflects an e1RM-selected set;
  tiles render across all 8 palette×mode combos (tokens only).

### N3 — Exercises tab client shell (depends on N5)

Files: `AnalyticsViewTabs.jsx`, `AnalyticsPage.jsx`, new
`client/src/components/analytics/ExercisesView.jsx` (+ children).

Lands AFTER N5 so it consumes the all-time exercise index + detail endpoint.

- Add `exercises` to `ANALYTICS_VIEWS` + tabs + `parseAnalyticsView`
  (tab order: `muscles | strength | exercises | execution`).
- Alphabetical, searchable list of the user's all-time exercises (from N5's
  index). Substring filter. This is the lookup — "find my exercise, see its
  stats." NOT a ranked e1RM leaderboard (a leaderboard is just the scoreboard
  we're moving away from). Selecting an exercise opens the N5 detail inline.
- Empty state honest copy for a user with no logged exercises.
- Acceptance: `?view=exercises` deep-links; roster is stable across range-
  chip changes (all-time); list membership is not e1RM-gated; empty state
  present.

### N4 — Strength tab rework (client-only)

Files: `AnalyticsPage.jsx` (`PerExerciseSection`),
`StrengthTrendChart.jsx`.

- Reframe: headline = matched-effort trend (the honest metric per the
  StatTiles design note), evidence = top-set progression (first vs latest
  actual best set). Table columns: Exercise | Top set | Top-set trend |
  Matched effort. e1RM columns removed; footer link "Estimated 1RM has
  its own view →" (`?view=exercises`).
- `StrengthTrendChart` re-anchors to the same metrics (matched-effort
  where unlocked, top-set weight otherwise) — dataviz skill applies when
  the implementing block touches the chart.
- Copy: intro sub no longer leads with "Estimated 1RM".
- Acceptance: no e1RM value rendered in the strength view; unlock/
  insufficient-data states for matched effort preserved.

### N5 — Exercise detail: server endpoint + client detail view

The only server unit. **Security surface: cross-user isolation — this
endpoint is a standing Fable-escalation trigger; its shape is fixed here
precisely so the block is mechanical.**

- `GET /api/analytics/exercise?exerciseId=…|userExerciseId=…&from=&to=`
  in `analyticsController.js`. Data access MUST follow the existing
  summary pattern: sets reached only through sessions scoped
  `{ userId, performedAt }` — the `findMany` where-clause is THE
  isolation point (reviewed + confirmed July 4). No new Prisma imports
  into `server/src/analytics/` — controller fetches, engine computes.
- Two endpoints (or one endpoint + an index mode):
  1. **All-time exercise index** — the roster N3's list needs: every
     identity-resolved exercise the user has logged, all-time, NOT e1RM-
     gated (bodyweight/isometric movements included). `{ identity, name,
     lastPerformed, sessionCount }` per row.
  2. **Exercise detail** — `?exerciseId=…|userExerciseId=…&from=&to=`.
- New pure module `server/src/analytics/exerciseDetail.js` (fixture-
  tested, no DB): given the user's enriched sets for one resolved
  exercise identity → `{ identity, totals: { sessions, sets,
  effectiveSets, stimulatingSets|null }, topSet, topSets[≤5], bestE1rm,
  e1rmHistory[{date, e1rm}], matchedEffortTrend, weeklyVolume[{weekStart,
  effectiveSets, stimulatingSets|null}], repTargets }`. Reuse `resolve.js`,
  `enrichSet.js`, `setMetrics.js`, `matchedEffort.js` — no formula
  duplication.
- **Rep-target calculator** (`repTargets`): from the exercise's best e1RM,
  invert Epley for a fixed rep ladder (1/3/5/8/10/12) →
  `[{ reps, weight }]`. HONESTY: (a) null when no computable e1RM; (b) flag
  which targets extrapolate beyond the user's logged rep range (Epley
  degrades far from trained reps) — carry `loggedRepRange: { min, max }` so
  the client can mark out-of-range targets as lower-confidence; (c) label
  the whole card an estimate. v1 uses Epley for consistency with existing
  e1RM; a per-user fitted load-rep curve is a v2 note, not scope.
- Identity resolution mirrors the summary engine's tiers so legacy
  name-only rows still aggregate with resolved rows for the same exercise.
- Client (in N3's shell): detail panel — totals row, the **rep-target
  table as the hero** (this is the actionable "easy UI" payoff), top-sets
  list, weekly-volume mini chart, matched-effort trend, e1RM history
  sparkline as supporting detail. Every metric with an insufficient-data
  state. Design a visible SLOT for future PR/milestone callouts (PR
  detection is not built — honesty note — but the coming full-history work
  lands here; don't retrofit).
- Data access MUST follow the existing summary pattern: sets reached only
  through sessions scoped `{ userId, performedAt }` — the `findMany`
  where-clause is THE isolation point (reviewed + confirmed July 4). No new
  Prisma imports into `server/src/analytics/` — controller fetches, engine
  computes. Applies to BOTH the index and the detail query.
- Acceptance: unit-lane tests for `exerciseDetail.js` (fixtures incl.
  RPE-logged sets, no-effort sets, legacy name-matched rows, bodyweight/no-
  e1RM rows, rep-target extrapolation flags); isolation test or explicit
  reviewed assertion that neither query can return another user's sets;
  client renders honest empty states.

## Decisions settled July 8 (2nd pass)

- **Top set = heaviest weight lifted** (Seth). Engine `topSet`, N2.
- **Volume headline = adaptive** (Opus call, Seth deferred). N2.
- **Exercise pool = all-time, identity-resolved, not e1RM-gated** (Opus
  call, Seth deferred). N5 index, N3 shell.
- **Detail view = inline expand within the Exercises tab** (Opus default;
  matches the current single-page analytics, less nav weight = easier UI).
- **Rep-target calculator is IN** (Seth), as the hero of the N5 detail
  view; e1RM becomes its engine rather than a standalone number.
- **e1RM ranked leaderboard is OUT** — the Exercises list is an
  alphabetical searchable lookup, not a scoreboard.

## Still open / to confirm with Seth

1. Rep ladder for the calculator: proposed 1/3/5/8/10/12. Add 15/20 for
   hypertrophy-range lifters, or keep it tight?
2. Coverage threshold for the adaptive volume headline (proposed ~0.6) —
   tune after seeing it on real data.
3. Whether N4's Strength tab and the N5 Exercises detail overlap enough
   that Strength should eventually fold into Exercises. Not for this wave;
   flag for post-N review.
