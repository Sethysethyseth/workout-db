# TASK bkf1a: critic round 1 fixes - builder, run view, library, shared primitives

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The blocks-v2 wave (BK) failed its first coach-persona critique at 6/10
(`docs/tasks/bk-critic-round-1-FINDINGS.md` - read it; finding numbers below
refer to it). This block fixes the builder / run-view / library / shared-
primitive findings. Sibling blocks bkf1b (import page) and bkf1c (logger
summary + analytics dates) run in parallel on DISJOINT files - stay inside
the list below. Design of record: `docs/specs/blocks-v2.md` sections 3.1
(format rules), 10 (visual language, tokens-only, 44px targets, motion).

FILES TO TOUCH:
- `client/src/components/blocks/builder/*`   (BlockBuilder.jsx,
                                              blockBuilderState.js,
                                              ExerciseCard.jsx, ExercisePicker.jsx,
                                              CopyForwardSheet.jsx,
                                              ProgressionView.jsx,
                                              BuilderToast.jsx, ...)
- `client/src/components/blocks/ui/*`        (DayPicker.jsx, StickyHeader.jsx,
                                              rxFormat.js, ...)
- `client/src/components/blocks/run/*`
- `client/src/pages/BlockRunPage.jsx`
- `client/src/pages/MyTemplatesPage.jsx`
- `client/src/styles/blocks/bk-ui.css`, `bk-builder.css`, `bk-run.css`
Do NOT modify anything outside these files (in particular NOT
`components/blocks/import/*`, `components/blocks/log/*`,
`SessionDetailPage.jsx`, `index.css`).

CHANGE (observable contract, finding number in brackets):
1. [2, P1] **Empty days never reach the server.** `validateState` in
   `blockBuilderState.js` reports every day with zero exercises
   (`weeks[i].days[j]`), and Save shows ONE plain message naming the first
   ones ("Week 2 · Day 3 has no exercises" - weeks/days 1-based, day name
   when set), selects that week and day, scrolls the day panel into view,
   and does NOT post. The same message offers a "Remove empty days" action
   (removes every exercise-less day in every week, as a normal unsaved edit
   with the builder's undo toast; a week left with no days is removed too,
   but never the last week). Also map any server 400 message that still
   gets through to plain words (no "Template" in user-facing copy).
2. [11] A brand-new block that has never been saved shows no "Saved" state:
   "Unsaved" once anything is entered, nothing before.
3. [7] **Copy forward skips deload weeks.** `copyForward` leaves a target
   week whose label contains "deload" (case-insensitive) untouched by
   default; the sheet shows "Skips week 4 (Deload)" in its preview and a
   checkbox "Also overwrite deload weeks" (off by default). Keep every
   existing copyForward rule and its pure signature (add an option,
   default = skip).
4. [12] Reps -> Time on a set with reps defaults to 30 seconds (not reps x 3).
5. [8] The set-grid header columns line up exactly with the grid below
   (SET over the set-number button, REPS or SEC over reps, LOAD over load,
   RPE/RIR over effort, the "to" column when Range is on) - same grid
   template for header and rows.
6. [9] **Day tiles stay readable at 390px with 5 days + the add tile.** The
   day name shows at least ~10 characters or wraps to two lines (ellipsis
   only past that), and the progress ring never overlaps the "DAY n" text.
   Horizontal scroll inside the picker is acceptable if tiles need it
   (then scroll the selected tile into view, as WeekStrip does). Applies
   everywhere DayPicker is used.
7. [10] On wide screens the StickyHeader sits below the app's own top
   navigation, never over it (the app shell's header height; follow how
   other sticky elements in the app offset themselves - find it, name it
   in DELIVERY.md).
8. [17] `/blocks/current`: the day card's primary action (Start / Resume /
   View workout) is reachable without scrolling past the exercise list on
   a 390x844 screen - at the top of the day card or in a sticky footer.
9. [15] End block (run view) and "Start block" over another running block
   (library) use an in-page confirm (the app's existing confirm pattern -
   e.g. WD1's `.session-discard-confirm` in `SessionDetailPage.jsx`; read
   it, do not edit it) instead of `window.confirm`.
10. [14] The library (`MyTemplatesPage.jsx`) opens on the blocks list when
    the user has blocks and no saved workouts (otherwise unchanged).
11. [25] Run-view empty-state rows read "4 weeks · 4 days a week" (days per
    week = the first week's day count), not total days.
12. [19][20][21] `rxFormat.js`: rest of 0 or null is omitted (no "Rest
    0s"); the unit label is always "lb" or "kg" (a "lbs" preference prints
    "lb"); `ProgressionView` cells format durations with `formatDuration`
    ("1×5 min", not "1×300s").
13. [22] Exercise picker: catalog matches rank above the "Use '<typed>'"
    row, and an exact or prefix match on a word ranks first ("row" ->
    rows whose name starts with or contains the word "Row" before
    "Alternating Kettlebell Row"). The "Use" row stays available (last).
14. [24] Toasts are at least `min(92vw, 420px)` wide on phones so a
    one-line message fits in one or two lines. The coach draft toast
    pluralizes ("Drafted 1 week").
15. [27] Read-only exercise cards (the `readOnly` prop) show no expand
    chevron.
Tokens only (`--bk-*` aliases), 44px targets, motion rules per spec 10.2.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles (paste the tail);
  `node scripts/check-hex.mjs` clean; `npx eslint src/components/blocks
  src/pages/BlockRunPage.jsx src/pages/MyTemplatesPage.jsx` 0 errors.
- `grep -rn "window.confirm" client/src/components/blocks client/src/pages/BlockRunPage.jsx client/src/pages/MyTemplatesPage.jsx`
  prints nothing for the block paths (paste; a pre-existing non-block
  `window.confirm` in MyTemplatesPage may remain - say which).
- A `node --input-type=module` snippet in DELIVERY.md (verbatim output)
  proves on `blockBuilderState.js`:
  - a 2-week state whose week 2 day 3 is empty -> `validateState` fails
    with a path naming `weeks[1].days[2]`; the remove-empty-days operation
    returns a state that passes `validateState` and keeps week 1 intact;
    removing empties never deletes the last week.
  - `copyForward` from week 1 through 4 (+5) on a state whose week 4 is
    labeled "Deload" leaves week 4's sets unchanged; with the overwrite
    option on, week 4 gets the +15.
  - `toggleTimed` on a set with reps 8 -> `durationSec: 30`.
- `rxFormat` snippet (verbatim output): `formatRx({ sets: 1, durationSec:
  300, restSec: 0 })` -> no rest part; `formatRx({ ... weight: 185, unit:
  "lbs" })` -> "185 lb"; `formatDuration(300)` -> "5 min".
- DELIVERY.md walks items 1-15 naming the file that implements each, and
  lists the reviewer's LIVE checks: a 4-day skeleton with empty days ->
  Save names the day; "Remove empty days" -> Save succeeds; copy forward
  over a Deload week; 5 day tiles at 390px readable; desktop header below
  the nav.

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
