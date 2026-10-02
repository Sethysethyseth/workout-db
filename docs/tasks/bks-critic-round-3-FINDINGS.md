# BKS feel critic - round 3 FINDINGS (Oct 1, 2026) - FAIL 7/10 (final round)

Same separate critic agent as rounds 1-2 (palette crimson); brief `.playwright-mcp/bks-critic/BRIEF.md` (local);
screenshots local-only under `.playwright-mcp/bks-critic/round-3/`. Round 3 is the last round by rule - the loop
stops here and the score is recorded. Report preserved verbatim below.

## Seat follow-up (Oct 1, after the report)

- **P1-1 (keypad mode drops after autosave) - FIXED `9f6b2a0`** (direct fix; the effects are keyed on a
  stable live-block boolean and re-arm if a field is focused). Live-checked: `bk-log-kbd` held 3 s after an
  RPE autosave on a real block day.
- **P2-2 (AI-read comparison never renders) - FIXED `9f6b2a0`** (direct fix; the gate read `preview.ok`,
  which the 200 body never carries). Live-checked with the mock coach: comparison line + "Use the original
  read" render, and the revert restores the standard read.
- **Still OPEN:** P1-2 (builder range-row headers drift below 400px), P1-3 (out-of-order set tap logs the
  wrong row and drops a typed RPE - confirmed: logged sets carry `blockWorkoutSetId: null`), P2-1 ("Up next
  after this" names the live day), P2-3 (unexplained import transforms), P2-4 (This week card relayout), and
  the P3 list (incl. crimson's amber "good" token).

## Overall score: 7/10 - FAIL
Both round-2 P1s are closed, and three of the four round-2 P2s are closed. The fixes hold up under measurement: the 4-set builder card is 380px (was 524px), "press" puts the user's own lifts at #2-#4, and the Home hero starts the right block day. It still fails the bar, because this round found three P1s on the lifter's main path, and two criteria (keypad safety and import trust) are at 6:
- Keypad mode switches itself off after every set autosave, so the Finish dock comes back over the field being typed in.
- On rep-range rows at 390px, the builder's column headers drift one column, which puts "RPE" over the load field.
- Tapping a set number out of order logs a different row and silently drops an RPE the lifter already typed.

Round 3, the final round. Palettes: champ dark, champ light, crimson dark and crimson light. Viewports: 390x844 first, then 1280x800; the simulated keypad is 390x450. Pages with a scrollbar measure 375px of usable width at 390. Session 465 (W3 · Upper B) was started from the Home hero, logged to 16/16 and finished.

| # | Criterion | R1 | R2 | R3 |
|---|-----------|----|----|----|
| 1 | Builder roominess (Seth's "squished") | 5 | 6 | 7 |
| 2 | Search and scroll (exercise picker) | 4 | 7 | 8 |
| 3 | Keypad safety | 4 | 8 | 6 |
| 4 | Logger feel | 6 | 8 | 7 |
| 5 | Library | 6 | 8 | 8 |
| 6 | Import trust | 5 | 6 | 6 |
| 7 | Flow | 5 | 6 | 7 |
| 8 | Visual coherence | 6 | 7 | 7 |
| | **Overall** | **5** | **7** | **7** |

## Round-2 P1 / P2 status

| R2 item | Status | Evidence |
|---|---|---|
| **N1. Builder RPE on an unlabeled second row** | **CLOSED for fixed-rep rows. Reopened in a new form on rep-range rows below 400px (P1-2).** | Fixed reps: RPE is the inline 4th column under an "RPE" header. The × stays in one column, and the 4-set expanded card is **380px** at 390 (target ≤440; R2 was 524px). See `15-`. Rep ranges at 390: the wrapped field now has its own "RPE" label, but the header row no longer lines up with the fields (`35-`). |
| **N2. Home hero "Start" opened an empty workout** | **CLOSED** | The hero reads "W3 · Upper B / Start W3 · Upper B". The tap created session 465 for that block day and opened the logger in 3.25s. "Other workout" opens the Empty/Templates sheet (`01-`, `02-`). The separate Next card is gone. The hero skeleton is 196px and the loaded hero 199px (3px shift). During a live workout there is one Resume hero plus a muted line, but that line names the wrong day (P2-1). |
| P2. Search ranking | **CLOSED** | "press": #1 Leg Press, #2 Seated Dumbbell Press, #3 Barbell Bench Press - Medium Grip, #4 Barbell Incline Bench Press. "curl": #1 Barbell Curl. "row": #1 Bent Over Barbell Row. With the keypad open, 4 of the 5 visible rows are the user's own lifts (`20-`, `22-`). |
| P2. AI read sticks / no before-after | **Sticking CLOSED. Before-after and revert still OPEN (P2-2).** | Back then Preview returns the standard read (2 days, 21 sets). The comparison line and "Use the original read" never appear (`27-`). The root cause is below. |
| P2. Light-mode amber at ~2.1:1 | **CLOSED** | The over-cap field measures 5.28:1 in champ light and 5.14:1 in crimson light. The "OVER CAP" label is 4.89:1 (`09-`). |
| P2. "Sets x Reps" ignored | **CLOSED** (AMRAP still left blank, disclosed) | All read without AI: `5x5` → 5 × 5 @ 220.5 lb, `4 x 6-8` → 4 × 6-8 @ 176.5 lb, `3 x 30s` → 3 timed sets, `3x8 @ 185` → 3 × 8 (with a load problem, P2-3). `3xAMRAP` gives "Row 6: Couldn't parse prescription '3xAMRAP' - left blank" (`26-`). |

## Findings, ranked

### P1 - blocks the lifter

**P1-1. Keypad mode switches itself off after every set autosave, and the Finish dock comes back over the field being typed in.** Screen: logger, 390x450 simulated keypad, champ dark.
- **Repro:**
  1. Tap the set number to log the set.
  2. Tap that set's RPE field. RPE is mandatory, because Finish stays disabled until every logged set has one.
  3. Within about 350ms, `html.bk-log-kbd` is removed while the RPE input still has focus. No focusout event fires (events at t=41 and t=391 ms).
  4. The same happens when you edit RPE on any already-logged set, within 2s of the edit.
- **Measured:**
  - The dock is 94-118px tall and sits at y=332-450.
  - The focused RPE field sits at y=406-450, so the overlap is **44 of 44px** (`04-keypad-logger-rpe-after-onetap.png`).
- **Root cause:**
  - `client/src/pages/SessionDetailPage.jsx` ~2452-2483: the focusin/focusout effect depends on `[session, session?.completedAt, session?.blockContext]`.
  - Every autosave replaces `session`, so the effect's cleanup runs and removes `bk-log-kbd` at :2481.
  - The re-run only re-attaches the listeners. It never checks `document.activeElement`.
- **Why R2 missed it:** R2 typed into a field that never autosaved.
- **Fix:**
  - Key the effect on a stable boolean (live block session) or on `session?.id`, not on the `session` object.
  - On every (re)run, add the class again if `document.activeElement` is an INPUT or TEXTAREA inside `.session-detail-page--block`.

**P1-2. On rep-range rows below 400px, the builder's column headers drift one column: "RPE" sits over the load field and "LOAD" over the reps-max field.** Screen: builder, 390 (375 usable), champ dark.
- **Measured** on Seated Dumbbell Press, 3 × 8-10 @ 55 (`35-builder-390-range-exercise.png`):

  | Column | Header centre | Field centre |
  |---|---|---|
  | REPS | 114 | 122 |
  | TO | 165 | 191 |
  | LOAD | 216 | 259 |
  | RPE | 268 | (wrapped onto its own line) |

  - The "RPE" header sits directly over the 55 lb field (228-290px).
  - At 430 and 1280 every header lines up with its field to the pixel, so the defect is phone-only.
- **Why it blocks:** 3 of the 5 exercises in Upper A are rep ranges. A lifter reading down from the header sees 55 as RPE, and a lifter who taps under "LOAD" lands in reps-max.
- **Other measurements:**
  - The 3-set range card is 518px tall.
  - The wrapped RPE field is 286px wide.
- **Root cause:** `client/src/styles/blocks/bk-builder.css:559-590`. The `@media (max-width: 399px)` block turns `.bk-set-grid__row--range.bk-set-grid__row--effort` into a wrapping flex row. The header row keeps the 5-field grid.
- **Fix:**
  - In the same media query, give the header the same flex layout as the rows: 40px number, three `flex:1` fields, 34px spacer.
  - Hide its RPE cell, because each wrapped row already carries its own "RPE" label.
  - Or keep RPE inline down to 360px with 58px fields. Four 58px fields plus 40 + 34 + 5×6 gaps comes to 336px, which fits in 343px.

**P1-3. Tapping a set number out of order logs a different row, leaves the tapped row as a lookalike unlogged draft, and silently discards an RPE already typed on the earlier row.** Screen: logger, 390, champ dark.
- **Repro 1:** Cable Seated Lateral Raise, nothing logged. Tap "3".
  - Row **1** gets the ✓ (12 × 15).
  - Row 3 keeps "12 / 15" in full ink, with no ✓ and not logged.
  - The counter reads 1/3 (`06-logger-tap-set3-lands-in-row1.png`).
- **Repro 2:** Pullups. Type RPE 7 on row 1 (still a draft), then tap "2".
  - About 1.5s later, row 1 is logged with RPE **empty**: the 7 is gone.
  - Row 2 is left as an ink draft "8" (`05-logger-rpe-draft-lost-after-tap.png`).
  - The same thing happened on the Incline (an RPE 8 typed on set 2 was lost).
- **Why it matters:**
  - The lost RPE then blocks Finish ("Add RPE on 1 more set to enable Finish workout").
  - The lifter has to find which set is missing it.
- **In-order flow works:** type RPE, then tap the same set's number. Face Pull logged 15 × 40 @ 8.5 and @ 9 correctly.
- **Fix (block-day row mapping in SessionDetailPage):**
  - Bind a logged set to the planned row that was tapped (store the planned index on the created set), instead of filling the first empty slot.
  - Carry any typed draft values of the tapped row into the POST.
  - Never clear another row's draft.

### P2 - friction

1. **"Up next after this" names the workout in progress.** Home during the live W3 · Upper B reads "Up next after this: W3 · Upper B" (`12-home-live-upnext-wrong.png`).
   - Cause: `client/src/components/blocks/run/UpNextCard.jsx:21-33` uses `progress.nextDay`, which is still the in-progress day.
   - Fix: when the live session's `blockContext` matches `nextDay`, show the day after it (W3 · Lower B).
2. **After "Let AI read this layout", the comparison and "Use the original read" never render, on any path.** The mock read replaced a 2-day / 21-set read with "1 WEEK · 1 DAY · 6 EXERCISES · 6 SETS" and four columns ignored. Nothing says AI produced it, and there is no revert (`27-import-after-ai-read-no-revert.png`).
   - **Root cause:**
     - `server/src/controllers/blockImportController.js:113-120` returns `{kind, block, stats, warnings, notices, exercises}`, with no `ok` field.
     - `client/src/pages/ImportBlockPage.jsx` ~237 and ~245 gate the comparison on `nextPreview?.ok` and `savedPreview?.ok`. Both are always falsy, so the code always falls through to `clearAiReadSnapshot()`.
     - The component test passes because it renders `ImportPreviewStep` with props directly.
   - **Fix:** test `nextPreview != null` (runPreview returns null on failure), or add `ok: true` to the 200 response.
3. **Import transforms that aren't explained.**
   - **Inline load converted:** in a "Load (kg)" sheet, `3x8 @ 185` became **3 × 8 @ 408 lb**. The change list only cites "(100 kg -> 220.5 lb)", and a 408 lb barbell row isn't flagged (`26-` source run).
   - **Columns folded into notes:**
     - On Seth's real headers, Setup, Tempo, Job, Load_Type and Lead_Side are folded into exercise notes (`server/src/blocks/tableToBlock.js:307-333`).
     - The read-only preview card shows only the first notes line (`ExerciseCard.jsx` `firstNotesLine`, :25/:112/:336).
     - So "Box at PARALLEL. Narrow stance", "2s pause on box", "Job: Squat pattern" and "Load: barbell" are invisible in the preview.
     - The "2 things we changed or skipped" list only mentions Tier and Progression_Rule (`25-`).
     - In the builder, each folded line then counts as a separate "note" ("5 notes").
   - **Fix:**
     - Add a change-list line: "Setup, Tempo, Job, Load_Type, Lead_Side → added to each exercise's notes".
     - Show the full notes, or "+4 lines", on preview cards.
     - Add a per-row line for inline loads: "Row 3: '@ 185' read as kg → 408 lb".
4. **The Home "This week" card arrives late and pushes the page down.**
   - On a client-side return to Home, the hero skeleton holds steady (196 → 199px).
   - At about 1.36s the "This week" card (about 406px) is inserted, and "Recent workouts" jumps from **y=287 to y=706** (419px).
   - Fix: reserve a skeleton for This week at its loaded height, or render it below Recent workouts.

### P3 - polish

- **Logger:**
  - "+ Note", tapped while a set note is focused, needs a second tap: the first tap is lost to a blur re-layout.
  - When the exercise-note textarea does open, it is not focused, unlike the pencil, which focuses its input (`08-`).
  - The pencil column is 34px and the set button 40px wide, both under 44px wide. This matches the reference, but it is still under 44.
  - Inputs are labelled just "Reps", "Weight" and "RPE" with no set number. The builder uses "Set 1 reps".
  - Start → logger: Home flashes "IN PROGRESS / Resume workout" for about 400ms, then "Loading workout…" with the nav and a self-pointing "In progress" bar for about 600ms.
  - The "OVER CAP" label makes its row about 20px taller than the others.
  - The eyebrow says "WEEK 3" but no date (the reference has the day id plus the date).
- **Logger, desktop:** each field is 274px wide for 1-3 digit values. The card is 948px wide, and the fixed nav (101px) plus dock (118px) take 219px of 800 (`11-`).
- **Builder:**
  - Collapsed cards are 136px each. The letter chip and caret sit on their own row with the title about 53px below the card top. The expanded card puts the title beside the chip, so the collapsed card could be about 95px.
  - The summary line opens the "..." panel, which is 200 × 657px and reaches y=785. Its notes textarea is 170 × 72px with an inner scrollbar (`16-`).
  - "Move up" is enabled on the first card.
  - The Target/Cap control leaves an empty third slot.
  - The "Rep range" checkbox is 26 × 22px.
  - Escape doesn't leave block-name editing.
  - Save keeps full primary styling while the state reads SAVED.
- **Picker:**
  - The backdrop is a light wash, `rgba(241,245,249,0.45)`, in dark mode. Home's Start sheet uses a dark scrim (`19-`).
  - Nothing is listed before you type. Showing "Your exercises" as the empty state would use the new ranking.
  - There is no divider between the user's lifts and the catalog. The 5th "press" row is "Bent Press", while Overhead/Push Press sit at #14+.
- **Crimson semantics:**
  - In crimson, the "good" token is amber:
    - `--bk-good` is rgb(251,191,36) in dark, the same value as the over-cap warning.
    - In light it is rgb(217,119,6).
  - Effects:
    - The "4/4 complete" counter looks like "OVER CAP" (`10-`).
    - The SAVED dot (#d97706) and UNSAVED dot (dark amber) are the same hue (`34-`).
    - The "RUNNING" chip is amber (`33-`).
  - Fix: give crimson a distinct good token, or mark "full" with an icon or ink instead of colour.
- **Import:**
  - The source-step "Let AI read this layout" has no cost line. The preview-step one says "Uses 3 coach questions when the weekly limit applies." (`28-`)
  - The AI offer appears on Seth's clean sheet, triggered only by the ignored Tier and Progression_Rule columns, but not on a sheet with an unparsed "3xAMRAP" row.
  - At 390 only 3 of 4 day tabs fit, with no scroll cue (`25-`).
- **Run page** (`31-`):
  - The 61px header truncates the name to "UPPER/LOWER STRENGTH ...".
  - "+ COACH NOTE" reads as an add action, but it reveals a note.
- **Home** (`01-`):
  - The date appears twice: "Thursday, October 1" under the logo and "THURSDAY, OCTOBER 1" in the hero.
  - "Resume workout" (heading) and "Resume Workout" (button) are capitalised differently.
- **Desktop nav:** highlights nothing on the builder and logger (R2 P3, still open).

### Known (deferred, not scored)
- Home shows both the in-progress card and the bottom "In progress" bar.
- No rest timer starts after logging a set. The reference starts it on the set tap.
- Fractional Execution numbers: "Did 3.7×5.8 @ 188.6 lbs" (`30-`).
- The desktop In-progress bar is 980px against a 720px column (`24-`).
- "Per side" is offered on bilateral lifts.
- Removed planned rows are stored per device.

## What already works
- **Home → block day:**
  - One tap on "Start W3 · Upper B" creates the right block session.
  - After Finish, the hero offers "Start W3 · Lower B" (`29-`).
  - "Other workout" keeps the Empty/Templates sheet.
  - On cold load the hero skeleton is 196px against 199px loaded.
- **Logger at 390** (`03-`):
  - Planned rows are ready up front, and the first set row sits at y=422.
  - The header has a 6px progress bar and "0 / 16 sets logged".
  - Ghost values measure 4.17:1 (champ dark), 3.82:1 (champ light) and 4.20:1 / 3.74:1 (crimson dark / light). Ink is 15.0-17.4:1.
  - Keypads: Reps `numeric` (16), Weight `decimal` (16), RPE `decimal` (16). All set fields are 19px; notes and the session note are 16px.
  - Discard × to Back is 20px (234-278 against 298).
  - "+ Add set" works, and removing an unlogged added set needs no confirm (`07-`).
  - The pencil focuses a 16px note input.
  - With all 16 sets logged, Finish takes one tap and lands on Home with "Workout saved ✅".
  - Set, exercise and session notes and every RPE persisted to History.
- **Builder** (`14-`, `15-`, `17-`, `18-`):
  - The header is 57px, and the block name wraps onto 2 lines instead of clipping.
  - Tapping the name gives a 16px input.
  - The save state reads UNSAVED, then SAVING…, then SAVED, and never SAVED while edited.
  - The fixed-rep 4-set card is 380px with RPE inline and aligned.
  - The summary line "Rest 3:00 · RPE ≤ 8 · 1 note" opens the editor.
  - With the keypad open, the nav hides and the focused field has 0px overlap.
  - The desktop builder is clean, with 183px fields in a 672px card (`23-`).
- **Picker** (`20-`, `21-`, `22-`):
  - The list is 573px tall with 2009px of content and `overscroll-behavior: contain`.
  - 30 wheel ticks scrolled the list to its end (1435/1436) while `window.scrollY` stayed at 739.
  - The search is pinned, autofocused and 16px.
  - The list ends with "N more - keep typing to narrow" and "Use 'row' / NOT IN LIBRARY".
- **Library** (`13-`, `24-`, `33-`):
  - The running strip has GO, and the first block card sits at y=347.
  - "Create workout · PARKED" is greyed as intended.
  - It is coherent in crimson dark.
- **Run page:** the sticky header is 61px (R2: 143px). Day 3 is ticked and Day 4 shows NEXT (`31-`).
- **Import:**
  - Combined Sets x Reps is read without AI, with kg to lb conversion and one message.
  - The AI recipe is cleared by Back.
  - "6 match your library" uses the plural form.
  - One AI action name everywhere.
  - Real headers map cleanly: 5 min, 45s and 25s become timed sets; RPE_Cap becomes "RPE ≤ 6"; Rest_Sec becomes 2:30.
- **Palettes:**
  - Champ dark, champ light, crimson dark and crimson light share one card language (`09-`, `10-`, `32-`, `34-`).
  - Light-mode over-cap contrast is fixed.

## Bugs / console errors
- **App console:** no app errors or warnings in this session.
  - The 403 on `/@fs/...Phase-1-Program.tsv` came from my own probe.
  - So did the 404s on `/api/block-templates/import/preview` and `/api/blocks/import/preview`, and the 422 on `/block-templates/import/preview`.
  - The two `ERR_CONNECTION_REFUSED /auth/me` entries predate this session.
- **Behaviour bugs:**
  - P1-1: keypad class dropped on autosave.
  - P1-2: range-row header misaligned below 400px.
  - P1-3: out-of-order tap lands in another row and drops a typed RPE.
  - P2-1: "Up next" names the current day.
  - P2-2: AI comparison and revert never render (missing `ok`).
  - The first "+ Note" tap is lost while a set note is focused.
- **Not tested - blocked:**
  - The .xlsx upload: `browser_file_upload` refused `C:\Users\Sethy\OneDrive\Desktop\RecoveryProgram\...` as "outside allowed roots". I tried once and did not work around it.
  - I could not load the full 216-row real program into the paste box. I pasted a 9-row excerpt of `Phase-1-Program.tsv` with its real 20 headers, covering timed sets, `/side`, ranges, caps and lead side.
- **Staging state I left behind:**
  - **Session 465** (W3 · Upper B) is **finished** with 16/16 sets:
    - Incline 165 × 8 @ 7.5/9/8/8
    - Pullups × 8 @ 8/8.5/9
    - Cable lateral 15 × 12 @ 9/9/9.5
    - Face pull 40 × 15 @ 8.5/9/9.5
    - Barbell curl 65 × 10 @ 9/9/9
  - Notes on 465: the set note "Rear delts finally felt it", the exercise note "Rope at forehead height" and the session note "Incline felt strong. Lat raises burned."
  - **No session is in progress.** Next up is W3 · Lower B, not started.
  - **Builder:** one no-op save. Bench set 4 RPE went 8 → 7 → 8, then saved.
  - **No block was created** from any import preview.
  - **Theme:** champ dark.
