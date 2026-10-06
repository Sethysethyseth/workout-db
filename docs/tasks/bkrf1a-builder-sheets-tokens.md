# TASK bkrf1a: Builder polish after critic R1 - dark scrim, real chips, full-width sheets, one confirm idiom

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
bkr critic round 1 scored 6/10 FAIL (`docs/tasks/bkr-critic-round-1-FINDINGS.md`
- read it; finding ids below refer to it). This unit fixes the builder half
(bkr4 landed `1f6d42a`) plus two app-wide token fixes. Runs in parallel with
bkrf1b (Home) and bkrf1c (import/Library/logger) - files are disjoint; stay
inside yours.

FILES TO TOUCH:
- client/src/index.css                       (new `--color-scrim` per mode;
                                              `font-family: inherit` for form
                                              controls; `.session-discard-confirm`
                                              question style)
- client/src/styles/blocks/bk-builder.css
- client/src/styles/blocks/bk-ui.css         (only if a primitive needs it)
- client/src/components/blocks/builder/BuilderSheet.jsx
- client/src/components/blocks/builder/ExerciseCard.jsx
- client/src/components/blocks/builder/ExerciseSettingSheet.jsx
- client/src/components/blocks/builder/BlockBuilder.jsx
- client/src/components/blocks/builder/BlockSettingsSheet.jsx
Do NOT modify anything outside these files.

CHANGE:
1. **P2-2 scrim.** `.bk-sheet__backdrop` mixes `--bk-ink` (the TEXT colour), so
   in dark mode the scrim is light grey fog. Add `--color-scrim` to
   `client/src/index.css` for light and dark (dark: a near-black navy at
   ~0.6 alpha; light: slate at ~0.45 alpha - tokens, defined in the same
   blocks as the other per-mode colours, covering every palette) and use it
   for the backdrop. Every builder sheet, chip sheet and confirm must darken
   the page in dark mode.
2. **P2-7 chips that read as settings, not disabled buttons.**
   - Every chip shows its current value in the ACTIVE style: "Rest 3:00",
     "Reps" -> "Reps" or "Reps 6-8" when a range is on, "Time", the effort
     chip ("RPE cap" / "RPE target" / the RIR wording), and for notes the note
     text truncated to ~18 characters ("Pause first rep..."). Only a truly
     empty note shows the muted "+ Note".
   - One horizontally scrollable row at 390 (no wrap, no visible scrollbar,
     a fade at the right edge when it overflows); each chip keeps a 44px
     tall hit area (the pill itself may stay 32-36px).
3. **P2-7 sheets that look finished.** Inside `ExerciseSettingSheet`:
   segmented controls fill the sheet width (`1fr 1fr`, 44px tall); the Rest
   stepper is centred with a 24px value and a preset row under it (None,
   1:00, 1:30, 2:00, 3:00 - one tap sets it); the note textarea is
   full-width, 16px text. One sheet header style everywhere (P3-3): the 18px
   block-font uppercase title. On >=720px, cap these sheets and the actions
   sheet at ~420px wide, centred (not 718px for 6 rows).
4. **P3-3 one overlay idiom.** On phone, the builder header "..." opens the
   same bottom action sheet as the card "..." (rows: Settings, Close), not a
   dropdown.
5. **P2-1 builder Close.** Drop the "You have unsaved changes. Leave without
   saving?" `window.confirm` from the header Close path: the local draft
   (`workoutdb-block-builder-draft:<id>`) already survives leaving and offers
   Restore. Keep the route-leave guard ONLY if removing it would lose data;
   say which in DELIVERY.md. Target: zero `window.confirm(` in the builder.
6. **P2-5 stale new-block draft.** On any successful create from the builder
   (Save, Create from the coach draft preview), clear
   `workoutdb-block-builder-draft:new`. (The import page's create path is
   bkrf1c's file - it clears the same key there.)
7. **P3-2 confirms.** In the in-page confirm (`.session-discard-confirm`,
   `.bk-builder-confirm__panel`): the question is 16px, weight 600, primary
   text colour; focus moves to Cancel when it opens; Escape cancels. When any
   builder sheet closes, focus returns to the control that opened it.
8. **P3-1 font.** Add `button, input, select, textarea { font-family: inherit; }`
   to index.css (family only - do NOT change global sizes). Give the confirm
   Cancel button and any builder button that renders at the 13.33px UA size
   an explicit size matching its neighbours.
9. **P3-8 collapsed card.** Letter badge, exercise name and a 16px chevron on
   ONE row (the expanded card already does this).
10. **P3-9 copy.** Remove the duplicated "WEEK 1 WEEK 1" label. When a coach
    draft is applied to a block whose name the user already typed, keep the
    user's name.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Grep: `--color-scrim` defined for light and dark in index.css and used by
  `.bk-sheet__backdrop`; `--bk-ink` no longer appears in that rule.
- Grep: zero `window.confirm(` in `client/src/components/blocks/builder/`
  (or exactly one with the reason written in DELIVERY.md).
- Grep: `workoutdb-block-builder-draft:new` is removed after a successful
  create in BlockBuilder.
- Every new `var(--...)` resolves (index.css or bk-ui.css) - list them.
- Playwright at 390x844 (else say so): computed backdrop colour in dark mode
  is dark (all channels < 60); chips on one row with values; the Rest sheet
  shows the preset row.

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
