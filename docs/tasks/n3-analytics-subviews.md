# TASK N3: Analytics sub-views (Muscles | Strength | Execution)

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Third unit of the N-wave (dispatch AFTER N2 lands - all N units touch
`client/src/index.css`; do not combine units). The analytics page is six
stacked cards in one long scroll. It becomes: a persistent header (title,
range chips, stat tiles) + a page-level segmented control that swaps the
body between three lenses. Pure page reorganization - the section
components themselves (PerMuscleSection, PerExerciseSection,
ExecutionSection, BalanceSection, DataQualitySection, StatTiles) keep
their internals, and the per-card Bars|Trend|Table toggles stay as-is.
No engine or server changes.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx
- client/src/components/analytics/AnalyticsViewTabs.jsx  (NEW - segmented
                                                          control)
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:

1. **View model.** Three sub-views:
   - `muscles`   -> PerMuscleSection + BalanceSection
   - `strength`  -> PerExerciseSection
   - `execution` -> ExecutionSection
   DataQualitySection renders on ALL views, always last (it is the honesty
   contract - it never hides). Persistent above the tabs, on every view:
   the h1 + intro, the range chips, and StatTiles. The global empty-state
   card (no logged sets in range) replaces the tabs + body entirely,
   exactly as it replaces the content today.

2. **URL state.** Sub-view lives in the query string: `?view=muscles |
   strength | execution` via `useSearchParams`. Default and any
   unknown/absent value -> `muscles`. Switching views calls
   `setSearchParams` with `{ replace: true }` (tabs shouldn't spam
   history), and preserves nothing else (the range preset stays component
   state as today). Deep-loading `/analytics?view=strength` must render
   the strength view directly. Switching views must NOT refetch - the
   summary is fetched once per range exactly as today, and the existing
   `is-refreshing` dim behavior on range change is preserved (wrap tabs +
   body in the same `analytics-content` wrapper the content uses now).

3. **`AnalyticsViewTabs` component.** A page-level segmented control, three
   equal cells labeled Muscles / Strength / Execution. Follow
   `ChartTableToggle.jsx`'s accessibility pattern (same aria approach,
   adapted labels) but style it as its own `analytics-view-tabs` block:
   full-width on mobile, visually heavier than the per-card chip toggles
   so the hierarchy reads page-lens vs card-view. Active cell derives from
   `--color-interactive` via `color-mix` (same recipe as `.range-chip
   .is-active` / `.links a.active`); tokens only, no hex. Keep motion to a
   background/color transition at existing `--motion-fast` timing - no
   sliding indicator.

4. **AnalyticsPage restructure.** Keep every constant (HOW_* copy,
   RANGE_PRESETS, rangeForWeeks, formatWeight, all cell components) and the
   fetch effect untouched. Only the returned JSX reorganizes: header block,
   range chips, error/loading exactly as now; then inside the non-empty
   branch: StatTiles, AnalyticsViewTabs, the active view's sections,
   DataQualitySection. Section components receive the same props as today.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from client/ compiles with no errors.
- `/analytics` (no param) renders StatTiles + tabs + PerMuscleSection +
  BalanceSection + DataQualitySection and does NOT render
  PerExerciseSection/ExecutionSection.
- `/analytics?view=strength` deep-load renders PerExerciseSection (+ tiles,
  tabs, data quality) and neither muscle section.
- `/analytics?view=bogus` renders the muscles view.
- Switching tabs triggers no network call (the fetch effect's dependency
  array still contains only `weeks`); changing a range chip refetches and
  the selected view is unchanged afterward.
- The empty-range state renders the single empty card with no tabs.
- No new hex colors in changed CSS; `client/package.json` byte-identical;
  no changes to any file under `client/src/components/analytics/` except
  the new AnalyticsViewTabs.jsx.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
