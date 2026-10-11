# TASK MXF7: critic round 3 app fixes (no native confirm leaving a live workout, History-to-workout header jump, builder menu icons, copy, tap targets, small layout jumps)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Critic round 3 of 3 after MXF3 scored 5/10. The coach findings go to a
parallel block (MXF6) in another lane. This block owns the rest. Full
report: `docs/tasks/mxf3-critic-round-3-FINDINGS.md` (R3-x IDs below;
screenshot names refer to a gitignored folder you do not need). Stay inside
FILES TO TOUCH: MXF6 is editing the coach files, `SessionsPage.jsx` and
`AiConnectorPage.jsx` at the same time. Do NOT edit ROADMAP.md (both blocks
would collide on it); the reviewer updates it at landing.

CHANGES:
1. R3-4 (P2): on a live quick workout, every bottom-nav tab raises a native
   `window.confirm` ("You have a workout in progress. Leave this screen?..."),
   from `useGuardedNav` (`client/src/lib/useGuardedNav.js`) via
   `confirmLeaveLiveSession` (`client/src/lib/confirmLeaveLiveSession.js`).
   Meanwhile the in-page Back, browser Back and the coach bar's Read all
   leave without asking. The workout stays live and is one tap away (the
   workout bar's Resume, the Home card). Opus-seat decision: leaving through
   the nav works like Back. No dialog, native or in-app. The tap just
   navigates. Before it leaves, any set value typed but not yet saved (a
   draft still inside its debounce) must be saved. Use the same path that
   saves drafts on blur, and prove it: typing a weight and immediately
   tapping a tab keeps that weight. Remove the native confirm wherever
   else it is called for this purpose. If you find a flow where leaving
   would genuinely lose data, keep a guard there, as the in-app
   `ConfirmPanel`, and list it.
2. R3-5 (P2): opening a workout from History shows a placeholder header
   (the row's title, e.g. "Lower A / Tue 14...") that swaps to "Back /
   Workout summary" and jumps 46 px down. The workout's own name is then
   missing from the loaded header. Fix it in `SessionDetailPage.jsx`'s
   loading / preview-header path (MXF1 added it; the MX6 FLIP lands on it).
   The placeholder and the loaded header have the same layout and the same
   title text, so nothing jumps (<= 2 px) when data arrives. The loaded
   completed-workout header shows the workout's name. Keep the MX6 grow
   animation and its timings.
3. R3-6 (P2): the block builder's "..." menu buttons are text glyphs about
   5 px low in their circles. Add a `more` (three dots) icon to
   `client/src/components/GlyphIcon.jsx` (you own this file in this round)
   and use it. Centred within 1 px.
4. R3-13 (P3): workout summary exercise titles are still ragged (R2-9). The
   "01"/"02" index has `tabular-nums`, but the font has no tabular figures
   (widths 14.27 vs 16.72-17.14 px). Give the index a fixed inline size, so
   every title starts at the same x (within 0.5 px).
5. R3-14 (P3): Library's running-strip skeleton is 58 px, but the strip is
   71 px, so the tabs and list jump 13 px at about +1.3 s. Make the
   skeleton match the loaded strip's height (both with a running block and
   without). On first paint, the skeleton's order must not show a
   different block first than the loaded list does.
6. R3-16 (P3) copy (plain words, no em dashes, per the QOL design rules):
   - live logger subtitle "Live session — updates save as you go.
     One-time session." -> no em dash
   - the summary "One-time session—saved in History only, not as a
     reusable workout." -> no em dash
   - the auto-name "Workout — Oct 11" shown in the in-progress bar: no em
     dash in the DISPLAY. If the name is stored on the session, change the
     display formatting only, and say what you found.
   - Analytics Data quality "2 set(s) in this range..." -> real plural
   - Analytics chip "Why has lats gone quiet?" -> correct verb agreement
     for plural muscle names (fix the generator, not the one string)
   - Home "No workouts yet in the last 7 days - the 7 days before you
     logged 2." -> say 2 what
   - Library "Create workout PARKED" -> plain words a lifter understands,
     or hide the parked action
7. R3-17 (P3) tap targets: the "← Profile" back link (76x28 on all 6
   Profile sub-pages and What's New), Home "See analytics →" (83x17) and
   "View all → History" (99x17), the run page "Library" link (53x16), and
   the Analytics range pills (36 px tall) all get >= 44 px hit boxes. Use
   padding or a pseudo-element; the visual size can stay.
8. R3-18 (P3): the block builder's name field has no inner padding (the
   placeholder sits 4 px from the focus ring) and autofocuses. On a phone,
   tapping New block throws the keyboard up. Give it the house input
   padding. Do not autofocus it on touch devices (`pointer: coarse`).

GUARDRAILS:
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only. Tokens only (check-hex clean). All 5 palettes x light/dark.
- THE LOGGER IS THE FLOOR: no new delay on any input. Item 1's save
  before leaving must not block or slow the navigation noticeably.
- Do not touch the coach files, `SessionsPage.jsx`, `AiConnectorPage.jsx`,
  `coachApi.js`, `CoachSessionContext.jsx`, any `server/` file, the
  keyboard fits, or MXF4's set-slot identity (`quickSetSlots.js`).
- Nothing a page does today goes missing.

FILES TO TOUCH:
- `client/src/lib/useGuardedNav.js`, `client/src/lib/confirmLeaveLiveSession.js`
- `client/src/components/layout/BottomNav.jsx`, `client/src/components/layout/Navbar.jsx`
  (only if the guard lives there too)
- `client/src/pages/SessionDetailPage.jsx`
- `client/src/components/GlyphIcon.jsx`
- `client/src/components/blocks/builder/` (menu icons, name field)
- `client/src/components/blocks/run/` (Library link tap target)
- `client/src/pages/DashboardPage.jsx`, `client/src/pages/AnalyticsPage.jsx`,
  `client/src/pages/MyTemplatesPage.jsx`, `client/src/pages/ProfilePage.jsx`,
  `client/src/pages/profile/` EXCEPT `AiConnectorPage.jsx`
- `client/src/components/analytics/`, `client/src/components/workout/`
- `client/src/lib/` (copy helpers: plurals, auto-name display, the chip
  generator), except `quickSetSlots.js`, `visibleBand.js`, `coachKeyboardFit.js`
- `client/src/index.css`, `client/src/styles/` EXCEPT `coach-page.css`,
  `coach-working-bar.css`, `ai-wait.css`, `ai-access.css`, `coach-history.css`
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (the Opus seat re-runs round 3's repros on the real app
at landing):
- `npm run build` from `client/` passes; `node scripts/check-hex.mjs` exits
  0; `npm run test:unit` from `server/` green (verbatim output for all three).
- `git status --porcelain --untracked-files=all` lists only FILES TO TOUCH;
  nothing under `server/`, `client/src/components/coach/`, or the
  excluded files.
- Item 1: `rg -n "window.confirm" client/src` lists every remaining native
  confirm, with why each one stays (or none). DELIVERY.md shows the
  draft-save-before-leave path.
- Item 2: DELIVERY.md shows the placeholder header and the loaded header,
  with the same structure and title source.
- Items 3-8: one section each with what changed, file and lines, how it
  was verified. Say plainly what was and was not browser-verified (the
  lane has no `server/.env`).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
