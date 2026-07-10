# TASK N6: Frontier polish (actionable empty states, range persistence, KPI deep-links)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

> N-WAVE NOTE: unit N6 of `docs/specs/analytics-ui-rebalance.md`. Runs
> LAST - its tile deep-links need N3/N5 in place. It is also the F-test's
> cleanup net: anything an earlier unit's audit flagged as "N6" lands
> here. Do not start before N3 lands.

CONTEXT:
The detail-level F-test failures that belong to no earlier unit's files:
the page empty state is a bare sentence on the product's sell page, the
range choice forgets itself every visit, and KPI tiles are dead ends when
a destination now exists.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx   (two-variant empty state, range pref wiring)
- client/src/lib/analyticsRangePref.js (NEW - device-local range accessor)
- client/src/components/analytics/StatTiles.jsx (tile tap-through)
- client/src/index.css                 (tile link/focus treatment)
Do NOT modify anything outside these files.

CHANGE:

1. **Page empty state - two distinct variants, same card** (F-test item 4:
   every empty state names what to do and links there):
   (a) genuinely new user (N5 all-time index is empty) -> warm copy +
   a "Log your first workout" CTA linking to the logging flow. Honest,
   not cheerleading.
   (b) data exists but not in range (index non-empty + summary empty) ->
   "No sets in the last N weeks - try a longer range" with the range
   chips as the implied action.
   The index fetch for the distinction rides N3's `getExerciseIndex`
   wiring; do not add a new endpoint.
2. **Range persistence:** `analyticsRangePref.js` in the exact
   `weightUnitPref.js` accessor pattern - localStorage key
   `workoutdb-analytics-weeks`, valid values 2|4|8|12, default 4
   (`loadAnalyticsWeeks` / `saveAnalyticsWeeks`). `AnalyticsPage` seeds
   `weeks` state from it and saves on chip click. URL is NOT the channel
   (range is a lens, not an address - settled); the accessor pattern
   keeps account-level promotion a one-swap change later.
3. **KPI tile tap-through where a destination exists:** Top set and Top
   gain tiles link to the winning exercise's detail
   (`?view=exercises&exercise=...` - the identity param N3 established);
   the volume headline tile links to `?view=muscles`. Whole tile is the
   target (>= 44px), visible `:focus-visible` ring, hover treatment via
   the existing `--color-interactive` color-mix pattern (rings/nav-active
   idiom). Tiles with no data render exactly as today - never dead links.

ACCEPTANCE CRITERIA (machine-checkable):
- Both empty-state variants reachable and correct (new-user vs
  out-of-range detection per the index/summary emptiness matrix).
- Range survives a reload (verify via the localStorage key); invalid
  stored values fall back to 4.
- Tile links carry the right identity param; no-data tiles are not links
  (grep: conditional wrapper, no `href`/`to` on the empty branch).
- Targets >= 44px; focus-visible ring present; hover via
  `--color-interactive` color-mix (no new colors outside tokens - no hex
  in CSS diff).
- Client `npm run build` green.

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
