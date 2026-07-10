# TASK N7: Muscles view - volume heatmap + table de-noise + 2W day preset

STATUS: QUEUED (FABLE-DIRECT - not for Cursor dispatch)
MODEL: fable
MODE: 1-relay

> N-WAVE NOTE: unit N7 of `docs/specs/analytics-ui-rebalance.md`. All three
> changes SIGNED OFF by Seth via the July 9 mock artifact ("LogChamp -
> Analytics chart-form proposals") - implement as drawn. FABLE-DIRECT
> (dataviz-method unit: ramp validation is part of the work). DEPENDS ON
> N1 (formatters) + N2 (adaptive-metric constant). Collides with N4 on
> `AnalyticsPage.jsx` - strictly sequential with it.

CONTEXT:
The weekly small-multiples Trend view fails two dataviz anti-patterns
(unreadable micro-marks; one shared scale burying low-volume muscles) and
the Table view drowns values in repeated unlock sentences. Trend becomes a
binned volume heatmap; the Table gets de-noised; a new 2-week preset
renders DAY granularity (the honest non-weekly-split answer - shows actual
training rhythm, assumes nothing).

FILES TO TOUCH:
- client/src/components/analytics/MuscleVolumeTrend.jsx (replaced by the heatmap component; file may be renamed/replaced)
- client/src/pages/AnalyticsPage.jsx   (RANGE_PRESETS 2/4/8/12, Trend wiring, table de-noise)
- server/src/analytics/aggregate.js    (parametrized week|day bucketing)
- server/src/analytics/summary.js      (serialize the day series for short ranges)
- server/test/analytics/               (both bucket modes fixture-tested)
- client/src/index.css                 (heatmap styles, table alignment)
Do NOT modify anything outside these files.

CHANGE:

1. **Engine tail:** parametrize the per-muscle series bucketing (week|day).
   Granularity DERIVES FROM THE RANGE - never a second knob: ranges <= 2
   weeks serialize a day series (14 cells), longer ranges keep weekly.
   Sets/week stays the only volume denominator anywhere (custom bucket
   lengths were REJECTED July 9 - do not re-litigate); day cells are raw
   per-day volumes, the avg column stays per-week.
2. **Heatmap (replaces the small multiples):** rows = muscles sorted by
   volume desc; columns = periods; cell = the volume headline metric
   (stimulating when coverage >= the N2 threshold, else effective -
   reuse `EFFORT_COVERAGE_HEADLINE_THRESHOLD`) binned into 4 steps;
   one printed number per row = avg/wk at the right.
   - **Ramp, tokens-only + VALIDATED:** steps via
     `color-mix(in srgb, var(--chart-accent) P%, var(--color-surface-2))`;
     start champ-validated P = 50/67/84/100 (light), 40/60/80/100 (dark);
     run the dataviz `validate_palette.js --ordinal` check for EVERY
     palette x mode and adjust per-mode P constants until the worst
     palette passes (iron light is the known risk). Paste validator
     output in the delivery evidence.
   - **Empty cell = faint neutral** (`color-mix` off `--color-border`),
     deliberately NOT ramp step 1 - "didn't train" must never read as
     "trained a little" - and legend-keyed "not trained".
   - Hover/focus tooltip per cell with exact numbers; weekly cells
     (>=25px) keep per-cell focus; ~9px day cells are NOT individual
     focus targets (tooltips there are desktop enhancement; mobile reads
     the avg column + Table twin - F-test item 5 holds: nothing is
     hover-gated because the Table twin always carries every value).
3. **Range presets:** `RANGE_PRESETS` becomes 2/4/8/12 weeks. Ripple
   check: StatTiles/headline math at 2 weeks stays honest (averages over
   2 weeks, comparison copy unchanged); WeeklyReport untouched.
4. **Table de-noise (as drawn):** numeric columns right-aligned with
   `tabular-nums`; locked stimulating cells = em-dash with ONE footnote
   under the table (per-cell unlock sentences removed); "Last trained"
   compact ("3d") with warn-text tint at >= 14 days (not before - don't
   punish 10-day cycles); "?" explainer buttons leave the column headers
   (the card sub already carries them).
5. Bars view and its value labels unchanged.

ACCEPTANCE CRITERIA:
- `npm run test:unit` green; fixtures for BOTH bucket modes (day series =
  14 cells for a 2-week range; weekly series unchanged for 4/8/12).
- Heatmap renders both granularities from the range chips alone (no new
  control/knob) - 2W = day cells, 4/8/12 = week cells.
- Ramp validator output pasted per palette x mode, all passing.
- Empty cell != ramp step 1 visually AND keyed separately in the legend.
- Grep: no unlock sentence inside table cells; numeric columns
  right-aligned `tabular-nums`; recency tint threshold exactly 14d.
- Tooltips + Table twin carry every value (nothing hover-only).
- Client `npm run build` green; no hex in CSS diff; motion within the
  existing chart-grow pattern; all 8 palette x mode combos pass.

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
