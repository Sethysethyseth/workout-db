# TASK U7: weekly report band on Home

STATUS: QUEUED
MODEL: fable
MODE: 1-relay (index.css + AnalyticsPage overlap with U8/U9 - never parallel)

CONTEXT:
Seth's decision (July 3): the "fun stats" idea from the analytics KPI tiles
becomes a weekly report that lives on the HOME screen (`DashboardPage`),
under the start-workout hero, so users see cool stats on login. It is a
fixed last-7-days vs prior-7-days comparison - it does NOT follow the
analytics page's range chips. Client-only; the `/api/analytics/summary`
endpoint and the sessions list already provide everything.

FILES TO TOUCH:
- client/src/components/analytics/WeeklyReport.jsx   (new)
- client/src/pages/DashboardPage.jsx                 (mount the band)
- client/src/components/analytics/StatTiles.jsx      (extract pickTopGain, see below)
- client/src/lib/topGain.js                          (new - the extracted helper)
- client/src/lib/dateOnly.js                         (new - extracted toDateOnlyString)
- client/src/pages/AnalyticsPage.jsx                 (ONLY the one-line import swap for toDateOnlyString)
- client/src/index.css                               (new classes, tokens only)
Do NOT modify anything outside these files.

CHANGE:

### Extractions (no behavior change)
- Move `toDateOnlyString` from `AnalyticsPage.jsx` into
  `client/src/lib/dateOnly.js`; AnalyticsPage imports it. Nothing else in
  AnalyticsPage changes.
- Move `pickTopGain` from `StatTiles.jsx` into `client/src/lib/topGain.js`
  (verbatim - matched-effort gains outrank raw e1RM gains regardless of
  size); StatTiles imports it. Nothing else in StatTiles changes.

### WeeklyReport component
`<WeeklyReport />`, self-fetching, mounted in `DashboardPage` directly
below the hero (both the `ActiveWorkoutHero` and `StartWorkoutHero`
branches) and above the Recent workouts section.

Data - two `analyticsApi.getSummary` calls in parallel (`Promise.all`),
date-only strings via `toDateOnlyString`, non-overlapping windows:
- current week: `from = today - 6 days`, `to = today` (7 calendar days;
  the endpoint treats date-only `to` as inclusive end-of-day)
- prior week:   `from = today - 13 days`, `to = today - 7 days`
Note: for a 7-day range the engine's `weeks` is 1, so each `perMuscle`
row's `effectiveSets` is already the raw weekly total - sum across rows
without multiplying anything.

Stats shown (one compact card, a single row of small stats - visually
LIGHTER than the analytics KPI tiles; this is a greeting, not a dashboard):
1. **Workouts** - count of sessions with `completedAt` inside the current
   window, from the `useActiveSession()` context's `sessions` list (no new
   fetch). Delta vs the prior window ("+1 vs last week").
2. **Sets** - sum of `perMuscle[].effectiveSets` (current), delta vs prior,
   shown to 1 decimal.
3. **Best lift** - max `bestSet.e1rm.epley` across `perExercise` (current
   window) with exercise name; weight formatted via the existing
   `loadWeightUnit()` display-only pattern (`client/src/lib/weightUnitPref.js`).
4. **Top gain** - `pickTopGain(perExercise)` on the current window; value
   `+X.X <unit>` with name; matched-effort sub when honest (same treatment
   as the analytics Top gain tile).

Header: title "This week" + a quiet "See analytics ->" link to `/analytics`
(right-aligned, same visual weight as the Recent workouts "View all" link).

States:
- Both windows empty -> render NOTHING (the hero already owns the
  cold-start CTA; don't stack empty cards).
- Current has data -> full band. Deltas need the prior window; when prior
  is empty show "first week tracked" instead of deltas.
- Current empty but prior has data -> single-line nudge card: title stays,
  body "No workouts yet this week - last week you logged N." (N = prior
  workouts count).
- Fetch error -> render nothing (Home must never break on analytics
  problems); `console.error` is fine, no visible error state.
- While loading -> render nothing (the band appears when ready; do not
  reserve jumping placeholder space).

Deltas styling: positive gets the existing `stat-tile-value--up` green
treatment; negative/zero renders muted (no red - the report celebrates,
it never shames). Insufficient-data cases always say WHY in muted small
text (e.g. "not enough data"), matching the analytics honesty pattern.

CSS: tokens only (no hardcoded colors - all 4 palettes x 2 modes must
work). Derive any accent states from `--color-interactive` via `color-mix`
like the range chips do. Reuse `card` chrome; new classes under a
`weekly-report-` prefix. No animation beyond existing card transitions.
Do NOT use `card--live` (reserved: live in-progress workout only).
Must be responsive: the stat row wraps on narrow phones (flex-wrap, same
approach as `analytics-kpis`).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `grep` shows no hex colors in the new CSS block (tokens/color-mix only).
- WeeklyReport issues exactly two summary requests with the specified
  non-overlapping windows (verify the from/to math: current from =
  today-6d, prior = [today-13d, today-7d]).
- AnalyticsPage and StatTiles behavior unchanged (import swaps only -
  their rendered output is byte-identical).
- All four states above are reachable by the described conditions (code
  review verifiable: the branches exist and match).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
