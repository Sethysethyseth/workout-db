# TASK qolf9: The setup strip becomes a hotbar - tap RIR or RPE, Exercise notes, and Repeat last right on the bar

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's smoke finding, Oct 9: "i want the bar itself to have rir rpe
exercise notes and repeat last, you can switch between rir and rpe one of
them will glow showing that thats your option, and you can tap on exercise
notes and repeat last for them to glow to indicate that their on ... the
edit button still sits there but the bar should act as a hotbar. this isnt
a crazy change just simple fix".

Today `TrainingPrefsStrip` (qol2, moved into the live workout by qolf8) is
ONE button: sliders icon, read-only pills (lbs, RIR, notes, Repeat last),
and "Edit"; tapping anywhere opens `TrainingPrefsSheet`. It renders only in
`SessionDetailPage.jsx` (two call sites: quick/template under the header,
block day under the block header), always with
`effortSignal={liveEffortSignal} effortNote={liveEffortNote}`. Prefs are
written with `setTrainingPref(name, value)` from `lib/trainingPrefs.js`,
which notifies every `useTrainingPrefs()` reader, so the logger already
reacts live to a change.

This turns the strip into a row of real toggles. Design rules:
`docs/specs/quality-of-life-wave.md` section 2. This is a visual unit, so
the layout, states and copy below ARE the spec.

FILES TO TOUCH:
- client/src/components/prefs/TrainingPrefsStrip.jsx
- client/src/styles/training-prefs.css
- client/src/data/whatsNew.js   (two copy strings only, item 6)
- server/data/app-guide.md      (two sentences only, item 6)
Do NOT modify anything outside these files. `SessionDetailPage.jsx` does
not change: the two call sites and their props stay exactly as they are.

CHANGE:

1. **The bar, left to right, on ONE line at 390px:**
   - **RIR | RPE** - a joined pair (two halves of one control). Exactly
     one half glows: the scale this workout uses (`effortSignal` prop,
     falling back to the pref when the prop is absent, as today). When
     the resolved scale is `null`, the pair is not rendered.
   - **Exercise notes** - glows when `useExerciseNotes` is on.
   - **Repeat last** - glows when `mirrorLast` is on.
   - **Edit** - text button at the end, `--color-interactive` text, as
     today. Opens `TrainingPrefsSheet` exactly as the whole strip does
     now (same `effortNote` pass-through).
   - Removed from the bar: the sliders icon, the weight-unit pill, and
     the combined notes pill ("Notes on" / "Set notes"). Weight unit and
     Set notes stay in the sheet behind Edit and under Profile, then
     Training.
2. **Taps.** Each chip is its own `<button type="button">`; the strip
   itself is no longer a button. The row is a `role="group"` with
   `aria-label="Logging setup"`.
   - Exercise notes: `setTrainingPref("useExerciseNotes", !current)`.
   - Repeat last: `setTrainingPref("mirrorLast", !current)`.
   - RIR / RPE, when `effortNote` is NOT given (a quick log with no effort
     logged yet): tapping the unlit half calls
     `setTrainingPref("effortSignal", "rir" | "rpe")`, and the glow moves
     because the workout follows the pref. Tapping the lit half does
     nothing.
   - RIR / RPE, when `effortNote` IS given (the scale is locked by the
     plan, or effort is already logged): the glow stays on the workout's
     scale, and tapping the unlit half opens the sheet instead of
     switching (the sheet's note explains why). Tapping the lit half does
     nothing. The pref is never changed from the bar in this case.
   - Every chip carries `aria-pressed` (true when lit). A tap never
     clears a typed but unlogged set draft and never reloads the page.
3. **States (tokens only, every palette x mode):**
   - **Lit ("glow"):** the existing `.training-prefs-pill--accent` look -
     tint, border and text derived from `--color-interactive` via
     `color-mix` - plus a soft outer glow, also derived from
     `--color-interactive` via `color-mix` (no raw colors, no new
     tokens). This is the bar's one memorable element.
   - **Unlit:** quiet - the neutral pill surface with
     `--color-text-secondary` text. Clearly readable as "off", not
     disabled-grey.
   - **Change:** the lit state fades in over 150-200ms ease-out; under
     `prefers-reduced-motion: reduce` it switches instantly.
   - Focus-visible ring on every chip and on Edit, matching the existing
     `.training-prefs-strip:focus-visible` outline.
4. **Size.** The bar keeps the surface fill, border and radius it has
   today and stays a single line at 390x844 (no wrap, no horizontal
   scroll). Every chip and Edit has a hit area at least 44px tall and at
   least 44px wide (the visible pill may be smaller and centred in it).
   Keep the bar at most 56px tall overall. If the row cannot fit at 390,
   tighten padding and gaps first; do NOT drop a chip or shorten a label.
5. **Focus.** Closing the sheet returns focus to Edit (it returned to the
   strip button before).
6. **Copy that describes the strip.**
   - `client/src/data/whatsNew.js`, the "Logging" item that ends "A strip
     at the top of each workout shows your setup." - replace that last
     sentence with: "The bar at the top of each workout switches the
     common ones in one tap."
   - Same file, the "Logging setup in one place" body - replace its last
     two sentences ("Open them from the strip ... which notes are on.")
     with: "The bar at the top of a live workout switches RIR or RPE,
     exercise notes, and Repeat last in one tap. Edit on that bar, or
     Profile, then Training, has the rest." Its `where` becomes: "The
     bar at the top of a live workout, or Profile, then Training".
   - `server/data/app-guide.md` line ~9: replace "The setup strip sits at
     the top of a live workout and shows your logging setup (units,
     effort, notes). Tap it to open Logging setup." with "The setup bar
     sits at the top of a live workout. Tap RIR or RPE to pick the effort
     scale, and tap Exercise notes or Repeat last to turn them on or off.
     Edit opens the rest of Logging setup."
   - `server/data/app-guide.md` line ~108: replace "The setup strip sits
     at the top of a live workout." with "The setup bar at the top of a
     live workout switches the effort scale, Exercise notes, and Repeat
     last in one tap. Edit opens the rest."
   - Leave every other sentence in both files untouched.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean; `node scripts/check-hex.mjs`
  clean; every new `var(--...)` resolves in `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH (and NOT
  `SessionDetailPage.jsx`).
- `grep -n "aria-pressed" client/src/components/prefs/TrainingPrefsStrip.jsx`
  returns at least one line; `grep -n "SlidersIcon\|weightUnit" client/src/components/prefs/TrainingPrefsStrip.jsx`
  returns nothing.
- `grep -n -i "shows your logging setup\|setup strip sits at the top" server/data/app-guide.md`
  returns nothing; `grep -n "which notes are on\|shows your setup" client/src/data/whatsNew.js`
  returns nothing.
- DELIVERY.md quotes the strip's click handlers for all four chips,
  including the locked-scale branch of item 2.
- Real-app items for the reviewer (390x844, champ dark AND one light
  palette, demo.critic):
  - A new quick workout: the bar reads RIR | RPE, Exercise notes, Repeat
    last, Edit on one line; RIR lit (pref RIR).
    - Tap RPE: RPE lights, RIR goes quiet, the set fields switch to RPE,
      no reload. Tap RIR to switch back.
    - Tap Exercise notes off: it goes quiet and the exercise notes field
      leaves the logger; tap again to restore.
    - Tap Repeat last: it lights and the grey last-time numbers appear in
      empty sets; tap again to turn it off.
    - Type a weight into a set without logging it, then tap Repeat last
      twice: the typed weight is still there.
  - Same quick workout, log one set with RIR 2, then tap RPE: the sheet
    opens with the "already has RIR logged" note; the bar still lights
    RIR; the pref is still RIR. Close: focus is on Edit.
  - A block day (start Phase 1's next day, look, then DISCARD it): the
    plan's scale is lit; tapping the other one opens the sheet with the
    plan note.

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
