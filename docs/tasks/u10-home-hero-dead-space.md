# TASK U10: home layout - kill the hero dead space

STATUS: QUEUED
MODEL: auto/cheap
MODE: 1-relay (index.css overlap with U8/U9 - never parallel)

CONTEXT:
Seth's July 3 staging smoke of U7: the Start Workout hero card renders with
a huge block of empty space inside its border below the CTA button. ROOT
CAUSE (already diagnosed - do not go hunting): `.workout-tab.stack` is a
CSS grid (`.stack { display: grid }`) with
`min-height: calc(100dvh - 7.5rem)`. Grid's default
`align-content: stretch` distributes the leftover viewport height across
the auto rows, and each card fills its stretched row - so the hero, having
the least content, shows the most interior dead space. The fix is to stop
stretching rows and let the spare space collect at the BOTTOM of the tab,
where the fixed scene band paints and where the dark space belongs.

Second item from the same smoke: the weekly report band prints set counts
with a needless trailing decimal ("29.0" sets, "-3.0 vs last week"), and
the known U7 nit that a tiny positive delta can render "+0.0".

FILES TO TOUCH:
- client/src/index.css                                (the one-rule layout fix)
- client/src/components/analytics/WeeklyReport.jsx    (set-count formatting only)
Do NOT modify anything outside these files.

CHANGE:

### 1. Layout fix (index.css)
Add `align-content: start;` to the existing `.workout-tab.stack` rule
(around line 3289). Keep `min-height` exactly as-is - it is what gives the
bottom scene band its breathing room; only the DISTRIBUTION of the spare
space changes. Add a one-line comment on the new declaration: cards hug
their content; leftover viewport height collects at the bottom under the
scene band instead of stretching into the card rows.

Do NOT touch the `.workout-tab::before` scene layer, the `::after`
star-glint layer, `.workout-hero` styles, or anything else in the file.

### 2. Set-count formatting (WeeklyReport.jsx)
Add a module-local helper `formatSetCount(n)`: round to 1 decimal, then
drop a trailing ".0" - `29` -> "29", `4.5` -> "4.5", `-3` -> "-3". Use it:
- for the Sets stat value (currently `currentSets.toFixed(1)`);
- inside `formatSetsDelta`, replacing `delta.toFixed(1)`, AND decide the
  sign branch on the ROUNDED value so a delta that rounds to 0 prints
  "same as last week" instead of "+0.0" (fixes the accepted U7 nit).

Weight formatting (`formatWeight`, "303.3 lbs") is deliberately untouched -
1 decimal on weights matches the analytics page. Workout counts are already
integers - leave `formatCountDelta` alone.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `.workout-tab.stack` rule contains `align-content: start` and its
  `min-height` is byte-identical to before.
- No other CSS rule added, removed, or changed.
- `formatSetCount(29) === "29"`, `formatSetCount(4.5) === "4.5"`,
  `formatSetCount(29.04) === "29"` (verify with a quick `node -e` eval or
  equivalent).
- `formatSetsDelta` with a delta of `0.04` (non-empty prior) returns
  "same as last week"; with `-3` returns "-3 vs last week"; with `+1.5`
  returns "+1.5 vs last week".
- No new dependencies; no hex colors; JSX structure of WeeklyReport
  unchanged (formatting call sites only).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
