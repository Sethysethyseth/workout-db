# TASK qolf6: Logger round-2 fixes - the Add RIR tint shows with Repeat last on, an honest exercise remove, a suggestion list clear of the dock, a Sets count that matches the rows

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 2 (wave 6/10). Read
`docs/tasks/qol-critic-round-2-FINDINGS.md` Part A items #2, #4, #5 and #11
for the measured evidence. The logger is
`client/src/pages/SessionDetailPage.jsx` (SDP), plus qolf3's
`client/src/styles/logger.css`. Design rules:
`docs/specs/quality-of-life-wave.md` section 2. Do NOT edit
`client/src/index.css`. Runs in parallel with qolf7; neither touches the
other's files.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx
- client/src/styles/logger.css
Do NOT modify anything outside these files.

CHANGE:

1. **The Add RIR tint shows when Repeat last is on (#2, P2).** Ghost and
   hint inputs carry the inline `LAST_TIME_GHOST_INPUT_STYLE` (SDP ~line
   288: `background` and `border`). Inline style beats qolf3's
   `.session-set-field--needs-value input` tint, so with Repeat last on
   (the common case) only the label turns amber.
   - Move that style object into a class in `logger.css`, so the
     missing-effort tint rule wins when both apply.
   - Ghost inputs keep their current look, and the tint (pulse + steady
     fill) shows on every missing effort field with or without Repeat last.
2. **The exercise "..." is honest (#4, P2).** Today "..." (aria-label
   "Remove <name>") jumps straight to "Remove <name>?" / "Yes, remove" /
   "Cancel": no consequence line, generic buttons, and a "..." that promises
   a menu.
   - Replace the "..." glyph with a 44px trash icon in the app's stroke-icon
     style. Keep aria-label "Remove <name>".
   - The danger `ConfirmPanel`:
     - title "Remove <name>?"
     - body with the logged-set count: "Your 2 logged sets will be deleted."
       (singular for 1; "Nothing is logged yet." for 0)
     - buttons "Remove exercise" / "Keep exercise"
3. **The exercise-name suggestion list clears the Finish dock (#5, P3).**
   While the name input is focused, the catalog suggestion list runs under
   the fixed Finish dock and its last options are hidden.
   - Cap the list's height to the visible space between the input's bottom
     and the dock's top (or the viewport bottom when the dock is hidden).
   - The list scrolls inside itself. Use the same measuring approach qolf3
     used for Add RIR (sticky bottom vs dock top), not a fixed number.
4. **The Sets count matches the rows, and Add set stays put (#11, P3).**
   - With Repeat last on, the "Sets" select shows the LOGGED count ("1",
     then "2") while 4 rows (logged + ghost) render. Make the select show
     the number of set rows on screen.
   - Choosing a number still adds or removes rows exactly as today:
     lowering it below the logged count still goes through the existing
     danger confirm.
   - "+ Add set" jumps from above the rows to below them after the first
     log. Keep it in ONE place, below the last row, before and after
     logging.
   - Per-side exercises follow the same rule per pair.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean; `node scripts/check-hex.mjs`
  clean; every new `var(--...)` resolves in `client/src/index.css`.
- `git diff --name-only` lists only the two files above.
- `grep -n "LAST_TIME_GHOST_INPUT_STYLE" client/src/pages/SessionDetailPage.jsx`
  returns nothing, or only a definition no longer passed as `style=`.
- `grep -n '"Yes, remove"' client/src/pages/SessionDetailPage.jsx` returns
  nothing.
- DELIVERY.md says, per item 1-4, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer (390x844, champ dark, quick workout with
  Barbell Squat, Repeat last on):
  - Log 2 sets from last time, then Finish and Add RIR: every missing RIR
    field has the tinted background (not only the label).
  - The trash icon opens "Remove Barbell Squat?" with "Your 2 logged sets
    will be deleted." and Remove exercise / Keep exercise. Keep exercise
    closes it.
  - Focus the exercise name and type "squat": the last suggestion's bottom
    is above the dock's top.
  - The Sets select reads 4 with 4 rows showing. "+ Add set" sits below the
    last row both before and after logging set 1.

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
