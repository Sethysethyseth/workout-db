# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

A-wave (Track A: structural exercise identity), authored July 7 (Fable),
branch `catalog-fk-wave` (off logging-ux-wave HEAD `80373e1`, which is
main `3767840` + one docs commit). Everything prior (L-wave, T3B) is
MERGED TO MAIN - see Landed.

**A1 LANDED `3a6bc25` (Fable direct, July 7):** Exercise catalog table +
idempotent seed, reconciled by hand from the stale `exercise-catalog-seed`
branch (migration re-timestamped 20260527 -> `20260707120000_add_exercise_
catalog` - the old row was never on prod and test resets wiped it from
staging; seed wired via prisma.config.ts `migrations.seed`, Prisma 6.19
shape, NOT the deprecated package.json block; main's `test:unit` script
preserved). Unit lane 119/119 + `prisma validate` green. Standalone model,
no FKs - deploy-safe before its migration.

QUEUED | a4-exercise-fk-linkage.md | nullable exerciseId/userExerciseId on
TemplateExercise/SessionExercise/BlockWorkoutExercise (+ CHECK at-most-one),
WorkoutSet.blockWorkoutSetId groundwork, write-path stamping helper, engine
userExerciseId tier | DISPATCH FIRST; schema snippet in the block is the
contract, do not improvise types. CRITICAL SEQUENCING: integration lane
forbidden in-block (pretest auto-migrates = gate violation)
QUEUED | a5-exercise-picker.md | GET /exercises/search (pure searchCatalog
module) + live-session typeahead that writes ids on commit; free text stays
first-class | GATED on A4 landed + staging migration choreography done
QUEUED | a6b-exercise-id-backfill.md | dry-run-default script stamping ids
onto historical rows; unresolved-names report feeds alias curation | same
gate as A5; disjoint files from A5 - batchable per v4

**Migration choreography for the wave (Seth, RUNBOOK "Schema-change
deploy", ask-first gate):** after A4 lands on the branch, apply to STAGING
in this order: (1) `20260707120000_add_exercise_catalog`, (2) `npx prisma
db seed` from server/ (FK values need catalog rows to exist), (3) A4's
`20260707130000_add_exercise_fk_linkage`. Only then: staging Render
redeploy, A5/A6b dispatch, integration lanes. PROD gets the same sequence
before the eventual main merge deploys (plus prod seed - a prod data op,
Seth by hand).

## Candidates (next units, not yet authored as blocks)

- A5B: extend the picker to template + block builders (after A5 proves the
  pattern in live sessions)
- A3 curation skim: the 29 secondary-less compounds the validator surfaced
  (content pass, not urgent; A5's lifting-subset filter already handles the
  category question mechanically)
- T4 motion (last unstarted U5 unit) - needs Fable design first
- T3C sprite loader upgrade: BLOCKED on Seth's Gemini frames landing in
  claudefiledrop/ (art direction + prompts settled July 6, see HANDOFF)
- (U11 "what's new" candidate PROMOTED into the L-wave July 5 and shipped
  as L5. Kept here as a pointer only.)
- (prod-migrate-l1-l3-prep.md task file DELETED July 7: Seth applied both
  prod migrations by hand July 6, verified with real checksums - the
  bundle-prep task was moot before dispatch; Cursor's
  `origin/cursor/prod-migrate-l1-l3-prep-0b4a` branch is likewise
  redundant, deletable whenever.)

## Landed

- LANDED 3a6bc25 | (A1, no task block - Fable direct) | Exercise catalog
  table + idempotent dbHostGuard-protected seed, reconciled from
  exercise-catalog-seed with re-timestamped migration | branch
  catalog-fk-wave; unit 119/119 + prisma validate green; migration NOT
  applied anywhere yet (wave choreography above)
- LANDED 73becdc | t3b-coldstart-lifter-loader.md | cold-start boot loader
  (the sole `tone="page"` LoadingState) swaps the breathing ring for the
  accent-tinted pixel lifter doing slow reps - mask-tint idiom, asymmetric
  rep motion + lockout glow, reduced-motion static fallback | MERGED TO
  MAIN `3767840`; deliberate placeholder pending the Gemini sprite upgrade
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
