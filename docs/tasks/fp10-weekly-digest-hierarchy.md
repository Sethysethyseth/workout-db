# TASK FP10: Home weekly digest - structure the PR line, give the digest a hierarchy

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Smoke finding (Seth, July 20 staging drive): the Home weekly report band is
"too simple - just plain text." Four different kinds of insight - muscle
movers, PRs, execution verdict, nudge - all render as identical muted grey
paragraphs (`WeeklyReport.jsx:206-216`), and the PR line is a run-on
sentence assembled by `formatPRsLine` (`:111-122`) that repeats the full
exercise name per PR:

  "2 PRs this week - Barbell Bench Press - Medium Grip e1RM 267 lbs,
   Barbell Bench Press - Medium Grip 160 lbs x 20"

The server already ships fully structured data - `prs[]` with `type`,
`value`, `weight`, `reps`, `performedAt`, `exerciseName`
(`server/src/analytics/summary.js:160-174`). The client flattens that
structure into one string and throws the hierarchy away. This unit is
PRESENTATION ONLY: no server change, no analytics change, no change to
which PRs are detected.

The brief in Seth's words is "something in between too much and too
simple." Read that as: give each insight a visual anchor and a rank, using
vocabulary the design system already has. It is NOT a licence to add
decoration. AGENTS.md's anti-goals apply - restraint, ~150-250ms ease-out if
any motion at all, "flashy reads as amateur."

FILES TO TOUCH:
- client/src/components/analytics/WeeklyReport.jsx
- client/src/index.css
Do NOT modify anything outside these files. In particular do NOT touch
client/src/components/analytics/ExercisesView.jsx or anything under
server/ - parallel units (FP9, FP11) own those this wave.

CHANGE:

**1. PRs become structured rows, not a sentence.**

Replace the single run-on `prsLine` paragraph with a small list: one row per
PR. Each row carries, in this rank order:

- a **"PR" chip** - reuse the EXISTING `.session-set-pr-chip` pattern
  (`index.css:6768-6780`, used on completed set rows at
  `SessionDetailPage.jsx:1156-1158`). It already means exactly "personal
  record" in this product; reusing it makes Home and the session page speak
  the same language. Extract or extend the class rather than authoring a
  second PR-badge look.
- the **achievement** as the prominent element - the weight x reps, or the
  estimate for an `e1rmPR`
- the **exercise name** as subordinate, muted

**Group by exercise**: when one exercise sets several PRs in the week, its
name appears ONCE with its achievements together. This alone removes most of
the noise in the reported example.

Keep the existing cap of 3 shown (`prs.slice(0, 3)`). When more exist, add a
quiet "+N more" affordance in the established muted/small idiom - not a
button, not a new interaction.

`e1rmPR` rows must show the estimate WITHOUT pairing it to a rep count -
`WeeklyReport.jsx:114-115` already does this correctly via `formatEstimate`
and must stay correct. (A sibling unit FP9 is fixing the same class of bug
on the Personal records card; do not let it regress here.)

**2. The digest gets a hierarchy.**

Today all four lines are `className="weekly-report__digest-line muted small"`.
Give the block a rank: the PR rows are the headline when PRs exist, and
movers / execution / nudge stay subordinate supporting lines. Express rank
through the existing token vocabulary - text scale, weight, and
`--color-text-secondary` vs `--color-muted` - not through new colors or
borders.

Drop the hardcoded `"Execution: "` JSX prefix in favour of the same
label treatment you give the other supporting lines, so the four line types
look like one system rather than three ad-hoc strings and a prefix.

**3. Constraints that are not negotiable.**

- **Tokens only.** No hardcoded hex. Every new surface must read correctly
  across all 4 palettes x light/dark (8 combos). Accent-adjacent states
  derive from `--color-interactive` via `color-mix`, per AGENTS.md.
- **Do NOT use `card--live`.** It means exactly one thing in this product -
  a live in-progress workout (`index.css:5062-5081`). It is not an emphasis
  tool.
- **Every existing empty/partial state must survive unchanged**
  (`WeeklyReport.jsx:202-204`, `260-286`): the whole band returns null while
  loading, on fetch failure, and when both windows are empty; the digest
  block is omitted entirely when all four lines are null; the PR rows are
  omitted when `prs` is empty; a prior-only week still shows the nudge. A
  week with no PRs must look exactly as it does today minus nothing.
- No new dependencies. No animation beyond the stated restraint budget, and
  none at all is an acceptable answer.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` from `client/` compiles with no errors.
- `npm run test:unit` from `server/` still green (this unit should not touch
  it; prove it did not).
- `node scripts/check-hex.mjs` passes - no hardcoded hex introduced.
- Given a `prs` payload of two PRs on the SAME exercise
  (`{type:"e1rmPR", value:267, exerciseName:"Barbell Bench Press - Medium Grip"}`
  and `{type:"repsAtWeightPR", weight:160, reps:20, exerciseName:"Barbell Bench Press - Medium Grip"}`),
  the rendered output contains the exercise name exactly ONCE. Show the
  rendered text in the delivery report.
- Given a `prs` payload of 5 PRs, exactly 3 are shown plus a "+2 more"
  affordance.
- Given `prs: []`, no PR rows and no "PR" chip render, and the rest of the
  digest is unchanged.
- Given all four digest inputs null, the entire `weekly-report__digest`
  block is absent from the DOM (unchanged from today).
- The `e1rmPR` row's text does not contain a `x <reps>` pairing after the
  estimate. Quote the string.
- Screenshot or describe the rendered band in at least 2 palettes x both
  modes confirming no hardcoded-color regressions.

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
