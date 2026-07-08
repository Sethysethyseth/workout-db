# Analytics UI rebalance — spec + wave skeleton (N-wave)

> Authored by Fable, July 8 2026, from a design session with Seth. This is
> the contract source for the N-wave. Opus lifts units N1–N5 into task
> blocks (`cursor-task-block-template.md`, unit-scale variant) — the
> contracts below are written to transfer nearly verbatim. Do not start N5
> without re-reading its security note.

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

- **"Best lift" → "Top set"** on both surfaces: the heaviest *actual* set
  in range (`weight × reps`, from `perExercise[].bestSet` which already
  exists). Real data in headline positions; estimates demoted.
- **"Top gain" stays** but matched-effort-first (already implemented in
  `pickTopGain`) with the e1RM fallback explicitly labeled "estimated".
- **Stimulating sets become the headline volume number**; effective sets
  become the supporting/sub number. Applies to StatTiles ordering and the
  muscles-tab framing. The locked-state ("log RIR or RPE to unlock")
  treatment stays.
- **New 4th analytics view: "Exercises"** (`view=exercises`). Contains:
  (a) the ranked Estimated-1RM card (this is e1RM's new home), and
  (b) exercise lookup → whole-exercise detail. Pool = exercises the user
  has performed in ANY range (not just the selected window), resolved via
  the same identity tiers as the summary engine (exerciseId →
  userExerciseId → legacy name-match; A4/A6 name-resolution robustness is
  a standing product ask).
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

Sequencing: N1 → N2 → N3 → N4 → N5. N1–N4 are client-only (no schema, no
migrations). N5 adds one server endpoint. N2 and N3 have disjoint files
and may run back-to-back before one audit.

### N1 — Effort-neutral display layer (client-only, small)

- New `client/src/lib/effortDisplay.js`: `formatEffort(value, unit)` and
  a resolver that picks the display unit from what the user actually logs
  (the set/exercise's own logged unit when known; otherwise the user's
  dominant logged unit; fall back to RIR). If per-set logged-unit data is
  not exposed to the client today, the v1 resolver may use the dominant
  unit only — note it as an accepted limitation in the block.
- Sweep value-position usages: `MatchedEffortCell` (`@ {rir} RIR`),
  StatTiles/WeeklyReport top-gain subs (`@ X RIR`), `EffortDriftCell` /
  `EffortDriftCompact` (`+N RIR`). Label copy ("RIR or RPE") is already
  neutral — leave the HOW_* strings alone except where they present RIR
  as the only unit of display.
- Acceptance: no hardcoded "RIR" string in a *value* position outside
  `effortDisplay.js`; unit tests for the formatter (client has no test
  lane — acceptance via grep + build + visual).

### N2 — Headline stat rebalance (client-only)

Files: `client/src/components/analytics/StatTiles.jsx`,
`client/src/components/analytics/WeeklyReport.jsx`, shared helpers in
`client/src/lib/` as needed.

- Both surfaces: **Top set** tile replaces **Best lift** — value
  `{weight} × {reps}` from the max-weight `bestSet` across `perExercise`;
  sub = exercise name. e1RM appears nowhere on these tiles except the
  labeled top-gain fallback ("estimated").
- StatTiles order: Stimulating/wk (headline) → Sets/wk (support, keep
  its sub) → Top set → Top gain. WeeklyReport: Workouts → Sets →
  Top set → Top gain (workouts/sets comparison mechanics unchanged).
- Insufficient-data states preserved exactly (— / "not enough data" /
  unlock copy).
- Acceptance: no `e1rm` read anywhere in StatTiles/WeeklyReport except
  the top-gain fallback path; tiles render across all 8 palette×mode
  combos untouched (tokens only).

### N3 — Exercises tab shell + Estimated-1RM ranked list (client-only)

Files: `AnalyticsViewTabs.jsx`, `AnalyticsPage.jsx`, new
`client/src/components/analytics/ExercisesView.jsx` (+ children).

- Add `exercises` to `ANALYTICS_VIEWS` + tabs + `parseAnalyticsView`.
- Ranked "Estimated 1RM" card: rows from `summary.perExercise` where
  `bestSet.e1rm.epley != null`, sorted desc; row = name, e1RM value
  (labeled "estimated"), e1rmTrend delta. Range chips apply as elsewhere.
  This card is e1RM's new home — the HOW_BEST_E1RM explainer moves here.
- Client-side filter/search input over the user's exercise list (simple
  substring over `perExercise[].name` for v1; N5 upgrades the data
  source). Selecting a row expands or routes to the detail (stub until
  N5 — show existing per-exercise summary fields).
- Acceptance: `?view=exercises` deep-links; list contains ONLY exercises
  present in the user's data; empty state has honest copy.

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
- New pure module `server/src/analytics/exerciseDetail.js` (fixture-
  tested, no DB): given the user's enriched sets for one resolved
  exercise identity → `{ identity, totals: { sessions, sets,
  effectiveSets, stimulatingSets|null }, bestSet, topSets[≤5],
  e1rmHistory[{date, e1rm}], matchedEffortTrend, weeklyVolume[{weekStart,
  effectiveSets, stimulatingSets|null}] }`. Reuse `resolve.js`,
  `enrichSet.js`, `setMetrics.js`, `matchedEffort.js` — no formula
  duplication.
- Identity resolution mirrors the summary engine's tiers so legacy
  name-only rows still aggregate with resolved rows for the same
  exercise.
- Client: detail panel inside the Exercises tab (N3's stub becomes
  real): totals row, weekly-volume mini chart, top-sets list, e1RM
  history sparkline, matched-effort trend — every metric with an
  insufficient-data state.
- Acceptance: unit-lane tests for `exerciseDetail.js` (fixtures incl.
  RPE-logged sets, no-effort sets, legacy name-matched rows); isolation
  test or explicit reviewed assertion that the query cannot return
  another user's sets; client renders honest empty states.

## Open questions for Seth (settle before N3/N5 dispatch; N1/N2 unblocked)

1. Exercises-tab pool window: all-time (recommended — "exercises I've
   done", period) vs. the selected range only. All-time needs the summary
   or N5 endpoint to expose an all-time exercise index; range-only is
   free but the list mutates as chips change.
2. Detail view presentation: inline expand within the tab (recommended,
   matches current single-page analytics) vs. a routed subpage.
3. Does "popular" mean sorted by e1RM (current contract) with a
   session-count secondary sort, or frequency-first? Contract says
   e1RM-ranked for the 1RM card; the *search* list is alphabetical.
