# TASK BK5b: builder progression tools - copy a week forward with a load step, and the progression view

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
A coach builds week 1, then shapes weeks 2-N by copying it forward with a
small load increase and marking a deload. That is the single most common
block-authoring move, and it must work with NO AI. The second tool answers
"what does this day look like across the whole block?" - BridgeAthletic's
"load progression view" pattern (`docs/specs/blocks-v2-import-research-2026-09-28.md`
section 5, pattern 7). Design of record: `docs/specs/blocks-v2.md` sections
10 (visual language) and 13 (a full progression-RULES engine is deferred -
this is a one-shot helper, not stored rules). Needs BK5 (LANDED): the
builder in `client/src/components/blocks/builder/` and its pure state
module `blockBuilderState.js` - read both first.

FILES TO TOUCH:
- `client/src/components/blocks/builder/blockBuilderState.js` (add the pure
                                              `copyForward` operation)
- `client/src/components/blocks/builder/*`   (NEW `CopyForwardSheet.jsx`,
                                              NEW `ProgressionView.jsx`, and
                                              the wiring in the builder)
- `client/src/styles/blocks/bk-builder.css`  (styles for the two)
Do NOT modify anything outside these files.

CHANGE:
1. **`copyForward(state, { fromWeek, throughWeek, loadStep, unit })`** in
   `blockBuilderState.js` (pure, returns new state): replaces weeks
   `fromWeek + 1 .. throughWeek` with copies of week `fromWeek` (days,
   exercises, sets, notes, rest, caps - but each target week KEEPS its own
   label), creating weeks that do not exist yet (max 52). Every set that has
   a weight gets `weight + loadStep * (targetWeek - fromWeek)`, rounded to
   the nearest 0.5 (`unit` is carried for the label only; numbers are
   already in the device's unit). Sets without a weight are copied as-is.
   `loadStep` may be 0; negative steps are rejected (return state unchanged
   plus an error).
2. **Copy forward sheet** - opened from the week actions ("Copy forward...")
   of the selected week: "Copy week <n> to weeks <n+1> through [Stepper]",
   "Add per week [Stepper] <unit>" (0-50, step 2.5 for lb, 1.25 for kg), a
   live preview of the first three changed exercises ("Week 2: Bench Press
   185 → 190 lb"), a warning line when existing weeks will be replaced
   ("Replaces weeks 2-4"), Apply (with an undo toast) and Cancel.
3. **Progression view** - a `Segmented` Edit / Progression toggle in the day
   panel header. Progression shows, for the SELECTED DAY POSITION (the n-th
   day of each week), a table: rows = that day's exercises (by name, in the
   selected week's order; exercises only present in other weeks appended),
   columns = weeks (`W1`...`Wn`, the week label under it in the eyebrow
   style), cells = a compact rx (`3×8 @185`, `3×45s`, `—` when absent in
   that week). The first column is sticky; the table scrolls horizontally
   inside its card (never the page) at 390px. Tapping a cell selects that
   week and returns to Edit with that exercise expanded. Deload-labeled
   weeks are visually quieter (muted column), never hidden.
4. Tokens only; 44px targets; the same motion rules as BK5.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` reports no raw colors in the diff.
- `npx eslint src/components/blocks` from `client/` reports 0 errors.
- A `node --input-type=module` snippet in DELIVERY.md exercises
  `copyForward` on a fixture and prints (verbatim output pasted):
  - week 1 Bench 185 x3 sets, `copyForward({ fromWeek: 1, throughWeek: 4,
    loadStep: 5 })` on a 2-week state -> 4 weeks; Bench weights 190 / 195 /
    200 in weeks 2 / 3 / 4.
  - `loadStep: 2.5` from 187.5 -> 190, 192.5.
  - a bodyweight set (no weight) stays without weight in every copy.
  - week 3 labeled "Deload" before the copy keeps "Deload" after it.
  - `loadStep: -5` -> state unchanged and an error.
  - the input state object is not mutated.
- DELIVERY.md walks items 1-4 naming the implementing component/file.

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
