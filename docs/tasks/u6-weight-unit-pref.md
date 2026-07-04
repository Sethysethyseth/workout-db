# TASK U6: weight-unit display preference (lbs/kg) in log prefs + analytics

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The app stores weights as bare numbers - the user types whatever they lift
in, and no screen labels a unit EXCEPT the new AnalyticsPage, which
hardcodes "kg". Seth logs in lbs. Product decision (Seth, July 2): add a
lbs/kg option in the same top prefs area of the live/quick workout log that
holds the RIR/RPE and Exercise-notes toggles, and have analytics honor it.
This is a DISPLAY preference only: it declares what unit the user logs in.
Never convert stored numbers - no arithmetic on weights anywhere in this
task.

FILES TO TOUCH:
- client/src/lib/weightUnitPref.js       (NEW - device-local pref accessor)
- client/src/pages/SessionDetailPage.jsx (Units group in the
                                          quick-log-display-prefs block)
- client/src/pages/AnalyticsPage.jsx     (replace hardcoded "kg" labels)
Do NOT modify anything outside these files.

CHANGE:

1. NEW `client/src/lib/weightUnitPref.js`, patterned on
   `quickWorkoutLogPrefs.js` (try/catch around localStorage, tolerate junk):
   - `const STORAGE_KEY = "workoutdb-weight-unit";` (matches the
     `workoutdb-theme` / `workoutdb-palette` key style; internal identifier,
     rename boundary applies - never "logchamp").
   - `loadWeightUnit()` -> `"lbs" | "kg"`; anything unrecognized or absent
     -> `"lbs"` (the default; Seth's data is lbs and the kg label in
     analytics was a wrong guess).
   - `saveWeightUnit(unit)` - persists only if `"lbs"` or `"kg"`.
   - Doc comment: display-only preference (what unit the user logs in);
     stored weights are unit-agnostic numbers and are never converted.
     Device-local now; all reads go through this accessor so account-level
     promotion later is one swap (same pattern as the theme-storage
     decision).

2. `SessionDetailPage.jsx`: in the `quick-log-display-prefs` block (the one
   rendering `RirRpeToggleRow` + the "Exercise" notes group, ~line 1862),
   add a "Units" group AFTER the Exercise group, matching the existing
   markup exactly: `quick-log-display-prefs__group stack` wrapper,
   `quick-log-display-prefs__label muted small` label "Units", then a
   `quick-log-toggle-row row` with two `quick-log-toggle` buttons "lbs" and
   "kg". Radio semantics, NOT independent toggles: exactly one carries
   `quick-log-toggle--on` (+ `aria-pressed`); clicking the other switches.
   State: `useState(() => loadWeightUnit())`; clicking calls
   `saveWeightUnit(next)` + setState. Do not touch `RirRpeToggleRow` or
   `quickWorkoutLogPrefs.js` - the unit pref is app-wide, not part of the
   quick-log prefs object.
   Do NOT add unit labels to set rows / table headers in this task (that
   sweep touches shared template components - separate unit if wanted).

3. `AnalyticsPage.jsx`: rename `formatKg` -> `formatWeight` and read the
   unit via `loadWeightUnit()` (module-level call or lazy state initializer
   - the page re-reads on mount, which is enough; no live sync needed).
   `formatWeight` renders `` `${Number(n).toFixed(1)} ${unit}` ``. Replace
   BOTH hardcoded "kg" sites: the `formatKg` template and the bestSet cell
   (`` `...kg × reps` `` around line 157). No other text or layout changes.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` green from client/.
- `rg '\bkg\b' client/src/pages/AnalyticsPage.jsx` -> only hits inside
  weight-unit plumbing (the `"kg"` option value), no hardcoded display
  literals.
- `rg 'workoutdb-weight-unit' client/src` -> exactly one definition site
  (the lib module).
- No arithmetic on weight values anywhere in the diff (display-only).
- Manual check (reviewer will smoke): toggling Units in the live-log prefs
  to kg then loading /analytics shows "kg" labels; default with clean
  localStorage shows "lbs"; both toggle buttons render correctly in all
  palettes because they reuse `quick-log-toggle` classes (no new CSS).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
