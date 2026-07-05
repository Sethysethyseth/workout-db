# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

L-wave (logging + exercise-library UX), authored July 4 (Fable), branch
`logging-ux-wave` (off ui-nav-overhaul HEAD). Extended July 5 (Fable) with
L2B (indicator visibility, from Seth's smoke feedback) and L5 (What's New
visuals - skeleton built directly by Fable same session, T3 pattern).
L2B, L2, and L1 all LANDED; L1's migration applied + verified on staging,
Render redeployed - Seth's combined smoke sign-off on L1+L2+L2B
(`ef4ac98`) still pending mechanically, but the smoke ALSO surfaced the
A6 resolution-gap finding below (real "Bench press" reads "Not tracked" -
catalog has no bare-name entries, 9/10 common lift names fail to
resolve). **L3/L4/L5 DISPATCH PAUSED pending a Fable session to design
A6** (Seth's call, escalated rather than patched or deferred - see
HANDOFF.md "resolution gap found" session log for full root-cause
writeup). Once A6 is designed and queued: L3 still carries the
UserExercise migration (Seth applies to staging before L4; Cursor must
NOT run `npm test` in L3); L4/L5 both touch index.css, and L4's entry
point builds on the L2B pill (landed) - dispatch order L3 -> L4 -> L5
still strictly serialized once resumed, with A6 slotting in wherever
Fable decides (before L3, alongside it, or after - open question).

- PAUSED | l3-custom-exercises-server.md | UserExercise schema + CRUD + engine resolver/attribution overlay | Fable-designed schema; Cursor must NOT run npm test; dispatch paused pending A6 design decision (see above)
- QUEUED | l4-custom-exercise-ui.md | "Add to library" sheet: name + tap-chip muscle picker (Main/Assists), flips indicator live | needs L3 migration applied to staging first; entry-point wording updated for the L2B pill
- QUEUED | l5-whats-new-visuals.md | Overwatch-patch-notes visual treatment for the What's New modal + archive page | skeleton already committed (data/storage/gate/modal/page); MODEL fable - visual judgment; release copy in whatsNew.js is DRAFT, Seth finalizes at merge time

(N-wave fully landed on `ui-nav-overhaul`, cleared for merge, awaiting
Seth's "push to main" trigger phrase.)

## Candidates (next units, not yet authored as blocks)

- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- **A6 name-resolution backfill/aliasing — PROMOTED to blocking, July 5
  (Sonnet finding, Seth escalated to Fable).** No longer a someday-item:
  L2/L2B smoke showed 9/10 common lift names (bench press, squat,
  deadlift, overhead press, pull up, push up, bent-over row, curl, lat
  pulldown) fail to resolve against the catalog verbatim - only fully
  qualified variant names exist, no alias field anywhere in
  `server/data/exercises.json`. Needs a Fable session to design the fix
  (alias table vs. new column vs. client-side synonym map) before L3/L4
  dispatch resumes on `logging-ux-wave`. Full root-cause writeup in
  HANDOFF.md's "resolution gap found" session log.
- (U11 "what's new" candidate PROMOTED into the L-wave July 5: skeleton
  built directly by Fable - `workoutdb-whats-new-seen` key, versioned
  releases in `client/src/data/whatsNew.js` - and the visual layer queued
  as L5. Kept here as a pointer only.)
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

- LANDED ef4ac98 | l2b-tracked-indicator-visibility.md | tracked/untracked glyph becomes labeled status pills ("Tracked" / "Not tracked") on the exercise heading | scope exact (2 files), client build green, server unit 103/103 (no server touch), package.json byte-identical, no new hex (success-token family + existing color-mix pattern); labels present as JSX text children (grep for literal `>Tracked<` found nothing since that's compiled-HTML shape, not JSX source - verified by direct read instead, same precedent as N1's tryNavigate); pill moved out of the muted meta span per spec
- LANDED 4ae0fbf | l1-unilateral-side-logging.md | nullable WorkoutSet.side ("L"/"R"); exercises named "single" (or L/R toggle) log sets as Left/Right pairs, Right weight autofills from Left on blur (one-way, one-time, no focus steal); set-count/add/remove operate on pairs | scope exact (6 files), server unit 103/103 + client build green pre-migration, then migration applied to staging (Seth, RUNBOOK) and independently re-verified: `prisma migrate status` clean (13 migrations, no drift), full `npm test` 16/143 green including the side-round-trip integration test for real; reviewer flag caught pre-deploy: side is unconditionally in every create-set call, so deploying before the migration would break ALL set logging app-wide, not just per-side (sharper version of the June 8 code-ahead-of-DB incident) - migration landed first, no incident
- LANDED f66f9ea | l2-tracked-exercise-indicator.md | POST /exercises/resolve (batched, authRequired) + quiet check/hollow-circle indicator next to exercise headings, live + completed sessions | scope exact (6 files), server unit 103/103, client build green, integration 3/3 (401/400/happy path) re-run fresh; no client-side catalog duplication (the one grep hit is a pre-existing unrelated smartWorkoutName.js helper, not touched by this diff); package.json byte-identical, no new hex; module-level resolution cache + post-commit re-resolve verified by diff read
- LANDED f5767f8 | n3-analytics-subviews.md | analytics page reorg: persistent header (chips + StatTiles) + page-level Muscles\|Strength\|Execution segmented control via ?view= param; DataQuality always renders last | scope exact (3 files), build green, no hex, fetch effect deps unchanged ([weeks] only - confirmed by grep), package.json/other analytics/ files untouched; ?view=bogus and absent both default to muscles per spec
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
