# FINDINGS cr0: frontend critic, round 0 - THE BASELINE (September 9, 2026) - WORKED

> **Provenance.** The verbatim round-0 baseline report from the September 9
> critic loop, preserved here on September 17 because it was living only in
> gitignored `.playwright-mcp/critic/round-0.md` and was one `git clean` from
> gone. Same rescue as `cr2-critic-round-2-FINDINGS.md` and
> `docs/design/critic-brief.md`, which came out on September 12.
>
> **The ladder:** round 0 (5/10, this file) -> commit `2080128` -> round 1
> (7/10, `cr1-critic-round-1-FINDINGS.md`) -> commit `932fa25` -> round 2
> (7.5/10, `cr2-critic-round-2-FINDINGS.md`). `docs/design/critic-brief.md`
> sets the exit bar at 8+, so the loop stopped one pass short of its own
> condition.
>
> **Status: WORKED and superseded - this is NOT a work order.** Commit
> `2080128` was authored directly against the ranked list below, and round 1
> audited the result item by item: **5 RESOLVED, 5 PARTIALLY RESOLVED** - the
> "Round-0 fixes status" section of `cr1-critic-round-1-FINDINGS.md` is the
> per-item record. Anything still live from these ten has been re-ranked twice
> since; the ONLY live work order is CR2. Read this file as the baseline the
> whole September 9 UI wave is measured against.
>
> Referenced screenshots live in `.playwright-mcp/critic/round-0/` and
> `.playwright-mcp/shots/` - still gitignored, local only.

---
# Round 0 - BASELINE design critique (LogChamp)

## Overall score: 5/10

In dark mode with the champ palette this is a competent, coherent dark UI with one genuinely good idea (the full-bleed pixel scene + the display face + the pixel wordmark), and the login screen and the loading skeletons show someone was actually thinking. But the polish stops the moment you leave that one combination: light mode throws the scene away entirely and becomes a generic white-card SaaS template, every screen at phone width runs edge-to-edge with zero side gutter, the read-only session detail is a disabled edit form 2,880px tall, and developer-facing strings ("frontRearDelt cannot be computed", "This server is in mock mode", "Waking up the server...", "Log your shit dog") are on screen in the shipped product.

| Screen | Viewport / theme | Score | Verdict |
| --- | --- | --- | --- |
| Home | desktop / dark champ | 6 | Best-composed screen: clear CTA, decent stat band; recent-workout rows are empty boxes carrying two facts each. |
| Home | desktop / light champ | 3 | Scene gone, accent gone (near-black CTA), white cards on white - reads as a different, blander product. |
| Home | phone / dark champ | 4 | 4-column stat grid squeezed to wrapping; section header and "View all" run flush to both edges. |
| History | desktop / dark champ | 4 | 33 identical rows, a redundant "DONE" pill on each, no volume/duration/tonnage - nothing to scan for. |
| History | desktop / light champ | 3 | Same list, now on flat white with no depth or atmosphere. |
| History | phone / dark champ | 3 | Title, subtitle, month labels and Refresh button all touch the viewport edges. |
| Analytics - Muscles | desktop / dark champ | 6 | Real substance; ragged value column, no axis/scale, one-hue bars, the "up" green is off-palette. |
| Analytics - Strength | desktop / dark champ | 4 | 17 near-identical flat sparklines and 17 green deltas - a wall, not a ranking. |
| Analytics - Exercises | desktop / dark champ | 3 | Not analytics: a plain picker list with "last trained Nd ago", behind four stacked rows of chrome. |
| Analytics - Execution | desktop / dark champ | 2 | The empty state is grey skeleton bars - it reads as permanently stuck loading. |
| Analytics | desktop / dark iron + crimson | 4 | Palettes work, but the fixed mint-green "+20 lbs" fights amber and clashes hard on red. |
| Analytics | phone / dark champ | 4 | Suggestion chips clipped at the right edge with no scroll affordance; bars shrink to ~150px. |
| Session detail | desktop / dark champ | 2 | A read-only view rendered as a disabled edit form: labelled Weight/Reps input boxes for every set. |
| Session detail | phone / dark champ | 2 | 2,880px tall for a 13-set workout; ~2.5 sets visible per screen. |
| Library (Programs) | desktop / dark champ | 4 | Nav says "Library", H1 says "Programs"; the same Create block/Create workout pair appears twice. |
| Profile | desktop / dark champ | 3 | An unadapted phone column pinned to the left third of a 1366px viewport. |
| Profile | phone / dark champ | 5 | Nicest use of the scene, but every element sits at x=0/x=390 and the stat tiles are sliced by the edges. |
| Profile > Appearance | desktop / dark champ | 4 | Giant full-width accent "← Profile" bar above the title; 970px between each label and its radio. |
| Profile > AI access | desktop / dark champ | 3 | Three paragraphs of prose, a green mock-mode dev banner, and a loud purple button to turn the feature OFF. |
| Login | desktop / dark champ | 7 | Strongest first impression in the app - wordmark, crown, scene - undone by the tagline and a misaligned password field. |
| Login | desktop / light champ | 2 | A small card floating in an empty white 1366x900 void. |
| Loading (History) | desktop / dark champ | 6 | Row-shaped skeletons + barbell mark: genuinely designed. |
| Loading (Analytics) | desktop / dark champ | 4 | Skeleton is a featureless 220px void that becomes a 400px chart - guaranteed layout jump. |

## Top 10 fixes, ranked by impact

1. **Phone: give every page a side gutter.** `main` computes to `padding-left/right: 0px` at 390px, so H1s, subtitles, month labels, section headings and the Refresh button all sit at x=0, and the Profile stat tiles are literally sliced by both viewport edges (`history-dark-champ-phone.png`, `profile-dark-champ-phone.png`, `home-dark-champ-phone.png`). Set the gutter once on the page container - `padding-inline: 16px` on `main`/`.page` at `max-width: 640px`, with `padding-block` for vertical - and let the cards inherit it instead of carrying their own margins. This single defect is what makes the phone build read as unfinished.
2. **Rebuild the session detail as a read view, not a disabled form.** `session-detail-dark-champ-desktop.png` shows a "Name" input holding "Lower A", an "Exercise name" field repeating the card title, "Notes (optional) —", and a labelled Weight + Reps input pair per set, four levels of nested rounded boxes deep. One workout is 2,662px on desktop and 2,880px on phone. Replace with a compact table per exercise (`Set | Weight × Reps | RIR | PR`) at ~32px per row plus a session header strip (duration, total sets, tonnage, PR count). This is the screen that most looks like it was built by a different person.
3. **Light mode has no scene at all.** `getComputedStyle(body,'::before').backgroundImage` returns `none` under `data-theme="light"` - so light Home, History, Analytics and Login are flat `#f1f5f9` with white cards (`home-light-champ-desktop.png`, `login-light-champ-desktop.png`). Half the product's identity is dark-only. Ship light variants of the five scene rasters (or the same raster at low opacity over a light wash), and stop swapping the primary CTA to near-black in light - it drops the accent out of the page entirely.
4. **Fix the "Execution" empty state.** `analytics-execution-dark-champ-desktop.png` renders three grey skeleton bars with a caption underneath - identical in shape to the real loading skeleton, so it reads as a hung request, not "no data yet". Use a real empty state: an outlined placeholder chart, the headline "Log a workout from a template to unlock execution fidelity", and a "Browse templates" button. The same rule applies to Balance's "Front : Rear delt — not available" bare track.
5. **Strip developer language out of the UI.** Four instances: `frontRearDelt cannot be computed: the exercise catalog's muscle taxonomy has no separate front/rear deltoid distinction (single 'shoulders' bucket)` in Data quality (`analytics-dark-champ-desktop-full.png`), `This server is in mock mode: palettes come from a formula, not a model.` (`profile-appearance-dark-champ-desktop.png`), `Running in mock mode on this server: canned answers, no model.` in a hardcoded-green banner (`profile-ai-dark-champ-desktop.png`), and `Waking up the server...` shown on every analytics load (`analytics-loading-slow-dark-champ-desktop.png`). Rewrite in user language ("Front/rear delt split isn't tracked by this exercise catalog yet") and hide mock-mode notices behind a dev flag. Also `Log your shit dog` on the login screen and `[API] BASE_URL = ...` in the console.
6. **Make the "up" green palette-aware.** `--color-success-text: #86efac` is defined once, dark-wide, so the same mint "+20 lbs" appears on champ indigo, iron amber and crimson red (`analytics-dark-iron-desktop.png`, `analytics-dark-crimson-desktop.png`) - on crimson it's a straight red/green collision. Define `--color-success-text` per palette (a palette-harmonised positive hue) or drop the color and carry direction with the arrow plus weight alone. While you're there: the `::after` chevron built from 3px borders sits raised on `vertical-align: 0.12em` and reads as a stray glyph rather than a trend arrow - use a proper inline SVG sized to the cap height.
7. **Rework the "Weekly volume by muscle" chart.** Values trail each bar end, so 14 numbers form a ragged diagonal you can't compare (`analytics-dark-champ-desktop.png`); both series are the same accent hue, so the legend's "Effective" vs "Stimulating" distinction reads as "bar" vs "track"; there's no axis, no gridline, no scale reference; and the plot dead-ends 150px short of the card's right edge. Fix: fixed right-hand value column (`text-align: right`, tabular-nums), two distinguishable series treatments (filled accent vs 40%-opacity accent outline), a faint gridline at the weekly target, and let the plot use the full card width. At phone width the 130px label column leaves ~150px of bar - stack the label above the bar below 480px.
8. **Break up the Strength wall.** 17 stacked rows, each with a near-flat sparkline and a green "+3.8 lbs" (`analytics-strength-dark-champ-desktop.png`), is unscannable and green on all 17 rows means green means nothing. Show the top 3-5 movers as full cards with real sparkline range (scale each line to its own min/max so the trend is visible), collapse the rest into a compact sortable table, and reserve the green for actual outliers.
9. **Fix Profile and Appearance on desktop.** `profile-dark-champ-desktop.png` pins a ~575px mobile column to the left third of a 1366px viewport with 600px of empty backdrop to its right - center it, or use a two-column layout (identity + stats left, settings list right). On Appearance (`profile-appearance-dark-champ-desktop.png`), the "← Profile" back control is a 980px-wide filled accent bar sitting above and louder than the H1 - make it a small text link with a chevron; drop the "APPEARANCE" section label that duplicates the page title; and pull each theme radio next to its label instead of 970px away at the far right.
10. **Give History rows something to scan and cut the noise.** Every row is name + date + "N exercises · N sets" + a "DONE" pill on a page whose subtitle already says "33 finished workouts" (`history-dark-champ-desktop.png`). Drop the pill, add the numbers that matter (duration, tonnage, top set, a PR marker), and let the row's right side carry a small trend or volume bar so the list has a shape. Related: Home's "Recent workouts" cards carry only a name and a date across 75px of card height - fold the same numbers in, or show five rows instead of three.

## What already works

- The scene layer as a concept, and the fact that all five palettes are genuinely distinct environments rather than hue tints - iron's anvil glow and champ's night city are different places, not different filters.
- The display face on H1s and stat numbers ("Start workout", "220 lbs × 10") gives the app a voice; body text stays neutral, which is the right split.
- Loading skeletons on History mirror the real row shape and are paired with a barbell mark - branded and calm (`history-loading-slow-dark-champ-desktop.png`).
- The login screen's pixel wordmark + crown is the most distinctive thing in the product (`login-dark-champ-desktop.png`).
- The Balance section's push:pull / quad:hamstring sliders with "pull-heavy / balanced / push-heavy" anchors are a genuinely elegant way to show a ratio.
- Stat tiles carry a hairline accent rule on top and a units-and-context sub-line - the pattern is right, it just needs the palette fix.
- No horizontal overflow anywhere at 390px (`scrollWidth === clientWidth`), and no console errors beyond the expected 401s when logged out.
- Analytics range chips, view tabs and card radii are consistent across the four analytics views.

## Bugs

- **Zero horizontal padding at phone width, all pages.** `main` computes `padding: 0px` at 390px; Profile's stat tiles are clipped by both viewport edges and the first "2 weeks" range chip is clipped on Analytics.
- **Analytics suggestion chips are clipped at the right edge on phone** with no fade, gradient, or scroll affordance - "Is my push and" just stops (`analytics-dark-champ-phone.png`).
- **Read-only session detail renders editable-looking form controls** (bordered Weight/Reps inputs, a "Name" input, "Notes (optional)") - a functional/semantic bug, not just a visual one.
- **Nav/page label mismatch:** the nav item reads "Library", the page H1 reads "Programs" (`library-dark-champ-desktop.png`).
- **Duplicate CTA pair on Library:** "Create block" + "Create workout" appear twice, ~230px apart, styled differently each time.
- **Copy flicker on History:** the subtitle reads "Every session you started or finished." during load, then swaps to "33 finished workouts so far." - two different strings for the same slot.
- **Date format inconsistency:** session detail shows `finished 9/8/2026, 7:17:00 PM` (raw locale, with seconds) where every other surface uses `Sep 8, 7:17 PM`.
- **Analytics loading skeleton doesn't match its content shape** - a 220px featureless block replaced by a ~400px chart, so the page jumps on every load.
- **Login password field is narrower than the email field above it** because the "Show" toggle sits outside the input; the two fields visibly don't align (`login-dark-champ-desktop.png`).
- **Data quality's lone 100% bar is unlabelled** - a floating accent bar at the card's right edge with no value or axis (`analytics-dark-champ-desktop-full.png`).
- **The scene's star/sparkle asset reads as pasted-on** in every palette - it sits at a fixed bottom-right position with hard edges over the artwork, and it is white/grey in champ, iron and crimson alike.
