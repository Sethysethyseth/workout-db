# FINDINGS cr2: frontend critic, round 2 (September 9, 2026) - UNWORKED

> **Provenance.** This is the verbatim round-2 report from the September 9
> critic loop, preserved here on September 12 because it was living only in
> gitignored `.playwright-mcp/critic/round-2.md` and would have been lost.
> The loop ran round 0 (5/10) -> commit `2080128` -> round 1 (7/10) -> commit
> `932fa25` -> **round 2 (7.5/10), written 11 minutes after the last commit and
> never acted on.** `CRITIC_BRIEF.md` sets the exit bar at 8+, so the loop
> stopped one pass short of its own condition.
>
> **Status: nothing below has been fixed.** The "Round-1 fixes status" section
> describes what the round-2 COMMIT already landed; the "Top 10 fixes" and
> "Bugs" sections are the outstanding work order. One item is already ruled
> out: "every session reports 1h 2m" is uniform seed data, not a bug -
> `client/src/lib/sessionFacts.js` computes duration per session from
> `startedAt`/`completedAt`. The `/auth/me` triple-fire predates this wave.
>
> A UI block authored from the ranked list below is NOT yet written. Author it
> from here, not from memory. The referenced screenshots live in
> `.playwright-mcp/critic/round-2/` and `.playwright-mcp/shots/` (gitignored,
> local only).

---

# Round 2 - design critique (LogChamp), after the second rework pass

## Overall score: 7.5/10

Eight of round 1's ten fixes landed properly, and two of them - the Exercises view and the AI access page - went from the worst screens in the product to ones that hold their own; History rows now scan, the volume chart has axis ticks, the Trend heatmap has week labels and a real intensity ramp, the loading skeletons describe their content, and light mode is finally crisp pixel art instead of grey fog. What holds it under 8 is no longer any single broken screen but a layer of unfinished micro-detail spread across all of them: labels repeated under every row instead of set once as a column header, a "Tracked" badge on every exercise card that distinguishes nothing, em-dash placeholders standing in for real empty states, four "hero" sparklines that all draw the same straight line, and two of the four palettes (iron, crimson) whose scenes are nowhere near champ's standard.

| Screen | Viewport / theme | Score | Verdict |
| --- | --- | --- | --- |
| Home | desktop / dark champ | 7 | Hero is a dated greeting now, recent rows carry tonnage + duration; TOP GAIN still an em-dash. |
| Home | desktop / light champ | 7 | Crisp daytime-ish pixel city, no header seam, accent survives - the scene is still the night raster recolored. |
| Home | phone / dark champ | 7 | 2x2 stat grid fixed the ragged wrap; the date is printed twice within 60px. |
| History | desktop / dark champ | 7 | Top set / volume / time in aligned right columns - the list finally scans; the three caps labels repeat 33 times. |
| History | desktop / light champ | 7 | Same structure, reads even better on the pale ground. |
| History | phone / dark champ | 6 | Numbers survive the narrow width, but subtitles wrap to a lone "sets" and row heights go ragged. |
| Analytics - Muscles (Bars) | desktop / dark champ | 7 | Axis ticks arrived; the "effective" series is still a near-invisible track and the value column has no headers. |
| Analytics - Muscles (Trend) | desktop / dark champ | 6 | Week labels + a genuinely stepped ramp: readable now. Uses 55% of the card and the legend has no numbers. |
| Analytics - Strength | desktop / dark champ | 6 | Both hero numbers are labelled now; all four hero sparklines still draw the identical two-point diagonal. |
| Analytics - Exercises | desktop / dark champ | 7 | Real analytics: sparkline, top set, best e1RM, delta. Label noise x18 and three em-dashes on bodyweight rows. |
| Analytics - Execution | desktop / dark champ | 7 | Dashed planned/logged illustration with a legend - no longer mistakable for a hung request. |
| Analytics | desktop / dark iron | 6 | Amber UI is convincing; the iron scene is still ~90% black above the fold. |
| Analytics | desktop / dark crimson | 6 | Gold positives work; the crimson scene is a soft red blur, not the pixel art the other palettes ship. |
| Analytics | phone / dark champ | 7 | 2x2 tiles, four view tabs in one row, chip row now has a real fade mask. |
| Session detail | desktop / dark champ | 8 | Still the best screen: stat strip, numbered exercises, set tables, PRS count now matches the chips. |
| Session detail | phone / dark champ | 7 | Back moved above the title; exercise headers get cramped and the stat grid ends 3+2 ragged. |
| Library | desktop / dark champ | 6 | Clean, but "Saved workouts 0" still reads as a selected control and the two CTAs sit 650px apart. |
| Profile | desktop / dark champ | 7 | Real two-column desktop layout and the stat tiles match Analytics now; uses only the top 320px of the viewport. |
| Profile | phone / dark champ | 8 | Still the nicest moment in the product - tiles, list, then the scene revealed below. |
| Profile > Appearance | desktop / dark champ | 7 | Theme is a proper segmented control and labels have scrims; palette radios are still stark white circles. |
| Profile > AI access | desktop / dark champ | 8 | Rebuilt exactly as asked: switch + state line, three bullets, mono address with copy, per-client accordions. |
| Login | desktop / dark champ | 8 | Unchanged and still the best first impression. |
| Login | desktop / light champ | 7 | Was 5: the fog is gone, the wordmark and pixel grid are sharp on a white card. |
| Loading (Analytics) | desktop / dark champ | 7 | Tiles + coach + tab stubs + 10 chart rows, and the barbell "Loading..." is centred now. |
| Loading (History) | desktop / dark champ | 7 | Month label + dated-row stubs (verified in `LoadingState.jsx`); loads too fast to catch on screen, and the subtitle no longer flickers. |

## Round-1 fixes status

1. **Analytics > Exercises is not analytics - RESOLVED.** Each row is now `sparkline | 220 lbs x 10 TOP SET | 293 lbs BEST E1RM | +15 lbs TOP SET, 4W`, sorted by delta, with Active/All and search above (`analytics-exercises-dark-champ-desktop.png`). It is a data view, not a directory. Two leftovers below (label repetition, em-dash rows).
2. **Rebuild the AI access page - RESOLVED.** `profile-ai-dark-champ-desktop.png`: a switch row reading "AI access is on / Since Sep 9, 2026. Turning it off cuts access everywhere at once."; the three paragraphs are now three bold-led bullets (What it unlocks / What leaves LogChamp / What never leaves); the connector address is a monospace input with an icon copy button; per-client accordions (Claude, ChatGPT, Grok, Any other); the mock-mode line is a quiet dot-prefixed row, DEV-gated in source (`AiConnectorPage.jsx:131`); section labels have scrim chips so they no longer sit raw on artwork. The duplicate "AI ACCESS" section label and the loud "turn it off" primary button are both gone.
3. **Light-mode scene - PARTIALLY RESOLVED.** The blur is gone: `login-light-champ-desktop.png` and `home-light-champ-desktop.png` show a sharp pixel city, the pixel grid intact, and no hard header seam - the round-1 banding is fixed. But it is still the night raster desaturated: windows read as lit at midday and the sky is a flat white-lavender wash with no daytime cue, so light mode reads as "night, overexposed" rather than a designed day scene.
4. **History rows / green checks - RESOLVED.** The green check circle is gone from all 33 rows, and the dead middle width now carries `220 lbs x 10 / 14.8k lbs / 1h 2m` in three right-aligned columns (`history-dark-champ-desktop.png`). PR count is still not surfaced per row, and the caps labels repeat on every row (see fix 2 below).
5. **Trend heatmap - RESOLVED.** Column headers `Aug 13 / Aug 20 / Aug 27 / Sep 3` plus `AVG/WK`, and the ramp is genuinely stepped from near-background navy to full accent, so the grid reads (`analytics-muscles-trend-dark-champ-desktop.png`). Cells are still wide rectangles rather than squares, the grid occupies only 530px of a 950px card, and the "fewer/more" legend carries no numbers.
6. **The three "broken-looking" states - RESOLVED.** (a) The History skeleton is now a month label plus dated rows (`LoadingState.jsx:78-87`) and the subtitle reserves its slot with a space instead of flickering a different string (`SessionsPage.jsx:86`). (b) The Analytics skeleton has four tiles, a coach stub, a tab-bar stub and ten descending chart rows, and the height now matches (`analytics-loading-dark-champ-desktop.png`). (c) Execution's empty state uses dashed outline bars with a planned/logged legend (`analytics-execution-dark-champ-desktop.png`). The "Loading..." barbell mark is centred, not an orphan.
7. **Developer language - RESOLVED (within the dev caveat).** Both mock-mode strings are now behind `import.meta.env.DEV` (`AiConnectorPage.jsx:131`, `AppearancePage.jsx:358`) and read "Ready." in production; `[API] BASE_URL` is DEV-gated too (`http.js:17`). The login tagline is excluded per the owner's brand call.
8. **The two flagship charts - PARTIALLY RESOLVED.** Weekly volume gained axis ticks (0/2/4/6/8 under the plot) and the three inline "?" collapsed to one on the card description. Not fixed: the "Effective sets/wk" series is still a track at near card-background luminance in dark champ (it is fine in light and in iron), and the value column's two numbers still have no headers. On Strength, both hero numbers are labelled now ("top set +15 lbs", "matched effort +20 lbs @ 3 RIR") - but all four hero sparklines are still the identical straight two-point diagonal while the smaller "everything else" sparklines below them have more points, which inverts the hierarchy.
9. **Profile desktop layout and tile language - RESOLVED.** `profile-dark-champ-desktop.png` is a real two-column layout (identity + stat tiles left, SETTINGS list right), and the tiles now use the caps-label-over-number language of the Analytics tiles. It still occupies only the top 320px of a 900px viewport.
10. **Home hero and recent rows - RESOLVED.** The hero is now `WEDNESDAY, SEPTEMBER 9 / Evening session? / Last one: Lower A, yesterday.` with a single "Start Workout" button - the triple repetition is gone. Recent rows carry `14.8k lbs / 1h 2m` on the right. The phone stat grid is a clean 2x2 (`home-dark-champ-phone.png`).

## Top 10 fixes, ranked by impact

1. **Stop repeating the column labels on every row.** History prints `TOP SET / VOLUME / TIME` under all 33 rows (`history-dark-champ-desktop.png`) and Exercises prints `TOP SET / BEST E1RM / TOP SET, 4W` under all 18 (`analytics-exercises-dark-champ-desktop.png`) - that is 54 and 99 identical 9px caps strings, and they are the visual noise that keeps both lists from feeling designed. Set the labels once in a sticky header row above the list (right-aligned over their columns), drop them from the rows, and let the numbers carry `tabular-nums` alignment down the page. On phone, where the labels are already dropped, keep them dropped.
2. **Give the four Strength hero cards real sparklines.** All four draw the same straight diagonal with a single endpoint dot (`analytics-strength-dark-champ-desktop.png`) while claiming "4 sessions" - and the twelve smaller rows below have visibly kinked lines, so the least important charts on the page have the most information. Plot every session as a point (with the dots visible), keep per-card min/max scaling, and if only two effective points exist say so rather than drawing a fake trend. While there: `top set +15 lbs - top set 220 x 10` uses the phrase "top set" twice in one line; make it `+15 lbs since Aug 13 - best 220 x 10`.
3. **Retire the badge-on-everything pattern before it spreads.** Round 1 killed the green check on every History row; round 2 introduced a "Tracked" pill on every exercise card in session detail (`session-detail-dark-champ-desktop.png` - 01, 02, 03 all carry it). It is palette-aware (gold on crimson, `session-detail-dark-crimson-desktop.png`), so the color is fixed but the semantics are not: a badge every row carries tells you nothing. Show it only when an exercise is NOT tracked (the exception is the information), or fold it into the subtitle as plain muted text.
4. **Fix the placeholder states that render as bare em-dashes.** Home's TOP GAIN shows a lone em-dash over "not enough data" (`home-dark-champ-desktop.png`), and Exercises ends with two dimmed rows - Hanging Leg Raise, Pullups - carrying three em-dashes across three columns (`analytics-exercises-dark-champ-desktop.png`). The second is worse: those are bodyweight movements with real session counts, so the row should read `bodyweight - 9 sessions - best 12 reps`, not read as data loss. For TOP GAIN, put the explanation in the number slot ("Need 2+ matched sets") at tile-label size rather than an em-dash at 32px.
5. **Let the Trend heatmap use the card.** `analytics-muscles-trend-dark-champ-desktop.png`: the grid ends at x=770 in a card that runs to 1150, leaving 380px of empty card to the right of AVG/WK, so a readable chart still looks unfinished. Let the four week columns flex to fill the width (or show more weeks when the range is 8/12 weeks - at "12 weeks" the user should see twelve columns, not four), and put numbers on the legend ("fewer 0 - 8+ more") so the ramp means something.
6. **Finish the dark-mode "effective sets" series.** In dark champ the effective bar is a track at roughly card-background luminance (`analytics-dark-champ-desktop.png`) - the legend advertises two series and the eye sees one. It works in light (`analytics-light-champ-desktop.png`) and in iron (`analytics-dark-iron-desktop.png`), so this is a dark-champ token problem: raise it to ~35-40% accent, or make it an outlined bar with an accent hairline. Also give the value column two small headers (EFF / STIM) - two unlabelled numbers per row currently rely entirely on color memory from the legend.
7. **Bring iron and crimson up to champ's standard.** Iron Home at 1366x900 is a black page with amber buttons and a faint ember at the bottom edge (`home-dark-iron-desktop.png`); the forge is still below the fold. Crimson is the opposite failure - a soft out-of-focus red smear with a dark blob top-right (`home-dark-crimson-desktop.png`, `analytics-dark-crimson-desktop.png`), with none of the pixel-art identity champ and light mode now carry. Reframe the iron raster so its light source sits in the top two-thirds, and re-cut crimson as actual pixel art at the same crispness as champ.
8. **Tidy the phone History row.** `history-dark-champ-phone.png`: the subtitle wraps so `13 sets` breaks to a second line with a lone "sets", and rows alternate between two and three lines, so the list has no vertical rhythm and the date chips no longer line up with anything. Drop the time from the phone subtitle (the date chip already carries the day), shorten to `4 ex - 13 sets`, and give the row a fixed min-height so the chips march down the page evenly.
9. **Clean up the last two mixed-metaphor controls.** (a) Library's "Saved workouts 0" tile is accent-tinted with an accent border while its two siblings are plain, so it reads as the selected item in a filter group it is not part of (`library-dark-champ-desktop.png`); make all three identical, and move "Create block"/"Create workout" next to each other instead of 650px apart at opposite ends of the card. (b) Appearance's palette tiles still use stark white filled circles that read as unstyled native radios against the custom segmented control directly above them (`profile-appearance-dark-champ-desktop.png`); restyle them as a check on the selected tile only. The "Deep sea" tile still wraps to two lines with the YOURS badge crowding it.
10. **Use the desktop viewport on Profile and Home.** Profile fills the top 320px of 900 and leaves the rest to the scene (`profile-dark-champ-desktop.png`) - the settings list could carry one-line descriptions ("Appearance - theme, palette, custom looks") and the identity block could carry the streak as a small week strip, which would also stop the two columns from ending at different heights. On phone Home, the header already prints "Wednesday, September 9" and the hero eyebrow prints "WEDNESDAY, SEPTEMBER 9" 60px below it (`home-dark-champ-phone.png`) - drop one.

## What already works

- **Session detail** remains the strongest screen - stat strip, numbered exercises, SET/WEIGHT/REPS/EFFORT tables, PR chips - and the PRS headline now agrees with the number of chips.
- **The rebuilt AI access page** - switch + state line, three-bullet data disclosure, monospace connector address with an inline copy button, per-client accordions. This is how the rest of the settings surface should look.
- **History as a scannable list** - date chip, month grouping with counts, and three right-aligned numeric columns.
- **The Exercises view** is now genuinely analytics, sorted by delta, with a sparkline per row.
- **Axis ticks on the volume chart** and the single help affordance on the card description.
- **Loading skeletons that describe their content**, with the branded barbell "Loading..." centred beneath them.
- **Light mode** - crisp pixel art, no header seam, accent preserved, cards separating cleanly from the pale ground.
- **The coach chip row on phone** now carries a 72px fade mask, so the overflow reads as scrollable rather than clipped (`analytics-chips-phone-detail.png`).
- **Palette-aware semantics** hold up: positives are gold on crimson, lime on iron, green on champ, and the new "Tracked" pill follows the same token.
- **Phone Profile** - tiles, settings list, then the scene revealed below the fold.
- No horizontal overflow at 390px on any page checked (`scrollWidth === clientWidth`); the only over-wide elements are the chip scroller's own children, by design.

## Bugs

- **Bodyweight exercises render as data loss** - Hanging Leg Raise and Pullups show three em-dashes across TOP SET / BEST E1RM / TOP SET,4W despite "8 sessions all time" (`analytics-exercises-dark-champ-desktop.png`).
- **Every session in the fixture reports `1h 2m`** - real seed data, but on History it produces a column of 33 identical values that reads as a hardcoded string (`history-dark-champ-desktop.png`). Worth confirming duration is actually computed per session.
- **All four Strength hero sparklines are the same line** (`analytics-strength-dark-champ-desktop.png`).
- **Trend heatmap leaves 380px of empty card** to the right of the AVG/WK column, and shows four week columns regardless of the selected 2/4/8/12-week range.
- **Iron's scene is still effectively invisible** above the fold at 1366x900 (`home-dark-iron-desktop.png`).
- **Crimson's scene is blurred**, not pixel art, unlike every other palette (`home-dark-crimson-desktop.png`).
- **Library's "Saved workouts 0" tile is accent-filled** as though selected (`library-dark-champ-desktop.png`).
- **Appearance palette radios are stark white circles** and "Deep sea" wraps to two lines with its YOURS badge crowding the label (`profile-appearance-dark-champ-desktop.png`).
- **The date is printed twice on phone Home** - page header subline and hero eyebrow (`home-dark-champ-phone.png`).
- **Phone session detail** wraps the exercise subtitle so "2600 lbs" orphans onto a second line beside the Tracked pill, and the stat grid ends 3+2 with a gap (`session-detail-dark-champ-phone.png`).
- **`/auth/me` still fires three times per page load** (console log, three 401s when logged out). `[API] BASE_URL` is now DEV-gated and is no longer a shipping concern.
- **Boot loader not re-verified this round** - both Analytics and History now resolve too fast locally to screenshot the transition; the History skeleton was verified in source instead.
