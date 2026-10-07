# TASK sr3-6: Hold a day or week pill to drag it into a new place

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth, Oct 6, approving the builder-header mock: "wonder if for days if you
hold it down you can move them around kinda like apps in the home screen,
same for weeks". Today the builder reorders only through the actions
sheets (Move = swap with a neighbour: `moveWeek` / `moveDay` in
`client/src/components/blocks/builder/blockBuilderState.js`). The pill
strips are shared primitives - `client/src/components/blocks/ui/WeekStrip.jsx`
and `DayPicker.jsx` - also used by the Current Block page, Home and the
import preview, which must NOT change. Lands AFTER sr3-3 and sr3-4 (both
edit `BlockBuilder.jsx`); rebase onto them. Block sessions are positional
(bksf3b ruling) - reordering a running block's days already behaves like
Move does today; that is accepted, not this unit's concern.

FILES TO TOUCH:
- client/src/components/blocks/ui/WeekStrip.jsx
- client/src/components/blocks/ui/DayPicker.jsx
- client/src/components/blocks/ui/ (one NEW shared hook file for the
  gesture, e.g. `useHoldToReorder.js`, if you want one)
- client/src/styles/blocks/bk-ui.css
- client/src/components/blocks/builder/BlockBuilder.jsx  (pass the new prop
  + selection follow)
- client/src/components/blocks/builder/blockBuilderState.js (new reorder
  ops)
Do NOT modify anything outside these files. No new dependencies (gate 5) -
pointer events only, no drag-and-drop library, no HTML5 draggable (it does
not work with touch).

CHANGE:

1. **State.** Add pure `reorderWeek(state, fromIdx, toIdx)` and
   `reorderDay(state, weekIdx, fromIdx, toIdx)` - remove-and-insert (not
   swap); out-of-range or equal indices return the state unchanged. Keep
   `moveWeek` / `moveDay` as they are (the menus still use them).
2. **Opt-in prop.** `WeekStrip` and `DayPicker` take an optional
   `onReorder(fromIndex, toIndex)`. WITHOUT it they render and behave
   exactly as today (no listeners, no new classes) - the run page, Home and
   import preview pass nothing. Trailing slots ("+", "+ Day") never drag.
3. **Gesture (only when `onReorder` is given):**
   - Press and hold a pill ~400 ms without moving more than ~8 px -> it
     LIFTS: scales to ~1.06, gains a shadow (`--bk-shadow`), and
     `navigator.vibrate?.(10)` fires where supported. Moving more than ~8 px
     BEFORE the hold completes cancels the lift, so a normal swipe still
     scrolls the strip.
   - While lifted, horizontal movement drags the pill; neighbours slide
     aside to open the gap (150-200 ms ease-out transforms). The strip
     auto-scrolls when the pointer is within ~32 px of its left/right edge
     (weeks can number 52).
   - Release drops it: `onReorder(from, to)` only if the index changed.
     `pointercancel` or Escape puts it back with no change.
   - A hold-and-release (lift with no move) changes nothing and does NOT
     fire the pill's click, so it never opens the actions sheet or changes
     selection. A normal tap and the re-tap-to-open-actions behavior are
     unchanged.
   - While lifted, the page must not scroll or rubber-band; outside a lift,
     native horizontal scrolling works as today.
   - Long-press must not raise the iOS callout or select text on the pills
     (`-webkit-touch-callout: none; user-select: none` on reorderable
     pills only).
   - `prefers-reduced-motion: reduce`: no scale animation and no sliding
     transitions - the pill still lifts (shadow) and drops.
   - Mouse works the same way on desktop (pointer events).
4. **Builder wiring.** The builder passes `onReorder` to both strips when
   editable (not read-only), applying `reorderWeek` / `reorderDay` through
   `applyState`. The SELECTED week/day follows the item that moved (if you
   drag the selected day, it stays selected at its new place; if you drag
   another day across it, the selection stays on the same day, wherever it
   now sits). Day pills' "Day n" labels renumber by position as they do
   after Move today.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run
  test:unit` from `server/` still green.
- `node scripts/check-hex.mjs` clean; every new `var(--...)` resolves.
- `git diff --stat` lists only files in FILES TO TOUCH; `BlockRunPage.jsx`,
  `DashboardPage.jsx` and `ImportPreviewStep.jsx` are unchanged.
- A node one-liner (or a short script under the scratch area, not
  committed) exercising `reorderDay` on a 4-day week: (0 -> 2) gives
  order B, C, A, D; (3 -> 0) gives D, A, B, C; (1 -> 1) returns the same
  state object. Paste the output in DELIVERY.md.
- Evidence from a local run at 390x844 with touch emulation (client against
  a non-prod API or a stub; `client/.env` is PRODUCTION - never use it),
  screenshots under `.playwright-mcp/sr3-6/`: (a) a lifted day pill
  mid-drag, (b) the strip after dropping Day 1 after Day 3, with the
  selection where rule 4 says; (c) a quick horizontal swipe on the week
  strip scrolls without lifting; (d) a plain tap on a day still selects it
  and a re-tap still opens its actions sheet.

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
