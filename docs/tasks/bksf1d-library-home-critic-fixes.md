# TASK bksf1d: Library + Home - critic round 1 fixes (hierarchy, block-day names)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The separate feel critic scored the bks work 5/10 in round 1
(`docs/tasks/bks-critic-round-1-FINDINGS.md`; finding IDs refer to it):
- Library (built by bks3, `docs/tasks/bks3-library-redesign.md`) puts 523px of
  controls before the first block card. The running block's button reads
  "Running", which is a status, not an action. Tile labels truncate (P2-10).
- Home's recent-workouts list shows five identical rows ("Upper/Lower Strength -
  4wk ...") because block-day session names lead with the block name and the
  week/day get cut off. After finishing a day, the Home hero doesn't name the
  next block day (P2-11).
Every bks3 contract stays in force:
- "Create workout" is greyed out as parked, exactly once, not a link.
- Blocks is the default tab.
- No action is lost.

FILES TO TOUCH:
- client/src/pages/MyTemplatesPage.jsx, client/src/components/library/*,
  client/src/styles/blocks/bk-library.css
- client/src/pages/DashboardPage.jsx and the Home components it renders for
  recent workouts and the hero (`components/workout/ActiveWorkoutHero.jsx`,
  `StartWorkoutHero.jsx`, `components/blocks/run/UpNextCard.jsx` - only as needed)
- client/src/lib/sessionDisplay.js (`sessionDisplayTitle`)
Do NOT modify anything outside these files. NOT `index.css`, NOT `bk-ui.css`,
NOT the logger (`SessionDetailPage.jsx`, `components/blocks/log/*`), NOT the
builder or import (parallel units).

CHANGE:
1. **Library hierarchy:**
   - At 390x844 the first block card's top edge is at y=330 or above. Measure
     it in DELIVERY.md against the round-1 523px.
   - Merge or compact the header, actions, scope switch, type tabs and
     visibility filter. For example, put the visibility filter behind a single
     "Filter" chip, or inline it with the tab row. Remove duplicate
     explanatory copy.
   - The running block's primary button reads "Open" (or "Continue") and goes
     to `/blocks/current`. The card can carry a "Running" chip as the status.
   - No tab or tile label truncates at 390px (shorten or wrap).
2. **Block-day names:**
   - `sessionDisplayTitle` shows a block-day session as "W3 · Upper A", with
     the block name as secondary text where the surface has a subtitle. Today
     it is "Upper/Lower Strength - 4wk · W3 · Upper A".
   - Non-block sessions are unchanged.
   - Every caller of `sessionDisplayTitle` keeps working. Grep them all, list
     them in DELIVERY.md, and confirm each still renders a sensible title.
   - Read the block fields the session already carries
     (`blockWeekOrder`, `blockWorkoutOrder`, `blockContext` / the stored name
     pattern `"<block> · W<n> · <day>"`). Do not add new fetches.
3. **Home after a block day:**
   - With an active block run and no live workout, the Home hero / Up Next
     names the next day explicitly, e.g. "Next: W3 · Lower A".
   - Use the existing active-run data (`progress.nextDay` from
     `/block-runs/active`); no new endpoints.

4. **Run-page day progress (P2-4, added at dispatch):**
   - The block run page (`/blocks/current`) draws an in-progress day as a
     constant 50% ring and announces "Day progress 50%", even at 0 of 16 sets.
     The source is `client/src/components/blocks/run/RunDayCard.jsx` and
     `dayStatusTiles.js` (`in_progress: 0.5`).
   - Replace the fake fraction with an honest state. If the run progress
     payload already carries per-day logged/planned set counts, use the real
     fraction.
   - Otherwise draw a distinct "in progress" ring state (e.g. a short arc
     plus a dot, or a dashed track) whose accessible label says "In progress"
     with no percentage.
   - Done stays full and to-do stays empty. No server change.
   - This item ADDS `client/src/components/blocks/run/RunDayCard.jsx`,
     `client/src/components/blocks/run/dayStatusTiles.js` and
     `client/src/styles/blocks/bk-run.css` to FILES TO TOUCH.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
  `npm run test:unit` from `server/` green.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md.
- `sessionDisplayTitle`:
  - For a session named "Upper/Lower Strength - 4wk · W3 · Upper A" with
    `blockWeekOrder` 3, it returns a primary title of "W3 · Upper A" (show the
    function and a `node --input-type=module -e` call printing the result, if
    the module is Node-importable; otherwise a code-read trace).
  - For "Workout — Sep 28" it returns the same title as before.
- DELIVERY.md:
  - The bks3 action inventory is re-checked: every action is still present
    (file:line).
  - "Create workout" is still parked exactly once.
  - The item-1 measurement.

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
