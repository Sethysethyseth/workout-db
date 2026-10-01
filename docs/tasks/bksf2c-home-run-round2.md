# TASK bksf2c: Home + block run page - critic round 2 fixes (one Start for the block day, compact run header)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Critic round 2 scored 7/10 (`docs/tasks/bks-critic-round-2-FINDINGS.md`; IDs
refer to it). Flow is at 6/10 and must reach 7+ in the final round. Its new P1
(N2): the Home hero says "Next: W3 · Upper B", but its "Start Workout" button
opens "Empty workout / Browse templates". The block day only starts from a
second, smaller card underneath. During a live session Home also stacks a
Resume button on that Next card.

KNOWN AND DEFERRED by Seth to the next wave, so do NOT change it: the
in-progress hero card and the bottom "In progress" bar both showing during a
live workout.

FILES TO TOUCH:
- client/src/pages/DashboardPage.jsx
- client/src/components/workout/StartWorkoutHero.jsx,
  client/src/components/workout/ActiveWorkoutHero.jsx,
  client/src/components/workout/StartWorkoutPicker.jsx (only if the
  secondary link needs it)
- client/src/components/blocks/run/* and client/src/pages/BlockRunPage.jsx
- client/src/styles/blocks/bk-run.css
Do NOT modify anything outside these files. NOT `components/workout/PersistentWorkoutBar.jsx`
or `Layout.jsx` (the deferred item). NOT the builder, import, logger or Library.

CHANGE:
1. **Home with an active block run and NO live workout:**
   - The hero is the block day. Title "W3 · Upper B", block name as subtitle.
   - Its primary button reads "Start W3 · Upper B" and starts that day through
     the same call the run page's Start uses (`startSessionFromBlock` by name),
     then lands in the logger.
   - "Empty workout" / "Browse templates" become ONE small secondary link
     under it ("Other workout").
   - The separate "NEXT: …" Up Next card is not rendered in this state,
     because the hero is the up-next.
2. **Home during a live workout:**
   - The live-workout hero stays as it is (deferred item).
   - The Up Next card renders WITHOUT any Resume/Start button. At most one
     muted line ("Up next after this: W3 · Upper B"), or nothing.
3. **No relayout:** the hero reserves its final height while the active-run
   request is in flight, so nothing jumps about 2s after load. Show a
   same-size skeleton until the run data has arrived or failed.
4. **Run page (`/blocks/current`):**
   - The sticky header is 80px or less at 390px. Block name on one line
     (truncate with ellipsis plus a title attribute), "Week n of N" beside or
     under it.
   - "IN PROGRESS" appears ONCE per day card.
   - No hex, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
  `npm run test:unit` from `server/` green.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md.
- DELIVERY.md:
  - The three Home states with the exact condition for each (file:line):
    active run + no live workout, live workout, no active run.
  - Proof that the hero's primary action calls the block-start path, not the
    ad-hoc start (show the call chain).
  - The run-page header height measurement method and result.
  - The no-active-run Home is unchanged: show its condition, and that
    `StartWorkoutPicker` still opens there.

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
