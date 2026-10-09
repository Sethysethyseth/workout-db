# TASK qol12: Rest timer - starts when you log a set

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Stowed from the BK smokes: "no rest timer after a set". No timer code
exists today. Rest is only a planned prescription: block exercises carry
`restSec` (`blockBuilderState.js` 72), and it rides into the session plan
(`server/src/blocks/blockRunLogic.js` `buildSessionFromBlockWorkout`,
`plan.restSec`).

The pref already exists: qol2's `client/src/lib/trainingPrefs.js`
`restTimer: { enabled, seconds }`, default on and 120s.

"Logged" predicates (qol-r1 B5):
- normal rows: `sessionSetHasCoreLogged` (`SessionDetailPage.jsx`
  328-337)
- block rows: `blockSetIsLogged` (`BlockSetRow.jsx` 49-55)

Design rules: `docs/specs/quality-of-life-wave.md` section 2. Seth's feel
rule matters most here: fixed bars must never cover what you are typing.
Lands after qol7 (same logger files).

FILES TO TOUCH:
- client/src/lib/restTimer.js                  (new, pure helpers)
- client/src/components/workout/RestTimerBar.jsx (new)
- client/src/styles/rest-timer.css             (new)
- client/src/pages/SessionDetailPage.jsx
- client/src/components/blocks/log/BlockExerciseCard.jsx
- client/src/components/blocks/log/BlockSetRow.jsx
Do NOT modify anything outside these files.

CHANGE:
1. **`restTimer.js`** (pure):
   - `restDurationFor({ planRestSec, prefSeconds })` returns
     `planRestSec` when it is a positive number, else `prefSeconds`.
   - `remainingMs(startedAtMs, durationMs, nowMs)` is clamped at 0.
   - `formatRest(ms)` returns "m:ss": 0 -> "0:00", 61000 -> "1:01",
     119500 -> "2:00" (round UP to the next whole second while running).
   - `storageKeyFor(sessionId)` returns `workoutdb-rest-timer-run:<id>`.
2. **Start.**
   - In a live (not completed) session with the pref enabled, the timer
     starts when a set TRANSITIONS to logged: false -> true under the
     predicates above, the first time for that set.
   - Duration: `restDurationFor` with that exercise's `plan.restSec` on
     block days, else the pref seconds.
   - Logging another set restarts it.
   - Editing an already-logged set does not start it.
   - The run is `{ startedAtMs, durationMs, exerciseName }`, kept in
     `sessionStorage` under `storageKeyFor(sessionId)`. Leaving the page
     and coming back resumes from the timestamp. Never count intervals.
3. **`RestTimerBar`.** A slim bar docked directly ABOVE the Finish dock,
   full content width:
   - left: the remaining time in large tabular numerals, plus "Rest" and
     the exercise name in muted text
   - right: "-15s", "+15s" and "Skip" as 44px targets
   - **The one memorable element: a thin progress line along the bar's
     top edge** in `--color-interactive` that depletes smoothly as time
     runs down. Everything else is quiet.
   - At 0: the bar reads "Rest done" for ~3s with ONE gentle pulse, fires
     `navigator.vibrate(80)` where supported (guarded), then hides.
   - It is hidden while the phone keypad is open. Reuse the existing
     keypad detection the Finish dock already uses (bkr-f1 /
     `eebadf4`). It never overlaps an input.
   - Reduced motion: no pulse, and the progress line steps once per
     second instead of animating.
   - Styles go in `rest-timer.css`, tokens only.
4. No timer on completed sessions, when the pref is disabled, or for
   sets loaded already-logged on page open.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes.
- Each `restTimer.js` example from step 1 is listed in DELIVERY.md with
  its result, plus:
  - `restDurationFor({planRestSec: 90, prefSeconds: 120})` -> 90
  - `({planRestSec: null, prefSeconds: 120})` -> 120
  - `({planRestSec: 0, prefSeconds: 120})` -> 120

  The pure module has no React import.
- Real-app items for the reviewer (390x844):
  - log a quick-log set -> the bar appears at the pref duration
  - a block day exercise with rest 90s -> starts at 1:30
  - +15s and Skip work
  - navigate to Home and back -> the remaining time is correct
  - tapping a weight field hides the bar while the keypad is up
  - the pref off -> no bar

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
