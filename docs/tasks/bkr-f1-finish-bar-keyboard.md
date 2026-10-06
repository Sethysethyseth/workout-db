# TASK bkr-f1: Finish bar comes back when the phone keyboard closes (block logger)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix for BK smoke round 2 P1, diagnosed and seat-verified in
`docs/tasks/bkr-d1-finish-bar-FINDINGS.md`. On a live block day,
`SessionDetailPage.jsx` (~2458-2491) adds `html.bk-log-kbd` on focusin of
any logger INPUT/TEXTAREA and removes it only on focusout. `bk-log.css`
(~587-591) hides `.session-finish-dock` under that class. iOS Safari often
closes the soft keyboard WITHOUT blurring the field, so Finish stays hidden
until the user touches something. The hide itself is wanted: critic R1
P1-2 (the dock must not cover the field while the keypad is up) - keep it.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (the liveBlockDay keyboard
                                            effect only)
- client/src/styles/blocks/bk-log.css      (only if the class split below
                                            needs a rule change)
Do NOT modify anything outside these files.

CHANGE:
Drive `bk-log-kbd` from "a logger field is focused AND the soft keyboard is
actually open", not from focus alone. Use `window.visualViewport` geometry
(`resize` + `scroll` listeners; the file already uses `visualViewport` for
scroll-assist near ~2394 - follow that style). Keyboard counts as open when
the visual viewport is meaningfully shorter than the layout viewport (pick
a threshold that ignores iOS URL-bar collapse, roughly 120-150 CSS px, and
name it as a constant). Re-sync on focusin, focusout (keep the rAF defer),
and every viewport event. Fallback: when `visualViewport` is missing, keep
today's focus-only behaviour. Clean up all listeners and the class on
unmount and when `liveBlockDay` turns false. Do not change the
`bk-log-focus` effect or any non-block session path.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean.
- Grep: `bk-log-kbd` is still added/removed ONLY inside the liveBlockDay
  effect, and that effect now registers `visualViewport` listeners and
  removes them in its cleanup.
- Playwright at 390x844 on a live block day (state the steps and results in
  DELIVERY.md, or say plainly that no browser was available):
  1. focus a reps field, shrink the viewport height to 450 -> `html` has
     `bk-log-kbd`, `.session-finish-dock` computed `display: none`;
  2. restore 844 WITHOUT blurring the field -> class gone, dock displayed;
  3. blur -> class stays gone.
- Quick-log session: focusing a field never adds `bk-log-kbd` (unchanged).
- LANDING NOTE (reviewer): Seth confirms on his iPhone that Finish returns
  when the keypad closes, with the caret still in the field.

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
