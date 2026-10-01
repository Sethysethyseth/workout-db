# BKS feel critic - round 1 FINDINGS (Sept 30, 2026) - FAIL 5/10

Separate Claude agent (Opus, Playwright MCP) per Seth's Sept 30 ask; brief at
`.playwright-mcp/bks-critic/BRIEF.md` (local, gitignored); screenshots local-only under
`.playwright-mcp/bks-critic/round-1/`. Report preserved verbatim below.

## Overall score: 5/10 - FAIL
The new block-day logger is close to the recovery-logbook reference and is the best screen in the app, but the four things Seth asked about mostly fail when measured. Exercise search silently stops at 12 alphabetical hits. Fixed bars cover the field being typed in, on both the logger and the builder. Finish workout ends a session in one tap from the spot where the bottom nav normally sits. A half-typed set shows a check mark that the counter does not count.

Round 1, palettes: champ dark, champ light, iron dark, iron light. Viewports: 390x844 first, then 1280x800. Note: desktop Chromium draws a 15px scrollbar, so the 390px pages measured 375px of usable width. Phones use overlay scrollbars, so treat truncations of 1-3px as borderline.

| # | Criterion | Score |
|---|-----------|-------|
| 1 | Builder roominess (Seth's "squished") | 5 |
| 2 | Search and scroll (exercise picker) | 4 |
| 3 | Keypad safety | 4 |
| 4 | Logger feel | 6 |
| 5 | Library | 6 |
| 6 | Import trust | 5 |
| 7 | Flow | 5 |
| 8 | Visual coherence | 6 |
| | **Overall** | **5** |

## Findings, ranked

### P1 - blocks the lifter

**P1-1. Exercise search returns at most 12 results, sorted A-Z, with no "more", so common lifts can't be found by their obvious word.**
- Screen and setup: block builder, "+ Add exercise" sheet, 390x844, champ dark.
- What happens:
  - "press" gives exactly 12 rows, Alternating Cable Shoulder Press through Press Sit-Up. Seated Dumbbell Press is missing, even though it is in this very block. So are Dumbbell Bench Press, Leg Press and Overhead/Military Press.
  - "curl" gives 12, with no Dumbbell Curl, Hammer Curl or Lying Leg Curl.
  - "row" gives 12 and misses Seated Cable Rows. The catalog does have it: "seated cable row" returns "Seated Cable Rows".
- Why it matters: Seth asked "are the results hard to scroll". The real problem is that there is almost nothing to scroll. The list is 678px of content in a 629px viewport, so 49px of scroll, and the right answer usually isn't in it.
- Screenshots: `26-picker-390-press.png`, `28-keypad-picker-scrolled.png`.
- Fix (the exercise search in the BK sheet):
  - Rank by relevance: exact word, then word prefix, then name prefix, then contains. Then by popularity or "used in your blocks".
  - Raise the cap to 50 or more, or render all matches in a virtualised list.
  - Show a "N more - keep typing" footer whenever results are cut.

**P1-2. With the keypad open, fixed bars cover the field being typed in.**
- Setup: simulated keypad, focus at 390x844, then resize to 390x450.
- Logger (champ dark):
  - The Finish dock stays visible at 108px tall, which is 24% of the 450px viewport.
  - A set field that the browser scrolls to the bottom edge sits 100% under the dock: 44 of 44px covered (Bent Over Row set 2, `11-keypad-logger-field-under-dock.png`).
  - The "How the session went" textarea is 83 of 84px under the dock (`18-keypad-session-note-under-dock.png`).
  - The app already hides the bottom nav and the persistent bar via `html.bk-log-kbd`, but leaves `.session-finish-dock` showing.
- Builder (`51-keypad-builder-field-covered.png`):
  - Nothing hides on focus there. The sticky header (145px), the In-progress bar (79px) and the bottom nav (56px) all stay.
  - That leaves a visible band of 170px out of 450.
  - The focused "Set 3 RPE" field (407-451) sits fully under the bottom nav.
- Fix:
  - Logger: add `html.bk-log-kbd .session-finish-dock { display:none }`, since nobody finishes a workout mid-typing.
  - Builder: apply the same keyboard class on focusin, hiding `.bottom-nav` and `.persistent-workout-bar-wrap`, and un-stick or collapse `.bk-sticky-header`.
  - Set `scroll-padding-bottom` on `html` to the height of any bottom bar that stays.

**P1-3. "Finish workout" commits in one tap with no confirmation, and on the logger it sits where the bottom nav normally is.**
- Screen and setup: logger, 390x844, champ dark.
- What happens:
  - On the logger, `.session-finish-dock` (726-844, z-index 40) is drawn over `.bottom-nav` (788-844, z-index 5).
  - The nav is still rendered (display:grid) but can't be tapped. Playwright's click on "Library" was intercepted by "Finish workout".
  - I tapped Finish with 4 of 16 planned sets logged. It saved straight to Home ("Workout saved"), with no "12 planned sets not logged - finish anyway?"
  - A habitual reach for a nav tab ends the session.
- Screenshots: `19-builder-390-new.png` (logger bottom: dock where the nav was), `36-logger-390-finish-tap.png`.
- Fix:
  - Hide the bottom nav on the logger on purpose (focus mode), or lift the dock above it.
  - Make Finish a two-step action: an inline confirm that says "X of Y sets logged" whenever X < Y, the same pattern Discard already uses.

**P1-4. A half-filled set shows a check mark but isn't logged, and tapping the check doesn't complete it.**
- Screen and setup: logger, 390x844, champ dark.
- Steps: typed 185 into the bench set-3 Weight field (the plan was 195), without tapping the set number.
- What happens:
  - The row immediately shows the inverted ✓ ("Set 3 logged"), with Reps still blank (ghost 6).
  - The card counter stays at 2/4 and the session bar says 2/16.
  - Tapping the ✓ does nothing: it neither fills the planned reps nor un-logs the row.
  - The Discard confirm said "Your 3 logged sets will be deleted" while the header said 2/16. So the server holds a set with no reps that the UI doesn't count.
- Why it matters: this is the most common gym deviation (weight changed from plan), and the one-tap gesture breaks exactly there.
- Screenshots: `17-logger-partial-set3.png`, `20-logger-discard-confirm.png`.
- Fix (the block-day logger row):
  - Only show ✓ when the set really counts as logged.
  - Tapping the set number on a partially edited row should log it with the typed values plus the plan for any blank field.
  - Never persist a set without reps. Or count it, and show a "reps missing" state.

**P1-5. Unsaved builder edits vanish without warning on in-app navigation.**
- Screen and setup: builder (`/blocks/126/edit`), 390x844.
- Steps: added Barbell Shoulder Press, so the header said "UNSAVED", then tapped the Library tab.
- What happens:
  - No prompt appeared. Re-opening Edit showed the original 5 exercises, so the edit was gone.
  - `beforeunload` only covers hard reloads.
  - A lifter building a whole block can lose it with one tap on a bottom nav that is always visible.
- Screenshot: `29-builder-390-after-add.png`.
- Fix:
  - Add a router-level blocker (React Router `useBlocker`) while the draft is dirty.
  - Or autosave the draft the way the logger does.

**P1-6. Import silently reads "Load (kg)" as pounds.**
- Screen and setup: Import > Paste, 390x844.
- Input: a foreign TSV with headers `Movement / Sets x Reps / Load (kg) / Session`.
- What happens:
  - The preview shows "BACK SQUAT @ 100 lb". The 100 kg became 100 lb, a 2.2x error that would show up as the planned (ghost) weight in every logger row.
  - The "things we changed or skipped" list only says "Column 'Sets x Reps' was ignored". The unit is never mentioned.
- Screenshot: `32-import-390-foreign-preview.png`.
- Fix (the import column mapper):
  - Read the unit from the header: kg/kgs, (kg), lb/lbs.
  - Convert, or keep the kg unit, and always add a line such as "Load (kg): converted to lb" or "unit not recognised - assumed lb".

### P2 - friction

1. **The builder is squished by fixed chrome, not by its rows** (builder, 390x844).
   - The sticky header (143px) plus the In-progress bar (79px) plus the nav (56px) take 278px, which is 33% of 844. The working band is 566px.
   - One expanded exercise card is 710px tall for 4 sets (32 controls), so it never fits on screen.
   - The block name on the sticky header wraps, leaving "- 4WK" alone on its own line.
   - "Name this block" is 134px wide at an 11px font, so a typed name shows as "S HYPERTROPHY 6WK".
   - A rep-range exercise packs 6 controls per row: set, reps, "to", load and RPE at 44px wide each, plus ×.
   - Screenshots: `22-builder-390-edit-top.png`, `24-builder-390-exercise-controls.png`, `21-builder-390-name-typed.png`, `52-builder-390-range-row.png`.
   - Fix:
     - Collapse `.bk-sticky-header` to a single 56px row on scroll: block name plus week chips, with the Save pill inline.
     - Hide the In-progress bar on the builder.
     - Make the name input full width at 16px or more.
     - Move Move up / Move down / Duplicate / Replace / Delete into a "..." menu (saves about 100px per card).

2. **Five inputs are under 16px, so iOS Safari zooms the page when you tap them.**
   - Block name: 11px. Coach-draft textarea: 13px. Set note "How that set felt": 14px. "How the session went": 14px. Exercise search: 15px.
   - Fix: set `font-size: max(16px, ...)` on every text input and textarea.

3. **"Remove" on a logged planned set silently wipes it, and the row stays** (logger, edit-sets mode).
   - Removing logged set 1 kept the row, but cleared reps, weight and its note ("Bar speed good, left shoulder ok"). There was no confirm and no undo.
   - Removing an unlogged planned set does delete the row (4 rows became 3).
   - So one label does two different things.
   - Entering edit mode also inserts a 36px "Remove" row under every set: the card jumps from about 250px to 450px.
   - Screenshots: `14-logger-edit-sets-mode.png`, `15-logger-removed-logged-set.png`.
   - Fix:
     - Use "Clear" for logged planned sets, "Remove" for extra sets, with a 5-second undo toast.
     - Put the remove button in the 34px note column instead of adding a new row.

4. **The block-day progress bar is hard-coded to 50% for a day in progress.**
   - `bk-progress-bar` reads aria "Day progress 50%" both at 0/17 logged (session 463) and at 0/16 (session 464, `41-block-current-390-champ-light.png`), while the logger said 0/16 and 2/16.
   - Screenshot: `05-block-current-390.png`.
   - Fix: compute it from the session's logged and planned set counts (the 924bc66 hotfix probably stubbed this).

5. **"L/R" doubles the set grid in one tap with no confirm.**
   - It turned Barbell Bench Press from 0/4 into 0/8 with Left and Right grids.
   - It sits beside "Edit sets", so it's easy to mis-tap, and the label is jargon.
   - Screenshot: `16-logger-lr-toggled.png`.
   - Fix: move it into the exercise "..." menu as "Log each side separately", and only offer it for unilateral or dumbbell exercises.

6. **The picker's search field scrolls away with the results, and the list has no scroll containment.**
   - The search input is `position: static` inside `.bk-sheet__body`. After scrolling the results it sits at -248px, so you must scroll back up to refine.
   - `overscroll-behavior: auto` on `.bk-sheet__body`.
   - The search field isn't auto-focused, so it takes 2 taps to start typing.
   - Screenshot: `28-keypad-picker-scrolled.png`.
   - Fix: make the search row `position: sticky; top: 0`, add `overscroll-behavior: contain`, and `autoFocus` the input on open.

7. **"Let AI read this layout" replaces the deterministic preview with no diff and no undo.**
   - With the mock coach, a parse of 3 days with loads became 1 day with all 3 columns ignored, and nothing says the AI produced it.
   - The cost line is good: "Uses 3 coach questions when the weekly limit applies."
   - The "1 THINGS WE CHANGED" grammar is also wrong.
   - Screenshots: `32-import-390-foreign-preview.png`, `33-import-390-ai-read.png`.
   - Fix:
     - Label the result "Read by AI".
     - Keep a "Use original reading" toggle.
     - Pluralise the change count.

8. **Iron palette: the over-cap warning is the accent colour, and "+ Note" fails contrast in light mode.**
   - Over-cap uses rgb(245,158,11), which is identical to the iron Finish button background, so a warning reads as "selected".
   - In iron light, "+ Note" (#f59e0b on #fffdfa) is about 2.1:1.
   - Screenshots: `44-logger-390-iron-over-cap.png`, `50-logger-390-iron-light.png`.
   - Fix:
     - Add a per-palette `--color-warning` token whose hue is clearly different from `--color-interactive`. For iron, use red-orange.
     - Darken the light-mode accent text (iron `--color-interactive` text variant).

9. **Desktop (1280x800): sticky layers overlap.**
   - Builder: `.bk-sticky-header` (top 101, 720px wide) slides over the sticky In-progress bar (64-147, 980px wide). The bar's edges ("Upper/Lower" on the left, "Resume" on the right) peek out on both sides.
   - Logger: the In-progress "Resume" bar shows on the very page it points to.
   - The fixed stack is 252px, 31% of the viewport.
   - Screenshots: `48-builder-1280-expanded.png`, `49-logger-1280-iron-dark.png`.
   - Fix: don't render `.persistent-workout-bar-wrap` on `/sessions/:id` or the builder, and give the builder header the full content width.

10. **Library: 523px of controls before the first block card** (390x844).
    - Order: New block / Import / Create workout (parked) / running strip / Yours-Community / 3 type tiles / Show filter.
    - With the 135px of fixed bars, only 186px of the first card is visible.
    - Its main button is labelled "Running", which reads as a status, not an action.
    - The tile labels truncate to "SAVED WORKOU..." and "CUSTOM EXERCI..." (91 vs 89px at 375 wide, borderline at 390).
    - Screenshots: `03-library-390-champ-dark.png`, `04-library-390-scrolled.png`.
    - Fix:
      - Fold Yours/Community and the visibility filter into one row.
      - Rename the card button "Open" / "Continue W3".
      - Drop the "Blocks first..." developer subtitle and the "Refresh" button.

11. **Home: the recent-workouts list shows 5 identical rows.**
    - Every row reads "Upper/Lower Strength - 4wk ..."; the part that differs (W2 · Lower B) is truncated away.
    - After Finish, the hero says a generic "Evening session? Start Workout" instead of "Next: W3 · Lower A".
    - Screenshots: `02-home-390-bottom.png`, `36-logger-390-finish-tap.png`.
    - Fix: lead with "W3 · Upper A" and put the block name second. Make the Home hero name the next block day.

12. **The logger header repeats itself, and the first set row starts under the dock.**
    - The block name appears 3 times and "Upper A" 3 times before the first exercise (eyebrow, "Log workout" h1, subtitle, session card, chip).
    - The RIR/RPE toggle keeps about 110px even after it is "Signal locked".
    - The first input row is at y=663, half under the 118px dock on load.
    - Screenshot: `07-logger-390-top.png`.
    - Fix:
      - Drop the "Log workout" h1 and subtitle and let the session card be the header.
      - Collapse the locked RIR/RPE control to a single "RPE (locked)" chip.

### P3 - polish

- No rest timer starts after the one-tap log, though each card shows "Rest 3:00". The reference starts one when a set is logged.
- The pencil opens the set note but doesn't focus it, so it takes 2 taps. Its aria label stays "Add set note" while open.
- "Back" on the logger shows a native `confirm()` ("Leave this workout?") even though everything autosaves. The "×" top-left, where iOS users expect "back", is Discard (it does have an inline confirm).
- The "LIBRARY" back link at the bottom of `/blocks/current` is 16px tall. The logger "Back" is 57x36 and "Remove" is 69x36, both under 44px.
- Builder reps inputs use `inputmode="decimal"`; they should be `numeric`. The logger does this correctly.
- Column order: the workout summary shows Weight then Reps, the logger shows Reps then Weight (`37-session-detail-390.png`).
- Analytics > Execution reads "Did 3.7×5.8 @ 188.6 lbs @ 2.2 RIR". Fractional sets and reps, and RIR shown to someone who logs RPE (`39-analytics-execution-390.png`).
- Champ light: the selected RPE versus RIR is told apart mostly by text colour, since the backgrounds are #eef0f9 vs #f8fafc (`42-logger-390-champ-light.png`).
- Nav labels differ: desktop says "Workout / Library / History / Analytics", mobile says "Home / Analytics / History / Library / Profile".
- A cold load briefly shows the login card ("Log your shit dog") or an empty shell before the page (`30-import-390-start.png` first capture, `45-library-390-iron-dark.png` first capture).
- The persistent bar's "In progress · 2m" wraps to 3 lines at 375 and 2 lines at 390.
- Ghost (plan) values are slate at 55% opacity, about 2.2:1 on iron light. That matches the reference, but check them in bright gym light.
- The logger has no way to add or swap an exercise on a block day (Seth wanted "more flexibility").

## What already works
- **The logger matches the reference:**
  - One row per planned set, rendered up front.
  - 44px fields in the 19px display face.
  - Every field ghosted with the plan, weight included.
  - Tapping the set number fills reps and weight and leaves RPE blank.
  - The inverted ✓ done state.
  - A done/total count per card plus "n / N sets logged" with a progress bar.
  - Screenshots: `08-`, `09-`, `43-`.
- **Correct keypads on the logger:** Reps `inputmode=numeric` (17/17); Weight and RPE `decimal` (17/17 each). The builder uses `decimal` everywhere.
- **Effort handling:** "OVER CAP" with an amber border and label. Finish is gated with plain copy: "Add RPE on 1 more set to enable Finish workout".
- **Notes without switches:** a pencil per set (it turns accent when a note exists), "+ Note" per exercise, and "How the session went". The notes reached the workout summary.
- **Logger keyboard mode:** `html.bk-log-kbd` already hides the bottom nav and persistent bar while you type. Extend it, don't replace it.
- **Discard is safe:** an inline confirm with the set count and "This can't be undone."
- **Library:** the running strip plus GO reaches `/blocks/current` in 1 tap. "Create workout - PARKED" reads as intended.
- **After Finish:** the block page marks Day 1 complete, flags Day 2 "NEXT" and offers "Start workout". That is a clear next step.
- **Import:** ignored columns are listed. The AI action states its cost. The picker offers "Use 'press' - NOT IN LIBRARY".
- **Picker layout:** rows are 44px and full width, and with the keypad open the sheet still shows the input plus 5 rows (262px of list).
- **Palettes:** iron dark and champ light/dark all hold the BK card language. No hardcoded-looking surfaces apart from the warning amber.
- **No crashes:** the block-day page and logger loaded cleanly in every palette.

## Bugs / console errors
- **Console:** no errors or warnings in this run's logs (00:22-00:38). The only error on disk is the React hook-order error at 00:20:32, which is the seat's pre-run check fixed in 924bc66.
- **Behaviour bugs:**
  - P1-4: the ✓ shows on a row that isn't counted, and the Discard count (3) disagrees with the header (2/16).
  - P2-4: the day progress bar is a constant 50%.
  - P1-5: in-app navigation drops unsaved builder edits.
  - P1-6: the kg header is read as lb.
  - P1-1: search is capped at 12.
- **"+ Add set" rows that are added but not logged disappear on reload.** Bench went from 4 rows to 3 after remove-planned + add-set + reload, and the session total went from 17 to 16.
- **Not tested:** the .xlsx upload (bks4) and Seth's real `Phase-1-Program.tsv`. The environment's permission classifier blocked `browser_file_upload`, so a future round needs that permission granted.
- **Staging state I left behind:**
  - Session 463 (W3 Upper A) is finished with 4 sets: bench 3 (195x6 @7.5, 195x6 @8, 185x6 @8) and row 1 (165x8 @9).
  - Session 464 (W3 Lower A) is **still in progress** with 2 squat sets (235x5 @7, @9).
  - No builder changes were saved. Theme is reset to champ dark.
