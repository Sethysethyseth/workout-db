# TASK bksf3a: Builder - set-grid headers line up with their fields on rep-range rows at phone widths

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Critic round 3 (`docs/tasks/bks-critic-round-3-FINDINGS.md`, P1-2) measured the
block builder at 390px (375px usable). On REP-RANGE exercises the set-grid
header row drifts one column: "RPE" sits over the load field and "LOAD" over
the reps-max field. Header centres were REPS 114 / TO 165 / LOAD 216 / RPE 268
against field centres 122 / 191 / 259 / (RPE wrapped to its own line). At 430px
and 1280px everything lines up to the pixel, so it is phone-only. Cause:
bksf2a's `@media (max-width: 399px)` rule turns
`.bk-set-grid__row--range.bk-set-grid__row--effort` into a wrapping flex row
while the header (`.bk-set-grid__head`) keeps the 5-field grid. Fixed-rep rows
are correct (inline RPE, 380px 4-set card) - do not regress them.

FILES TO TOUCH:
- client/src/styles/blocks/bk-builder.css
- client/src/components/blocks/builder/ExerciseCard.jsx (only if the header
  markup has to change to match the rows)
Do NOT modify anything outside these files.

CHANGE:
1. On a rep-range exercise with effort shown (Set | Reps | To | Load | RPE | x),
   every visible header label sits over its own field at EVERY width from 360px
   up. Pick the approach:
   - preferred: keep all fields on ONE row down to 360px (narrower fields;
     values are 1-3 digits), so no wrap happens at all at 360px+; or
   - if a wrap is unavoidable below some width, the header must use the same
     layout as the rows below it, and any field that wraps carries its own
     visible label (the existing `.bk-set-grid__effort-label` pattern) while
     its header cell is hidden.
2. The remove x stays in one column on every row (unchanged contract).
3. Fixed-rep rows, timed rows and the 1280px layout stay as they are.
4. Touch targets: every number field stays at least 44px tall; width may
   shrink but no field narrower than 44px.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
  `npm run test:unit` from `server/` green (no server change expected).
- **Hook rule:** no hook after an early return in any component you touch
  (state it in DELIVERY.md, or "no JSX touched").
- DELIVERY.md includes an alignment measurement at viewport widths 360, 375
  and 390, for a 3-set rep-range card WITH effort and a 4-set fixed-rep card
  with effort: for each column, header-label centre x vs field centre x, and
  the card height. Pass = every visible header within 6px of its field
  centre at all three widths. Method is your choice (bksf2a used a temp
  Playwright fixture page outside the repo; delete any scratch files).
- The fixed-rep 4-set card stays at or under 440px tall at 390.

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
