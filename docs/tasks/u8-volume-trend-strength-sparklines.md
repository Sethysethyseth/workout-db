# TASK U8: volume trend view + strength sparklines

STATUS: QUEUED
MODEL: fable
MODE: 1-relay (AnalyticsPage + index.css overlap with U7/U9 - never parallel)

CONTEXT:
Seth's July 3 critique: volume-by-muscle should offer a time view, and
strength trends should ingest the full session history instead of only
first-vs-latest. B9 (landed `c7acb43`) added the data: each `perMuscle`
row carries `series[]` (one bucket per week, `{ weekStart, weekEnd,
effectiveSets, stimulatingSets }`, ISO dates, oldest first, zero-weeks
present as `effectiveSets: 0` / `stimulatingSets: null`), and each
`perExercise` entry carries `e1rmSeries[]` (`{ performedAt, epley }`, one
point per session = that session's max epley, ascending). This unit is
client-only. Seth critiques the visuals after it ships - favor the
existing chart language (emphasis form: context marks neutral, the
headline metric wears the palette accent; direct value labels; the
`chart-tip-host`/`data-tip` tooltip pattern; `chart-legend` keys).

FILES TO TOUCH:
- client/src/components/analytics/ChartTableToggle.jsx    (generalize to N options)
- client/src/components/analytics/MuscleVolumeTrend.jsx   (new - weekly small multiples)
- client/src/components/analytics/StrengthTrendChart.jsx  (dumbbell -> sparklines)
- client/src/pages/AnalyticsPage.jsx                      (wire the third view)
- client/src/index.css                                    (new classes, tokens only)
Do NOT modify anything outside these files.

CHANGE:

### 1. ChartTableToggle -> generalized segmented toggle
Add an optional `options` prop: `[{ value, label }]`, defaulting to
`[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]`
so both existing call sites keep working unmodified. Keep the
`range-chip view-chip` classes and aria behavior.

### 2. Volume card: Bars | Trend | Table
`PerMuscleSection` gets `options` `Bars | Trend | Table` (values `chart`,
`trend`, `table`; default stays `chart`). `Bars` and `Table` render
exactly what they do today.

`Trend` renders the new `MuscleVolumeTrend`:
- Small multiples: one row per muscle (same sort as the bars view -
  `effectiveSets` desc), each row a mini weekly column chart built from
  `series[]`: one column per week, all rows sharing ONE y-scale (max
  weekly `effectiveSets` across all muscles, via the existing `niceScale`
  helper in `client/src/lib/chartScale.js`) so rows are comparable.
- Column encoding matches the bars-view language: full column =
  `effectiveSets` (neutral context tone), inner/overlay column =
  `stimulatingSets` (palette accent) when non-null. Zero weeks render as
  an empty slot on the baseline (the gap IS the information); do not
  interpolate.
- Direct value label on the LAST week's column only (1 decimal); every
  week is reachable via the row-level `chart-tip-host` `data-tip`
  (e.g. "chest - wk of Jun 22: 4.5 effective / 3.1 stimulating").
- One shared x-caption under the grid: short month-day of the first and
  last `weekStart` (e.g. "May 12" ... "Jun 30"). No per-column tick labels
  (12 columns would collide on phones).
- DOM columns (flex/grid spans like the existing `mv-bar` marks), not an
  SVG chart lib. No dependencies.

### 3. Strength card: sparklines replace the dumbbell plot
Rework `StrengthTrendChart`'s chart view (the Table view in
`PerExerciseSection` is untouched - it remains the raw-data screen):
- One row per exercise (keep current sort: delta desc). Row head keeps
  the name + delta chip + the matched-effort line exactly as today, with
  ONE change: the delta chip and the "trend" it summarizes must be derived
  from `e1rmSeries` ENDPOINTS (`last.epley - first.epley`), NOT from
  `e1rmTrend`. Reason (bake into a comment): `e1rmTrend.first/latest` are
  raw first/last SET values while `e1rmSeries` points are session maxes -
  they can disagree, and the chip must describe the drawn line.
- The plot: an inline SVG polyline through `e1rmSeries` (x = performedAt,
  linear time scale; y = epley), per-row INDEPENDENT y-scale padded so the
  line breathes (exercises differ wildly in absolute e1RM - a shared axis
  wastes the resolution; the printed numbers carry the absolute values).
  Small dots on every session point; the LATEST dot wears the accent
  (emphasis form), earlier dots neutral.
- Printed values at the line's ends: first epley left, latest epley right
  (formatted via the existing `formatWeight`/`loadWeightUnit` pattern) -
  the numbers are the dependable channel, never color alone.
- Single-session exercises (series length 1): one accent dot + value +
  the existing "1 session" chip. Empty series: keep the existing
  not-enough-data row treatment.
- Keep the row-level `chart-tip-host`/`aria-label` summary (update its
  text to first -> latest from the series, including session count).
- Remove the now-dead shared-axis/dumbbell code (`st-axis`, `st-connector`,
  `st-dot--context` etc.) and their CSS if nothing else uses them.
- SVG colors via CSS custom properties / `currentColor` only - the line
  must recolor across all 4 palettes x 2 modes for free.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- No new dependencies; no hex colors in new CSS/SVG (tokens/color-mix/
  currentColor only).
- ChartTableToggle default renders identically at both existing call
  sites (Execution card untouched and still compiles against it).
- Volume Trend view: a muscle whose `series` has an all-zero week renders
  an empty baseline slot for it; rows share one y-scale; last column
  carries a printed value.
- Strength sparkline: delta chip value === `round`-free difference of
  `e1rmSeries` endpoints; first/latest printed values match
  `e1rmSeries[0].epley` / last entry; latest dot uses the accent class;
  a series of length 1 renders the single-dot variant.
- Table views of both cards render byte-identical to before.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
