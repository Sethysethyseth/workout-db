# TASK qol3: Builder - hold an exercise to move it (list collapses while held)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth, Oct 7: "you can hold and move exercises like days and weeks, when held
app adjusts so you can move them easier". sr3-6 built `useHoldToReorder`
for the week and day pills. It is horizontal only: slot math on `clientX`,
`translateX` (`client/src/components/blocks/ui/useHoldToReorder.js` 24-57,
347-354). The builder's exercise list is inline in `BlockBuilder.jsx`
(~1251) and today reorders only via Move up / Move down in the exercise
action sheet (`ExerciseCard.jsx` 434-456, `moveExercise` in
`blockBuilderState.js` 769-778). Recon:
`docs/tasks/qol-r3-recon-stowed-backlog-FINDINGS.md` section C. Design
rules: `docs/specs/quality-of-life-wave.md` section 2.

FILES TO TOUCH:
- client/src/components/blocks/ui/useHoldToReorder.js   (add an axis)
- client/src/components/blocks/builder/BlockBuilder.jsx (wire the exercise
                                                          list)
- client/src/components/blocks/builder/ExerciseCard.jsx (collapsed row
                                                          state, handle props)
- client/src/components/blocks/builder/blockBuilderState.js (a pure
                                                          `reorderExercise`)
- client/src/styles/blocks/bk-builder.css               (reorder styles)
Do NOT modify anything outside these files. `WeekStrip.jsx` and
`DayPicker.jsx` must NOT need edits (see criteria).

CHANGE:
1. **`useHoldToReorder`** gains an `axis` option, `"x"` (default) or `"y"`.
   - `"x"` must behave exactly as today, so the week and day pills are
     untouched.
   - `"y"` uses `clientY`, `top`/`height` and `translateY`.
   - Add edge auto-scroll for `"y"`: while dragging within ~64px of the
     viewport's top or bottom (or of the nearest scroll container), scroll
     smoothly in that direction.
   - Keep the existing hold threshold, so a normal vertical scroll never
     starts a drag.
2. **`reorderExercise(state, dayRef, fromIndex, toIndex)`** in
   `blockBuilderState.js` is a pure move: one exercise moves, the others
   keep their relative order, and the state shape matches `moveExercise`.
   `moveExercise` stays (the sheet still uses it).
3. **The interaction** in the builder's exercise list:
   - On hold-lift, EVERY exercise card in the current day collapses to a
     compact one-line row: name, plus set count ("3 sets"), at ~48px tall.
     The height transition takes ~200ms, so a long day fits on screen and
     the target slot is reachable without scrolling far.
   - The held row lifts with elevation from the existing token shadow and
     a slight scale. The others shift with a ~150ms transform to open the
     drop slot.
   - On release: commit via `reorderExercise`, mark the builder unsaved
     exactly like the other edits, and expand the cards back.
   - Fire `navigator.vibrate(10)` on lift where supported (guarded).
   - **The lift-and-collapse is this surface's one memorable element.**
     Keep everything else unchanged.
4. Tapping a card still opens it, and Move up / Move down in the action
   sheet still work.
5. Under `prefers-reduced-motion`, collapse and expand are instant with no
   scale. Drag still works.
6. Reorder styles go in `bk-builder.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes.
- Every existing `useHoldToReorder(` call site (`WeekStrip.jsx`,
  `DayPicker.jsx`) is byte-for-byte unchanged (no edit to those files), and
  the hook's default axis is `"x"`.
- `reorderExercise` examples (state the result for each in DELIVERY.md):
  - order `[A,B,C,D]`: move 0 -> 2 gives `[B,C,A,D]`
  - move 3 -> 0 gives `[D,A,B,C]`
  - move 1 -> 1 gives the same array, and the builder is NOT marked
    unsaved
- Real-app items for the reviewer (390x844, a day with 6+ exercises):
  - hold collapses all rows
  - dragging the last row to the top auto-scrolls and commits
  - "Unsaved" appears
  - Save persists the new order after a reload
  - a plain vertical swipe scrolls without lifting a row

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
