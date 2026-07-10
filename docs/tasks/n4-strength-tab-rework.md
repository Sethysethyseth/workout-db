# TASK N4: Strength tab rework (progression-first, mock-signed sparklines)

STATUS: QUEUED (FABLE-DIRECT - not for Cursor dispatch)
MODEL: fable
MODE: 1-relay

> N-WAVE NOTE: unit N4 of `docs/specs/analytics-ui-rebalance.md`.
> FABLE-DIRECT: judgment-heavy visual unit implemented by Fable in Claude
> Code (the July 9 mock sign-off is the spec). Block kept for the contract
> record + audit criteria. DEPENDS ON N1 (formatters) and N2 (`topSet`).
> Collides with N7 on `AnalyticsPage.jsx` - strictly sequential with it.

CONTEXT:
The Strength tab is framed top-to-bottom around e1RM. Reframe: headline =
matched-effort trend (honest metric), evidence = top-set progression (real
weights). e1RM moves out entirely (footnote link to the Exercises tab).
Sparklines re-anchor from decimal e1RM values to whole-number top-set
weights per the signed-off mark spec.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx    (PerExerciseSection: table columns, sub copy, footer link)
- client/src/components/analytics/StrengthTrendChart.jsx (series + mark spec)
- client/src/index.css                  (sparkline mark styles)
Do NOT modify anything outside these files.

CHANGE:

1. **PerExerciseSection (table view):** columns become
   `Exercise | Top set | Top-set trend | Matched effort`.
   - Top set: `formatWeight(topSet.weight) × reps` (N2's engine field).
   - Top-set trend: first vs latest session top-set weight over the range
     (computed client-side from the series in (2); "+20 lbs" form, "not
     enough data" under 2 sessions).
   - Matched effort: existing `MatchedEffortCell` (N1-neutralized).
   - e1RM columns REMOVED. Card footer link: "Estimated 1RM has its own
     view →" navigating to `?view=exercises` (until N3 lands that view
     falls back to muscles via `parseAnalyticsView` - acceptable, ships
     before N3 by design).
   - Intro sub no longer leads with "Estimated 1RM"; matched-effort-first
     copy, same voice.
2. **StrengthTrendChart:** plotted series = N2's `topSetSeries`
   (per-session heaviest set - added to the engine in N2 precisely so
   this unit stays client-only). Rows with an empty `topSetSeries` keep
   the "not enough data" row treatment. The table's Top-set trend column
   uses the same series endpoints. Delta chip = last minus first top-set
   weight, via
   `formatWeight` whole numbers ("225 → 245", never decimal e1RM), plus
   the top set itself as context ("+20 lbs · top set 245 × 3").
   - **Mark spec (implement as drawn in the July 9 mock):** 2px accent
     line, round join/cap; area wash under the line at
     `color-mix(in srgb, var(--chart-accent) 10%, transparent)`;
     latest-point end dot ~9px with a 2px surface-color ring; plot height
     40px (up from 28). Single series per row -> no legend box; flanking
     first/last endpoint values are the labels. Keep the zero-length
     round-cap dot technique under `preserveAspectRatio="none"`.
3. Sort stays delta-desc; rows with a single session keep the "1 session"
   treatment; unlock/insufficient-data states for matched effort preserved.

ACCEPTANCE CRITERIA:
- Grep: no e1RM value rendered anywhere in the strength view
  (`PerExerciseSection` + `StrengthTrendChart`); `HOW_BEST_E1RM` usage
  gone from the strength table header.
- Sparkline marks match the spec (2px line, 10% wash, ringed ~9px end
  dot, 40px height) - verified against the mock artifact.
- Endpoint labels and delta chips are whole numbers via `formatWeight`.
- Footer link navigates to `?view=exercises`.
- Client `npm run build` green; no hex in the CSS diff (tokens/color-mix
  only); `prefers-reduced-motion` behavior unchanged.
- All 8 palette x mode combos render correctly (accent-derived marks only).

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
