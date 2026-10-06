# TASK bkr5: Home - logging first, the running block as a bold card under it, one Resume

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2: Seth - "if you have a block it shouldn't fully cover the
home screen and hide the logging function under 'Other workout'. The log
should be foremost with the block under it". Since bksf2c, `StartWorkoutHero`
switches to "block-day mode" when a run is active (title = next day, primary
= Start that day, logging demoted to "Other workout"). Seth picked option A
from the mock (https://claude.ai/artifact/E87H65uivuhARz7A94pphN, artboards
"A · picked - block card + full This week", "A · picked - no block running",
"Live workout"), keeping the block card with its exercise list and the full
This week card under it. Also folds in two deferred Home items: the
duplicate Resume (in-progress hero AND bottom "In progress" bar, Seth's
Sept 30 screenshot) and the This week card popping in late and pushing
Recent workouts down (critic R3 P2-4). Judgment-heavy visual unit: the
design below IS the spec.

FILES TO TOUCH:
- client/src/pages/DashboardPage.jsx
- client/src/components/workout/StartWorkoutHero.jsx
- client/src/components/blocks/run/UpNextCard.jsx
- client/src/components/workout/ActiveWorkoutHero.jsx
- client/src/components/workout/PersistentWorkoutBar.jsx (hide on Home only)
- client/src/components/analytics/WeeklyReport.jsx  (loading placeholder only)
- client/src/styles/blocks/bk-run.css and client/src/index.css (styles for the
  above; tokens only)
Do NOT modify anything outside these files.

CHANGE (the design - fully specified):
1. **Hero is always "log a workout"** when nothing is live, block or not:
   the notched hero card, eyebrow "LOG A WORKOUT", title "Start a workout",
   lead "Last one: <title>, <relative day>." (today's `lastSessionLabel`),
   primary full-width "Start empty workout" (barbell icon, today's primary
   button style) which starts an empty workout directly, and a ghost "Browse
   templates" under it which opens the existing `StartWorkoutPicker` on its
   templates list. Remove block-day mode from `StartWorkoutHero` (the
   `nextDayLabel` / `onStartNextDay` / `blockName` props) - the block lives in
   the card below now.
2. **"Next in your block" card** (UpNextCard, non-muted mode) directly under
   the hero when a run is active and no workout is live. NOT `card--live`
   (that class means a live workout only). Surface card, 16px radius, 16px
   padding, 12px gaps:
   - row: eyebrow "NEXT IN YOUR BLOCK" in `var(--color-interactive)` (11px,
     700, letter-spaced) and a right-aligned muted "View block ›" link to
     `/blocks/current`;
   - the day label "W4 · Upper A" in the block display font, 32px, uppercase;
   - muted line "<block name> · Week n of N";
   - a week progress strip: N equal segments, 6px tall, 6px gaps; finished
     weeks filled `var(--color-interactive)`, the current week an outlined
     segment (1.5px inset ring in the same token), future weeks
     `var(--color-surface-3)`;
   - the day's exercises on one line: the first 4 names (short names as the
     run page shows them), then muted "+N · M sets" (M = planned sets);
   - a 46px full-width tinted button "Start W4 · Upper A": background
     `color-mix(in srgb, var(--color-interactive) 18%, var(--color-surface-1))`,
     1px border `color-mix(in srgb, var(--color-interactive) 55%, transparent)`,
     text `var(--color-text)`; it starts that day straight into the logger
     (today's `onUpNextStart`). Busy text "Starting...".
   - A finished run (`isRunFinished`) shows no card.
3. **Live workout = ONE Resume.** `ActiveWorkoutHero` keeps its card and
   Resume button; under its title add, when the session is a block day, the
   block day label as the title and a "<logged> of <planned> sets logged" line
   with a 6px progress bar (`var(--color-interactive)` fill on
   `var(--color-surface-3)`) - only when planned sets are known; otherwise
   unchanged. The bottom `PersistentWorkoutBar` is HIDDEN on Home (`/`)
   because the hero already offers Resume; it stays on every other route.
   The muted "Up next after this: ..." line stays as it is today.
4. **No block running:** hero, then This week, then Recent workouts (today's
   order) - no empty block card, no placeholder.
5. **This week never pops in.** While `WeeklyReport` loads, render a
   skeleton block of roughly its usual height (reuse the existing skeleton
   classes from `LoadingState.jsx` / `skeleton-shimmer`), so Recent workouts
   does not jump down. When it resolves to "no data", the skeleton
   disappears (that is the only allowed shift).
6. Tokens only; every palette x light/dark must read correctly; no motion
   beyond what exists.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Grep: `StartWorkoutHero` no longer accepts `onStartNextDay` /
  `nextDayLabel`; `DashboardPage` renders `UpNextCard` (non-muted) when an
  active, unfinished run exists and nothing is live.
- Grep: `PersistentWorkoutBar` returns null when the route is `/`.
- Grep: `WeeklyReport` no longer returns `null` while `loading`.
- Every new `var(--...)` resolves in `client/src/index.css` (list them).
- Playwright at 390x844 if a browser is available (else say so): Home with
  a running block shows hero "Start a workout" first and the block card
  second; Home with a live workout shows exactly one Resume control.
  Screenshots in DELIVERY.md.
- LANDING NOTE (reviewer): the separate-agent critic loop runs on this unit.

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
