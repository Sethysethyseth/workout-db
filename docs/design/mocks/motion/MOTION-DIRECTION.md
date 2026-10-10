# LogChamp motion + visuals direction (MX wave)

Author: the MX0 frontier seat (Fable, thinking-high), Oct 9, 2026.
Status: direction of record for the MX wave once Seth has clicked through the
previews and picked variants. Nothing in `client/` changes in MX0.

Previews (standalone HTML, open on a phone - each has a palette switcher,
light/dark toggle, a "Reduced" toggle that simulates `prefers-reduced-motion`,
and Replay/Reset):

| File | Surface | A/B choices inside |
| --- | --- | --- |
| `analytics-in-motion.html` | Analytics (REQUIRED) - KPI tiles, Muscles, Strength, Exercises, Execution, data quality, empty state | A Cascade vs B Scan (page-load choreography) |
| `pr-moment.html` | Logger set confirm + PR celebration + milestone takeover | A Crown stamp vs B Shockwave |
| `navigation-transitions.html` | App shell, bottom nav, page transitions, skeleton-to-content, list -> detail | A Shared axis vs B Depth |
| `session-flow.html` | Home -> start workout -> logger -> finish sheet -> Home acknowledges | A Go live then push vs B Card becomes the page |

Everything in the previews is zero-dependency: CSS transitions/keyframes, the
Web Animations API, requestAnimationFrame, SVG, and a tiny `<canvas>`. The
only external load is Google Fonts.

---

## 1. Motion language

### 1.1 Principles

1. **Analytics is the stage; logging is the floor.** Motion is loudest where
   a lifter is *reading* (charts drawing, numbers rolling, bars charging) and
   quietest where they are *entering* (the logger). On the floor nothing ever
   moves under a thumb: a tap's visual answer is <= 90 ms, and layout under
   the active input never shifts.
2. **Data draws itself.** Charts are never faded in as finished pictures. A
   line draws left to right, bars charge from zero, a number rolls from its
   previous value, a PR marker stamps *as the line reaches it*. The animation
   is the data telling its own story - this is the "stop and stare" moment
   and the product's wedge.
3. **Earned loudness.** A PR, a milestone, a finished workout earn fireworks.
   A set logged, a tab switched, a chip tapped earn a nudge. Loud moments are
   rare by construction, which is what keeps them loud.
4. **Pixel-native.** LogChamp's visual signature is already the pixel skyline
   scene and the notched (stepped) card corners. Motion inherits that: square
   particles, 11x8 pixel crowns that draw pixel by pixel, a thin scanline, a
   skyline that flickers. No glossy blur, no gradient confetti, no bouncing
   emoji.
5. **One motion vocabulary, app-wide.** The same reveal (rise 14 px + fade,
   `--mx-ease-out-expo`), the same count-up, the same sliding segmented
   indicator, the same skeleton -> content hand-off everywhere. The round-2
   critique's "assembled, not designed" verdict gets fixed in time as well as
   in space.
6. **Motion never costs an input.** Nothing blocks a tap, nothing waits for a
   `finished` promise before enabling a button, and every choreography can
   be interrupted (a new tap cancels the running one via a generation counter
   in the previews; the same idiom ships).
7. **Reduced motion is a first-class mode, not a kill switch.** The reduced
   version is designed, not just disabled: crossfades, final states printed,
   decorative loops off. See section 5.

### 1.2 Timing + easing tokens

Existing tokens stay and keep their jobs (hover/pressed/focus micro-states):

```css
--motion-fast: 120ms;  --motion-base: 180ms;  --motion-slow: 240ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

New tokens, added to `:root` in `client/src/index.css` (values exactly as
used in the previews):

```css
--mx-quick:   90ms;    /* tap acknowledgement - the logger ceiling          */
--mx-reveal:  420ms;   /* a card / row rising into place                    */
--mx-draw:    1000ms;  /* a chart line drawing, a bar charging              */
--mx-count:   1100ms;  /* a number rolling to its value                     */
--mx-stagger: 55ms;    /* step between siblings in a cascade                */
--mx-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);   /* reveals, slides     */
--mx-ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* pops, stamps, pins */
--mx-ease-draw:     cubic-bezier(0.65, 0, 0.35, 1);   /* line draw, charge  */
```

Rules of thumb: anything that *moves into place* uses out-expo (fast start,
long soft landing - it reads as confident, not floaty); anything that
*arrives* (check mark, crown, up-arrow, balance pin) uses the spring once,
with overshoot <= 1.15x; anything *continuous* (line draw, bar charge, count)
uses the draw curve so the eye can track it. Durations above 1.2 s do not
exist outside the milestone takeover.

### 1.3 Choreography rules

- **Cascade, don't dump.** Siblings enter top-to-bottom with `--mx-stagger`;
  a page is fully in within ~700 ms (first paint of content, not of
  skeletons, counts). Cap the stagger at 8 visible items; everything below
  the fold enters together.
- **Structure first, data second.** Cards/rows rise in; *then* their data
  animates (bars charge, lines draw, numbers roll) starting ~120 ms after the
  container lands. Container and content never animate simultaneously.
- **Skeletons reserve layout and hand off.** A skeleton has the exact
  geometry of the content it replaces; the swap is a 200 ms crossfade, then
  the content runs its data animation. No layout shift at hand-off.
- **Shared-axis for siblings, container transform for parent -> child.** Tabs,
  range chips and bottom-nav pages slide along the axis of their control
  (horizontal); drilling into an item (History row -> session detail, Home
  hero -> logger) is the item's own surface growing into the page.
- **Numbers roll with `tabular-nums` while rolling**, then drop back to the
  display font's proportional figures, so the layout never jitters.
- **Decorative loops are slow and few:** skyline window flicker (420 ms tick,
  a handful of windows), star twinkle, glow breathe (6 s), hero glint (6.5 s).
  Never more than one looping effect per card, and none inside the logger.
- **Exits are faster than entries** (roughly 0.6x) and travel the opposite
  direction, so the new thing gets the attention.

### 1.4 Loud vs quiet, and why

| Loud (earned) | Quiet (floor) |
| --- | --- |
| Analytics first load: title wipe, tiles roll, bars charge, lines draw, PR crowns stamp | Logger set confirm: number scales out, check springs in (90 ms), next set gets the ring, rest row expands |
| PR moment: crown stamp + pixel burst (A) or shockwave ring (B), banner with e1RM rolling | Tab / chip / nav switches: sliding indicator + shared-axis slide |
| Milestone (100 workouts): scrim takeover, pixel crown draws itself, number rolls | Skeleton -> content crossfade |
| Workout finished: sheet with four roll-ups, Home acknowledges (dot pings, counts roll, new row expands) | Hover/pressed/focus states (existing `--motion-fast`) |

Why: lifters open analytics to be *shown* something - that is where a
second of theatre pays back as comprehension and delight. Lifters open the
logger between heavy sets, often with chalk on their thumbs; anything that
delays the next tap or shifts the target is a cost. PR and milestone moments
are the emotional peaks of the product and rare, so the loudest effects live
there and nowhere else.

---

## 2. Per-surface plan

### 2.1 Analytics (REQUIRED) - `analytics-in-motion.html`

Two page-load choreographies to pick from:

- **A - Cascade (recommended).** Title wipes in with a clip-path, range chips
  rise, the four KPI tiles rise then roll their numbers while a top stripe
  charges across each tile, the view tabs rise, the active view's cards rise
  and run their data animations. Classic, readable, ~700 ms to settled
  structure.
- **B - Scan.** A thin accent scanline sweeps top-to-bottom once and content
  materialises just behind it (same primitives, timing keyed to the line's
  position). More "wicked", a touch more gimmicky; worth seeing on a phone.

Per view (all four previewed):

- **KPI tiles:** value rolls from 0 (or previous value on range change), the
  stripe charges, the up-arrow pops with the spring on gains.
- **Range chips (2/4/8/12 wk):** sliding indicator; changing range does not
  re-run the page cascade - tiles roll from their previous values and bars
  re-charge to the new values (relative change is the information).
- **Muscles:** nested effective/stimulating bars charge with a 55 ms stagger
  and a glowing bar head that fades once landed; tap a row to expand the
  contributing exercises (grid-rows 0fr -> 1fr). Balance pins spring to their
  ratio.
- **Strength:** featured sparklines draw (`stroke-dasharray`), then the area
  fades in, then the end dot pops with a ping, then the delta chip rises.
  Compact tail list below.
- **Exercises (hero e1RM chart):** gridlines charge, the line draws over
  `--mx-draw`, crown markers stamp as the line passes each PR, the headline
  value rolls alongside. "Other lifts" list rises after.
- **Execution:** RIR/RPE meters charge to their percentage with a target tick;
  percentages count up.
- **Data quality meter:** charges, label fades in.
- **Empty state:** breathing dashed ghost bars + a progress ring ("1 of 3
  workouts") that draws to its fraction. The ghost *is* the loading skeleton's
  cousin, so empty and loading share a visual family.
- **View tabs:** shared-axis slide (outgoing view exits opposite the travel
  direction, incoming enters along it), then the incoming view's data
  animation runs - so switching tabs is itself a small show, every time.

### 2.2 Navigation + app shell - `navigation-transitions.html`

- **Bottom nav:** indicator slides between items (WAAPI FLIP on `left`,
  spring) with a soft halo; the tapped icon pops 1.0 -> 1.18 -> 1.0. The
  active-item styling stays derived from `--color-interactive` as today.
- **Page transitions, two options:** **A - Shared axis** (slide 28/32 px along
  the nav order + fade; direction follows tab order) vs **B - Depth** (outgoing
  scales to 0.96 and fades, incoming from 1.04). A is the recommendation:
  it carries spatial meaning (left/right = nav order), B is prettier but
  meaningless.
- **First visit to a page:** skeleton (480 ms in the preview; in the app, as
  long as the fetch takes) -> crossfade -> body cascade. Revisits skip the
  skeleton and cascade immediately from cached data.
- **List -> detail (History row -> session detail):** container transform -
  the row's header FLIPs from its list rect to the page header, the list
  fades, the detail body cascades; back reverses it.
- **Masthead:** stays fixed; only the page below moves.

### 2.3 Home + the session arc - `session-flow.html`

- **Home:** notched hero with a slow glint sweep (6.5 s); the 7-day strip's
  dots spring in with stagger; KPI roll-ups; recent rows cascade.
- **Start, two options:** **A - Go live, then push (recommended):** the hero
  becomes `card--live` *first* - the L-bar literally draws itself, down then
  across, the live dot starts pulsing, the timer starts - then the logger
  pushes up over it. The lifter sees the one meaning of `card--live` being
  created. **B - Card becomes the page:** a notched expander grows from the
  hero's rect to fill the viewport while the logger fades in underneath. More
  cinematic; loses the "L-bar draws" beat.
- **Finish:** scrim + bottom sheet; a check pops; Duration / Sets / Volume /
  PRs roll up; per-exercise lines. **Done:** logger slides down, hero flashes
  "saved" and returns to idle, today's dot lights with a ping, Home counts
  roll to their new values, the new History row expands into the list. Home
  visibly *receives* the workout.

### 2.4 Logger (inside `session-flow.html` and `pr-moment.html`)

Quiet by design, and the ceiling is hard: the only thing that happens on the
tap itself is the set number scaling out and the check springing in (90 ms),
plus a 1-frame success flash of the row background. After that, off the
thumb's path: the next set's number gets the accent ring, the rest row
expands at the dock (grid-rows) with a depleting line, the "Next up" strip
updates. When an exercise's sets are complete, the exercise block exits
upward and the next exercise cascades in. `+ Add set` slides in a new row
with a scaleY ease. Inputs never animate and never move while focused.

### 2.5 PR + milestone moments - `pr-moment.html`

- **Quiet confirm** (no PR) is exactly the logger confirm above.
- **PR, two options:** **A - Crown stamp (recommended):** a crown stamps onto
  the set cell (scale 3.2 -> 1.15 spring), a pixel-square burst fires from it
  (canvas, ~40 squares, 700 ms), a short haptic, and a banner slides down
  from under the masthead with the e1RM rolling old -> new (+delta); it
  auto-dismisses. Contained, pixel-native, repeatable several times a
  session without fatigue. **B - Shockwave:** a ring expands from the set to
  the viewport edge, a radial accent flash, the card thumps, a notched "PR"
  tag pops on the row, a bottom toast. Bigger, but a 3-PR session would wear
  it out.
- **Milestone (e.g. 100 workouts):** full takeover - scrim, an 11x8 pixel crown
  draws itself pixel by pixel (14 ms/pixel), the number rolls, eyebrow +
  stats, a single "Keep going" button. Once per milestone, ever.

### 2.6 Empty + loading states (across previews)

Loading = skeletons with exact geometry + crossfade hand-off (analytics,
navigation). Empty = ghost shapes that *breathe* (opacity 0.55 <-> 0.9) plus
a progress ring toward the unlock threshold. Both use the same dashed/ghost
treatment so an empty chart and a loading chart are visibly relatives.

### 2.7 Block run page (not previewed - plan only)

Reuse, don't invent: the week strip uses Home's dot spring-in; the current
session card is the notched hero and goes `card--live` with the same L-bar
draw when started; completion of a week fills a progress ring (the empty
state's ring, same component). Week -> session uses the list -> detail
container transform. Nothing new is needed beyond what the previews already
show.

### 2.8 Scene layer (ambient)

The pixel skyline gets life: a handful of windows flicker on a 420 ms tick
(dark mode only, 2-4 windows per tick), stars twinkle, the glow breathes over
6 s. The preview draws its skyline procedurally from the live token colours
(so it recolours instantly on palette switch); the app keeps its authored
rasters and adds a thin overlay canvas for the flicker only.

---

## 3. Implementation approach per effect

All marked **zero-dep** ship with no new package. Candidate packages are
listed where a package would buy something real, with rough gzipped sizes
so the dependency gate has numbers.

| Effect | Technique | Dependency |
| --- | --- | --- |
| Reveal / cascade (rise + fade, stagger) | CSS `@keyframes` + a `--d` custom property per child; class toggle from React after mount | **zero-dep** |
| Title clip-path wipe | CSS keyframe on `clip-path: inset()` | **zero-dep** |
| Sliding segmented indicator (tabs, chips) | CSS `transition` on `left`/`width` set from measured rects (`getBoundingClientRect`) | **zero-dep** |
| Bottom-nav indicator + halo | WAAPI `el.animate()` FLIP between measured rects, spring easing | **zero-dep** |
| Page transitions (shared axis / depth) | WAAPI on outgoing + incoming route elements, keyed off react-router location; **View Transitions API** (`document.startViewTransition`) as a progressive enhancement where supported (Chrome/Edge/Safari 18+), WAAPI fallback elsewhere | **zero-dep** |
| Container transform (row -> detail, hero -> logger) | FLIP with WAAPI: measure first rect, render last, animate inverse transform; or View Transitions `view-transition-name` where supported | **zero-dep** |
| Skeleton -> content crossfade | CSS opacity transition; skeleton and content share a grid cell | **zero-dep** |
| Expand/collapse rows (rest row, exercise contributors, new History row) | CSS `grid-template-rows: 0fr -> 1fr` transition | **zero-dep** |
| Bar charge, meter charge | CSS `transform: scaleX()` transition with `transform-origin: left`, staggered via `--d` | **zero-dep** |
| Line draw (sparklines, hero chart) | SVG `stroke-dasharray`/`stroke-dashoffset` driven by rAF (so markers can stamp at the exact progress) or by a CSS transition when no markers | **zero-dep** |
| PR markers stamping as the line passes | rAF callback compares progress to each marker's x; marker gets the spring pop class | **zero-dep** |
| Number roll-up | rAF loop with out-expo easing, `font-variant-numeric: tabular-nums` while rolling | **zero-dep** |
| Check / crown / arrow pop | CSS keyframe with `--mx-ease-spring` | **zero-dep** |
| Pixel burst (PR) | `<canvas>` sized to the card, ~40 squares, rAF, 700 ms, cleared after | **zero-dep** |
| Shockwave ring + flash | Fixed-position element, WAAPI scale 0 -> viewport, radial `color-mix` flash | **zero-dep** |
| Pixel crown self-draw (milestone) | SVG `<rect>` grid, each rect `animation-delay`'d 14 ms apart | **zero-dep** |
| Skyline flicker / star twinkle / glow breathe | Small overlay `<canvas>` repainted on a 420 ms `setInterval` (not rAF - it is a tick, not motion); CSS keyframes for glow | **zero-dep** |
| Haptics | `navigator.vibrate` behind a feature check (Android only; silent no-op elsewhere) | **zero-dep** |
| Charts in general | Keep the existing hand-rolled SVG components; add the draw/stamp behaviour to them | **zero-dep** |

Packages considered and NOT recommended for the wave (listed so the trade
is visible):

- **Motion (framer-motion) ~ 18 kB gz (`motion` mini ~ 5 kB):** nicer React
  ergonomics for layout animations and `AnimatePresence`. Our needs are
  covered by WAAPI + FLIP; the API lock-in is not worth 18 kB. Revisit only
  if the container transforms get hairy in React 19 concurrent rendering.
- **GSAP ~ 23 kB gz core (+ ~ 7 kB for DrawSVG/MotionPath plugins):** best
  timeline tooling in the business; overkill for choreographies of <= 8
  steps that `setTimeout`/`later()` sequencing handles fine.
- **Lottie (lottie-web) ~ 60 kB gz:** only if Seth wants designed vector
  animations (e.g. an animated crown mark). Not needed for anything above.
- **canvas-confetti ~ 3 kB gz:** does round confetti; our pixel burst is 40
  lines and matches the aesthetic. No.
- **Charting libraries (recharts ~ 45 kB gz, visx ~ varies):** the app already
  owns its SVG charts; a library would fight the draw/stamp choreography.

React-specific notes: reveals attach via a `useReveal(ref)` hook that toggles
`is-in` after data arrives; count-ups via a `useCountUp(value)` hook that
rolls from the previous rendered value; both read `prefers-reduced-motion`
through one `useReducedMotion()` hook so the reduced branch is a single
switch. The page-transition layer wraps `<Outlet>` and uses
`useLocation()` + a nav-order table for direction.

---

## 4. Performance plan (mid-range phone)

- **Compositor-only properties.** Every moving thing animates `transform`
  and/or `opacity`. Bars charge with `scaleX`, slides are `translate`, pops
  are `scale`. The two exceptions are deliberate and bounded:
  `grid-template-rows` (expands - one element at a time, <= 420 ms) and
  `clip-path`/`stroke-dashoffset` (SVG draws - one chart at a time, and
  these are cheap on small paths).
- **No layout thrash in loops.** rAF loops (count-up, line draw, burst) read
  nothing from layout each frame; they write a text node, a `dashoffset`, or
  canvas pixels. Rects for FLIP are measured once, before the animation.
- **Cancel, don't stack.** A generation counter (`gen++`) on every
  choreography start; stale rAF loops and timers check it and exit. A tab
  flurry never queues ten cascades.
- **Low-res canvases.** The skyline/burst canvases draw at device-pixel
  scale /2 with `image-rendering: pixelated` - it is the aesthetic *and* a
  4x fill-rate saving. Overlay canvases are `pointer-events: none` and sit
  in their own layer.
- **Budget per surface:** structure settled <= 700 ms; data animations <= 1.1
  s; at most one `box-shadow`/`filter` animation on screen at a time (the
  saved flash, the glowing bar head) and never on more than one element.
- **`will-change` only for the duration** of a FLIP, set in the WAAPI call's
  element then removed on finish; never left on static cards.
- **Reduced effort when the tab is hidden**: `document.hidden` pauses the
  skyline tick; rAF already pauses.
- **Logger guarantee:** the tap-to-visual path is a class toggle driving one
  90 ms CSS transition - no JS animation runs on the tap itself; everything
  else is scheduled after.
- **Measure:** Chrome DevTools performance panel with 4x CPU throttle on the
  analytics first load; target no long task > 50 ms after first paint and a
  steady 60 fps during the cascade. Add this to the MX wave's smoke list.

---

## 5. Reduced-motion plan

Honored two ways in every preview and to ship the same way in the app:
`@media (prefers-reduced-motion: reduce)` in CSS, plus an `html.mx-reduce`
class (set from the media query, and by the previews' "Reduced" toggle) that
JS checks (`RM()`) before scheduling any choreography. The reduced version is
*designed*, per effect:

| Effect | Full | Reduced |
| --- | --- | --- |
| Reveal / cascade | rise 14 px + fade, staggered | 200 ms opacity fade, no translate, no stagger |
| Title wipe | clip-path wipe | fade |
| Page transitions | slide / scale + fade | 200 ms crossfade |
| Container transforms | FLIP grow | crossfade; detail appears in place |
| Bars, meters | charge from 0 | render at final width |
| Line draw | draws left to right | line and markers appear complete |
| Number roll-up | rolls over 1.1 s | prints the final value |
| Sliding indicators | slide | jump (transition none) |
| Expand / collapse | grid-rows transition | instant (transition none) |
| Pops (check, crown, arrow) | spring overshoot | fade in at final scale |
| PR crown stamp + pixel burst | stamp + 40-square burst + haptic | crown fades in, **no burst**, haptic still fires (it is not motion) |
| Shockwave ring + flash | ring to viewport edge + flash | **no ring, no flash**; the PR tag and toast fade in |
| Milestone crown self-draw | pixel-by-pixel | crown appears complete; number prints |
| Skyline flicker, star twinkle, glow breathe, hero glint, live-dot pulse | looping | **off** (static scene, static dot) |
| Rest-timer depleting line | depletes continuously | still depletes - it is a progress indicator (information), not decoration; the row's expand is instant |
| Skeleton -> content | crossfade | crossfade (unchanged - it is already minimal) |

Nothing is *removed* from the reduced experience: every piece of information
that motion conveys (a PR happened, a value changed, a row expanded) is still
present as a final state or a fade.

---

## 6. Proposed wave breakdown (ordered build units)

1. **MX1 - Motion tokens + primitives:** add the `--mx-*` tokens to
   `index.css`; ship `useReducedMotion`, `useReveal` (cascade with `--d`),
   `useCountUp`, a `SlidingIndicator` for segmented controls, and the
   skeleton/ghost base styles. Unit-tested hooks; no surface changes yet.
2. **MX2 - Analytics first-load choreography (variant per Seth's pick):**
   title wipe, range chips indicator, KPI tiles roll + stripe + arrow, view
   tabs shared-axis switch, cascade of cards. Skeleton hand-off on fetch.
3. **MX3 - Analytics data draws:** Muscles bars charge + glowing head +
   contributor expand, Balance pins; Strength sparklines draw -> area -> dot
   -> delta; Exercises hero chart draw with PR crown stamps; Execution
   meters; data-quality meter.
4. **MX4 - Analytics empty + range changes:** breathing ghost + progress
   ring empty state; range change rolls from previous values instead of
   re-cascading.
5. **MX5 - App shell transitions (variant per Seth's pick):** bottom-nav
   indicator FLIP + icon pop; route transition layer around `<Outlet>` with
   View Transitions progressive enhancement; per-page skeleton -> cascade on
   first visit.
6. **MX6 - List -> detail container transform:** History row -> session
   detail (and back); reuse for block week -> session.
7. **MX7 - Logger quiet confirm + rest dock:** 90 ms confirm, next-set ring,
   rest row expand with depleting line, exercise block exit -> next cascades
   in, `+ Add set` slide-in. Input-stability guard tested.
8. **MX8 - PR moment (variant per Seth's pick) + milestone takeover:** crown
   stamp + pixel burst (or shockwave), e1RM banner; pixel-crown milestone
   sheet, triggered once per milestone.
9. **MX9 - Home + session arc:** hero glint, week-strip spring-in, Home
   roll-ups; start variant (go-live L-bar draw then push, or card-becomes-
   page); finish sheet roll-ups; Home acknowledges on Done.
10. **MX10 - Ambient scene life:** skyline window flicker + star twinkle
    overlay canvas, glow breathe; paused when hidden; off under reduce.
11. **MX11 - Block run page adoption:** apply the shipped primitives (dot
    spring-in, live L-bar, progress ring, container transform) - no new
    effects.
12. **MX12 - Performance + reduced-motion audit:** 4x-throttle traces on
    analytics first load and the logger; reduced-mode walkthrough of every
    surface; fix list. Gate fuel for pre-main.

Sequencing notes: 1 is a hard prerequisite for everything; 2-4 are the
headline and go first after it; 5-6 are disjoint from 2-4 in files (shell vs
analytics) and can run in a parallel lane; 7-8 touch the logger and should be
serialised with each other; 9 depends on 7 (shares the logger) and 5 (page
transitions); 10-12 are tail units.
