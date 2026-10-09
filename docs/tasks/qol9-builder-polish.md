# TASK qol9: Builder polish - name row, coach box, one action-sheet style, per-side chip, week pill, recents on empty search

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The stowed builder polish, from two sources. The P3 items are verbatim
with screenshots in `docs/tasks/sr3-critic-round-1-FINDINGS.md` lines
81-90; the BK-smoke deferrals are listed in HANDOFF:
- **P3-1:** the name field is cramped at 390px.
- **P3-2:** the coach box splits the week strip from the day strip, and
  free-text titles wrap to 3 lines beside the chip.
- **P3-5:** two action-sheet styles.
- **P3-8:** an empty Add-exercise sheet is ~600px of blank space.
- **BK-smoke:** "Per side" is offered on bilateral lifts.
- **BK-smoke:** the selected builder week pill is a bright white bar in
  dark mode.

Current file:line for each: `docs/tasks/qol-r3-...-FINDINGS.md` section D1,
D5, D6. Design rules: `docs/specs/quality-of-life-wave.md` section 2.
Lands AFTER qol3 (same files).

FILES TO TOUCH:
- client/src/components/blocks/builder/BlockBuilder.jsx
- client/src/components/blocks/ui/StickyHeader.jsx
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/builder/BuilderSheet.jsx
- client/src/components/blocks/builder/BlockSettingsSheet.jsx
- client/src/components/blocks/builder/CoachDraftCard.jsx
- client/src/components/blocks/builder/ExercisePicker.jsx
- client/src/styles/blocks/bk-builder.css
- client/src/styles/blocks/bk-ui.css
Do NOT modify anything outside these files (`client/src/api/analyticsApi.js`
is READ-only - reuse its existing exercises-index call).

CHANGE:
1. **P3-1, name row.** The block name input gets its own full-width row
   directly under the sticky row that holds Unsaved / Save / "...". It
   stays in the sticky header and stays editable in place. A name like
   "Upper/Lower Strength - 4wk" shows in full at 390px.
2. **P3-2, coach box and title wrap.**
   - On a new empty block, the coach draft card moves BELOW the day
     picker, so the week strip and day picker sit together as one header
     zone. It collapses to a single-line "Draft with the coach" button
     that expands into today's card on tap.
   - Exercise card titles clamp to 2 lines with an ellipsis.
   - The "Not in library" chip moves to the card's summary line, never
     beside the title.
3. **P3-5, one action-sheet style.** Every builder action sheet - week,
   day, export-copy, block settings actions and the block header menu -
   uses the icon + text list style of the exercise sheet (`.bk-ex-actions`
   / `__row`):
   - a leading icon per row (reuse icons already in the builder)
   - destructive rows last, in the danger token
   - disabled rows keep their verb (e.g. "Duplicate - 7 days max")

   Retire the bordered `.bk-actions-list` rules once nothing uses them.
4. **Per side.**
   - The card's "Per side" chip shows ONLY when the exercise is per-side
     (`exercise.perSide === true`) or its name implies per-side
     (`exerciseNameImpliesPerSide`).
   - Every exercise's settings sheet gets a "Per side (left and right)"
     toggle row, so a user can still mark a custom unilateral lift.
   - Turning it off on a name-implied lift writes `perSide: false`, as the
     chip does today.
5. **Week pill.** The selected `.bk-week--selected` state stops using
   `--bk-ink` / `--bk-bg` (a near-white slab in dark mode). It uses the
   accent-derived selected treatment, from `--color-interactive` via
   `color-mix`, matching how the day pill and other accent states read. In
   all 10 palette x mode combos the selected week is unmistakable but not
   a glaring white bar. The inner `__bar` progress fill stays legible on
   the new background.
6. **P3-8, recents on empty search.** When `ExercisePicker` opens with an
   empty query, it shows:
   - a "Recent" list: the user's 8 most recently logged exercises, from
     the existing analytics exercises-index call (`/analytics/exercises`),
     sorted by `lastPerformed` descending
   - then "Your exercises": their custom exercises, if not already listed

   Fetch once per picker mount. Tapping a recent adds it exactly as a
   search result would. Typing switches to search results as today. A
   user with no history sees one line of direction: "Search for an
   exercise to add it."
7. Styles go in `bk-builder.css` / `bk-ui.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes.
- `grep -n "bk-actions-list" client/src` returns zero hits, or each
  remaining hit is explained in DELIVERY.md.
- `grep -n "bk-ink" client/src/styles/blocks/bk-ui.css` shows no use
  inside the `.bk-week--selected` rules.
- Real-app items for the reviewer (390x844 champ-dark, plus crimson-light
  and iron-dark spot checks):
  - a long block name visible in full
  - the new-block header reads as one zone
  - every "..." sheet looks the same
  - "Per side" is absent on Bench Press and present on "Single-Leg Calf
    Raise"
  - the selected week pill is not white
  - an empty Add-exercise search shows Recent

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
