# TASK MW1: un-nest the tracked pill from the live heading toggle (a11y fix)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
The pre-main gate's one knowingly-shipped finding from the NT-wave. On the
LIVE-session path, `SessionExerciseBlock` (in
`client/src/pages/SessionDetailPage.jsx`) wraps `headingInner` in
`<button className="session-exercise-heading-toggle">` (~line 1464), and
`headingInner` contains `ExerciseTrackedIndicator`, which itself renders a
`<button>` when interactive (~line 127). Nested interactive controls =
invalid HTML, a React DOM-nesting warning, and an AT problem (the inner
control's accessible name can be swallowed). Completed sessions use a
`<div>` wrapper and are fine - this is live-only, exactly the path NT2
made interactive. It functions today only because the pill's `onClick`
calls `stopPropagation`.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (restructure the heading row)
- client/src/index.css                     (only if the restructure needs
                                            layout rules; tokens-only)
Do NOT modify anything outside these files.

CHANGE:
Restructure the live collapsible heading (the `collapsible && !isCompleted`
branch of `SessionExerciseBlock`'s return) so `ExerciseTrackedIndicator`
is NOT a DOM descendant of the `.session-exercise-heading-toggle` button -
render it as a sibling inside `.session-exercise-heading-row` (or an inner
wrapper of your choosing). How you split `headingInner` is your call
(e.g. pill lifted out and the remaining segments kept in the button), but
preserve ALL of:

- Visual/reading order unchanged: chevron, name, "· N sets", pill,
  "· summary" - on BOTH the live and completed branches, expanded and
  collapsed. The two branches should keep rendering visually identically.
- The sticky-heading behavior (`session-exercise-heading-sticky`) and the
  collapsed summary line.
- The layout-stability slot idiom (`session-exercise-tracked-slot` +
  sizer) - do not regress the no-layout-shift behavior when the pill
  swaps between Tracked/Not tracked.
- Tapping the pill opens the Add-to-library sheet and does NOT toggle
  collapse; tapping name/set-count/chevron toggles collapse as today.
- The completed (static `<div>`) branch stays valid; if you unify the two
  branches' structure to avoid duplication, that's welcome but optional.

Then re-examine the pill's `onClick` handler in `ExerciseTrackedIndicator`
(`e.preventDefault(); e.stopPropagation();` ~lines 132-136): those exist
solely to stop the parent toggle from firing. Once the pill is no longer a
descendant of the toggle, remove them if they are no longer needed, or
keep them with a one-line comment saying what still requires them.

ACCEPTANCE CRITERIA (machine-checkable):
- In the live collapsible branch's JSX, `ExerciseTrackedIndicator` is no
  longer rendered inside the `session-exercise-heading-toggle` button
  (verifiable by direct read of the returned JSX tree).
- No `<button>` is a descendant of another `<button>` anywhere in
  `SessionExerciseBlock`'s output; the React "button cannot appear as a
  descendant of button" dev warning is gone (state how you verified -
  dev-server console or reasoning from the JSX tree).
- Client `npm run build` compiles with no errors.
- `npm run test:unit` green from server/ (tripwire - no server files
  touched).
- Any new CSS uses tokens/`color-mix` only - zero raw color values
  (`scripts/check-hex.mjs` passes).

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
