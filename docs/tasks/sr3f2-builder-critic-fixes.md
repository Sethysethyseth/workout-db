# TASK sr3f2: Builder - state you can see (Per side ON, the lift), day names that renumber, free-text stays "Not in library"

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the sr3 feel critic, round 1 (`docs/tasks/sr3-critic-round-1-FINDINGS.md`,
6/10 FAIL): its P2-1, P2-2, P2-3, P2-6 and the small P3-3, P3-4, P3-6, P3-7 - all
in the block builder. Read each finding there for the measured evidence. Seth's
ruling (Oct 7) on P2-2: renumber DEFAULT day names; names a lifter typed never
change. Runs in parallel with sr3f1 (Library files only); sr3f3 (the
add-to-library sheet) lands AFTER this unit because both touch BlockBuilder.jsx.

FILES TO TOUCH:
- client/src/components/blocks/builder/blockBuilderState.js
- client/src/components/blocks/builder/BlockBuilder.jsx
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/builder/BlockSettingsSheet.jsx
- client/src/components/blocks/ui/Segmented.jsx   (only an OPT-IN prop, if you need one)
- client/src/components/blocks/ui/DayPicker.jsx   (only if needed for item 7)
- client/src/styles/blocks/bk-builder.css
- client/src/styles/blocks/bk-ui.css
Do NOT modify anything outside these files. `Segmented`, `DayPicker` and
`WeekStrip` are shared with Library, import and the run page / Home - their
behaviour and look there must not change.

CHANGE:

1. **Default day names renumber (P2-2).** New days are stored with the literal
   name "Day n" (`addDay` in `blockBuilderState.js`), so after a Move or a
   hold-to-reorder a pill reads "DAY 3 / Day 1". After every op that changes a
   week's day ORDER or COUNT (`moveDay`, `reorderDay`, `duplicateDay`,
   `deleteDay`, `addDay`, and any other day-list op you find), each day whose
   name is exactly `/^Day \d+$/` is renamed `Day <its 1-based position>`; any
   other name is untouched. Unchanged rules: equal / out-of-range reorder still
   returns the SAME state object; no renaming on hydrate or on save.
2. **Free-text exercises stay "Not in library" after save (P2-3).**
   `hydrateExercise` (~line 178) sets `notInLibrary: false` for every loaded
   exercise, so a saved free-text exercise loses its "Not in library" chip and
   its card's "Add to library" action on reopen. On load, an exercise is
   `notInLibrary` when it has neither a catalog link nor a user-exercise link
   (check the field names the GET block-template tree actually returns - e.g.
   `exerciseId` / `userExerciseId`). Check `BlockBuilder.jsx`'s own
   `notInLibrary: false` rows (~lines 428/434) and apply the same rule there if
   they come from server data.
3. **Per side ON looks ON (P2-1).** In the expanded `ExerciseCard`, a pressed
   toggle chip (`aria-pressed="true"`, e.g. "Per side") gets an accent
   treatment derived from `--color-interactive` via `color-mix` (the pattern
   nav-active and the rings use - see AGENTS.md "UI architecture") plus a
   check glyph; unpressed toggles look like today's plain chips. Put the Per
   side chip BEFORE the effort-cap chip ("RPE target" / "RIR target") so it is
   not clipped at 390 when effort is on.
4. **Effort sheets fill their width and explain themselves (P2-6).** In the
   "Effort scale" sheet (opened from the chip under the block name) and in
   Block settings (`BlockSettingsSheet.jsx`), the RPE / RIR / Off segmented
   control spans the sheet's content width with the options sharing it evenly
   (opt-in - other `Segmented` uses unchanged). Under it, one muted line that
   explains the CURRENT choice: RPE "How hard each set felt, 1-10."; RIR "How
   many more reps you had left."; Off "No RPE or RIR targets in this block."
5. **The lift is visible (P3-3).** A lifted pill (`.bk-pill--lifting`, from
   sr3-6) keeps the selected ring when it is the selected pill AND shows the
   lift shadow (today the ring's box-shadow replaces it); the lift shadow adds
   an accent glow derived from `--color-interactive` so it reads on dark navy.
   CSS only; reduced-motion rules from sr3-6 stay.
6. **First tap after a week switch only selects (P3-6).** Today switching weeks
   auto-selects Day 1, so the first tap on Day 1 counts as a re-tap and opens
   the day actions sheet. The day actions sheet opens on a tap ONLY when that
   day was already selected by the user's previous tap in this week; a
   selection made by the app (load, week switch, add, delete, duplicate,
   reorder) makes the next tap a plain select. Same rule for week pills.
7. **The 7-day cap is visible (P3-4).** After "+ Day" adds a day, the day strip
   scrolls so the new day AND the trailing "+ Day" / "7 days max" pill are fully
   in view at 390. In the day "..." sheet, the disabled Duplicate row reads
   "Duplicate - 7 days max" (today it loses the verb).
8. **Public message no longer covers the checkbox (P3-7).** In Block settings,
   ticking Public shows Seth's line ("this hasnt been implemented yet bro stop
   prying", verbatim, keep it) INLINE under the Public checkbox instead of as a
   toast over it; the box still stays unticked. While Public is blocked, drop
   the helper text that promises "Visible to others for clone". (Library's "Make
   public" keeps its toast - not this unit.)

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run test:unit`
  from `server/` still green; `node scripts/check-hex.mjs` clean and every new
  `var(--...)` resolves.
- `git diff --stat` lists only files in FILES TO TOUCH; `MyTemplatesPage.jsx`,
  `ImportSourceStep.jsx`, `BlockRunPage.jsx`, `DashboardPage.jsx`,
  `WeekStrip.jsx` and `AddExerciseToLibrarySheet.jsx` are unchanged.
- A node one-liner (or a short script under the scratch area, not committed)
  importing `blockBuilderState.js`, pasted in DELIVERY.md:
  - week with day names [Day 1, Day 2, Upper A, Day 4]: `reorderDay` 0 -> 2
    gives names [Day 1, Upper A, Day 3, Day 4] where the new "Day 1" is the old
    Day 2's day (same `id`) and "Day 3" is the old Day 1's day;
  - the same week: `deleteDay` index 1 gives [Day 1, Upper A, Day 3];
  - `reorderDay` 1 -> 1 returns the same state object;
  - hydrating a template tree with one exercise linked to the catalog, one
    linked to a user exercise and one with neither gives `notInLibrary`
    false / false / true.
- Evidence from a local run at 390x844 (stub or non-prod API - `client/.env` is
  PRODUCTION, never use it), screenshots under `.playwright-mcp/sr3f2/`, dark
  mode: (a) an expanded card with Per side ON next to one with it OFF, effort on
  (Per side fully visible); paste both chips' computed `background-color`;
  (b) the Effort scale sheet; (c) a selected day pill mid-lift - paste its
  computed `box-shadow` showing ring AND shadow; (d) after adding the 7th day,
  the "7 days max" pill fully in view (paste its rect right edge vs 390);
  (e) Block settings after ticking Public, the line under the box; (f) after a
  week switch, one tap on Day 1 - no actions sheet.

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
