# MX critic, round 1 - FINDINGS (preserved from `.playwright-mcp/mx-critic/round-1.md`)

> Seat triage (Oct 9, Opus seat). Scores: wave 7/10, look and feel app-wide 6/10
> (QOL round 2 was 5/10). 35 screenshots in `.playwright-mcp/mx-critic/round-1/`
> (gitignored, local only). Scope: MX1-4 Analytics + MX5-6 shell, local app on
> staging data, demo.critic. Fix round: MXF1 (to author). Seth's call pending on
> #6 (route speed - the critic measured against the OLD 150-250ms restraint rule,
> which Seth replaced Oct 9) and #5 (replay on every visit).

---

## Overall score: 7/10 (wave) / 6/10 (look and feel, app-wide)

SCORE (wave): 7/10
SCORE (look and feel, app-wide): 6/10 (was 5/10)

Wave: Analytics in motion is the best thing this app has shipped. The cascade, the charging bars, the sparkline draw and the one sliding pill feel deliberate, the gains color stays off the accent in crimson, and reduced motion is handled properly everywhere I checked. Two things keep it from 8. The History container transform is visibly broken: the header flies with no surface over content that has already rendered, so text lands on text. And "one skeleton language" is only half true: two pages add a second loader under the skeleton, and two skeletons hold the wrong height.

App-wide: Analytics and the desktop shell moved up a real step (17px card titles, full-name exercise rows, matching nav on desktop and phone, skeletons where there used to be blank scene). Library, History rows, the session summary and the copy did not change. So the app still speaks two visual languages and still has several "selected" styles outside Analytics.

Setup: 390x844 dark champ unless named. I was already logged in. I changed no data. Theme, palette and the analytics range are back to dark / champ / 12 weeks. To see skeletons I held API calls for 3s with a Playwright route; with no delay the local API answers too fast for them to show. Boot time (splash, Vite module load) is dev-mode, and I did not score it.

---

## Screens

| screen | viewport/theme | score | one-line verdict |
|---|---|---|---|
| Analytics, Muscles | 390 dark champ | 8 | The best screen in the app. Bars charge with a glowing head, numbers right-aligned, calm 17px title (`p-analytics-overview-champ-dark.png`, `p-analytics-muscles-full-champ-dark.png`) |
| Analytics, Strength | 390 dark champ | 7 | Line draws and the dot pops nicely. The subtitle has em dashes, and the meta line says "top set" twice and wraps differently on every row (`p-analytics-strength-rows-champ-dark.png`) |
| Analytics, Exercises | 390 dark champ | 7 | The name + hero number + delta fix landed and full names now show. The meta still wraps to 2 lines with "best / e1RM" split, and still says "last 31d ago" (`p-analytics-exercises-rows-champ-dark.png`) |
| Analytics, Execution | 390 dark champ | 7 | The meters read well and amber "overreaching" is good. The "→" arrow and the dense meta remain (`p-analytics-execution-champ-dark.png`) |
| Analytics, empty (2 weeks, Strength) | 390 dark champ | 6 | The breathing ghost is calm and nice. The copy contradicts the KPI above it (`p-analytics-strength-2wk-empty-ghost.png`) |
| Analytics | 390 dark crimson | 6 | Gains stay green, which is correct. But rising trend lines and the main bars are drawn in red, so progress reads as alarm (`p-analytics-strength-crimson-dark.png`, `p-analytics-crimson-dark-loaded.png`) |
| Analytics | 390 dark forest | 7 | Looks good. The "up" mint is nearly the accent green, so gains do not stand apart (`p-analytics-forest-dark.png`) |
| Analytics | 390 light champ | 8 | Clean, with good contrast. The tile top-edge charge line works in light (`p-analytics-champ-light.png`) |
| Home | 390 dark champ | 6 | Unchanged apart from the nav. The block card uses caps next to the rounded heading face (`p-home-champ-dark.png`) |
| Home | 390 light champ | 6 | Same as dark (`p-home-champ-light.png`) |
| History | 390 dark champ | 6 | Date tiles are still the best list design here. "sets" still orphans onto line 2, and number formats are mixed (14.8k lbs vs 5780 lbs) (`p-history-champ-dark.png`) |
| Session detail | 390 dark champ | 5 | Summary grid still has an empty 6th cell. A big "Not tracked - add?" pill crushes "Feet-Up Bench Press" onto 3 lines (`p-session-detail-champ-dark.png`) |
| History -> detail transform | 390 dark champ | 3 | Header text slides over the stats grid and exercise cards; its slot at the top is empty (`p-container-transform-20ms.png`, `p-container-transform-60ms.png`) |
| Library | 390 dark champ | 5 | Unchanged: condensed caps, solid white selected chips, "PARKED" (`p-library-champ-dark.png`) |
| Profile | 390 dark champ | 6 | Fine and calm. The "SETTINGS" eyebrow sits in an odd dark box (`p-profile-champ-dark.png`) |
| Loading: Analytics | 390 dark champ | 7 | Calm skeleton that reads as "a chart is coming". It leaves out the view-tab row, so the page shifts about 70px on load (`p-skeleton-analytics.png`) |
| Loading: Library / History | 390 dark champ | 5 | Skeleton plus a barbell "Loading…" caption at the same time: two loaders (`p-skeleton-library.png`, `p-skeleton-history.png`) |
| Loading: Home | 390 dark champ | 5 | Last 7 days skeleton is 382px for a card that loads at 90px, so the page jumps 290px (`p-skeleton-home.png`) |
| Bottom tab bar | 390 dark champ | 8 | The sliding bar and halo are tidy, and the tapped icon pop is small and quick (`p-bottom-nav-history-active.png`) |
| Desktop Home | 1366 dark champ | 6 | Top bar now reads Home / Analytics / History / Library / Profile with the pill. The wordmark still sits off the content column (`d-home-champ-dark.png`) |
| Desktop Analytics | 1366 dark champ | 7 | Wide and legible. The view tabs stretch to 235px pills, which is a lot of chrome (`d-analytics-champ-dark.png`) |
| Desktop History | 1366 dark champ | 7 | Still the most professional screen. "16 workouts" sits on the bright skyline band (`d-history-champ-dark.png`) |
| Desktop Profile | 1366 dark champ | 6 | Profile now has an active state, which is fixed. The masthead shifts sideways compared with scrolling pages (`d-profile-champ-dark.png`) |

---

## Motion, measured (browser_evaluate on getAnimations)

- **Route transitions:** a View Transition on `mx-page`. The page slides 28px with a fade over 420ms, in bottom-tab order (forward = in from the right, back = in from the left). The masthead and bottom nav have their own transition names, so they stay put. Distance is subtle and direction is correct. Duration is about 1.7x the project's own 150-250ms guidance.
- **Bottom nav:** the indicator slides in 380ms on `cubic-bezier(0.34, 1.56, 0.64, 1)`, a spring with about 10% overshoot. The icon pop is 420ms on the same spring. It is quick enough that the overshoot reads as lively, not bouncy.
- **Analytics cascade:**
  - Cards rise 14px over 420ms, staggered 55ms.
  - KPI tile charge lines take 1100ms, and the "+47 lbs" pop lands at 885ms.
  - Muscles bars charge over 1000ms with a 1500ms glowing head, staggered 55ms.
  - Strength: the line wipes in over 1000ms, the end dot pops at 1060ms, and deltas rise from 1220ms. The last animation ends at 1805ms, with the stagger capped so 16 rows do not run long.
  - The empty-state ghost breathes on a 3s loop, opacity 0.55 to 0.9.
  - This is "loud where you read" done right on a first visit.
- **Analytics on return:** data is fetched again on every visit, so each return replays skeleton -> full 1.8s choreography. On the third visit in a session this stops being delightful.
- **History -> session detail (FLIP, WAAPI):**
  - The route does a plain 420ms crossfade to a plain-text "Loading workout…".
  - The header FLIP starts about 465ms after the tap, once the fetch lands: 460ms, `cubic-bezier(0.16, 1, 0.3, 1)`, starting from `scale(0.995, 0.588)`. That non-uniform scale squashes the header text to 59% height.
  - Tap to settled is about 925ms.
  - Back slides right for 420ms, and the row shrink then fires at about 478ms. That is two motions in a row.
- **Reduced motion (emulated): pass.** The VT becomes a 160ms crossfade, the cascade becomes 200ms fades, the FLIP is skipped, bars and lines do not charge, and the sliding indicator has no transition. Skeleton shimmer and the hero glint only run under no-preference.
- **KPI roll-up:** `font-variant-numeric` is `normal` on `.stat-tile-value`, so digits can change width while they roll.

---

## Top 10 fixes, ranked by impact

1. **History -> session detail: the container transform has no container, so the header text flies over the rendered page.** Screenshots: `p-container-transform-20ms.png`, `p-container-transform-60ms.png`.
   - At 20ms "Workout summary" sits on top of "Barbell Deadlift". At 60ms it sits on top of the Duration/Exercises/Sets grid. The header's own slot at the top of the page is empty.
   - The FLIP uses a non-uniform scale (0.995 x 0.588), so the text is squashed as well.
   - Fix:
     - Animate a surface, not the header. Clone the row card as a fixed overlay with `background: var(--color-surface-1)`, the card radius and border. Grow it from the row rect to the header rect using `clip-path: inset()` or a width/height-free scale on the surface only, then cross-fade the real header in.
     - Hold the rest of the page at `opacity: 0` until the surface is about 60% of the way there, then fade it in over 150ms.
     - Never scale text non-uniformly. Counter-scale the header contents or fade them.
2. **The transform waits for the fetch, so it starts about 465ms after the tap, and Back is slide-then-shrink.** Screenshot: `p-history-champ-dark.png` (no still possible; timings in "Motion, measured").
   - Forward is a crossfade to "Loading workout…" and then the grow. Back is a 420ms slide and then a separate row shrink at 478ms.
   - Fix:
     - Start the grow on tap, using the row's own data (name, date, top set, volume) to draw the header at once while the sets load below in a skeleton.
     - On Back with a pending FLIP, skip the shared-axis slide (use the same plain fade forward uses) and run the shrink inside that fade.
     - Target 300-350ms tap to settled.
3. **"One skeleton language" is not one yet.** Screenshots: `p-skeleton-library.png`, `p-skeleton-history.png`.
   - Library and History show the skeleton plus a barbell "Loading…" caption (`.skeleton__caption`) floating on the scene under it, which is two loaders at once.
   - Analytics and Home show the skeleton only. Session detail shows plain "Loading workout…" text and no skeleton at all.
   - Fix:
     - Remove `.skeleton__caption`, or show it only after 2.5s as a "still loading" reassurance.
     - Give session detail a skeleton: back chip, title bar, a 3x2 stats grid, and two exercise cards.
4. **Skeletons hold the wrong height, so the page jumps on load.** Screenshots: `p-skeleton-home.png`, `p-skeleton-analytics.png`.
   - Home's Last 7 days skeleton is 382px (four KPI ghosts). For this account the loaded card is 90px ("No workouts yet in the last 7 days"), so Recent workouts jumps up 290px.
   - The Analytics skeleton leaves out the Muscles/Strength/Exercises/Execution tab row, so the chart card drops about 70px on load.
   - Fix:
     - Remember the last rendered mode of the weekly card (compact vs full) in sessionStorage and draw that skeleton.
     - Add a 52px tab-row ghost to the Analytics skeleton.
5. **Analytics replays the whole show on every visit.** Screenshot: `p-analytics-overview-champ-dark.png`.
   - Each return fetches again, shows the skeleton, then runs the full 1.8s cascade (charges, rolls, pops). That is wicked the first time and overbearing by the third, which is Seth's own line.
   - Fix:
     - Cache the analytics response per range for the session (stale-while-revalidate).
     - Run the full choreography only on the first view per session and on a range change. A return visit renders at once with a single 200ms fade, and values that changed get a small pop.
6. **Route motion is slower than the project's own motion budget.** Screenshot: `p-analytics-strength-champ-dark.png` (timings in "Motion, measured").
   - Page slides run 420ms and the FLIP runs 460ms. The agreed restraint is about 150-250ms ease-out, and 420ms on every tab tap reads slightly syrupy on a phone.
   - Fix: route VT at 260ms with `cubic-bezier(0.2, 0, 0, 1)` (keep the 28px distance), and the FLIP at 320ms. Keep the 380ms spring on the nav indicator; it is the one place a little bounce earns its keep.
7. **Desktop masthead jumps sideways between pages, and the wordmark is still off the column.** Screenshots: `d-home-champ-dark.png`, `d-analytics-champ-dark.png`, `d-profile-champ-dark.png`.
   - Wordmark x is 195 on Home/Profile (no scrollbar) and 186 on Analytics/History (scrollbar). The nav's right edge moves from 1161 to 1154 to 1173.
   - Content starts at 202-210, so the wordmark sits about 16px left of it. During a route transition the "fixed" masthead visibly shifts.
   - Fix: `html { scrollbar-gutter: stable; }`, and give the masthead inner the same `max-width` and side padding as `.container.main` so the wordmark lines up with the page title.
8. **Crimson draws progress in red, and forest's "up" barely differs from the accent.** Screenshots: `p-analytics-strength-crimson-dark.png`, `p-analytics-crimson-dark-loaded.png`, `p-analytics-forest-dark.png`.
   - In crimson, every rising strength line and every Muscles stimulating bar is the red accent (#f87171), so a lifter's gains read as warnings.
   - The end dot uses a different green (#22c55e) from the delta text (#86efac).
   - In forest, the up mint sits next to a #4ade80 accent and does not stand apart.
   - Fix:
     - Draw the sparkline line in a neutral (`color-mix(in srgb, var(--color-text) 55%, transparent)`) and let only the end dot and the delta carry `--color-up`.
     - Use one `--color-up` token for dot and text.
     - Give forest a hue-shifted up color (teal or lime) so it differs by hue, not only by lightness.
9. **Session summary (the transform's landing screen) is cramped and noisy.** Screenshot: `p-session-detail-champ-dark.png`.
   - The dashed "Not tracked - add?" pill is wider than the "Tracked" pill and pushes "Feet-Up Bench Press" onto 3 lines.
   - The 2x3 summary grid still has an empty 6th cell, and every exercise still carries a green "Tracked" pill.
   - Fix:
     - Drop the Tracked pill (tracked is the default).
     - Show untracked as a quiet text link under the name ("Track this exercise").
     - Lay the stats out as 3 + 2 with the second row spanning, or add a sixth real stat (top set).
10. **Analytics copy and spacing leftovers that undercut the polish.** Screenshots: `p-analytics-strength-rows-champ-dark.png`, `p-analytics-muscles-full-champ-dark.png`, `p-analytics-strength-2wk-empty-ghost.png`.
    - Copy:
      - The Strength subtitle has two em dashes.
      - Row meta reads "top set +35 lbs · top set 220 × 10" (the label twice) and wraps at a different point on every row.
      - The 2-week empty state says "Log sets with weight and this becomes your strength trend" while the TOP SET tile above shows 55 lbs × 5 in the same range.
      - "2 set(s)", "last 31d ago" and "the exercise catalog files every shoulder exercise" are still there.
    - Spacing: the Balance title sits at x 43, while every other card title is at 29-31 (double padding on `.analytics-card-head` inside a padded card).
    - Fix:
      - Row meta as two fixed lines: "Top set 220 × 10, up 35 lbs" and "Matched effort up 47 lbs at 3 RIR, 8 sessions".
      - Empty copy: "Two sessions of the same lift unlock its trend."
      - Remove the inner padding on the Balance head.
      - Run rule 3 (plain copy, no em dashes, no "(s)") over the Analytics strings.

---

## What already works (do not regress)

- **The Analytics choreography itself.** Rise, charge, the glowing bar head, line wipe and end-dot pop are ordered so the eye follows the data, and the stagger cap stops long lists from dragging.
- **The one sliding selected pill** on range chips, view tabs and chart/table. In Analytics, "selected" now finally has one look.
- **Gains in the up color, not the accent.** Correct in crimson, where it matters most.
- **Reduced motion.** Thorough and correct: crossfades, no charges, no FLIP, no shimmer.
- **The bottom tab bar.** One bar, a soft halo, a quick icon pop. Restrained.
- **Desktop nav parity.** Same names and order as the phone, with Profile active.
- **17px card titles.** They no longer fight the page title.
- **Exercises rows** show the full name with one hero number.
- **The breathing empty ghost.** Calm, low contrast, explains its shape.
- **The Analytics skeleton silhouette.** The bar-chart ghost reads as "a chart is coming", not as a blank card.
- **Library tab counts** load as ghost pills instead of "0".
- **Still good from before:** History date tiles and the desktop History columns, the notched Start a workout hero, and the scene art.

## Bugs

- **History -> detail FLIP overlaps text** and leaves the header slot empty mid-flight (fix #1).
- **Boot splash shows two wordmarks at once.** A thin top bar with a 13px "LogChamp" pressed against the left edge (x about 2px, no gutter) sits above the pixel "LOGCHAMP" splash (`p-loading-library-t1600.png`; the blank-scene moment before it is `p-loading-library-t700.png`). Hide the masthead until auth resolves, or give it the normal gutter.
- **Desktop masthead shifts 7-19px** between scrolling and non-scrolling pages (fix #7).
- **Desktop History:** the "AUGUST 2026 / 16 workouts" header sits on the bright skyline band, so the text crosses lit windows (`d-history-champ-dark.png`).
- **Wrong empty-state copy** on Strength at 2 weeks while a weighted top set exists (fix #10).
- **Console:** no errors, only the React DevTools info line and the API base URL log.

## What improved since QOL round 2 Part B, and what did not

- **Improved:**
  - #5 hierarchy: card titles 28 -> 17px, and Exercises rows are name + hero number.
  - #6 loading: skeletons on all five named pages, and ghost tab counts.
  - #8 desktop shell: nav names and order match, and Profile is active.
  - #2 selection: unified inside Analytics only.
- **Not improved:**
  - #1 two visual languages (Library, block card and block names are still condensed caps; `p-library-champ-dark.png`).
  - #2 outside Analytics (Library "Yours"/"BLOCKS" are still solid white).
  - #4 text on scene (desktop History month header).
  - #5 History "sets" orphan, the empty summary cell and the Tracked pills.
  - #7 copy ("→", middle dots, "last 31d ago", "2 set(s)", "PARKED", mixed 14.8k vs 5780 lbs, em dashes in the Strength subtitle and the one-time session line).
  - #8 the wordmark is still about 16px off the column.
