# TASK qolf1: In-progress bar that fits a phone and lines up on desktop, a real "Workout discarded" notice, a quieter Home live card, visible confirm focus, no sideways scroll on Analytics Strength

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 1 (5/10). Read
`docs/tasks/qol-critic-round-1-FINDINGS.md` items #1, #6, #7, #8, #20, #21 for
the measured evidence. The surfaces came from qol4 (discard from Home and the
bar, `ConfirmPanel`) and qol13 (bar width at 1280). Design rules:
`docs/specs/quality-of-life-wave.md` section 2. Rule 2 governs CSS here: new
rules go in the NEW file named below, imported by the component that owns
them. Do NOT edit `client/src/index.css`; override from the new file instead.
Runs in parallel with qolf2 (coach), qolf3 (logger) and qolf4 (prefs and
builder). None of them touch these files.

FILES TO TOUCH:
- client/src/components/workout/PersistentWorkoutBar.jsx
- client/src/components/workout/ActiveWorkoutHero.jsx
- client/src/pages/DashboardPage.jsx   (only the "Workout discarded" notice)
- client/src/components/ConfirmPanel.jsx
- client/src/styles/confirm.css
- client/src/styles/workout-bar.css   (NEW - bar, Home live card and notice rules)
- client/src/components/analytics/StrengthTrendChart.jsx
- client/src/styles/analytics-strength.css   (NEW)
- client/src/pages/AnalyticsPage.jsx   (ONLY if the sideways scroll's cause is there; say so in DELIVERY.md)
Do NOT modify anything outside these files.

CHANGE:

1. **The In-progress bar at 390 (#1, P1).** Today the left text column gets
   squeezed. "In progress · 2m" wraps onto 3 lines, and the title truncates to
   "Work..." while "Resume workout" holds the middle.
   - The text column takes the free width and may shrink (min-width 0).
   - The eyebrow (status + elapsed) stays on ONE line, with no middle dot
     (rule 3). Show the elapsed time as its own muted span.
   - The title is ONE line with an ellipsis.
   - Below about 420px wide, the call to action reads "Resume" (the button's
     aria-label is unchanged). The text column wins the space, and the
     discard x stays a 44px target.
2. **The bar lines up with the page column at desktop widths (#6, P2).**
   qol13 fixed the bar at 720px, centred. At 1280 that leaves it inset about
   116px each side on Analytics, and about 23px WIDER than the cards on
   Training.
   - At 900px and wider, the bar's left and right edges match the content
     column of the page it floats over, within 8px.
   - Check Home, Analytics, History, Library and Profile > Training.
   - Find how `Layout` / each page sets its column width, and reuse that
     width (a shared CSS variable or the layout container) rather than a
     per-page magic number.
   - If one page's column is genuinely different, the bar follows that page.
     DELIVERY.md names where each page's column width comes from.
3. **"Workout discarded" looks like a notice (#8, P2).** Today it is a bordered
   muted box that reads like an empty text field.
   - Give it the same structure as the "Workout saved" notice just above it in
     `DashboardPage.jsx`: a bold "Workout discarded" line, plus one muted line,
     "Nothing was saved to your history."
   - Add a 44px dismiss x (aria-label "Dismiss").
   - Keep `role="status"`. No emoji.
4. **The Home live card stops repeating itself (#20, P3).** In
   `ActiveWorkoutHero.jsx`, the card heading is the workout's title (today it
   says "Resume workout", which duplicates the button). The Resume button
   spans the card's full content width, like the Start button on the idle
   hero. The discard x from qol4 stays in the top-right.
5. **Confirm focus is visible (#21, P3).** `ConfirmPanel` already moves focus
   to the safe action when it opens (`initial?.focus()`). Give its buttons a
   `:focus-visible` ring derived from `--color-interactive` via `color-mix`
   (the AGENTS.md ring pattern). Make sure the ring shows when the panel opens
   from a keyboard press, so focus can be seen landing on "Keep workout". No
   change to which button gets focus.
6. **No sideways scroll on Analytics > Strength at 390 (#7, P2).** The page
   scrolls horizontally, and the Chart/Table toggle, the Execution tab and the
   row meta ("top set +35 lbs · top set 220 × 10") are cut off at the right
   edge.
   - Find what forces the width. The suspect is the strength-row meta in
     `StrengthTrendChart.jsx` refusing to wrap.
   - Let it wrap or truncate inside its row so nothing pushes the page.
   - The tab strip may keep its own horizontal scroller if it has one, but
     the PAGE must not scroll sideways.
   - Fix it in the new `analytics-strength.css`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (no server change expected).
- `npm run build` from `client/` compiles clean, and `node scripts/check-hex.mjs`
  reports no new raw colours. Every new `var(--...)` resolves in
  `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- DELIVERY.md says, per item 1-6, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer:
- At 390x844 with a live workout, on /analytics:
  - the bar's eyebrow text node is one line tall
  - the title shows the workout name on one line (an ellipsis is OK only past
    about 24 characters)
  - the call to action reads "Resume"
  - the bar's main button and the x do not overlap
- At 1280x900, on Home, Analytics, History, Library and Profile > Training:
  `|bar.left - column.left| <= 8` and `|bar.right - column.right| <= 8`.
- After discarding a workout from Home, the notice shows "Workout discarded"
  plus "Nothing was saved to your history.", and the x removes it.
- Home with a live workout: the live card's heading is the workout title, and
  the Resume button's width is within 4px of the card's content width.
- Opening a discard confirm with the keyboard (Tab to the x, then Enter):
  `document.activeElement` is "Keep workout", and its computed `outline` or
  `box-shadow` is not none.
- /analytics?view=strength at 390x844, in champ dark AND crimson light:
  `document.documentElement.scrollWidth <= 390`.
- Reduced motion: no new animation, or one with a `prefers-reduced-motion`
  fallback.

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
