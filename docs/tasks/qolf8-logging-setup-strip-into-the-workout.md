# TASK qolf8: The Logging setup strip moves off Home and into the live workout, showing what THIS workout uses

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's call, Oct 9: "move the bar out of the home screen and put it in the
LogChamp workout ... make sure the frontend is nice". "The bar" is qol2's
Logging setup strip (`TrainingPrefsStrip`: sliders icon, lbs, RIR, the notes
pill, Repeat last, Edit), which today sits under Start a workout on Home.
It moves to the top of every live workout, where the settings actually take
effect. Profile > Training keeps the full form.

The logger already reads prefs reactively (`useTrainingPrefs()` in
`SessionDetailPage.jsx`), so changes made in the sheet apply live. One catch
drives most of this block: the effort scale a workout USES is not always the
pref. `liveEffortSignal` (SDP ~line 3737):
- a quick log that already has effort logged keeps that scale
- a block or template day uses its seeded scale
The strip must show what the workout uses, and the sheet must say when a
change won't apply to this workout.

Design rules: `docs/specs/quality-of-life-wave.md` section 2. This is a
visual unit, so the placement and copy below ARE the spec.

FILES TO TOUCH:
- client/src/pages/DashboardPage.jsx   (remove the strip only)
- client/src/pages/SessionDetailPage.jsx
- client/src/components/prefs/TrainingPrefsStrip.jsx
- client/src/components/prefs/TrainingPrefsSheet.jsx
- client/src/components/prefs/TrainingPrefsForm.jsx
- client/src/styles/training-prefs.css
- server/data/app-guide.md   (the two sentences that point at the Home strip)
Do NOT modify anything outside these files.

CHANGE:

1. **Off Home.**
   - Remove `<TrainingPrefsStrip />` and its import from `DashboardPage.jsx`.
   - The hero is followed directly by the next card (the block card, or
     Last 7 days) with the page's normal card gap: no leftover margin, no
     double gap.
   - Nothing else on Home changes.
2. **Into the live workout.**
   - In `SessionDetailPage.jsx`, render the strip on every LIVE session
     (`!isCompleted`): quick logs, template days and block days.
   - Place it directly under the header row (title, subtitle, x and Back)
     and above the workout Name field.
   - It spans the content column, scrolls with the page (NOT sticky, so it
     never takes room from the sets - qolf3's point), and keeps the
     existing strip look.
   - Completed sessions never show it.
3. **The pills say what this workout uses.** Give `TrainingPrefsStrip`
   optional props, so Home-style use and Profile behave as today when they
   are absent:
   - `effortSignal`: `"rir" | "rpe" | null`, overriding the pref for the
     effort pill. SDP passes `liveEffortSignal`. `null` hides the effort
     pill.
   - `effortNote`: a string passed through to the sheet (item 4).
   - The unit pill, notes pill and Repeat last pill stay as they are (they
     already match what the logger renders).
4. **The sheet explains a locked scale.** `TrainingPrefsSheet` and
   `TrainingPrefsForm` accept `effortNote`. When it is given, it renders as
   ONE muted line directly under the Effort scale control, in place of that
   control's usual helper line. The control still edits the pref. SDP sets
   it to:
   - **block or template day** (scale seeded by the plan): "This workout's
     plan uses RIR. Your choice applies to quick workouts."
   - **quick log with effort already logged:** "This workout already has
     RIR logged, so it stays RIR. Your choice applies from your next
     workout."
   - **otherwise:** no note. Changing the scale applies to this workout
     immediately.

   Use RPE in place of RIR to match the actual scale. Sentence case, no
   arrows.
5. **Sheet behaviour in the logger.**
   - The sheet opens above the Finish dock and the rest bar (it already
     stacks at z 80 against the dock's 40 - keep it that way).
   - Opening and closing it never clears a typed but unlogged set draft.
   - Close returns focus to the strip.
   - Changing weight unit, notes switches, Repeat last or the rest timer
     shows up in the logger at once, with no reload.
6. **App guide.** In `server/data/app-guide.md`, line ~9 (the Home
   paragraph) and line ~108 (Training) point at "a short strip ... under
   that" / "the strip on Home". Make both say the setup strip sits at the
   top of a live workout, and that the same choices live under Profile,
   then Training.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean; `node scripts/check-hex.mjs`
  clean; every new `var(--...)` resolves in `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -n "TrainingPrefsStrip" client/src/pages/DashboardPage.jsx` returns
  nothing.
- `grep -n -i "strip on home\|under that, a short strip" server/data/app-guide.md`
  returns nothing.
- DELIVERY.md quotes the SDP code that picks `effortNote`, for all three
  cases in item 4.
- Real-app items for the reviewer (390x844, champ dark, demo.critic):
  - Home: no strip, and the gap from the hero to the next card equals the
    gap between the other cards.
  - A new quick workout: the strip sits under the header and above Name,
    and shows lbs and RIR.
    - Open it, switch to kg: the logger's weight labels switch to kg
      without a reload.
    - Switch back to lbs.
  - On that quick workout, log one set with RIR 2, then open the strip and
    choose RPE:
    - the effort pill stays RIR
    - the "already has RIR logged" note shows
    - the set fields stay RIR
    - set the pref back to RIR
  - A block day (start Phase 1's next day, look, then DISCARD it): the
    strip shows the block's scale, and the sheet shows the plan note.
  - A completed session from History shows no strip.

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
