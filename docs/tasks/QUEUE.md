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
Render redeployed. **A6 RESOLVED July 5 (Fable session, done directly not
relayed - `3f7fe14`, pushed):** curated alias layer (92 vendored aliases +
rationale doc in `server/data/`, guarded trailing-s plural fold, alias
tier in `resolveExercise` between exact match and unresolved). The July 5
smoke list now resolves 10/10; no schema, no migration, no API change.
**L6 and L3 now LANDED too** (`cac5999` + follow-ups `4d82311`/`ae49cbe`;
`fbb054b` with its UserExercise migration applied + verified on staging
July 6 - see the Landed rows). **L4 LANDED `62b3ec2` and L5 LANDED
`33d613d`, both July 6** (Seth dispatched ahead of the combined smoke -
his call; smoke covers them). **The L-wave is fully landed. Remaining
order: Seth's combined smoke
(L1+L2+L2B+A6+L6+wheel-fix+L4+L5+`/analytics/summary`) -> Fable pre-main
branch-diff review -> merge.** RESOLVED (July 6, later the same night):
the "second agent session" flagged during the L5 audit was a
Seth-directed Fable session doing two direct UX fixes off-queue
(explicitly scoped to avoid L4/L5 files; the L5 audit's
leave-it-out-of-the-commit call was correct). Both LANDED - `3a530a7`
(logged-out visitors skip the boot spinner, straight to /login) and
`c0d37fb` (resume-workout hero clears immediately on finish via a
sessions:changed event) - pushed, origin confirmed at `c0d37fb`, with
end-to-end Playwright verification against a local server on the
staging DB. See the Landed rows; they ride the same combined smoke +
pre-main review as the L-wave.

(N-wave fully landed on `ui-nav-overhaul`, cleared for merge, awaiting
Seth's "push to main" trigger phrase.)

## Candidates (next units, not yet authored as blocks)

- A5 exercise picker (UI, Cursor-suited once A4 FK design is done)
- (A6 name-resolution aliasing RESOLVED July 5, Fable direct - `3f7fe14`
  on `logging-ux-wave`; see Active section + the Landed row. Curation
  grows via `server/data/exercise-aliases.json` + its rationale doc,
  same-commit rule. Kept here as a pointer only.)
- (U11 "what's new" candidate PROMOTED into the L-wave July 5: skeleton
  built directly by Fable - `workoutdb-whats-new-seen` key, versioned
  releases in `client/src/data/whatsNew.js` - and the visual layer queued
  as L5. Kept here as a pointer only.)
- NOT queueable: A1 catalog merge (gated migration, Seth manual), A4 FK
  schema design (Claude-tier planning, not a Cursor unit)

## Landed

- LANDED c0d37fb | (no task block - Seth-directed Fable direct, off-queue) | resume-workout hero clears immediately after finishing: completeSession/deleteSession dispatch sessions:changed, ActiveSessionContext applies the completion/deletion locally (string-compared ids) then re-fetches | 2 files (sessionApi.js, ActiveSessionContext.jsx), disjoint from all L-wave units; verified end-to-end via Playwright (local server on staging DB): finish -> home shows Start hero + saved flash + workout in Recents with no poll wait; rides the combined smoke + pre-main review
- LANDED 3a530a7 | (no task block - Seth-directed Fable direct, off-queue) | logged-out first-open goes straight to /login instead of holding on the boot spinner while a cold server answers /auth/me: no stored authToken -> immediate redirect; /login self-heals valid-cookie/cleared-storage by bouncing signed-in users onward; definitive /auth/me 401 clears the dead token | 3 files (ProtectedRoute.jsx, AuthContext.jsx, LoginPage.jsx); verified end-to-end via Playwright: fresh profile -> instant /login, logout -> instant /login, logged-in reload + /login visit both land on the dashboard
- LANDED 33d613d | l5-whats-new-visuals.md | patch-notes visual treatment: hero accent band (gradient wash + 3px top rule), small-caps accent section headers with left bars, diamond list markers, overlay-fade + 12px card-rise entrance at --motion-base, reduced-motion opt-out, mobile bottom-sheet, pinned footer outside scroll; archive cards reuse the treatment | landed July 6 (Fable audited); scope exact (4 files); build + unit 119/119 fresh; zero hex in added CSS, motion/color tokens verified defined; whatsnew gate/storage/data untouched (seen-key single-hit confirmed); WhatsNewContent split into presentation subcomponents; visual sign-off deferred to Seth's combined smoke (4 palettes x 2 modes, 360px)
- LANDED 62b3ec2 | l4-custom-exercise-ui.md | "Add to library" sheet: portal overlay (start-workout-picker z-80 tier), prefilled name, 17-muscle tap-chip picker (off -> Main -> Assists), live summary line, already-tracked guard, interactive "Not tracked - add?" pill in live sessions only; success invalidates + re-resolves so the indicator flips without reload | landed July 6 (Fable audited); scope exact (4 files, FILES TO TOUCH match); unit 119/119 + client build re-run fresh; no hex (0 matches in 207-line CSS diff), all 10 referenced tokens verified defined; client muscle constant verified 17/17 identical to server catalog-derived vocabulary (getMuscles fetch doubles as availability check - accepted, block itself prescribed the client-side grouping constant); manual contract deferred to Seth's combined smoke
- LANDED fbb054b | l3-custom-exercises-server.md | UserExercise schema + CRUD + engine resolver/attribution overlay | landed July 5, scope exact (12 files); one accepted deviation: userId String not the block's Int (User.id is String cuid - the block's snippet was a wrong FK); unit lane 119/119, purity grep clean, integration tests written but NOT run (migration gate); UserExercise migration applied + verified on staging July 6 (Seth, RUNBOOK, same precedent as L1) after the review caught the same code-ahead-of-DB sequencing flag as L1
- LANDED cac5999 | l6-logging-focus-interruptions.md | draft-row focus handoff on set promotion + server-echo resync suppression + layout-stable tracked-pill slot + reps step fix | landed July 5, clean delivery (2 files); same-wave follow-ups fixed directly: wheel-scroll decimal bug 4d82311 (onWheel blur on both number inputs), residual promotion glitch ae49cbe (div-vs-Fragment branch type change remounted the draft row - unified shell + stable slot key; L6's rAF refocus hack removed as dead)
- LANDED 3f7fe14 | (A6, no task block - Fable direct) | colloquial-name alias layer: 92 curated vendored aliases + rationale doc + guarded plural fold; alias tier in resolveExercise (exerciseId > exact name > alias) | unit lane 111/111 (8 new tests incl. the 10-name smoke list pinned 10/10); integration lane deliberately NOT run (endpoint untouched, avoids wiping staging smoke accounts pre-sign-off); no client change, no schema, no migration
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
