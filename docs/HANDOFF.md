# HANDOFF — current state

**Updated:** July 4, 2026 (Fable — N1b LANDED (`b366e17`) on
`ui-nav-overhaul`, pushed: Cursor executed the block same session, Fable
reviewed (one dead-CSS-rule fix) and committed. Awaiting Seth's visual smoke
on the branch Vercel deploy before N2 dispatches. Earlier same day: N1
landed + smoked, T3 merged to `main` (`750c42b`).)
**Rule:** rewritten in place at the end of every working session. Dated, never versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy state from ground truth before trusting it.

---

## Repo / deploy state

- **`main` is at `750c42b`** (fast-forward: `ui-loading-screens` -> `main`,
  T3 dynamic loading screens), confirmed on `origin/main`. Merged + pushed
  July 4 (Sonnet session). `main` had not moved since the branch point, so
  `git merge --ff-only` applied cleanly - no worktree, no conflicts.
  Seth confirmed the Vercel preview of `ui-loading-screens` looked right
  (pulsing dots / breathing ring / label cross-fade) before triggering
  "push to main" - matches the standing visual-sign-off-before-merge rule.
  No schema/migration coupling (client + docs only, 15 files).
  Render/Vercel prod both track `main` and auto-deploy on push - **verify
  the prod deploy SHA is `750c42b` in Render/Vercel Events before assuming
  it's live.**
- **`main` was previously at `e9ce82c`** (merge: `analytics-engine` -> `main`, "analytics wedge (B1-B9) + UI polish wave (U6-U10)"). Merged July 4 (Sonnet session) via scratch `git worktree` (not stash+checkout — see the worktree-merge gotcha), pushed same session.
  - `git merge --ff-only` was NOT possible — `main`'s `ccd0829` (the ui-palettes-v2 merge commit) postdates `analytics-engine`'s branch point, so the branches had genuinely diverged. Did `git merge --no-ff analytics-engine` instead, matching how `ccd0829` itself was created.
  - **Two conflicts, both resolved by taking `analytics-engine`'s version whole:** `AGENTS.md` and `CLAUDE.md` (add/add — main still had the stale PRE-consolidation duplicated-gate versions of both files from before the July 1 single-source consolidation; `analytics-engine`'s versions are the current v3 ones and fully supersede them, no unique content lost).
  - Verified before committing the merge: server unit lane 103/103 green, client `npm run build` green, both run fresh in the worktree (had to `npm install` there — worktrees don't carry `node_modules`).
  - Pre-merge sign-off (Seth, July 4): smoke test on the d21608c UI wave passed; `analyticsController.js` `findMany` where-clause reviewed and confirmed as the single cross-user isolation point (sets reached only through a session scoped to `{ userId, performedAt }`); the two open forks below settled. **The Fable/Opus pre-main branch-diff review (mandated by the v3 workflow) was explicitly skipped this one time at Seth's instruction** — noted here so it isn't silently treated as having happened.
  - `ui-palettes-v2` (`ec3d85a`) was already fully contained in `analytics-engine` and is now merged too; deletable (branch deletion is gated — ask first).
  - No schema changes rode along — `analytics-engine`'s merge has no migration coupling. The separate `exercise-catalog-seed` branch (A1) still has its own gated migration track.
- **Render/Vercel not yet repointed from the `analytics-engine` staging deploy back to `main`** — RUNBOOK step 6 ("Repoint staging Render back to main. Verify redeploy SHA in Events.") is still open; do this before smoking prod.
- Username feature LIVE and verified on both environments (unchanged).

## Session log (July 4 latest+3 — N1b landed, Fable)

- **Cursor executed `n1b-mobile-chrome-fix.md`; Fable reviewed and committed
  (`b366e17`, 5 files, +129/-12), pushed to `origin/ui-nav-overhaul`.**
  Scope exact (the 5 specced files); client build green; no hex in added
  CSS; `client/package.json` untouched; every acceptance grep verified by
  direct diff read. Delivered: scene-band bottom-inset lifts (both placed
  correctly AFTER their inset:0 base rules), `.app:has(.bottom-nav) .nav`
  mobile hide, Home masthead (crown/wordmark/date, mobile-only), shared
  `.settings-page-title, .page-title` declaration on the three tab h1s,
  frosted resume pill + empty-wrap fix + live-session-page hide.
- **One reviewer fix:** the `--session-sticky-top` mobile override was DEAD
  as delivered - placed in the media block at ~line 692, but the base rule
  (`.session-detail-page { --session-sticky-top: 64px }`, ~line 2716) comes
  later in source order at equal specificity, so 64px won. Relocated the
  override to immediately after the base rule with a comment. Root cause
  was the BLOCK's own placement instruction (Fable spec imprecision), not
  a Cursor error - the block even warned about this exact hazard for the
  scene rules but missed it for this one.
- **Not yet done:** Seth's visual smoke of N1b on the branch Vercel deploy.
  Checklist: scene band flush on the tab bar (all palettes x dark, Home +
  a global-scene page like History), no top bar when logged in, masthead
  renders (crown tinted per palette), page titles consistent, resume pill
  while a workout is live (frosted, single line, band reads through),
  desktop unchanged, and the flagged finish-dock-covers-tabs question.

## Session log (July 4 latest+2 — N1 smoke critiques -> N1b authored, Fable)

- **Seth smoked N1 on the ui-nav-overhaul Vercel deploy.** Bottom tab bar
  ACCEPTED as-is ("absolutely beautiful" - do not restyle it). Two
  critiques: (1) the fixed bar buries the palette scene band (every scene
  anchors `center bottom` of the viewport, so the artwork's best part sits
  behind the frosted bar); (2) the slimmed mobile top bar is dead chrome
  (~30px strip, tiny brand, every page already opens with its own h1).
- **Review also found a pre-existing defect:** `.persistent-workout-bar-wrap`
  (index.css ~4098) paints an empty ~19px strip + border on every page even
  with no live workout (the inner bar returns null, the wrap always renders).
- **Three design forks put to Seth and settled:**
  1. Mobile top: NO top bar when logged in (hidden via
     `.app:has(.bottom-nav) .nav` so logged-out Layout pages keep Login/
     Register) + Home masthead (crown + wordmark + date, mobile-only) +
     `.page-title` standardization on History/Programs/Analytics h1s
     (shares the `.settings-page-title` declaration - the one intentional
     desktop-visible change).
  2. Scene band: LIFTED flush above the tab bar on mobile (bottom-inset
     override on both fixed scene pseudo-elements; source-order matters
     since the base rules set `inset: 0` - overrides placed after them).
  3. Live-workout bar: slim frosted single-line pill docked directly above
     the tab bar on mobile (Spotify pattern; translucent so the band reads
     through while live; hidden on the live session detail page where the
     finish dock owns the bottom). Seth specifically flagged the docked bar
     must not re-bury the scenery - hence pill + frost, not a full card.
- **`docs/tasks/n1b-mobile-chrome-fix.md` authored + QUEUED (MODEL: sonnet).
  Dispatch order is now N1b -> N2 -> N3** (all touch index.css, still
  strictly serialized). N2 has no collision with N1b (its only Navbar touch
  is the reviewerEmails import swap; N1b touches Navbar zero - all CSS).
- **Flag for the next smoke, not in N1b's scope:** during live logging the
  `.session-finish-dock` (fixed, z-index 40, bottom 0) fully covers the
  bottom tab bar - plausibly good (focus mode; the nav guard intercepts
  anyway) but Seth should confirm it reads as intended on device.

## Session log (July 4 latest+1 — N1 bottom tab bar landed, Sonnet)

- **Branch `ui-nav-overhaul` created off post-T3 `main` (`47bec4a`), pushed.**
  Also pushed the docs-only `47bec4a` commit itself to `origin/main` at
  Seth's explicit request (N-wave task-block authoring, no functional
  change).
- **Cursor executed `n1-bottom-tab-bar.md`; reviewed and committed
  (`d266242`, 5 files, +238/-88), pushed to `origin/ui-nav-overhaul`.**
  Scope exact match (the 5 expected files, nothing extra); client
  `npm run build` green; no hex in the new CSS; `client/package.json`
  byte-identical; guard logic (`isSessionDetailPath`, `confirmLeaveLiveSession`
  calls) consolidated into exactly one file, `client/src/lib/
  useGuardedNav.js`; Navbar's desktop DOM/behavior confirmed unchanged by
  direct diff read (all five links now route through `guardedClick(...)`
  instead of inline per-link handlers, zero behavior change). `BottomNav.jsx`
  renders the 5 tabs in spec order (Home/Analytics/History/Library/Profile)
  with the exact icon paths and end/prefix matching from the block.
  `.bottom-nav` hidden at `min-width: 720px`, uses
  `env(safe-area-inset-bottom)`, `.main` gets the mobile bottom padding via
  the shared `--bottom-nav-height` custom property; `.workout-tab.stack`'s
  mobile min-height adjusted to account for both bars.
  **One acceptance-criterion string didn't literally match:** the block's
  `grep -n "tryNavigate" client/src/components/layout/Navbar.jsx` expects a
  literal hit, but Navbar only calls `guardedClick` (which internally calls
  `tryNavigate` inside the hook) — the substantive intent (single guard
  location, hook-based extraction, zero behavior change) is satisfied and
  verified independently by reading the diff; treated as spec-wording
  imprecision, not bounced.
- **Not yet done:** Seth's visual smoke on the `ui-nav-overhaul` Vercel
  deploy (mobile bottom bar across viewports/palettes, desktop nav
  untouched) before N2 dispatches — N1/N2/N3 stay strictly serialized since
  all three touch `client/src/index.css`.

## Session log (July 4 latest — N-wave navigation overhaul authored, Fable)

- **Seth's ask: overhaul how the app's tabs/layout are used, rework the
  Profile section, and give the Analytics page real organization.** Four
  design forks put to Seth and settled (all recommended defaults accepted):
  1. **Bottom tab bar on mobile** (< 720px), slim brand-only top bar;
     desktop (>= 720px) top nav unchanged. The app-standard tracker
     pattern (thumb reach mid-set); the anti-goal is out-featuring
     Strong/Hevy on logging UX, not matching table-stakes ergonomics.
  2. **Tab order: Home · Analytics · History · Library · Profile** —
     Analytics promoted to slot 2 (it's the differentiator), Library
     demoted, Profile becomes a first-class 5th tab. "Workout" tab label
     renamed to "Home" (display text only).
  3. **Profile becomes a hub**: identity header (initials avatar, name,
     member-since from `/auth/me` `createdAt` — already in the payload,
     `sanitizeUser` strips only `passwordHash`), stat strip (workouts /
     this week / week streak, all client-derived from `/sessions/mine`),
     drill-in sub-routes for Appearance / Security / Feedback, logout
     footer. NO server changes anywhere in the wave.
  4. **Analytics reorganized into segmented sub-views**: persistent header
     (range chips + StatTiles) + Muscles | Strength | Execution segmented
     control, sub-view in `?view=` for deep-linking, DataQualitySection
     always visible (honesty contract). No "Overview" sub-tab — Home's
     weekly report already is the overview.
- **Three unit-scale task blocks authored and QUEUED** (all MODEL: sonnet,
  MODE: 1-relay): `n1-bottom-tab-bar.md` (BottomNav + shared
  `useGuardedNav` hook extraction + exact inline SVG icon paths provided
  in-block), `n2-profile-hub.md` (hub + 3 extracted sub-pages +
  `profileStats.js` pure helpers with a testable weekStreak contract +
  `reviewerEmails.js` extraction), `n3-analytics-subviews.md`
  (AnalyticsPage JSX reorg + AnalyticsViewTabs component; section
  components untouched). **Dispatch strictly serialized N1 -> N2 -> N3**
  — all three touch `client/src/index.css` (the U-wave lesson). Start the
  wave on a fresh branch off post-T3 `main` (suggest `ui-nav-overhaul`).
- Concurrent-session note: the T3 merge to main (`750c42b`) happened in a
  parallel Sonnet session while this session was authoring; HANDOFF/QUEUE
  edits were reconciled against ground truth (`origin/main` = `3a5e0c0`)
  before committing.

## Session log (July 4 earlier — T3 landed on ui-loading-screens, Sonnet)

- **Cursor executed `t3-dynamic-loading-screens.md`; reviewed and committed
  (`de03801`, 11 files, +162/-10), pushed to `origin/ui-loading-screens`.**
  Scope exact match to the block (the 10 expected files, nothing extra);
  `LoadingState.jsx`'s `useDelayedReveal` hook and props signature
  byte-identical to before (JSX-inside-branches + CSS only, confirmed by
  diff); `grep slowLabel="Waking up the server…"` hits exactly the 10
  expected call sites; no hex introduced; `client/package.json` unchanged;
  `npm run build` re-run green. Delivered: `tone="soft"` gets a subtle
  pulsing three-dot indicator (`loading-state__dots`, 1.2s cycle, color off
  `--color-interactive` via `color-mix`); `tone="page"` gets a breathing
  accent ring (`loading-page__mark`/`__ring`, 1.4s cycle) plus a
  cross-faded swap between `label` and `slowLabel` on the 4s escalation
  (opacity transition via `--motion-base`/`--ease-standard`, no layout
  jump - `loading-page__text-wrap` reserves space for both strings).
  `tone="card"` untouched as instructed. No dark-mode-specific override
  needed - all new colors route through existing theme-aware custom
  properties, so the token indirection alone covers both modes.
- **Seth visually smoked the Vercel preview of `ui-loading-screens` and
  signed off** (pulsing dots / breathing ring / label cross-fade all
  confirmed rendering as intended); triggered "push to main" verbatim.
  Merged fast-forward to `main` at `750c42b` (see Repo/deploy state above)
  - not a worktree merge, no conflicts, ran one command at a time per the
  gate (checkout main -> merge --ff-only -> push, each with explicit
  approval). Branch `ui-loading-screens` is now fully contained in `main`;
  deletable whenever Seth wants to ask for that gated op.
- **Open follow-up:** confirm the prod Render + Vercel deploy SHA reads
  `750c42b` in their Events tabs once they redeploy - not yet verified this
  session (see Open TODOs).

## Session log (July 4 later — T3 dynamic loading screens: skeleton built, Sonnet)

- **Seth's call for this session: Sonnet builds the T3 skeleton directly
  (not Fable) and authors the Cursor task block itself** - an explicit
  one-off departure from the v3 default (Sonnet doesn't normally author
  blocks); T3 was judged easy/mechanical enough not to need Fable's
  judgment pass first.
- **Timing skeleton DONE, build-verified, not yet committed:**
  `client/src/components/LoadingState.jsx` gained a local
  `useDelayedReveal(enabled, delayMs, slowMs)` hook implementing the cold-
  start spec from `WORKOUTDB_MASTER_PROMPT_17.md` ("Motion / loading"):
  nothing renders for the first 400ms (fast/cached loads never flash a
  loader), and after 4s more the displayed text swaps to an optional new
  `slowLabel` prop (the honest "still waking up" case). New `tone="page"`
  branch added (`.loading-page` / `.loading-page__text`, bare/centered,
  structural only - deliberately unstyled beyond layout) for the cold-start
  full-tab case, distinct from the existing compact inline `tone="soft"`
  and the untouched `tone="card"`. `ProtectedRoute.jsx` (the actual
  cold-start gate - first thing a user sits on while Render wakes up) now
  uses `tone="page"` with `slowLabel="Waking up the server…"`. Existing 9
  call sites unchanged/backward-compatible (prop defaults preserve old
  behavior). `client/npm run build` green.
- **Visual/animation layer handed to Cursor:** `docs/tasks/
  t3-dynamic-loading-screens.md` authored and QUEUED (MODEL: fable - this
  is genuinely judgment-heavy visual design, not mechanical). Scope: design
  the actual animated/satisfying treatment for the `soft` and `page` tones
  (token-only, all 4 palettes x 2 modes, restrained per the anti-goal on
  over-built motion), plus wire `slowLabel="Waking up the server…"`
  (exact string) onto the remaining 9 `<LoadingState>` call sites. Timing
  logic (`useDelayedReveal`, the two constants, the component's prop
  signature) is explicitly off-limits to Cursor - JSX-inside-branches and
  CSS only.
- **Not yet done this session:** committing the skeleton changes (3 files:
  `LoadingState.jsx`, `ProtectedRoute.jsx`, `index.css`) - do this before
  dispatching the task block so Cursor's diff lands on top of a clean base.
  QUEUE.md's Active section updated to list T3; moved out of Candidates.

## Open TODOs (do at next session start)

1. **Repoint staging Render/Vercel back to `main`**, verify redeploy SHA is `750c42b` in Events (now includes T3), then smoke-test on prod (5 palettes x dark x Home at minimum, per `docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`, plus the analytics screen, Home weekly-report band, and the T3 loading screens - soft-tone pulsing dots + page-tone breathing ring + label cross-fade).
1b. **Confirm prod Render + Vercel Events both show `750c42b` deployed** (T3 merge) - not yet checked this session; `main` auto-deploys to both.
2. **Diff `_prisma_migrations` prod vs staging** (RUNBOOK -> "Migration history diff"). Unresolved, predates the UI work.
3. **Verify the manually inserted prod `_prisma_migrations` row's `checksum` matches staging's** for `20260603140000_add_user_username`. Latent hazard — check once, fix if mismatched.
4. Confirm prod Render serving cleanly post-recovery.
5. Low-priority: redundant spare stash on `ui-palettes-v2` (`WIP unrelated to ui-palettes-v2 merge`, July 1) — `git stash drop` once confirmed unneeded.
6. Low-priority: `ui-palettes-v2` and `analytics-engine` branches are both fully merged to `main` now — candidates for deletion whenever Seth wants to ask for that gated op.

## Session log (July 3 latest+2 — relay v3: model split rebalanced, Fable)

- **Division of labor rebalanced (Seth's call, token-efficiency harmonization),
  now codified in CLAUDE.md ("v3 - Sonnet resident, Fable gated"):**
  - **Sonnet in Claude Code becomes the resident driver:** per-unit light
    review (re-run test lanes + build, scope vs FILES TO TOUCH, acceptance
    spot-checks), commits with SHA verification, staging pushes, HANDOFF +
    QUEUE upkeep, dispatch. Sonnet never authors blocks and never settles
    contract ambiguity — it escalates.
  - **Fable/Opus drops to two jobs:** authoring unit-scale task blocks (a
    wave per session, then drop out), and ONE thorough review of the full
    accumulated branch diff before any merge to main. Standing escalation
    triggers: schema/migration design, security/isolation surfaces, prod
    incidents, root-cause Sonnet can't close, spec-vs-delivery conflicts.
  - **Cursor stays the hands**, now on Sonnet or cheaper per the block's
    MODEL header (Fable-in-Cursor no longer the default).
  - **Accepted trade-off (do not silently "fix"):** deep review moves from
    per-unit to the pre-main gate; Sonnet's per-unit pass is the tripwire,
    Fable's pre-main review is the net. Merge still gated on Seth's
    "push to main" trigger phrase.
- Model facts behind the call (from the API skill, July 3): Fable 5 is a
  Mythos-class tier ABOVE Opus 4.8 ($10/$50 per MTok vs $5/$25); Sonnet 5
  is $3/$15 with near-Opus coding/agentic quality — a Fable session burns
  roughly 3x the quota of the same session on Sonnet. Fable and Sonnet are
  NOT interchangeable; the plan works because judgment stays on Fable and
  well-specified execution + bookkeeping move to Sonnet.
- Workflow-change log appended to `docs/specs/poor-mans-agentic-workflow.md`.
- **Next session should run on Sonnet** (this is the handoff): its first
  jobs are whatever falls out of Seth's U10/U8/U9 staging smoke, under the
  new v3 rules. No code changed this session — docs only.

## Session log (July 3 latest+1 — U10/U8/U9 all landed `d21608c`, Claude Code)

- **Cursor executed U10, U8, AND U9 in one working tree** instead of the
  planned one-at-a-time dispatch. Since the files were already mixed
  (index.css and AnalyticsPage.jsx overlap across units), reviewed the
  combined tree against all three blocks and committed as ONE commit
  (`d21608c`, 8 files, +683/-135), pushed to `origin/analytics-engine`.
  Scope was exact (union of the three FILES TO TOUCH lists, no extra
  files); client build green; no hex in new CSS; no new deps; HOW_BALANCE
  copy verified against the engine's PUSH/PULL/QUAD/HAM group constants.
- **Six reviewer fixes applied on top of Cursor's delivery:**
  1. `formatPlanActual` printed "100.0 lbs" — failed U9's own acceptance
     string ("@ 100 lbs"); weights now go through the strip-trailing-.0
     formatter. (Cursor CLAIMED this criterion passed — it did not.
     Verify-before-trust earns its keep again.)
  2. Verdict clause trimming: newsy clauses now outrank on-plan filler —
     "hit every planned set and on-plan loads" was crowding out a real
     >=1-rep effort drift, the only news in that row.
  3. Sparkline dots: `<circle>` under `preserveAspectRatio="none"`
     stretches into ellipses (only the line had non-scaling-stroke); dots
     are now zero-length round-cap strokes with non-scaling-stroke.
  4. Single-session sparkline: dot centered (was pinned to left edge) and
     the identical first/latest value no longer prints twice.
  5. Volume-trend last-week label was absolutely positioned past the right
     edge of the chart grid (would overhang the card border on every row);
     moved to a fixed 34px third grid column so rows stay aligned and
     nothing overflows.
  6. `EffortDriftCompact` rendered "stopped ~0 reps early sandbagging" for
     sub-rep drifts (e.g. +0.3); those now read "on target (+0.3 RIR)".
     Plus the U10-adjacent tone fix: the sets-delta tone now derives from
     the ROUNDED delta so "+0.04" can't print "same as last week" in green.
- **Acceptance evidence:** all U9 verdict/format strings verified by
  direct node eval (6/6 pass, including the fixed weight case); client
  `npm run build` green; U10's `align-content: start` in place with
  `min-height` byte-identical.
- **Next: Seth smokes the whole wave on the staging Vercel deploy of
  `d21608c`** (home: hero dead space gone, set counts clean; analytics:
  Bars|Trend|Table toggle, sparklines, execution planned-vs-did line +
  verdict, balance zone band + ghost tracks — across palettes x modes).
  After sign-off: the deferred analytics-engine -> main merge decision.

## Session log (July 3 latest — U7 smoke feedback -> U10 queued, Claude Code)

- **Seth smoked U7 on the staging Vercel deploy** (screenshot committed:
  `docs/smoke-tests/images/u7-home-weekly-report-champ-dark-staging.png`).
  Verdict: weekly report band ACCEPTED; two critiques:
  1. **Start Workout hero renders a big dead-space block** inside its
     border. Root-caused by Claude Code (not a hero bug): `.stack` is
     `display: grid`, and `.workout-tab.stack` has
     `min-height: calc(100dvh - 7.5rem)` — grid's default
     `align-content: stretch` distributes the spare viewport height into
     the card rows, and the hero (least content) shows it worst. Fix =
     `align-content: start` so spare space collects at the bottom under
     the scene band. Pre-U7 this stretch existed but read as intentional;
     the third row (weekly report) changed the distribution.
  2. Weekly report set counts print needless decimals ("29.0",
     "-3.0 vs last week") + the accepted "+0.0" tiny-delta nit.
  Both folded into **U10 (`docs/tasks/u10-home-hero-dead-space.md`),
  QUEUED, MODEL auto/cheap** (fully pre-diagnosed, mechanical).
- **Analytics-tab critique ("looks untouched") needs no new authoring** —
  correct observation, U8/U9 simply haven't been dispatched yet; they ARE
  the full analytics update (volume trend view + e1RM sparklines;
  execution concrete-comparison rework + balance polish).
- **Dispatch order set: U10 -> U8 -> U9, strictly serialized** (all three
  touch `client/src/index.css`); Seth smokes each on the staging deploy
  after it lands before dispatching the next.

## Session log (July 3 later — U7 landed + smoke-workflow change, Claude Code)

- **U7 (Home weekly report band) reviewed + committed (`f22989d`) + pushed.**
  Cursor delivered to spec: `WeeklyReport.jsx` self-fetching two parallel
  non-overlapping summary windows (today-6d..today vs today-13d..today-7d),
  mounted on DashboardPage between hero and Recent workouts; `pickTopGain`
  and `toDateOnlyString` extracted verbatim to `client/src/lib/` (StatTiles/
  AnalyticsPage diffs are pure import swaps); all four states implemented
  (loading/error/both-empty render nothing, prior-empty = "first week
  tracked", current-empty = nudge with prior count); CSS tokens-only under
  `weekly-report-` prefix. Reviewer verified: build re-run green, no hex in
  the new CSS block, `/sessions/mine` has no server-side limit so the
  workout counts are trustworthy. Two accepted cosmetic nits: a tiny
  positive sets delta can render "+0.0", and windows compute once at mount
  (stale after midnight until reload).
- **WORKFLOW CHANGE (Seth, standing):** all smoke testing now happens on the
  Vercel deployment built from the staging branch — never local dev (avoids
  the client/.env prod-API trap). Relay order updated: after spec review
  passes, Claude Code commits + pushes to staging IMMEDIATELY so a deploy
  exists to test; Seth's visual sign-off happens on the deployment, after
  the commit. Merge to main still gated on sign-off + trigger phrase.
- **U7 visual sign-off PENDING** — Seth smokes the Vercel build of
  `analytics-engine` @ `f22989d` (login `smoke_b8`, band on Home, palettes x
  modes, narrow-viewport wrap). U8 dispatches only after sign-off.

## Session log (July 3 — analytics polish wave planned, Claude Code)

- **Seth critiqued the B8 analytics screen; five-point polish wave agreed:**
  1. KPI tiles evolve into a "weekly report" — DECIDED: it lives on the HOME
     screen (DashboardPage, under the StartWorkoutHero) as a last-7-days vs
     prior-7-days delta band, so users see stats on login. Range chips keep
     governing only the analytics deep-dive cards.
  2. Volume by muscle: add a time view — extend the Chart|Table toggle to
     Bars|Trend|Table (per-muscle weekly sparklines/small multiples).
  3. Strength trends: replace/augment the first-vs-latest dumbbell with
     per-session e1RM sparklines; the existing Table view stays as the
     raw-data screen.
  4. Execution: comprehension rework — lead with the CONCRETE comparison
     ("Planned 3x8 @ 100 -> Did 2x8 @ 95") + a deterministic plain-language
     verdict line; percentages demoted to annotations; "sandbagging/
     overreaching" demoted to secondary flavor.
  5. Balance: diverging scale with colored deviation fill + shaded
     "balanced zone" band (~0.8-1.3), ghost tracks on degraded rows.
  Seth will critique each visually after it ships (2-5 are "show me" items).
- **Root cause identified:** 1-3 all need TIME SERIES the engine collapses
  away. One engine unit unlocks all three: **B9 task block authored + QUEUED**
  (`docs/tasks/b9-analytics-time-series.md`) — weekly per-muscle volume
  series, per-session e1RM series, execution planned/actual concrete
  summaries. Additive, engine-only, no schema/controller change. UI wave
  U7 (Home weekly report) / U8 (trend view + sparklines) / U9 (execution
  rework + balance polish) listed as QUEUE candidates; U8/U9 blocks get
  authored after B9 lands (they consume its payload shape).
- **Merge to main: DEFERRED by Seth — "i dont think i want to push the
  analytics to main until the visuals are locked in."** The B9/U7-U9 polish
  wave continues on `analytics-engine`; the merge happens after Seth signs
  off on the visuals (still gated on "push to main" verbatim). Pre-merge
  items still open: Seth's personal read of the `analyticsController.js`
  findMany where-clause, and the two open forks below.
- QUEUE.md refreshed: B8 (`00c67dc`) and U6 (`d4b1d72`) moved to Landed.
- Stray smoke screenshots tidied into `docs/smoke-tests/images/`
  (analytics-b8-u6-lbs-default + two smoke-b8 login-error shots) and
  committed.

## Session log (July 2 late — task-queue pilot scaffolding, Claude Code)

- **File-dispatched task queue created (`docs/tasks/`):** README (protocol:
  author -> dispatch-by-pointer-line -> execute -> review/land; Mode 1
  serialized relay first, Mode 2 parallel worktrees after ~3 clean units),
  QUEUE.md (status index, single writer = Claude Code), _TEMPLATE.md
  (unit-scale block with standing no-git/no-state footer + MODEL/MODE
  headers). Replaces chat-pasting task blocks into Cursor; Seth dispatches
  with one pointer line.
- **RUNBOOK section 8 added:** parallel worktree ritual (worktrees under
  `C:\dev\worktrees\`, outside OneDrive; create/review/land/cleanup).
  Old section 8 (safety invariants) renumbered to 9.
- **`docs/specs/poor-mans-agentic-workflow.md` created:** tracking doc for a
  FUTURE public repo (Seth's idea: "$40/mo agentic workflow" - Claude Pro +
  Cursor Pro vs Claude Max). Not publishing yet; append to its log whenever
  the workflow changes so the public repo can be extracted later.
- No task blocks authored yet - next real Cursor-suited units (A5/A6) are
  blocked on A4 FK design; QUEUE.md lists candidates.

## Session log (July 2 evening — B6 built + smoked, Claude Code solo, autonomous)

- **B6 matched-effort progression DONE + committed (`94a1fbf`), pushed, on-device smoked.**
  Details in the track section below. Built directly by Claude Code (not via
  Cursor) under an explicit one-night inversion of the brain/hands split:
  Seth was out, Claude Code tokens were expiring, and running both agents
  unattended on one tree is the known race. The standing division of labor is
  UNCHANGED going forward.
- **Permissions overhaul in `.claude/settings.local.json`:** broad allow rules
  for tonight's lanes (npm/npx/node in PowerShell, curl, more Playwright MCP
  tools, read-only PS cmdlets) PLUS a new `ask` array that force-prompts the
  gate items (git reset/clean/force-push/branch-delete, push to main, merge,
  npm install, prisma migrate). The `ask` list matters beyond tonight: the
  pre-existing `PowerShell(git *)` allow silently covered `git reset --hard`
  etc.; `ask` overrides `allow`, so the gate is now enforced by config, not
  just convention.
- **Staging DB was reset** by tonight's full `npm test` run (expected pretest
  behavior, but easy to forget): the old `smoke-b5` account is GONE. New smoke
  account: `smoke-b6` / `SmokeTest-B6-2026` (email `smoke-b6@example.com`),
  3 completed backdated sessions (Jun 15/22/29) whose data exercises every
  analytics state — bench @ RIR 2 across 3 sessions (matched-effort populated,
  and its plain e1RM trend is deliberately NEGATIVE from a backoff set, the
  honest-vs-dishonest contrast on one row), lat pulldown with no RIR (unlock
  states), rirCoverage 63%.
  **SUPERSEDED (July 3):** `smoke-b6` gone in a later reset. Current smoke
  account: username `smoke_b8` (UNDERSCORE, not hyphen - Cursor created the
  account first and usernames are immutable) / `SmokeTest-B8-2026` (email
  `smoke-b8@example.com`, which also works as the login),
  seeded via the new `scripts/seed-staging-smoke.mjs` (HTTP-only, idempotent,
  re-run after any staging reset): 24 sessions over 8 weeks, 12 muscles / 11
  exercises, matched-effort +39.9, 4 execution rows (template-linked), RIR
  gaps for the honesty states, push:pull 1.01 / quad:ham 0.86.
- **Dev-stack gotcha confirmed:** the long-running nodemon (started Jul 1) did
  NOT pick up the B6 engine changes — OneDrive file-watch flakiness. The
  /analytics endpoint silently served pre-B6 responses (no matchedEffortTrend)
  until the server process was killed and restarted. If a diff looks right but
  the API disagrees, restart the dev server before debugging the code.
- Prisma `generate` also hit the OneDrive/Windows EPERM dll-rename lock (held
  by the running server); worked around by running jest directly — schema is
  unchanged so generate was a no-op requirement. Another point for the
  "move the repo out of OneDrive" issue.

## Session log (July 1 evening — repo hygiene + infra, Claude Code)

- **All untracked critical work committed** onto `analytics-engine` and pushed — closes the "one `git clean` from gone" exposure (master prompt v17, analytics spec, engine code + tests, catalog data, scripts, brand asset).
- **Jest split into `unit` and `integration` projects** (`server/jest.config.js`). `npm run test:unit` runs the pure analytics tests with ZERO DB contact — no `pretest` migrate, no `jest.setup.js` reset (npm pre-hooks are exact-name, so `test:unit` skips `pretest`). `npm test` unchanged (both lanes, staging DB, serialized). This restores the spec's "pure, fixture-tested, no DB" promise, which the old single config silently broke: every test file, including the pure ones, ran `resetDb()` against staging beforeEach.
- **CI cheap lane added** (`.github/workflows/ci.yml`): client build + server unit tests on every push, no secrets, no DB. Integration suite deliberately stays manual/local. First runs green (~34s). Actions pinned at v5 (node-20 runner deprecation).
- **Housekeeping:** export artifacts + `.claude/settings.local.json` gitignored; remaining scene mocks moved `client/src/assets/scenes/` -> `docs/design/mocks/` (references only, never ship from src); `lifter.png` (unused pending brand asset) committed; Claude Code permission allowlist pruned ~50 one-offs -> prefix rules (destructive ops deliberately NOT allowlisted so they always prompt).
- **CLAUDE.md / AGENTS.md consolidated (done last, per instruction):** AGENTS.md is now the single source for shared agent context (conventions, UI architecture, the gate); CLAUDE.md imports it via `@AGENTS.md` and keeps only Claude-Code-specific content. AGENTS.md's "Current state / Next up" sections replaced by a pointer here — **HANDOFF is the only state channel now.** The old gate-sync rule is retired; there is no duplicate to sync.
- **Concurrent-agent note:** a Cursor session executed B2/B3a in the same working tree while this session ran. Its output was reviewed, folded into commits `cd72e9c`/`7192e2c`, and its HANDOFF records are preserved below. See the new gotcha before running two agents on one checkout again.

## U5 — UI overhaul (T1/T2 MERGED TO MAIN, T3/T4 not started)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE**, **T2 DONE and merged to main** (`ccd0829`, July 1): all 5 palettes (champ, iron, chill, forest, crimson) on real raster scenes; shared pixel-art chrome; fade-mask band generalized to all palettes; dead-zone glow fix; navbar bleed-through fix. 5-palette x dark/Home smoke matrix closed (`docs/smoke-tests/SCENE-SMOKE-CRITIQUE.md`); light mode + non-Home routes not covered (unchanged by fixes, lower risk). Card chrome + trimmed Home reviewed against mocks July 1 and kept as-is (deliberate decisions, not gaps). Merge done via temp `git worktree`, not stash+checkout (Windows/OneDrive file-lock hang on `git stash`).
- T3 (dynamic loading screens) and T4 (motion) not started; no design work done yet.
- Full T2 fix-by-fix history: see the July 1 morning HANDOFF in git history (`ec3d85a`).

## Next up (the active task)

0. **N-wave navigation overhaul is the active UI track** (July 4).
   **N1 (`d266242`) + N1b (`b366e17`) LANDED on `ui-nav-overhaul`, pushed —
   awaiting Seth's visual smoke of N1b on the branch's Vercel deploy**
   (mobile: scene band flush on the tab bar across palettes, no top bar +
   Home masthead + big page titles, resume pill while live, finish-dock-
   covers-tabs question; desktop: unchanged except the three page titles).
   N2 (Profile hub) dispatches after sign-off, then N3. Strictly serialized
   (shared `index.css`). Fable pre-main review before the wave merges.
1. **B9 LANDED (`c7acb43`)** — Cursor implemented, Claude Code reviewed
   (scope exact, all acceptance criteria tested, reviewer tightened the
   inclusive-last-bucket assertion, re-ran unit lane 103/103, purity grep
   clean), committed + pushed. KNOWN WRINKLE recorded for U8: `e1rmTrend.
   first/latest` are raw first/last SET epley while `e1rmSeries` points are
   session maxes — they can disagree; the U8 block therefore requires the
   strength delta chip to derive from `e1rmSeries` endpoints, not
   `e1rmTrend`.
2. **`analytics-engine` MERGED TO MAIN (`e9ce82c`), July 4 (Sonnet).** Track B
   v1 (B1-B9) and the UI polish wave (U6-U10) are both live on `main`. See
   Repo/deploy state above for merge mechanics and the skipped-Fable-review note.
3. Open TODOs #1-6 (Render/Vercel repoint to main + redeploy SHA check comes
   first, then prod verification — manual, browser).
4. Track A (A1 catalog merge, then A4 FK design — now including
   set->BlockWorkoutSet linkage for block-plan execution fidelity) is the
   next engine-adjacent work; with T3 merged (`750c42b`), T4 (motion) is
   the last unstarted U5 unit — but the N-wave (item 0) is the active UI
   track first.
5. U11 "what's new" one-time modal is queued as a candidate (see
   `docs/tasks/QUEUE.md`) — needs a Fable-authored task block before Cursor
   can pick it up.

## Open forks — SETTLED (Seth, July 4, pre-merge)

1. **Theme storage** — went with the proposed default: device-local (matches existing appearance setting, zero schema change), all reads through one accessor so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — went with the proposed default: keep, with a trigger condition: it changes the day a stranger can sign up. One constant either way.

## Analytics/catalog track — ACTIVE (B1-B5 committed, B5 smoke + merge decision next)

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction rationale:
`analytics-engine-direction` memory.*

**Vision (decided July 1, Opus session):** analytics engine = the wedge. Layered
L0 attribution (fractional weighted sets/muscle) -> L1 descriptive -> L2 diagnostic.
Differentiators flow only from data competitors lack: fractional attribution, per-set
RIR/RPE (already in schema), first-class plan snapshot. RIR near-mandatory (onboarding
nudge); **Stimulating Sets** (attribution x proximity-to-failure) is the headline unit.
v1 L2 = Stimulating Sets + matched-effort progression + execution fidelity. Deferred
(need history): personalized volume landmarks, fatigue signalling. AI coach (Track C,
BYO-key experiment then monetized) is dead-LAST, off the critical path.

**Phased roadmap (full detail in the spec, section 9):** Track A = data plumbing
(catalog merge, FK linkage, backfill). Track B = the engine (resolver -> set metrics
-> aggregation -> API -> screen -> progression -> fidelity). Track C = AI, last.

**B1 attribution resolver DONE + committed (`e4c96be`).** Built via Cursor task block,
verified independently (files read, tests re-run, grep confirms zero Prisma references).
`server/src/analytics/{normalize,catalog,resolve,attribution,index}.js` (all CommonJS,
pure, no DB) + `server/test/analytics/{resolve,attribution}.test.js`. Exact-normalized-
name match only (no fuzzy/alias matching — deferred to A6).

**B2 set-level metrics DONE + committed (`cd72e9c`).** Verified independently.
`stimulusCurve.js` (RIR -> multiplier via named `STIMULUS_CURVE` band array at spec
values, null RIR -> null, never guessed), `server/data/stimulus-curve-rationale.md`
(house-style, matches `muscle-weights-rationale.md`; same-commit update rule),
`setMetrics.js` (`estimateOneRepMax` Epley+Brzycki with the reps>=37 Brzycki-
singularity guard, `computeTonnage`, `computeSetMetrics` returning distinct
`effectiveContribution` (always-on) vs `stimulatingContribution` (RIR-weighted,
null when RIR missing) per muscle).

**B3a weekly per-muscle aggregation DONE + committed (`7192e2c`).** Verified
independently (43 unit tests green via the new DB-free lane). `enrichSet.js`
(composes Stages 1-3 into one call: `{ performedAt, resolution, attribution,
metrics }`; imports underlying modules directly to avoid a require cycle through
`./index`), `aggregate.js` (`computeWeeksInRange` + `aggregateMuscleVolume` —
per-muscle `effectiveSets`/`stimulatingSets`/`frequency`/`daysSinceLast` over a
`[from, to]` range, session-deduped by shared `performedAt`, `stimulatingSets` is
`null` not `0` when a muscle has no RIR data at all, `landmarkBand` correctly
deferred).

**B3b per-exercise aggregation + balance ratios + Stage 6 summary object DONE
+ committed (`c954185`).** Built via Cursor task block, verified independently
(files read, `npm run test:unit` + full `npm test`: 11 suites / 84 tests pass,
grep confirms zero Prisma references). Delivered: `aggregate.js` extended with
`aggregateExerciseMetrics` (per-exercise `e1rmTrend` + `bestSet`, grouped by
resolved catalog id only) and `computeBalanceRatios` (`pushPull`/`quadHam` off
`effectiveSets`, null on zero-denominator; `frontRearDelt` always `null` — the
catalog's muscle taxonomy has no front/rear delt split, verified by inspecting
`exercises.json`'s muscle vocabulary, so this is an honest gap not a bug);
`summary.js` (`buildSummary` — the Stage 6 entrypoint: `range`, `perMuscle`,
`perExercise`, `prs: []` (deferred — needs full history beyond the range, a
separate design problem), `balance`, `execution: []`, `meta.rirCoverage` +
`meta.honestyNotes`). Info equivalent to a `resolutionCoverage` % (an earlier
placeholder note above anticipated this as a separate `meta` field) is instead
surfaced as a prose count in `honestyNotes` when nonzero — not added as its own
numeric field; revisit only if the UI needs it as a number.
**Post-Cursor fix (this session):** `bestSet.weight`/`reps` were `null` in
Cursor's delivery (comment cited "floating-point noise" from reconstructing
them) — actually exactly recoverable via `weight = epley - tonnage/30`, `reps =
tonnage / weight` (algebraic inverse of the formulas that produced them, both
already present on the enriched set), so fixed directly in `aggregate.js` with
a new test assertion; `rir` correctly stays `null` (genuinely unrecoverable,
lossy stimulus-curve mapping). Also committed separately (`98b897e`): the
Fable brain/hands division-of-labor doc update (CLAUDE.md/AGENTS.md/
cursor-task-block-template.md) that had been left uncommitted from the prior
session - Claude Code owns git+state, Cursor stops after tests green, plus
the new unit-scale task-block variant. Both commits pushed to origin
(`analytics-engine`).

**B4 `GET /api/analytics/summary` endpoint DONE + committed (`bb05bc5`).**
Built via Cursor task block (unit-scale), reviewed independently (all four
files read against the spec, both test lanes re-run by the reviewer: unit
55/55 DB-free, full suite 89/89 across 12 suites; engine purity re-verified —
zero Prisma under `server/src/analytics/`). Delivered:
`server/src/controllers/analyticsController.js` (getSummary — from/to
required + validated with descriptive 400s, date-only `to` treated as
inclusive end-of-day `T23:59:59.999Z`, `workoutSession.findMany` scoped to
`{ userId, performedAt: { gte, lte } }` — the single cross-user-isolation
point; sets reach the engine only through user-owned sessions; exerciseName
from sessionExercise ?? templateExercise, `exerciseId` always null until A4,
nulls passed through unfiltered per the engine's degradation contract),
`server/src/routes/analyticsRoutes.js` (one route behind `authRequired`),
mounted at `/analytics` in `routes/index.js`,
`server/test/analytics.integration.test.js` (5 tests: 401 unauth, four 400
cases, cross-user isolation with a non-vacuous sanity check that user B sees
their own data, happy path with exact Epley e1rm + chest effectiveSets +
rirCoverage 1, inclusive date-only `to` at 18:00 on the boundary day).

**B5 analytics screen UI DONE + committed (`e287a29`).** Built via Cursor
task block (unit-scale), reviewed independently (all six files read against
the block, client `npm run build` re-run green, server unit lane re-run
55/55, every referenced CSS token/class grep-verified to exist). Delivered:
`client/src/api/analyticsApi.js` (getSummary via shared `http`),
`client/src/pages/AnalyticsPage.jsx` (SessionsPage pattern; 4/8/12-week
preset chips, date-only from/to with stale-response guard; four card
sections — per-muscle table with "log RIR to unlock" degradation state,
per-exercise best-set/e1RM/trend with null guards, balance ratios with the
Front:Rear delt row visibly "not available" per the honesty contract, data
quality with rirCoverage % + verbatim honestyNotes; single empty-state card
when both tables are empty), `HowCalculatedButton.jsx` (MetricInfoButton
portal-popover pattern copied, props-driven `{title, copy}`, reuses
`metric-info-*` classes so scene-layer stacking is already handled;
MetricInfoButton itself untouched), `/analytics` route + Navbar tab enabled
(same liveSessionGuard pattern as History), tokens-only CSS (chips derive
active/hover/focus from `--color-interactive` via color-mix; v1 is
deliberately chart-free — numbers + degradation states, no viz deps).

**B5 on-device smoke DONE (July 2, Playwright via Claude Code):** /analytics
with real logged data — all four card sections render, chip refetch works
(4wk -> 8wk recomputes), per-muscle RIR-unlock state shows, honestyNotes
verbatim, nav tab active state, HowCalculated portal popover renders above
the scene layer — across all 4 palettes in dark mode (champ/iron/forest/
crimson full-page screenshots reviewed). Light mode not covered (matches the
T2 smoke scope). B5 is visually done.

**B6 matched-effort progression DONE + committed (`94a1fbf`) + smoked.**
Implemented directly by Claude Code (see July 2 session log for why).
Delivered: `server/src/analytics/matchedEffort.js` —
`computeMatchedEffortTrend(enrichedSets)`: buckets a resolved exercise's sets
by EXACT integer RIR (no banding in v1), session-dedupes by shared
`performedAt` (max epley = the session's representative), requires
`MIN_MATCHED_SESSIONS = 2`, picks the bucket with most distinct sessions
(tie-break: LOWER RIR — closer to failure, where e1RM is most accurate),
returns `{ rir, sessions, first, latest, best, delta }` (epley, unrounded)
or null. `enrichSet.js` now carries `input: { weight, reps, rir }` through,
which let `aggregate.js` drop the algebraic bestSet reconstruction AND make
`bestSet.rir` real (was hardcoded null as "unrecoverable" — now recovered
from input). Wired into `aggregateExerciseMetrics` -> flows through
`buildSummary` untouched (no Date fields). UI: "Matched effort" column in
the per-exercise table, `+X.X kg @ N RIR · M sessions` populated state,
"log RIR across 2+ sessions" unlock state, HowCalculated copy. Tests: 12 new
(unit lane 55 -> 67; full suite 89 -> 101, all green); engine purity
re-verified (zero prisma under `server/src/analytics/`). Smoke: live
endpoint + UI verified against seeded staging data; the seeded bench row
shows e1RM trend -12.7 kg next to matched effort +6.3 kg — the exact
dishonesty the metric exists to fix, visible on one row.

**B7 execution fidelity Mechanism A DONE + committed (`9cfe7f0`) + smoked.**
Implemented directly by Claude Code (same inverted-split session as B6).
Delivered: `server/src/analytics/planVsActual.js` —
`computeExecutionFidelity(enrichedSets, planLookup)`: pairs actual sets with
TemplateSet plans ORDER-WISE within each (session, templateExercise) group;
`loadAdherence` = mean(actual/planned weight), `volumeAdherence` =
actual/planned set counts (extra sets raise it, skipped sets lower it),
`effortDrift` = mean(actual RIR - planned RIR, positive = sandbagging);
each null when no pair carries its data; resolved template-linked sets only.
**Design finding baked in: the schema has NO path from a WorkoutSet to a
BlockWorkoutSet** — block plans can't join and are an honest gap stated in
the UI how-calculated copy (frontRearDelt pattern), NOT silently
approximated. Fixing that needs a schema change (fold into A4 FK design).
`enrichSet.input` gained `order` + `templateExerciseId`;
`buildSummary(sets, { from, to, planLookup })` fills `execution` (still `[]`
without planLookup). Controller now includes `templateSets` through BOTH
linkage paths (set.templateExercise and set.sessionExercise.
templateExercise — template-started sessions link sets via the latter) and
builds the planLookup; isolation unchanged (plan data reached only through
user-owned sessions). UI: new Execution card (Load %, Volume %, Effort
drift +N RIR sandbagging / -N RIR overreaching / on target), unlock state
when nothing plan-linked. Tests: 10 new — pairing, drift signs, volume
over/under, null degradations, exclusions, wiring, plus an integration test
driving the real template -> startSession -> log -> summary flow (unit lane
76, full suite 111, all green). Smoked: seeded template session (plan 3x100
@2, actual 2x95 @3) renders 95% / 67% / +1 RIR sandbagging in champ dark.

**TRACK B v1 IS CODE-COMPLETE (B1-B7).** What remains before calling the
analytics wedge shipped: the merge decision (below), Seth's personal read of
the `findMany` where-clause, then Track A data plumbing (A1 catalog merge ->
A4 FK linkage — add set->BlockWorkoutSet linkage to the A4 design — -> A5
picker -> A6 backfill) to make resolution robust for real accounts, and the
standing product asks (charts after algorithms; they're now landed). Track C
(AI coach) stays dead-last. Back to the normal relay (Cursor implements)
unless Seth says otherwise.

**State / open items:**
1. **A2 DONE + committed (`48c1e91`):** muscle-weights curation cleaned (3 bad IDs
   fixed: `Incline_Bench_Press` -> `Barbell_Incline_Bench_Press_-_Medium_Grip`,
   dropped `Bulgarian_Split_Squat` + `Pendlay_Row`; 32 -> 30, all keys resolve,
   sums valid). `scripts/validate-catalog.mjs` disk-only validator included.
2. **`exercise-catalog-seed` committed (`c27a6de`) but NOT merged to main.** Staging
   DB has the catalog migration; main's code doesn't. Prod has neither — when the
   catalog merges (A1), its migration must be applied to prod per the schema-change
   deploy discipline. Reconcile before FK work (A4).
3. **Validator surfaced 29 secondary-less compounds** in the 675-exercise lifting
   subset (mostly ab/isolation, not loaded compounds) — attribution gaps to skim
   during a later curation pass (A3), not urgent.
4. **Integration test step-6 output (malformed-key seed behavior) still UNVIEWED.**
   Look before designing the FK unit (A4).

## Other branches floating around

- `round-7-unify-set-row` (`f6c2a6f`) — set-row unification, parked, decision pending.

## Issues to open

1. Resolve connect-pg-simple `session` table drift (proposed: option (b) `@@ignore` soon).
2. Integration-suite isolation on shared staging — **Neon supports instant copy-on-write DB branches; a branch-per-test-run would kill the FK-pollution flake entirely. Worth a spike.**
3. ~~Gitignore export/junk artifacts~~ **DONE July 1** (`bf24b46`).
4. User-defined exercise support for movements absent upstream (Bulgarian split squat, Pendlay row).
5. Favicon/PWA icon swap for LogChamp (needs an asset).
6. Long-term call on migration automation vs manual discipline.
7. Schema sentinel — see spec (`docs/specs/schema-sentinel.md`).
8. **NEW: repo lives inside OneDrive** — already caused a `git stash` hang (worktree workaround exists) plus file-lock/sync-lag risk. Decision for Seth: move the repo out of OneDrive (e.g. `C:\dev\workout-db`) or exclude it from sync. Everything is committed+pushed now, so the move is low-risk whenever chosen.

## Known tech debt (queued, not blocking)

- `DraftSessionSetRow` / `SessionSetRow` unification.
- Prisma 6->7 bump.
- Jest open handle.
- pg SSL deprecation.

## Notes / gotchas discovered

- **Two agents, one working tree (July 1):** Cursor wrote B2/B3a files while Claude Code was committing B1 in the same checkout — an in-flight `index.js` edit got swept into the B1 commit (`e4c96be` doesn't build alone; fixed by `cd72e9c`), and HANDOFF was overwritten mid-rewrite twice. When both agents are active: check `git status --untracked-files=all` immediately before every commit (untracked DIRECTORIES collapse to one line and hide new files), wait for writes to settle (check mtimes), and prefer only ONE agent committing at a time.
- Scene mock PNGs are design references with fake UI ghosted in — they now live in `docs/design/mocks/` (`ChampMock`, `IronMock`, `ChillMock`; Forest/Crimson mocks deleted June 30 after crops verified). Never ship from `client/src/`; only ever crop the bottom scene band. `CrimsonMock` had a gray phone-frame surround (inset crop), not full-bleed like the others.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on device.
- When bumping a value produces near-zero visible change, it's not a tuning problem — something is suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate any DB.
- `server/.env` only ever points at staging or localhost, never prod. `dbHostGuard` enforces this two ways: `assertSafeForBoot()` runs automatically at server boot (`server.js`); `assertSafeForReset()` covers the test/reset path (`test/jest.setup.js`) and must be called explicitly by any new DB-connecting script at the top of `main()`.
- `npm run test:unit` is DB-free by construction; `npm test` still requires (and resets) the staging DB.
