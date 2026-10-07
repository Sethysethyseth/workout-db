# TASK sr3-3: Builder header - visible week/day actions, effort chip, Public message

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3 items 4, 5 and 9 (`docs/tasks/bk-smoke-FINDINGS.md` ->
"Smoke round 3" + "Round 3 rulings"). Seth approved the mock (Oct 6):
https://claude.ai/artifact/TD1ddiGCaHqrWLScS8w5qY - its right-hand phone IS
the visual spec for this unit. Recon facts (sr3-r2, Oct 6): deleting a week
or a day is reachable ONLY by re-tapping the already-selected pill
(`BlockBuilder.jsx` `selectWeek` / `selectDay` open the week / day actions
sheets - Rename, Duplicate, Move, Delete); the block's effort scale lives
only in `BlockSettingsSheet.jsx` (`EFFORT_OPTIONS` + `Segmented`) and
defaults to "none"; the Public checkbox in Settings and the Library card's
"Make public" both really publish to a community list that is not
launched. This is a judgment-heavy VISUAL unit, so the look is specified.

FILES TO TOUCH:
- client/src/components/blocks/builder/BlockBuilder.jsx
- client/src/components/blocks/builder/BlockSettingsSheet.jsx
- client/src/styles/blocks/bk-builder.css
- client/src/components/library/LibraryBlockCard.jsx
- client/src/pages/MyTemplatesPage.jsx
- client/src/styles/blocks/bk-library.css   (only if the Library message
  needs a rule)
Do NOT modify anything outside these files. In particular do NOT touch
`ExerciseCard.jsx`, `blockBuilderState.js`, or anything under
`client/src/components/blocks/ui/` (another unit is editing the first two
in parallel).

CHANGE:

1. **Week actions button (item 4).** In the row that shows the `WEEK n`
   label above the week pills, add a round "..." button at the right end of
   that row. It is the SAME visual as the exercise card's round menu button
   (`.bk-ex-card__menu-btn` - reuse or share its styling; a slightly smaller
   size is fine), quiet grey, never accent. `aria-label="Week <n> actions"`,
   `aria-haspopup="dialog"`. Tapping it opens the EXISTING week actions sheet
   (the one re-tapping the selected week pill opens today) for the selected
   week. Re-tapping the selected pill keeps working.
2. **Day actions button (item 4).** At the END of the day line (the
   `SectionRule` row with the day name and the exercise/set count chips),
   add the same round "..." button. `aria-label="<day name> actions"`. Opens
   the EXISTING day actions sheet for the selected day. Re-tapping the
   selected day pill keeps working. Both buttons are hidden in read-only
   mode (when the builder is not editable), like other edit affordances.
3. **Effort chip (item 5).** Under the block name in the sticky header
   (the name is the `StickyHeader` eyebrow), add a small pill-shaped
   BUTTON: text `RPE`, `RIR`, or `Effort: off` for "none", followed by a
   small down caret. Accent-tinted (border + soft fill from `--bk-accent` /
   `--bk-accent-soft`) when RPE or RIR; neutral (`--bk-line` /
   `--bk-surface-2`, `--bk-ink-2` text) when off. Uppercase, small, the
   same type family the builder uses for chips. It must not push the Save
   status or the header "..." off the row at 390px - the name may truncate
   with an ellipsis. Tapping it opens a `BuilderSheet` titled
   `Effort scale` with one line of copy - `How you rate effort on every set
   in this block.` - and the SAME three-option `Segmented` (RPE / RIR /
   None) as Settings. Export `EFFORT_OPTIONS` from `BlockSettingsSheet.jsx`
   and reuse it so the two can never disagree. Picking a value applies it
   through the same path Settings uses (`setEffort` via the existing
   `onChange` wiring in `BlockBuilder.jsx`) and closes the sheet. Settings
   keeps its Effort scale control unchanged. Hidden or non-interactive in
   read-only mode.
4. **Public message (item 9) - Seth's copy, VERBATIM, lowercase, no
   punctuation added:** `this hasnt been implemented yet bro stop prying`
   - Builder Settings: turning the Public checkbox ON does NOT change
     `isPublic`; it shows that text with the builder's existing
     `BuilderToast` (default duration). Turning it OFF (a block that is
     already public) still works as today.
   - Library card: "Make public" does NOT call the API; it shows that text
     in the Library's existing inline feedback line (the `setSuccess`
     pattern in `MyTemplatesPage.jsx`, cleared the same way). "Make
     private" still works as today.
   - Leave the Private/Public badges, the Library filter tabs and the
     community section as they are.

Tokens only: every color from the existing `--bk-*` aliases; check every
new `var(--...)` resolves. No `window.confirm` / `window.alert`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run
  test:unit` from `server/` still green (no server changes expected).
- `node scripts/check-hex.mjs` clean; every new `var(--name)` in the
  diff is defined in `client/src/index.css` or `bk-ui.css`.
- `grep -rn "this hasnt been implemented yet bro stop prying" client/src`
  finds the string, and only in the touched files.
- `EFFORT_OPTIONS` is exported once from `BlockSettingsSheet.jsx` and
  imported (not redefined) where the chip sheet uses it.
- Visual evidence in DELIVERY.md at 390x844, dark mode, from a local run
  (client against a NON-prod API or a stub - `client/.env` points at
  PRODUCTION, never use it): screenshots of (a) the header with the effort
  chip and both round "..." buttons, (b) the week actions sheet opened from
  the week "...", (c) the day actions sheet opened from the day "...",
  (d) the Effort scale sheet, (e) the Public message toast. Save them under
  `.playwright-mcp/sr3-3/` and list the paths.
- Behavior evidence: picking RIR in the chip sheet changes the chip text to
  `RIR` AND the Settings Segmented shows RIR; turning Public on leaves the
  Settings checkbox unchecked after the toast.

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
