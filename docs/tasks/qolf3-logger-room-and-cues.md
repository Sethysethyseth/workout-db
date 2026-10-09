# TASK qolf3: The logger gives the sets their room back - a slimmer sticky header, a one-line Finish dock, sentence-case labels, an Add RIR highlight you can see, a tappable "log as last time"

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 1 (5/10). Read
`docs/tasks/qol-critic-round-1-FINDINGS.md` items #4, #19, #22, #23 for the
measured evidence. The logger is `client/src/pages/SessionDetailPage.jsx`
(SDP). qol4 added the effort highlight, qol7 added the "log as last time"
set-number button, and qol12 added the rest bar inside the Finish dock.
Seth's first feel criterion is "nothing cramped", and today the chrome
leaves about 560 of 844px for sets. Design rules:
`docs/specs/quality-of-life-wave.md` section 2. New CSS goes in the NEW file
below, imported by SDP. Do NOT edit `client/src/index.css`; override from
the new file. Runs in parallel with qolf1, qolf2 and qolf4. None of them
touch these files.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx
- client/src/styles/logger.css   (NEW, imported by SessionDetailPage.jsx)
- client/src/components/templates/ViewModeToggle.jsx   (labels only)
- client/src/components/templates/SetRow.jsx   (labels only)
- client/src/components/templates/WorkoutTemplateTableView.jsx   (labels only)
Do NOT modify anything outside these files. In particular, leave
`RestTimerBar.jsx`, `rest-timer.css`, `bk-log.css`, `training-prefs.css`,
`ConfirmPanel.jsx` and the block-day components (`BlockExerciseCard`,
`BlockSetRow`) alone. If the slimmer header or dock needs them, say so in
DELIVERY.md instead.

CHANGE:

1. **A slimmer sticky exercise header (#4, P2).** On a quick workout at
   390x844, the sticky part of each exercise is about 125px: the name,
   Tracked, "Last time: Sep 8", and a full-width "Remove exercise" button.
   - Only the exercise name line (with its Tracked indicator) stays sticky.
   - "Last time" scrolls with the content, right under the header.
   - "Remove exercise" leaves the sticky area. Put it behind a 44px "..."
     on the name line that opens the app's existing sheet or confirm
     pattern, or at the foot of that exercise's sets (not sticky). Pick one
     and say which in DELIVERY.md.
   - Removing an exercise still asks first (in-app, never
     `window.confirm`), with the same copy as today.
   - Target: the sticky part is 64px tall or less.
2. **A one-line Finish dock (#4, P2).** The dock is 120px with two lines of
   standing copy ("Autosaves as you go. Finishing saves it to your
   history."), and 155px once the rest bar shows.
   - Once at least one set is logged, the standing copy is gone (the
     autosave line may stay while nothing is logged yet).
   - The dock is the Finish button plus the rest bar when it runs.
   - Target with a set logged and no rest bar: the dock is 80px tall or
     less, including its padding.
   - Do not change the rest bar's own layout (qol12's file).
   - The keypad-hides-dock behaviour from qol12 stays.
3. **Sentence-case labels (#19, P3).**
   - "Builder View" becomes "Builder view" and "Table View" becomes "Table
     view" (update the comment in `ViewModeToggle.jsx` that pins the old
     casing).
   - "Reps in Reserve" becomes "Reps in reserve" wherever it renders in
     these files.
   - Sweep SDP for other Title Case visible labels and fix them. List each
     change in DELIVERY.md.
   - Proper nouns and the RIR / RPE abbreviations stay as they are.
4. **"Add RIR" lands you on the field (#22, P3).** Today "Add RIR" on the
   finish warning scrolls to the missing fields, marked only by a 1px amber
   border and a label tint. The second highlighted field can land under the
   Finish dock.
   - Scroll the FIRST missing field to about the vertical middle of the
     space between the sticky header and the dock, so it is never under
     either.
   - Give each missing field one 200ms tint pulse derived from the warning
     token via `color-mix`, then a steady tinted background (not just a
     border) until a value is entered. Keep the label tint.
   - Under `prefers-reduced-motion`: the steady tint, no pulse, no smooth
     scroll.
5. **"Log as last time" looks tappable (#23, P3).** On rows that show
   last-time ghosts, the set-number button (aria-label "Log set N as last
   time") is a bare number box with no cue.
   - On those rows only, give it an accent outline derived from
     `--color-interactive` via `color-mix`, plus a small check mark next to
     or under the number.
   - Rows without ghosts keep today's look.
   - The 44px target and the existing behaviour (log the ghost values, never
     effort) are unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean, and `node scripts/check-hex.mjs`
  reports no new raw colours. Every new `var(--...)` resolves in
  `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -rn "Builder View\|Table View\|Reps in Reserve" client/src/pages/SessionDetailPage.jsx client/src/components/templates/ViewModeToggle.jsx client/src/components/templates/SetRow.jsx client/src/components/templates/WorkoutTemplateTableView.jsx`
  returns nothing.
- `grep -n "window.confirm\|confirm(" client/src/pages/SessionDetailPage.jsx`
  shows no NEW calls. qol4 left one bare `confirm("Delete this set?")` in
  `onDeleteSet`; replacing it with `ConfirmPanel` (danger tone) is in scope
  and welcome.
- DELIVERY.md says, per item 1-5, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer (390x844, champ dark, a quick workout with
  "Barbell Squat" and Repeat last on):
  - The sticky exercise header is 64px tall or less.
  - With one set logged and no rest bar, the Finish dock is 80px tall or
    less, and none of the standing autosave copy shows.
  - Rest bar running: the dock grows only by the bar's own height.
  - "Builder view" / "Table view" render in sentence case.
  - With 3 sets logged and only one RIR, Finish then "Add RIR": the first
    missing RIR field's centre sits between the sticky header's bottom and
    the dock's top, and it has a tinted background.
  - Ghost rows' set-number buttons show the accent outline and the check;
    a row without ghosts does not.
  - Removing an exercise still asks first.

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
