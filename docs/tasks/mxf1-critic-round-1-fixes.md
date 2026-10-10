# TASK MXF1: Critic round 1 fixes (History transform, one skeleton language, Analytics replay, colors, copy)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
MX1-4 and MX5-6 landed. The MX critic scored the wave 7/10 and app-wide look
and feel 6/10 (was 5/10). The full report, with screenshot names and
measurements, is `docs/tasks/mx-critic-round-1-FINDINGS.md` - read it; the
items below are its top 10 plus its two bugs, minus one Seth held back.
Design of record stays `docs/design/mocks/motion/MOTION-DIRECTION.md`
(Seth's rulings at the top win) and `ROADMAP.md`. Keep ROADMAP.md current:
add an "MXF1" entry with status and a checkpoint line, exactly like the
MX units.

SETH'S RULINGS FOR THIS BLOCK (Oct 9):
- Do NOT change route/page transition speed (420ms) or the FLIP duration.
  Seth decides that after his smoke (critic fix #6 is OUT of scope).
- Analytics replay (critic #5): the full entrance (cascade, rolling
  numbers, bars charging, lines drawing) runs on the FIRST Analytics view
  of a browser session and on a range change. Coming back to Analytics in
  the same session renders at once with a short fade (~200ms); only values
  that actually changed roll.

CHANGES (one per critic item - the FINDINGS doc has the detail):
1. History -> session detail container transform (critic #1, #2): animate
   a SURFACE, not the header. A card-shaped surface (surface token,
   card radius and border) grows from the tapped row's rect to the header
   rect; header contents fade/cross-fade in; NO non-uniform scale on text
   ever. The grow starts ON TAP using the row's own data (title, date, top
   set, volume) - pass it with the navigation (router location state) and
   draw the header immediately while the rest loads in a skeleton. The rest
   of the page fades in after the surface lands. Back with a pending FLIP:
   no shared-axis slide (plain fade, like forward) and the shrink runs
   inside it, as ONE motion. Keep the existing durations.
2. One skeleton language (critic #3): no barbell "Loading..." caption under
   a skeleton (remove it, or show it only after ~2.5s as reassurance);
   session detail's loading state becomes a skeleton (back chip, title bar,
   3x2 stats grid, two exercise cards) instead of "Loading workout..." text.
3. Skeleton heights (critic #4): Home's "Last 7 days" skeleton matches the
   card's last rendered mode (remember compact vs full in sessionStorage);
   the Analytics skeleton includes the view-tab row so nothing drops on load.
4. Analytics replay per the ruling above (critic #5). Client-only session
   cache of the analytics response per range (stale-while-revalidate is
   fine); no server change.
5. Desktop masthead (critic #7): `scrollbar-gutter: stable` so the masthead
   stops shifting between pages; the wordmark lines up with the content
   column's left edge (same max-width + side padding as the page column).
6. Chart colors (critic #8): in crimson, progress must never read as alarm
   red - sparkline LINES go neutral (text-derived), only the end dot and the
   delta carry the up color; ONE up token for dot and text; the Muscles bars
   and other non-directional marks must not use crimson's danger-red accent
   (pick a palette-correct, non-alarm chart hue per palette via tokens);
   forest's up color differs from its accent by HUE, not just lightness.
7. Session summary (critic #9) - the COMPLETED summary only: drop the
   "Tracked" pill (tracked is the default); untracked becomes a quiet text
   link under the name ("Track this exercise"); the stats grid has no empty
   cell (5 stats laid out cleanly, or a real sixth stat).
8. Analytics copy + spacing (critic #10): no em dashes; Strength row meta as
   two fixed lines ("Top set 220 x 10, up 35 lbs" / "Matched effort up 47
   lbs at 3 RIR, 8 sessions") - no label said twice; empty-state copy that
   does not contradict the KPIs above it; Balance card head padding matches
   the other cards; plain copy over the Analytics strings ("2 sets" not
   "2 set(s)", "31d ago" or "last trained 31 days ago" not "last 31d ago",
   fix "the exercise catalog files every shoulder exercise").
9. Bugs: (a) the boot splash shows a second small "LogChamp" wordmark in a
   top bar pressed to the screen edge above the pixel splash - one wordmark
   only; (b) desktop History's month heading ("AUGUST 2026 / 16 workouts")
   sits on the bright scene band - give it a surface or scrim so it reads.

GUARDRAILS (same as every MX unit):
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only. Tokens-only (check-hex clean); all 5 palettes x light/dark.
- THE LOGGER IS THE FLOOR: in `SessionDetailPage` touch only the loading
  branch and the completed-session header/summary path. A live in-progress
  session renders and accepts input exactly as today - no new transition,
  no delay. A live History row never starts the grow.
- Navigation never waits on an animation; a tap mid-transition wins.
- Nothing a page does today goes missing (content, warnings, buttons).
- `prefers-reduced-motion: reduce`: the grow is skipped (fade), cascades
  collapse, skeletons do not shimmer.
- Phone first (390px), no horizontal scroll.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (MXF1 entry), `IDEAS.md`
- `client/src/components/motion/` (FLIP / surface helpers, route layer)
- `client/src/pages/SessionsPage.jsx`, `client/src/pages/SessionDetailPage.jsx`
  (see the logger rule), `client/src/components/workout/CompletedSessionSummary.jsx`
- `client/src/components/LoadingState.jsx`
- `client/src/pages/DashboardPage.jsx` and `client/src/components/analytics/WeeklyReport.jsx`
  (the weekly card's skeleton/mode memory only)
- `client/src/pages/AnalyticsPage.jsx`, `client/src/components/analytics/`,
  `client/src/styles/analytics-motion.css`
- `client/src/lib/` (new modules only, e.g. a session cache)
- `client/src/components/layout/`, `client/src/styles/shell-motion.css`
- wherever the boot splash lives (find it; touch only its wordmark markup/CSS)
- `client/src/index.css` (rules for the above only)
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable; the reviewer also checks each item
in a real browser):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (gitignored `.playwright-mcp/` aside); no package changes.
- No route/FLIP duration changed: `git diff` shows no edit to the 420ms
  route values or the FLIP duration constant.
- `rg -n "set\(s\)|—" client/src/pages/AnalyticsPage.jsx client/src/components/analytics`
  returns nothing (em dashes and "(s)" gone from Analytics strings).
- The FLIP code contains no `scale(` with two different factors applied to
  an element that contains text (DELIVERY.md shows the transform code).
- DELIVERY.md: one section per CHANGE item 1-9 with what changed, the file
  and lines, and how it was verified; the `SessionDetailPage.jsx` hunks with
  why none touches the live-logging path; ROADMAP MXF1 status; anything not
  done marked PARTIAL with a "pick up here" note.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
