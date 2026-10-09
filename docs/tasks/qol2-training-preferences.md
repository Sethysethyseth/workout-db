# TASK qol2: Training preferences - one form on Profile and Home, toggles out of the logger

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's ask 1 (`docs/specs/quality-of-life-wave.md` section 1, ruling 1):
lbs/kg, the RIR/RPE choice and the notes toggles leave the logging screen
and live in ONE preferences form. The form is reachable from a new Profile
page AND from a compact strip under Home's log button. The same form also
carries two prefs that later units act on: "Repeat last time's numbers"
(qol7) and the rest timer (qol12). This unit only STORES those two.
Recon with file:line for everything below:
`docs/tasks/qol-r1-recon-logging-prefs-mirror-finish-FINDINGS.md` section
A. Design rules: spec section 2 (follow it all).

FILES TO TOUCH:
- client/src/lib/trainingPrefs.js                 (new - the one accessor
                                                   module + hook)
- client/src/lib/quickWorkoutLogPrefs.js          (add `useSetNotes`)
- client/src/components/prefs/TrainingPrefsForm.jsx   (new)
- client/src/components/prefs/TrainingPrefsSheet.jsx  (new)
- client/src/components/prefs/TrainingPrefsStrip.jsx  (new - the Home strip)
- client/src/pages/profile/TrainingPage.jsx       (new)
- client/src/styles/training-prefs.css            (new)
- client/src/pages/ProfilePage.jsx                (one new row)
- client/src/App.jsx                              (one new route)
- client/src/pages/DashboardPage.jsx              (mount the strip)
- client/src/pages/SessionDetailPage.jsx          (remove the toggles; read
                                                   notes visibility from prefs)
Do NOT modify anything outside these files.

CHANGE:
1. **`trainingPrefs.js`** is the single accessor for every logging
   preference. It wraps the EXISTING modules BY NAME - `weightUnitPref.js`
   (`loadWeightUnit`/`saveWeightUnit`), `effortSignalPref.js`
   (`loadEffortSignal`/`saveEffortSignal`) and `quickWorkoutLogPrefs.js`
   (`useExerciseNotes`, plus a new `useSetNotes`, default false). It adds
   two new device-local keys:
   - `workoutdb-mirror-last`: boolean, default false.
   - `workoutdb-rest-timer`: `{ enabled, seconds }`, default
     `{ enabled: true, seconds: 120 }`. Seconds are clamped to 30-300 in
     15-second steps.

   Do NOT rename or migrate any existing key (rename boundary, AGENTS.md).
   Export `getTrainingPrefs()`, `setTrainingPref(name, value)` and a
   `useTrainingPrefs()` hook. Every subscriber re-renders when any pref
   changes in this tab (dispatch a custom window event on write), so the
   Home strip, the sheet and the Profile page never disagree. Every
   storage access is wrapped in try/catch, like the existing modules.
2. **`TrainingPrefsForm`** has three groups in this order. Group headings
   are sentence case, not caps.
   - **Units and effort**
     - Weight unit: `Segmented` (from `components/blocks/ui`) with lbs |
       kg. Helper: "Changes how weights are shown. Numbers you've logged
       aren't converted." (This is true - see `weightUnitPref.js` header.)
     - Effort scale: `Segmented` with RIR | RPE. Helper: "Used for quick
       workouts and new templates. Blocks and templates keep the scale
       they were built with."
   - **While logging**
     - Exercise notes: switch.
     - Set notes: switch.
     - Repeat last time's numbers: switch. Helper: "Shows what you lifted
       last time in each empty set. Tap the set number to use it."
   - **Rest timer**
     - Switch, plus a duration stepper (m:ss, 15-second steps, 0:30-5:00)
       that is visible only when the switch is on. Helper: "Starts after
       you log a set. A block's own rest time wins."

   Switches follow the `role="switch"` pattern already used in
   `AiConnectorPage.jsx`. Every control has a visible label and writes
   through `setTrainingPref` immediately - no Save button.
3. **Profile:** add a "Training" row FIRST in the Settings section of
   `ProfilePage.jsx` (subtitle: "Units, effort, notes, rest timer"),
   linking to `/profile/training`. `TrainingPage.jsx` follows
   `AppearancePage.jsx`'s page shell (back link, title, groups) and
   renders `TrainingPrefsForm`. Register the route in `App.jsx` beside the
   other `/profile/*` routes, inside `ProtectedRoute`.
4. **Home strip:** `TrainingPrefsStrip` mounts in `DashboardPage.jsx`'s log
   row, directly under the Start / Active hero, for both states. It is one
   full-width button, so the whole strip is the tap target. It contains:
   - small separate value pills - the unit ("lbs"), the effort scale
     ("RIR"), "Notes on" or "Notes off", and "Repeat last" only when that
     pref is on
   - a trailing "Edit" label

   Use pills, NOT a middle-dot string. Tapping opens `TrainingPrefsSheet`,
   a bottom sheet that reuses the existing sheet chrome (the
   `StartWorkoutPicker` sheet pattern) and contains `TrainingPrefsForm`
   plus a "Done" button. The strip is quiet: muted text and a hairline
   border. **The one memorable element on this surface is the live
   update** - changing a pref in the sheet updates the pills behind the
   sheet immediately.
5. **Logger (`SessionDetailPage.jsx`):** remove every preference control
   from the live session:
   - the quick-log Units row
   - the live `RirRpeToggleRow` and its lock line
   - the quick-log notes toggle
   - the template/block "workout description / exercise notes / set notes"
     checkboxes

   KEEP the block's read-only locked-scale chip (it tells the lifter what
   the block set). Behavior after removal:
   - The quick-log effort signal comes from the pref, EXCEPT that a session
     whose sets already carry effort keeps its logged signal (the existing
     `sessionLoggedEffortSignal` rule, unchanged).
   - Template and block sessions keep their own scale, as today.
   - Exercise-note and set-note fields show when the pref is on OR that
     note already has text.
   - The workout description shows when it has text. Otherwise an "Add a
     workout note" text button reveals it - it is content, not a
     preference.
   - The weight unit everywhere still reads `loadWeightUnit()`. The
     existing read sites are unchanged.
6. Styles go in `training-prefs.css`, tokens only. Do not touch `index.css`.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes. `training-prefs.css` has no hex,
  rgb or hsl literal.
- `SessionDetailPage.jsx` no longer imports `RirRpeToggleRow` and no longer
  calls `saveWeightUnit`, `saveEffortSignal` or the quick-log prefs saver
  (grep - quote the zero-hit results).
- These existing keys appear unchanged in the source:
  `workoutdb-weight-unit`, `workoutdb-effort-signal` and
  `workoutdb_quick_log_display_prefs_v1` (grep).
- `/profile/training` is registered inside `ProtectedRoute` in `App.jsx`.
- Behavior examples the reviewer checks in the real app (list each in
  DELIVERY.md with how you verified it, or "needs real-app check"):
  - localStorage `workoutdb-weight-unit` = "kg" -> the Home strip shows
    "kg".
  - Switching to lbs in the sheet changes the strip's pill to "lbs"
    without a reload.
  - A quick log started with the RPE pref shows RPE columns.
  - A session that already has RIR values keeps RIR after the pref
    changes to RPE.
  - An exercise note with text shows even when Exercise notes is off.

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
