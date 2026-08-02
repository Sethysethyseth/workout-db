# TASK E3: analytics "why we ask for effort" explainer on the coverage row

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
E-wave education unit. Analytics already explains what each metric COSTS when
effort is missing (`HOW_STIMULATING_SETS` says such sets are "excluded from this
number") and `MetricInfoButton` already defines RIR/RPE at logging time. What is
missing is the conceptual WHY - the reason LogChamp asks for an effort signal at
all. Seth's August 2 ruling: it belongs in Analytics, brief, at the point where
the user sees their own coverage number.

NOT the dropped E-wave education unit. QUEUE.md records that an "education copy"
unit was dropped as already implemented - that referred to the RirRpeToggleRow
nudge copy shipped as E2. The `DataQualitySection` coverage row
(`AnalyticsPage.jsx:596-619`) has a meter and a sentence but NO explainer
button; verified by direct read August 2. This unit adds that one button.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx   (one new copy constant; render an
                                        existing HowCalculatedButton on the
                                        coverage row)
Do NOT modify anything outside this file. In particular do NOT touch
client/src/index.css - this unit reuses existing classes and adds no CSS.

CHANGE:
In `DataQualitySection` (`AnalyticsPage.jsx:596`), render a `HowCalculatedButton`
adjacent to the existing coverage sentence "Effort (RIR or RPE) logged on N% of
sets". Follow the way this page already places that component inline with metric
labels - see the `Effective` label (line ~248) and the `Balance` label (line
~407). `HowCalculatedButton` is already imported at line 6; do not re-import,
do not modify the component, do not add a new popover mechanism.

Add the copy as a module-level constant next to the existing `HOW_*` constants
(lines 50-59), named `HOW_EFFORT_MATTERS`, with this text VERBATIM - the wording
is the spec, not a suggestion:

  "Two sets of 10 can be worlds apart - one taken to the limit, one with five
  reps left. RIR (or RPE) is how LogChamp tells them apart, so hard sets count
  for more than easy ones. Sets logged without it still count toward volume,
  but cannot feed stimulating sets, matched-effort trends, or execution."

Pass `title="Effort logging"` so the button's `aria-label` reads "How is Effort
logging calculated?".

Placement constraint: the button goes on the coverage row inside the
`meta.effortCoverage !== null` branch ONLY. The `null` branch ("no attributed
sets in range") must stay exactly as it is - a user with no sets at all has
nothing to explain, whereas a user at 0% coverage DOES render the coverage row
and is precisely the reader this copy is for.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `git diff --stat` shows exactly ONE file changed: `client/src/pages/AnalyticsPage.jsx`.
- The string `HOW_EFFORT_MATTERS` appears exactly twice in the file: once as the
  constant declaration, once as the `copy` prop.
- The diff introduces NO hex color literals and NO new CSS class names.
- With `meta.effortCoverage = 0`, the Data Quality section renders the coverage
  sentence AND the `(?)` button; with `meta.effortCoverage = null`, it renders
  "no attributed sets in range" and NO `(?)` button. State in DELIVERY.md how
  you verified this (reading the rendered branches is acceptable evidence -
  there is no test harness for this page).

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
