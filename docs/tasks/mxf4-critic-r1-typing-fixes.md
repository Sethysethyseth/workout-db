# TASK MXF4: critic round 1 fixes (typing surfaces: quick-logger search, set field remount, resume lists, builder picker, coach chip, note focus)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
After MXF3, Seth asked for three critic rounds split by failure type, so that
defects like the ones he found on his phone get caught before he sees them.
Round 1 tested every place you type with a test keyboard
(`scripts/virtual-keyboard-shim.js`, read its header) and scored 3/10. The
coach page passed in every model. The quick workout logger failed three
ways. Full report: `docs/tasks/mxf3-critic-round-1-FINDINGS.md`. It has exact
repros and rects. Its screenshot names refer to the critic's gitignored
folder, which you do not need. The Opus seat verified
the root-cause guesses for items 1 and 2 against the code. Design of record
stays `docs/design/mocks/motion/MOTION-DIRECTION.md` and `ROADMAP.md`.
Keep ROADMAP.md current: the "MXF4" entry already exists, so update its
status and the "Last checkpoint" line.

Items 1-3 are BUGS. In DELIVERY.md, give each one a short root-cause section
(file:line, mechanism, why it explains exactly what the critic measured)
BEFORE its fix.

CHANGES:
1. BUG (R1-3, P1): resuming a quick workout opens every exercise's
   suggestion list over the set fields, and a tap on a set's Weight hits a
   suggestion and RENAMES the exercise. Cause: the name-search effect in
   `SessionDetailPage.jsx` (the `useEffect` on `[disabled, name]` that calls
   `exerciseApi.searchExercises` and `setSuggestionsOpen(results.length > 0)`)
   runs on mount with the saved exercise name, with no focus and no user
   edit. Rule: the list opens only while that name field has focus AND the
   user has edited it since it gained focus (or it was just added empty and
   is being typed into). Mounting, resuming, reloading, or a name set by
   picking a suggestion never opens it. Blurring the field closes it, but a
   tap ON a suggestion must still pick it (keep whatever pointerdown/blur
   ordering the picker relies on today).
2. BUG (R1-2, P1, data loss): the set field you are typing in unmounts
   about 1.2 s after the first keystroke on an un-logged row. The keyboard
   drops, and digits typed next are lost (a lifter typing weight, then reps
   at normal speed loses the reps). Cause: draft and "last time" ghost rows
   render in a different branch and under different keys from saved sets
   (`session-set-slot-<id>-ghost-<i>` and the no-sets draft slot vs the
   `sortedSets` map, around the `onPromoteDraftSet` call sites). When the
   autosave promotes the draft, React mounts a new row. A ghost row logged
   out of order also jumps to Set 1. ROADMAP had this as MX7's "first-set
   focus drop". It moves HERE, so mark it handled in MX7's entry. Rule: the
   input the lifter is typing in is the SAME DOM node before and after the
   promotion (`document.activeElement` unchanged, `isConnected` true, caret
   unchanged, keyboard stays up). Every digit typed into any field of that
   row, or the next row, during and after the save lands in the right field
   and is saved. A row never moves on screen while any field in it has
   focus. If saved order would put it elsewhere, the move waits until focus
   leaves that exercise, or the save keeps its slot (your call; say which).
   Per-side (L/R) rows follow the same rule. The block-day logger already
   behaves (it kept focus 2.5 s in round 1). Do not touch it, but you may
   copy its pattern.
3. BUG (R1-1, P1): quick-logger exercise search opens UNDER the keyboard.
   Round 1 numbers at 412x800: the browser scrolls the focused name field
   to just above the keyboard (field 452-496, keyboard top 500), and the
   list opens downward with an inline `max-height: 0px` while 10 matches
   exist. Same at 390x844. The clamp in the `useLayoutEffect` that sets
   `.exercise-picker-suggestions` `maxHeight` is correct; nothing makes
   room. Rule: when the list opens with the keyboard up, the lifter sees at
   least 3 results (or all of them, if fewer) fully inside the visible band
   (below the sticky exercise heading, above the keyboard), each tappable.
   The name field stays visible too. Pick the mechanism: scroll the field
   up toward the top of the visible band, or flip the list above the field
   when there is more room there. It must hold in a pan (use client
   coordinates: the visible band is `vv.offsetTop` .. `vv.offsetTop +
   vv.height`). Typing must not lose focus or jump the caret.
4. R1-4 (P2): block builder exercise picker
   (`components/blocks/builder/ExercisePicker.jsx`, `bk-builder.css`
   `.bk-picker__list` / `.bk-sheet--picker`). With the keyboard up, the list
   still runs to the bottom of the screen. Its last 280 px are behind the
   keyboard, so "Use 'x'" and "Add 'x' to your library" can't be reached
   while typing. Rule: while the keyboard is up, the list ends at or above
   the keyboard top, and scrolled to the end, its last row is fully visible
   and tappable. With no keyboard, the sheet looks exactly as it does today.
   Use the same pan-aware visible-band reading as item 3 (a small shared
   helper under `client/src/lib/` is welcome; `coachKeyboardFit.js` shows
   the coordinate rule).
5. R1-5 (P3): on a live workout, the coach "working / answered" top chip
   (`CoachWorkingBar.jsx`, `.coach-working-bar-wrap[data-place="top"]`)
   covers the logger's sticky exercise heading
   (`.session-exercise-heading-sticky`), hiding the exercise name and its
   menu. Rule: while the top chip shows, sticky exercise headings stick
   below it (heading top >= chip bottom). When it goes, they return to the
   top. The chip still never covers the focused field, Finish, or the nav
   (MXC1). Expose the chip's height as a CSS custom property on a shared
   ancestor rather than measuring it in the logger.
6. R1-7 (P3): one tap on "Add a workout note" opens the note AND focuses
   its textarea, so the keyboard comes up in that same tap (focus has to
   happen inside the tap's gesture or iOS will not raise the keyboard).
7. R1-6 + the coach page edge (P3):
   (a) The `/coach?kbdebug=1` readout must not sit on the page title or
       the composer, and must follow the visual viewport so it stays on
       screen in a pan. It is debug only and stays off without the param.
   (b) On `/coach`, the scroller's overlay scrollbar paints over the
       suggestion cards' right border. Seth's own screenshot shows it, and
       round 1 measured the clip at about x 375 on a 390 screen. Rule: no
       card border sits under the scrollbar. Card right edges stay within
       8 px of the composer input's right edge. Pick the mechanism.

GUARDRAILS:
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only. Tokens only (check-hex clean). All 5 palettes x light/dark.
- THE LOGGER IS THE FLOOR: logging a set stays instant; no new delay,
  transition or animation on any input; an input never moves while focused
  (item 3's scroll happens when the LIST opens, not on every keystroke, and
  must not move the field out from under the caret).
- Do not touch the block-day logger (`components/blocks/log/`), the
  rest-timer logic (MXF2's `restLeave.js` rule stands), the route
  transition, or `index.html`'s viewport meta.
- Nothing a page does today goes missing.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (the MXF4 entry, MX7's entry note
  for the moved focus drop, and the Last checkpoint only)
- `client/src/pages/SessionDetailPage.jsx`
- `client/src/components/workout/` (only if the set-row identity fix needs
  the row shell)
- `client/src/index.css` (only the exercise-picker suggestion and sticky
  exercise heading rules)
- `client/src/styles/logger.css`
- `client/src/components/blocks/builder/ExercisePicker.jsx`,
  `client/src/styles/blocks/bk-builder.css`
- `client/src/components/coach/CoachWorkingBar.jsx`,
  `client/src/styles/coach-working-bar.css`
- `client/src/pages/CoachPage.jsx`, `client/src/styles/coach-page.css`
- new module(s) under `client/src/lib/`
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable; the Opus seat re-runs round 1's
repros on the real app with the shim at landing, so the numbers below are
what it will measure):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `npm run test:unit` from `server/` stays green (verbatim count).
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH; no package changes; `git diff --stat` shows nothing under
  `client/src/components/blocks/log/`.
- Item 1: after a reload of a live quick workout with 5 named exercises, no
  `.exercise-picker-suggestions` is open (0 visible) for 3 s with nothing
  focused. Focusing a name field without typing opens nothing. Typing 2+
  new characters opens it.
- Item 2: DELIVERY.md shows the identity mechanism and a trace for (a) a
  no-history exercise's first set, (b) the LAST ghost row of an exercise
  with "last time" rows, and (c) a per-side row. Each trace logs
  `activeElement` identity + `isConnected` at +0 / +1500 / +3000 ms after
  typing the weight, and shows the row's top before vs after (unchanged
  while focused). Plus: weight "135", then reps "5" typed 300 ms later, and
  both values saved. If the lane cannot drive the logger in a browser (no
  `server/.env`; stub what you can), say so, and give the code-path
  argument instead. The seat runs the browser check.
- Item 3: with the shim (`chrome`, `ios`, `edge`) at 412x800 and 390x844:
  focus the first exercise's name on a fresh quick workout, type "bench",
  and at least 3 suggestion rows have their rect inside [sticky heading
  bottom, keyboardTop], with `elementFromPoint` at each row's centre
  returning that row.
- Item 4: with the shim at 390x844 and the picker open with "squat" typed,
  `.bk-picker__list` bottom <= keyboardTop. Scrolled to the end, the "Add
  'squat' to your library" row's bottom <= keyboardTop.
- Item 5: with the chip showing on a live workout, every visible sticky
  exercise heading's top >= the chip's bottom.
- Item 6: one click on "Add a workout note" leaves `document.activeElement`
  = the note textarea.
- Item 7: kbdebug readout rect does not intersect `.coach-page__title` or
  `.coach-page__composer`; in the shim's `chrome` pan its top >= visibleTop.
  The suggestion cards' right edge <= the scroller's right edge minus the
  scrollbar width, in a mobile context (overlay scrollbars).
- DELIVERY.md: one section per CHANGE item with what changed, file and
  lines, how it was verified; the logger hunks with why none of them adds a
  delay or moves a focused input; ROADMAP MXF4 status; anything not done
  marked PARTIAL with a "pick up here" note.

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
