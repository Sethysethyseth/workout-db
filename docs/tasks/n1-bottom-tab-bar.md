# TASK N1: Bottom tab bar on mobile + slim top bar

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
First unit of the N-wave navigation overhaul (decided July 4, Fable session).
The app currently uses a website-style top nav on all viewports. On mobile
(< 720px) navigation moves to a fixed bottom tab bar (the app-standard
pattern for workout trackers - thumb reach mid-set); the top bar slims to
brand-only. Desktop (>= 720px) keeps the existing top nav EXACTLY as today.
Do NOT combine this unit with N2/N3 - they are dispatched serially because
all three touch `client/src/index.css`.

FILES TO TOUCH:
- client/src/components/layout/BottomNav.jsx   (NEW - the bottom tab bar)
- client/src/components/layout/Navbar.jsx      (extract guard logic, hide
                                                tab row + Profile link on
                                                mobile via CSS class only -
                                                desktop rendering unchanged)
- client/src/lib/useGuardedNav.js              (NEW - shared hook, see below)
- client/src/components/Layout.jsx             (mount BottomNav)
- client/src/index.css                         (bottom-nav styles + mobile
                                                layout adjustments)
Do NOT modify anything outside these files.

CHANGE:

1. **Extract the live-session guard into `useGuardedNav()`** (new file
   `client/src/lib/useGuardedNav.js`). Move `Navbar.jsx`'s `tryNavigate`
   logic (including `isSessionDetailPath`) into a hook that returns
   `{ tryNavigate, guardedClick }` where `guardedClick(to)` is the
   `onClick` handler factory both navs use (the current per-link pattern:
   no-op when guard inactive or already on the target path, else
   preventDefault + tryNavigate). It composes `useNavigate`, `useLocation`,
   `useSessionLiveLoggingGuard`, and `confirmLeaveLiveSession` exactly as
   Navbar does today. Navbar switches to the hook with ZERO behavior change.

2. **New `BottomNav` component** (`client/src/components/layout/BottomNav.jsx`),
   mounted in `Layout.jsx` after `<main>`. Five items, in this exact order:

   | Label     | To          | NavLink props        |
   |-----------|-------------|----------------------|
   | Home      | /           | end                  |
   | Analytics | /analytics  | end                  |
   | History   | /sessions   | end                  |
   | Library   | /templates  | (prefix match, like the top nav) |
   | Profile   | /profile    | (prefix match)       |

   Each item is a `NavLink` containing an inline SVG icon + a small text
   label, wired through `useGuardedNav().guardedClick` with the same
   already-on-path short-circuits the top nav uses. Use these exact icons
   (24x24 viewBox, `fill="none" stroke="currentColor" stroke-width="1.8"
   stroke-linecap="round" stroke-linejoin="round"`, `aria-hidden="true"`):

   - Home:      `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.6V20h13V9.6"/>`
   - Analytics: `<path d="M5 20v-7"/><path d="M10 20V7"/><path d="M15 20v-4"/><path d="M20 20V4"/>`
   - History:   `<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`
   - Library:   `<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>`
   - Profile:   `<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/>`

   The "Dev feedback" reviewer link does NOT get a bottom tab (it stays
   desktop-top-nav only; N2 gives it a mobile home inside Profile).

3. **CSS** (tokens only, no hex; follow the `--color-interactive` +
   `color-mix` accent pattern used by `.links a.active`):
   - `.bottom-nav`: `position: fixed; bottom: 0; left: 0; right: 0;
     z-index: 5;` same translucent surface treatment as `.nav`
     (color-mix surface + top border + backdrop blur, mirrored).
     `padding-bottom: env(safe-area-inset-bottom)`. Five equal cells
     (flex or grid), each a column of icon over an ~11px label,
     min tap target 44px tall.
   - Active state: icon + label switch from `var(--color-text-secondary)`
     to `var(--color-interactive)`; keep it restrained (color change +
     font-weight is enough - no pills, no bouncing; motion anti-goal).
   - Visibility: `.bottom-nav` is `display: none` at `min-width: 720px`.
     At `max-width: 719px`: hide `.nav-main-links` and `.nav-profile-link`
     (CSS only - do not change what Navbar renders on desktop), and give
     `.main` bottom padding `calc(<bar height> + env(safe-area-inset-bottom) + 16px)`
     so no page's content or footer is ever obscured by the bar. Define the
     bar height once as a custom property (e.g. `--bottom-nav-height`) and
     reuse it in both places.
   - Adjust `.workout-tab.stack`'s `min-height: calc(100dvh - 7.5rem)`
     under the mobile breakpoint to account for the shorter top bar +
     bottom bar so the Home tab still fills the viewport without forcing
     a scroll on an empty screen.
   - The mobile top bar keeps only the brand row; kill the now-empty
     spacing so it doesn't reserve height for the removed tab row.

4. **Do not touch** `PersistentWorkoutBar` (it stays where it is, under the
   top bar) or any portal/modal component. Verify visually via the build
   only; z-index for `.bottom-nav` stays at 5 so existing modals/popovers
   (which render above the current `.nav`) also clear the bottom bar.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from client/ compiles with no errors.
- `grep -n "tryNavigate" client/src/components/layout/Navbar.jsx` shows the
  hook usage, and the guard logic exists exactly once, in
  `client/src/lib/useGuardedNav.js`.
- BottomNav renders exactly 5 NavLinks in the order Home, Analytics,
  History, Library, Profile with the routes above.
- No new hex colors anywhere in the diff (`grep -E "#[0-9a-fA-F]{3,6}" `on
  changed CSS lines comes back clean); no dependency changes
  (`client/package.json` byte-identical).
- `.bottom-nav` CSS contains `env(safe-area-inset-bottom)` and is hidden at
  `min-width: 720px`; `.main` gains the mobile bottom padding via the shared
  custom property.
- Desktop DOM output of Navbar is unchanged (same elements, same labels,
  including Workout/Library/History/Analytics + Profile + conditional Dev
  feedback) - only the onClick wiring may differ internally.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
