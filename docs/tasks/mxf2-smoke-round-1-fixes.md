# TASK MXF2: Seth's smoke round 1 fixes (Finish dock, rest timer, crimson chart colour, Strength draw)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Seth smoked `motion-wave` (MX1-6 + MXF1) on his phone, Oct 10. Everything
he did not name passed, and the 420ms tab slide stays. This block fixes the
four defects below that are logger, chart and motion work. The coach findings
are a separate block (MXC1) that may run at the same time in another lane -
do not touch any coach file. Design of record stays
`docs/design/mocks/motion/MOTION-DIRECTION.md` (Seth's rulings at the top win)
and `ROADMAP.md`. Keep ROADMAP.md current: the "MXF2" entry already exists -
update its status and the "Last checkpoint" line like the MX units.

Two items are BUGS: each gets a short root-cause section in DELIVERY.md
BEFORE its fix (file:line, the mechanism, why it explains exactly what Seth
saw), then the smallest correct fix.

CHANGES:
1. BUG - Finish dock hidden under the bottom nav. Seth's screenshot (crimson
   dark, live quick workout opened from History, 1080x2424 phone): the
   Finish dock's top edge peeks out above the bottom nav; the Finish button
   itself sits underneath the nav and cannot be reached. Before MX5 the dock
   painted over the nav (the qol12 known issue). Leading hypothesis to
   confirm or kill: MX5's `.mx-route` wrapper carries
   `view-transition-name: mx-page` at all times (`shell-motion.css`), which
   makes it a stacking context, so the dock's `z-index` (`.session-finish-dock`,
   `index.css`) now only counts inside the page and the fixed bottom nav
   wins. Fix so that on a live workout - quick AND block logger - the Finish
   button is fully visible and tappable, nothing overlaps it, and the bottom
   nav is still reachable (Finish sitting directly above the nav is the
   expected shape; it also closes the qol12 known issue). Must hold during
   and after a route transition, with the keyboard open and closed, and
   must not break the masthead / bottom nav / workout bar view-transition
   groups MX5 set up. Check every other fixed or sticky element rendered
   inside the page (sheets, sticky exercise headers, the import page's
   sticky "Create block", toasts) for the same trap and list what you found.
2. Rest timer starts when you LEAVE the set (Seth's ruling, Oct 10). Today
   it starts the moment a set becomes core-logged, so typing a weight into a
   set whose reps are already filled starts rest and interrupts the move
   from weight to reps. New rule, both loggers (quick:
   `SessionDetailPage.jsx` effect around `quickLoggedRef` / `startRestRun`;
   block: `BlockExerciseCard.jsx` `onRestLoggedChange` + `BlockSetRow.jsx`):
   rest starts only once the set is core-logged AND focus has left that
   set's row (focus moves to another set or field outside the row, the
   keyboard closes, or the user taps away). Moving between weight, reps and
   the effort field inside the same set never starts it. Starting rest must
   not steal focus, close the keyboard, or move the input the user is in.
   A set that is re-edited after its rest already started does not start a
   second rest (keep the existing once-per-set arming). Keep the pure part
   (when does a set "leave") in a small exported function so it can be
   unit-tested the day a client runner exists (ROADMAP convention).
3. Crimson chart colour. Seth: "crimson shows green exercise bars". Cause
   (MXF1): crimson's `--chart-accent` is a mix of `--color-success-accent`
   (green) and text (`index.css`, the crimson chart override near the other
   `--chart-accent` rules). Every NON-directional mark (Muscles bars,
   heatmap ramp, meters, the Exercises roster, sparkline lines) must sit in
   the palette's own family: for crimson a non-alarm on-palette hue (a
   rose / blush / warm light tone - your call), never green or teal, and
   never the danger-red alarm read MXF1 removed. Then walk all 10 palette x
   mode combos for every chart mark and confirm the rule that already
   governs: directional "up" is one token for dot and text, readable as a
   gain, distinct from the accent and from "down" (forest by hue, not
   lightness). Tokens only.
4. BUG - Strength trends do not animate, and the colour reads off. Seth:
   "strength trends isn't an animation and the coloration seems to be off."
   MX3 says Strength sparklines wipe in, then the end dot pops, then the
   delta rises - on mount, on a view switch and on a range change. Find why
   that no longer plays on his phone (a likely suspect: MXF1's quiet-return
   path or session cache rendering the final state on a view switch, not
   only on a return to the page - confirm or kill). Fix so the Strength
   draw plays on the first Analytics view of a session, on every switch TO
   the Strength view, and on a range change; a quiet return to Analytics
   still fades (Seth's MXF1 ruling stands). Colour: the trend line uses the
   palette's chart hue from item 3 at a quieter weight (not grey that reads
   washed out), the end dot and delta carry the "up"/"down" token. Apply the
   same check to Muscles bars charging and Execution meters charging on a
   view switch, and fix them the same way if they are suppressed too.

GUARDRAILS (same as every MX unit):
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only. Tokens-only (check-hex clean); all 5 palettes x light/dark.
- THE LOGGER IS THE FLOOR: inside the loggers touch only the Finish dock
  (item 1) and the rest-start trigger (item 2). Logging a set stays
  instant; no new transition or delay on any input.
- Navigation never waits on an animation; a tap mid-transition wins.
- Do not change the 420ms route duration or the FLIP / surface durations.
- Nothing a page does today goes missing (content, warnings, buttons).
- `prefers-reduced-motion: reduce`: draws print at their final state.
- Phone first (390px), no horizontal scroll.
- Do NOT touch any coach file (`components/coach/`, `pages/CoachPage.jsx`,
  `components/library/`, `styles/coach-*.css`, `DashboardPage.jsx`,
  `SessionsPage.jsx`, `MyTemplatesPage.jsx`, `Layout.jsx`, `App.jsx`) - MXC1
  owns them and may be running in parallel.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (the MXF2 entry + Last checkpoint only)
- `client/src/pages/SessionDetailPage.jsx` (Finish dock + rest trigger only)
- `client/src/components/blocks/log/BlockExerciseCard.jsx`, `BlockSetRow.jsx`
  (rest trigger, and the block logger's finish dock if it lives there)
- `client/src/lib/restTimer.js` and new modules under `client/src/lib/`
- `client/src/styles/shell-motion.css`, `client/src/components/motion/RouteTransition.jsx`
- `client/src/styles/logger.css`, `client/src/styles/rest-timer.css`,
  `client/src/styles/blocks/bk-log.css`
- `client/src/pages/AnalyticsPage.jsx`, `client/src/components/analytics/`,
  `client/src/styles/analytics-motion.css`, `client/src/styles/analytics-strength.css`
- `client/src/index.css` (the Finish dock, bottom nav stacking and chart token
  rules only)
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable; the reviewer also checks each item
in a real browser at 390x844 on the staging DB):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `npm run test:unit` from `server/` stays green (verbatim count).
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (gitignored `.playwright-mcp/` aside); no package changes.
- No route/FLIP/surface duration changed: `git diff` shows no edit to the
  420ms route values or the FLIP / surface duration constants.
- Item 1: on a live workout at 390x844 the Finish button's bounding rect
  lies fully inside the viewport and above the bottom nav's top edge, and
  `document.elementFromPoint` at the button's centre returns the button (or
  its child) - DELIVERY.md shows the measured rects for the quick logger
  AND the block logger, before and after.
- Item 2: DELIVERY.md shows the exported "has the set been left" function,
  a table of at least these cases with the outcome - weight -> reps in the
  same set (no rest), reps -> effort in the same set (no rest), last field
  -> next set's weight (rest starts once), keyboard closed with the set
  filled (rest starts once), re-edit after rest (no second rest) - and the
  focused input's rect before and after rest starts (unchanged).
- Item 3: `rg -n "color-success" client/src/index.css` shows no crimson
  `--chart-accent` built from the success token; DELIVERY.md has a 10-row
  table (palette x mode) naming the token behind chart-accent, up and down,
  with the resolved colour for each.
- Item 4: DELIVERY.md names the root cause (file:line) and shows, for
  first view / switch to Strength / range change / quiet return, whether
  the wipe + dot pop ran (class or animation evidence), after the fix.
- DELIVERY.md: one section per CHANGE item 1-4 with what changed, the file
  and lines, how it was verified; the logger hunks with why none of them
  delays or moves an input; ROADMAP MXF2 status; anything not done marked
  PARTIAL with a "pick up here" note.

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
