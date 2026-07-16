# QUEUE - task-queue index (single writer: Claude Code)

Format: `<status> | <file> | <one-line scope> | <notes>`
Statuses: DRAFT / QUEUED / DISPATCHED / AWAITING-REVIEW / LANDED <sha> / BOUNCED
(protocol in README.md)

## Active

MW-wave (maintenance wave), authored July 16 (Fable), branch
`maintenance-wave` (off not-tracked-ux-wave HEAD `5e3d981` = main
`c473e21` + the CW dev-tooling arc, which therefore rides this wave's
pre-main gate). Sources: Seth's July 16 candidate list (HANDOFF items
10-16) + the NT-gate's surviving findings (issues 8/9 + the nested
`<button>`). Scope settled with Seth July 16: item 12 = custom
EXERCISES (not templates); un-finish IS the edit path for 10+11 (one
mechanism, no second editing surface); item 16 (catalog/search review
pass) NOT authored - stays a candidate alongside A3. Gate-tier rulings
baked into the blocks, do not re-litigate: the server WILL accept an
id-only identity PATCH (issue 8, ruled July 16 - fixes BOTH :531 and
:575); reopen = `completedAt`-only flip, and a reopened session leaving
history/analytics until re-finished is intended semantics.

Dispatch order: MW1+MW2 may go back-to-back (file-disjoint: client
SessionDetailPage/index.css vs server controllers + sheet + tests),
then MW3 (shares sessionController.js with MW2 AND SessionDetailPage.jsx
with MW1), then MW7 (index.css possibly overlaps MW1/MW3 - when in
doubt they collide, serialize). MW4 and MW5 are no-code diagnosis
blocks: dispatch solo anytime between reviews, never back-to-back with
anything (every block writes DELIVERY.md). MW6 stays DRAFT until MW4's
audit lands and its findings are folded into the contract.

July 16 addendum (Fable, post-rulings): MW6 finalized and QUEUED; MW8
authored and QUEUED. MW6 (SessionDetailPage.jsx +
PlanningSetCountControl.jsx + index.css-if-needed) and MW8 (5 analytics
display files + one NEW lib file, no CSS) are fully file-disjoint and
may dispatch back-to-back for one review session. These are the LAST
two code units of the wave - after they land and Seth smokes, the
pre-main gate (Fable) closes the wave.

**WAVE CODE-COMPLETE July 16 (Opus resident session): all 8 units
LANDED** (MW1 f9a6dfd, MW2 859f3d3, MW3 9511e8f, MW4 c005c2a, MW5
87d6b37, MW6 bfbbe56, MW7 b6c885f, MW8 52e84cf). Remaining: Seth
smokes MW6+MW8 on staging (MW1/2/3/7 already PASSED July 16), then
the pre-main gate (Fable + Seth).

- LANDED f9a6dfd | mw1-heading-pill-unnest.md | tracked pill lifted out
  of the live heading toggle - pill + summary are now SIBLINGS of the
  toggle in a shared .session-exercise-heading-lead wrapper (live and
  completed branches unified, the block's optional invite taken) |
  MODEL opus -> DELIBERATE DESCENT to B auto rung (Seth's July 16 call,
  Opus audit compensates); landed same day, audited per land-unit:
  lanes fresh (unit 170/170, Vite build, check-hex clean), full diff
  read, un-nest verified in the JSX tree (toggle children = chevron +
  name/sets only), slot-sizer idiom untouched (slot margin-left 8px
  supplies the gap, toggle padding-right zeroed to avoid doubling -
  commented), stopPropagation/preventDefault removal verified SAFE by
  direct read (pill is type=button, no ancestor click handler remains),
  CSS additions layout-only. No deviations. SMOKE (wave checklist):
  live heading at 360px with a long name - order chevron/name/sets/
  pill/summary, pill tap opens sheet without toggling collapse,
  no layout shift when pill flips Tracked/Not-tracked, completed
  view unchanged
- LANDED 859f3d3 | mw2-identity-stamp-contract.md | issues 8+9 in one
  unit: id-only identity PATCH accepted (guard counts
  identityParse.provided, identity application un-nested from the name
  branch as its own if-arm, validation helpers byte-untouched), resolve
  rows uniformly carry userExerciseId (id on userExercise, null on
  catalog/unresolved), "Use that name" gains the mutually-exclusive
  userExercise arm | MODEL opus -> DELIBERATE DESCENT to B auto rung
  (Seth's July 16 call, Opus audit compensates); landed same day,
  audited per land-unit: scope exact (5 files = FILES TO TOUCH), lanes
  fresh in lane (unit 170/170, build, check-hex clean), guard order
  verified by direct read (404 :553 -> 403 :560 -> SESSION_COMPLETED
  :570 -> identity :577, all in-transaction, userId passed to
  validateOptionalExerciseIdentity), integration tests RUN AT LAND TIME
  in the main tree per the block - 2 suites 17/17 green incl. the new
  5-row PATCH matrix (owned-id 200/name-unchanged, catalog-id converse,
  {} still 400, foreign-id 400, completed 400) and exact-shape resolve
  asserts. One flagged non-deviation accepted: userExercise.findMany
  index build now runs only in the name-derivation branch (was wasted
  work when identity provided). Bonus verified: handleLinkRow :341
  already forwards userExerciseId, so the suggest-list path gains
  custom stamping for free. SMOKE (wave checklist): resolve a custom
  exercise in the sheet -> "Use that name" -> pill flips Tracked
  without rename side effect; issue-9 path now stamps structural id
- LANDED 9511e8f | mw3-reopen-completed-session.md | POST
  /sessions/:id/reopen + two-step-confirm "Reopen workout" on the
  completed view: un-finish IS the edit path (asks 10+11) | MODEL opus
  -> DELIBERATE DESCENT to B auto rung (Seth's July 16 call); landed
  same day, audited per land-unit: scope 6 of 7 allowed files
  (index.css untouched - permitted "only if needed", affordance reuses
  btn/row/stack), lanes fresh in lane (unit 170/170, build, check-hex
  clean), handler verified by direct read (guard ladder 401 -> 400
  bad-id -> findFirst{id,userId} 404 -> 400 not-completed; update
  touches ONLY completedAt; include shape byte-identical to
  completeSession), "reopened" local-apply branch string-compares ids,
  confirm copy carries all three consequences (back to in-progress,
  leaves history/analytics until re-finished, nothing lost),
  integration RUN AT LAND TIME in main tree: lifecycle suite 11/11
  green incl. all 3 new reopen tests (round trip with post-reopen set
  write + re-complete, live 400, foreign 404). ONE DECLARED DEVIATION
  accepted: confirm auto-dismiss 10s not the idiom's 5s (three-sentence
  consequence copy needs reading time; commented at the effect).
  SMOKE (wave checklist): complete a workout -> Reopen workout ->
  confirm copy reads right -> live builder + finish dock take over in
  place -> dashboard resume hero reappears -> finish again puts it
  back in history/analytics
- LANDED c005c2a | mw4-per-side-analytics-audit.md | DIAGNOSIS, no code:
  unilateral L/R end-to-end trace with per-surface verdicts | MODEL auto
  -> Channel B auto rung, dispatched + landed July 16 (Opus resident
  session), audited per land-unit: lane 170/170 fresh, zero source
  edits, spot-checks all confirmed by direct read/grep/count (analytics
  side-blind - zero side refs in server/src/analytics; detection is
  exactly \bsingle\b at SessionDetailPage.jsx:207-211; heading :1359
  raw-row count vs toolbar :1318 pair count mismatch real; catalog 50
  one-arm / 16 single of 873 exact). VERDICTS: storage+enrichment
  CORRECT (side persists, engine side-blind by construction); volume /
  set counts / e1RM all AMBIGUOUS (L+R = 2 full sets everywhere -
  coherent but needs the pair=1-or-2 product ruling; series bucketing
  does NOT double-count sessions; planned-vs-actual adherence hits 2.0
  on paired work); display BROKEN (heading says "2 sets" while per-side
  toolbar says 1 pair); detection BROKEN (misses all ~50 One-Arm
  catalog names, false-positives on "single response"). Overall:
  trustworthy WITH CAVEATS; MW6 must NOT ship on the \bsingle\b
  detector alone. Full report preserved verbatim in
  mw4-per-side-analytics-audit-FINDINGS.md (DELIVERY.md is gitignored);
  5 product-ruling questions for Seth/Fable recorded there - MW6's
  contract finalizes against it
- LANDED 87d6b37 | mw5-decimal-values-audit.md | DIAGNOSIS, no code:
  decimal reps/RPE/RIR end-to-end trace | MODEL auto -> Channel B auto
  rung, dispatched + landed July 16 (Opus resident session), audited
  per land-unit: lane 170/170 fresh, zero source edits, spot-checks all
  confirmed by direct read/grep (parseNullableInt quote exact at :40-52;
  rir-1.5 -> clean 400 on BOTH create :822-827 and update :1037-1042;
  Math.round(reps) on exactly the 5 claimed surfaces; live reps input
  really is step=1). VERDICTS: reps 8.5 trustworthy except ONE display
  bug - analytics top-set strings Math.round to integer (AnalyticsPage
  :73, WeeklyReport :228, StatTiles :126, ExercisesView :352,
  StrengthTrendChart :22 - 8.5 renders as 9); RPE 8.5 CORRECT
  end-to-end (Float, effort pooling derives 1.5, formatEffort keeps
  fractions); RIR 1.5 NOT SUPPORTED by design - clean 400, never
  stored, never truncated. RECOMMENDATION (ruling stays Fable/Seth):
  REJECT decimal RIR, do NOT widen the column - half-steps already
  expressible via RPE 8.5; optional client-side integer gate to avoid
  the flash-error-and-reload UX. Factual correction to the block's
  context: step="0.01" is TEMPLATES only (SetRow.jsx:43); live session
  reps use step="1" (AMBIGUOUS, not broken). Fix-block candidate: the
  shared reps formatter to replace the 5 Math.round sites. Full report
  verbatim in mw5-decimal-values-audit-FINDINGS.md
- LANDED bfbbe56 | mw6-per-side-auto-first-pair.md | per-side detection
  fix (One-Arm/one-leg names covered, "single response" dodged) +
  auto-create the first L/R pair on qualifying commit or override-on
  with zero sets (delete respected, no re-trigger loop) + stepper
  relabeled "Pairs" in per-side mode (PlanningSetCountControl gains a
  default-"Sets" label prop) + collapsed-summary side cue + decimal-RIR
  client input gate | MODEL opus -> DELIBERATE DESCENT to Channel B auto
  rung, dispatched + landed July 16 (Seth's standing "run on auto, Opus
  audits" call); finalized July 16 by Fable against MW4's findings +
  Seth's rulings (mw6-seth-rulings.md) - rulings baked in: pair = 2
  sets, heading keeps raw row count, RIR stays rejected. Audited per
  land-unit: scope exact (2 files; index.css untouched - permitted
  "only if needed", RIR hint reuses muted/small), lanes fresh in lane
  (unit 170/170, build, check-hex clean IN THE LANE), full diff read,
  detector name table re-run INDEPENDENTLY by node eval with the real
  isBlankSessionExerciseName (13/13), single creation path verified by
  direct read (onCreateSet {perSide:true} -> onCreateSetForExercise
  :2238 -> createSetPairForExercise :285, L then R), commit-vs-draft
  discipline verified (onExerciseCommitted fires only from
  commitExercise PATCH success :515), override-false-wins verified
  (derivePerSideMode :221 returns early), completed path triple-guarded
  (chip unrendered, exerciseCommitted undefined, isCompleted guard),
  no-respawn verified (no effect watches empty sets; busyRef +
  sets.length guards). No deviations declared, none found. ONE JUDGED
  NOTE (accepted, not a deviation): detector narrows bare \bsingle\b -
  names like "Squat (single)" no longer auto-trigger; the block made
  the name table the contract and existing sided data keeps per-side
  mode via anySetHasSide regardless of name. SMOKE (wave checklist):
  commit "One-Arm Dumbbell Row" on a zero-set live exercise -> one L/R
  pair appears (L then R), stepper reads "Pairs" while heading says
  "2 sets", collapsed summary shows "Last R 60 x 10", typing 1.5 in RIR
  is blocked with the inline whole-numbers hint (no error flash), RPE
  8.5 still saves
- LANDED 52e84cf | mw8-reps-display-formatter.md | shared reps formatter
  (client/src/lib/repsDisplay.js, formatEffortValue semantics) replaces
  Math.round(reps) at the 5 analytics top-set sites (AnalyticsPage,
  WeeklyReport, StatTiles, ExercisesView, StrengthTrendChart) so 8.5
  reps stops rendering as 9; null-reps gating per site untouched |
  MODEL auto -> Channel B auto rung, dispatched + landed July 16 (Opus
  resident session, after MW6 landed bfbbe56); authored July 16 from
  MW5's fix-block candidate. Audited per land-unit: scope exact (6
  files = FILES TO TOUCH incl. the one NEW lib file), lanes fresh in
  lane (unit 170/170, build 129 modules), full diff read, formatter
  verified byte-for-byte the formatEffortValue body (the block's
  "mirror" ask taken literally), node eval re-run INDEPENDENTLY
  (8.5->"8.5", 8->"8", 10.25->"10.3" one-decimal policy, stated in the
  report), remaining Math.round in AnalyticsPage confirmed
  adherence/effort-coverage percentages only (out of scope), single
  definition + 5 imports verified by grep, null-reps ternaries
  untouched at all 5 sites. No deviations. One reviewer trivia fix: a
  stray blank line the swap left in StrengthTrendChart.jsx (build
  re-run green after). SMOKE (wave checklist): log 8.5 reps on a top
  set -> analytics Top set tile, weekly report, exercise detail
  top-set list, and strength trend delta chip all read "x 8.5", not
  "x 9"; integer reps still render bare (no "8.0")
- LANDED b6c885f | mw7-custom-exercise-library-view.md | third
  "Custom exercises" tab in the Library yours-area: rows with
  Main/Assists summaries, confirm-guarded delete with honest SET-NULL
  consequence copy, actionable empty state naming the "Not tracked -
  add?" pill; client half only | MODEL auto -> Channel B auto rung;
  landed July 16, audited per land-unit: scope exact (3 files), lanes
  fresh (unit 170/170, build, check-hex clean), claims verified by
  direct read/grep (window.confirm IS the page's existing delete idiom
  at :176/:201 so matching it satisfies the block; server really
  returns { userExercises } with validated {muscle:
  primary|secondary} designations; .programs-type-tablist has exactly
  one consumer so the 1fr 1fr -> repeat(3,1fr) base-rule change is
  sound, <=420px collapse untouched; community area zero-diff). FOUR
  DECLARED DEVIATIONS, all accepted: tab titled "Custom exercises"
  (matches Saved-workouts/Saved-blocks idiom), visibility filter
  hidden on the exercises tab (no public/private axis - dead UI
  otherwise), template empty-state cards gated tab!=="exercises"
  (no-op on template tabs), compact card presentation (block left it
  open). SMOKE (wave checklist): Library -> Custom exercises tab shows
  count + rows, delete confirms with the honest copy and removes the
  row without reload, empty state actionable, community area
  unchanged, 3-up tablist reads right at 360px

Off-wave dev-tooling unit, authored July 15 (Fable, Seth's go-ahead after
the build-path question). Rides `not-tracked-ux-wave` for landing (one
standalone new file added to the pending pre-main gate diff - flagged
here so the gate expects it); dev tooling only, never enters the client
build or server runtime.

- LANDED 018a6ae | cw1-cursor-watch-dashboard.md | zero-dependency local dashboard
  (`scripts/cursor-watch.mjs`, Node built-ins only, 127.0.0.1) for
  watching Channel B Cursor runs live: fs.watch + git-diff polling of the
  lane worktree, SSE to an embedded dark mission-control page (activity
  feed, diff-stat bars, typing pane, DELIVERY.md flips DELIVERY READY);
  zero tokens to run by design | MODEL auto -> B-auto rung (free);
  file-disjoint from everything (single new file), no serialization
  constraints; dispatched + LANDED July 15 same day, Channel B auto rung
  (headless CLI in the lane worktree), Fable-audited per land-unit:
  lanes re-run fresh in the lane (unit 170/170, Vite build 128 modules),
  live contract spot-checked against a scratch dir (200 text/html, file
  write -> WORKING event, DELIVERY.md -> DELIVERY READY, missing lane
  exits 1), imports all node: built-ins, no external URLs, scope exactly
  the 1 new file, no deviations
- LANDED a26a2c8 | cw2-cursor-watch-autoopen.md | auto-open flags for the CW1
  watcher (--open at startup, --open-on-activity with once-per-run
  re-arm on DELIVERY.md removal/branch change, --open-cmd test override)
  so the dashboard POPS the moment Cursor starts working; dispatch-unit
  skill amended same day to start/open the watcher at dispatch time |
  MODEL auto -> B-auto rung; SAME FILE as CW1 - serialized after CW1
  landed 018a6ae; dispatched + LANDED July 15 same day, Channel B auto
  rung, Fable-audited per land-unit: lanes re-run fresh (unit 170/170,
  Vite 128 modules), full diff read, live once-per-run + re-arm cycle
  spot-checked (atStart=False, afterFirst=1, afterSecond=1,
  afterRearmWrite=2), no deviations. Watcher now runs persistent via a
  Startup shortcut with --open-on-activity (Seth's "anything ever" ask)
- LANDED 6907d4a | cw3-cursor-watch-frontier-visuals.md | frontier-agent
  visual overhaul (phase-driven accent system, agent-presence orb,
  tool-call card feed, event-rate sparkline) + the unmissable DONE
  moment (page sweep + title/favicon state + --notify OS toast with
  --notify-cmd test override); design fully specified in the block -
  MODEL auto is DELIBERATE, named rung exhausted until 7/17 reset |
  SAME FILE as CW1/CW2 - serialized after CW2 landed a26a2c8;
  dispatched + LANDED July 15 same day, Channel B auto rung,
  Fable-audited per land-unit: lanes fresh (170/170, Vite 128), page
  driven in a REAL browser (Playwright: WAITING/WORKING/DELIVERY all
  render, titles flip, zero console errors), notify contract live
  (afterDelivery=1, afterMoreWrites=1), scope exact, no deviations;
  papercut logged (non-git watch dir lets git walk up to an enclosing
  repo - totals chip can count foreign files; real lane is always a
  worktree, unaffected). Seth's visual sign-off owed on the next live
  run. Resident watcher + Startup shortcut now run
  --open-on-activity --notify

NT-wave — **COMPLETE: MERGED TO MAIN `c473e21`, July 15** (gate passed,
smoke passed, ff-only `57b1fc8..c473e21`, 28 commits, no migration). All
five units below are in `main`; the entries stay for history. Gate
results, the rename ruling, and the one knowingly-shipped finding (nested
`<button>` on the live path) are in `docs/HANDOFF.md`. NOTE: the branch
`not-tracked-ux-wave` LIVES ON as CW1's landing branch — not a deletion
candidate.

Authored July 11
(Fable), branch `not-tracked-ux-wave` (off `e960645` = main `57b1fc8` +
one docs commit). Design/contract source:
`docs/design/not-tracked-add-flow-brainstorm.md` - direction A (catalog-
seeded stepped flow) with direction B's explicit-role picker as its final
step; body-map C parked. Seth settled the doc's three open questions July
11: (1) variant-of seeding IS in scope, (2) the retroactive-attribution
message lives in the sheet's success moment only - brief, every time,
(3) the pain is BOTH structural and visual, so NT2 carries a visual bar,
not just flow criteria. No schema change, no migration anywhere in the
wave.

Dispatch order: NT1 -> NT2 -> NTFIX1 -> NT3, strictly in that order (NT2
depends on NT1's payload; NTFIX1 fixes NT2's smoke findings and NT3 shares
both client files with NTFIX1 and NT2). NT1 and NT2 are file-disjoint
(server-only vs client-only) and may be dispatched back-to-back for one
review session per the batching rule. NTFIX1 and NT3 both touch
AddExerciseToLibrarySheet.jsx + SessionDetailPage.jsx, so they are NOT
disjoint - serialize: NTFIX1 lands, then NT3.

- LANDED f4baee3 | nt1-search-secondary-muscles.md | searchCatalog rows
  gain secondaryMuscles (additive, pure) so the client gets the full
  seeding profile from the existing search endpoint | MODEL auto,
  mechanical - audited clean (170/170 unit lane fresh, no scope creep),
  pushed to staging
- LANDED f26e783 | nt2-add-exercise-stepped-sheet.md | rebuild
  AddExerciseToLibrarySheet as the stepped flow (suggest-link / seed /
  curate with segmented Main-Assists picker / done with retroactive
  line) + link wiring into SessionDetailPage | MODEL opus (Seth's call
  July 11; Fable withheld for the pre-main gate). Delivered by Composer
  (Cursor out of Opus tokens), audited by Opus in Claude Code instead of
  Sonnet: both lanes re-run fresh green (client build; server 170/170
  tripwire), all 11 acceptance criteria verified, API row/resolve shapes
  and CSS tokens confirmed against source. One reviewer fix folded in
  (dropped a vestigial getMuscles fetch that gated the picker on discarded
  data). Findings B-D (dead ternary, create-succeeds/stamp-fails edge,
  tablist a11y) logged for the pre-main Fable gate. Pushed to staging.
- LANDED e0ba383 | ntfix1-nt2-smoke-bugs.md | NT2 smoke-test fixes B/C/D/E
  landed July 12 (Sonnet audit): cloud-branch delivery
  `cursor/ntfix1-nt2-smoke-bugs-1341` (PR #3, now MERGED) ff-merged
  `804b65b..e0ba383`; both lanes re-run fresh green (client build; server
  170/170 tripwire). (F) "Failed to fetch" = DIAGNOSED, no client defect
  (Render cold-start/502 ranked cause; did NOT reproduce on a warm backend
  in the live Playwright test) - stays open for the pre-main gate. NEW
  finding G from the live test (pre-existing NT2, for the gate): the
  id-only `{ userExerciseId }` stamp PATCH 400s every time (server merges
  identity only inside the exerciseName branch) - needs a client/server
  contract reconciliation block. (This entry was stale-QUEUED until July
  14 - the landing session updated HANDOFF but not QUEUE.)
- LANDED 98963f6 | nt3-entry-deferability-polish.md | completed-session
  pill goes interactive, create-only sheet context (skip suggest, hide
  "Use that name", no userExerciseId stamp on locked rows - which also
  sidesteps bug G on this path), tokens-only tracked-pill fade-in |
  FIRST AUTONOMOUS DISPATCH LANDED (relay v5 trial, July 14): MODEL auto
  -> Channel B auto rung, CLI headless in C:\dev\worktrees\cursor-lane,
  Fable-audited per land-unit: both lanes re-run fresh (unit 170/170,
  client build green), scope exact (3 files = FILES TO TOUCH), all 7
  criteria verified incl. by direct read (open-reset seeds name +
  clears hadSuggestStep before the completed branch forces seed; parent
  create handler skips the stamp PATCH without userExerciseId but still
  invalidates + refreshes name resolution; live path a no-op change;
  check-hex clean, motion tokens defined, slot-pill class real on both
  crossfade variants). Declared addition (fade-in) within the block's
  pill-polish allowance. One dispatch hiccup, lesson pinned in
  dispatch-unit: the CLI remembers the last-used --model, so the first
  flagless dispatch inherited the exhausted haiku and quota-refused -
  ALWAYS pass --model explicitly. **NT-WAVE IS NOW CODE-COMPLETE - next
  gate is the pre-main Fable/Opus review of the full branch diff**
  (open items for it: finding F cold-start confirmation, finding G
  stamp-contract reconciliation, NTFIX1 + NT3 staging smoke)
- LANDED 888e44d | (NO BLOCK FILE - see notes) | NTFIX2: four
  not-tracked findings-fixes - (1) finding G/HIGH stamp-contract fix,
  (2) stuck seed spinner, (3) pill interactive on a stale committed name
  mid-edit, (4) suggest->seed duplicate-search dedupe | **UNUSUAL
  PROVENANCE, recorded so it is not mistaken for a normal unit.**
  Authored July 14 by Claude Code session ee60a330 at Seth's "fix all
  findings" request - NOT by Cursor, NOT from a task block, so there is
  no block file and no DELIVERY.md (the session's own final report stood
  in for one). It fixed the four findings, ran its lanes, asked "want me
  to land this?", got no answer, and closed - leaving the work
  uncommitted in the main tree, where a pre-gate check found it July 15.
  Parked verbatim on parked/unattributed-g-fix (532125d), then audited
  per land-unit BEFORE landing: lanes re-run FRESH in the lane worktree
  (unit 170/170 in 14 suites, client build green 128 modules), never
  trusted from the report; check-hex clean; scope exactly the 2 claimed
  files, nothing unexpected; all four criteria verified by direct read,
  incl. finding G's mechanism confirmed independently against
  sessionController.js:531 (empty-patch guard counts only
  exerciseName/notes) and :575 (identity stamping nested inside the
  name-change branch). Deviations stated, not hidden: Claude Code
  authoring product code (covered by the AGENTS.md direct-fix exception
  + Seth's explicit ask, but a deviation), and fix 4 being an
  optimization beyond the findings. Behavior note for the gate: the
  stamp PATCH now carries exerciseName, so the row RENAMES to the
  sheet's name on create - NT2's handler always anticipated this
  (pre-existing oldName !== name invalidation) but the rename never
  fired while the PATCH 400'd, so it is newly LIVE behavior, not new
  code. Cursor exonerated for the orphaned work: every recorded
  cursor-agent session July 14 ended by 10:11 and all NT3 relay activity
  clusters 10:00-10:53 - no lane-isolation breach.

## Landed - N-wave (analytics UI rebalance)

N-wave, authored July 10 (Fable), branch
`analytics-rebalance-wave` (off catalog-fk-wave HEAD `3d4e874`, which is
main `13a1e59` + N-wave spec docs + one settings commit). Spec/contract
source: `docs/specs/analytics-ui-rebalance.md` (passes 1-4 + F-test).
A-wave is fully MERGED TO MAIN + prod-rolled (July 8) - see Landed.

**FILENAME COLLISION NOTE:** the June nav-wave shipped task files named
`n1-bottom-tab-bar.md` / `n2-profile-hub.md` / `n3-analytics-subviews.md`
(all LANDED, see below). The N-wave's n1/n2/n3 are DIFFERENT units with
different slugs - always dispatch by full filename, never by bare "n1".

**Split (settled with Seth July 10): Cursor takes the relay lane, Fable
implements the judgment-heavy/security units directly.** Cursor lane:
N1 -> N2 -> N3 -> N6. Fable-direct: N5 -> N4 -> N7 (N5 is the isolation
surface; N4/N7 are the mock-signed visual units). Parallel-safe pairs:
N1 (Cursor) with N5 (Fable) are file-disjoint by design; N2 (Cursor) may
run while Fable finishes N5. N4/N7 share `AnalyticsPage.jsx` with each
other AND with N3 - strictly sequential: N4 -> N7 -> N3.

- LANDED 11b9c71 | n1-effort-neutral-formatting.md | shared weight/effort
  formatters + component sweep + engine effort-unit serialization |
  Cursor delivery, FABLE-audited (deeper than the standard pass - Fable
  authored the block): unit lane 157/157 + client build re-run fresh;
  both node-eval contracts re-run independently incl. extra formatEffort
  cases (10-rir RPE display conversion, fractional, null "- RIR");
  format-definition grep = only the shared module; remaining RIR hits
  all label/HOW_*/unlock copy; formatWeight-vs-formatEstimate semantics
  spot-checked (logged weights use formatWeight, e1RMs formatEstimate);
  AnalyticsPage's kept loadWeightUnit import verified live (execution
  verdict formatters). No deviations
- LANDED 46b8736 | n2-headline-stat-rebalance.md | engine topSet +
  topSetSeries, adaptive volume headline, Top set replaces Best lift |
  Cursor delivery, Sonnet-audited: unit lane 162/162 + client build
  re-run fresh; scope exact (6 files, matches FILES TO TOUCH); topSet
  tie-break (weight then reps) and topSetSeries session-bucketing
  verified by direct read against e1rmSeries's existing pattern - same
  performedMs grouping key, confirmed mirrored as required; new fixture
  tests read (not just trusted): topSet != bestSet case, no-e1RM case,
  tie-break case, topSetSeries chronological-without-e1RM case, all 4
  substantive; grep clean for e1rm access in StatTiles/WeeklyReport and
  single EFFORT_COVERAGE_HEADLINE_THRESHOLD definition; stat order
  verified in both components (adaptive headline pair, then Top set,
  then Top gain / Workouts-Sets-Top set-Top gain). One documented
  deviation: Top set omits "x reps" when reps is null (weight-only
  sets) instead of printing "x 0" - sensible, not bounced. pickTopSet
  helper duplicated verbatim between StatTiles.jsx and WeeklyReport.jsx
  (not factored to a shared lib) - minor, not in the block's scope, not
  worth a bounce. N4 (Fable-direct) is next per the wave order
- LANDED c4e3ba8 (FABLE-DIRECT) | n5-exercise-detail-endpoint.md |
  all-time exercise index + detail endpoint + rep-target engine | built
  in worktree C:\dev\worktrees\n5 (branch unit/n5-exercise-detail,
  merged ff); unit lane 153/153 (16 new fixture tests) run fresh in BOTH
  trees; isolation verified by grep (userId in every findMany where);
  purity grep clean; routes/controller load-checked. Documented
  deviations: detail core stats ALL-TIME, from/to bounds only
  weeklyVolume (default trailing 12w); totals.effectiveSets = attributed
  count. N3 unblocked on the server side (still waits on n7 for
  AnalyticsPage)
- LANDED 4f37361 (FABLE-DIRECT) | n4-strength-tab-rework.md | strength
  tab progression-first + mock-signed top-set sparklines | built in the
  main working tree (Cursor idle, no worktree race); scope exact (3
  files); client build green; unit lane 162/162 fresh (tripwire only,
  no server touch); implementation checked against the July 9 mock
  artifact's actual source (bare-number endpoint labels, no
  intermediate dots, 2px line + 10% wash + ringed 9px end dot + 40px
  plot, delta chip "+20 lbs · top set 245 × 3"); e1rm grep clean in the
  strength view, HOW_BEST_E1RM removed; no hex in CSS diff, all new
  colors token-derived; footer link ?view=exercises (muscles fallback
  until n3 - by design). Visual smoke owed to Seth on staging. N7
  unblocked (AnalyticsPage.jsx now free)
- LANDED d1b2871 (FABLE-DIRECT) | n7-muscles-heatmap.md | binned volume
  heatmap + table de-noise + 2W day-granularity preset | unit lane
  167/167 (5 new fixtures: 14 day cells for a 2W range incl. inclusive
  range-end cell + per-week averages preserved, weekly-unchanged at 28d,
  granularity rule day<=14d/week>14d, summary day-mirror + meta key) +
  client build re-run fresh after all edits. Ramp validated with the
  dataviz ordinal validator for ALL TEN palette x mode combos (block
  asked for 8; chill exists too): shared light P 51/66/81/100 and dark P
  40/60/80/100 vs surface-2 all PASS (light-end contrast 2.01-2.94:1,
  all gaps >= 0.06, single hue); iron light is unfixable by P constants
  (raw amber = 2.12:1 ceiling on its near-white card, total dL span <
  3 gaps) so its ramp anchors DOWN toward --color-text (accent
  100/74/49/25) - PASSES (gaps >= 0.13, hue spread 6deg), same relief
  precedent as the index.css chart-emphasis note. Empty cell = border-
  token neutral, legend-keyed "not trained", not ramp step 1. In-scope
  fix: rangeForWeeks now spans exactly N*7 calendar days inclusive
  (before this the end-of-day `to` produced a 5th mostly-empty weekly
  bucket on a "4 weeks" chip and would have made 2W = 15 day cells,
  violating the 14-cell criterion). perMuscle series keys renamed
  periodStart/periodEnd (only consumer was the replaced Trend
  component). Two documented deviations outside FILES TO TOUCH, both
  export wiring: analytics/index.js re-exports the new helpers;
  StatTiles.jsx gains ONE export keyword so
  EFFORT_COVERAGE_HEADLINE_THRESHOLD stays single-definition (N2's
  landed criterion) instead of being duplicated. Day cells are hover-
  enhancement only (no focus targets), weekly cells keep per-cell
  focus + aria labels; execution table's unlock cells deliberately
  untouched (this block de-noised the muscles table only). Visual smoke
  owed to Seth on staging. N3 unblocked (n5 + n7 both landed)
- LANDED 537309c | n3-exercises-tab-shell.md | 4th tab: all-time lookup +
  inline detail with rep-target hero | Cursor delivery, Sonnet-audited:
  unit lane 167/167 + client build re-run fresh; scope exact (5 files,
  matches FILES TO TOUCH); both mandatory F-test traps verified fixed by
  direct read - tabs grid repeat(3,...) -> repeat(4,...) with shrunk
  font/padding, setView/setExerciseParam both use the functional
  URLSearchParams-merge pattern (grep for bare `setSearchParams({ view`
  = no matches); client endpoints (`/analytics/exercises`,
  `/analytics/exercise`) confirmed matching n5's landed server routes;
  getExerciseDetail sends exactly one identity param (exerciseId else
  userExerciseId); rep-target rows verified using roundToPlate + muted
  `--extrapolated` class + shared footnote; both empty states
  (no-exercises-ever links to /log-workout, no-data-in-range names a
  longer-range action) read as actionable, not bare; no hex in CSS diff.
  Two documented deviations, both sensible: exercise param encodes user
  exercises as `user:<id>` (mirrors server identity key, block named the
  param not the exact encoding); AnalyticsPage renders the exercises
  view even when the range summary is empty (so all-time lookup still
  works pre-N6 empty-state work). One un-bounced addition: tapping an
  already-selected roster row toggles the detail closed (inline-expand
  consistency, not specified but harmless). Visual smoke (4 tabs at
  360px) still owed to Seth on staging. N6 unblocked (last N-wave unit)
- LANDED 28efeba | n6-frontier-polish.md | two-variant empty state,
  range persistence, KPI tap-through | Cursor delivery, Sonnet-audited:
  unit lane 167/167 (tripwire, no server touch) + client build re-run
  fresh; scope exact (4 files, matches FILES TO TOUCH, `analyticsRangePref.js`
  is the one NEW file). New-user vs out-of-range empty-state matrix
  verified by direct read (`isNewUser` gated on `indexReady && exerciseIndex
  != null && indexExerciseCount === 0`, rides N3's `getExerciseIndex` as
  instructed, no new endpoint added); range accessor confirmed byte-for-byte
  the `weightUnitPref.js` pattern (key `workoutdb-analytics-weeks`, Set of
  2/4/8/12, invalid/missing falls back to 4, try/catch on both read and
  write); KPI tile tap-through verified - Top set and Top gain resolve
  `exerciseId` and link to `?view=exercises&exercise=...`, volume headline
  links to `?view=muscles`, `StatTile` only wraps in `<Link>` when `to` is
  truthy so the empty-stimulating tile (`to` omitted) stays a plain div, no
  dead links; `.stat-tile--link` verified >=44px with `:focus-visible` and
  `:hover` both via `color-mix(var(--color-interactive) ...)`, same idiom
  as `.range-chip`; no hex in CSS diff. No deviations. **This was the LAST
  N-wave unit - the wave is now code-complete on `analytics-rebalance-wave`,
  next gate is the pre-main Fable review of the full branch diff.**
  (Gate since passed: pre-main Opus review clean July 10, N-wave MERGED TO
  MAIN `8068ffb`, What's New follow-up `57b1fc8` - see HANDOFF.)

Settled during authoring (were "still open" in the spec): rep ladder =
1/3/5/8/10/12/15 (20 rejected - Epley error exceeds a plate increment
that far out); coverage threshold = 0.6 named constant; plate increments
2.5 lbs / 1.25 kg. Spec open item 3 (Strength folding into Exercises)
stays a post-N flag.

## Candidates (next units, not yet authored as blocks)

- **Per-side L/R comparison analytics (ruling 3, Seth-confirmed July 16:
  own unit, NEXT wave, needs a Fable design pass first).** Scope sketch
  recorded in mw6-seth-rulings.md's interpretation section: plumb `side`
  from the analytics controllers into enrichSet (engine is side-blind by
  construction today), per-side splits in exerciseDetail, comparison UI
  in the Exercises tab (each side's numbers + same/different verdict
  with the delta). Plan-adherence pairs/planned (ruling 2) rides the
  same unit - same plumbing.
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

- LANDED eeaa30c | a6b-exercise-id-backfill.md | idempotent dry-run-default
  backfill script stamping exerciseId/userExerciseId onto historical
  Template/Session/BlockWorkoutExercise rows | scope exact (1 file); dry-run
  against staging re-run fresh twice, identical both times, all three tables
  report zero null-identity rows (A4's write-path stamping already covers
  current staging data); assertSafeForReset guard + --apply-gating verified
  by direct grep, not just the delivery report; --apply not run anywhere per
  RUN RULES
- LANDED c7c8ca6 | a5-exercise-picker.md | GET /exercises/search (pure
  searchCatalog module, no Prisma/fs) + live-session typeahead writing
  exerciseId/userExerciseId on commit; free text stays first-class | scope
  exact (11 files, matches FILES TO TOUCH); full suite re-run fresh 185/185
  (not the 129-unit number alone - see the attribution-fix note below for
  why the full run mattered here); searchCatalog fixture tests independently
  read, not just trusted - all 5 pin real behavior (exact>prefix>substring,
  userExercise-before-catalog, alias with matchedAlias, stretching-category
  exclusion, limit); purity grep clean; no portal; no hex in CSS diff
- LANDED 0d2118e | (no task block - Sonnet direct, direct-fix exception) |
  fixed a real A4 regression surfaced while auditing A5/A6b: attribution.js's
  source check only matched "userExercise", never learned the
  "userExerciseId" tier A4 added to resolve.js/enrichSet.js, so any session
  exercise resolved via stored id (the normal case post-A4) silently got
  zero muscle attribution | root-caused by tracing resolve.js -> enrichSet.js
  -> attribution.js after `exercises.integration.test.js`'s custom-exercise
  analytics test failed on the first full suite run since staging's
  migration made the tier reachable; one-line fix, diagnosis was the bulk of
  the work so shipped directly per the stated exception rather than a
  Cursor diagnosis-block round trip; not in A5/A6b's FILES TO TOUCH, kept as
  its own commit
- LANDED 0743070 | a4-exercise-fk-linkage.md | nullable exerciseId/
  userExerciseId on TemplateExercise/SessionExercise/BlockWorkoutExercise
  (+ at-most-one CHECK), blockWorkoutSetId groundwork on WorkoutSet,
  write-path stamping helper (catalog beats userExercise, mirrors
  resolveExercise tier order), resolve.js gains a stored-userExerciseId
  tier ahead of name resolution | scope exact (13 files, matches FILES TO
  TOUCH); unit lane 124/124 + prisma validate re-run fresh; migration SQL
  verified 7 ADD COLUMN / 7 indexes / 7 SET-NULL FKs / 3 CHECK, no DROP/
  NOT NULL/DEFAULT; schema types match the block's exact spec (String? on
  Exercise FK, Int? on UserExercise FK - L3's wrong-FK-type lesson
  avoided); analyticsController id-selection precedence spot-checked
  against existing exerciseName derivation (sessionExercise ?? template
  Exercise ?? null) - identical shape; integration lane written (4 tests)
  but NOT run per the block's sequencing flag; migration NOT applied to
  any environment yet - staging needs A1's catalog migration + seed first
  (choreography below)
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
