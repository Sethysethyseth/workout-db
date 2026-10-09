# TASK qolf7: Round-2 fixes outside the logger - the bar never covers the coach composer, Logging setup breathes, coach cold-load lands at the end, AI access switch and copy, run-page selection, Last 7 days counts only finished work

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 2 (wave 6/10). Read
`docs/tasks/qol-critic-round-2-FINDINGS.md` Part A items #1, #3, #6, #7, #8,
#9 and #12 for the measured evidence. Design rules:
`docs/specs/quality-of-life-wave.md` section 2. Do NOT edit
`client/src/index.css`; override from the stylesheets named below. Runs in
parallel with qolf6 (logger files only); neither touches the other's files.

FILES TO TOUCH:
- client/src/components/workout/PersistentWorkoutBar.jsx   (item 1)
- client/src/styles/training-prefs.css   (item 2)
- client/src/components/prefs/TrainingPrefsSheet.jsx   (item 2, only if the height cap lives there)
- client/src/components/coach/CoachPanel.jsx   (item 3)
- client/src/styles/coach-page.css   (item 4)
- client/src/pages/profile/AiConnectorPage.jsx   (item 5)
- client/src/styles/ai-access.css   (item 5)
- client/src/styles/blocks/bk-run.css   (item 6)
- client/src/components/analytics/WeeklyReport.jsx   (item 7)
Do NOT modify anything outside these files.

CHANGE:

1. **The In progress bar never covers the coach composer (#1, P1).** During
   a live workout on /coach, the bar (z-index 5) sits right on the composer:
   bar y 718-788, textarea y 726-770. The only reachable control is the
   bar's x, which DISCARDS the workout.
   - Hide the bar on `/coach` (with any query string), the same way
     `PersistentWorkoutBar.jsx` already hides it on `/` and `/blocks/import`.
   - The coach page needs no bar: Home's live card is one tap away.
2. **Logging setup breathes (#3, P2).** qolf4 made the sheet fit at about
   86% by cutting gaps to 4-9px, and the groups run together.
   - Restore about 16px between groups, and 8px between a helper line and
     the next label.
   - Get the height back from the segmented controls' vertical padding or
     the lead line, or let the sheet reach up to 90% of the visual viewport.
   - At 390x844 with the rest timer on it should still fit without an inner
     scroll if it can. If it can't, it scrolls with qolf4's 12px gutter
     padding. Say which in DELIVERY.md.
3. **A cold load of /coach?c=id lands at the newest answer (#6, P3).** It
   lands at scrollTop 818 of 875, so the last paragraph is below the fold
   (after a send it is right).
   - On the first paint of a loaded conversation, scroll to the end after
     layout settles (next animation frame, and again after
     `document.fonts.ready`).
   - Only on that first load: qolf2's follow and don't-yank rules stay as
     they are.
4. **No scene seam under the composer (#7, P3).** An 18px strip of scene
   shows between the composer backing's bottom (772) and the nav's top
   (790). Extend the full-bleed backing down to the nav.
5. **AI access: the off switch and duplicate copy (#8, P3).**
   - The "Let assistants draft blocks" off switch is still a dark knob on a
     dark track. Give it the same off-state knob/track pair qolf4 gave the
     Training switches (copy the token mix from `training-prefs.css`, scoped
     in `ai-access.css`), with at least 3:1 knob vs track in champ dark and
     crimson light.
   - Drop the footer line "Open the coach from the chat bubble at the top
     of Home." It repeats the card's first paragraph. Keep a link to /coach
     in that first paragraph if one is missing.
6. **The run page uses the builder's selection look (#9, P3).** The block
   run page still marks the selected day with a white outline, and the NEXT
   badge overlaps the pill border.
   - Scoped in `bk-run.css`, give the selected day pill the same `color-mix`
     accent tint qolf4 put on the builder's day pill.
   - Keep the NEXT badge inside the pill's border box.
7. **Last 7 days counts only finished workouts (#12, P3).** With a live
   workout, Home's Last 7 days card says Workouts 1, Sets 2, Top set
   130 x 5, while its day strip reads "0 of 7 days trained".
   - `WeeklyReport` leaves sessions without `completedAt` out of every
     count and stat, so the card agrees with the strip.
   - Discarding or finishing a workout still refreshes it (qol4's keyed
     remount).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- `npm run build` from `client/` compiles clean; `node scripts/check-hex.mjs`
  clean; every new `var(--...)` resolves in `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -rn "Open the coach from the chat bubble at the top of Home" client/src`
  returns nothing.
- DELIVERY.md says, per item 1-7, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer (390x844 unless noted):
  - With a live workout, on /coach: no `.persistent-workout-bar` renders,
    and `elementFromPoint` at the textarea's centre is the textarea. On
    /analytics the bar still shows.
  - Logging setup sheet:
    - every gap between groups is >= 14px
    - helper to next label is >= 8px
    - the height is <= 90% of the viewport
  - A cold load of /coach?c=<id> with a long thread:
    `scrollHeight - scrollTop - clientHeight <= 2`.
  - On /coach, the composer backing's bottom equals the nav's top (within
    1px).
  - On AI access, the off "Let assistants draft blocks" switch has knob vs
    track contrast >= 3:1 (champ dark).
  - The run page's selected day pill is accent-tinted, and the NEXT badge
    sits inside the pill.
  - Home with a live workout that has 2 logged sets: Last 7 days shows the
    same counts as with no live workout.

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
