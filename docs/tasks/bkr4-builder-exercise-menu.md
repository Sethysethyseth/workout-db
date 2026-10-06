# TASK bkr4: Builder exercise card - settings as chips on the card, "..." = actions only

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2: Seth said the builder's "..." menu "looks a little out of
place... we want it to at the very least look very nice". Today
`ExerciseCard.jsx` opens one popover (`menuPanel`, ~line 172) that mixes
actions (Move up/down, Duplicate, Replace, Fill all from set 1, Delete) with
settings (Reps/Time, Rep range, Rest stepper, effort Target/Cap, Notes) and
runs under the bottom nav at 390px
(`.playwright-mcp/smoke-r2/07c-exercise-menu.png`). Seth picked option 2 from
the mock (https://claude.ai/artifact/E87H65uivuhARz7A94pphN, artboard
"2 · picked - settings on the card, ⋯ = actions only"). This is a
judgment-heavy visual unit: the design below IS the spec.

FILES TO TOUCH:
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/builder/BlockBuilder.jsx   (header "..." button
                                    style only, plus its window.confirm calls
                                    for "Discard this draft?" and "Delete this
                                    day...?" -> in-page confirms)
- client/src/components/blocks/builder/BlockSettingsSheet.jsx (Delete block ->
                                    in-page confirm)
- client/src/components/blocks/builder/ExerciseSettingSheet.jsx (NEW, optional
                                    - one small sheet per setting, built on
                                    BuilderSheet)
- client/src/styles/blocks/bk-builder.css
Do NOT modify anything outside these files. Reuse `BuilderSheet` (phone:
bottom sheet; >=720px: centered dialog), `Stepper`, `Segmented` - do not
build a second sheet or stepper.

CHANGE (the design - fully specified):
1. **Expanded card header row:** slot badge (A, B...) - exercise name (block
   display font, as today) - the "..." button. The "..." is a 40px ROUND
   button with no border box: background
   `color-mix(in srgb, var(--color-interactive) 22%, transparent)`, three
   dots in `var(--color-text)`, `aria-label="Exercise actions"`. Same round
   style for the builder header's "..." (`aria-label="Builder menu"`) - its
   two items (Settings, Close) stay.
2. **Settings chips row under the name** (replaces the summary line that
   opened the menu): pill chips, 32px tall, 6px gap, wrapping; surface
   `var(--color-surface-2)`, 1px `var(--color-border)` border, 13px semibold
   text. Each chip opens a small `BuilderSheet` holding ONLY that setting:
   - "Rest 3:00" (clock icon) -> the Rest `Stepper`; reads "Rest" when unset.
   - "Reps" / "Time" (plus " · range" when a rep range is on) -> the
     Reps/Time `Segmented` plus the Rep range switch (hidden for Time).
   - effort chip, only where the block uses effort today ("RPE cap" /
     "RPE target", or RIR wording per the block's effort setting) -> the
     Target/Cap `Segmented`.
   - "1 note" (pencil icon) / "Add note" -> the notes textarea (same
     1000-char limit and placeholder).
   Changes apply live like today. The sheet title is the setting name. A
   chip whose setting is non-default uses `var(--color-text)`; default ones
   use `var(--color-text-secondary)`.
3. **"..." opens an action sheet** (`BuilderSheet`, title = exercise name in
   the muted 13px style): full-width 50px rows, 20px stroke icon in
   `var(--color-text-secondary)` + 16px label, 14px gap: Move up, Move down,
   Duplicate, Replace exercise, Copy set 1 to every set (today's "Fill all
   from set 1"); a 1px divider; "Remove exercise" in the error text token.
   Move up/down are disabled (not hidden) at the ends. Every action closes
   the sheet. Remove asks first with the in-page confirm (below).
4. **In-page confirms replace `window.confirm`** for Remove exercise, Delete
   this day, Discard this draft, and Delete block. Follow the existing
   pattern on `BlockRunPage.jsx` ("End block": `session-discard-confirm`
   classes, `role="alertdialog"`): title, one plain sentence, a red confirm
   button + Cancel. The unsaved-changes leave guard (`window.confirm` in
   `BlockBuilder.jsx` ~439) stays as is - it is a navigation blocker.
5. **Tokens only;** motion 150-200 ms ease-out on sheet open only; nothing
   covers the field being typed (the existing `bk-builder-kbd` handling must
   still apply inside the new sheets).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Grep: no `window.confirm(` left in `ExerciseCard.jsx` or
  `BlockSettingsSheet.jsx`; `BlockBuilder.jsx` keeps exactly one (the leave
  guard).
- Grep: the old `menuPanel` popover markup (`bk-ex-card__menu-rest`,
  `bk-ex-card__menu-notes`, `bk-ex-card__menu-check`) is gone from
  ExerciseCard.jsx and its CSS rules are removed from bk-builder.css.
- Every new `var(--...)` in bk-builder.css resolves to a property defined in
  `client/src/index.css` (list them in DELIVERY.md).
- Playwright at 390x844 if a browser is available (else say so): expanded
  card shows the chip row; tapping "Rest" opens a sheet with only the Rest
  stepper; "..." opens the action sheet with 6 actions; Remove shows the
  in-page confirm. Screenshots in DELIVERY.md.
- LANDING NOTE (reviewer): the separate-agent critic loop runs on this unit
  (Seth's standing condition for frontend passes).

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
