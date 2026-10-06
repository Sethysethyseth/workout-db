# TASK sr3-r2: RECON - builder discoverability, effort chip, add-to-library, single-side logging, Private/Public

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the smoke-round-3 wave (`docs/tasks/bk-smoke-FINDINGS.md`
-> "Smoke round 3" items 4-7 and 9, plus "Round 3 rulings"). The frontier
seat will write unit contracts FROM this report, so it needs what exists
TODAY with file:line evidence and the patterns already in use - not
proposals. Design of record: `docs/specs/blocks-v2.md`. Builder code:
`client/src/components/blocks/builder/`; block logger:
`client/src/components/blocks/log/`.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
REPORT ONLY - no code changes, no git operations. Answer each question with
file:line evidence; say "not found" rather than guess. Quote short code
excerpts where the exact shape matters.

**A. Removing weeks and days is hard to find (item 4).**
1. Every way to delete a week and a day in the builder today (the "..."
   header sheet, week/day pills, long-press, the in-page confirms from
   bkr4/bkrf1a) - the exact path a user taps, file:line for each.
2. The builder's header/strip layout top to bottom on a 390px phone: block
   name, week pills, day pills ("Day 1..+ Day"), the "DAY n - 0 exercises -
   0 sets" row, Edit/Progression segmented, "+ Add exercise", Back/Settings
   footer - with the component and CSS file that owns each.
3. Existing primitives in `client/src/components/blocks/ui/` (chips, pills,
   week strip, day picker, segmented, sheets) and whether any already
   supports a per-item affordance (an "x", a "..." or long-press).

**B. Effort scale chip (item 5 ruling: keep Effort scale in Settings AND
add a small tappable chip by the block name - "Effort: off" / "RPE" /
"RIR" - opening the same 3-way choice).**
1. `BlockSettingsSheet.jsx` effort control (component used, values,
   default) and `setEffort` in `blockBuilderState.js`; how `useRPE` /
   `useRIR` map to `effort` both ways.
2. Everything downstream that reads the block's effort scale (exercise
   card "RPE cap" chip, `ExerciseSettingSheet`, the block logger set rows,
   Progression view, export/import format) - what each shows when effort is
   "none" vs "rpe" vs "rir", and whether switching scale mid-edit rewrites
   or hides existing per-set effort values.
3. Where a chip "by the block name" could live: what renders the name in
   create vs edit mode (StickyHeader? an input?) and the `Chip` primitive's
   props.

**C. Add a not-in-library exercise to the library from the builder (item
6).**
1. `ExercisePicker.jsx`: what happens when the search matches nothing - is
   there a "use this name" / free-text path, and what does the resulting
   block exercise carry (exerciseId null? name only?).
2. The existing custom-exercise create UI (L4 / mw7: component, route,
   fields required - muscle groups? equipment?) and API (`POST` route,
   validation, name dedupe), and whether it can be opened inline (sheet)
   from another page.
3. How the logger's add-exercise sheet (NT2 stepped sheet) handles
   "not found" - any create-custom path to reuse BY NAME.

**D. "Single" exercises should log a left and a right side (item 7 -
Seth: "single" = an exercise marked one-arm / one-leg; "it should populate
a left and a right side like how normally logging does it").**
1. Normal (non-block) logging: how an exercise is decided to be per-side
   (catalog flag? name heuristic? user toggle? MW6 "per-side auto first
   pair") and how the L/R pair is created - file:line.
2. Block logging: `client/src/components/blocks/log/perSideMode.js` and
   `BlockExerciseCard.jsx` - the exact conditions under which a block day
   renders L/R vs bilateral, and the data source (builder "Per side"
   setting? BlockWorkoutSet field? name heuristic?).
3. The builder's per-side setting (HANDOFF lists "'Per side' offered on
   bilateral lifts" as known) - where it lives, what it writes.
4. The concrete GAP: list the cases where normal logging would give L/R but
   a block day does not (e.g. a catalog-flagged unilateral exercise whose
   name lacks the heuristic words, a custom exercise, a block set saved
   without the per-side flag, imported blocks). Name the most likely case
   Seth hit.

**E. Private / Public on blocks does nothing (item 9 - Seth's copy for a
tap: "this hasnt been implemented yet bro stop prying").**
1. Every place Private/Public appears for blocks (Settings toggle, Library
   filter tabs "All / Private / Public", card badges, import, export) and
   what each does today (server effect of `isPublic`, any public listing or
   clone-by-others surface).
2. The app's existing small-message/toast pattern (`BuilderToast.jsx`,
   others) - props, duration, where it is mounted.

**F. Collision map.** For units A+B (builder header), C (add to library), D
(per-side), E (public message) list the candidate FILES TO TOUCH (client +
server + tests + CSS) and flag every file that appears in more than one.

Write it all to `DELIVERY.md` with headings A-F and numbered answers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md has sections A-F; every numbered question is answered with at
  least one file:line that exists on this branch, or "not found" plus where
  you looked.

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
