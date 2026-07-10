# TASK N3: Exercises tab - lookup shell + detail view (client for N5)

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

> N-WAVE NOTE: unit N3 of `docs/specs/analytics-ui-rebalance.md`. Distinct
> from the June nav-wave file `n3-analytics-subviews.md` - unrelated, do
> not open. DEPENDS ON N5 (its endpoints) and runs AFTER N7 (shares
> `AnalyticsPage.jsx`) - do not start before both land.

CONTEXT:
The 4th analytics view: an alphabetical, searchable, ALL-TIME exercise
lookup ("find my exercise, see its stats") opening an inline detail whose
hero is the rep-target calculator. NOT a ranked e1RM leaderboard - a
leaderboard is the scoreboard this wave moves away from.

FILES TO TOUCH:
- client/src/api/analyticsApi.js       (getExerciseIndex, getExerciseDetail)
- client/src/components/analytics/AnalyticsViewTabs.jsx (4th tab)
- client/src/pages/AnalyticsPage.jsx   (view wiring, param-merge fix)
- client/src/components/analytics/ExercisesView.jsx (NEW + child components
  in the same file or siblings under client/src/components/analytics/)
- client/src/index.css                 (tabs grid 3->4, list/detail styles)
Do NOT modify anything outside these files.

CHANGE:

1. **API:** `getExerciseIndex()` -> `/analytics/exercises`;
   `getExerciseDetail({ exerciseId, userExerciseId, from, to })` ->
   `/analytics/exercise?...` (exactly one identity param), following
   `getSummary`'s http.js pattern.
2. **Tabs + routing.** Add `exercises` to `ANALYTICS_VIEWS`,
   `parseAnalyticsView`, and `VIEW_OPTIONS` - order
   `muscles | strength | exercises | execution`. **Two mechanical traps
   (named by the July 9 F-test audit, both mandatory):**
   (a) `.analytics-view-tabs` hardcodes `repeat(3, minmax(0, 1fr))`
   (index.css ~line 5320) - becomes 4; all four labels must fit a 360px
   viewport untruncated (Execution is the long one; shrink font size
   before allowing wrap).
   (b) `setView` calls `setSearchParams({ view: nextView })` which
   CLOBBERS every other query param - make it a merge (read current
   params, spread, set). The new `exercise=` param must survive
   range-chip clicks and view changes must not drop unrelated params.
3. **ExercisesView (list):** roster from `getExerciseIndex` (all-time,
   fetch once per mount - the range chips do NOT refetch or filter the
   roster). Alphabetical; substring filter via a search input (match the
   existing input idiom); each row: name, "last trained Xd ago",
   session count. Selecting a row opens the detail INLINE (single-page
   expand, settled decision) and writes `?view=exercises&exercise=<id>`
   (prefix or param distinguishing catalog vs user exercise id).
   Deep link `?view=exercises&exercise=...` restores the open detail on
   load. Empty state (no logged exercises ever) is actionable per F-test
   item 4: names the action and links to the logging flow.
4. **Detail panel** (consumes `getExerciseDetail`; range param follows the
   page's active range chips; roster stays all-time):
   - Totals row (sessions / sets / effective / stimulating-or-locked).
   - **Rep-target table as the HERO** - the actionable payoff. Each
     ladder row: `{reps} reps -> {roundToPlate + formatWeight}(weight)`;
     rows with `extrapolated: true` get a muted lower-confidence
     treatment + one shared footnote ("outside your logged rep range");
     whole card labeled an estimate ("estimated from your best set" +
     `HowCalculatedButton` in the existing HOW_* voice). Card hidden in
     favor of an honest unlock line when `repTargets` is null.
   - Top-sets list (<=5, `formatWeight` x reps, dates).
   - Weekly-volume mini chart + matched-effort trend + e1RM history
     sparkline as SUPPORTING detail (reuse existing chart idioms - no new
     chart library, no new colors outside tokens).
   - Every metric has an insufficient-data state.
   - A visible SLOT (styled container, honest "PR detection coming"
     note) for future PR/milestone callouts - the full-history work lands
     here later; don't retrofit.
5. Touch-first: rows/targets >= 44px; detail legible at 360px.

ACCEPTANCE CRITERIA (machine-checkable):
- `?view=exercises` deep-links; `?view=exercises&exercise=...` restores
  the open detail; the exercise param survives range-chip clicks (grep:
  no bare `setSearchParams({ view` call remains).
- Roster is stable across range-chip changes (no index refetch on range
  change - verifiable by effect deps) and is not e1RM-gated.
- 4 tabs fit 360px untruncated (visual check at phone width).
- Rep-target rows render plate-rounded values via `roundToPlate` (grep
  import), extrapolated rows visually distinct + footnoted.
- Both empty states (no exercises ever / no data in range for detail)
  actionable, not bare "no data".
- Client `npm run build` green; no hex in CSS diff; no new dependencies.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
