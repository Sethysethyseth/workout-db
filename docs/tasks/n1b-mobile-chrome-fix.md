# TASK N1b: Mobile chrome fix - free the scene band, kill the dead top bar

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
Seth smoked N1 (`d266242`) on the ui-nav-overhaul Vercel deploy. The bottom
tab bar itself is ACCEPTED ("absolutely beautiful") - do not restyle it. Two
critiques, plus one defect found during review, all settled as design forks
with Seth (July 4, Fable session):

1. The fixed bottom bar sits on top of the palette scene band (every scene
   anchors `center bottom` of the viewport), burying the best part of each
   theme behind frosted glass. FIX: on mobile the scene layers END at the top
   edge of the tab bar - the skyline/forge/treeline/wolf artwork sits flush
   on the bar like a skyline on a shelf, fully visible.
2. The mobile top bar is now a dead ~30px strip holding only a tiny brand.
   FIX: remove the top bar entirely on mobile when logged in. Home gets a
   proper masthead (crown + LogChamp wordmark + date subline); every other
   tab-level screen opens with its h1 upgraded to one consistent large-title
   style. Desktop (>= 720px) keeps the top nav EXACTLY as today.
3. Defect: `.persistent-workout-bar-wrap` paints an empty ~19px strip +
   border on every page even with NO live workout (the inner bar returns
   null but the wrap's padding/border always render). FIX: hide the wrap
   when empty. Additionally, on mobile the live-workout bar becomes a slim
   frosted single-line pill docked directly above the tab bar (thumb-reach
   Resume; translucent so the scene still reads through it while live).

This unit is CSS-heavy with tiny JSX touches. It dispatches BEFORE N2/N3
(all N-wave units touch `client/src/index.css` - strictly serialized).

FILES TO TOUCH:
- client/src/index.css                    (the bulk - see CHANGE 1-6)
- client/src/pages/DashboardPage.jsx      (add Home masthead JSX)
- client/src/pages/SessionsPage.jsx       (h1 gets className="page-title")
- client/src/pages/MyTemplatesPage.jsx    (h1 gets className="page-title")
- client/src/pages/AnalyticsPage.jsx      (h1 gets className="page-title")
Do NOT modify anything outside these files. In particular do NOT touch
Navbar.jsx, BottomNav.jsx, Layout.jsx, or PersistentWorkoutBar.jsx - every
behavior change in this unit is CSS-side.

CHANGE:

1. **Hide the top bar on mobile, logged-in only** (CSS only). In the
   existing `@media (max-width: 719px)` block (~line 676):
   - REPLACE the `.nav-main-links, .nav-profile-link { display: none; }`
     rule and the `.nav-inner { gap: 0; padding-bottom: 4px; }` rule with:
     `.app:has(.bottom-nav) .nav { display: none; }`
     (BottomNav renders null when logged out, so any logged-out page under
     Layout keeps the full top nav with Login/Register. Do NOT remove the
     `@media (max-width: 420px)` `.nav-main-links` overflow rules - they
     still serve that logged-out case.)
   - `.main` gains mobile top padding for the removed bar + notch safety:
     `padding-top: calc(12px + env(safe-area-inset-top, 0px));`
   - Live-session sticky exercise headings currently clear the old nav via
     `--session-sticky-top: 64px` (~line 2711). Add a mobile override so
     they stick to the viewport top:
     `.session-detail-page { --session-sticky-top: env(safe-area-inset-top, 0px); }`

2. **Home masthead** (mobile-only). In `DashboardPage.jsx`, render as the
   FIRST child of the `.stack.workout-tab` div (above the saved-flash):

   ```jsx
   <header className="home-masthead">
     <div className="home-masthead__brand">
       <span className="home-masthead__crown" aria-hidden="true" />
       <h1 className="home-masthead__wordmark">LogChamp</h1>
     </div>
     <p className="home-masthead__date">{mastheadDate}</p>
   </header>
   ```

   where `mastheadDate` is computed inline in the component:
   `new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })`
   (e.g. "Friday, July 4"). CSS (tokens only):
   - `.home-masthead` is `display: none` at `min-width: 720px` (desktop nav
     already carries the brand; Home there is unchanged).
   - `.home-masthead__brand`: inline-flex row, gap ~8px, items centered.
   - `.home-masthead__crown`: reuse the EXACT crown mask technique from
     `.brand--subtle a::before` (same data-URI mask, `background-color:
     var(--color-interactive)`), sized ~1.15em square against the wordmark.
   - `.home-masthead__wordmark`: ~1.35rem, weight 800, letter-spacing
     -0.03em, margin 0, `color: var(--color-text)`.
   - `.home-masthead__date`: muted small treatment
     (`var(--color-text-secondary)`, ~13px), margin 2px 0 0.
   - No border, no card - it sits directly on the page background like a
     native app header. Restraint: no animation.

3. **Page-title standardization.** Add `.page-title` to the existing
   `.settings-page-title` declaration (i.e. the selector becomes
   `.settings-page-title, .page-title { ... }` - one shared declaration,
   values unchanged). Then add `className="page-title"` to exactly three
   h1s: `SessionsPage.jsx` ("History"), `MyTemplatesPage.jsx` ("Programs"),
   `AnalyticsPage.jsx` ("Analytics"). NOTE: this is the one intentional
   desktop-visible change in this unit (those three titles shrink slightly
   to match Profile's title treatment - a deliberate consistency win).

4. **Scene band lift** (mobile). Both scene layers are `position: fixed`
   pseudo-elements with `inset: 0`; raising their `bottom` moves the
   `center bottom`-anchored artwork AND its overlay gradients up together.
   SOURCE-ORDER WARNING: the base rules set `inset: 0` (shorthand includes
   `bottom`), so each override MUST appear AFTER the base rule it overrides
   - do not add these to the existing mobile media block at ~line 676.
   - Immediately after the global scene section (after the auth scene-token
     declarations, ~line 444), add:
     ```css
     @media (max-width: 719px) {
       body:has(.bottom-nav)::before {
         bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
       }
     }
     ```
     (`:has(.bottom-nav)` gates the lift to logged-in mobile; logged-out
     pages have no bottom bar and keep the full-viewport layer.)
   - Immediately after the `html[data-theme="dark"] .workout-tab::before`
     rule (~line 3552), add:
     ```css
     @media (max-width: 719px) {
       html[data-theme="dark"] .workout-tab::before {
         bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
       }
     }
     ```
   - Recompute `.workout-tab.stack`'s mobile min-height (~line 3599) for the
     removed top bar:
     `min-height: calc(100dvh - var(--bottom-nav-height) - env(safe-area-inset-bottom, 0px) - env(safe-area-inset-top, 0px) - 1.75rem);`
     (1.75rem = 12px main top padding + 16px of the main bottom padding that
     sits above the bar.)

5. **Live-workout bar: empty-wrap fix + mobile docked pill** (CSS only).
   - All viewports, next to the `.persistent-workout-bar-wrap` rule:
     `.persistent-workout-bar-wrap:not(:has(.persistent-workout-bar)) { display: none; }`
     (kills the phantom strip on every page with no live workout).
   - New `@media (max-width: 719px)` block placed AFTER the existing
     `.persistent-workout-bar*` rules (~line 4100s):
     - `.persistent-workout-bar-wrap`: `position: fixed; top: auto;
       bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
       left: 0; right: 0; z-index: 5; padding: 0 10px 8px;
       background: transparent; border-bottom: none;`
     - `.persistent-workout-bar`: slim it to a single-line pill -
       `min-height: 44px; padding: 8px 12px;` and swap the solid card
       surface for frosted glass mirroring `.bottom-nav`:
       `background: color-mix(in srgb, var(--color-surface-1) 72%, transparent);
       backdrop-filter: saturate(1.1) blur(10px);`
       Keep `card--live`'s accent L-bar exactly as is (it means live - the
       semantics are the point).
     - `.persistent-workout-bar__left`: `flex-direction: row;
       align-items: baseline; gap: 8px;`
     - `.persistent-workout-bar__sub`: `display: none;`
     - `.persistent-workout-bar__title`: `white-space: nowrap;
       overflow: hidden; text-overflow: ellipsis;` (with `min-width: 0` on
       the flex parent if not already effective).
     - Content clearance while live: the pill overlays ~56px above the tab
       bar, so `.app:has(.persistent-workout-bar) .main` gets
       `padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 16px + 64px);`
     - On the live session detail page the pill is redundant (you are
       already in the workout) and would collide with the fixed finish dock
       (z-index 40): hide it there -
       `.app:has(.session-detail-page--live) .persistent-workout-bar-wrap { display: none; }`
   - Desktop (>= 720px) keeps today's below-nav sticky behavior untouched
     (apart from the empty-wrap fix, which is correct on all viewports).

6. **Tokens only.** No hex anywhere in the new CSS; every color routes
   through existing custom properties or `color-mix` on them, so all 4
   palettes x 2 modes inherit the treatment for free.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from client/ compiles with no errors.
- `grep -n "home-masthead" client/src/pages/DashboardPage.jsx` and
  `grep -n "home-masthead" client/src/index.css` both hit; the masthead
  renders crown span + h1 wordmark + date line as specced.
- `grep -n "page-title" client/src/pages/SessionsPage.jsx
  client/src/pages/MyTemplatesPage.jsx client/src/pages/AnalyticsPage.jsx`
  hits exactly those three h1s; `.page-title` shares the
  `.settings-page-title` declaration (one shared rule, not a copy).
- `grep -n "body:has(.bottom-nav)::before" client/src/index.css` hits, and
  the rule sets `bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))`;
  an equivalent mobile `bottom` override exists for
  `html[data-theme="dark"] .workout-tab::before` placed AFTER its base rule.
- `grep -n ":not(:has(.persistent-workout-bar))" client/src/index.css` hits
  (the empty-wrap display:none fix).
- `.app:has(.bottom-nav) .nav { display: none; }` exists inside the
  max-width 719px media block; the old `.nav-main-links, .nav-profile-link`
  mobile hide rule is gone.
- No new hex colors anywhere in the diff; no dependency changes
  (`client/package.json` byte-identical); no edits to Navbar.jsx,
  BottomNav.jsx, Layout.jsx, or PersistentWorkoutBar.jsx.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
