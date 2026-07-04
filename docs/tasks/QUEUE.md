# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

- QUEUED | n3-analytics-subviews.md | analytics page reorg: persistent header (chips + StatTiles) + Muscles\|Strength\|Execution segmented sub-views via ?view= param; DataQuality always visible | N-wave unit 3; dispatch after N2 lands; pure page reorg, section components untouched

(U10/U8/U9 wave landed and merged with analytics-engine; analytics-engine ->
main merge done July 4; T3 below moved to Landed)

## Candidates (next units, not yet authored as blocks)

- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- A6 name-resolution backfill/aliasing (Cursor-suited, needs A4 first)
- U11 "what's new" one-time announcement modal (decided July 3, Sonnet
  session): per-device via `localStorage`, versioned/reusable (not a
  one-off) so future releases just bump a constant + add bullets. New key
  must follow the `workoutdb-` prefix convention (see `workoutdb-theme`/
  `workoutdb-palette` in `ThemeContext.jsx`) per the rename-boundary rule in
  AGENTS.md - display text is LogChamp, identifiers stay WorkoutDB. First
  content: the 5-palette rollout (champ/iron/chill/forest/crimson) + the
  analytics engine. Cursor-suited once Fable authors the block.
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

- LANDED 4dcd829 | n2-profile-hub.md | Profile becomes identity header (avatar/name/member-since) + stat strip (workouts/this week/week streak) + drill-in Appearance/Security/Feedback sub-routes | scope exact (9 files), build green, no hex, package.json byte-identical; profileStats.js weekStreak/countThisWeek contract verified 5/5 by direct node eval; sub-pages confirmed verbatim extractions (same classes/api calls) against pre-N2 ProfilePage.jsx; copy fix "Help improve LogChamp." present, old string gone; parseReviewerEmails centralized, Navbar diff is import-swap only
- LANDED b366e17 | n1b-mobile-chrome-fix.md | scene band lifted flush above tab bar; mobile top bar removed (Home masthead + page-title standardization); resume bar as frosted pill above tabs; empty-wrap phantom strip fixed | scope exact (5 files), build green, no hex, no new deps; reviewer fix: session-sticky-top mobile override was dead (placed before the base rule, same specificity - source order decides), relocated after it; block's own placement spec caused it, not a Cursor error
- LANDED d266242 | n1-bottom-tab-bar.md | mobile bottom tab bar (Home/Analytics/History/Library/Profile) + slim top bar; desktop nav unchanged; shared useGuardedNav hook | on branch ui-nav-overhaul (not main/staging-pointed yet); scope exact match, build green, no hex, no new deps, guard logic consolidated to one file; one acceptance-criterion string (literal `tryNavigate` grep hit in Navbar.jsx) didn't literally match since Navbar only needs `guardedClick` - substantive intent (single guard location, zero behavior change) verified independently, not bounced
- LANDED de03801 | t3-dynamic-loading-screens.md | animated soft-tone (pulsing three-dot indicator) + page-tone (breathing accent ring, cross-faded label/slowLabel swap) + slowLabel="Waking up the server..." wired onto all 10 LoadingState call sites | on branch ui-loading-screens (not main/staging yet); review clean - scope exact, hook/props untouched, no hex, no new deps, build green; timing skeleton (useDelayedReveal) built directly by Claude Code same session, block covered visual/animation layer only
- LANDED d21608c | u10-home-hero-dead-space.md | home layout fix (align-content: start) + weekly-report set-count formatting | Cursor ran U10/U8/U9 in ONE working tree (against the serialized-dispatch plan) - reviewed and committed together; reviewer added the rounded-delta tone fix
- LANDED d21608c | u8-volume-trend-strength-sparklines.md | volume Bars|Trend|Table small multiples + strength e1RM sparklines | reviewer fixes: sparkline dots as non-scaling round-cap strokes (circles stretched to ellipses under preserveAspectRatio=none), single-session dot centered + no duplicate value, mvt last-week label moved to a fixed third grid column (was overflowing the card edge)
- LANDED d21608c | u9-execution-legibility-balance-polish.md | execution verdict + planned-vs-did line; balance zone band + ghost tracks | reviewer fixes: weight formatting in formatPlanActual failed the block's own acceptance string ("100.0 lbs" vs "100 lbs"), newsy verdict clauses now outrank on-plan filler, sub-rep effort drift no longer reads "stopped ~0 reps early"

- LANDED f22989d | u7-home-weekly-report.md | weekly report band on Home (last-7-days vs prior-7-days, under the hero) | review clean (build re-run, no-hex grep, sessions endpoint unlimited); Seth smoked it July 3 on staging - band accepted, two layout/formatting critiques spun off as U10
- LANDED c7acb43 | b9-analytics-time-series.md | weekly volume series + per-session e1RM series + execution planned/actual summaries | reviewer tightened the inclusive-end bucket assertion; 103/103 unit lane
- LANDED 00c67dc | b8-rpe-effort-pooling.md | RPE pooled with RIR as one effort signal engine-wide
- LANDED d4b1d72 | u6-weight-unit-pref.md | lbs/kg display pref in log prefs + analytics
