# TASK qolf4: Logging setup polish (sheet fit, visible off switches, honest Notes pill, desktop width) and one selection look in the builder, plus a lift you can see

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 1 (5/10). Read
`docs/tasks/qol-critic-round-1-FINDINGS.md` items #10, #15, #16, #17, #18, #29
for the measured evidence. The prefs surfaces came from qol2 (Home strip,
Logging setup sheet, Profile > Training). The builder items sit on qol3's
hold-to-move and qol9's accent week pill. Design rules:
`docs/specs/quality-of-life-wave.md` section 2. `Segmented`, `DayPicker` and
`WeekStrip` are shared with Library, import, the run page and Home: change
their look ONLY inside the block builder, scoped in `bk-builder.css`. Their
behaviour and look elsewhere must not change. Runs in parallel with qolf1,
qolf2 and qolf3. None of them touch these files.

FILES TO TOUCH:
- client/src/components/prefs/TrainingPrefsSheet.jsx
- client/src/components/prefs/TrainingPrefsForm.jsx
- client/src/components/prefs/TrainingPrefsStrip.jsx
- client/src/pages/profile/TrainingPage.jsx
- client/src/styles/training-prefs.css
- client/src/styles/blocks/bk-builder.css
Do NOT modify anything outside these files.

CHANGE:

1. **The Logging setup sheet fits (#15, P3).** At 390x844 the sheet is about
   98% of the screen tall. Rest Duration sits below the fold in an inner
   scroller with a native grey scrollbar, the help text runs flush into the
   scrollbar ("aren't"), and the "Units and effort" header touches its
   subtitle.
   - Cap the sheet at about 85% of the viewport height.
   - Give the scroll area right padding, so no text touches a scrollbar.
   - Tighten section gaps so the whole form, including the rest duration
     stepper, fits at 844 without scrolling when the rest timer is on. If it
     still cannot fit, it scrolls with the padding fix. Report which in
     DELIVERY.md.
   - Give each section header clear space above its subtitle.
   - Keep the existing sheet chrome (rule 6) and keyboard safety.
2. **Off switches are visible (#16, P3).** In champ dark an off switch is a
   dark knob on a dark track ("Set notes"). Give the off state a knob and
   track pair with at least 3:1 contrast between knob and track in every
   palette x mode combo.
   - Tokens only: derive from existing surface and text tokens via
     `color-mix`.
   - The on state is unchanged.
3. **The Notes pill says what is on (#17, P3).** The Home strip shows "Notes
   on" while set notes are off. Show:
   - "Notes on" only when both exercise notes and set notes are on
   - "Exercise notes" or "Set notes" when only that one is on
   - no notes pill when both are off
   The other pills are unchanged.
4. **Profile > Training at desktop width (#18, P3).**
   - At 900px and wider, segmented controls are capped at about 360px wide
     instead of stretching to the card's width (about 640px at 1280).
   - The subtitle says "on this device" instead of "on this phone". The
     prefs are stored per device. Apply the same wording anywhere else
     these files say "phone" for that meaning.
5. **One selection look in the builder (#10, P2).** qol9 made the selected
   week pill accent-tinted. The selected DAY pill still has a white outline,
   and the selected segment of the Edit / Progression switch (and of the
   Reps / Time sheet's switch) is solid white.
   - Inside the builder only, the selected day pill and the selected segment
     use the same `color-mix` accent treatment as the selected week pill.
   - Unselected states are unchanged.
   - Scope every rule under the builder's root class in `bk-builder.css`.
6. **The lift is visible (#29, P3).** A held exercise card (qol3's
   hold-to-move, axis y) shifts only about 5px, with no shadow or accent.
   - While lifted, the card gets an elevation shadow plus an accent border or
     glow derived from `--color-interactive`, so it reads on dark navy.
   - It animates in over 150-250ms ease-out.
   - Under `prefers-reduced-motion`: the same lifted look, no animation.
   - Match how sr3f2 made the lifted DAY pill visible (`.bk-pill--lifting`
     in `bk-builder.css`) so the two lifts read as one family.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean, and `node scripts/check-hex.mjs`
  reports no new raw colours. Every new `var(--...)` resolves in
  `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -rn "this phone" client/src/pages/profile/TrainingPage.jsx client/src/components/prefs`
  returns nothing.
- The strip's notes-pill rule maps (exercise, set) as follows:
  (on, on) -> "Notes on"; (on, off) -> "Exercise notes";
  (off, on) -> "Set notes"; (off, off) -> no pill. DELIVERY.md quotes the
  code that does it.
- DELIVERY.md says, per item 1-6, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer:
  - At 390x844 with the rest timer on, the Logging setup sheet is 85-88% of
    the viewport tall. Either it shows no inner scrollbar, or no text box
    overlaps the scrollbar gutter.
  - An off switch's knob vs track contrast is >= 3:1 in champ dark and
    crimson light.
  - At 1280, Profile > Training's segmented controls are 380px wide or less.
  - In the builder (demo.critic "Upper/Lower 4wk", NEVER saved), the
    selected day pill and the selected Edit segment are accent-tinted, not
    white. The Library and Home segmented and day controls look exactly as
    before.
  - Holding an exercise card shows a visible shadow plus an accent edge, and
    dropping it still reorders and marks the block Unsaved.

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
