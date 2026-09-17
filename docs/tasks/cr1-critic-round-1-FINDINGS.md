# FINDINGS cr1: frontend critic, round 1 (September 9, 2026) - WORKED

> **Provenance.** The verbatim round-1 report from the September 9 critic loop,
> preserved here on September 17 because it was living only in gitignored
> `.playwright-mcp/critic/round-1.md` and was one `git clean` from gone. Same
> rescue as `cr2-critic-round-2-FINDINGS.md` and `docs/design/critic-brief.md`,
> which came out on September 12.
>
> **The ladder:** round 0 (5/10, `cr0-critic-round-0-FINDINGS.md`) -> commit
> `2080128` -> round 1 (7/10, this file) -> commit `932fa25` -> round 2
> (7.5/10, `cr2-critic-round-2-FINDINGS.md`). The exit bar in
> `docs/design/critic-brief.md` is 8+.
>
> **Status: WORKED and superseded - this is NOT a work order.** Commit
> `932fa25` was authored directly against the ranked list below, and round 2
> recorded that **eight of these ten landed properly**. The live work order is
> CR2, not this file.
>
> **Its most useful section is "Round-0 fixes status"** - the only item-by-item
> audit of what commit `2080128` actually delivered against round 0's ten, and
> the reason both rungs are worth keeping rather than only the last one.
>
> Referenced screenshots live in `.playwright-mcp/critic/round-1/` and
> `.playwright-mcp/shots/` - still gitignored, local only.

---
# Round 1 - design critique (LogChamp), after the first rework pass

## Overall score: 7/10

Three of the four things that dragged round 0 down are genuinely fixed: the phone build has gutters everywhere, the session detail is now a real read view (2,662px -> 1,350px, with a stat strip and proper set tables), and the weekly-volume chart has become the best data card in the product. What keeps this at the top of the "competent" band rather than into "polished": two of the four analytics views still aren't analytics (Exercises is a picker list, Trend is an unlabelled block of identical blue rectangles), the AI access page is unstyled prose with a hardcoded-green dev banner and a loud accent button whose job is to turn the feature off, light mode is the dark raster blurred to grey fog rather than a designed light scene, and both loading skeletons have drifted out of sync with the content they stand in for.

| Screen | Viewport / theme | Score | Verdict |
| --- | --- | --- | --- |
| Home | desktop / dark champ | 6 | Week strip + stat band + PR list give it a real shape; H1 and CTA say the same words, recent rows still carry two facts. |
| Home | desktop / light champ | 6 | Scene and accent both survive now; the scene itself is grey fog and the header ends in a hard seam. |
| Home | phone / dark champ | 6 | Gutters and a good bottom nav; stat grid wraps ragged (TOP SET breaks to two lines, TOP GAIN gets its own row). |
| History | desktop / dark champ | 5 | Date chips and month grouping are real gains; still nothing to scan and ~700px of dead width per row. |
| History | desktop / light champ | 5 | Same structure, holds up on the light backdrop. |
| History | phone / dark champ | 6 | Clean, gutters correct, no clipping - the green check just eats width for nothing. |
| Analytics - Muscles (Bars) | desktop / dark champ | 7 | Value column, gridlines, two series, full card width - this is the card that carries the product. |
| Analytics - Muscles (Trend) | desktop / dark champ | 3 | A 14x4 heatmap with no column labels and four legend steps you cannot tell apart. |
| Analytics - Strength | desktop / dark champ | 6 | Hero cards + collapsed list is the right structure; all four sparklines are the same straight diagonal. |
| Analytics - Exercises | desktop / dark champ | 3 | Still a plain picker: 19 identical boxes with "last trained Nd ago", no numbers, no chart. |
| Analytics - Execution | desktop / dark champ | 6 | Real empty state with headline + CTA; the illustration is still three grey skeleton bars. |
| Analytics | desktop / dark iron | 6 | Amber environment is convincing; the iron scene is off-screen so Home reads as a black page. |
| Analytics | desktop / dark crimson | 7 | Strongest palette; the red/green collision is gone (positive is gold now). |
| Analytics | phone / dark champ | 6 | 2x2 tiles, labels stacked above bars; suggestion chips still hard-clipped at the right edge. |
| Session detail | desktop / dark champ | 8 | Genuine read view: stat strip, numbered exercises, SET/WEIGHT/REPS/EFFORT tables, PR chips. |
| Session detail | phone / dark champ | 7 | Holds together at 390px; Back button wedged between the two subtitle lines. |
| Library | desktop / dark champ | 6 | Nav/H1 mismatch and the duplicate CTA pair are both gone; CTAs now sit 650px apart. |
| Profile | desktop / dark champ | 5 | Centered now, but still a 575px phone column on 1366 with no desktop layout. |
| Profile | phone / dark champ | 7 | Best phone screen in the app - tiles fit, scene reveal is the nicest moment in the product. |
| Profile > Appearance | desktop / dark champ | 6 | Back link, radio placement and the swatch grid all fixed; native radios mixed with custom ones, dev string still there. |
| Profile > AI access | desktop / dark champ | 4 | Three paragraphs, a hardcoded-green mock-mode banner, and the loudest button on the page turns the feature off. |
| Login | desktop / dark champ | 8 | Still the best first impression; the password-field misalignment is fixed. |
| Login | desktop / light champ | 5 | No longer a card in a white void, but the scene is a foggy grey city and the card barely separates. |
| Boot loader | desktop / dark champ | 8 | Pixel wordmark + crown + barbell + "Loading session..." on the full scene - properly branded. |
| Loading (History) | desktop / dark champ | 5 | Skeleton no longer matches the redesigned row (no date chip, ungrouped); subtitle copy still flickers. |
| Loading (Analytics) | desktop / dark champ | 5 | Stat tiles match; the chart is a 380px featureless box and "Loading..." orphans at bottom-left. |

## Round-0 fixes status

1. **Phone side gutters - RESOLVED.** `main` computes `padding: 12px 16px 36px` at every width; Home, History, Analytics, Profile and session detail all have a real gutter at 390px, Profile's stat tiles are no longer sliced, and the first range chip is no longer clipped (`home-dark-champ-phone.png`, `profile-dark-champ-phone.png`, `history-dark-champ-phone.png`). A bottom tab bar was added and content clears it correctly at scroll-bottom.
2. **Session detail as a read view - RESOLVED.** No form controls left. Header strip (Duration / Exercises / Sets / Volume / PRs), numbered exercise cards with "4 sets - best 130 lbs x 5 - 2600 lbs", and a SET / WEIGHT / REPS / EFFORT table with PR chips. Desktop 2,662px -> 1,350px; phone 2,880px -> 1,478px. Date format is now "Finished Sep 8, 7:17 PM" (`session-detail-dark-champ-desktop.png`).
3. **Light-mode scene - PARTIALLY RESOLVED.** The scene now renders in light on every page and the primary CTA keeps the accent instead of going near-black. But it is the same dark raster at `opacity: .24` with `blur(22px) saturate(.75) brightness(1.55) contrast(.8)` - a night city desaturated to grey, so light mode reads as overcast fog and the pixel-art identity (the thing that made the scene worth having) is blurred out of existence (`home-light-champ-desktop.png`, `login-light-champ-desktop.png`).
4. **Execution empty state - PARTIALLY RESOLVED.** The copy is right now: dashed frame, "Nothing to compare yet", a real explanation, and a "Browse saved workouts" button. But the illustration inside it is still three grey skeleton bars - the exact shape that made it read as a hung request in round 0 (`analytics-execution-dark-champ-desktop.png`).
5. **Developer language - PARTIALLY RESOLVED.** Two of five fixed: `frontRearDelt cannot be computed...` is now "Front vs. rear delt balance isn't tracked yet: the exercise catalog files every shoulder exercise under one 'shoulders' bucket", and "Waking up the server..." is gone from the codebase. Three still ship: "Running in mock mode on this server: canned answers, no model." (`AiConnectorPage.jsx:132`, still in a hardcoded green banner), "This server is in mock mode: palettes come from a formula, not a model." (`AppearancePage.jsx:374`), "Log your shit dog" (`AuthLayout.jsx:11`), plus `[API] BASE_URL = ...` on every page load.
6. **Palette-aware success green - RESOLVED.** `--color-success-text` is now defined per palette (champ `#86efac`, iron `#bef264`, forest `#a7f3d0`, chill `#99f6e4`, crimson `#fde68a`). The crimson red-on-red collision is gone - "+20 lbs" reads gold there (`analytics-dark-crimson-desktop.png`). The trend arrow is now a properly sized, correctly baselined glyph rather than a raised border-built chevron.
7. **Weekly volume chart - RESOLVED.** Fixed right-hand value column with both series' numbers, faint vertical gridlines, plot using the full card width, and a Bars/Trend/Table toggle. At phone width the label and values sit on their own line above a full-width bar (`analytics-dark-champ-desktop.png`, `analytics-dark-champ-phone-chart.png`). Two nits survive: no scale numbers on the gridlines, and the "effective" series is a grey track so low in contrast it reads as background rather than a series.
8. **Strength wall - RESOLVED.** Top four movers are now full cards with per-card min/max scaling and endpoint labels; the remaining twelve collapse into a compact list; green is reserved for the hero deltas (`analytics-strength-dark-champ-desktop.png`). Nit: because each line is drawn from two effective points, all four hero sparklines render as the identical straight diagonal.
9. **Profile and Appearance on desktop - PARTIALLY RESOLVED.** Appearance is fixed: "<- Profile" is a small text link, the duplicated section label is gone, radios sit beside their labels, and the palette picker is a swatch grid (`profile-appearance-dark-champ-desktop.png`). Profile is now centered rather than pinned left, but it is still a 575px mobile column on a 1366px viewport with no desktop layout, and its stat tiles use a different language (number over label, centered) from the Analytics/Home tiles (label over number, left-aligned, hairline rule).
10. **History rows - PARTIALLY RESOLVED.** Real gains: a day-of-week + date chip, month grouping with per-month counts, the "DONE" pill replaced, and the subtitle now carries "33 finished workouts - 485 sets logged". But the row still says only `7:17 PM - 4 exercises - 13 sets` with roughly 700px of empty space in the middle, and the green check circle that replaced the DONE pill has the same problem: it is on all 33 rows, so it distinguishes nothing (`history-dark-champ-desktop.png`).

## Top 10 fixes, ranked by impact

1. **Analytics > Exercises is not analytics.** `analytics-exercises-dark-champ-desktop.png` is 19 identically-sized boxes reading `Barbell Bench Press - Medium Grip / last trained 2d ago - 9 sessions`, stacked 1,250px deep behind three rows of chrome (view tabs, Active/All, search). Under a tab called "Exercises" inside Analytics, a user expects per-exercise numbers. Give each row the data it already has: top set, e1RM, sessions sparkline, and a delta - i.e. the row treatment from the Strength view's "everything else" list, which is already better than this. Or drop the tab and make exercise detail a drill-down from Strength. As shipped this is the one view where the app looks like a directory, not a product.
2. **Rebuild the AI access page.** `profile-ai-dark-champ-desktop.png`: an H1 "AI access" immediately followed by a section label "AI ACCESS"; three paragraphs of body prose in one undifferentiated card; a hardcoded green banner ("Running in mock mode on this server: canned answers, no model."); a full-width filled-accent primary button whose action is *turning the feature off*; and a second accent button ("Copy address") competing with it. Fixes: make the on/off a switch row with a one-line state ("AI access is on - since Sep 9"), demote "Turn off" to a text-danger link, compress the three paragraphs into a three-bullet "what leaves LogChamp" list, hide the mock-mode banner behind a dev flag, and put the connector address in a monospace input with the copy button as an icon inside it. Also add a scrim behind the section labels ("COACH IN THE APP" sits directly on busy artwork at y=645 and is hard to read).
3. **Give light mode a real scene instead of a blurred dark one.** `body::before` in light is the night raster at `opacity:.24` + `blur(22px) brightness(1.55)`. The result (`login-light-champ-desktop.png`, `home-light-champ-desktop.png`) is a grey-lavender fog where lit windows read as noise and the pixel art is gone. Ship a daytime variant of each of the five rasters (same city, day palette), keep it unblurred at low opacity, and let the pixel grid stay crisp - the pixel art *is* the brand. While there: the header ends at y=101 with a hard horizontal edge into a much darker backdrop in light mode; extend a gradient below the header or drop the header's opaque fill so it doesn't band.
4. **Give History rows something to scan, and stop marking every row green.** Every one of the 33 rows carries a green check circle on a page whose entire premise is finished workouts (`history-dark-champ-desktop.png`); it is the DONE pill in a new shape and it is off-palette green. Delete it, and put the ~700px of dead middle width to work: duration, tonnage, top set, and a PR count, right-aligned in a `tabular-nums` column so the list has a vertical rhythm you can read down. Reserve any colored marker for rows that actually contain a PR.
5. **Make the Trend heatmap readable or remove it.** `analytics-muscles-trend-dark-champ-desktop.png`: 14 rows x 4 columns of rounded rectangles with **no column headers at all** - you cannot tell which week is which - and a "fewer [][][][] more" legend whose four swatches are near-identical, so almost every cell renders the same bright accent and the grid conveys nothing. Fix: label the columns with week-start dates, widen the intensity ramp to genuinely distinct steps (e.g. 15% / 40% / 70% / 100% accent), make the cells square-ish so it reads as a grid rather than four bars, and only show the "not trained" legend entry when such a cell exists.
6. **Fix the three states that still read as "broken".** (a) The History skeleton is four detached two-line cards (`history-loading-slow-dark-champ-desktop.png`) but the real list is grouped rows with a date chip under a month header - the skeleton no longer describes its content, so the page reshuffles on arrival. (b) The Analytics skeleton's chart placeholder is a 380px featureless box that becomes ~490px of chart + coach card + tab bar (`analytics-loading-skeleton-dark-champ-desktop.png`); add 12-14 row stubs and the tab-bar stub so the height matches. (c) Execution's empty state still uses grey skeleton bars as its illustration - swap for an outlined/dashed placeholder chart so it cannot be mistaken for loading. In all three, the "Loading..." barbell mark is a tiny left-aligned orphan under the skeleton - center it or fold it into the skeleton block.
7. **Strip the last of the developer language.** Still on screen: "Running in mock mode on this server: canned answers, no model." (`profile-ai-dark-champ-desktop.png`, in a hardcoded green that will clash on crimson), "This server is in mock mode: palettes come from a formula, not a model." (`profile-appearance-dark-champ-desktop.png`), "Log your shit dog" on the login screen (`login-dark-champ-desktop.png` - the most-seen screen in the product), and `[API] BASE_URL = http://localhost:3000` in the console on every load. Gate the mock-mode notices behind a dev flag and write a tagline you would show a stranger.
8. **Finish the two flagship charts.** On Weekly volume (`analytics-dark-champ-desktop.png`) the gridlines have no numbers, so a 7.0 bar and a 4.1 bar have no scale to sit against - add tick values under the plot and a target line. The "Effective sets/wk" series is a dark grey track at roughly card-background luminance; raise it to ~40% accent outline so the legend's two entries are actually two visible series. And three inline "?" buttons inside one sentence ("Effective ? vs. stimulating ? sets per week...") turn the card's description into clutter - one help affordance on the card header is enough. On Strength (`analytics-strength-dark-champ-desktop.png`), all four hero sparklines draw as the same straight diagonal - plot every session as a point so the shapes differ - and each card shows two unlabelled "+" numbers (`+15 lbs - top set 220 x 10` and `matched effort +20 lbs @ 3 RIR`); label the first one.
9. **Give Profile a desktop layout and unify the stat tile.** `profile-dark-champ-desktop.png` is a 575px column centered in 1366px with ~400px of backdrop on each side and only 560px of content in a 900px viewport. Two columns (identity + stats left, settings list right) or a wider single column with larger tiles would both work. Separately, Profile's stat tiles (big number over a small centered label, no rule) are a different component language from the Analytics/Home tiles (small caps label, number, sub-line, hairline accent rule on top) - pick one and use it in both places.
10. **Tighten Home's hero and thicken the recent rows.** `home-dark-champ-desktop.png`: the hero card's H1 reads "Start workout", its sub-line reads "Empty session or a saved workout-your choice.", and the button inside it reads "Start Workout" - the same words three times in 100px. Cut the H1 or make it a greeting/date line (the phone build already does this well), and let the button carry the verb. The five "Recent workouts" rows below carry only a name, a date and "4 exercises - 13 sets" across 55px of row height - the session detail already computes duration, tonnage and PR count, so surface them here (same fix as #4, same component). Also: the phone stat grid wraps raggedly (TOP SET breaks to two lines, TOP GAIN falls to its own full-width row with a lone em-dash) - a 2x2 grid at 390px fixes it (`home-dark-champ-phone.png`).

## What already works

- **Session detail is now a genuinely good screen** - the stat strip (Duration / Exercises / Sets / Volume / PRs), numbered exercise cards, and the SET/WEIGHT/REPS/EFFORT tables with PR chips. Don't regress the compactness.
- **The weekly-volume bar chart** - fixed value column, gridlines, dual series, full card width, and a phone layout that stacks the label above the bar.
- **The boot loader** (`analytics-loading-slow-dark-champ-desktop.png`) - pixel wordmark, crown, barbell rule, "Loading session..." over the full scene. Branded and calm.
- **Phone gutters and the bottom tab bar** - the single biggest change; the phone build no longer reads as unfinished, and content clears the tab bar at scroll-bottom.
- **Palette-aware success color** - crimson's positive is gold, which kills the red/green collision without dropping the semantics.
- **The Strength view's structure** - four hero movers, then a collapsed list, with green reserved for the heroes.
- **Balance sliders** with pull-heavy / balanced / push-heavy anchors, and the amber "outside the balanced zone" flag on Quad:Hamstring.
- **The date chip + month grouping on History**, and the month-level "5 workouts" count.
- **Data quality** now labels its bar ("Effort (RIR or RPE) logged on 100% of sets - 100%") and explains why effort matters in user language.
- **Login** - wordmark + crown + scene, and the password field now matches the email field's width.
- **Library** - the nav/H1 mismatch and the duplicated Create block / Create workout pair are both gone.
- No horizontal overflow at 390px anywhere (`scrollWidth === clientWidth`), and no console errors beyond the expected 401s when logged out.

## Bugs

- **Analytics suggestion chips are still clipped at the right edge on phone** with no fade, gradient or peek - "Is my pus" just stops at x=390 (`analytics-dark-champ-phone.png`).
- **History subtitle copy still flickers**: "Every session you started or finished." during load, "33 finished workouts - 485 sets logged" after - two different strings for one slot (`history-loading-slow-dark-champ-desktop.png` vs `history-dark-champ-desktop.png`).
- **Trend heatmap has no column labels at all** - four unlabelled week columns; the AVG/WK column is the only labelled one.
- **Session detail header says PRS 8, but only 4 PR chips render** (one per exercise) on a 13-set workout - the headline number and the marks in the table disagree (`session-detail-dark-champ-desktop-full.png`).
- **Boot-to-app layout jump**: during boot the header renders ~33px tall, then the app header settles at ~101px, so the whole page shifts down on session resolve.
- **Loading skeletons no longer describe their content** (History: no date chip, ungrouped, no month header; Analytics: a featureless 380px box for a ~490px region).
- **The sparkle/star asset is still pasted on** - the same grey four-point star at a fixed bottom-right position in champ, iron and crimson, unrelated to the artwork under it; on crimson it is a light grey blob on red (`home-dark-crimson-desktop.png`).
- **Iron's scene is effectively invisible at 1366x900** - the forge glow sits below the fold, so iron Home reads as a black page with orange buttons (`home-dark-iron-desktop.png`).
- **Light mode has a hard header seam** - the header band ends at y=101 with an abrupt edge into a much darker backdrop (`home-light-champ-desktop.png`, `analytics-light-champ-desktop.png`).
- **Mixed radio treatments on Appearance** - native OS radios on the left of the theme rows, custom circles on the right of the palette tiles, in the same card (`profile-appearance-dark-champ-desktop.png`). The "Deep sea" tile also wraps to two lines and its YOURS badge crowds the label.
- **Library's "Saved workouts 0" tile is accent-filled** as though selected, but it is not a control and the real filters are the SHOW chips below it (`library-dark-champ-desktop.png`).
- **Session detail on phone puts the Back button between the two subtitle lines**, splitting "Finished Sep 8, 7:17 PM - Quick log (one-time)" from "One-time session-saved in History only..." (`session-detail-dark-champ-phone.png`).
- `[API] BASE_URL = http://localhost:3000` logs on every page load, and `/auth/me` fires two to three times per load.
