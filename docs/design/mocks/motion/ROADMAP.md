# MX wave roadmap - motion + visuals for LogChamp

**Last checkpoint:** MXC1 DONE (Oct 10, 2026), after MXF2. Seth's smoke round 1 is fixed: Finish above the nav, rest on leaving the set, crimson rose charts, Strength draws; the coach keeps working when you leave (a working/answered bar), coach history lives on History. Next code unit: MX7 (logger floor - also owns the first-set focus drop found in the MXF2 audit) - or MX5b / MX10 if Seth picks scenes first. IDEAS 16 (fling-away bars) is HELD for Seth after the wave. MX1-MX6, MX-S, MXF1 and MXF2 stay DONE.

This file is the wave's state. It stands on its own next to
`MOTION-DIRECTION.md` (the design) and needs no chat history. Whoever picks
up next: read "Last checkpoint" above, find the first unit that is not DONE,
read its "pick up here" note if PARTIAL, and continue. After every step that
leaves the app building, update the unit's status and the checkpoint line.

Conventions for every unit below:

- **Variant** is the chosen A/B from the MX0 previews. Seth said he will go
  with the designer's recommendations, so these are fixed unless he says
  otherwise: Analytics = **A Cascade**; shell = **A Shared axis**; PR =
  **A Crown stamp**; start workout = **A Go live, then push**.
- **Guardrails that apply to every unit:** zero new dependencies (CSS, Web
  Animations API, View Transitions API, SVG, canvas only); tokens-only (every
  colour through `client/src/index.css` custom properties, all 5 palettes x
  light/dark); `card--live` keeps its one meaning; nothing a page does today
  goes missing (every metric, its insufficient-data warning, the
  how-is-this-calculated buttons, the chart/table toggle); a complete calm
  `prefers-reduced-motion: reduce` version; phone first at 390px, no
  horizontal scroll; animate transform/opacity; `#root` is `z-index: 1` over
  the fixed `body::before` scene - check anything portalled outside it.
- **Status:** TODO | IN PROGRESS | DONE | PARTIAL. PARTIAL always carries a
  "pick up here" note.
- The client has no test runner (adding one is a package, Seth's call - see
  IDEAS.md). Hooks stay small with their pure logic in plain exported
  functions so they can be tested the day a runner exists.
- Previews referenced: `docs/design/mocks/motion/*.html`.

---

## MX1 - Motion tokens + primitives

- **Goal:** one motion vocabulary the whole app can import: tokens, hooks,
  and the shared `SlidingIndicator` / cascade / count-up primitives.
- **Surface:** none visible on its own (Analytics adopts it in MX2-MX4).
- **Variant:** n/a.
- **Files:** `client/src/index.css` (the `--mx-*` tokens in `:root`, the
  `.mx-*` reveal/cascade keyframes, skeleton/ghost base styles);
  `client/src/lib/useReducedMotion.js`, `client/src/lib/useCountUp.js`,
  `client/src/lib/motionFormat.js` (pure helpers: easing, number splitting);
  `client/src/components/motion/SlidingIndicator.jsx`,
  `client/src/components/motion/CountUp.jsx`,
  `client/src/components/motion/Cascade.jsx`,
  `client/src/components/motion/motion.css`.
- **Done when:** the tokens from MOTION-DIRECTION.md section 1.2 exist in
  `:root` with those exact values (`--mx-quick 90ms`, `--mx-reveal 420ms`,
  `--mx-draw 1000ms`, `--mx-count 1100ms`, `--mx-stagger 55ms`,
  `--mx-ease-out-expo`, `--mx-ease-spring`, `--mx-ease-draw`); the three
  components render with no console errors; `useCountUp` returns the target
  immediately under reduced motion and otherwise rolls from the previously
  displayed value with `tabular-nums` while rolling; `SlidingIndicator`
  measures the active button and transitions `transform`/`width`, jumping
  (no transition) under reduced motion and on first paint;
  `npm run build` passes.
- **Depends on:** nothing. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Note: `Cascade` is pure CSS (`.mx-cascade`
  nth-child stagger, capped at 8) - no per-child JS; `useCountUp` rolls
  from the last displayed value; `SlidingIndicator` snaps on first paint.

## MX2 - Analytics first-load choreography (Cascade A)

- **Goal:** the Analytics page loads the way `analytics-in-motion.html`
  (variant A) does: skeleton at once that reserves layout, then title wipe,
  range chips with a sliding selected indicator, KPI tiles rising then
  rolling their numbers with a top stripe charging, view tabs with a sliding
  indicator, cards cascading in; switching a view tab is a shared-axis slide
  of the incoming view (direction follows tab order) followed by that view's
  data animation.
- **Surface:** Analytics (`/analytics`), all four views' chrome.
- **Variant:** A Cascade.
- **Files:** `client/src/pages/AnalyticsPage.jsx`,
  `client/src/components/analytics/StatTiles.jsx`,
  `client/src/components/analytics/AnalyticsViewTabs.jsx`,
  `client/src/components/analytics/ChartTableToggle.jsx`,
  `client/src/styles/analytics-motion.css` (new, imported by the page),
  `client/src/index.css` (analytics rules only).
- **Done when:** on a cold load the skeleton appears immediately (no 400 ms
  blank), content replaces it with a crossfade and cascades top-to-bottom
  within ~700 ms; the four KPI numbers roll (Sets/week, Stimulating/week,
  Top set weight, Top gain); the range chips and view tabs each have ONE
  moving selected indicator (the "selected" look is the indicator -
  `--color-nav-active-bg` + accent ring - not a per-button tint); a view
  switch slides the new view in along the tab order; under reduced motion
  everything is a 200 ms fade and numbers print; `npm run build` passes;
  no horizontal scroll at 390.
- **Depends on:** MX1. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Notes: the skeleton is `LoadingState
  delayed={false}` (the prop existed; no change to the component); the
  view switch is incoming-only (the new view slides in along the tab order
  via `Cascade key={view} axis=...`, the old one unmounts instantly - a
  real exit/enter pair is MX5's View Transitions work); the old `rise-in`
  Analytics stagger in index.css was removed because it fought the
  cascade's `animation` shorthand on the same elements.

## MX3 - Analytics data draws

- **Goal:** the data animates after its container lands: Muscles nested bars
  charge with stagger and a glowing bar head; Balance pins spring to their
  ratio; Strength sparklines draw left-to-right, then the area fades in, the
  end dot pops, then the delta chip rises; Execution meters and the
  data-quality meter charge to their value; the Exercises e1RM sparkline
  draws; rep-target bars charge.
- **Surface:** Analytics - Muscles, Strength, Exercises, Execution views.
- **Variant:** n/a (A's data layer).
- **Files:** `client/src/components/analytics/MuscleVolumeChart.jsx`,
  `BalanceScale.jsx`, `StrengthTrendChart.jsx`, `Meter.jsx`,
  `ExercisesView.jsx`, `client/src/styles/analytics-motion.css`,
  `client/src/index.css` (analytics rules).
- **Done when:** each of the draws above runs on mount and on view switch
  (not on hover/scroll); bars/meters animate `transform: scaleX` from 0 over
  `--mx-draw` with `--mx-ease-draw`, staggered by `--mx-stagger` and capped
  at 8 staggers; sparklines use `pathLength` + `stroke-dashoffset` (zero JS);
  reduced motion renders every mark at its final state; every value label
  and the Table view stay exactly as before; build passes.
- **Depends on:** MX1, MX2. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Deviation: sparklines draw with a
  `clip-path: inset()` wipe instead of `pathLength` + `stroke-dashoffset` -
  the sparkline paths use `vector-effect: non-scaling-stroke` and the
  dasharray route is unreliable there; the wipe is zero-JS and reads the
  same. The end dot "pops" by animating `stroke-width` (it is a zero-length
  round-cap path). Compact sparklines (Exercises roster) only wipe - no dot
  pop. All draws are gated to the bars/meters/sparklines that exist today;
  `Meter.jsx` needed no edit (the CSS targets its `.meter-fill`).

## MX4 - Analytics empty states, range changes, critic fixes inside Analytics

- **Goal:** (a) empty-state ghosts breathe and the unlock copy reads as "not
  yet"; (b) a range change rolls KPI values from their previous values and
  re-charges bars to the new values instead of re-running the page cascade;
  (c) the critic's Analytics-specific fixes: card titles one step below the
  page title (17px/700 body face; eyebrows 11px caps), Exercises rows become
  name + one hero number (top set) + delta with the rest on demand in the
  detail panel (also fixes the orphaned "Best e1RM" and the truncated names),
  no "->" arrows in Analytics links, chart meaning tokens `--chart-up` /
  `--chart-down` distinct from the accent so gains do not draw in crimson's
  danger red or vanish into forest's accent green.
- **Surface:** Analytics.
- **Files:** `client/src/pages/AnalyticsPage.jsx`,
  `client/src/components/analytics/ExercisesView.jsx`,
  `EmptyStateGhosts.jsx`, `StrengthTrendChart.jsx`, `StatTiles.jsx`,
  `client/src/styles/analytics-motion.css`, `client/src/index.css`.
- **Done when:** ghosts breathe (opacity 0.55 <-> 0.9, 3 s) and are static
  under reduce; changing the range keeps the page in place and rolls the
  tiles; no `h2` inside an analytics card renders larger than 18px; an
  Exercises row at 390 shows the full name on one line (or wraps, never
  truncates with an ellipsis) plus one hero number; no "→" glyph in
  `AnalyticsPage.jsx` / `ExercisesView.jsx`; `--chart-up` and `--chart-down`
  exist in `index.css` for all 10 palette x mode combos and the delta chips,
  end dots and Top-gain tile use them; build passes.
- **Depends on:** MX2, MX3. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Notes: `--chart-up` / `--chart-down`
  (+ `-text`) are declared on `.analytics-page` in `analytics-motion.css`,
  derived from the per-palette `--color-success-*` / `--color-warn-*`
  tokens in index.css (so all 10 combos resolve) with a forest override
  that pulls "up" toward the text colour for separation from the accent;
  moving them into `:root` is a one-line job if another page needs them
  (MX8/MX9 probably will). Exercises rows: name wraps to 2 lines max (no
  ellipsis), hero = top set, delta line under it; best e1RM / session count
  / last-trained moved into the row's meta line; the detail panel is
  unchanged. Range change rolls KPIs from their previous values via
  `useCountUp`'s shown-value ref; bars re-charge via `transition: width`.

## MX5 - App shell transitions (Shared axis A)

- **Goal:** bottom-nav indicator FLIPs between items with a spring and a soft
  halo, tapped icon pops; a route-transition layer around `<Outlet>` slides
  pages along the nav order (28/32 px + fade) with the View Transitions API
  as progressive enhancement and WAAPI/CSS fallback; first visit to a page
  shows a geometry-exact skeleton that crossfades into a cascade; revisits
  cascade from cached data without a skeleton.
- **Surface:** app shell - `client/src/components/layout/`, `App.jsx` routes.
- **Variant:** A Shared axis.
- **Files:** `client/src/components/layout/BottomNav.jsx`, a new
  `client/src/components/motion/RouteTransition.jsx`, `client/src/App.jsx`,
  `client/src/index.css` (bottom-nav rules), per-page skeleton adoption.
- **Done when:** nav indicator animates between the five items (jumps under
  reduce); a page change slides along nav order and never blocks input;
  masthead stays fixed; build passes.
- **Depends on:** MX1. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Notes: direction comes from `navOrder.js`
  (the five sections, then depth inside a section; off-axis routes fade).
  View Transitions when the browser has them, WAAPI enter-slide otherwise;
  `::view-transition` is `pointer-events: none` and a second tap calls
  `skipTransition()`, so a tap mid-transition wins and navigation itself is
  never delayed. Desktop nav is the same five names in the same order as
  the phone nav, Profile included with an active state, one sliding
  indicator. Skeletons render immediately (`tone="skeleton"` no longer waits
  400 ms); Library counts are ghost pills until loaded and the Running strip
  reserves its slot from Home's run hint; Home's block-card slot and recent
  list, the block run page, and the "starting workout" page use the same
  skeleton language. Not in this unit: revisits skipping the skeleton
  (there is no page-data cache, and this block forbids data-layer changes);
  one content-column width (MX5b); the Finish dock covering the bottom nav
  (qol12, MX7).

## MX5b - One shell column (critic B8, carried)

- **Goal:** Library, the builder, Import, the block shell and Training use
  the same content width as Home / Analytics / History, so the desktop shell
  is one grid. MX5 already aligned the wordmark with the content column and
  unified the nav names and order.
- **Surface:** desktop layout.
- **Variant:** n/a.
- **Files:** `client/src/styles/blocks/bk-library.css`, `bk-ui.css`,
  `bk-builder.css`, `bk-import.css`, `client/src/styles/workout-bar.css`,
  `client/src/index.css` (`.settings-page`). These were outside MX5's files.
- **Done when:** those pages share one max-width at desktop and the
  persistent workout bar matches it.
- **Depends on:** MX5. **Packages:** none.
- **Status:** TODO.

## MX6 - List -> detail container transform

- **Goal:** History row -> session detail (and back) grows the row's header
  into the page header (FLIP with WAAPI; `view-transition-name` where
  supported) while the list fades and the detail cascades. Reused by block
  week -> session in MX11.
- **Surface:** History (`SessionsPage` -> `SessionDetailPage`).
- **Files:** `client/src/pages/SessionsPage.jsx`,
  `client/src/pages/SessionDetailPage.jsx`,
  `client/src/components/motion/` (a `useFlip` helper), `client/src/index.css`.
- **Done when:** tapping a History row animates its header to the detail
  header position; Back reverses; crossfade under reduce; build passes.
- **Depends on:** MX1, MX5. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Notes: WAAPI FLIP (`useFlip.js`), not
  `view-transition-name` - the header does not exist until the session
  payload loads, which is after a View Transition would have finished. The
  route layer fades (instead of sliding) while a capture is pending so the
  two motions do not stack. Only completed sessions participate: a live row
  does not capture, and the live header never takes the ref. Back captures
  on unmount of a completed session and the History row flies home once the
  list has loaded. Reduced motion skips the FLIP; the route crossfade
  remains.

## MXF1 - Critic round 1

- **Goal:** the nine critic-round-1 fixes, with Seth's two overrides: do not
  change the 420ms route or the 460ms surface duration, and replay Analytics
  in full on the first view of a browser session and on a range change. A
  return to Analytics in the same session fades (~200ms) and rolls only
  values that changed.
- **Surface:** History to session detail, skeletons, Analytics, the desktop
  masthead, chart color, the completed-session summary, boot splash, the
  History month heading.
- **Variant:** n/a (fixes, not a new A/B).
- **Files:** `client/src/components/motion/`, `client/src/pages/SessionsPage.jsx`,
  `client/src/pages/SessionDetailPage.jsx` (loading branch and the completed
  header/summary only), `client/src/components/workout/CompletedSessionSummary.jsx`,
  `client/src/components/LoadingState.jsx`, `client/src/components/analytics/WeeklyReport.jsx`,
  `client/src/pages/AnalyticsPage.jsx`, `client/src/components/analytics/`,
  `client/src/styles/analytics-motion.css`, `client/src/lib/historySessionCache.js`,
  `client/src/lib/analyticsSessionCache.js`, `client/src/components/layout/Navbar.jsx`,
  `client/src/styles/shell-motion.css`, `client/src/index.css`.
- **Done when:** each of the nine changes is visible, durations are unchanged,
  the live logger is untouched, build passes, check-hex is clean.
- **Depends on:** MX5, MX6. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). The grow is an empty card surface
  (left/top/width/height), started from the tapped row's own data. Back
  fades and shrinks together. Skeleton captions wait 2.5s. Analytics keeps
  a session cache per range.

## MXF2 - Seth's smoke round 1 (logger, chart colour, Strength draw)

- **Goal:** Seth's Oct 10 phone smoke of MX1-6 + MXF1. Everything he did not
  name passed; the 420ms tab slide stays. Fix: (1) the Finish dock hidden
  under the bottom nav on a live workout; (2) rest starts when you LEAVE the
  set, never between weight and reps (Seth's ruling); (3) crimson's chart
  marks are green (MXF1 built crimson `--chart-accent` from the success
  token) - on-palette, non-alarm instead; (4) the Strength draw does not
  play and its colour reads off.
- **Surface:** both loggers (Finish dock + rest trigger only), Analytics.
- **Variant:** n/a (fixes).
- **Files:** block `docs/tasks/mxf2-smoke-round-1-fixes.md`.
- **Done when:** the block's acceptance criteria pass and Seth re-smokes.
- **Depends on:** MXF1. **Packages:** none.
- **Status:** DONE (Oct 10, 2026). Finish dock is offset above the bottom nav on phone; the page view-transition name is only on during a transition so fixed page chrome is not trapped under the nav. Rest arms on core-logged and starts from `restLeaveDecision`. Crimson `--chart-accent` is `--color-chart-mark` (rose / blush). Strength's quiet hold applies only to the view already on screen.

## MXC1 - Coach keeps working + coach history in History (Seth, Oct 10)

- **Goal:** the coach conversation survives leaving `/coach` (app-level
  provider; a "Coach is working" bar like the resume-workout bar, flipping
  to "answered" when done; a once-per-device note on first open); coach
  history moves from Library to a Workouts | Coach switch on History; the
  masthead coach glyph loses the "..." Seth read as a glitch. Not a motion
  unit - smoke findings Seth put in this wave. Swipe-to-dismiss for the
  resume/coach cards is HELD (IDEAS 16).
- **Surface:** `/coach`, History, Library, Home masthead, a global bar.
- **Variant:** n/a.
- **Files:** block `docs/tasks/mxc1-coach-keeps-working.md`.
- **Done when:** the block's acceptance criteria pass and Seth re-smokes.
- **Depends on:** nothing in this wave. **Packages:** none.
- **Status:** DONE (Oct 10, 2026). `CoachSessionProvider` holds the page
  conversation; `CoachWorkingBar` sits bottom (phone, free) or as a top chip
  (live workout, workout bar, focused field) and re-fits on route commits;
  the first-open note is a device-local marker written on show; History has
  a `SlidingIndicator` Workouts / Coach switch (`?view=coach`).

## MXF3 - Seth's smoke round 2 (coach keyboard, chat-bubble icon, test keyboard)

- **Goal:** Seth's second Oct 10 phone smoke (MXF2 + MXC1). (1) On `/coach`
  the keyboard covers the field and the send button. The fit must hold
  however the browser reports the keyboard (Chrome's virtualKeyboard first,
  then visualViewport against a baseline), with a self-check and a
  `?kbdebug=1` readout. (2) The coach icon becomes a plain chat bubble, with
  no crown and no dots, centred (Seth: "the crown needs to go"). (3) A test
  keyboard (`scripts/virtual-keyboard-shim.js`) so the critic can catch
  covered fields before Seth does.
- **Surface:** `/coach`, Home masthead.
- **Variant:** n/a (fixes).
- **Files:** block `docs/tasks/mxf3-smoke-round-2-fixes.md`.
- **Done when:** the block's acceptance criteria pass, three critic rounds
  (typing surfaces / icons and alignment / coach flow and app sweep) are
  fixed, and Seth re-smokes.
- **Depends on:** MXF2, MXC1. **Packages:** none.
- **Status:** TODO.

## MX7 - Logger quiet confirm + rest dock

- **Goal:** the floor stays quiet: logging a set scales the number out and
  springs the check in within 90 ms with a one-frame row flash; the next set
  gets the accent ring; the rest row expands at the dock (grid-rows 0fr->1fr)
  with its depleting line; a completed exercise block exits upward and the
  next cascades in; "+ Add set" slides a row in. Inputs never move while
  focused (an input-stability guard: nothing above the active input changes
  height while it has focus).
- **Surface:** the workout logger (`client/src/components/workout/`,
  `client/src/styles/logger.css`, `rest-timer.css`).
- **Files:** `WorkoutSetRowShell.jsx` and siblings, `logger.css`,
  `rest-timer.css`.
- **Done when:** the tap-to-visual path is a class toggle driving one CSS
  transition <= 90 ms with no JS animation on the tap; rest dock expands
  without layout shift under the thumb; build passes; Seth's smoke confirms
  the keypad never covers the active input.
- **Depends on:** MX1. **Packages:** none.
- **Status:** TODO.

## MX8 - PR moment (Crown stamp A) + milestone takeover

- **SETH'S RULING (Oct 9, added at landing - overrides the goal below; see
  "Seth's rulings" at the top of MOTION-DIRECTION.md):** the loud
  celebration is RARE - "not every PR or it will be every update." An
  ordinary PR gets the quiet confirm plus a small static PR mark (the crown
  on the set cell), no burst, no banner, no haptic pattern. The stamp +
  burst + banner below fire ONLY on criteria that clear a high bar (big
  milestones or lifts that genuinely fit); this unit's block defines them
  and justifies "rare enough to still mean something" (a few times a year
  for a regular lifter, not a few times a week). Milestone takeover:
  workout counts at powers of ten from 100 (100, 1,000, 10,000, ...), once
  each, ever.
- **Goal:** a qualifying moment (per the ruling above) stamps a crown onto
  the set cell (scale 3.2 -> 1.15 spring),
  fires a canvas pixel-square burst (~40 squares, 700 ms), a short haptic
  (`navigator.vibrate` behind a feature check), and slides a banner under
  the masthead with the e1RM rolling old -> new (+delta), auto-dismissing.
  Milestones (100, 1,000, 10,000 workouts) take over once: scrim, an 11x8
  pixel crown that draws itself at 14 ms/pixel, the number rolls, one "Keep
  going" button.
- **Surface:** logger + a global milestone sheet.
- **Variant:** A Crown stamp.
- **Files:** `client/src/components/workout/`, a new
  `client/src/components/motion/PixelBurst.jsx` and `PixelCrown.jsx`,
  `client/src/index.css`.
- **Done when:** PR detection the app already does triggers the stamp +
  burst + banner; reduced motion = crown fades in, no burst, banner fades,
  haptic still fires; milestone fires once per milestone (persisted flag);
  build passes.
- **Depends on:** MX1, MX7. **Packages:** none. **Server:** none for PRs
  (client already knows); milestone counts come from existing profile stats.
- **Status:** TODO.

## MX9 - Home + the session arc (Go live, then push A)

- **Goal:** Home hero gets a slow glint sweep (6.5 s), the week strip's dots
  spring in with stagger, Home KPIs roll; Start turns the hero `card--live`
  FIRST (the L-bar draws itself down then across, the live dot pulses, the
  timer starts) and THEN the logger pushes up; Finish shows the sheet with
  Duration / Sets / Volume / PRs rolling up; Done slides the logger down,
  flashes the hero "saved", lights today's dot with a ping, rolls Home's
  counts and expands the new History row into the list.
- **Surface:** Home (`DashboardPage.jsx`), start/finish flow.
- **Variant:** A Go live, then push.
- **Files:** `client/src/pages/DashboardPage.jsx`,
  `client/src/components/workout/` (finish sheet), `client/src/index.css`.
- **Done when:** each beat above plays in order and can be interrupted;
  `card--live` is applied only to the live workout card; reduced motion =
  fades, final states; build passes.
- **Depends on:** MX1, MX5, MX7. **Packages:** none.
- **Status:** TODO.

## MX10 - Per-palette scene life (REWRITTEN - was "skyline everywhere")

- **Goal:** each palette's environment gets its OWN ambient motion, as
  previewed in `scenes.html` (built in this block, see MX-S below): the
  scene is a stage, not a page - subtle under content, louder where nothing
  is being read (headers, empty states, login). Implemented as one overlay
  `<canvas>` (or CSS layers) between `body::before` and `#root`, paused when
  `document.hidden`, off under reduced motion, and dark-mode weighted (light
  modes get the quieter version). The critic's scene notes govern: crimson
  dark must not flood the viewport red; chill dark's scene must become
  visible; light modes must not bleach to a grey haze; long text never sits
  straight on busy art (that is MX14's job, this unit does not fix it).
- **Surface:** global scene layer.
- **Files:** `client/src/index.css` (scene section), a new
  `client/src/components/motion/SceneLife.jsx` mounted once in `App.jsx`,
  `client/src/assets/scenes/` untouched (the authored rasters stay).
- **Done when:** switching palette switches the ambient motion; each of the
  five has a visibly different idle; nothing animates under reduce or when
  the tab is hidden; CPU stays idle-cheap (one low-res canvas, <= 30 fps,
  particles capped); build passes.
- **Depends on:** MX-S (the preview) and Seth's pick of each environment's
  motion. **Packages:** none.
- **Status:** TODO.

## MX11 - Block run page adoption

- **Goal:** apply the shipped primitives, invent nothing: week strip uses
  Home's dot spring-in; the current session card is the notched hero and
  goes `card--live` with the same L-bar draw; week completion fills the
  progress ring; week -> session uses MX6's container transform.
- **Surface:** `client/src/pages/BlockRunPage.jsx`.
- **Files:** `BlockRunPage.jsx`, `client/src/styles/blocks/`.
- **Done when:** the page uses only MX1/MX6/MX9 primitives; build passes.
- **Depends on:** MX6, MX9. **Packages:** none.
- **Status:** TODO.

## MX12 - Performance + reduced-motion audit

- **Goal:** gate fuel for pre-main: 4x-CPU-throttle traces of the Analytics
  first load and the logger; a reduced-mode walkthrough of every surface;
  a fix list, fixed.
- **Done when:** no long task > 50 ms after first paint on Analytics; steady
  60 fps during the cascade at 4x throttle; every surface has a complete
  reduced version; findings and fixes recorded in DELIVERY.md.
- **Depends on:** all shipped units. **Packages:** none.
- **Status:** TODO.

## MX13 - One type system (critic lever 1; app-wide)

- **Goal:** one display face (Chakra Petch) with a narrow job - page titles
  and hero numbers; sentence case everywhere including block surfaces; one
  eyebrow style (11px, 600, 0.06em caps) and a 5-step scale (27 / 20 / 17 /
  14 / 12 px); one wordmark. MX4 applies the scale inside Analytics; this
  unit applies it everywhere else (Library, block run, import, builder,
  login).
- **Files:** `client/src/index.css` type section, `client/src/styles/blocks/`,
  the block-surface components.
- **Done when:** no ALL-CAPS copy outside the eyebrow style; card titles are
  17px/700; a grep for `text-transform: uppercase` finds only the eyebrow
  rule and the wordmark; build passes.
- **Depends on:** MX4 (as the reference implementation). **Packages:** none.
- **Status:** TODO.

## MX14 - One component state system + content on surfaces (critic levers 2 + 3b)

- **Goal:** one "selected" token (the sliding indicator from MX1, or where a
  slider does not fit, `--color-nav-active-bg` + accent ring), three button
  tiers (primary, secondary, quiet), one section-header style, one sheet
  header, one off-switch knob; every reading surface sits on a surface or a
  scrim (coach answers, What's New, Recent workouts heading, Profile log-out
  box).
- **Files:** `client/src/index.css`, the components the critic named.
- **Done when:** the critic's inconsistency table has one row per job;
  no long text crosses the scene band at 390; build passes.
- **Depends on:** MX1, MX2 (reference). **Packages:** none.
- **Status:** TODO.

## MX15 - One logger (critic lever 3a)

- **Goal:** rebuild quick logging on the block logger's table grid (single
  sticky name line, one-line dock, set-number-as-log). MX7's motion lands on
  this grid.
- **Files:** `client/src/components/workout/`, `client/src/styles/logger.css`.
- **Done when:** both workout types render the same set-row grid; build
  passes; Seth smokes the keypad/dock behaviour.
- **Depends on:** nothing in this wave strictly, but should land before MX7
  if sequencing allows. **Packages:** none.
- **Status:** TODO.

## MX16 - Number format unification

- **Goal:** one big-number format app-wide (the critic's "14.8k lbs next to
  5780 lbs"): a single formatter in `client/src/lib/` used by Home's weekly
  report, History and Analytics, with the k-threshold decided once.
- **Files:** `client/src/lib/weightDisplay.js` (or a new `bigNumber.js`),
  callers.
- **Done when:** no two surfaces print the same magnitude differently; build
  passes.
- **Depends on:** none. **Packages:** none.
- **Status:** TODO.

## MX-S - Scene previews (this block's "backgrounds" ask; preview only)

- **Goal:** (a) the four MX0 previews switch environment with the palette
  (the five real scene JPGs embedded as `data:` URIs); (b)
  `docs/design/mocks/motion/scenes.html` shows all five environments alive,
  each with its own ambient motion, both modes, with a Reduced toggle.
- **Surface:** previews only - no app change.
- **Files:** `docs/design/mocks/motion/scenes.html` (new),
  `analytics-in-motion.html`, `pr-moment.html`, `navigation-transitions.html`,
  `session-flow.html` (scene fix only).
- **Done when:** `scenes.html` follows MX0's PREVIEW RULES (title first, no
  doctype/html/head/body, allowed CDN hosts only, reduced-motion rule, 5
  palettes + light/dark, under 2 MB) and shows five visibly different
  environments; every MX0 preview's backdrop changes when the palette does.
- **Depends on:** none. **Packages:** none.
- **Status:** DONE (Oct 9, 2026). Notes: the five JPGs ride in the SHARED
  block of every preview (`--scene-image` per palette, layered exactly like
  index.css `body::before` / `body::after`), so the code-drawn skyline and
  its flicker are retired from all four MX0 previews (`drawScene()` is now
  a hook list previews can register ambient layers on). The per-palette
  filter corrections for the critic's three scene notes live in that shared
  block as `--scene-backdrop-filter` / `--scene-band-filter` /
  `--scene-light-band-filter` and are the values MX10 should port: crimson
  `blur(22px) saturate(0.8) brightness(0.4)` backdrop + `saturate(0.9)
  brightness(0.9)` band; chill `brightness(0.8)` backdrop + `brightness(1.18)
  contrast(1.12)` band; light band `saturate(0.6) brightness(1.45)
  contrast(0.9)` at 0.55 (was 1.75 / 0.78 / 0.5). `scenes.html` is MX10's
  spec as code: champ = real-window flicker (lit pixels sampled from the
  raster) + star twinkle; iron = embers off the anvil + forge pulse 3.4 s;
  chill = two mist layers (parallax) + moon breathe 8 s; forest = fireflies
  (pollen motes in light) + two breathing light shafts; crimson = cloud wisps
  90 s/140 s + moon pulse 6 s. `MOTION-DIRECTION.md` section 2.8 / 2.x still
  describes the old skyline flicker - it is not in this block's FILES TO
  TOUCH; MX10's author should update it to match scenes.html.

---

## Server-side units this wave surfaced (not in this block)

- **SRV-1 - PR events on session save:** the PR moment (MX8) wants the
  server to return `prs: [{ type, exerciseId, value, previous }]` in the
  set-log / session-finish response so the client does not re-derive PRs.
  Today the client can approximate from `personalRecords` on the exercise
  detail, which is one extra fetch per logged set.
- **SRV-2 - Milestone counters:** `workoutsLogged`, `prsTotal`,
  `volumeLifetime` on the profile stats response, with the thresholds
  crossed since last fetch, so the milestone takeover fires once per
  milestone without client bookkeeping.

## Order and parallelism

MX1 -> (MX2 -> MX3 -> MX4) ; MX5 -> MX6 can run in a parallel lane after MX1
(disjoint files: shell vs analytics). MX15 before MX7 if possible; MX7 -> MX8;
MX9 after MX5 + MX7. MX13/MX14 after MX4 (they copy its type scale and
selected token). MX10 after Seth picks from `scenes.html`. MX11, MX12, MX16
are tail units.
