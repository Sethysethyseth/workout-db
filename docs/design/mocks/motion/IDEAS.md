# IDEAS - parked, for Seth to pick from

Anything that would make LogChamp's analytics and motion stand out but sits
outside the current block (another surface, new server data, a package, a
whole new feature). One entry each; status PARKED until Seth picks it.
Fields: idea, why it's cool for a lifter, what it needs, rough size, status.

---

### 1. Strength curve replay ("watch your year")

- **Idea:** on the Exercises detail, a Replay button scrubs the e1RM line
  from the first session to today over ~3 s, with PR crowns stamping as the
  line passes them and the headline value rolling alongside - the
  `analytics-in-motion.html` hero chart, pointed at real history.
- **Why it's cool:** progress is slow day to day; seeing a year of it draw
  itself in three seconds is the moment lifters screenshot and share.
- **Needs:** client only (e1RM history already comes from the detail API).
- **Size:** S.
- **Status:** PARKED.

### 2. Muscle heat body map

- **Idea:** a stylised pixel-art front/back body silhouette where each
  muscle fills with the heatmap ramp for weekly volume; tap a muscle to jump
  to its bar in the Muscles view. Animated fill on load.
- **Why it's cool:** "which muscles am I neglecting" becomes a one-glance
  picture instead of a list; it is also the most Instagram-able analytics
  surface a tracker can have.
- **Needs:** client only (perMuscle already carries the numbers); an SVG
  body authored in the pixel style.
- **Size:** M.
- **Status:** PARKED.

### 3. PR share card

- **Idea:** after a PR, "Share" renders a 1080x1350 image (canvas) in the
  current palette - scene art, crown, exercise, weight x reps, the e1RM
  delta, the line chart tail - and hands it to `navigator.share` or a
  download.
- **Why it's cool:** lifters already post PRs; a card that looks like
  LogChamp is free distribution and a reason to log in the app.
- **Needs:** client only (canvas + Web Share API); the PR moment (MX8).
- **Size:** M.
- **Status:** PARKED.

### 4. Weekly "report rolls in" animation on Home

- **Idea:** Monday's weekly report arrives as a sequence: last week's
  numbers roll to this week's, PR crowns stamp, the nudge line types in.
  Plays once per week (persisted), then Home is static.
- **Why it's cool:** the weekly report is the retention surface; making its
  arrival an event gives Monday a reason to open the app.
- **Needs:** client only (WeeklyReport data exists); a "seen" flag in
  localStorage.
- **Size:** S.
- **Status:** PARKED.

### 5. Plate-loading rest timer

- **Idea:** the rest timer's depleting line becomes a barbell whose plates
  unload one by one as the rest runs down (the loading splash's barbell
  motif, reversed); the last plate flashes at 10 s.
- **Why it's cool:** glanceable from across the rack - you read "two plates
  left" without reading digits - and it reuses the one waiting motif the
  app already owns.
- **Needs:** client only (`rest-timer.css`, `LoadingState`'s Barbell).
- **Size:** S.
- **Status:** PARKED.

### 6. Fatigue / freshness wave

- **Idea:** per muscle, a decaying "freshness" curve (sets x stimulus with a
  48-72 h half-life) drawn as a slow sine-like wave on the Muscles view, so
  "chest is still recovering" is a shape, not a number.
- **Why it's cool:** answers "what should I train today" visually, which is
  the question intermediate lifters actually have.
- **Needs:** server data (per-set timestamps aggregated per muscle with the
  decay model in `server/src/analytics/`), then a client chart.
- **Size:** L.
- **Status:** PARKED.

### 7. Living scenes with time of day

- **Idea:** each palette's environment follows the clock: the city's windows
  light up after sunset, the forest gets morning mist, the ember scene
  burns brighter at night, chill gets a dusk gradient. Built on MX10's
  scene-life canvas.
- **Why it's cool:** the app feels like a place you return to, and a 6 am
  session looks different from a 9 pm one.
- **Needs:** client only (after MX10).
- **Size:** M.
- **Status:** PARKED.

### 8. Haptic choreography

- **Idea:** a small haptic vocabulary (`navigator.vibrate` patterns): tick on
  set logged, double on PR, long-short-long on milestone, a soft pulse at
  rest-timer end. Android only (iOS Safari has no vibrate API); silent
  elsewhere.
- **Why it's cool:** feedback you feel with chalked hands and the phone in
  a pocket; it is the cheapest "premium" signal there is.
- **Needs:** client only; a settings toggle.
- **Size:** S.
- **Status:** PARKED.

### 9. Client test runner (vitest)

- **Idea:** add vitest + @testing-library/react to `client/` so the motion
  hooks (`useCountUp`, `useReducedMotion`) and the pure analytics formatters
  get unit tests in CI.
- **Why it's cool:** the motion layer is logic-heavy (easing, cancellation,
  reduced-motion branches); tests keep the wave from regressing as more
  surfaces adopt it.
- **Needs:** packages (vitest ~ 3 MB dev dep, @testing-library/react) -
  Seth's call under the dependency gate; a `test:client` script and a CI
  step.
- **Size:** S.
- **Status:** PARKED.

### 10. Animated session recap after Finish

- **Idea:** the finish sheet (MX9) grows a second page: a 5-second recap
  where the session's exercises stack up as bars, the top set pulses, and
  volume vs last session rolls - skippable, once per session.
- **Why it's cool:** closure. Lifters finish a hard session and get a
  highlight reel instead of a form.
- **Needs:** client only (session data is in hand at finish).
- **Size:** M.
- **Status:** PARKED.

### 11. View Transitions for the whole shell

- **Idea:** once MX5 ships with its WAAPI fallback, go all-in on the View
  Transitions API where supported: shared `view-transition-name` on the
  masthead, bottom nav and the tapped History row so the browser does the
  FLIP natively.
- **Why it's cool:** native container transforms are smoother than JS FLIP
  on low-end Android and cost zero JS.
- **Needs:** client only; Chrome/Edge/Safari 18+ (fallback stays).
- **Size:** S.
- **Status:** PARKED.

### 12. Streak + consistency calendar with pixel fills

- **Idea:** a 12-week calendar grid where trained days fill as pixel squares
  in the heatmap ramp, filling in with a cascade on load; the current streak
  count rolls.
- **Why it's cool:** consistency is the real predictor of progress and
  lifters respond to streaks; the pixel fill matches the brand.
- **Needs:** client only if the sessions list is enough; a server
  `trainingDays` endpoint would be cheaper for long histories.
- **Size:** S (client) / M (with server).
- **Status:** PARKED.

### 13. Scenes that react to the session

- **Idea:** the ambient scene (`scenes.html` / MX10) listens to the live
  workout: in iron, embers rise faster for the ~10 s after a set is logged
  and the forge flares on a PR; in champ, one more window lights per set and
  the whole skyline switches on when the session finishes; chill's mist
  parts while the rest timer runs; forest's fireflies gather on the start
  button; crimson's moon brightens as weekly volume approaches target.
- **Why it's cool:** the environment becomes a quiet progress meter you feel
  rather than read - and it is unique to LogChamp.
- **Needs:** client only (session events exist in the logger state; MX10's
  scene layer needs an event hook). Must stay under the "never delays input
  on logging surfaces" bound.
- **Size:** M (after MX10).
- **Status:** PARKED.

### 14. Window-light history in champ

- **Idea:** in the champ scene, the number of lit windows at idle is the
  lifter's training days this month (sampled from the raster, like the
  flicker in `scenes.html`), so the city literally gets brighter the more
  you train; a cold month goes dark.
- **Why it's cool:** a scene that tells you how your month is going at a
  glance, without a single number on it.
- **Needs:** client only (sessions list); builds on MX10.
- **Size:** S (after MX10).
- **Status:** PARKED.

### 15. Keep the last page on screen while the next one loads

- **Idea:** the shell remembers the last rendered page per route (a small
  in-memory cache of the React tree, or of the last fetch) so Back shows the
  History list immediately and the shared-axis slide plays over real
  content instead of a skeleton.
- **Why it's cool:** the transition you just watched is the page you
  remember, not a shimmer standing in for it. Going back to a workout you
  just left feels instant.
- **Needs:** client only. A data cache, which MX5 deliberately did not add
  (its block forbids data-layer changes). Must not show stale live-session
  state as if it were still editable.
- **Size:** M.
- **Status:** PARKED.

### 16. Fling away the resume-workout and coach cards (Seth, Oct 10 - HELD)

- **Idea:** the resume-workout bar and the "Coach is working" bar (MXC1)
  can be grabbed and flung away in ANY direction, like moving days and
  weeks in the block builder. While dragged the card follows the finger and
  fades as it gets further from where it started. It travels at most a
  couple of centimetres; let go out of range and it disappears, let go in
  range and it springs back. Dismissed, the workout lives only on Home's
  resume card and the coach answer only in the coach chat on Home - nothing
  is discarded.
- **Why it's cool:** a bar you can flick off when you want the screen back,
  without losing the workout or the answer.
- **Needs:** client only. Pointer events + transform/opacity, zero deps;
  look at open-source swipe-to-dismiss patterns (toast and card-stack
  libraries) for feel, build our own. Must never fire from a scroll, never
  discard data, and honour reduced motion (no drag-follow, a plain dismiss
  control instead).
- **Size:** S-M.
- **Status:** HELD by Seth - decide after this wave closes whether it joins
  the wave or the next one.
