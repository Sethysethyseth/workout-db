# TASK MXF5: critic round 2 fixes (contrast on the accent, chart card padding, text-glyph icons, Stop button, iron light, one coach mark, small alignment)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Critic round 2 of 3 after MXF3 measured icons, glyphs, alignment and contrast
across all 10 palette x mode combos and scored 5/10: 0 P1, 5 P2, 11 P3. The
new coach icon passed. Full report with measurements, file:line guesses and
repros: `docs/tasks/mxf3-critic-round-2-FINDINGS.md` (screenshot names refer
to the critic's gitignored folder; you do not need them). This block fixes
every P2 and the P3s listed below. Round 1's fixes (MXF4) just landed; do
not undo them. Design of record stays
`docs/design/mocks/motion/MOTION-DIRECTION.md`. Keep ROADMAP.md current: the
"MXF5" entry already exists - update its status and the "Last checkpoint"
line. Tokens-only (AGENTS.md "UI architecture"): new colours go through the
custom properties in `client/src/index.css`, per palette x mode.

CHANGES (IDs match the findings doc):
1. R2-1 (P2) White glyph on `--color-interactive`. In dark mode,
   `--color-interactive` is each palette's LIGHT accent, but these surfaces
   put `--color-btn-primary-fg` (white) on it: the /coach send arrow, the
   Library running strip "GO", the block day "NEXT" tag, and the login
   button (`.auth-form .btn` hardcodes white). Forest dark measures 1.74:1,
   crimson dark (Seth's) 2.77:1. Fix it with a token, never per-surface
   hexes. Either add an on-accent foreground token defined for every
   palette x mode, or move those surfaces to the primary-button pair. Then
   grep for every other `color-btn-primary-fg` / `--bk-on-accent` / white
   foreground that sits on `--color-interactive` and fix those too.
   Target: >= 4.5:1 for text, >= 3:1 for icon-only glyphs, in all 10
   combos.
2. R2-2 (P2) Analytics chart cards lost their side padding.
   `styles/analytics-motion.css` (~line 12)
   `.analytics-page section.card > .analytics-card-head { padding-left: 0;
   padding-right: 0 }` was meant for the padded Balance card. It also hits
   the zero-padding `.analytics-table-card` sections (Muscles, Strength,
   Execution), so their title, toggle pills and caption sit 0.8 px from the
   card edge. Scope the rule to the card it was written for. The head insets
   must match the rows below them on every Analytics card.
3. R2-3 (P2) Text-glyph icons sit 2.3-3.3 px low. Replace these font
   characters with inline SVG icons in the BottomNav pattern (24 box,
   `stroke="currentColor"`, round caps/joins, stroke sized so it RENDERS
   about 1.8 px at its display size):
   - the live logger "Discard workout" x (`.session-discard-x`)
   - the Home "Workout discarded" toast dismiss x
   - the rest-timer stepper "-" and "+" (Profile > Training; the "-" is a
     hyphen today, narrower than the "+")
   - the Profile settings-row chevrons
   - the set-remove x (borderline at +1.14 px)
   Each must be centred in its hit box within 1 px. Match the visual weight
   of the bottom nav icons. One shared small icon module under
   `client/src/components/` is welcome.
4. R2-4 (P2) /coach "Stop" button. `.coach-page__send { flex: 0 0 44px }`
   beats `.coach-page__send--stop { width: auto }`, so the "Stop" label
   sits 4.8 px right of centre. Fix it so the label is centred
   (|offset| <= 1 px), with a min width of 44 px and no layout jump in the
   composer between send and stop.
5. R2-5 (P2) Iron light: the amber `--color-interactive` (#f59e0b) used as
   TEXT or ICON on cream measures about 2:1. That covers the logger active
   pills, "Edit", "Add a workout note", the active nav tab, the masthead
   coach icon, the /coach intro mark and suggestion icons, and the "NEXT IN
   YOUR BLOCK" eyebrow. Every other palette's light mode uses a darker
   accent. Fix iron light only, by token, so that text/icon uses reach
   >= 4.5:1 (text) / >= 3:1 (icons). Amber FILLS (buttons, the hero) keep
   their look, and their foreground keeps passing. Derived states (rings,
   nav-active, pills built with `color-mix` from `--color-interactive`)
   must still read as iron.
6. R2-6 + R2-7 (P3) One coach mark, consistent weight.
   (a) The /coach suggestion rows use their own off-centre `SuggestMark`
       bubble (`CoachPanel.jsx`). Use `CoachMarkIcon` there.
   (b) `CoachMarkIcon` renders at 22 px, so its 1.8 stroke paints 1.65 px.
       Make it render at the nav's 1.8 px weight at every size it is used.
   (c) The /coach send arrow paints 11.9 x 10.4 inside a 44 px button and
       reads small. Size it to sit with the other composer icons.
   Leave the crown on coach ANSWERS and on the Analytics coach card. That
   is a question for Seth, not this block.
7. R2-8 (P3) The logger "L/R" toggle floats 10.4 px above the Sets select
   beside it. Align their centres within 1 px. Its hit box becomes >= 44 px
   tall (it is 41.7 x 28 today). Quick logger only: do not touch
   `components/blocks/log/`.
8. R2-9 (P3) Workout summary edges. Remove the 2 px
   `.session-summary-footnote` offset. Make the "01" / "02" exercise index
   tabular, so exercise titles line up.
9. R2-10 (P3) The Analytics muscle chart axis reads "0 0 0.1 0.1 0.1" on
   small ranges (`MuscleVolumeChart.jsx` tick formatter). No duplicate
   tick labels at any range. Pick the precision from the step, or dedupe.
10. R2-11 (P3) Block day card (`/blocks/current`). The "NEXT" tag overlaps
    a two-line day name by 1 px. Give it room. The empty progress ring on
    the SELECTED day measures 1.11:1 against the selected fill (invisible).
    Get it >= 3:1, by token.
11. R2-13 (P3) Native controls ignore the app theme (Profile > Appearance
    radios render as bright white discs in dark mode). Make `color-scheme`
    follow `data-theme` on `<html>`, so native radios, selects and
    scrollbars match. Check every page with a native control still reads in
    light and dark.
12. R2-15 (P3) Library "RUNNING" pill in champ light is 1.98:1. Get it to
    >= 4.5:1, by token, without changing the other palettes' pills.
13. R2-16 (P3) /coach leave-note "Got it" is aligned to nothing
    (`.coach-leave-note` uses `align-items: flex-start`). Centre the button
    on the note's text block, or on its first line. Pick one and say which.
14. Outside-focus bug: when the coach is rate-limited (429), /coach shows
    "Couldn't reach LogChamp. Check your connection" instead of the
    server's own message. In `client/src/api/coachApi.js`, a 429 from
    `/coach/status` or a chat call must show the server's message, or a
    calm "The coach is taking a breather - try again in a few minutes."
    when there is none. It must never be the connection error. Client only.
    Do NOT change the server's rate limiter.

GUARDRAILS:
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only. Tokens only: `node scripts/check-hex.mjs` clean, and hexes
  live only in `index.css` palette blocks.
- Every palette x mode must still read as itself. A token you change for
  one palette must not move another palette's look.
- Do not touch `components/blocks/log/`, the quick logger's set-row logic
  (MXF4's `quickSetSlots.js` slot identity), the keyboard fits
  (`CoachPage.jsx` fit, `visibleBand.js`), or the route transition.
- Nothing a page does today goes missing.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (the MXF5 entry + Last checkpoint only)
- `client/src/index.css`
- `client/src/styles/` (any file the items above name; `blocks/` included)
- `client/src/components/coach/CoachPanel.jsx`, `CoachMarkIcon.jsx`,
  `CoachLeaveNote.jsx`
- `client/src/api/coachApi.js` (item 14 only)
- `client/src/pages/SessionDetailPage.jsx` (items 3, 7, 8 only: markup for
  the discard x, set-remove x, L/R toggle, summary index)
- `client/src/pages/DashboardPage.jsx` (the toast x only)
- `client/src/pages/ProfilePage.jsx` (row chevrons only)
- `client/src/components/prefs/TrainingPrefsForm.jsx` (stepper glyphs only)
- `client/src/components/analytics/MuscleVolumeChart.jsx`
- `client/src/components/blocks/run/` (item 10 only)
- `client/src/components/layout/AuthLayout.jsx` or `client/src/pages/LoginPage.jsx`
  (item 1 login button only, if the fix needs markup)
- a new small icon module under `client/src/components/`
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable; the Opus seat re-measures round 2's
numbers on the real app at landing):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `npm run test:unit` from `server/` stays green (verbatim count).
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH; nothing under `client/src/components/blocks/log/` or
  `server/`.
- DELIVERY.md has a 10-row table (palette x mode) giving the contrast ratio
  for: the /coach send glyph on its button, "GO" on its pill, "NEXT" on its
  tag, the login button label, and (iron light row in particular) the
  interactive colour used as text on the page surface. Compute each from
  the resolved token values, and show the formula or helper you used.
  Every cell meets item 1 / item 5's target.
- Item 2: the computed `padding-left` of `.analytics-card-head` inside
  `.analytics-table-card` equals the inset of that card's first row (state
  both numbers).
- Item 3: `rg -n "[×✕›−]|>-<|>\\+<" ` over the touched JSX shows no
  remaining text-glyph icons for the listed controls (list any that remain,
  with why).
- Item 4: Stop label centre offset |x| <= 1 px (measured, or argued from
  the computed box if no browser).
- Item 9: the tick formatter run in node over ranges max 0.05, 0.3, 1, 7,
  42 prints no duplicate labels (show the output).
- Item 14: show the code path for a 429 with and without a server message,
  and the copy each produces.
- DELIVERY.md: one section per CHANGE item with what changed, file and
  lines, how it was verified. Anything not done is marked PARTIAL with a
  "pick up here" note. Say plainly which items were browser-verified (the
  lane has no `server/.env`; stub, or argue from code).

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
