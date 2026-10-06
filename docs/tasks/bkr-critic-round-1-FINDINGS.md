## Overall score: 6/10 - FAIL
The wave's core moves work: logging is first on Home, there is exactly one Resume while live, the AI waits escalate on time with a LogChamp crown, and the keypad logic does the right thing. It still feels unfinished in the places Seth will touch most. Three destructive paths still use native browser dialogs, every builder sheet and confirm in dark mode sits on a light grey fog, the block card jumps into Home late and outweighs the hero, and the chip sheets look half-built.

Round 1, rotating palette iron. Covered: champ dark, champ light, iron dark at 390x844, plus desktop 1280x800 for Home (test123 + demo live) and the builder. Screenshots are in `.playwright-mcp/bkr-critic/round-1/`.

| # | Criterion | Score |
|---|-----------|-------|
| 1 | Home hierarchy: logging first, block card bold but secondary, no dead space | 6 |
| 2 | Home live state: one Resume, nothing duplicated, bottom bar right per route | 7 |
| 3 | Builder card: chips readable at 390, sheets focused, "..." sheet native | 6 |
| 4 | Confirms: in-page, clear, never a browser dialog | 4 |
| 5 | AI waits: crown reads as LogChamp, copy escalates, nothing looks disabled/frozen | 8 |
| 6 | Import AI fix: shown only when needed, cost clear, result explained | 6 |
| 7 | Keypad / Finish bar (as far as Chromium can show) | 8 |
| 8 | Visual coherence: palettes, light/dark, one card language | 6 |
| | **Overall** | **6** |

PASS needs an overall score of 8 or more, no criterion below 7, and no open P0/P1. This round fails on the overall score and on criteria 1, 3, 4, 6 and 8. There are no P0 or P1 findings.

## Findings, ranked

### P0
None.

### P1
None.

### P2

**P2-1 - Native browser dialogs are still used for destructive or exit actions (criterion 4).**
- Where (390, all themes):
  - Library > Delete on a block fires `window.confirm`: `Delete block template "Critic R1 test"? This cannot be undone.` The brief names this as the in-page confirm test. It also shows the internal word "template".
  - Builder header "..." > Close with unsaved changes fires `window.confirm`: `You have unsaved changes. Leave without saving?`
  - Live empty workout > Back fires `window.confirm`: `Leave this workout? You can open it again from the home screen.` That is a native confirm, not a `beforeunload`, and its own text says nothing is lost.
- Screenshots: none possible, because Playwright refuses to screenshot while a native dialog is open. The dialog text above was captured verbatim.
- Fix:
  - Route all three through the existing in-page alertdialog (`.session-discard-confirm.bk-builder-confirm__panel`, as used by Remove exercise).
  - Library card: an inline confirm on the card: "Delete 'X'? Your logged workouts stay." with [Delete block] and [Keep].
  - Builder Close: drop the confirm. The `workoutdb-block-builder-draft:<id>` local draft already survives leaving, which is why the bottom-nav exit has no confirm. Alternatively, use the in-page panel.
  - Session Back: no confirm, since the action is non-destructive.

**P2-2 - Builder sheets and confirms sit on a light scrim in dark mode (criteria 3 and 8).**
- `.bk-sheet__backdrop` computes to `rgba(241,245,249,0.45)` in dark mode on champ and iron, but to `rgba(15,23,42,0.45)` in light mode. The scrim is apparently derived from the text token, so it inverts.
- Result: the whole dark UI turns mid-grey "fog" behind every "..." sheet, chip sheet and Remove confirm. This is exactly the "looks a little out of place" feel.
- Screenshots: 14, 36, 37, 38, 39, 42, 49 (1280: the whole city scene goes grey), 53, 54. Compare 51, where light mode is correct.
- Fix: add a per-mode `--color-scrim` token in `client/src/index.css` (dark: `rgb(2 6 23 / .6)`, light: `rgb(15 23 42 / .45)`) and use it in `.bk-sheet__backdrop`.

**P2-3 - The block card pops in late and shoves "This week" down 272px (criterion 1).**
- Natural load on test123, 390, champ dark: `/block-runs/active` resolved at 2041ms, after "This week" had already rendered under the hero.
  - The layout-shift entry is 0.22, with `card weekly-report` moving from y 267 to 539. Page CLS is about 0.32.
  - "This week" also changes content when the block card arrives (its M-S day strip disappears).
- Live state: the "This week" skeleton is about 388px tall but the real card is about 280px, so Recent workouts jumps up 109px (CLS 0.045).
- Screenshots: 02 (block not yet loaded) and 03 (after); 23.
- Fix:
  - Render a 260px block-card placeholder while `/block-runs/active` is pending, or hold the below-hero stack until block and summary both settle.
  - Cache "has active run" in sessionStorage so the right skeleton is chosen on the next visit.
  - Size the "This week" skeleton per state (with or without the day strip).

**P2-4 - The "secondary" block card outshouts the hero (criterion 1).**
- `.bk-up-next h2` is 32px Barlow Condensed uppercase. On demo it wraps to 2 lines ("W1 · LOWER - HIP DOMINANT", 67px tall).
- The hero h1 "Start a workout" is 24.8px and 28px tall.
- The card is 261px tall against a 199px hero, and its exercise line runs 2-3 lines.
- The "Start W1 ..." button label renders at 13.33px.
- Screenshots: 17, 01.
- Fix:
  - Set the h2 to 20-22px on a single line with `text-overflow: ellipsis`.
  - Clamp the exercise line to 1 line.
  - Give the Start label 15px. Target card height is about 190px.

**P2-5 - A stale "new block" draft survives a coach-created block.**
- After Draft with the coach > Create block, `localStorage['workoutdb-block-builder-draft:new']` (name "Critic R1 test") is not cleared.
- The next "New block" then opens with "You have unsaved changes from last time", shows UNSAVED, and hides the "Describe the block / Draft with the coach" panel until Discard is tapped.
- Restoring that draft would create a duplicate block.
- Screenshot: 47.
- Fix: clear the `:new` draft key on a successful create in both the coach-draft and import create paths, the same way Save does.

**P2-6 - The In-progress bar covers the import preview's sticky "Create block" (criteria 2 and 6).**
- `.bk-import-sticky-create` is fixed at y 723-788 with z-index 4. The persistent bar is fixed at y 736-788 with z-index 5.
- `elementFromPoint` at the sticky Create block centre returns `persistent-workout-bar__cta` ("Resume"). Only a 2px sliver of the CTA shows.
- This happens whenever a workout is live.
- Screenshots: 57, 58, 62.
- Fix: hide the persistent bar on `/blocks/import` (and the coach-draft preview) the way the builder already does. Alternatively, lift the sticky bar by the bar height.

**P2-7 - Builder chips read as disabled, and the sheets look half-built (criterion 3).**
- Inactive chips (Reps, RPE target, Add note) use `#94a3b8` text with the same fill and border. They read as disabled, but "Reps" is the current mode, not a missing setting.
- Chips are 32px tall, under the 44px tap minimum. At 390 they wrap to 2 rows, leaving "1 note" alone on the second row.
- Inside the sheets, controls are left-packed in full-width shells:
  - The Rest stepper uses 140 of 356px.
  - Reps/Time is 51+52px in a 356px shell.
  - Target/Cap is the same.
- Rest steps by 15s, so 2:00 to 3:00 takes 4 taps.
- Screenshots: 13, 35, 36, 37, 38.
- Fix:
  - In `bk-ex-card` chips, show a value on every chip ("Reps 5", "RPE ≤ 8", "Note: Pause first rep...") in the active style. Keep the muted style only for the truly empty "+ Note".
  - Give chips a 44px hit area and make them one horizontally scrollable row at 390.
  - In the sheets, make segmented controls `grid-template-columns: 1fr 1fr` at full width.
  - Center the stepper with a 24px value and add a preset row (1:00 / 1:30 / 2:00 / 3:00).

**P2-8 - Import AI fix: problems are hidden, cost is vague, and the result is not explained (criterion 6).**
- Before the fix:
  - The problem list is collapsed behind an 11px muted "+ 3 things we changed or skipped", so the AI button appears before the reason for it.
  - "Uses 1-4 of your coach uses left this week, depending on the file." never says how many uses are left.
- After the fix:
  - The only explanation is a count diff: "AI read: 1 week · 3 days · 8 sets (was 1 week · 2 days · 7 sets)", with no per-row list of what changed.
  - 2 problems are still listed, with no word on whether the AI looked at them.
- Screenshots: 58, 59, 62.
- Fix:
  - When the preview has problems, render the list expanded with a warning tint and put the AI button at its foot.
  - Change the cost line to "Uses 1-4 coach uses - you have N left this week".
  - After the fix, show an "AI changed" list (row, field, before -> after) and tag leftovers "still needs you".

### P3

**P3-1 - Buttons don't inherit the app font.**
- Computed `font-family: Arial`, and `font-size: 13.33px` wherever `.btn` sets no size:
  - Confirm "Cancel" is 13.33px next to "Remove exercise" at 16px (42).
  - The block-card Start button is 13.33px.
  - "Use the original read" is 13.33px.
- Fix: add `button, input, select, textarea { font: inherit; }` to `index.css`, then size `.btn` explicitly.

**P3-2 - The confirm panel buries its question, and focus is not managed.**
- 'Remove "Barbell Bench Press"?' is 12px muted `#94a3b8`, the least prominent text in the panel (42, 54).
- Focus is not moved into the alertdialog: activeElement stays `body`.
- After Escape on any chip sheet or "..." sheet, focus lands on `body` instead of the trigger.
- Fix:
  - Make the question 15-16px in primary text at weight 600.
  - Autofocus Cancel.
  - Restore focus to the trigger on close.

**P3-3 - Two overlay idioms come from identical triggers.**
- The header "..." opens a dropdown popover (15). The card "..." opens a bottom sheet (14).
- On desktop the actions sheet becomes a 718px-wide centered dialog for 6 rows (49).
- Two different sheet header styles are in use: the 13px muted exercise name, and the 18px Barlow uppercase title.
- Fix:
  - On phone, make the header menu the same bottom sheet as the card menu.
  - On desktop, cap the sheet at about 400px, anchored near the trigger.
  - Use one header style for all sheets.

**P3-4 - The "View block ›" tap target is too small.** On the Home block card it is 66x14px (17). Fix: give it a 44px-tall hit area with padding and a negative margin.

**P3-5 - The "This week" day strip disagrees with its numbers.**
- The strip is the calendar week (Mon-Sun, today is Monday), but the stats cover a rolling 7 days (`/analytics/summary` from Sep 29 to Oct 5).
  - Demo shows "Workouts 2" with zero days lit (20, 24).
  - test123 shows "5" with only M lit (02).
- Fix: either label the stats "Last 7 days" or drive the strip from the same rolling window, with dates under the days.

**P3-6 - The AI crown is too faint to read as alive.**
- The crown is a 16px glyph. The breathe animation is opacity 0.78 -> 1 plus `translateY(-2px)` over 2.4s (30), which reads as static at arm's length.
- Fix: make it 18-20px with opacity 0.55 -> 1 and scale 0.92 -> 1.06. Keep the existing reduced-motion off-switch.

**P3-7 - The import busy status shifts the page and sits apart from its button.**
- The empty status slot is inserted when busy starts, pushing "Browse" from y 460 to 508, a 48px shift (59 -> 60).
- The line sits under the cost line, detached from the button.
- The copy says "big blocks" during a file fix (61).
- Fix: swap the cost line for the status line while busy (same slot, so no shift). Use file copy: "Still reading your file - long files take up to a minute."

**P3-8 - The collapsed exercise card wastes a row.**
- The letter badge and an 8px "▾" take their own 36px row, with the name below. The expanded card puts the badge inline (12 vs 13).
- Fix: put badge, name and a 16px chevron on one row.

**P3-9 - Copy nits.**
- "1 note" chip: there is only ever one note, so show its text truncated instead.
- "WEEK 1 WEEK 1" duplicate label (34).
- "Resume workout" vs "Resume Workout" case mismatch (20).
- The coach draft overwrote my typed block name "Critic R1 test" with "Mock generate block" (33). Keep a user-typed name over the AI's.

**P3-10 - Loading frames.**
- Starting a workout shows the bare scene with no skeleton (18).
- A block day briefly renders the In-progress bar for its own session, with "In / progress" wrapping, before focus mode kicks in (64).
- Fix:
  - Add a skeleton to the session page.
  - Set `bk-log-focus` from the navigation intent (started from a block) before the session fetch resolves.

**P3-11 - The keypad hide is a hard pop.** The 118px Finish dock goes `display: none` with no transition (67 vs 68). Fix: a 150ms `translateY` plus opacity ease-out, in line with the motion rules.

**P3-12 - Desktop Home is a stretched phone column.** The hero and block-card buttons are 916px wide (10b, 26). The desktop tab says "Workout" while the phone tab says "Home". Fix: put the hero and block card side by side at 1024px and up, or cap CTA width at about 360px.

### Known, not scored (seen and noted once)
No rest timer after a set. Fractional Execution numbers. Desktop In-progress bar width. "Per side" is offered on bilateral lifts (seen on Bike, 64b). The builder's week pill is a bright white bar (12, 34, 52).

## What already works
- **Home order:** the logging hero is first on champ dark, champ light and iron dark. The block card is clearly a separate card.
  - Week-progress segments (past weeks filled, current week outlined) read instantly.
  - Recent workouts are clean and clear the nav at the bottom.
- **Live Home:**
  - Exactly one Resume. During SPA navigation, 30 samples over 1.5s all showed 0 bars and 1 Resume.
  - The persistent bar is hidden on Home at both 390 and 1280. It is present on History, Library, Analytics and Profile.
  - While live, the block card collapses to "Up next after this: ...", so there is no competing Start.
  - The block-day hero shows "0 of 19 sets logged" with a progress bar.
- **"..." actions sheet content:**
  - The right six actions, with icons.
  - Move up is disabled on the first card.
  - Remove is separated by a divider and colored red.
  - Rows are 50px, the close button is 44px, Escape closes, and tapping the scrim cancels.
- **Remove exercise:** the in-page alertdialog plus an "Exercise deleted · UNDO" toast.
- **Builder draft safety:** leaving keeps a local draft, with a Restore/Discard banner on return (46).
- **AI waits:**
  - The crown glyph is the LogChamp crown, tinted `--color-interactive`, with verb labels ("Drafting your block...", "Fixing your file...").
  - The busy button stays at full opacity and does not look disabled. Its width stays stable thanks to the two-face slot.
  - `aria-busy` is set, and the status line is `role=status aria-live=polite`.
  - Escalation was measured: "Still working..." at 15.1s and "Almost there. Hang tight." by 48s.
  - Reduced motion is respected. The builder reserves the status slot, so it does not shift.
- **Import:**
  - A clean paste shows no AI button; a problem paste shows exactly one.
  - After the fix: "AI fix used 1 coach use." plus a "Use the original read" escape hatch.
- **Keypad logic:**
  - With a simulated iOS keyboard (`visualViewport.height` 450, `innerHeight` 844), `bk-log-kbd` toggles on, the dock goes `display: none`, and the focused Reps field stays visible (67).
  - Restoring the viewport without blurring brings the dock back (68).
  - Block-day focus mode hides the bottom nav and the bar.
- **Palettes:** everything is tokenized across the three combos tested. Iron's amber CTA with dark text reads well, and no surface looked hardcoded.

## Bugs / console errors
- **Console:** no errors or warnings across 15 log files. The only entries are the React DevTools info and `[API] BASE_URL`.
- **Keypad in plain Chromium:** a viewport resize to 390x450 shrinks `innerHeight` and `visualViewport` together (450 vs 450.4). The `innerHeight - vv.height > 150` heuristic therefore cannot fire, so the dock stayed and covered the focused field (input top 400, dock top 332; 66). This is a simulation artifact. Real iOS and Android Chrome (default `resizes-visual`; the viewport meta sets no `interactive-widget`) shrink only the visual viewport. The logic was verified by overriding `visualViewport.height` instead, as described above.
- **Bugs found:**
  - Stale `:new` builder draft after a coach create (P2-5).
  - The In-progress bar intercepts taps on the import sticky CTA (P2-6).
  - Home CLS of 0.22 when the block card arrives (P2-3).
- **Screenshot timing:** screenshots taken right after a full reload sometimes caught an earlier loading frame. All timing claims come from PerformanceObserver and resource timing, not from screenshots.
- **State left behind:**
  - demo.critic matches its baseline: 35 sessions, 0 open; blocks 121-124; block run 3 active on block 122.
  - The empty workout (470) and block-day session (471) I started were both discarded. Test block 129 was deleted. Builder drafts were cleared.
  - Two mock coach calls were made on demo (one block-draft, one import-fix). They may count against its weekly coach uses.
  - test123 was read-only: its builder was opened but nothing was saved.
  - The browser is left logged in as test123, dark/champ, at 390x844.
