# Round 2 - focus: icons, glyphs, alignment and rendering, all 10 combos

SCORE (focus area): 5/10

The new coach icon passes: it is a plain bubble, centred within 0.55px, crisp, and reads as "chat". It is slightly lighter than the nav icons.
The problems are around it. One token pairing puts a white glyph on the light dark-mode accent in 4 of 5 dark palettes (forest 1.74:1).
The Analytics chart cards lost their side padding, and every icon drawn as a text glyph (x, -, +, ›) sits 2.3-3.3px low.

Method: separate Playwright context, isMobile + hasTouch + DPR 2.625 + Android Chrome UA, 412x800
(Seth's phone), plus 390x844 and 360x780 passes. SVG icons: getBBox() of the painted geometry
mapped through getScreenCTM(), centre compared with the host rect. Text-glyph icons: an element-clip
screenshot decoded in-page, ink bbox of the pixels compared with the host box. Contrast: computed fg
over the composited bg (WCAG). All 10 combos walked on Home, /coach and one live quick workout. Other
pages got crimson dark + champ dark + champ light. Screenshots are in `round-2/`.

## Findings, ranked (P1 x0, P2 x5, P3 x11)

### R2-1 (P2) White glyph on `--color-interactive`: send arrow, Library "GO", block "NEXT" tag, login button fail in dark mode
- Surface: /coach send button (enabled), Library running strip "GO", /blocks/current day tag "NEXT",
  login `.auth-form .btn`. 412x800, all dark palettes.
- Repro: /coach, type anything, look at the send button. Or Library, look at the "GO" pill.
- Evidence (white on accent): forest dark **1.74:1**, champ dark 2.55, chill dark 2.70, crimson dark
  (Seth's) 2.77. The light modes pass (4.44-6.47), and iron passes because its fg is #1c1917. Primary `.btn`
  uses `--color-btn-primary-bg`, which is darker, so it passes (white on #b91c1c = 6.47 on crimson). Shots:
  `38-send-enabled-forest-dark.png`, `38-send-enabled-crimson-dark.png`, `11-library-go-forest-dark.png`,
  `12-block-current-forest-dark.png`, `13-block-day-next-tag-forest-dark.png`.
- Guess (confident): the pairing mixes tokens. The bg is `--color-interactive`, which is the LIGHT accent in
  dark mode, and the fg is `--color-btn-primary-fg`, which is #fff and was designed for `--color-btn-primary-bg`.
  Sites: `styles/coach-page.css:330-331`, `styles/blocks/bk-ui.css:13-15` (`--bk-accent`/`--bk-on-accent`,
  used by `bk-library.css:192`, `bk-ui.css:376`), `index.css:6417-6418` (`.auth-form .btn` hardcodes #fff).
  Fix: put `--color-btn-primary-bg` behind white, or add an on-accent token for each palette.

### R2-2 (P2) Analytics chart cards: title, toggle pills and caption sit flush against the card's left edge
- Surface: Analytics, Muscles / Strength / Execution cards. Every combo (it is a layout bug). 412 and 390.
- Repro: /analytics, scroll to "Weekly volume by muscle". Then switch to Strength and to Execution.
- Evidence: the card `section.card.analytics-table-card` has left 16.0 and padding 0. The `<h2>` "Weekly volume
  by muscle" has left 16.8, so the gap is the 0.8px border. The same 0.8px applies to "Strength trends" and
  "Execution", and the Strength "Table" pill touches the right edge. The legend and rows below are inset
  14-20px, and the next card ("Data quality") is padded normally, so the header is the ragged one-off.
  Computed `.analytics-card-head` padding is `12px 0px`. Shots:
  `33-analytics-muscles-card-crimson-dark.png`, `34-analytics-strength-crimson-dark.png`.
- Mechanism (confirmed in CSS): `styles/analytics-motion.css:12`
  `.analytics-page section.card > .analytics-card-head { padding-left:0; padding-right:0 }` was meant
  for the padded Balance card. It also matches the zero-padding `.analytics-table-card` sections
  (`index.css:6743` relies on the head's own `12px 14px`). Scope it to the Balance card.

### R2-3 (P2) Text-glyph icons ride low: x, -, + and › drawn as font characters sit 2.3-3.3px below centre
- Surfaces and pixel-measured ink offset (x, y) inside the 44px host:
  - Live logger "Discard workout" x (`.session-discard-x`, 24px system-ui): **(0, +2.84)**. Its 12px-radius
    box becomes visible on press/hover, which makes the drop obvious (`30-discard-x-open-zoom-crimson-dark.png`).
    It also sits 2.3px below the centre line of the "Back" pill on the same row (`21-live-header-crimson-dark.png`).
  - Rest-timer stepper (Profile > Training), bordered 44px squares: "-" **(0, +3.22)** and "+" (-0.38, +2.84).
    The "-" is a HYPHEN, 6.1x1.9px, next to a 9.9px "+", so the pair is visibly mismatched
    (`46-rest-stepper-crimson-dark.png`).
  - Profile settings rows "›": +2.29, +2.86, +2.48, +2.86, +3.09, +3.25 below the row centre (all 6 rows).
  - Home "Workout discarded" toast dismiss x: same 24px glyph, same drop (`31-home-discarded-toast-crimson-dark.png`).
  - Remove-set x is +1.14, borderline.
- Repro: Home > Start empty workout, then tap the x top-left. Or Profile > Training > Rest timer.
- Guess: font glyphs centre on the math axis/x-height, not the em box, so flex centring leaves them
  low. Swap them for 24-box SVGs (stroke 1.8) like the nav, which also fixes the hyphen.

### R2-4 (P2) /coach "Stop" button: the label is pushed to the right edge while the answer streams
- Surface: /coach composer while streaming. 412x800, every combo (layout).
- Repro: send any question and look at the button that replaces send.
- Evidence: the button is 352-396 (44px). The text runs 364.8-392.8, so the left gap is 12.8px and the right gap
  3.2px, and the label centre sits **+4.79px** right. Computed `flex: 0 0 44px` and `width: 44px`
  despite `width:auto; padding:0 12px`. Shot `41-coach-stop-btn-crimson-dark.png`.
- Mechanism (confirmed): `styles/coach-page.css:322-325` `.coach-page__send { flex: 0 0 44px }`
  wins over `.coach-page__send--stop { width:auto }` (348-356). Needs `flex: 0 0 auto` on `--stop`.
  Seth sees it on every send.

### R2-5 (P2) Iron light: amber `--color-interactive` (#f59e0b) used as TEXT/ICON on cream is about 2:1
- Surface: iron + light, every page. 412x800.
- Evidence: logger active pills "RIR" and "Exercise notes" **1.88**, "Edit" and "Add a workout note" 2.12,
  bottom-nav active label + icon 2.05, Home masthead coach icon on its fill 1.94, /coach intro mark 1.91,
  /coach suggestion icons 2.12, "NEXT IN YOUR BLOCK" eyebrow 2.12. Every other palette's light mode uses a
  darker accent (champ 85,102,196 / forest 21,128,61 / crimson 185,28,28), so iron light is the
  outlier. Shots `24-live-top-iron-light.png`, `02-home-top-iron-light.png`, `06-coach-iron-light.png`.
- Guess: `index.css` iron light block sets `--color-interactive` to amber-500. It needs an amber-700-ish
  value for text/icon use, or a separate `--color-interactive-text`.

### R2-6 (P3) The coach has three different marks
- New `CoachMarkIcon` bubble on the Home masthead and the /coach intro. A different round bubble on
  the /coach suggestion rows (`CoachPanel.jsx:116-127` `SuggestMark`, stroke 1.7 @18px), 140px under the
  intro mark. Its painted box is offset (+1.38, +1.0)px inside its own svg, the same off-centre family
  as the old masthead bubble. A CROWN on the Analytics "COACH / Ask about these numbers" card and on every
  coach answer's "Coach" label. Seth asked for no crown in the coach icon, but the crown still marks the coach.
  Shots `05-coach-412-crimson-dark.png`, `40-coach-answered-crimson-dark.png`, `10-analytics-crimson-dark.png`.

### R2-7 (P3) Icon size and stroke drift (rendered px)
- Nav 24 box / 1.8. Masthead coach 22 / **1.65** (the 1.8 stroke is scaled by size=22, so it is 8% lighter
  than the nav side by side, `03-coach-btn-crimson-dark-zoom.png` vs `03-bottom-nav-crimson-dark.png`).
  /coach "+" and send 18 / 1.35. Suggest 18 / 1.28. Logger trash 20 / 1.46. Coach-history trash 20 / 1.5, and it
  is a different drawing (no inner bars) from the logger trash. Chevrons come in 4 kinds: "▾" text
  (exercise header), "›" text (Profile, "View block ›"), SVG chevron (Recent workouts), and a native select arrow.
  The send arrow paints 11.9x10.4 inside a 44px button and reads small.

### R2-8 (P3) Logger "L/R" toggle floats 10.4px above the Sets select it sits beside
- Live logger, every combo. L/R centre 393.6, select centre 404 (row is `align-items:center`, but the
  select is wrapped with its "Sets" label). Shot `23-live-sets-crimson-dark.png`.

### R2-9 (P3) Workout summary ragged edges
- `.session-summary-footnote` has `padding-left: 2px`, so "One-time session..." starts 2px right of
  "Finished Sep 8..." (both left 16).
- Exercise titles do not line up: "Barbell Squat" at 57.1 and "Romanian Deadlift" at 59.5. The "01"/"02"
  index uses proportional Chakra Petch digits (14.3 vs 16.7px wide) and `font-variant-numeric: normal`.
  Shot `35-session-detail-crimson-dark.png`.

### R2-10 (P3) Analytics muscle chart axis reads "0  0  0.1  0.1  0.1"
- Small ranges round the tick labels to 1dp, so they duplicate. Any lifter with low weekly volume (new
  users) sees it. Shot `33-analytics-muscles-card-crimson-dark.png`. Guess: `MuscleVolumeChart.jsx`
  tick formatter. Use 2dp or dedupe ticks when the max is < 1.

### R2-11 (P3) Block day card: "NEXT" tag collides with a two-line name; the empty ring vanishes on the selected card
- /blocks/current: tag top 193.8 vs name bottom 194.8 (1px overlap, crowded). The empty progress ring
  on the selected day has 1.11-1.16:1 against the selected fill, which makes it invisible (unselected 1.46-1.67).
  Shot `13-block-day-next-tag-forest-dark.png`, `12-block-current-forest-dark.png`.

### R2-12 (P3) Focus rings clipped by `overflow` (keyboard focus only)
- Library Yours/Community (`.bk-segmented` hidden: L/T/B cut), Profile settings rows (`.settings-group`
  hidden), block week strip and day picker (overflow auto: top/bottom cut), Analytics coach chips (top cut).
  Shot `47-focus-ring-week-strip-cut.png`.

### R2-13 (P3) Native radios ignore the app theme
- Profile > Appearance in dark mode shows the unselected palette radios as bright white 13px discs, louder
  than the selected state. `color-scheme` computes `normal` on `<html>` (the meta says "dark light"), so
  native controls follow the OS, not `data-theme`. Shot `45-appearance-crimson-dark.png`.

### R2-14 (P3) Scene rasters render soft
- The `body::before` scene is `cover` at `image-rendering: auto`. crimson.jpg is 600x246 drawn at
  478x928 CSS (~10 device px per art pixel, bilinear-smoothed), so the pixel-art wolf has blurred edges
  (`50-scene-wolf-zoom-crimson-dark.png`). Champ/forest are 704px, iron/chill 1024px. Separately, the
  frosted bottom nav blooms a white "Start" button scrolled under it into a pale smear over Home/Analytics
  (`52-library-360-nav-after4s.png`).

### R2-15 (P3) Library "RUNNING" status pill in champ light is 1.98:1 (green on mint)
- Shot `10-library-champ-light.png`.

### R2-16 (P3) /coach leave-note "Got it" is aligned to nothing
- `.coach-leave-note` uses `align-items:flex-start`. The 44px button centre is 96.8, line 1 centre 84.3,
  and the text block centre 103.2.

## Checked and clean

| Check | Measurement |
|---|---|
| Coach icon, Home masthead (all 10 combos) | paint vs button (0, +0.55)px; svg vs button (0,0); plain outline, nothing inside |
| Coach intro mark /coach | paint vs box (0, +0.55)px; icon contrast >= 3.68 in 9/10 combos (iron light 1.91, see R2-5) |
| Masthead coach button vs /coach "+" | identical rects 352,12,44,44, same slot on both pages |
| Masthead ring visible | ring vs page: dark 2.41-3.26, light 1.42-1.93 (faint but present; screenshots 02-*) |
| Bottom nav icons (5) | horizontal offset 0 to +0.5px (Analytics bars 0.5); stroke 1.8 rendered 1.8 |
| Nav sliding indicator | centre 40.6-41.0 vs item 41.2; width 82 vs 82.4 |
| /coach "+" and send arrow (SVG) | (0,0) and (0,0) |
| Logger trash, set check badge, RIR "?", Tracked check | pixel offsets (0,+0.38), (0,+0.38), (+0.19,0), (+0.38,-0.38) |
| Bottom-sheet handle | 40px at x 186 = centred in 412 |
| Hero frame stepped corners | clip-path notch 8px outer / inset 2.5px inner = uniform 2.5px line on every step |
| Start empty workout dumbbell | mask path centred (12,12) in 24 box; icon+label group centre within 1px of button |
| Horizontal overflow | scrollWidth == viewport at 360/390/412 on Home, Coach, Analytics, Library, History, block, Profile, live logger |
| Truncation | no text clipped without ellipsis at 360 (titles use ellipsis: "Barbell Ben...") |
| History number column | all 8 rows right edge 355.2 |
| Analytics "?" help buttons | ink (+0.19, -0.14) in 19.2px circle |
| Dark-mode masthead/hero across 5 palettes | no off-palette surfaces; hero eyebrow/lead readable (scan flagged them only because of the frame's layered bg) |

Skipped / not reached: chart "gains stay green" (no measured gain in range on this account); live
rest-timer pill (did not surface in quick log); builder, Import and What's New pages; live-workout
combos were flipped by attribute, not reload.

## Outside focus

- `/coach/status` counts against the 40-per-15-min coach chat limit. About 20 visits to /coach locked the page,
  and the 429 renders "Couldn't reach LogChamp. Check your connection" instead of the server's
  "taking a breather" copy (`99-outside-coach-429-copy.png`).
- Analytics "?" help buttons and the logger "L/R" toggle (41.7x28) are below the 44px tap size.

## Housekeeping

- Started quick workout /sessions/509, logged 1 set (135x5), then DISCARDED it ("Workout discarded" toast
  confirmed; Home shows no live workout).
- Created coach conversation c=11 (2 questions) and deleted it from History > Coach (list then empty).
  Did not use "Delete all".
- demo.critic hit the coach rate limit 23:10-23:26 local API time. It reset by 23:27. Round 3 should avoid
  reloading /coach in a loop.
- Appearance changed only in my separate context's localStorage, set back to dark / champ before
  closing it. Main context reads dark / champ. No account settings touched.
