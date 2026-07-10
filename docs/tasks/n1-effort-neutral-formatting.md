# TASK N1: Effort-neutral display + number-formatting layer

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

> N-WAVE NOTE: this is unit N1 of the analytics UI rebalance
> (`docs/specs/analytics-ui-rebalance.md`). Distinct from the June nav-wave
> file `n1-bottom-tab-bar.md` - unrelated unit, do not open it.

CONTEXT:
First unit of the N-wave - every downstream unit consumes these formatters.
Today four components each define a local `formatWeight` that prints
"225.0 lbs" (F-test item 1 failure), e1RM prints with false decimal
precision (item 2), and effort values hardcode "RIR" in value positions
even for RPE-logged sets (item 3). This unit creates the two shared client
formatting modules, sweeps the four analytics components onto them, and
adds a small engine serialization tail so effort values arrive with their
origin unit.

FILES TO TOUCH:
- client/src/lib/weightDisplay.js        (NEW - weight/estimate formatting + plate rounding)
- client/src/lib/effortDisplay.js        (NEW - effort value formatting)
- client/src/pages/AnalyticsPage.jsx     (drop local formatWeight; effort cells)
- client/src/components/analytics/StatTiles.jsx        (drop formatWeightValue/formatRir)
- client/src/components/analytics/WeeklyReport.jsx     (drop formatWeight/formatRir)
- client/src/components/analytics/StrengthTrendChart.jsx (drop formatWeight/formatRir)
- server/src/analytics/aggregate.js      (bestSet serializes rpe alongside rir)
- server/src/analytics/matchedEffort.js  (trend gains effortUnit)
- server/test/analytics/                 (extend aggregate + matchedEffort fixtures)
Do NOT modify anything outside these files.

CHANGE:

1. **`client/src/lib/weightDisplay.js`** (new). Follow the accessor-module
   doc style of `weightUnitPref.js`. Exports:
   - `formatWeight(n, unit = loadWeightUnit())` -> string. Strips a
     trailing `.0` but keeps meaningful halves: `225 -> "225 lbs"`,
     `102.5 -> "102.5 lbs"`. Never converts values (display-label only,
     same doctrine as `weightUnitPref.js`).
   - `formatEstimate(n, unit = loadWeightUnit())` -> rounds to a whole
     unit FIRST, then formats: `287.34 -> "287 lbs"`. Every displayed
     e1RM goes through this (estimate precision, F-test item 2).
   - `roundToPlate(n, unit)` -> number rounded to the nearest loadable
     increment: 2.5 for "lbs", 1.25 for "kg". Named constants
     `PLATE_INCREMENT_LBS = 2.5`, `PLATE_INCREMENT_KG = 1.25` (single
     source - N5's rep targets consume this). Examples:
     `roundToPlate(183.7, "lbs") === 182.5`, `roundToPlate(61.1, "kg") === 61.25`.
   Import `loadWeightUnit` from `weightUnitPref.js`; keep all functions
   pure given their args so the contract is node-eval checkable.

2. **`client/src/lib/effortDisplay.js`** (new). Exports:
   - `formatEffortValue(n)` -> integer stays integer, fractional keeps one
     decimal (absorbs the duplicated local `formatRir` copies).
   - `formatEffort({ rir, rpe, effortUnit })` -> `"2 RIR"` or `"8 RPE"`.
     Unit resolution, in order: explicit `effortUnit` ("rir"|"rpe") wins;
     else the value's own logged unit (`rpe != null` -> RPE, shown as-is;
     else `rir != null` -> RIR); else RIR. When rendering RPE from a
     normalized RIR value (matched-effort trend), convert for display:
     `rpe = 10 - rir`. NOTE (settled deviation from the spec's N1 text):
     there is no user-level useRIR/useRPE pref - those are template flags
     not present in the summary payload - so the pref fallback tier is
     dropped; the resolver above is the whole chain.

3. **Sweep the four components** onto the shared modules (imports replace
   local definitions - delete every local `formatWeight`, `formatWeightValue`,
   `formatRir`):
   - `AnalyticsPage.jsx`: `MatchedEffortCell` renders
     `@ {formatEffort({ rir: trend.rir, effortUnit: trend.effortUnit })}`;
     `EffortDriftCell` / `EffortDriftCompact` keep their drift semantics but
     any literal "RIR" in a VALUE position goes through `formatEffort`
     (planned-vs-actual drift is RIR-normalized by the engine, so
     `effortUnit: "rir"` is correct there); e1RM cells in the strength
     table render via `formatEstimate`.
   - `StatTiles.jsx`: Best-lift value via `formatEstimate` (it is an e1RM);
     top-gain sub effort via `formatEffort`. Do NOT restructure tiles -
     that is N2.
   - `WeeklyReport.jsx`: same treatment; `formatSetCount` stays local (it
     formats set counts, not weights).
   - `StrengthTrendChart.jsx`: sparkline endpoint labels/tooltips via
     `formatEstimate` (values are e1RM), matched-effort line via
     `formatEffort`. Do NOT change the mark/geometry code - that is N4.
   Label copy ("RIR or RPE", HOW_* strings) stays untouched.

4. **Engine tail** (display-layer honesty only; the RIR = 10 - rpe
   normalization math does NOT change):
   - `aggregate.js`: `bestSet` currently serializes `rir` only - add
     `rpe: bestSetEnriched.input.rpe` beside it.
   - `matchedEffort.js`: `computeMatchedEffortTrend` gains
     `effortUnit: "rpe"` when EVERY contributing set in the chosen bucket
     was RPE-only-logged (`input.rpe != null && input.rir == null`), else
     `"rir"`. The bucket key stays the derived `input.effortRir` - policy
     unchanged.
   - `summary.js` spreads these through automatically - verify, don't
     rewrite.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, including new/extended fixture
  cases: (a) an RPE-only bucket yields `effortUnit: "rpe"`; (b) a mixed
  bucket yields `effortUnit: "rir"`; (c) `bestSet` carries both `rir` and
  `rpe` for an RPE-logged best set.
- Grep: zero local `formatWeight`/`formatWeightValue`/`formatRir` function
  definitions remain in the four swept components (imports only).
- Grep: no hardcoded `RIR` inside a template-literal/JSX value position in
  the swept components outside `effortDisplay.js` (label copy and HOW_*
  strings exempt).
- Node eval (pure args): `formatWeight(225, "lbs") === "225 lbs"`;
  `formatWeight(102.5, "lbs") === "102.5 lbs"`;
  `formatEstimate(287.34, "lbs") === "287 lbs"`;
  `roundToPlate(183.7, "lbs") === 182.5`; `roundToPlate(61.1, "kg") === 61.25`.
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
