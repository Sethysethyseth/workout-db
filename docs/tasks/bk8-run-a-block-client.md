# TASK BK8: run a block - the current-block view, Start block in the library, "Up next" on Home

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The payoff screen of the wave: the recovery logbook's week strip + day
picker, applied to training a LogChamp block. Design of record:
`docs/specs/blocks-v2.md` sections 7.1-7.2 (run model) and 10 (visual
language). Needs BK7 (LANDED: `POST /block-runs`, `GET /block-runs/active`
-> `{ run, block, progress }` with `computeRunProgress`'s shape,
`POST /block-runs/:id/end`, `POST /sessions/start-from-block` ->
`{ session, resumed }`), BK4 (primitives) and BK5/BK6 (LANDED; BK6 last
touched `App.jsx` and `MyTemplatesPage.jsx`) - read them first.

Today (recon Sept 28): block cards in the library offer "Set as current"
(`MyTemplatesPage.jsx` ~642-679), which writes localStorage
(`client/src/lib/currentProgramStorage.js`, key `workoutdb.currentProgram.v1`)
that nothing ever reads for blocks - `DashboardPage.jsx` only honors
`kind === "workout"`. Blocks cannot be started at all.

FILES TO TOUCH:
- `client/src/api/blockRunApi.js`           (NEW - start, active, end,
                                             startFromBlock)
- `client/src/pages/BlockRunPage.jsx`       (NEW - route `/blocks/current`)
- `client/src/components/blocks/run/*`      (NEW)
- `client/src/styles/blocks/bk-run.css`     (NEW)
- `client/src/App.jsx`                      (the one route)
- `client/src/pages/MyTemplatesPage.jsx`    (block cards only)
- `client/src/pages/DashboardPage.jsx`      (the Up next card)
- `client/src/lib/currentProgramStorage.js` (stop offering/reading
                                             `kind: "block"`)
Do NOT modify anything outside these files.

CHANGE - observable contract (root class `bk`, 390px first):

1. **`/blocks/current` with an active run.** `StickyHeader`: eyebrow = block
   name; title `WEEK <n>` + the week label as sub; right = a quiet "Edit
   block" link. `WeekStrip`: every week, `progress` = done/total, `current`
   = the run's current week; opens on the current week. `DayPicker`: the
   selected week's days, `top` = `DAY n`, `progress` = 1 done / 0.5 in
   progress / 0 todo, `tag: "NEXT"` on `progress.nextDay`. Opens on
   `nextDay` (else day 1).
2. **Selected day card:** eyebrow `W<n> · DAY <m>`, the day name in display
   type, chips (`<n> EXERCISES`, `<m> SETS`, `DONE` good chip / `IN
   PROGRESS` accent chip), a progress bar, then each exercise: slot badge,
   name, `ExerciseRx` (sets, reps / range / time, load, effort with ≤ / ≥ for
   caps, rest), notes behind a `Disclosure` "Coach note". The primary
   action: "Start workout" (todo) / "Resume workout" (in progress) / "View
   workout" (done, plus a quiet "Train it again" that starts a fresh
   session). Start/Resume call `startFromBlock` and navigate to
   `/sessions/<id>`.
3. **No active run:** an empty state "No block running" with the user's
   non-draft blocks (name, weeks, days) each with "Start", plus "Build a
   block" and "Import a block" links. Starting -> the view in item 1.
   "End block" (in a small menu) asks for confirmation, then shows this
   empty state.
4. **Library block cards** (`MyTemplatesPage.jsx`): "Set as current" is
   REPLACED for blocks by "Start block" (starts a run and opens
   `/blocks/current`; when another block is running, confirm "This ends
   <other block>"). The running block shows an `ACTIVE` accent pill and its
   primary action becomes "Open". Drafts show a `DRAFT` pill, cannot be
   started, and their action is "Review" (opens the builder). Workout
   templates keep "Set as current" exactly as today.
5. **Home "Up next" card** (`DashboardPage.jsx`): only when a run is active
   and not finished - eyebrow `UP NEXT · <BLOCK NAME>`, title `W<n> ·
   <DAY NAME>`, a one-line summary (`5 exercises · 18 sets`), and
   Start / Resume. It never displaces or restyles a live-workout card
   (`card--live` keeps its one meaning); it sits directly below it when both
   exist. Tapping the card body opens `/blocks/current`.
6. `currentProgramStorage.js`: reading a stored `kind: "block"` entry
   returns null (and clears it); the block write path is removed. Workout
   entries behave exactly as today.
7. Loading and errors: skeletons in the week-strip/day-picker footprint
   (no layout jump when data arrives); API errors show an inline retry.
   Tokens only; 44px targets; motion rules per spec 10.2.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` reports no raw colors in the diff.
- `npx eslint src/pages/BlockRunPage.jsx src/components/blocks src/pages/DashboardPage.jsx src/pages/MyTemplatesPage.jsx`
  from `client/` reports 0 errors.
- `rg -n "kind: \"block\"|kind === \"block\"" client/src` shows no remaining
  write of a block into current-program storage (paste the output).
- `App.jsx` diff is exactly one new route (show the hunk).
- The day-status -> tile mapping is a pure exported helper; a
  `node --input-type=module` snippet in DELIVERY.md feeds it a sample
  `progress` object (from BK7's `computeRunProgress` test shape) and prints
  the tiles (`progress` values, the `NEXT` tag position, the opening week
  and day) - verbatim output pasted.
- DELIVERY.md walks items 1-7 naming the implementing component/file and
  lists the reviewer's LIVE check: Start a block from the library -> Up next
  on Home -> Start -> log a set -> back to `/blocks/current` shows the day
  in progress.

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
