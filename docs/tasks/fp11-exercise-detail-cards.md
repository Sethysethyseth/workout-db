# TASK FP11: Exercise detail - dedupe Top sets, and give the three stat cards a hierarchy

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

SEQUENCING: dispatch ONLY after BOTH FP9 and FP10 have landed. This unit
shares `ExercisesView.jsx` with FP9 and `index.css` with FP10 - it collides
with both and must be serialized behind them.

CONTEXT:
Smoke finding (Seth, July 20 staging drive): on the Analytics > Exercises
detail panel, "the working weight targets and top sets have a similar
problem to the home screen PR issue - the UX isn't very pleasing and it's
quite plain." Recon confirmed one genuine DEFECT alongside the presentation
gap.

**The defect - Top sets shows duplicates and collides React keys.**
`buildExerciseDetail` (`server/src/analytics/exerciseDetail.js:213-223`)
takes ALL weighted sets, sorts by heaviest / higher reps / newer, and slices
5 (`MAX_TOP_SETS = 5` at `:150`) with no dedupe. Three working sets of
220x5 in one session therefore occupy three of the five slots. Worse, the
client key is `` `${ts.performedAt}-${ts.weight}` ``
(`ExercisesView.jsx:422`) with reps omitted - so those rows produce
DUPLICATE REACT KEYS, a console warning today and a reconciliation hazard.
Seth's screenshot shows `220 lbs x 5` twice and `210 lbs x 5` twice in a
five-row list: four of five rows conveying two facts.

The three cards in scope render as: a two-column bare `data-table`
(Working weight targets, `:301-348`), a flat `ul` of text rows (Top sets,
`:415-433`), and a label/value/date list (Personal records, `:257-298`).
All correct, all inert.

Note FP9 has already fixed the SEMANTICS of the Personal records e1RM row
(an estimate must not render as a performed set). This unit does the VISUAL
work on that card and must not regress FP9's contract.

FILES TO TOUCH:
- server/src/analytics/exerciseDetail.js   (Top sets dedupe only)
- server/test/analytics/exerciseDetail.test.js
- client/src/components/analytics/ExercisesView.jsx
- client/src/index.css
Do NOT modify anything outside these files.

CHANGE:

**1. Dedupe Top sets at the engine (the defect).**

A "top set" is an ACHIEVEMENT, not an occurrence. Dedupe by the
`(weight, reps)` pair before slicing to `MAX_TOP_SETS`, so the list shows
five DISTINCT best sets rather than five rows that may describe two.

When the same `(weight, reps)` was performed more than once, keep the
**earliest** `performedAt` - the date you first achieved it. This matches
the record vocabulary `computeStandingPRs` already established in
`prs.js` (first achievement, not most recent repetition). Do not change the
existing sort order, `MAX_TOP_SETS`, or which sets are eligible - dedupe
only.

**2. Fix the React key.**

Include reps in the key at `ExercisesView.jsx:422`. Even with dedupe in
place the key must be genuinely unique - defence in depth, since the engine
and the component can drift.

**3. Presentation - the three cards.**

Same brief as FP10, same restraint: "between too much and too simple."
Give each card a visual anchor and an internal rank using vocabulary the
design system ALREADY has. Inventory of what exists, use it rather than
inventing:

- `Meter` / `.meter` / `.meter-fill` / `.meter-target` (`Meter.jsx:7-19`,
  `index.css:6274-6297`) - horizontal track with an optional target hairline
- `ex-weekly-volume-bar` (`index.css:6669-6704`) - small proportional bars
  already used on this very panel
- `.session-set-pr-chip` (`index.css:6768-6780`) - the PR badge
- `st-delta` / `--up` and the `--color-success-*` family for positive deltas
- `.pill` / `.range-chip` / `.view-chip` families for compact labels

Direction per card - the SHAPE is the contract, the styling detail is yours:

- **Working weight targets**: the rows form a natural ladder (heavier at
  fewer reps). Make that relationship legible instead of a bare two-column
  table - the numbers should read as one curve, not seven unrelated facts.
  The `ex-rep-target-row--extrapolated` muted treatment for out-of-range
  rows and the "Muted rows are outside your logged rep range." footnote MUST
  survive with their meaning intact.
- **Top sets**: after dedupe these are five genuine achievements. Rank them
  visually - the top set is the headline, the rest supporting - and keep the
  date subordinate.
- **Personal records**: three rows of different KINDS (Weight, e1RM, Reps).
  Make the kind legible at a glance. The e1RM row is an ESTIMATE and must
  keep reading as one per FP9 - do not flatten it back into the same shape
  as the two performed-set rows.

**4. Constraints that are not negotiable.**

- **Tokens only.** No hardcoded hex. All 4 palettes x light/dark.
  Accent-adjacent states derive from `--color-interactive` via `color-mix`.
- **Do NOT use `card--live`** - it means a live in-progress workout and
  nothing else (`index.css:5062-5081`).
- **Chart emphasis doctrine** (`index.css:5670-5677`): one accent series per
  chart, context marks stay neutral. Do not introduce a second accent ramp.
- **Every existing empty / unlock state survives**: Top sets "not enough
  data" (`:417-418`); rep targets unlock copy when `repTargets === null`
  (`:305-313`); the PR card and stimulating/e1RM unlock states on the same
  panel (`:257-275`, `:404-408`, `:82-83`). An exercise with one session
  must still degrade quietly, not error.
- No new dependencies.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, full count reported.
- Client `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` passes.
- New engine test: an exercise with sets `220x5` (Jun 29), `220x5` (Jun 29),
  `220x5` (Jul 13), `210x5` (Jun 15), `210x5` (Jun 15), `200x8` (Jun 22)
  yields `topSets` of exactly 3 distinct entries - `220x5`, `210x5`,
  `200x8` - with the `220x5` entry dated **Jun 29** (earliest), not Jul 13.
- New engine test: an exercise with 8 distinct `(weight, reps)` pairs still
  yields exactly 5 (`MAX_TOP_SETS` unchanged).
- Existing `exerciseDetail` tests still pass, or any change to them is
  listed with justification.
- No duplicate React keys: render the fixture above and confirm no
  duplicate-key warning in console output. Quote the console state.
- Rendering an exercise with `topSets: []`, `repTargets: null`, and no
  personal records produces the three existing unlock/empty states with no
  error.
- Describe or screenshot the three cards in at least 2 palettes x both
  modes.

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
