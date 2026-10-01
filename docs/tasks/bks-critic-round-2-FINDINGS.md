# BKS feel critic - round 2 FINDINGS (Sept 30, 2026) - FAIL 7/10

Same separate critic agent as round 1; brief `.playwright-mcp/bks-critic/BRIEF.md` (local);
screenshots local-only under `.playwright-mcp/bks-critic/round-2/`. Report preserved verbatim below.

## Overall score: 7/10 - FAIL
All six round-1 P1s are closed, and the measured gains are large: fixed chrome on the builder fell from 278px to 112px, search went from 12 capped hits to 40 plus "N more", and the keypad now covers 0px of the focused field on both the logger and the builder. It still fails the bar because this wave brought in two new P1s (an unlabeled RPE row in the builder at every width, and a Home hero that names the next block day but starts an empty workout), and three criteria are still under 7.

Round 2. Palettes: champ dark, champ light and forest dark, with spot checks of iron, forest and crimson light/dark for the over-cap colour. Viewports: 390x844 first, then 1280x800. Pages with a desktop scrollbar measure 375px of usable width; pages without one measure 390px.

| # | Criterion | R1 | R2 |
|---|-----------|----|----|
| 1 | Builder roominess (Seth's "squished") | 5 | 6 |
| 2 | Search and scroll (exercise picker) | 4 | 7 |
| 3 | Keypad safety | 4 | 8 |
| 4 | Logger feel | 6 | 8 |
| 5 | Library | 6 | 8 |
| 6 | Import trust | 5 | 6 |
| 7 | Flow | 5 | 6 |
| 8 | Visual coherence | 6 | 7 |
| | **Overall** | **5** | **7** |

## Round-1 P1 status

| R1 P1 | Status | Evidence |
|---|---|---|
| P1-1. Search capped at 12, A-Z | **CLOSED** (ranking still weak, see P2-1) | "press" gives 40 rows plus "57 more - keep typing to narrow". "curl" gives 40 plus 29 more, with Barbell Curl #1, Hammer Curls #5 and Dumbbell Bicep Curl #13. "row" gives 40 plus 4 more, with Seated Cable Rows #12. The list is `.bk-picker__list`: 573px visible, 2009px of content, `overscroll-behavior: contain`. Search is pinned (top 195px even with the list at its max scroll), autofocused and 16px. Screenshots: `19-`, `20-`. |
| P1-2. Keypad covered the field | **CLOSED** | Simulated keypad at 390x450. Logger: no fixed element is visible, a set field has 0px overlap, and the session note has 0px overlap at 16px (`05-`, `06-`). Builder: only the 56px header stays, the visible band is 394px (was 170px), and the focused "Set 3 RPE" has 0px overlap (`16-`). |
| P1-3. Finish in 1 tap, at the nav's position | **CLOSED** | The nav is `display: none` on the logger. Finish shows "13 of 16 planned sets not logged - finish anyway?" with **Finish anyway** / **Keep logging** (`11-`). |
| P1-4. Half-filled row showed ✓ | **CLOSED** | Typing only a weight (225) leaves the row as a draft ("Log set 3 as planned", no ✓). Tapping the set number then logs 5 reps x 225, and the counters read 3/4 and 3/16 (`07-`). |
| P1-5. Unsaved builder edits lost | **CLOSED** | Edited RPE, tapped the Library tab, came back: the banner reads "You have unsaved changes from last time. Restore unsaved changes / Discard". Restore brought back the edited value 7 (`17-`). |
| P1-6. Load (kg) read as lb | **CLOSED** | Preview shows "@ 220.5 lb", and the change list says "Load (kg): converted kilograms to pounds (100 kg -> 220.5 lb)". 80 kg became 176.5 lb, and BW became "Bodyweight" (`22-`). |

## Findings, ranked

### P1 - blocks the lifter (both new this round)

**N1. The builder's RPE has dropped onto an unlabeled second row, full width, at every viewport.** Screens: builder, 390 and 1280, champ dark.
- **What happens:**
  - Each set now renders as two rows. Row one is `1 | 6 | 185 | ×`. Row two (`.bk-set-grid__row--secondary`) holds a single wide "8".
  - The header reads only `SET | REPS | LOAD` and has no RPE column. Once filled, the field has no label at all.
  - The secondary field is 286px wide at 375, 301px at 390, and 646px at 1280.
  - 4 sets become 8 visual rows, which is why the expanded card is still 524px.
  - The × moves between rows: it sits on row one for fixed reps and on row two for rep ranges.
  - It looks bolted on, and a lifter can read the 8 as reps or load.
- **Screenshots:** `13-builder-390-expanded.png`, `14-builder-390-range-exercise.png`, `28-builder-1280-champ-dark.png`.
- **Fix (the builder set-grid row component):**
  - Put RPE back inline as the 4th field. The header's grid template `40px repeat(4, minmax(0,1fr)) 34px` already reserves it.
  - Only wrap rep-range rows, and only below about 360px.
  - Give the wrapped field a visible "RPE" label or prefix.
  - Keep the × in one consistent column.

**N2. The Home hero says "Next: W3 · Upper B", but its "Start Workout" button opens "Empty workout / Browse templates", not the block day.** Screen: Home after Finish, 390, champ dark.
- **What happens:**
  - The block day only starts from the smaller "Start" in the "NEXT: W3 · UPPER B" card directly below.
  - So the screen shows two Start buttons for the same day, and the big one leads to an unplanned session that does not count toward the block.
  - While a session is in progress, the same stack shows three Resume CTAs: the hero, the Next card and the bottom bar. The bottom-bar duplicate is known and deferred; the Next-card duplicate is new.
  - About 2s after landing, the page re-lays out: "Night session?" becomes "Next: W3 · Upper B", and the Next card and "This week" card are inserted above Recent workouts.
- **Screenshots:** `30-home-after-finish.png`, `31-home-next-day.png`, `32-home-start-workout-tap.png`, `01-home-390-champ-dark.png`.
- **Fix (Home hero):**
  - When a block day is next, the hero button should start that day ("Start W3 · Upper B"), and the separate Next card should go.
  - When a session is in progress, the hero should be the single Resume.
  - Keep the generic Empty/Templates sheet as a secondary text link.
  - Reserve the hero's height while loading so it doesn't jump.

### P2 - friction

1. **Search ranking favours short, obscure names over the lifts people actually use.**
   - "press" ranks Bent Press, Board Press, Calf Press, Chain Press and Cuban Press as #1-5. With the keypad open, those 5 are the only visible rows: a 250px list of about 5 rows (`21-keypad-picker.png`).
   - "Barbell Bench Press - Medium Grip", which is in this user's own block, isn't among the 40 shown for "press". Seated Dumbbell Press, also in the block, is #35. "row" puts Bent Over Barbell Row, also from the block, at #16.
   - Fix: boost exercises the user has in their blocks or history, then catalog popularity, and only then name length.
2. **"Let AI read this layout" has no before/after and no "Use the original read" in this run, and the AI reading sticks.**
   - After the AI read (mock coach), the preview became 1 day / 6 sets with "Load (kg) was ignored", replacing the correct 3-day, kg-converted read.
   - Back then Preview, and even re-pasting the identical TSV, gives the AI's 1-day read again, and the "Let AI read" button is gone. So the deterministic read can't be reached for this layout any more.
   - Nothing on the page says the AI produced it. Storage holds no import keys, so this is server-side layout memory.
   - The bksf1c notes describe a before/after; I could not find it with the mock coach (`23-import-ai-waiting.png`).
   - Fix: always render the before/after and the revert, and don't remember an AI mapping until the user creates the block with it.
3. **The over-cap warning is amber at about 2.1:1 on light palettes.**
   - #f59e0b on #fbfcfd in champ light (`26-logger-390-champ-light.png`). Forest light and crimson light compute to the same amber.
   - Iron is fixed: #b91c1c in light, #fca5a5 in dark.
   - Fix: a darker per-palette `--color-warning` for light mode (for example #b45309), the same pattern as iron.
4. **"Sets x Reps" values like `5x5` are still ignored on import, so every exercise imports as 1 set** (6 sets for 6 exercises). It is disclosed, but `NxM` is the most common spreadsheet form.
   - Fix: parse `N x M`, `NxM-K` and `NxAMRAP` in the column mapper.

### P3 - polish

- **Logger:**
  - No rest timer starts after the one-tap log.
  - "Per side" is still offered for Barbell Squat, though it now confirms.
  - The Discard "×" (246-290px) sits 8px from Back (298px).
  - The first open of a session rendered blank for more than 1.5s, with the nav and the self-pointing In-progress bar showing, then both disappeared (`04-` first capture). The second open took 246ms. Add a skeleton.
- **Builder:**
  - The one-row header cuts the block name to 131 of 207px ("Upper/Lower Stre").
  - The header shows "SAVED" while the draft banner says there are unsaved changes.
  - Rest, Target/Cap, Reps/Time, Range and Notes now live only in the "..." menu, and the expanded card no longer shows the "4×6 @ 185 RPE ≤8 Rest 3:00" summary.
- **Block page:**
  - The sticky header is still 143px, with "- 4WK" wrapping onto its own line.
  - "IN PROGRESS" appears twice (chip plus bar label), and the bar is an indeterminate stub even though 3 of 16 sets are logged.
- **Import:**
  - "6 MATCHES YOUR LIBRARY" should read "6 match".
  - Two names for AI: "Let the coach convert it" and "Let AI read this layout".
- **Storage:** removed planned sets live only in this device's localStorage (`bk-log-hidden-planned:463:896`), so another device shows a different set count.
- **Analytics > Execution** still shows fractions: "Did 3×11.7 ... @ 1.5 RIR" (`33-`).
- **Cold load:** a new tab bounced through `/login?next=/blocks/import` once before rendering.
- **Desktop:** the In-progress bar is 980px wide against a 720px content column, and the desktop nav highlights nothing on the logger or builder.

### Known (deferred, not scored)
- Home shows the in-progress card and the bottom "In progress" bar together.

## What already works
- **Logger at 390:**
  - The header is compact: the first set row sits at y=427 (was 663).
  - The dock is 94px and the nav is hidden.
  - The "Effort: RPE" chip replaced the locked toggle.
  - Keypads: Reps `numeric` (13), Weight `decimal` (16), RPE `decimal` (16), Seconds `numeric` (3).
  - Every text input is 16px or larger: the set note, the session note and the picker search.
  - Ghost (plan) values measure about 3.9:1 in forest dark and about 3.6:1 in champ light. Ink is 13.8:1.
- **Edit sets:** the remove × replaces the pencil in the same 44x44 column, so the card no longer jumps. Removing a logged set asks inline: "Remove this logged set? Remove / Keep" (`08-`, `09-`).
- **Per side** confirms with clear copy: "Existing logged sets stay; the grid splits into Left and Right." (`10-`).
- **The pencil** focuses its note input straight away.
- **Back** goes straight to the block, with no native `confirm()`.
- **Builder:**
  - The header is one 56px row, the In-progress bar is hidden, and keypad mode hides the nav.
  - Card actions sit in a "..." menu.
  - The expanded card has 19 controls (was 32) and is 524px tall (was 710).
  - Builder reps fields are now `numeric`.
- **Library:**
  - The first block card sits at y=347 (was 523).
  - Fixed chrome is 108px (was 135), with a one-line In-progress bar of 52px (was 79).
  - The tiles no longer truncate, and the button reads "Open".
- **Home and History** lead with "W3 · Upper A" rows, so the week and day are visible.
- **Block page after Finish:** Day 1 and Day 2 are ticked and Day 3 shows "NEXT".
- **Palettes:**
  - Forest dark is coherent across logger and Library (`24-`, `25-`).
  - Iron's over-cap is now red.
  - The desktop logger no longer shows a Resume bar pointing at itself.
  - The desktop builder's sticky layers no longer overlap.

## Bugs / console errors
- **Console:** no errors or warnings in this round's logs (01:10-01:20).
- **Behaviour:**
  - N1: the unlabeled RPE secondary row.
  - N2: the hero's Start opens the Empty/Templates sheet.
  - The AI mapping sticks across re-paste.
  - The builder shows SAVED while a draft is pending.
  - The logger's first open renders blank.
- **Not tested - blocked:** the .xlsx upload. `browser_file_upload` refused with "outside allowed roots" (`C:\Users\Sethy\OneDrive\Desktop\RecoveryProgram\...`). I tried it once, per the brief, and did not attempt a workaround or the TSV.
- **Staging state I left behind:**
  - **Session 464** (W3 Lower A) is **finished** with 5 sets: squat 235x5 @7, 235x5 @9, 225x5 @8 (with the note "Dropped 10 lb, depth better") and 235x5 @8, plus RDL 195x8 @7.5.
  - **No session is in progress.** Next up is W3 Upper B.
  - **Builder:** I made one no-op save. Seated DB Press set 3 RPE went 8 to 7 to 8 to exercise Restore, so the block content is unchanged.
  - **Theme:** champ dark.
