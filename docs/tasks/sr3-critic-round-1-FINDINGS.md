## Overall score: 6/10 - FAIL

Every sr3 mechanic works when you go looking for it: pause/resume restores the exact run (same run id 3, W1 · Day 3 NEXT), the tall Add-exercise sheet keeps the search box in view, the 7-day cap holds, and hold-to-reorder lifts, slides and drops cleanly. It still fails the bar. On a phone, the new Resume / Start over choice appears 532 px above the screen when you tap Start on any block below the fold (P1). Several of the new controls also don't show their state: the Per side chip looks the same ON as a plain chip, the lift is barely visible on dark, and after a reorder a pill reads "DAY 3 / Day 1".

| # | Criterion | Score |
|---|-----------|-------|
| 1 | Builder header calm, not cramped at 390 | 6 |
| 2 | Week / day actions + 7-day cap | 7 |
| 3 | Exercise card: Per side chip + "each side" | 6 |
| 4 | Add exercise + Add to library | 6 |
| 5 | Hold to reorder | 6 |
| 6 | Pause / resume reads as "nothing lost" | 5 |
| 7 | Visual coherence | 7 |

Coverage: phone 390x844 first (champ dark, champ light, crimson dark, crimson light), then desktop 1280x800 for the builder and Library. demo.critic was used for every write. test123 was read only (Library looked at, then one GET to /block-runs/left-off). No native browser dialogs appeared, and no beforeunload dialog fired.

## Findings, ranked

### P1 - blocks the lifter

**P1-1. The Start / Resume choice opens off-screen for any block below the fold.**
- Screen: Library > Yours > Blocks. Phone 390x844, champ dark.
- What's wrong: I tapped Start on the paused "Phase 1" card (4th card, page scrollY 1029). The "Start "Phase 1"? / Resume at W1 · Lower - Hip Dominant / Start over / Cancel" card renders once, above the whole list. Its "Start over" button sat at y = -532 px, and nothing visible changed on screen, so Start looks dead.
- Who it hits: the switch confirm ("This pauses <block> - you can pick it up where you left off") has the same problem for every card except the first. A paused block sorts below the others (see P2-5), so the Resume flow, the point of sr3-1, is exactly the one that lands off-screen.
- Screenshots: `43-resume-choice-390.png` (what the lifter sees after tapping Start) and `44-resume-choice-at-top-390.png` (where the choice actually is).
- Fix direction: `MyTemplatesPage.jsx:434` renders `bk-lib-confirm` once above the list. Either render it inside the tapped `bk-lib-card` (replacing that card's action row), or show it as a bottom sheet like the builder's sheets. At minimum, call `scrollIntoView({block:'center'})` and focus the primary button when it mounts.

### P2 - friction

**P2-1. Per side ON is not visibly ON.**
- Screen: builder exercise card. 390, champ dark.
- What's wrong: on "Single-Leg Calf Raise" the chip has `aria-pressed="true"`, but its background (rgb 20,31,53), border (rgb 52,70,95) and text (rgb 241,245,249) are identical to the plain "Rest" and "Reps" chips. OFF (on Barbell Squat) differs only by muted text. A lifter can't tell the toggle's state without collapsing the card to read "each side".
- Also: once RPE is on, Per side becomes the 4th chip and is clipped off the right edge at 390 ("Per sid…").
- Screenshots: `09-card-single-leg-calf-390.png`, `11-zercher-after-add-390.png` (OFF on Barbell Squat), `18-effort-rpe-selected-390.png` (clipped).
- Fix direction: give `.bk-ex-card__chip[aria-pressed="true"]` the accent-pill treatment (background and border from `color-mix` on `--color-interactive`, like nav-active), and add a check glyph. Move Per side before "RPE target" so it never scrolls out of view.

**P2-2. After a reorder, the day pill shows two different numbers.**
- Screen: builder day strip. 390, champ dark.
- What's wrong: I dragged Day 1 to slot 3. The pills now read "DAY 1 / Day 2", "DAY 2 / Day 3", "DAY 3 / Day 1". The day header still says "DAY 1" while the day sits in slot 3, and re-tapping slot 2 opens a sheet titled "DAY 3". The positional eyebrow renumbers, but the default stored names don't.
- Screenshots: `28-day-pill-dropped-390.png`, `30-day-retap-actions-390.png`.
- Fix direction: in the reorder reducer in `blockBuilderState.js`, rewrite any day whose name still matches `/^Day \d+$/` to its new position. Or drop the eyebrow when name === "Day n", so only one number is ever shown.

**P2-3. Free-text exercises lose "Not in library" and "Add to library" after the first save.**
- Screen: builder, saved block reopened (/blocks/132/edit). 390.
- What's wrong: "Single-Leg Calf Raise" has `exerciseId` and `userExerciseId` both null on the server. It showed the NOT IN LIBRARY chip and an "Add to library" item in its "…" before saving. After save, the chip is gone and the menu is only Move / Duplicate / Replace / Copy set 1 / Remove.
- Cause: `blockBuilderState.js:178` hydrates every loaded exercise with `notInLibrary: false`.
- Screenshots: `16-freetext-card-actions-390.png` (before save), `39-saved-block-freetext-card-390.png` (after save).
- Fix direction: hydrate with `notInLibrary: !ex.exerciseId && !ex.userExerciseId`.

**P2-4. Adding to the library is a 5-tap, 4-sheet detour.**
- Screen: Add exercise > "Add 'Zercher Carry Hold' to your library". 390.
- What's wrong: the path is: tap Add to library (1), then the "Start from a similar exercise?" sheet, with the search box pre-filled with the new name and finding nothing, so "Start from scratch" (2), then pick a muscle (3), then "Add exercise" (4), then the "Added to your library" sheet, "Done" (5). The sheet headers also switch style twice: uppercase left-aligned "ADD EXERCISE", then centred sentence case with a back arrow, then centred again.
- Screenshots: `10-zercher-options-390.png`, `11-zercher-after-add-390.png`, `12-zercher-from-scratch-390.png`, `13-add-to-library-form-filled-390.png`, `14-zercher-landed-390.png`.
- Fix direction: in the builder path, skip the "similar exercise" step when the similar search is empty and go straight to the muscle form. Replace the "Added" sheet with a toast. Use the `ADD EXERCISE` header style throughout.

**P2-5. A paused block barely looks paused in Library.**
- Screen: Library. 390, champ dark.
- What's wrong:
  - The only signal is a 12 px, weight-400, slate-400 line: "Left off at W1 · Lower - Hip Dominant".
  - There is no PAUSED pill, although the running block gets a green RUNNING pill.
  - The button still says "Start", the same as never-run blocks.
  - The card sinks to 4th place.
  - The API already returns `doneDays` / `totalDays` (test123: 1/16), but they aren't shown.
- Screenshot: `42-library-left-off-390.png`.
- Fix direction: in the `bk-lib-card` used for a left-off run, add a "Paused" chip next to PRIVATE, relabel the button "Resume" (keeping Start over inside the choice), add "2 of 30 days done", and sort paused blocks directly under the running one.

**P2-6. The effort-scale segmented control underfills its track.**
- Screen: Effort scale sheet and Block settings. 390.
- What's wrong: the `bk-segmented` track is 357 px wide, but RPE / RIR / None take 48 + 48 + 53 = 149 px, leaving 208 px of empty track. It reads as broken. The sheet also never says what RPE or RIR mean.
- Screenshots: `17-effort-sheet-390.png`, `19-settings-sheet-390.png`.
- Fix direction: `.bk-segmented > button { flex: 1 }`. Add one muted line under each option, e.g. "RPE - rate 1-10" and "RIR - reps left in tank".

**P2-7. Multi-word exercise search returns nothing.**
- Screen: Add exercise sheet. 390.
- What's wrong: "calf" returns 12+ results, while "single leg calf" and "single-leg calf" return 0, only offering "Use…" / "Add to library". A lifter typing a natural name gets pushed toward creating duplicates.
- Screenshot: `08-not-in-library-options-390.png`.
- Fix direction: in the `ExercisePicker` search, match on all tokens (split on spaces and hyphens, AND-match each one) before falling back to "Use".

### P3 - polish

- **P3-1. The builder name field is cramped at 390.** The name input is about 113 px wide next to UNSAVED, Save and "…", so a real name like "Upper/Lower Strength - 4wk" gets cut. The effort chip is about 9 px uppercase. Screenshots: `09-card-single-leg-calf-390.png`, `15-day-with-3-exercises-390.png`. Fix: give the name its own full-width row above the status/Save row, or drop the "Unsaved" text and keep only the dot.
- **P3-2. The block title wraps to 3 lines on a new block.** The coach "Describe the block you want" box (about 250 px) sits between the week strip and the day strip, so the header reads as two separate zones. On a free-text card, "SINGLE-LEG CALF RAISE" wraps to 3 lines beside the NOT IN LIBRARY chip. Screenshots: `04-builder-menu-390.png`, `09-card-single-leg-calf-390.png`. Fix: move the coach box below the day strip, or collapse it to a one-line "Draft with the coach" button. Put the warning chip on the summary line, not beside the title.
- **P3-3. The lift is nearly invisible.** The shadow is `rgba(0,0,0,.28) 0 2px 14px` on a navy background. On the selected pill, the `bk-day--selected` inset ring replaces the lift shadow entirely, leaving only `scale: 1.06`, about 4 px. While being dragged, the week pill overlaps the "+" add-week button. Nothing hints that pills can be held. Screenshots: `26-day-pill-lifted-390.png`, `29-day-pill-hold-900ms-390.png`, `31-week-pill-mid-drag-390.png`. Fix: in `bk-ui.css`, write `.bk-pill--lifting` so it stacks with the selected ring (`box-shadow: var(--bk-shadow), <selected ring>`) and uses an accent glow from `--color-interactive` instead of black. Clamp the drag x to the last pill slot. Show a one-time "Hold a day to move it" hint under the strip.
- **P3-4. The 7-day cap starts 26 px off-screen.** After adding Day 7, the "7 days max" pill begins at x = 364 on a 390 screen, so you only see it if you scroll the strip. In the day "…" sheet, the disabled Duplicate row reads only "7 days max", which loses the verb. Screenshots: `21-seven-days-cap-390.png`, `22-seven-days-max-label-390.png`, `23-day-actions-at-cap-390.png`. Fix: scroll the strip to its end after adding a day, and label the row "Duplicate - 7 days max".
- **P3-5. Two different action-sheet styles.** The day and week "…" sheets use bordered button rows. The exercise "…" sheet uses an icon + text list. Screenshots: `23-day-actions-at-cap-390.png`, `16-freetext-card-actions-390.png`. Fix: pick the icon-list style for all three.
- **P3-6. Switching weeks auto-selects Day 1, so the first tap opens actions.** Tapping Day 1 then counts as a re-tap and opens the actions sheet. Screenshot: `36-builder-desktop-1280-champ-dark.png`. Fix: treat the first tap after a week switch as select-only.
- **P3-7. The Public toast covers the Public checkbox and its helper text.** The helper text still says "Visible to others for clone" while the box can't be ticked. Screenshot: `20-public-toast-390.png`. Fix: anchor the toast above the sheet, or render the message inline under the checkbox.
- **P3-8. The empty Add-exercise sheet is about 600 px of blank space.** With no query there are no recent or common exercises. Screenshot: `05-add-exercise-first-open-390.png`. Fix: show the user's recent exercises when the query is empty.
- **P3-9. The Library > Exercises empty state is stale.** It still says custom exercises are created only from a live workout's "Not tracked - add?" pill. Screenshot: `51-cleanup-done-390.png`. Fix: mention the builder's "Add to your library" path, and use one name for the concept ("Not in library" vs "Not tracked").
- **P3-10. Library takes about 1.7 s on a plain reload (local).** The skeleton plus "Loading…" shows for over 1.5 s. Screenshots: `41-library-after-switch-390.png`, `46-library-desktop-1280.png`.

### Known, not scored (this wave)

No rest timer after a set; fractional Execution numbers; desktop In-progress bar width; "Per side" offered on bilateral lifts; the week pill in the builder is a bright white bar; crimson's "good" colour reads amber; the old quick-log set-count / L-R pair confirms are still browser dialogs; "Create workout" greyed in Library; swap-an-exercise-for-today is parked; saving is blocked while any day is empty.

## What already works

- **Pause / resume works end to end.** Starting Critic sr3 paused Phase 1. Library showed "Left off at W1 · Lower - Hip Dominant". "Resume at W1 · Lower - Hip Dominant" reopened the same run (id 3, started 2026-09-30) with Days 1-2 ticked and Day 3 marked NEXT. The copy "This pauses Phase 1 - you can pick it up where you left off." is clear. Screenshots: `40-start-switch-confirm-390.png`, `44-resume-choice-at-top-390.png`, `45-after-resume-390.png`.
- **The Add-exercise sheet opens tall on the very first open.** The sheet is full height, the search box sits at y 196-240 and is focused. With a simulated keyboard (390x500), the search box and about 6 results stay visible. Results are 48 px rows with their own scrollbar. Screenshots: `05-…`, `06-…`, `07-add-exercise-keyboard-sim-390x500.png`.
- **Add to library offers both options and lands clean.** "Use 'X'" + NOT IN LIBRARY and "Add 'X' to your library" both appear. The added exercise lands in the day with no chip and is saved as `userExerciseId` 49. Screenshots: `08-…`, `15-day-with-3-exercises-390.png`.
- **The 7-day cap is enforced.** "+ Day" becomes a disabled "7 days max" pill (`disabled=true`), and Duplicate is disabled in the day "…" sheet.
- **Both "…" buttons are present and round.** The week sheet has Label / Duplicate / Copy forward / Move earlier / Move later / Clear / Delete, with Move and Delete correctly disabled when there is one week. The day sheet has Rename / Duplicate / Move left / Move right / Delete. Deleting a week uses an in-page confirm.
- **The Effort chip works.** It reads "Effort: off" and becomes an accent "RPE ▾" chip; picking a scale closes the sheet and adds an RPE column. It persisted on save (`useRPE` true).
- **Public behaves as specified.** Ticking Public shows the exact toast and the box stays unticked (`isPublic` false on the server).
- **"each side" reads naturally.** The collapsed summary reads "3 × 8  each side" on mobile and desktop.
- **Hold to reorder behaves correctly.**
  - Physics: a 500 ms hold gives a lift at 150 ms ease-out, the neighbours slide exactly one slot (-78 px) at a time, the drop lands, and the selected day stays selected (days and weeks).
  - No accidental actions: hold-and-release changes nothing, a quick 108 px drag changes nothing, a tap selects, and a re-tap opens actions.
  - No flicker seen.
- **The four palette/mode combos tested are coherent.** Champ dark/light and crimson dark/light were checked on the builder and Library, and no hardcoded colour leaked. Screenshots: `33-…` to `35-…`, `48-…`.
- **Desktop 1280 builder is calm and well spaced.** Screenshot: `37-builder-desktop-1280-header.png`.

## Bugs / console errors

- Console: 0 errors and 0 warnings across the session; only the React DevTools info line and `[API] BASE_URL`.
- Native dialogs: none fired. Every confirm (switch, resume, delete week, delete block, delete exercise) is in-page.
- Bug: P2-3, free-text exercises are hydrated with `notInLibrary:false` (`client/src/components/blocks/builder/blockBuilderState.js:178`).
- Bug: P1-1, the confirm is rendered out of view (`client/src/pages/MyTemplatesPage.jsx:434`).
- Brief discrepancy, not a defect: test123's Library shows "Left off at W1 · Lower A", not the brief's "W4 · Upper A". `/block-runs/left-off` returns run 7 (ended 2026-10-06), `nextDay` W1 workout 2 "Lower A", doneDays 1/16, so the UI matches the data. The brief's expectation is stale.
- Not covered: builder set inputs versus the fixed bottom nav. None of demo.critic's existing blocks had enough rows to put an input under the nav without writing data. The search-box-under-keyboard case did pass.

## Cleanup

- demo.critic is back on its original running block: GET `/block-runs/active` returns run id 3, blockTemplateId 122 "Phase 1", `endedAt` null, W1 days 1-2 done, Day 3 todo, so the next day is W1 · Day 3. Its run id and start date are unchanged.
- `/block-runs/left-off` returns `{"runs":[]}`: no "Left off" blocks, as at the start.
- The "Critic sr3" block (id 132) is deleted. `/block-templates/mine` lists R2 skeleton, Upper/Lower 4wk, Phase 1, Phase 1 - week 1, the same as before.
- The "Zercher Carry Hold" custom exercise is deleted. Library > Exercises shows 0 ("No custom exercises").
- test123: nothing written; one read-only GET only. The browser was left logged in as test123, as it was found, with localStorage theme dark / palette champ.
