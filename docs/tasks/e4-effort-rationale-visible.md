# TASK E4: make the effort rationale always-visible in Data quality

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
E3 (`19c2c20`) put the "why we ask for effort" rationale behind a
`HowCalculatedButton` `(?)` on the Data quality coverage row. Seth smoked it
August 2 and reported it as invisible - reasonably, since that page already
carries six `(?)` buttons and the card sits at the bottom of the page. A tap-to-
reveal explainer is a fine place to FILE an explanation and a bad place to
DELIVER one to someone who has never seen it. Seth's August 2 ruling: make it
always visible.

This does NOT remove the `(?)`. Two lengths, two jobs: a short always-visible
line that gets read, and the fuller version (what effort is worth, what is lost
without it) still behind the tap.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx
Do NOT modify anything outside this file. In particular do NOT touch
client/src/index.css - this unit reuses existing classes and adds no CSS.

CHANGE:
In `DataQualitySection`, inside the `meta.effortCoverage !== null` branch only,
add an always-visible one-line rationale BELOW the existing coverage row.

Placement constraint that matters: `.coverage-row` is a two-column grid
(`grid-template-columns: 1fr 120px`, index.css:6535). A paragraph added INSIDE
that div becomes a third grid item and renders in the narrow first column of a
new grid row. The new line must therefore be a SIBLING of the `.coverage-row`
div, not a child - the parent `section.card.stack` handles the vertical
spacing. You will need a fragment to return both from the ternary branch.

Styling: `className="muted small"` with `style={{ margin: 0 }}`, matching the
register already used for secondary explanatory copy on this page and in
`RirRpeToggleRow`. No new class names, no new CSS, no hex.

Add the short copy as a module-level constant beside `HOW_EFFORT_MATTERS`,
named `EFFORT_RATIONALE_SHORT`, with this text VERBATIM:

  "Two sets of 10 can be worlds apart - one at the limit, one with five reps
  left. Effort is how LogChamp tells them apart."

Leave `HOW_EFFORT_MATTERS` and the `HowCalculatedButton` exactly as they are.
The `(?)` keeps the longer copy; do not delete, reword, or relocate it.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `git diff --stat` shows exactly ONE file changed: `client/src/pages/AnalyticsPage.jsx`.
- `EFFORT_RATIONALE_SHORT` appears exactly twice (declaration + usage).
- `HOW_EFFORT_MATTERS` still appears exactly twice and its text is unchanged.
- The new paragraph is a SIBLING of the element with `className="coverage-row"`,
  not a descendant of it. State in DELIVERY.md the surrounding JSX you produced
  so the reviewer can confirm this without guessing.
- The `meta.effortCoverage === null` branch is byte-identical to before.
- The diff introduces NO hex color literals and NO new CSS class names.

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
