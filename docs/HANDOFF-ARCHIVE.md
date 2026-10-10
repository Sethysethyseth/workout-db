## ARCHIVED October 10, 2026 (Opus session) - the mid-wave MX smoke list
## (smoked by Seth on his phone Oct 10, results in HANDOFF) and the Oct 9
## night QOL pre-main gate session log, moved verbatim.

## MX smoke items (carry forward - Seth smokes once at wave end)

From MX1-4 (`2cdeee0`), on a phone, two palettes, both modes:
1. Cold load `/analytics`: skeleton at once (no blank scene), title
   wipes in, KPI tiles rise in order, numbers roll up from 0 (no flash of
   the final number first), top hairline charges.
2. Range chips: the selected pill slides; KPIs roll from old to new
   values; the page does not replay its entrance.
3. View tabs: the pill slides; the new view slides in from the tab's
   side; Muscles bars charge with a glowing head, Strength sparklines draw
   then dot pops, Execution meters charge.
4. Exercises view at 390: full names wrap (no "..."), one big top-set
   number plus a delta line; tapping a row still opens the detail.
5. Crimson dark and forest dark: gains read in the success color, never
   danger red or the accent green.
6. All card titles one size; only the page title is bigger.
7. Empty state (fresh account / tiny range): ghosts breathe slowly.
8. OS reduce-motion on: everything prints at its final state, pills jump.

From MX5-6 (`d309919`):
9. Analytics on a cold load: the range chips, view tabs and chart/table
   toggle each SHOW a selected pill (it was missing until the d309919
   reviewer fix).
10. Bottom tabs: the accent bar + halo glide to the tapped tab, the icon
    pops once; pages slide left/right in tab order; the masthead, tab bar
    and workout bar never get covered or move mid-slide.
11. Tap a second tab mid-slide: the second page wins at once.
12. Desktop (wide window): top bar reads Home / Analytics / History /
    Library / Profile, the pill sits on the active tab.
13. Cold load Home, Library, History, a block run page: a page-shaped
    skeleton on first paint; Library tab counts are a ghost pill, not "0".
14. History: tap a finished workout - its row grows into the summary
    header; Back shrinks it into the row. Open an in-progress workout:
    no fly-in, logging a set is instant.

From MXF1 (`97d028d`, critic round 1 fixes):
15. History: the grow is a card SURFACE from the row into the header, no
    squashed text; Back fades and shrinks into the row as one motion; the
    row is never left invisible.
16. Analytics: full entrance on the first visit, then a quick fade on
    returns; a range change keeps the old numbers dimmed until the new ones
    land, then plays the entrance.
17. Loading: no barbell caption under skeletons; a workout opens on a
    skeleton, not "Loading workout..."; Home and Analytics do not jump.
18. Crimson: Muscles bars and trend lines are not alarm red; forest gains
    are teal, not the accent green.
19. Workout summary: no "Tracked" pills, untracked shows "Track this
    exercise", no empty stat cell.
20. Desktop: the masthead does not shift between pages and the wordmark
    lines up with the page; one wordmark on the boot splash; History month
    headings sit on a surface.
21. TAB SLIDE SPEED (Seth decides now): 420ms as built - keep or trim?

**Updated:** October 9, 2026, night (Opus seat). Session log:
- Seth's smoke finding: the setup strip becomes a hotbar. Authored qolf9
  (no critic round, his call), dispatched on auto in lane 1, landed
  `2d4cb0e` after reviewer fixes (the block's own app-guide copy broke the
  12,000-char guide cap - Cursor stopped correctly; dead pill CSS; chip
  gap). 24/24. Seth smoked and signed off.
- **Pre-main gate (`pre-main-review`) over `b5c6777..HEAD`, 61 commits,
  105 code files.** Read in seat: the migration (3 new tables, cascade FKs,
  no DROP, LF per `.gitattributes`), the key vault (AES-256-GCM, random
  12-byte IV, userId as AAD, 16-byte tag enforced; status returns last4
  only), every new coach/exercise/session handler (all owner-scoped), the
  ask path caps (question 1000, history 12 x 4000, weekly cap covers help),
  and the auth-epoch fix (no stuck loader).
- Gate fuel, three Cursor report lanes (auto, lanes 1-3, ~7-12 min each,
  porcelain-clean), preserved as `qol-gate-r{1,2,3}-*-FINDINGS.md`:
  - r1: unit 578/578, build and hex clean, 23 new tokens all defined, no
    raw colours, schema vs SQL clean, no dead classes; cross-doc drift
    (spec still said N = 15 and the Home strip).
  - r2: every new/changed route SCOPED (none unscoped); vault never logs or
    returns key material; no conversation storage cap (follow-up).
  - r3: 208 criteria re-run on HEAD - 96 hold, 99 reviewer-only, 11
    process-only, 2 "broken", both by qolf9's contract (notes pill removed
    on purpose; the Logging release bullet grew to 29 words).
- **Verdict: PASS WITH FIXES**, both fixed in seat: the What's New Logging
  bullet trimmed to 24 words; the wave spec got a dated amendment (N = 24,
  strip moved and made a hotbar). r1's "does prod's build migrate"
  contradiction is not one - RUNBOOK 10a's "V2 RESULT" already says it
  does not.
- **Rule change (Seth, Oct 9):** prod migrations moved to the staging
  tier - "migrate prod", Claude Code runs them, Seth approves each command
  (AGENTS.md gate 3, RUNBOOK section 9, `b82ad8c`). Seth created
  `C:\dev\secrets\prod-db.env`; the seat generated the prod
  `COACH_KEY_SECRET` into `coach-key-secret.txt` (never shown).
- **"migrate prod"** (4 steps, each approved): staging checksum read
  (matches the file's sha256) -> prod precheck (no row, no tables, User.id
  text; found the blocks_v2/per_side history-row drift) -> apply in one
  transaction (COMMITTED 2026-10-10T00:11:41Z) -> verify (row, 3 tables,
  3 cascade FKs).
- **"push to main":** temp worktree `C:\dev\worktrees\merge-main-1009` on
  `main`, `merge --ff-only origin/quality-of-life-updates`, push
  (`b5c6777..b82ad8c`), worktree removed. Prod API live ~40 s after the
  push; Vercel bundle confirmed. State commit `768f646` kept on the wave
  branch (no docs-only prod redeploy). Seth then set `COACH_KEY_SECRET`,
  repointed staging Render to `main`, and smoked prod: good.

## ARCHIVED October 9, 2026, night (Opus session) - the QOL wave smoke
## checklist, signed off by Seth on staging, moved verbatim at the merge.

## Wave smoke checklist (staging Vercel, on the phone) - SIGNED OFF by Seth, Oct 9

- **Logging setup bar (qolf8 moved it, qolf9 made it a hotbar):**
  - Home has no bar any more.
  - Every live workout has a one-line bar under its title: RIR | RPE,
    Exercise notes, Repeat last, Edit. What is on glows.
  - Quick workout: tap RPE -> RPE glows and the sets ask for RPE. Tap
    Exercise notes or Repeat last -> they turn off and on, and a typed
    but unlogged weight stays.
  - Log a set with RIR, then tap RPE: the sheet opens with a note that
    this workout stays RIR. A block day glows the plan's scale, and
    tapping the other one shows the plan note.
  - Edit opens the full sheet (kg updates live); Profile > Training is
    the same form.
- **The logger:**
  - No unit or RIR toggles inside a workout.
  - Only the exercise name stays pinned. Its trash icon removes the
    exercise after a confirm that counts the logged sets.
  - Builder view / Table view are in sentence case.
- **Repeat last time (on):**
  - Empty sets show grey numbers, including last time's RIR/RPE, and
    "Last time: <date>".
  - The effort hint stays after you log the set, until you type today's.
  - The Sets count matches the rows; picking fewer hides extra grey rows.
  - The set number is outlined with a check, and tapping it logs those
    numbers with no effort.
- **Rest timer:**
  - It starts after a logged set and sits above Finish: -15s, +15s, Skip.
  - It keeps counting when you leave and come back.
  - The Finish dock hides while the phone keypad is up.
- **Finish without effort:**
  - Finish with some RIR missing shows "N sets have no RIR". Add RIR lands
    on the first missing field, highlighted. Finish anyway also works.
  - RIR 0 counts as filled.
- **Discard:**
  - The x on the Home card, or on the In progress bar, asks "Discard this
    workout?".
  - Then a "Workout discarded" notice with a dismiss x.
  - The bar says "Resume" on the phone and lines up with the page on a
    laptop.
- **Coach:**
  - During a workout, the In progress bar no longer covers the text box.
  - The Home chat bubble opens /coach: suggestion rows, and answers come
    into view on their own. Stop is readable.
  - Help questions work with AI access off.
  - Library > Coach lists conversations. Reopening one fills the screen;
    the trash icon and Delete all both confirm first.
- **Own key:** Profile > AI access stacks the form. Save shows "Key ending
  in ...", and Remove confirms.
- **Builder:**
  - Hold an exercise: the list collapses, the card lifts with a glow, and
    a drop reorders it.
  - The selected week, day and Edit tab share one accent look.
  - Recent shows in an empty search. Per side shows only on one-sided lifts.
- **Library > Exercises:** edit your own exercise, rename it, and past
  workouts show the new name.
- **Import:** history with 8+ workout titles keeps 7 and names the
  skipped. A huge AI paste says "too large".
- **Small fixes:**
  - Crimson "good" is green, and Execution shows whole numbers.
  - Analytics > Strength doesn't slide sideways.
  - Opening the app while signed in shows no Login flash.
- **What's New:** read both releases at `/profile/whats-new?preview=1`. The
  Latest update card shows at `/profile?preview=1`.
- **Known, not regressions:**
  - the bottom nav sits under the Finish dock on a live workout (qol12)
  - Last 7 days still counts an unfinished workout (stowed: the summary
    endpoint should exclude it)

## ARCHIVED October 9, 2026, late (Opus session) - the Oct 9 critic and
## fix-round relay log, moved verbatim at the pre-main gate.

**Updated:** October 9, 2026 (Opus seat). Session log:
- Picked up after a /clear. The Oct 8 critic run had shot 67 screenshots
  (A-M) and died before writing its report. The API showed no leftovers on
  demo.critic or the probe account (no live workouts, key, conversations or
  custom exercises, no block saved since Sept 30).
- A fresh critic (separate agent) wrote round 1 from those shots: **5/10**,
  with 3 P1 / 11 P2 / 19 P3. Preserved as `qol-critic-round-1-FINDINGS.md`
  with the seat's triage.
- Live re-check: #5 (the reorder "not sticking") is NOT a bug - the drop
  reorders and marks the block Unsaved. A local draft was cleared and
  nothing was saved.
- REVIEWER FIX, shipped directly as `33cd671`: the Login flash on a
  signed-in cold load (#14).
  - Root cause: `AuthContext.jsx`. At boot, pageshow starts a second
    `/auth/me`; the superseded first call's `finally` cleared
    `authLoading` while the user was still null, so ProtectedRoute bounced
    to /login for about 140ms.
  - Fix: only the current epoch clears it; login and register now settle it
    themselves.
  - Verified: cold loads of / and /analytics never touch /login; logged-out
    users still redirect; login returns to `next`.
- Authored the fix round, file-disjoint, with no index.css (rule 2):
  - qolf1: In-progress bar, Home card, confirm focus, Analytics sideways
    scroll
  - qolf2: coach page thread, composer, Stop, history delete, key form, AI
    access copy
  - qolf3: logger sticky header, Finish dock, labels, Add RIR, last-time cue
  - qolf4: prefs sheet, switches, Notes pill, builder selection, lift
- Not fixed: #11 (BK's caps look), and the pre-existing P3s #26, #28, #30,
  #31 and #32 - stowed.
- Dispatched qolf1/2/3 on auto in lanes 1/2/3 at `702652f`. Lane 2's qol15
  DELIVERY.md was saved to this session's scratchpad first; the commit is
  safe on `cursor/qol15`.
- Smoke items so far (from QUEUE notes):
  - the Sets count picker reads 1 while 4 ghost rows show (qol7)
  - the bottom nav sits under the Finish dock on a live session (qol12)
  - the cold-server loader instead of instant Login for logged-out visitors
    (qol13 gate note)

- Fix round landed, serially:
  - qolf3 `e9a893a` (9 min). Reviewer fixes: the sticky row wrapped the
    "..."; bare Keep buttons now say what they keep.
  - qolf1 `dd2052f` (14 min). Reviewer fix: Resume spans the Home card.
  - qolf2 `2c59605` (12 min). Reviewer fixes: the remove-key copy claimed a
    fallback only entitled accounts get; the coach copy names Analytics
    again.
  - qolf4 `6483ec4` (32 min).
- Every real-app check used the lane's own client on :5173 against the
  local staging-DB API; vite was swapped per lane. The main-tree vite was
  stopped; both local servers were stopped at the end.
- Cleanup on demo.critic: sessions 486-488 were discarded; conversations
  deleted; the fake key removed; no block saved; no draft left.
- qol15 landed last as `9a57cef`, with the fix round folded into its
  details and the date set to 2026-10-09. The ledger moved to RELEASED.md.
  The wave is 19/19 - HARD STOP for smoke.

## ARCHIVED October 9, 2026 (Opus session) - the Oct 8 wave-opening and
## relay session log, moved verbatim when the QOL wave reached 19/19.

**Updated:** October 8, 2026 (Opus seat). Session log:
- Seth opened the next wave: `quality-of-life-updates`, with "all stowed
  changes" plus his 6 asks:
  - prefs out of the logger
  - a What's New system
  - repeat last time
  - finish without effort
  - edit custom exercises
  - coach app help
- Cut the branch and dispatched 3 Cursor recon report lanes (qol-r1/r2/r3,
  auto rung, lanes 1-3, ~6 min each, all clean); reports preserved as
  FINDINGS.
- Asked Seth the batched decisions. Answers (spec section 1):
  - prefs: Profile + Home strip
  - repeat last: ghosts
  - app help works without consent, with no data
  - connector hardening, BYO-key server encryption and coach history
    (Library tab, kept until deleted) all IN
- Authored qol1-qol15 + the spec + the What's New pipeline:
  - `docs/releases/UNRELEASED.md`, seeded with the Aug-Oct catch-up
  - `RELEASED.md`
  - the standing `docs/tasks/_WHATS_NEW.md`
  - `land-unit` and `author-task-block` updates
- Shipped `.gitattributes` directly (migrations `eol=lf`; blobs were
  already LF, so no content change).
- Memory: the Aug 1 effort-mandate memory is marked REVERSED.
- Lanes: `cursor-lane` / `-2` / `-3` on `recon/qol-r1|r-2|r-3` at
  `8090b10`, each holding a stale recon DELIVERY.md (gitignored).
  Delete them before dispatch.

- Oct 8, relay started (same Opus session). Seth repointed staging Render
  to `quality-of-life-updates`. Dispatched qol1 (lane 1), qol3 (lane 2) and
  qol5 (lane 3) on auto, staggered.
  - Built the pre-build mock at
    https://claude.ai/artifact/Ne8y8k6KaLXXY5jACctD9g (Design canvas, 7
    boards, real champ-dark tokens): Home today, strip options A and B, an
    interactive setup sheet, Profile > Training, coach help-only, coach
    thread.
  - **qol5 LANDED `be7334a`.** Live proof: 300 kB to /coach/import-map ->
    401, /templates still 413.
  - **qol1 audited and committed `8ccbbab`** on `cursor/qol1`, NOT merged
    (held for "migrate staging").
  - Dispatched qol8 (lane 3). qol2 and qol6 are held for the mock
    decision.
  - Smoke items so far: history import with 8+ workout titles keeps 7 and
    names the skipped; a huge AI-import paste says "too large".

---

## ARCHIVED October 8, 2026 (Opus session) - the Oct 7 close-out session
## log, moved verbatim when the quality-of-life wave opened.

**Updated:** October 7, 2026, late (Opus seat). Session log:
- Read HANDOFF and continued: landed sr3-6 `468bab9` (seat-fixed drop
  target), ran Seth's ONE-round feel critic (6/10 FAIL), authored and landed
  the fix round sr3f1 `cf4fdee`, sr3f2 `b64de00`, sr3f3 `ccf468b` (sr3 wave
  10/10), Seth signed off smoke round 4, pre-main gate PASS (+ seat fix
  `1ce8fdb`), Seth applied the prod migrations, merged `7d3b91e..ef5e908`.
- Close-out: HANDOFF split three ways (archive / REFERENCE / this file),
  `scripts/run-lane.ps1` saved from the scratchpad and wired into
  `dispatch-unit`, git cleanup above, lanes reset. Full log in the archive.

---

## ARCHIVED October 7, 2026, late (Opus session) - the close of
## `ai-connector-wave`: the WHERE WE ARE header + merge record, the gate
## verdict + Seth's prod steps, the smoke-round-4 protocol and checklists,
## the gate notes, the old Housekeeping / Next work, and the Oct 7 + Oct 6
## session logs - moved verbatim when the wave merged to main (`ef5e908`).

### (Superseded state sections from the same HANDOFF, verbatim)

### Open on prod - Seth's checks, none blocking

Checks 1-4 (connector ID1, AuthKit lifetime, patch-wave post-deploy,
`COACH_UNCAPPED_EMAILS`) are DONE - archived Oct 6.
5. **F/E-wave PROD smoke** - still open (section below).


## Repo / deploy state

- **`main` is at `7d3b91e`** - the patch-wave merge, Sept 27 (ff from
  `bdad1c1`; the AI-wave merge before it was `59e27dc..bdad1c1`). **Prod Render `workout-db-l3gc`** and **prod Vercel
  `https://workout-db-psi.vercel.app`** are on `main`, deploy live. Any push to
  `main` is a prod-bound push (gate 2).
- **`ai-connector-wave` = `main` + the whole BK wave** (28 units + critic
  and seat fixes + docs, head `9af8464`+). Staging Render `workout-db-staging` tracks
  it (re-confirmed Sept 29 after it was found on `main`).
- **Prod DB:** `20260804180000_add_ai_consent` hand-applied by Seth Sept 26
  (RUNBOOK 10a V2 SQL), checksum identical to staging; `CoachUsage` +
  `WorkoutSession.reopenedAt` hand-applied by Seth Sept 27 (checks passed). Prod's build command is
  `npm install && npx prisma generate` - it never migrates.

### Lane worktree state

**Lanes after the sr3 wave (Oct 7, late):** `cursor-lane` on `cursor/sr3f3`
(= `ccf468b`, clean), `cursor-lane-2` on `cursor/sr3f2` (= `b64de00`,
clean), `cursor-lane-3` on `cursor/sr3-3b` (its
`.playwright-mcp/sr3-3/` holds a working Playwright install - handy while
the Playwright MCP is down), each merged into `ai-connector-wave` once
landed; a stale `cursor/sr3-3` branch (the two hung attempts) can be
deleted with Seth's OK. Lane 2's
`server` has its own full install WITH `@cursor/sdk` (use it for any
unit that needs a LIVE coach call); lane 3's `node_modules` are
junctions into lane 1. Lane 3 still holds three untracked mock PNG
copies in `client/src/assets/scenes/` - never stage them. **Repoint a
lane onto the current wave HEAD before each dispatch.** A dead Cursor
run (connection loss, no DELIVERY.md) can be RESUMED in place: keep the
partial tree and re-dispatch with a resume note (bksf2a, Oct 1).


## Other open items

**Seth items:** the "Open on prod" checks and M2 (top of this file); the
connector-hardening yes/no; the R6 tagline pick
(one-line `AuthLayout.jsx` swap); FP8 icon PNGs; the Cursor model-routing
question; the `docs/parked/*` ruling.


> **WHERE WE ARE (Oct 7, late):** **PRE-MAIN GATE: PASS** (Opus seat) for the
> whole `ai-connector-wave` branch (BK + bkr + sr3, 142+ commits over `main`
> `7d3b91e`) - verdict + Seth's prod steps in "Gate verdict" right below.
> Smoke round 4 signed off. The sr3 wave: 10/10 landed - the 7 sr3 units,
> then Seth's one-round feel critic (6/10 FAIL, one P1) and its fix round
> **sr3f1** `cf4fdee` (Library), **sr3f2** `b64de00` (builder), **sr3f3**
> `ccf468b` (add to library in 3 taps). Rulings: FINDINGS
> "Round 3 rulings" + QUEUE's sr3 header (item 1 was a missing RESUME, not
> data loss; item 10 swap-for-today PARKED). Landed: sr3-d1 + picker-height
> fix `a6f007f`; **sr3-1** `077f4b2` pause/resume ("Left off at Wn · Day",
> Resume / Start over); **sr3-2** `9c7f1f1` a week holds at most 7 days;
> **sr3-3** `ba415bf` (+ `230d4c0`) round "..." for week/day actions, the
> RPE/RIR/"Effort: off" chip, Public says Seth's line; **sr3-5** `c6ae089`
> "Per side" on block exercises (the wave's ONE migration - STAGING applied
> Oct 6 under "migrate staging"; PROD is Seth's hand-apply before the merge,
> next to BK1's); **sr3-4** `f1fbf55` add a not-in-library exercise to the
> library from the builder and import; **sr3-6** `468bab9` hold a day or
> week pill to drag it to a new place (seat-fixed drop target). Every server
> change was proven live on the staging DB. Prod unchanged: `main` =
> `7d3b91e`.

**SMOKE ROUND 4 SIGNED OFF (Oct 7, Seth, verbatim):** "yeah everything else
looks good /pre-main-review" (after a future-wave note on exercise
hold-to-move).

**PROD MIGRATIONS APPLIED (Oct 7, late, Seth: "migrations ran"):**
`20260929120000_blocks_v2` + `20261006200000_block_exercise_per_side` by
hand in the prod Neon SQL editor (steps 1-2 below). Step 3 verify: Seth,
"verify queries all matched". (Agent-side read-only check not done - no
read-only prod connection file was found outside the repo this session.)
RUNBOOK 5b (new prod config): none - no new env vars, no server deps.

**MERGED TO MAIN (Oct 7, late, Seth: "push to main", each step approved):**
`origin/main` `7d3b91e..ef5e908` - fast-forward, 147 commits (the BK, bkr
and sr3 waves + gate). Run from `C:\dev\worktrees\merge-main-0927`: fetch ->
`merge --ff-only origin/ai-connector-wave` -> `push origin main`.
Verified: `git ls-remote` main = `ef5e908`; prod API
`workout-db-l3gc` serves the wave (`/block-templates/format` 200 with Block
Format v1, `/block-runs/active` 401, unknown route 404); prod Vercel bundle
`index-DMK9TWHq.js` contains sr3f2 code. Prod DB had both migrations first.

**Next action (human):** smoke PROD on your phone - log in, Library, open a
block in the builder, start a block day and log one set; then repoint
staging Render `workout-db-staging` to `main` (M2, Housekeeping).

## ▶ GATE VERDICT (Oct 7, late, Opus seat) - PASS

**PASS** - ready for the merge ritual once prod has both migrations. One
seat fix during the gate: `1ce8fdb` (week/day strips honour reduced motion -
the gate note carried since Sept 29). Nothing else needs code before main.

What was read directly (schema / security / cross-user, never fanned out):
- **Schema + migrations:** `blocks_v2` + `block_exercise_per_side` match the
  schema diff one-to-one; purely ADDITIVE (nullable columns, NOT NULL only
  with defaults, a new `BlockRun` table, indexes, FKs). `BlockRun` cascades
  with its template/user; `WorkoutSession.blockRunId` is SET NULL, so
  deleting a block keeps logged workouts (matches the Library copy).
- **Clone isolation (BK1, carried since Sept 29) - CLOSED.** A clone of a
  foreign public block carries NAMES only (`buildClonePayload`); every write
  path re-stamps `exerciseId`/`userExerciseId` from the REQUESTER's library
  (`stampBlockWeeksArray` -> `stampExerciseIdentityWithIndex` always sets
  both keys) and the normalizers never accept client ids - a stranger's
  custom-exercise id cannot be copied in.
- **Ownership everywhere:** block templates (GET/export public-or-owner;
  PATCH/DELETE/accept owner), block runs (all four routes `userId`-scoped;
  runs only on OWN templates), start-from-block (own OPEN run only), left-off
  (ids derived from own runs), coach block focus (owner-checked before any
  text, 404 otherwise), connector `create_block_draft` (create-only drafts,
  userId from the verified closure, consent + separate opt-in, 10/day + 20
  open), consent toggle (revoke also clears the block-drafts opt-in).
- **Raw SQL:** only two sites, both tagged-template parameters, both scoped
  (advisory lock in `usageLedger.js`; the usage-ranking query in
  `GET /exercises/search`, debounced client-side).
- **Coach cost:** reserve-before-provider on every hosted path; refunds only
  for an undelivered answer or a <=400-char off-topic decline.
- **No What's New entry** in the wave - the merge fires no modal on prod.

Gate fuel (Cursor report lanes, auto rung, kept as FINDINGS):
`gate-r1-fresh-lanes-tokens-schema-FINDINGS.md` (542 unit tests, build clean;
ZERO raw colours added across the whole wave; all 49 new `var()` names
defined; schema/SQL/FK/NOT-NULL cross-check clean; migrations CRLF;
`read-excel-file` lazy-loaded in its own 67 kB chunk) and
`gate-r2-route-ownership-inventory-FINDINGS.md` (every new/changed route and
MCP tool: SCOPED or intended PUBLIC-READ, none unscoped). Spot-checked.

Accepted / follow-up, NOT blockers:
- `/coach/import-map` + the import-fix recipe path accept 1,000,000 chars but
  sit behind the default 100 kB JSON body limit - a >100 kB paste gets a raw
  413. Real sheets are far smaller; follow-up: a route-level limit or a
  friendly message.
- No rate limiter on `/block-templates/import*` or `/block-runs` (authed,
  DB-only, no provider cost).
- BK7 / sr3-1 "two open sessions/runs" race (no unique guard) - accepted.
- Public blocks: UI says "not yet", the API still accepts `isPublic: true`;
  existing public blocks stay public - accepted (sr3-3 ruling).
- The 7-day cap: a prod block with 8+ days in a week still opens and runs;
  saving an edit asks to trim first. Optional check below.
- Prod-vs-staging migration DRIFT (Housekeeping): NOT a merge blocker -
  prod never runs `migrate deploy` (the patch wave merged with it present).
  Stays housekeeping.

### Seth's prod steps (RUNBOOK section 3 - DB first, code second)

In the Neon SQL editor for **PROD** (`snowy-resonance` /
`ep-solitary-sea-an56mioq` - confirm the host in the URL bar first):

1. Paste `server/prisma/migrations/20260929120000_blocks_v2/migration.sql`
   verbatim and run it. Then:
   ```sql
   INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   VALUES
     (gen_random_uuid(), '4e6ec40478ca8e271bad1755d9cf7e635cd0b73ee298fe16fb4f409d01e985d3', now(), '20260929120000_blocks_v2', NULL, NULL, now(), 1);
   ```
2. Then the per-side column and its row:
   ```sql
   ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "perSide" BOOLEAN;
   INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   VALUES
     (gen_random_uuid(), 'dfaa91e1eec253f0bc3a9b14436d71d6f598033ad636062e8888b57338203fe6', now(), '20261006200000_block_exercise_per_side', NULL, NULL, now(), 1);
   ```
   (Checksums read Oct 7 from STAGING's `_prisma_migrations`, host
   `ep-bitter-breeze`, per the RUNBOOK rule "copy it, don't invent it".)
3. Verify:
   ```sql
   SELECT table_name, column_name FROM information_schema.columns
   WHERE (table_name = 'BlockRun')
      OR (table_name = 'BlockWorkoutExercise' AND column_name IN ('restSec','effortCap','perSide'))
      OR (table_name = 'WorkoutSession' AND column_name IN ('blockRunId','blockWeekOrder','blockWorkoutOrder'))
   ORDER BY table_name, column_name;
   SELECT migration_name, checksum FROM "_prisma_migrations"
   WHERE migration_name IN ('20260929120000_blocks_v2','20261006200000_block_exercise_per_side');
   ```
   Expect 5 BlockRun columns, 3 + 3 others, and the two rows.
4. Optional (7-day cap): `SELECT "blockWeekId", count(*) FROM "BlockWorkout"
   GROUP BY 1 HAVING count(*) > 7;` - any rows are old blocks that will ask
   to be trimmed on their next save.
5. Then say **"push to main"** - the merge runs one command at a time
   (RUNBOOK + gate item 1), using a temp worktree (OneDrive lock lesson).
6. After the deploy: smoke prod login, Library, open a block, start a block
   day; then M2 (repoint staging Render `workout-db-staging` to `main`, and
   only then retire the `ai-connector-wave` preview host from the staging
   WorkOS sign-in URI) - Housekeeping below.

## ▶ PICK UP HERE (Oct 7, late - after the gate)

1. Seth runs the prod steps above, then "push to main" -> the merge ritual,
   one command at a time, report the merged SHAs + `origin/main` HEAD.
2. Post-merge: prod smoke, M2 repoint, close the wave in HANDOFF (move the
   sr3/BK/bkr detail to the archive verbatim).
3. Next wave candidates: Seth's exercise hold-to-move note, the HELD search
   synonyms, the deferred critic P3s, the import body-limit follow-up.

### Agent sitting with Seth on smoke round 4 (when he runs it)

You sit with Seth while he smokes, ONE item at a time, and record results. You
do NOT fix code and do NOT run the gate. Any model can do this.

1. Where: the staging Vercel preview of `ai-connector-wave`
   (`https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`,
   behind Vercel login), phone first. NEVER local dev (`client/.env` = prod).
   Confirm `origin/ai-connector-wave` HEAD and the Render staging deploy first.
2. Accounts: `test123` / `password` - state re-read Oct 7 from the staging
   DB: running block = "Imported block" (run 8) with W1 D1 IN PROGRESS
   (session 474). "Upper/Lower Strength - 4wk" has TWO ended runs: run 5
   (W1-W3 done, W4 · Upper A next - ended when Seth switched blocks Oct 6)
   and run 7 (the OLD code's from-scratch restart that same afternoon, 1 of
   16 days). Left-off offers the LATEST run only, by design, so Library
   shows "Left off at W1 · Lower A" (not W4 · Upper A - the Oct 6 note was
   wrong). Prod has no block runs, so no real user is in this state. Or Seth's own
   staging account. Coach uses are capped at 7 per rolling 7 days.
3. Record: append `## Smoke round 4` (round 3 is Seth's intake notes) to
   `docs/tasks/bk-smoke-FINDINGS.md` - one line per item: PASS, or FAIL with
   Seth's words + screenshot (`claudefiledrop/`, untracked) + severity (P0 data
   loss / P1 blocks him / P2 friction / P3 polish). New scope = CR. Commit +
   push the doc at the end.
4. Verify, don't guess: staging API with a cookie login; READ-ONLY Prisma
   reads from `server/` (`server/.env` = staging).
5. Defects become DIAGNOSIS blocks after the last item; sign-off resets.
6. On "smoke signed off": record it, set Next action to the pre-main gate
   (`pre-main-review`, OPUS seat, with the gate notes below), stop.

### Re-smoke checklist - BK + bkr (staging Vercel, phone first)

Already PASSED in round 2, no need to repeat: Library, import from a file,
Sets x Reps, Any AI paste, export round-trip, Execution, desktop builder
header. Connector drafts stay deferred until a staging connector exists.

1. **Home with your running block:** "Start a workout" first ("Start empty
   workout" starts one directly; "Browse templates" opens the picker). Under
   it, a calm "Next in your block" card: W4 · Upper A on one line, the week
   strip, one line of exercises, "Start W4 · Upper A" (starts that day in the
   logger). The stats card is titled "Last 7 days" and has NO day strip while
   the block card shows. Nothing jumps as the page loads (reload twice).
2. **Home with no block running** (Seth's own account, or end-block on a
   spare): hero, then "Last 7 days" WITH its day strip (the same 7 days as the
   numbers), then Recent workouts.
3. **Home during a live workout:** exactly one Resume (the card, with "n of m
   sets logged" on block days); the bottom "In progress" bar is gone on Home
   and on Import, still there on Analytics/History/Library/Profile.
4. **Finish bar (iPhone):** on a block day tap a reps field - the Finish bar
   slides away while the keypad is up; close the keypad WITHOUT tapping
   anything else - it slides back.
5. **Builder card:** expand an exercise: round "...", one scrolling row of
   chips showing values (Rest 3:00, Reps, RPE cap, the note text). Each chip
   opens a small sheet with only that setting (Rest has presets None / 1:00 /
   1:30 / 2:00 / 3:00). "..." (card or header) opens an actions list. Sheets
   darken the page (dark mode). Remove / delete day / delete block ask ON THE
   PAGE, never a browser pop-up; closing with unsaved edits just leaves (the
   draft comes back with Restore).
6. **Library deletes:** deleting a block, workout or custom exercise asks on
   the card ("Your logged workouts stay"), never a browser pop-up.
7. **AI waits:** new block -> "Describe the block you want" -> Draft with the
   coach: breathing crown + "Drafting your block..." on the button; "Still
   working..." at 15 s; gives up with a message at 2 minutes. Costs 1 use.
8. **AI file fix:** paste a messy sheet (odd columns, "three sets") ->
   Preview: the problems are listed first, then "Have AI fix this file" with
   "you have N left". A clean sheet or a LogChamp export shows NO AI button.
   After the fix: "AI read: ... (was ...)", an "AI changed" list, "Use the
   original read", "AI fix used N coach uses" - and the coach counter drops by
   exactly N.
9. **Coach limits:** ask the coach something off-topic ("write me a C#
   script") - a one-line decline, no code, the weekly counter does NOT drop.
   With fewer than 4 uses left the file-fix button is disabled and says when
   uses free up.
10. **Logger Back:** leaving a live workout with Back no longer asks.
11. **Imported file name:** importing `Phase-1-Program.xlsx` names the block
    "Phase-1-Program".

### Smoke round 4 - the sr3 items (same session, after the 11 above)

A. **Pause / resume (sr3-1):** Library -> "Upper/Lower Strength - 4wk" shows
   "Left off at W1 · Lower A" (test123's latest run - see Accounts) ->
   Start -> on-page choice "Resume at W1 · Lower A" / Start over / Cancel;
   the confirm also says "This pauses Imported block - you can pick it up
   where you left off." -> Resume -> Current block shows W1 · Upper A done,
   W1 · Lower A next. Then Library shows
   "Imported block" with its own "Left off" line. (End block's confirm now
   says "You can pick it up where you left off from your library.")
B. **Add exercise opens right (sr3-d1, Android):** builder -> "+ Add
   exercise" the FIRST time -> a tall sheet with the search box visible above
   the keyboard and room for results.
C. **7 days max (sr3-2):** a week with 7 days -> the "+ Day" button reads
   "7 days max" and does nothing; the day "..." -> Duplicate is disabled
   too. Importing a file with 8 days in a week -> "Week 1 has 8 days - a
   week holds at most 7."
D. **Week / day actions (sr3-3):** a round "..." beside "Week n" and at the
   end of the day line, each opening rename / duplicate / move / delete.
E. **Effort chip (sr3-3):** under the block name: "Effort: off" / "RPE" /
   "RIR"; tap -> "Effort scale" sheet; the choice shows in Settings too.
F. **Public (sr3-3):** Settings -> tick Public -> toast "this hasnt been
   implemented yet bro stop prying", box stays unticked; Library "Make
   public" says the same.
G. **Per side (sr3-5):** expand "Single-Leg Calf Raise" in a block -> a "Per
   side" chip that is ON and the summary ends "each side"; "Back Squat" OFF;
   tap to flip either, save, start that day -> the logger shows Right/Left
   grids exactly for the ones that are on.
H. **Add to library (sr3-4):** builder search "Zercher Carry Hold" -> both
   "Use ..." and "Add 'Zercher Carry Hold' to your library" -> add it ->
   it lands in the day with no "Not in library" chip; a free-text exercise's
   card "..." -> "Add to library"; import a sheet with an unknown name -> its
   row's "Add to library" moves it out of "Not in your library".
I. **Hold to reorder (sr3-6), ON THE PHONE:** in the builder, press and
   hold Day 1 about half a second -> it lifts (a little bigger, shadow, a
   buzz on Android). Drag it slowly right past Day 3 - the other days slide
   aside one at a time WITHOUT flickering - let go -> it lands there, the
   days renumber, and if Day 1 was selected it is still selected. Same for
   a week pill (a 5+ week block: drag to the strip's edge and hold - the
   strip scrolls and stops at the end, no empty space). A quick swipe still
   scrolls the strip; hold-and-release without moving changes nothing and
   opens no actions; a tap still selects, a re-tap still opens the actions.
   No text-selection or iOS callout on the long-press. The Current Block
   page, Home and the import preview strips do NOT lift. (Touch drag is the
   one thing desktop Playwright could not prove.) The lifted pill now glows
   in the accent colour and keeps its selected outline (sr3f2).

### Smoke round 4 - the critic fix round (sr3f1-3, after A-I)

J. **Library, paused block (sr3f1):** "Upper/Lower Strength - 4wk" sits
   right under the running block with a "Paused" chip (amber), a "Resume"
   button and "Left off at W1 · Lower A · 1 of 16 days done". Scroll to the
   bottom of Library and tap Start or Resume on a lower card -> the choice
   opens ON THAT CARD, on screen (it used to open at the top of the page,
   off-screen). Library > Exercises empty state mentions "Add to your
   library" from the builder.
K. **Builder state you can see (sr3f2):** Per side ON is accent-coloured
   with a check mark and sits before the RPE/RIR chip; reorder or move days
   -> days still called "Day n" renumber (a pill never reads "DAY 3 / Day
   1"); names you typed stay. A saved block with free-text exercises still
   shows "Not in library" + "Add to library" after reopening.
L. **Effort sheets (sr3f2):** the RPE / RIR / None buttons fill the sheet's
   width with one line under them explaining the choice - in the Effort
   chip's sheet and in Block settings.
M. **Small builder fixes (sr3f2):** after switching weeks, one tap on Day 1
   just selects it (a second tap opens its actions); adding the 7th day
   scrolls so "7 days max" is visible; the day "..." row reads "Duplicate -
   7 days max"; ticking Public in Block settings shows your line UNDER the
   checkbox (no toast over it) and the "Visible to others for clone" text is
   gone.
N. **Add to library in 3 taps (sr3f3):** builder search a made-up name ->
   "Add '...' to your library" -> it opens straight on the muscle list ->
   pick one -> Add exercise -> back in the builder with the exercise in the
   day and a toast "Added '...' to your library." (no "Added" sheet). The
   headers in that sheet match the builder's style. A live workout's "Not
   tracked - add?" flow is unchanged.

**By design - do not log as defects:** one AI button on import (the layout
read and the prose convert merged); the Any AI tab has no AI button; palette
generation costs 1 coach use; the stats are a rolling 7 days ("Last 7 days");
unmatched imported names do not count toward Analytics; timed sets add nothing
to volume; copy forward skips Deload-labeled weeks unless ticked; saving is
blocked while any day is empty; "Create workout" is greyed in Library
(parked); a ~1 s Login flash after iOS clears site data for 7+ idle days
(candidate, not this wave).

**Known and deferred (do not fail the smoke on them):** no rest timer after a
set; fractional Execution numbers; desktop In-progress bar width; "Per side"
offered on bilateral lifts; the builder's week pill is a bright white bar;
crimson's "good" colour reads amber; the old quick-log set-count / L-R pair
confirms are still browser dialogs; critic R1 P3 leftovers not in bkrf1
(session-page skeleton, bk-log-focus before the fetch).

**Gate notes for `pre-main-review` (after sign-off):**
- Carried from Sept 29: clone isolation (BK1, cross-user) - a live clone of
  a FOREIGN public block was not possible on staging; BK11 connector write
  path (cross-user; Claude-side check is the deferred connector item); BK12
  block-focus owner check lives in `askCoach.js` (accepted placement); BK10
  reuses `templateExerciseId` for `block:<id>` keys and `judgePlanHit` is
  unused (spec 7.5 ruling); BK7 start-from-block has no unique guard (race ->
  two sessions); WeekStrip smooth scroll ignores reduced motion.
- Since Sept 30: bksf2a's raw `$queryRaw` in `GET /exercises/search` (user-
  scoped, parameterised; scans every SessionExercise + BlockWorkoutExercise
  row per keystroke - check the cost on a heavy account); `read-excel-file`
  dependency (`fa1ea8b`, Seth-approved); bks2 author notes in the plan
  snapshot.
- Seat fixes outside Cursor units: `aadb365`, BK5 state fixes, `0a92af6`,
  `8da0ae5`, `207c0f2` (Sept 29); `924bc66` (hook-order P0), `8badd2f`,
  `2deedf5`, `bd0e4b3`, `9633c20` (bksf3b: a just-logged row PATCHed blanks -
  review BlockSetRow's managed-draft handoff), `9f6b2a0`.
- bksf3b ruling: block sessions stay POSITIONAL (`blockWorkoutSetId` unused,
  spec 7.3). Out-of-order logging would be a schema change.
- **bkr wave (Oct 5-6) - review hardest:**
  - bkr2 `ed92b31`: `usageLedger.js` takes
    `pg_advisory_xact_lock(hashtext(userId))` via `$executeRaw` inside an
    interactive transaction (proven on staging: 9 parallel single reserves ->
    7 ok / 2 refused). Every hosted path reserves BEFORE the model call (ask 1,
    draft 1, import-map 3, palette 1, import-fix 4 settled 1-4). Off-topic
    asks: the model prefixes `[[OFF_TOPIC]]`, the server strips it and
    refunds only a decline <= 400 chars (seat fix - a prompt that forces the
    marker must not get free answers). Generate-mode off-topic uses a sentinel
    block name (structured output). Seat fix: draft + import-map abort the
    provider call on client disconnect (bkr-d2: a draft finishing after the
    phone gave up stayed charged).
  - bkr3 `fb896ec`: `POST /coach/import-fix` - table vs prose detection (seat
    fix: rows must align with a short-label header, else prose with commas
    went to the recipe path); the convert path keeps block-draft's 20k input
    cap (seat fix - it sent up to 1 MB); tier thresholds 4k/8k/14k tokens are
    product numbers Seth can retune (`weeklyCap.js`).
  - bkr-f1 `eebadf4`: `bk-log-kbd` = focused logger field AND visualViewport
    >150px shorter; proven only with a shadowed-visualViewport harness -
    Seth's iPhone check is the real proof.
  - bkr1 `3373a9b` / bkrf1c `4352e91`: AI calls carry AbortControllers
    (120 s); `AiWait` two-face button slot; `aiFixChanges.js` diff helper.
  - bkr4 `1f6d42a` / bkrf1a `07bd1ea`: every builder `window.confirm`
    replaced (the leave guard too - the local draft covers it); new
    `--color-scrim` token per mode; `font-family: inherit` on form controls
    is APP-WIDE (check nothing that relied on the UA font shifted).
  - bkr5 `52ee633` / bkrf1b `b1ed933`: the Home hero no longer depends on the
    run fetch; sessionStorage `workoutdb-home-has-run` predicts the block-card
    placeholder; the rolling "Last 7 days" strip changed `workout/WeekStrip`
    (Home-only); PersistentWorkoutBar hidden on `/` and `/blocks/import`.
  - Critic: R1 6/10 FAIL (`bkr-critic-round-1-FINDINGS.md`), all R1 P2s
    addressed by bkrf1a-c; R2 skipped by Seth.
- **sr3 wave (Oct 6) - per-unit audits in QUEUE.md:**
  - sr3-1 `077f4b2`: resume REOPENS an ended run (`endedAt` -> null) after
    ending the user's other open runs in one transaction - same "two open
    runs" race class as create (no unique guard); `GET /block-runs/left-off`
    lists each template's LATEST run only when ended + unfinished + has a
    done/in-progress day. A paused run and a deliberately ended one look the
    same (no schema change, by ruling).
  - sr3-2 `9c7f1f1`: `MAX_DAYS_PER_WEEK = 7` in `blockFormat.js` feeds Format
    v1, the AI schema and the save-path normalizer; an existing 8+ day block
    cannot be saved until trimmed (the builder shows why); history import
    with 8+ distinct titles now hard-fails (follow-up candidate).
  - sr3-3 `ba415bf` + `230d4c0`: Public is blocked in the UI only - the API
    still accepts `isPublic: true`, and already-public blocks stay public.
  - sr3-5 `c6ae089`: the wave's ONE migration
    `20261006200000_block_exercise_per_side` (`perSide BOOLEAN`, nullable);
    applied to staging from this Windows tree (CRLF checkout, no
    `.gitattributes`) like BK1 - check checksum drift before any prod
    `migrate deploy`. `ExerciseRx` gained an optional `suffix` (shared ui).
  - sr3-4 `f1fbf55`: `AddExerciseToLibrarySheet` has a new `context="library"`
    path (no session exercise) - review that the live/completed logger paths
    are unchanged.
  - sr3-6 `468bab9`: new `ui/useHoldToReorder.js` (pointer events, a
    non-passive `touchmove` on the strip that cancels the pan ONLY while
    lifted, `body.style.overflow` lock while lifted, click suppression via
    a 400 ms capture-phase window). Seat fix folded in: drop target from
    slot centres snapshotted at lift (live rects flickered), scroll-aware
    offset clamped to first..last slot. Review: the touch path on iOS and
    Android (only desktop mouse was proven), `WeekStrip` is shared with
    Home/run page - confirm nothing changes without `onReorder`.
- **sr3 critic fix round (Oct 7) - per-unit audits in QUEUE.md:**
  - sr3f1 `cf4fdee`: the Start/Resume choice moved INTO `LibraryBlockCard`
    (props from MyTemplatesPage); client-side sort running -> paused (by
    `endedAt`) -> rest; Paused chip uses the `warn` tone (same as Draft).
  - sr3f2 `b64de00`: `renumberDefaultDayNames` runs in add/duplicate/move/
    reorder/delete/removeEmptyDays (`/^Day \d+$/` only); hydrate sets
    `notInLibrary` from `exerciseId`/`userExerciseId`; tap-to-open-actions
    now keyed on two refs reset by every programmatic selection (review the
    coverage of those resets); opt-in `Segmented fill` + `DayPicker
    scrollEndToken`; `BlockSettingsSheet` lost its `onToast` prop.
  - sr3f3 `ccf468b`: library-context-only branches in the shared
    `AddExerciseToLibrarySheet` (also used by the live logger) - review the
    `isLibraryContext` gating; header tokens are :root (`--font-block`).
- Before any merge: Seth hand-applies BOTH migrations to PROD, in order -
  BK1's `20260929120000_blocks_v2`, then sr3-5's
  `20261006200000_block_exercise_per_side` (RUNBOOK "Schema-change deploy") -
  and the prod-vs-staging migration drift (Housekeeping) gets reconciled. bkr
  added NO migration.


### Housekeeping

- **M2 is ON HOLD for the BK wave (Sept 28):** staging Render
  `workout-db-staging` KEEPS tracking `ai-connector-wave` - the BK wave lands
  there, so no repoint and the staging connector's sign-in URI (pinned to the
  `ai-connector-wave` Vercel PREVIEW host) keeps working. Repoint to `main`
  only after the BK merge. Never delete `ai-connector-wave` while that URI
  points at its preview host. **Sept 29: it had in fact been tracking
  `main`** (so no BK push deployed for ~1h - the "Render stuck" symptom);
  Seth repointed it to `ai-connector-wave`. If staging ever looks stale
  again, check Render -> Settings -> Branch FIRST.
- **Temp worktree `C:\dev\worktrees\merge-main-0927`** (on `main` @ `7d3b91e`,
  clean) still exists - merge-ritual command 4 (`git worktree remove`) was
  never approved. Ask Seth before running it.
- **Stale `.git/worktrees/merge-main` admin dir** (OneDrive lock): every
  `git fetch`/commit prints `failed to delete '.git/worktrees/merge-main':
  Permission denied`. Harmless; `git worktree prune` once the lock clears.
- **`ai-connector-wave` = `main` + docs-only HANDOFF commits** (`9efcc5a`,
  `bc28d4b`, `6cace99` and this rewrite). Same known pattern as past waves.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from any recent wave and not blocking (prod's build never runs `migrate
  deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

### Next work

- **The BK + bkr + sr3 waves** - all landed on `ai-connector-wave`; Seth's
  consolidated smoke (round 4), then the gate. Nothing else is queued.
- **Seth's note for a FUTURE wave (Oct 7, after smoke round 4):** "you can
  hold and move exercises like days and weeks, when held app adjusts so you
  can move them easier" - long-press reorder for exercise cards in the
  builder (reuse sr3-6's `useHoldToReorder`, vertical axis), with the list
  adapting while held (e.g. cards collapse to one line) so a long day is
  easy to drag across. Not this wave.
- **HELD for Seth's next change (Oct 7, his ruling): exercise search
  synonyms.** The sr3 critic's P2-7 said multi-word search fails ("single leg
  calf" -> 0); the seat checked the pure `searchCatalog` and the diagnosis was
  wrong - it already AND-matches words ("one leg calf" finds "Dumbbell Seated
  One-Leg Calf Raise"); the miss is a SYNONYM gap ("single" vs "one"). Seth
  said one of the changes he wants is related - fold this into that work
  (likely `server/data/exercise-aliases.json` + its rationale doc, or
  query-side synonyms in `server/src/analytics/searchCatalog.js`).
- **sr3 critic deferred P3s** (`sr3-critic-round-1-FINDINGS.md`): P3-1
  builder name gets its own row, P3-2 coach box placement / title wrap, P3-5
  one action-sheet style, P3-8 recent exercises on an empty search, P3-10
  Library load time.
- **sr3 follow-up candidates:** history import keeps the 7 most-used titles
  with a "skipped" warning (today 8+ titles hard-fail the preview, sr3-2);
  swap an exercise for today on a block day (smoke round 3 item 10, PARKED by
  Seth); a `.gitattributes` `*.sql text eol=lf` rule so migration checksums
  stop depending on the machine that applied them.
- **Next-wave candidates:** the duplicate Resume bars on Home + Seth's
  discard-from-entry-points ask (Sept 29, below); the round-3 critic
  leftovers and the deferred P3s in the smoke section.
- **Privacy page + ToS** (`ai-layer.md` section 6, Seth's Sept 26 "first
  unit of the next wave") is BK0 in the BK wave - DRAFT until Seth supplies
  its OPEN FACTS (operator name, contact email, jurisdiction, effective date,
  deletion promise).
- **Connector hardening - offered to Seth Sept 28, NOT decided:** make the
  site root forward `?external_auth_id=` to `/connector/login`, so a wrong
  sign-in URI can no longer strand the handshake (it has bitten twice: Aug 8
  and Sept 26-28). Small client routing change; ships through a normal wave
  and merge.
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- Coach discoverability (Seth, deferred) and CR2 polish - see "Still
  governing" below.

**Seth's merge calls, Sept 26 (settled):** privacy page + ToS
(`ai-layer.md` section 6) = the FIRST unit of the next wave; What's New
`2026-08-ai-assistant` shipped as is, connector only (it fired for every prod
user on the merge deploy); CR2 polish skipped (shipped at 7.5); `zod` declared
(`bdad1c1`, road #14 closed).

**Updated:** October 7, 2026 (Opus seat, "read handoff and continue").
Session log, Oct 7:
- The Oct 6 rewrite had shipped with four unfilled placeholders
  (`SR3_STATUS_LINE`, `SR3_6_LINE`, `SR3_6_SMOKE`, `SR3_6_GATE`) - that
  session ended before sr3-6 landed. Filled here.
- sr3-6 had delivered Oct 6 22:29 in `cursor-lane-2` (DELIVERY.md by
  timestamp; no Cursor process left running). Landed `468bab9` with a seat
  fix to the drop-target math - proof and numbers in QUEUE's sr3-6 line.
  The seat harness (`client/_h/` in lane 2) and its dev server were removed.
- 7/7 - then Seth asked for the one-round critic: separate Opus agent,
  local app (API `COACH_PROVIDER=mock` on staging :3000, client :5173),
  brief `.playwright-mcp/sr3-critic/BRIEF.md`, 52 screenshots, ~15 min.
  6/10 FAIL, one P1; report kept as `sr3-critic-round-1-FINDINGS.md`;
  demo.critic restored (run 3 "Phase 1", W1 · Day 3 next - critic-verified).
  Seat verified the P1-1, P2-2 and P2-3 code claims; DISPROVED P2-7's
  diagnosis (synonym gap, not tokenizing - held for Seth's next change).
- Also found: smoke item A's expectation was wrong - test123's left-off is
  run 7 (W1 · Lower A, the old code's restart), not run 5 (W4); corrected.
- Seth's rulings -> fix round sr3f1-3 authored (QUEUE). N = 10.
- Fix round run: sr3f1 || sr3f2 then sr3f3, all on the auto rung, all
  landed with a real-app check (QUEUE has each). Seat runner bug on the
  first launch (PowerShell output callbacks on pool threads crash the
  runner) - orphans killed by PID in ~1 min, lanes untouched; the fixed
  runner (`Start-Process` with file redirection + `WaitForExit` + taskkill
  /T) is in the session scratchpad as `run-lane.ps1`. sr3f2's CLI hung
  13 min AFTER its DELIVERY.md (known print-mode hang) - for sr3f3 the
  watch exited on DELIVERY.md instead of waiting on silence.
- Smoke round 4 signed off by Seth ("everything else looks good") ->
  pre-main gate, Opus seat: direct reads of schema/security/cross-user
  surfaces + two Cursor report lanes (gate-r1 ~20 min, gate-r2 ~9 min, auto
  rung, both clean exits, porcelain = report only). Seat fix `1ce8fdb`.
  Staging checksums for the prod INSERTs read-only from `_prisma_migrations`.
  Verdict PASS (section above).
- Seth: the dispatch tab (cursor-watch :4646) "isn't showing" - the watcher
  was healthy (up since his 1:38 AM login, lanes correct); the boot tab had
  been closed. Opened it once. If it vanishes again, bookmark the URL.

Session log, Oct 6 late (Opus, frontier seat authoring AND running the
relay - Seth said "keep going"), sr3 wave:
- Item 1 diagnosed by the seat from code in minutes (no Cursor lane): not
  data loss - `createBlockRun` ends the open run and always creates a new
  one, so the old block's PLACE was lost, never its sessions. Seth's two
  question batches: pause + resume, Settings + header chip, 7-day cap
  everywhere, swap PARKED; then mock approved + long-press reorder added
  (sr3-6), Per-side switch WITH a DB field (sr3-5).
- Builder-header mock: https://claude.ai/artifact/TD1ddiGCaHqrWLScS8w5qY.
- Report lanes: sr3-d1 (diagnosis, 2.4 min; FINDINGS kept, seat applied the
  one-rule CSS fix), sr3-r1 recon (1.9 min, kept only in the scratchpad).
  sr3-r2 recon HUNG twice (print mode, zero model events); split into r2a
  (A/B/E, 2.3 min, fine) and r2b (C/D, hung again) - the seat did C/D itself
  with targeted reads (a bounded exception to "Cursor does the search",
  after three hangs).
- **Cursor auto-rung hangs were the session's main cost:** 5 runs stalled
  before the model's first event (sr3-r2 x2, r2b, sr3-3 x2). Switching to
  `--output-format stream-json` (scratchpad `run-lane-stream.ps1`) made a
  stall visible within minutes instead of at the 40-min kill; a 7-10 min
  silent stretch MID-run (sr3-3 run 3, sr3-4) can still finish - wait it out.
- **Seat errors, on record:** (1) killing the stalled sr3-3 agent by process
  match also killed sr3-5's agent during its final `git status` (after its
  DELIVERY.md) - kill by PID of the lane's own parent, never by pattern;
  (2) a bash one-liner with `npx prisma generate` in backticks inside a
  double-quoted string EXECUTED it from the repo root; npx stopped at its
  "will be installed: prisma@8.0.0-rc.20" prompt and was killed - verified
  nothing installed (no root package.json/node_modules, npx cache clean,
  server prisma still 6.19.2). Use the Edit tool for prose edits.
- Staging migration under "migrate staging" (status -> deploy -> status,
  each approved) - record in QUEUE's sr3-5 line.
- Seat fixes beyond Cursor: `a6f007f` picker height, left-off query shape
  (sr3-1), `ExerciseRx` suffix (sr3-5), `230d4c0` span-in-p (sr3-3, caught
  by a REAL-app Playwright run during sr3-4's audit).
- Real-app checks used the lane-3 Playwright install
  (`C:\dev\worktrees\cursor-lane-3\.playwright-mcp\sr3-3\node_modules`) with
  the local API on the staging DB + a lane client on :5173 - the Playwright
  MCP never connected this session. Local API after a schema change needs
  `npx prisma generate` from `server/` first.
- HANDOFF is still ~600 lines (cap ~300): the standing-reference sections
  (Durable gotchas, Workflow backlog, Still governing) need a home of their
  own - a decision for Seth, not done unilaterally.

## ARCHIVED October 6, 2026, late (Opus session, the sr3 wave) - the interim
## sr3 header, the Oct 6 bkr-complete header + smoke-round-3 PICK UP HERE, the
## done "Open on prod" checks 1-4, and the Oct 1 session log, moved verbatim
## when the sr3 wave landed (its own session log is in HANDOFF).

> **INTERIM (Oct 6, ~20:25, Opus seat mid-session - the full rewrite comes at
> session end):** smoke round 3 became the **sr3 wave** on
> `ai-connector-wave`. Seth's rulings are in `bk-smoke-FINDINGS.md` ->
> "Round 3 rulings" (item 1 = missing resume, NOT data loss -> pause +
> resume; item 5 = Settings + header chip; item 3 = 7-day cap everywhere;
> item 10 PARKED). Landed: sr3-d1 diagnosis + seat CSS fix `a6f007f`
> (picker height), **sr3-1** `077f4b2` (pause/resume, live-proven),
> **sr3-2** `9c7f1f1` (7-day cap, live-proven). In flight: recon sr3-r2
> (retry after a print-mode hang). Still to author: sr3-3 builder header
> (items 4, 5, 9 - Artifact mock for Seth first), sr3-4 add-to-library
> (items 6, 8), sr3-5 single-side L/R (item 7). QUEUE.md is current.

> **WHERE WE ARE (Oct 6):** the **bkr fix wave is COMPLETE - 12/12 LANDED** on
> `ai-connector-wave` (pushed). It came out of Seth's BK smoke round 2 (Oct 5,
> `docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round 2"): coach guardrails
> (bkr2 - usage ledger under a per-user lock, palette costs 1, coach on-topic
> only), Finish bar on the iOS keypad (bkr-f1), the crown AI loader + client
> timeouts (bkr1), one "Have AI fix this file" button priced 1-4 by tokens
> (bkr3), builder settings chips + actions sheet (bkr4, Seth picked option 2),
> Home logging-first with the block card under it (bkr5, Seth picked A + one
> week strip), then critic round 1 (6/10 FAIL, no P0/P1) and its fix round
> bkrf1a-c. **Critic round 2 was SKIPPED by Seth (Oct 6: "the critic isnt
> working, lets skip it for now")** - his re-smoke is the check. Prod
> unchanged: `main` = `7d3b91e`.
>
> **Oct 6, later: Seth's smoke round 3 INTAKE is waiting** - 10 notes (one
> suspected P0 data loss, one bug with a screenshot, six CRs, one open
> question for the agent's opinion, one undecided CR to talk through) recorded verbatim in
> `docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round 3". The session that took
> them proposed NO solutions on purpose (Seth: "leave this to the next
> chat"). The 11-item re-smoke checklist below is still un-run.

**Next action (human):** open a fresh Claude Code session on Opus and say
"work the smoke round 3 intake" - it starts with the suspected block-progress
data loss.

## ▶ PICK UP HERE (Oct 6 - smoke round 3 intake, FRONTIER seat)

Seth handed the next chat his round-3 notes (FINDINGS "Smoke round 3", items
1-10; item 10 is undecided - discuss, don't author). Do them in this order and ask Seth the open calls batched at the start
(memory: ask-seth-the-decisions):

1. **Item 1 first - suspected P0:** starting a second block may wipe the
   running block's progress (Seth unsure whether the first block was still
   running - cover both cases). DIAGNOSIS block to Cursor (report lane) before
   anything else; if confirmed, it is the top fix of the next wave.
2. **Item 2 - bug:** "+ Add exercise" in the builder opens wrong the first
   time (keyboard up, no search/list; second tap is fine). Screenshot in
   `claudefiledrop/smoke-r3-add-exercise-first-open.png`. DIAGNOSIS block.
3. **Ask Seth in one batch, with a recommendation each:** item 5 (is block
   Settings the right home for the RPE/RIR choice? he wants your opinion),
   item 3 (hard cap at 7 days per week: disable "+ Day" at
   7?). Item 7 is answered ("single" = one-arm/one-leg exercise -> log a left
   and a right side). Items 4, 6, 7, 8, 9 are clear enough to author (item 9's copy is Seth's,
   verbatim: "this hasnt been implemented yet bro stop prying").
4. Author the next wave from the answers (`author-task-block`), Home/builder
   design units get an Artifact mock first when they change layout (memory:
   preview-big-changes-as-artifacts).
5. **Critic rule changed (Oct 6):** the separate-agent feel critic runs ONE
   iteration by default (scored 0-10); more rounds only when Seth says so.
6. The pre-main gate waits until Seth signs off a smoke of everything,
   including the 11-item checklist below.

(From "### Open on prod - Seth's checks, none blocking" - items 1-4, all done:)

1. **Connector ID1 live checks - DONE Sept 29 (Seth).** Sign-in and the
   sign-out button both work on prod.
2. **Prod AuthKit session lifetime - DONE Sept 29.** Prod matches staging:
   max session 7 days, access token 5 minutes, inactivity timeout 2 days.
3. **Patch-wave post-deploy checks - DONE Sept 29 (Seth), with two product
   findings** (below): Render shows `7d3b91e`; coach's second answer is
   visibly faster (CP2 confirmed by feel; `ttft_ms` not recorded); Render
   logs clean, no "Ripgrep path not configured".
4. **`COACH_UNCAPPED_EMAILS=sethjknisel@gmail.com` - DONE on PROD only**
   (Seth has no staging/preview coach use); the "N of 7 left" counter no
   longer shows for that account on prod. Staging stays capped by design.

**Updated:** October 1, 2026 (Opus, frontier seat running the relay). Landed
bksf2b `10cfb3a`, bksf2c `848ff3b`, bksf2a `d1c1940` (run 1 died on a Cursor
connection loss; resumed in place) + seat fix `bd0e4b3`; ran critic round 3
(7/10 FAIL, final); direct fixes `9f6b2a0`; authored + dispatched bksf3a-b
after Seth chose fix-before-smoke; landed bksf3a `2fd8773` and bksf3b
`b5e42f2` with landing fix `9633c20` (live replay caught bksf3b PATCHing
blanks over a just-logged set); rewrote this file for the smoke agent;
built the before/after gallery Artifact at Seth's ask
(https://claude.ai/artifact/BYfQuLW677z67Ap7WaDfwH; screenshots local-only
under `.playwright-mcp/land-oct1/` and the critic round folders).
Seth asked (Oct 1) for a way to preview big UI changes without changing the
app - an Artifact mock before a wave, a before/after gallery at wave end;
recorded as agent memory, suggested at the seat's discretion. Prior:
Sept 30 sessions (BK smoke reopen, critic rounds 1-2). Older sessions archived.

## ARCHIVED October 6, 2026 (Opus session) - the Oct 5 bkr header, its PICK UP
## HERE, and the BK round-2 smoke checklist + gate notes, moved verbatim when the
## bkr wave reached 12/12 (gate notes carried forward, extended, in HANDOFF).

> **WHERE WE ARE (Oct 5):** Seth's BK smoke round 2 (Oct 5) turned into a
> fix wave, **bkr**, on `ai-connector-wave`. Findings and his rulings:
> `docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round 2". The seat ran every
> item he hadn't touched (local, 390px): nothing glaring. Landed so far:
> **bkr2** `ed92b31` (coach guardrails: reserve/settle/refund ledger under a
> per-user lock - proven on staging, 9 parallel -> 7 ok / 2 refused; palette
> costs 1; coach on-topic only, live-checked on staging: a C# ask gets a
> one-line decline and costs nothing), **bkr-f1** `eebadf4` (Finish bar
> returns when the iOS keypad closes), **bkr1** `3373a9b` (crown AiWait +
> slow-wait copy + 120 s client timeouts on every AI call). Diagnoses d1-d3
> landed as FINDINGS docs (d3 closed as by-design). **In flight:** bkr3 (one
> "Have AI fix this file" button, 1-4 uses by tokens) in `cursor-lane`.
> **Waiting on Seth:** bkr4 (builder "..." menu) + bkr5 (Home log-first) are
> DRAFT until he picks from the mock. Prod unchanged: `main` = `7d3b91e`.

**Next action (human):** open https://claude.ai/artifact/E87H65uivuhARz7A94pphN
and pick a Home option (A / B / C - seat recommends A) and a builder-menu
option (1 / 2 - seat recommends 2); reply in the session or comment on the
canvas.

## ▶ PICK UP HERE (Oct 5 - bkr fix wave, Opus seat running the relay)

- QUEUE.md "BK smoke round 2 -> fix wave (bkr)" is the ledger: order,
  lanes, landing notes. N = 8 (d1, d2, d3, bkr2, bkr-f1, bkr1, bkr3 + bkr4,
  bkr5 still DRAFT); 6 landed.
- On Seth's pick: author bkr4 (builder menu, design fully specified from the
  chosen artboard - fold in the in-page Delete-block confirm) and bkr5 (Home:
  log-first hero, block card per the pick, ONE Resume while live - hide the
  bottom "In progress" bar on Home only, keep "Up next after this"). They
  touch disjoint files -> parallel lanes. Both are primary-screen design units
  -> run the separate-agent critic loop after landing (memory
  local-run-and-critic-loop).
- bkr3 landing: also strip the leading space after the off-topic marker in
  `createOffTopicStreamFilter` (live reply began " I only coach...").
- Wave end: the consolidated re-smoke = the round-2 checklist below with
  items 4/12 reworded for the merged AI button + crown loader, plus Seth's
  iPhone check of the Finish bar (bkr-f1).
- Cursor plan is auto-rung only; lanes run via the scratchpad runner with a
  40-min hard kill (`run-lane.ps1`, recreate from dispatch-unit section 2 if
  the scratchpad is gone).

### Wave smoke checklist - BK, round 2 (staging Vercel, phone + desktop)

Pre-check done Oct 1 by the seat: staging Render answers with bksf2a's
search ranking (test123 "press" -> Leg Press, Seated Dumbbell Press,
Barbell Bench Press - Medium Grip, Incline), so the deploy has the code.

1. **Library** (bks3, bksf1d): Blocks tab first; the running block shows in
   a strip with "Open"; "Create workout" is greyed (parked on purpose); no
   names cut off.
2. **Import your Phase-1 sheet** (Library -> Import a block):
   - Paste week 1, then the File tab with all 6 weeks. Expected for the full
     sheet: 6 weeks, 30 days, 216 exercises, 602 sets, 84 timed; the only
     warnings are the ignored `Tier` and `Progression_Rule` columns; about 23
     names "Not in your library" with the Analytics note.
   - **.xlsx upload** (bks4 - the critic could NOT test this, Seth must):
     upload `Phase-1-Program.xlsx` directly -> a sheet picker -> pick
     `Program` -> same stats as above.
   - Preview opens at the top, program before matching, Create sticky.
     Create -> builder with a toast. Match one name -> it shows as matched.
   - Counts read "6 match your library" / "1 matches your library".
3. **Sets x Reps without AI** (bksf2b): paste a sheet whose header has a
   combined column, e.g. `Exercise, Sets x Reps, Weight` with `5x5` and
   `4 x 6-8` -> Preview reads 5 x 5 and 4 x 6-8, nothing ignored.
4. **AI layout read** (bks1, bksf1c, bksf2b): paste a foreign-header sheet
   (e.g. `Movement, Sets x Reps, Load (kg), Session`) -> "Let AI read this
   layout" (costs 3 of 7; ~50 s) -> the preview shows the AI notice, an
   "AI read: ... (was ...)" line - or "(the standard reader couldn't read
   this sheet)" - and "Use the original read". Then Back -> Preview: the
   STANDARD read comes back (the AI read must not stick). kg columns convert
   to lb with one message.
5. **Any AI**: Copy the instructions -> paste into ChatGPT/Claude with a
   request -> paste the WHOLE answer back -> preview -> create.
6. **Export**: builder Settings -> Export block -> re-import on the File tab
   -> identical stats, "Nothing skipped".
7. **Builder** (BK, bksf1b, bksf2a):
   - Each set is ONE row: Set | Reps | Load | RPE | x, rep-range rows too
     (Reps | To | Load | RPE), every header over its own field.
   - The expanded card shows "Rest 3:00 · RPE ≤ 8 · 1 note" under the title;
     tapping it opens the "..." menu. Nothing feels squished.
   - Tap the block name -> edit it in place. The header says Unsaved while
     edits are pending, Saving..., then Saved.
   - Leave with unsaved edits, come back -> "Restore unsaved changes".
   - Add exercise -> search "press": YOUR lifts first; the list scrolls on
     its own with the keypad open and nothing covers the search box.
   - Classic BK checks: 4 days with only day 1 filled -> Save names the empty
     day -> "Remove empty days"; Reps -> Time (30 s), Range, Rest stepper,
     Cap; label week 4 "Deload", copy week 1 forward +5 -> week 4 skipped;
     Progression tab reads week to week.
8. **Home + run a block** (BK, bksf2c):
   - With a running block and no live workout, the Home hero IS the next
     day: "W3 · Upper B", block name under it, "Start W3 · Upper B" starts
     that day straight into the logger; "Other workout" opens Empty / Browse
     templates. No separate "Next" card; nothing jumps ~2 s after load.
   - `/blocks/current`: compact header (block name + "Week n of N"), week
     strip, day tiles, NEXT, "IN PROGRESS" shown once. End block uses the
     in-page confirm.
9. **Log a block day** (bks2, bksf1a):
   - One row per PLANNED set, every field greyed with the plan (weight too).
   - Tapping the set number logs it as planned - reps/seconds + load, NEVER
     effort; an RPE typed first is kept. Only the NEXT set's number is a
     button (later numbers are muted - by design, bksf3b), and values typed
     on a later row stay there until it is next. Typing only a weight keeps
     the row a draft.
   - "+ Add set", remove (asks first for a logged set), pencil per set,
     "+ Note" per exercise, "How the session went" at the bottom; author
     notes (Setup, Lead side) visible and not overwritable.
   - L/R "Per side" logging still works where the plan has it.
   - Keypad never covers the field being typed (phone).
   - RPE over the cap shows "over cap", readable in light mode too.
   - A timed set logs seconds. Finish with unlogged planned sets -> "N of M
     planned sets not logged - finish anyway?" -> the summary counts the
     timed set ("45 s"). Discard x sits clear of Back.
   - During that live workout, Home shows the live card and only a muted
     "Up next after this: ..." line naming the day AFTER the live one (no
     second Resume button on it).
10. **Execution**: Analytics -> Execution lists that session the same
    evening; under-cap effort = no drift, over-cap = overshoot.
11. **Connector drafts** (Claude connected to the STAGING connector): switch
    off -> ask Claude to make a block -> "turned off"; switch on -> ask
    again -> DRAFT pill -> Review -> banner -> Save to library. A draft
    cannot be made public before it is saved. If Seth's Claude only has the
    prod connector, mark it "deferred - needs the staging connector".
12. **Coach**: new block -> "Describe the block you want"; builder Settings
    -> "Ask the coach about this block"; on the Paste tab with plain prose,
    the AI button (now also labelled "Let AI read this layout", costs 1)
    -> preview. With AI consent off, none of these show.
13. **Regressions + desktop**: a quick-log workout and a saved-workout
    session behave as before; saved workouts keep "Set as current". At
    1280, the builder/run header sits under the app nav when scrolled.

**By design - do not log as defects:** unmatched imported names do not
count toward Analytics (the preview says so); timed sets add nothing to
volume or strength; copy forward skips Deload-labeled weeks unless the box
is ticked; rest 0 reads "None"; the coach range stays date-only; saving is
blocked while any day is empty (the message names it); "Create workout" is
greyed in Library (parked); the AI layout read costs 3 coach uses.

**Known and deferred (not this wave - do not fail the smoke on them):**
- Home shows the in-progress card AND the bottom "In progress" bar together
  (duplicate Resume - next wave candidate, with Seth's Sept 29 discard ask).
- No rest timer after logging a set; fractional Execution numbers
  ("3×11.7"); the desktop In-progress bar is wider than the content column;
  "Per side" is offered on bilateral lifts; removed planned rows are stored
  per device only; the stats line wraps at 390px; "Match..." on its own line
  under short names.
- Critic round 3 leftovers NOT fixed before smoke (fair game for Seth to
  confirm, not to fail on): import transforms not fully explained (inline
  kg loads, columns folded into notes - R3 P2-3), the Home "This week"
  card arrives late and pushes Recent workouts down (R3 P2-4), crimson's
  "good" colour is amber (reads like over-cap), and the R3 P3 list.

**Gate notes for `pre-main-review` (after sign-off):**
- Carried from Sept 29: clone isolation (BK1, cross-user) - a live clone of
  a FOREIGN public block was not possible on staging; BK11 connector write
  path (cross-user; Claude-side check is smoke item 11); BK12 block-focus
  owner check lives in `askCoach.js` (accepted placement); BK10 reuses
  `templateExerciseId` for `block:<id>` keys and `judgePlanHit` is unused
  (spec 7.5 ruling); BK7 start-from-block has no unique guard (race -> two
  sessions); WeekStrip smooth scroll ignores reduced motion.
- **New since Sept 30:** bksf2a adds a raw `$queryRaw` (user-scoped,
  parameterised tagged template) to `GET /exercises/search` for usage
  ranking - review the scoping and the cost on a heavy account (it scans
  every SessionExercise + BlockWorkoutExercise row the user owns, per
  search keystroke). bks4 added the `read-excel-file` dependency (`fa1ea8b`,
  approved by Seth). bks2 moved author notes into the plan snapshot.
  The import page has two AI actions with ONE label ("Let AI read this
  layout"): the layout read (`/coach/import-map`, 3 uses) and the prose
  convert (`/coach/block-draft`, 1 use) - bksf2b's naming contract; judge
  whether the cost is still clear.
- Direct/seat fixes outside Cursor units: `aadb365`, BK5 state fixes,
  `0a92af6`, `8da0ae5`, `207c0f2` (Sept 29); `924bc66` (hook-order P0),
  `8badd2f` (ghost retune), `2deedf5` (light over-cap amber, measured Oct 1
  at 5.2-5.4:1 light / 7.4-8.9:1 dark on all palettes; Discard spacing),
  `bd0e4b3` (builder summary line moved to the expanded card), `9633c20`
  (bksf3b landing fix: a just-logged row PATCHed blanks over its new set -
  caught only by a live replay; review BlockSetRow's managed-draft handoff
  closely), `9f6b2a0`
  (R3 P1-1 keypad mode keyed on a stable boolean; R3 P2-2 AI-read compare
  gated on non-null - it had never rendered since bksf1c).
- **bksf3b ruling (frontier seat):** block sessions stay POSITIONAL
  (`blockWorkoutSetId` unused, spec 7.3) - the logger enforces in-order
  logging and keeps drafts per planned row instead of binding sets to rows.
  If Seth ever wants out-of-order logging, that is a schema change.
- Before any merge: Seth hand-applies BK1's migration
  `20260929120000_blocks_v2` to PROD (RUNBOOK "Schema-change deploy") and
  the prod-vs-staging migration drift (Housekeeping) gets reconciled.


## ARCHIVED October 5, 2026 (Opus session) - HANDOFF header + the Oct 1
## PICK UP HERE smoke protocol, moved verbatim when Seth's round-2 smoke
## opened the bkr fix wave.

> **WHERE WE ARE (Oct 1):** the **BK wave is COMPLETE again - 30/30 LANDED**
> on `ai-connector-wave` (head `93301c6`+, pushed; staging Render verified
> serving the wave's server code). Seth's Sept 30 smoke reopened the wave with four change
> requests (bks1-4: AI layout import, block-day logger, Library, .xlsx
> upload); then two critic fix rounds landed (bksf1a-d, bksf2a-c). The
> separate-agent feel critic scored 5 -> 7 -> **7/10 FAIL** (round 3 was the
> last by rule; `docs/tasks/bks-critic-round-3-FINDINGS.md`). Seth ruled
> Oct 1: fix its open P1s before his smoke, seat-verified, no round 4 -
> the seat fixed two directly (`9f6b2a0`), bksf3a-b fixed the other two
> (`2fd8773`, `b5e42f2` + landing fix `9633c20`), all checked live. HARD STOP for
> Seth's smoke, restarting from item 1 against the checklist below. Prod
> unchanged: `main` = `7d3b91e`.

**Next action (human):** open the before/after gallery
(https://claude.ai/artifact/BYfQuLW677z67Ap7WaDfwH) for a 2-minute look at
what changed, then open a Claude Code session, say "smoke the BK wave with
me", and work through the checklist below on your phone on the staging
Vercel deploy.

## ▶ PICK UP HERE (Oct 1 - for the agent running the smoke WITH Seth)

> **Your job: sit with Seth while he smokes the BK wave, one item at a time,
> and record results. You do NOT fix code and do NOT run the gate.** Any
> model can do this; Sonnet is fine.

**Protocol**

0. **Gallery first:** the private Artifact
   https://claude.ai/artifact/BYfQuLW677z67Ap7WaDfwH shows phone-size
   before/after shots of every changed screen, in checklist order (built
   Oct 1 at Seth's ask). Use it to orient Seth, not as a substitute for any
   item.
1. **Where Seth tests:** the staging Vercel preview of `ai-connector-wave`,
   branch URL
   `https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`
   (behind Vercel login; per-commit URLs also work). Phone first; desktop
   only for item 13. NEVER local dev (`client/.env` points at prod). The
   preview talks to staging Render `https://workout-db-staging.onrender.com`.
2. **Accounts:**
   - `test123` / `password` - holds the running block "Upper/Lower
     Strength - 4wk" (block 126). Weeks 1-2 and W3 Upper A, Lower A, Upper B are logged (the critic finished Upper B as session 465); **W3 · Lower B is next, nothing in progress.** Staging coach: 4 of 7 left this week. AI consent is ON;
     staging coach use is capped at 7 a week (the counter shows what is
     left - the AI layout read costs 3, convert/draft/ask cost 1 each).
   - Or Seth's own staging account, or `demo.critic@example.com` (password
     in the memory note `local-run-and-critic-loop`).
3. **Pace:** ONE item at a time, in plain words; wait for his result. If
   something looks off, ask for a screenshot - he drops them in
   `claudefiledrop/` (untracked; read with the Read tool; never commit it).
4. **Record:** APPEND a `## Smoke round 2 (Oct 1+)` section to
   `docs/tasks/bk-smoke-FINDINGS.md` at the first result - one line per item:
   PASS, or FAIL with Seth's words + screenshot name + severity (P0 broken /
   data loss, P1 blocks him, P2 friction, P3 polish). New scope = CR, not
   FAIL. Commit + push it at the end (docs-only push to staging is allowed).
5. **Verify, don't guess:** staging API calls with a cookie login
   (`POST /auth/login` with body `{"login":"test123","password":"password"}`,
   reuse the `workoutdb.sid` cookie); READ-ONLY Prisma reads from `server/`
   (`server/.env` = staging). No writes, no migrations.
6. **Defects:** do NOT fix during the smoke. After the last item, each FAIL
   becomes a DIAGNOSIS block (`author-task-block`, diagnosis variant) ->
   Cursor -> `land-unit`, and the sign-off resets. Only AGENTS.md's
   direct-fix exception applies - still record it.
7. **Sign-off:** when Seth says "smoke signed off" (or waives items), record
   it in the FINDINGS doc and here, set the Next action line to the
   pre-main gate, and stop. The gate is `pre-main-review` in an OPUS session
   with the gate notes below.


## ARCHIVED October 1, 2026 (Opus session) - HANDOFF sections
## moved verbatim when the reopened BK wave reached 28/28 and the smoke
## handoff was rewritten. Superseded, not summarized: the Sept 30 PICK UP
## HERE + UPDATE, the Sept 29 header, the Sept 29 smoke section with the
## original 11-item checklist, and the Sept 28 Updated note.

> **PICK UP HERE (Sept 30, late - session ended at a usage limit). Next agent:
> finish the BK critic loop, then hand Seth the smoke.**
> 1. Critic round 2 FAILED at 7/10. All round-1 P1s are closed; see
>    `docs/tasks/bks-critic-round-2-FINDINGS.md`.
> 2. The final-round fix blocks were DISPATCHED and may already have delivered
>    (uncommitted changes + DELIVERY.md in each lane):
>    - bksf2a in `C:\dev\worktrees\cursor-lane-2`
>    - bksf2b in `C:\dev\worktrees\cursor-lane-3`
>    - bksf2c in `C:\dev\worktrees\cursor-lane`
>    Logs are in `C:\dev\worktrees\_logs\`. Land each with `land-unit`: commit in
>    the lane, rebase onto `ai-connector-wave`, ff-merge, push.
> 3. ALWAYS load each page in the browser after landing. The build cannot see
>    hook-order crashes (see `924bc66`).
> 4. Seat fixes committed with this handoff, NOT yet measured live:
>    - light-mode over-cap amber darkened (`bk-ui.css`)
>    - Discard x spacing raised to 20px (`bk-log.css`)
>    Check the over-cap contrast is 3:1 or better in champ/forest/crimson light.
> 5. Critic ROUND 3 (the last one):
>    - Use the same separate-agent pattern: Agent tool, general-purpose, opus.
>    - Brief: `.playwright-mcp/bks-critic/BRIEF.md`. Add round-3 notes, palette
>      crimson.
>    - Use the local recipe from the memory note `local-run-and-critic-loop`.
>      Restart the local API after the server changes.
>    - After round 3, stop whatever the score and record it.
> 6. Then (Seth's explicit ask) REWRITE this section for a smoke agent:
>    - protocol, URLs, test123 / `password`
>    - an updated consolidated checklist: the original 11 items + the bks/bksf
>      changes (Excel upload, AI layout import, planned-row logger, Library,
>      search, Home block day)
>    - the by-design list, and the deferred duplicate Resume bars
>    - the gate notes
> - The .xlsx upload is untested by the critic: Playwright `browser_file_upload`
>   is blocked by permissions. Seth must test it himself in the smoke.
> - Unaddressed P3s for later:
>   - rest timer after logging a set
>   - fractional Execution numbers
>   - desktop In-progress bar width
>   - the "Per side" chip on bilateral lifts
>   - removed planned rows are stored per device only

> **UPDATE (Sept 30): the smoke REOPENED the wave.** Seth's item-1 notes became
> four change requests (`docs/tasks/bk-smoke-FINDINGS.md`) that he ruled
> in-wave: N = 20.
> - bks1 AI layout import, bks2 block logger, bks3 Library are QUEUED and
>   dispatched in parallel.
> - After they land, a critic loop runs as a SEPARATE Claude agent, 8/10 or
>   3 rounds.
> - Then the smoke restarts from item 1.
> - Test account `test123` / `password`: block 126, run 5, weeks 1-2 logged.
>   AI consent is ON; 3 of its 7 weekly coach uses went on the bks1 live proof.
> - Landed: bks3 `fb2bda1` (Library) and bks1 `1fc5bf8` (AI layout import,
>   live-proven on staging; the AI call takes ~53 s).
> - bks2 BOUNCED once:
>   - it must keep L/R per-side logging
>   - author notes move into the plan snapshot, so "+ Note" can't overwrite them
> - bks4 (.xlsx upload, `read-excel-file` dependency added in `fa1ea8b`, approved
>   by Seth) is running.
> - Smoke items carried forward for the restart:
>   - Library: blocks tab first, running strip, Create workout greyed
>   - Import: a foreign-header sheet -> "Let AI read this layout" -> preview
>     shows the AI-recipe notice and 4 of 7 left
>   - Logger: planned rows, ghosts, tap-to-log, add/remove, pencil notes, keypad
>   - Excel upload with a sheet picker
> - Next wave candidate: the duplicate Resume bars on Home.
> - LATER Sept 30: all four landed (21/21). bks4 `a4eeff0`, bks2 `5853dd4`.
>   - The seat's runtime check found a P0: the block-day page crashed because
>     of hook order (a useMemo sat after the loading return). Direct fix
>     `924bc66` (pushed).
>   - Lesson for the gate: build and lanes cannot see hook order. Always load
>     the page.
> - Critic round 1: FAIL 5/10 (`docs/tasks/bks-critic-round-1-FINDINGS.md`).
>   - Fix blocks landed: bksf1a `28af540` (+ ghost retune `8badd2f`), bksf1b
>     `095e517`, bksf1c `fcba6f1` (after bounce 1: kg columns now convert),
>     bksf1d `d540d77`.
>   - Wave 25/25. Critic round 2 is running (same agent, palette forest).
>   - The local API was restarted on the new server code.
>   - Round 1 details, for reference:
>   - Critic round 1 (a separate agent, brief
>     `.playwright-mcp/bks-critic/BRIEF.md`) is running against the local
>     recipe with test123. Session 463 (W3 Upper A) is in progress for it.

> **WHERE WE ARE (Sept 29, late):** the **BK (blocks-v2) wave is COMPLETE -
> 17/17 LANDED** on `ai-connector-wave` (`196a10b`): BK1-BK12 + BK5b plus the
> critic fix blocks bkf1a/b/c and bkf2. The coach-persona **critic PASSED in
> round 3 at 8/10** (rounds: 6 -> 7.5 -> 8; `docs/tasks/bk-critic-round-*-FINDINGS.md`).
> BK1's migration is applied to STAGING (not prod). **Staging Render was
> tracking `main`, not `ai-connector-wave`** (found Sept 29; Seth repointed it
> and redeployed - verified live: new routes up, latest server fix live, DB
> "up to date"). The critic ran on the local recipe before that, so Seth's
> smoke is the first run on the deployed stack. HARD STOP for Seth's smoke
> (checklist below). Prod unchanged: `main` = `7d3b91e`.

**Next action (human):** open a Claude Code session, say "smoke the BK wave
with me", and work through the checklist on your phone on the staging
Vercel deploy - the agent guides you item by item and records the results.

## ▶ PICK UP HERE (Sept 29, late - for the agent running the smoke WITH Seth)

> **Your job this session: sit with Seth while he smokes the BK wave, one
> checklist item at a time, and record results. You are NOT fixing code and
> NOT running the gate.** Any model can do this; Sonnet is fine.
>
> **Where things stand:** BK wave 17/17 LANDED on `ai-connector-wave`
> (`e339865`); critic passed 8/10 in round 3; staging Render tracks
> `ai-connector-wave` again (Seth repointed it Sept 29) and is verified live
> (new routes answer, latest server fix live, staging DB "up to date").
>
> **Smoke protocol**
> 1. **Where Seth tests:** the staging Vercel preview of `ai-connector-wave`
>    - branch URL `https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app`
>    (behind Vercel login; per-commit URLs also work) - on his PHONE first,
>    then desktop for item 11. Never local dev (the client `.env` points at
>    prod). It talks to staging Render `https://workout-db-staging.onrender.com`.
> 2. **Account:** Seth's own staging account, or `demo.critic@example.com`
>    (password in the memory note `local-run-and-critic-loop`). demo.critic
>    already holds the critic's data: blocks "Phase 1" (6 weeks, an ACTIVE
>    run, W1 Day 1 + Day 2 done), "Phase 1 - week 1", "Upper/Lower 4wk",
>    "R2 skeleton". Starting a different block on demo ends the Phase 1 run
>    (fine).
> 3. **Pace:** give ONE item at a time from the checklist below, in plain
>    words, wait for his result. If something looks off, ask for a
>    screenshot - he drops them in `claudefiledrop/` (untracked; read with
>    the Read tool; never commit that folder).
> 4. **Record:** create `docs/tasks/bk-smoke-FINDINGS.md` at the first result
>    - one line per item: PASS, or FAIL with Seth's words + screenshot name +
>    severity (P0 broken/data loss, P1 blocks him, P2 friction, P3 polish).
>    Commit + push it at the end (docs-only push to staging is allowed).
> 5. **Verify, don't guess:** you can check the server side yourself -
>    staging API calls with a cookie login (pattern: log in via
>    `POST /auth/login`, reuse the `workoutdb.sid` cookie), and READ-ONLY DB
>    reads with a small `node -e` Prisma script from `server/` (`server/.env`
>    points at staging; run `npx prisma generate` first; SELECT-style reads
>    only - no writes, no migrations).
> 6. **Defects:** do NOT fix during the smoke. After the last item, each
>    FAIL becomes a DIAGNOSIS block (`author-task-block`, diagnosis variant)
>    -> Cursor -> `land-unit`, and the sign-off resets. The only exception is
>    AGENTS.md's direct-fix rule (diagnosis ~95% of the work, trivial fix) -
>    still record it.
> 7. **Sign-off:** when Seth says "smoke signed off" (or waives items),
>    record it in the FINDINGS doc and here, set the Next action line to
>    the pre-main gate, and stop. The gate is `pre-main-review` in an OPUS
>    (frontier) session, using the gate notes below.
>
> **Item-specific notes**
> - **Item 1 (Phase-1 sheet):** Seth can select the `Program` sheet cells
>   (header row included) in Excel and paste straight into the Paste tab.
>   For the all-6-weeks File test he can Save As CSV/TSV, or use the local
>   export at `.playwright-mcp/bk-critic/Phase-1-Program.tsv` (gitignored;
>   made from `RecoveryProgram/workout-program/Phase-1-Program.xlsx`,
>   `Program` sheet). Expected: 216 rows -> 6 weeks, 30 days, 216 exercises,
>   602 sets, 84 timed; only warnings = the ignored `Tier` and
>   `Progression_Rule` columns; ~23 names "Not in your library".
> - **Item 8 (connector drafts):** needs Claude connected to the STAGING
>   connector (staging AuthKit `scientific-mist-64-staging.authkit.app`,
>   sign-in URI on the `ai-connector-wave` preview host). If Seth's Claude
>   only has the prod connector, mark item 8 "deferred - needs the staging
>   connector" rather than failing it.
> - **Item 9 (coach):** real coach on staging, capped at 7 questions a week
>   (`COACH_UNCAPPED_EMAILS` is set on prod only, by design). Each convert /
>   draft / ask costs one.
>
> **By design - do not log as defects:** unmatched imported names do not
> count toward Analytics (the preview says so); timed sets add nothing to
> volume or strength; copy forward skips Deload-labeled weeks unless the box
> is ticked; rest 0 reads "None"; the coach range stays date-only; saving
> is blocked while any day is empty (the message names it). Known P3s
> already on file (round 3): the stats line wraps at 390px, "Match..." sits
> on its own line under short names, picker ranking for "bench press".
>
> **Gate notes for `pre-main-review` (after sign-off):** clone isolation
> (BK1, cross-user) - a live clone of a FOREIGN public block was not
> possible on staging; BK11 connector write path (cross-user; live-checked
> in-process, Claude-side check is smoke item 8); BK12 block-focus owner
> check lives in `askCoach.js` (accepted placement); BK10 reuses the
> enriched `templateExerciseId` field for `block:<id>` keys and
> `judgePlanHit` is unused (spec 7.5 ruling, hit rate deferred); BK7
> start-from-block has no unique guard (race -> two sessions); WeekStrip
> smooth scroll ignores reduced motion; direct fixes outside Cursor units:
> `aadb365` (BK3 extraction), BK5 state fixes, `0a92af6` (export legacy
> sets), `8da0ae5` (Any AI json kind), `207c0f2` (set-grid stretch,
> day-picker scrollbar). Before any merge: Seth hand-applies BK1's
> migration `20260929120000_blocks_v2` to PROD (RUNBOOK "Schema-change
> deploy") and the prod-vs-staging migration drift (Housekeeping) gets
> reconciled. Lane `cursor-lane-3` holds three untracked mock PNG copies
> in `client/src/assets/scenes/` - never stage them.

### Wave smoke checklist - BK (Seth, staging Vercel deploy, phone + desktop)

Pre-check (done Sept 29 by the relay): staging Render repointed to
`ai-connector-wave` and redeployed; `/block-runs/active` answers 401 (not
404) and the Any AI json fix is live.

1. **Import your Phase-1 sheet** (Library -> Import a block): paste week 1,
   then File-upload all 6 weeks. Preview opens at the top, program before
   matching, "Not in your library (N)" with the Analytics note, Create sticky.
   Create -> the builder with a toast. Match one name -> it shows as matched.
2. **Any AI**: Copy the instructions -> paste into ChatGPT/Claude with a
   request -> paste the WHOLE answer back -> preview -> create.
3. **Export**: builder Settings -> Export block -> re-import that file on
   the File tab -> identical stats, "Nothing skipped".
4. **Builder**: new block, 4 days, only day 1 filled -> Save names the empty
   day -> "Remove empty days" -> Save. Reps -> Time (30 s), Range, Rest
   stepper, Cap. Label week 4 "Deload", copy week 1 forward +5 -> week 4
   skipped. Progression tab reads week to week.
5. **Run a block**: Library -> Start block -> /blocks/current (week strip,
   day tiles, NEXT, Start near the top); Home shows "Up next" (below any
   live-workout card). End block uses the in-page confirm.
6. **Log a block day**: plan line + coach notes (Setup, Lead side) visible;
   "As planned" fills reps/seconds + load, never effort; a timed set logs
   seconds; RPE over the cap shows "over cap". Finish -> the summary counts
   the timed set ("45 s").
7. **Execution**: Analytics -> Execution lists that session the same
   evening; under-cap effort = no drift, over-cap = overshoot.
8. **Connector drafts** (Claude connected to staging): switch off -> ask
   Claude to make a block -> "turned off" message; switch on -> ask again ->
   DRAFT pill -> Review -> banner -> Save to library. A draft cannot be made
   public before it is saved.
9. **Coach**: "Let the coach convert it" on a pasted paragraph -> preview;
   new block -> "Describe the block you want"; builder Settings -> "Ask the
   coach about this block". With AI consent off, none of these show.
10. **Regressions**: a quick-log workout and a saved-workout session behave
    as before; saved workouts keep "Set as current".
11. **Desktop (1280)**: builder/run header sits under the app nav when
    scrolled.


**Updated:** September 28, 2026, fifty-third session (Opus, frontier -
**the BK wave authored**, tranche 1 dispatched and delivered - BK1 6.1 min,
BK2 7.3 min, BK4 3.5 min, all exit 0 - and deliberately NOT landed: Seth asked
for a handoff so another agent finishes). Seth invoked `author-task-block` for
"a better version of blocks". Recon fanned out to three Cursor REPORT lanes (auto rung,
parallel, all exit 0 in 2.5-5 min): `recon/blocks-b1` in `cursor-lane-2`
(block/session/styling NOW-state), `recon/blocks-b2` in `cursor-lane-3`
(connector/coach/import plumbing, test globs), `recon/blocks-b3` in
`cursor-lane` (web research: Gymvanna NOT FOUND under any spelling - Seth to
supply a link if it matters; program import landscape; MCP write patterns -
preserved as `docs/specs/blocks-v2-import-research-2026-09-28.md`). Reports
B1/B2 are session-scoped (kept outside the repo at
`C:\dev\worktrees\recon-inputs\`); their load-bearing content is in the
spec. Four product calls asked + answered (spec section 1); frontier calls
added: rep ranges, snapshot-not-FK (the block update replace-alls plan rows),
a clone isolation fix, per-surface stylesheets, `sourceUnit` for connector
drafts, no new dependencies. `ai-layer.md` 4.2 AMENDED (one create-only
write); `block-execution-gap.md` SUPERSEDED. The recovery site's CSS is
preserved at `docs/design/recovery-logbook-reference.css`. Prior: September
28, fifty-second session (Opus - the prod connector fixed). Older sessions
archived.

## ARCHIVED September 29, 2026 (fifty-fourth session, Opus) - HANDOFF sections
## moved verbatim when the BK wave's units all landed. Superseded, not
## summarized: the Sept 28 BK-wave header and the Sept 28 PICK UP HERE
## (tranche 1 landing instructions - all done Sept 29).

### (from HANDOFF) header, as of Sept 28 late

> **WHERE WE ARE (Sept 28, late):** the **BLOCKS-V2 WAVE (BK) is OPEN** -
> authored, committed, pushed; **tranche 1 (BK1, BK2, BK4) is DELIVERED and
> AWAITING REVIEW in three lanes - nothing landed yet (0/13).** Design of record:
> `docs/specs/blocks-v2.md`. Seth's rulings (asked + answered this session):
> blocks become buildable, importable AND runnable (build + run + Execution);
> Claude can create DRAFT blocks through the connector, and ANY AI can write
> the import format for a paste; the recovery-site look on block surfaces +
> shared primitives; timed sets, rest, effort caps, week labels. 13 units
> queued (BK1-BK12 + BK5b) + BK0 privacy/ToS DRAFT, then a coach-persona
> critic loop (frontier seat, max 3 rounds, pass 8+). Prod unchanged: `main` =
> `7d3b91e`; the connector works on prod (fixed earlier Sept 28 - archived).

**Next action (human):** open a Sonnet Claude Code session and say "run the
BK wave" - it lands the three finished units and will ask you for "migrate
staging" before the BK1 push.

### (from HANDOFF) PICK UP HERE, as of Sept 28

## ▶ PICK UP HERE (Sept 28, written for a fresh agent)

> **Agent reading this:** the BK wave is OPEN. Ledger: QUEUE.md "Blocks-v2
> wave"; order + collisions: `blocks-v2.md` section 12. The authoring seat
> (Opus) did NOT land anything - landing is yours. Do these in order:
>
> 1. **Land BK2, then BK4, then BK1 - in that order, via `land-unit`.** All
>    three are DELIVERED (every run exit 0; `DELIVERY.md` timestamps Sept 28
>    19:46-19:49, fresh). Lanes, all branched from `b9a0fac`:
>    - **BK2** (pure format/parsers, new files only) in `C:\dev\worktrees\cursor-lane`
>      on `cursor/bk2` - Cursor claims unit 371/371 (23 new in
>      `server/test/lib/blocks/`), instructions text 1,187 chars.
>    - **BK4** (client primitives) in `C:\dev\worktrees\cursor-lane-3` on
>      `cursor/bk4` - touches `client/index.html`, ONE line of `index.css`,
>      new `client/src/components/blocks/ui/*` + `client/src/styles/blocks/bk-ui.css`.
>    - **BK1** (schema + persistence) in `C:\dev\worktrees\cursor-lane-2` on
>      `cursor/bk1` - Cursor claims unit 363/363, migration
>      `20260929120000_blocks_v2` generated offline via `prisma migrate diff`,
>      0 `DROP`s.
>    **Why this order:** BK1 is the only migration-carrying unit, and ANY
>    push to `ai-connector-wave` after BK1's commit deploys staging Render,
>    whose build runs `migrate deploy`. Land + push BK2 and BK4 first
>    (no migration); then commit BK1 and HOLD its push until Seth says
>    "migrate staging" verbatim (gate item 3 - one command at a time after
>    that). Claims above are Cursor's - re-run every lane fresh per
>    `land-unit`; never trust the report for green tests.
> 2. **BK1 audit focus:** the migration SQL (additive only; every column in
>    spec section 6 incl. `sourceUnit`), no `source`/`isDraft` read from
>    `req.body`, and the clone isolation fix (`buildClonePayload` strips
>    donor ids; re-stamp for the cloner) - a cross-user surface, flag it for
>    the gate. After the staging deploy, LIVE-check: create/PATCH a block
>    with the new fields, `POST /block-templates/:id/accept`, clone a public
>    block (a green unit lane is not route coverage).
> 3. **Then dispatch tranche 2** (`dispatch-unit`): BK3 + BK5 + BK7 in
>    parallel (disjoint per spec section 12). They need BK1 + BK2 + BK4 in
>    their base - repoint each lane onto the current `ai-connector-wave`
>    HEAD with `git checkout -B cursor/<unit> <HEAD>` (tranche 2 can go out
>    once BK1 is COMMITTED, even while its push waits for the phrase). Before
>    each dispatch, move any leftover `DELIVERY.md` out of the lane (stale
>    ones from Sept 27 are already in `C:\dev\worktrees\recon-inputs\stale-deliveries\`).
>    Dispatch wrapper (Start-Process + hard kill, `--model auto`):
>    `C:\dev\worktrees\recon-inputs\run.ps1 -Lane <path> -Tag <unit> -Minutes 40 -Prompt "<dispatch line>"`
>    (run it as a background task; the tranche-1 run logs sit beside it).
> 4. Continue the order in QUEUE.md / spec section 12. **Every server unit
>    needs a LIVE staging proof at landing** - lanes have no DB; each block's
>    DELIVERY carries curl checks.
> 5. **HARD STOP for a Sonnet relay:** when BK5, BK5b, BK6, BK8, BK9 and BK12
>    have all landed, the coach-persona critic loop (spec section 11) is the
>    FRONTIER SEAT's job (Opus, Playwright, max 3 rounds, pass 8+, Seth's
>    real Phase-1 sheet is task T1). Hand over; do not critique. After the
>    loop: N/N -> Seth smokes -> `pre-main-review`.
>
> Untracked `GATE-R1/2/3.md` in the lanes are stale Sept 26 gate files - not
> part of any BK unit; never stage them. Do NOT re-diagnose the connector; if
> it breaks, run the authorize probe in Durable gotchas first.

## ARCHIVED September 28, 2026 (fifty-third session, Opus) - HANDOFF sections
## moved verbatim when the BK (blocks-v2) wave opened. Superseded, not
## summarized: the Sept 28 connector-fixed header + PICK UP HERE intro, the
## fifty-second session line, the first Lane worktree state paragraph, and the
## PARKED block-builder paragraph (Seth unparked it Sept 28).

### (from HANDOFF) header + PICK UP HERE intro, as of Sept 28 (before BK)

> **WHERE WE ARE (Sept 28):** nothing is broken and nothing is in flight. **The
> Claude connector WORKS on prod.** The patch wave (CP2 faster coach, CQ1
> 7-per-week coach cap, WD1 discard-workout X) is merged to `main` at `7d3b91e`
> and deployed. Sept 27's "still not working" was the connector: the WorkOS
> **Production** External Sign-in URI was the site root, not
> `/connector/login` (staging's was right, which is why staging worked - the
> setting is per WorkOS environment and a code merge cannot carry it). Seth
> fixed it Sept 28. Verified: the authorize probe (Durable gotchas) now returns
> `302 .../connector/login?external_auth_id=`, Seth connected from Claude, and a
> live `list_exercises` call returned his real roster with `boundAccount`
> `sethjknisel@gmail.com`. No code changed.

**Next action (human):** nothing is blocked on Seth - when convenient, run the
prod checks in "Open on prod" below, starting with "Sign out of connected
assistants" (it has never passed live anywhere).

## ▶ PICK UP HERE (Sept 28, written for a fresh agent)

> **Agent reading this:** no wave is open and no block is queued. Do NOT
> re-diagnose the connector - it is fixed; if it ever breaks again, run the
> authorize probe in Durable gotchas FIRST (no login needed). The Sept 27
> diagnostics, the patch-wave pre-merge steps and the P-A/P-B research moved
> VERBATIM to the archive. Pick from the lists below; anything that becomes
> code needs a frontier seat to author the block.

### (from HANDOFF) the fifty-second session line

**Updated:** September 28, 2026, fifty-second session (Opus, frontier -
**the prod connector**). Seth reported "still not working" = the Claude
connector on prod. Root-caused without a login by an AuthKit authorize probe
(prod redirected to the site ROOT, staging to `/connector/login`; server side
identical); Seth corrected the WorkOS Production External Sign-in URI; the
probe re-ran green, Seth connected, and a live tool call returned his roster
with `boundAccount`. No code. The resolved Sept 27 sections moved VERBATIM to
the archive. Prior: September 27, fifty-first session (Opus - the AI-wave
merge, then the patch wave CP2/CQ1/WD1 landed, gated and merged `7d3b91e`).
Older sessions archived.

### (from HANDOFF) Lane worktree state, first paragraph

**All three FREE, all on LANDED bases (read Sept 28):** `cursor-lane` on
`cursor/wd1` @ `712b696` (stale Sept 27 WD1 `DELIVERY.md` + `GATE-R3.md`),
`cursor-lane-2` on `cursor/cp2` @ `b9dd0ae` (stale Sept 27 CP2 `DELIVERY.md` +
`GATE-R1.md`), `cursor-lane-3` on `recon/gate-r2` @ `ecb672c` (`GATE-R2.md`).
**Repoint a lane onto the next wave's branch before dispatch or the delivery
lands on the wrong base.** Installs differ: lane 2's `server` has its own full install WITH
`@cursor/sdk` (the gate ran its fresh lanes there - use it for CP2); lane 3's
`server` and `client` `node_modules` are JUNCTIONS into lane 1 (which lacks
the SDK).

### (from HANDOFF) the PARKED block-builder paragraph

**PARKED by Seth - the block builder.** "don't do anything with the block builder
for now, that's for another wave." Evidence in
`docs/specs/block-execution-gap.md` (`267271c`). **Do NOT author against it, and
do NOT ask him about it again** - he already ruled. It also records that
Execution reads planned values LIVE from `TemplateSet` rather than snapshotting,
so editing a template retroactively changes what past sessions are judged
against.

## ARCHIVED September 28, 2026 (fifty-second session, Opus) - HANDOFF sections
## moved verbatim once the prod connector was fixed (WorkOS Production
## External Sign-in URI -> `/connector/login`, Seth, Sept 28). Superseded, not
## summarized: the Sept 27 header + the Sept 28 root-cause note, DIAGNOSTICS,
## PRE-MERGE (patch-wave gate verdict + prod SQL), the post-merge PATCH section
## (smoke items, P-A, P-B, how the patch reaches main), Post-merge leftovers,
## and the Sept 27 fifty-first session line.

### (from HANDOFF) header through Post-merge leftovers, as of Sept 28

> **WHERE WE ARE (Sept 27, late - Seth reset his computer mid-session):** the
> post-merge PATCH WAVE is **MERGED to `main` and deployed to prod**. `main`
> fast-forwarded `bdad1c1..7d3b91e` (10 commits: CP2 `b9dd0ae` faster coach,
> CQ1 `b07fea2` 7-per-week coach cap, WD1 `712b696` discard-workout X, plus
> docs), pushed after Seth's "push to main", one approved command at a time.
> Prod DB got both migrations BY HAND first (Seth, Neon prod editor, project
> `snowy-resonance`; all 9 statements ran, checks returned 1 / 1 / 2 rows), so
> DB-before-code held. **Probed after the push:** `POST /sessions/1/discard`
> answers **401 on prod AND staging** (old code would 404) - both serve WD1.
> **Then Seth said "still not working"** and had to reset his computer before
> saying WHAT. That is the open item - see DIAGNOSTICS below.

**Sept 28 - ANSWERED + ROOT-CAUSED:** it is the connector on prod (branch A).
Claude said the connector may not be using OAuth. **Proved without a login:** a
bare `GET https://palatable-frog-16.authkit.app/oauth2/authorize` (Claude's CIMD
client_id, its redirect_uri, an S256 challenge, `resource=<prod>/mcp`) returns
`302 Location: https://workout-db-psi.vercel.app/?external_auth_id=...` - the
site ROOT. The same probe on staging AuthKit goes to `.../connector/login?...`.
Server side (401 + `WWW-Authenticate`, protected-resource metadata, AuthKit
metadata, DCR + CIMD) is identical on both. So A1 is still undone.

**Next action (human):** WorkOS -> **Production** -> Connect -> Configuration ->
External sign-in URI = `https://workout-db-psi.vercel.app/connector/login`. Then
an agent re-runs the probe (Location must end `/connector/login?external_auth_id=`)
before Seth retries Claude with `https://workout-db-l3gc.onrender.com/mcp`.

## DIAGNOSTICS - PICK UP HERE (Sept 27, written for a fresh agent)

> **Agent reading this:** ask Seth the question in "Next action" FIRST, in one
> line. Do not guess. Then run the matching branch below. Diagnosis only -
> no code until the root cause has file:line evidence (bugs enter as a Cursor
> diagnosis block per AGENTS.md; the frontier seat may ship a trivial fix
> directly). Prod writes are Seth's; agents read.

**Most likely: A - the Claude connector on prod (P-A).** It was broken before
today's merge and today's code did not touch it. Seth's P-A step 1 (the WorkOS
Production External Sign-in URI -> `https://workout-db-psi.vercel.app/connector/login`)
was never confirmed done in this session.

- **A1.** Ask Seth to read the value back from WorkOS Production -> Connect ->
  Configuration (agents cannot write prod WorkOS config - the classifier
  refused it twice on Sept 26). Anything but the full `/connector/login` path
  strands the handshake silently (durable gotcha).
- **A2.** Confirm the connector in Claude points at the PROD address
  `https://workout-db-l3gc.onrender.com/mcp`, not the staging one Seth added on
  Sept 26. Remove + re-add if Claude cached a failed registration.
- **A3.** If it still fails: capture the callback URL and its `error=` value
  BEFORE anything else, then prod Render logs around the completion call in
  `server/src/ai/workosClient.js` - a WorkOS 401 there means `WORKOS_API_KEY`
  on `workout-db-l3gc` is not the PRODUCTION key (`logchamp_prod`).
- Everything else on the path read GREEN on Sept 27 - see "P-A" below for the
  checked list (discovery, `/mcp` 401 + `WWW-Authenticate`, AuthKit metadata,
  CORS, the SPA route).

**B - something from today's deploy.**

- **B1. Coach errors / will not answer (CQ1, CP2):** prod Render logs. A
  `relation "CoachUsage" does not exist` would mean the prod table is missing
  (it should not be - Seth's checks passed). A 429 `weekly_limit` for Seth
  means `COACH_UNCAPPED_EMAILS` is not set on prod Render (unconfirmed). Look
  for the `[coach] cursor mode=... agentRuns=...` line per question; no line at
  all means the Cursor provider never ran.
- **B2. Workout pages broken (WD1):** every session fetch now reads
  `reopenedAt`; a `column "reopenedAt" does not exist` error = prod column
  missing (checks said present). The X lives in the live-workout header only
  (hidden on reopened workouts BY DESIGN).
- **B3. Still slow:** expected for the FIRST question after each deploy or idle
  wake (CP2's memo is per process). If prod Render spins down when idle, that is
  the CP3 follow-up in QUEUE's CP2 notes, not a regression.
- Verify the deployed SHA from Render Events (`7d3b91e`) before trusting any of
  the above (RUNBOOK 5).

**Loose ends from this session:**

- Temp merge worktree `C:\dev\worktrees\merge-main-0927` still exists (merge
  command 4, `git worktree remove`, was not yet approved when Seth left).
- Post-deploy prod checks (RUNBOOK 5 + the list in PRE-MERGE step 4) NOT done.
- `COACH_UNCAPPED_EMAILS` on prod + staging Render: unconfirmed.
- Staging Render still tracks `ai-connector-wave` (M2 repoint to `main` pending).
- `ai-connector-wave` == `main` at `7d3b91e` right now; any HANDOFF commit on the
  branch puts it one docs commit ahead again (the known pattern).
- Lanes (all FREE, all on LANDED bases - repoint before dispatch): `cursor-lane`
  on `cursor/wd1` @ `712b696` (stale WD1 `DELIVERY.md`), `cursor-lane-2` on
  `cursor/cp2` @ `b9dd0ae` (stale CP2 `DELIVERY.md`), `cursor-lane-3` on
  `recon/gate-r2`. Each still holds its untracked Sept 26 `GATE-R*.md`.
- HANDOFF is over its ~300-line cap - the next full rewrite should archive the
  "P-A"/"P-B" research and the AI-wave carry-forward VERBATIM.

## PRE-MERGE - DONE Sept 27 (kept for the record: gate verdict + prod steps)

**Gate verdict: PASS** (Seth waived smoke: "Skip smoke, review now"). Range
`origin/main..ai-connector-wave` = CP2 `b9dd0ae`, CQ1 `b07fea2`, WD1 `712b696`
+ docs. Fresh on the branch tip: unit 348/348 in 32 suites, client build clean,
`check-hex origin/main` clean. Scope: every code file maps to exactly one block;
the only other paths are docs (RUNBOOK `3770a35` is last session's). No Cursor
gate-fuel lanes: this seat read every unit diff in full at landing (~1100 code
lines). Cross-unit seams read directly: CP2's stream items feed CQ1's refund
(`deliveredAnswer` set only on a non-empty text delta; a client disconnect
`break`s the loop, which runs CP2's `finally`); the probe attempt yields no text
before the gate error, so it never counts a question. Security read directly:
discard's `deleteMany` WHERE carries `userId` (cross-user safe) and the rule
columns (race-safe); `/coach/status` never returns the email; an invalid BYO
header is still `bad_key_format` (no cap bypass). Not blockers: the palette
studio stays uncapped (Seth's ruling); pre-migration reopened-and-still-open
workouts read `reopenedAt` null (discardable, no data can tell); the confirm's
set count includes blank rows; CP3 if prod Render spins down.

**ORDER IS LOAD-BEARING.** WD1's `reopenedAt` is read by every session fetch
(`include` selects all scalars), so code ahead of the prod column breaks Home,
History and every workout page. DB first, then code.

1. **Seth, Render:** `COACH_UNCAPPED_EMAILS=sethjknisel@gmail.com` on
   `workout-db-l3gc` (prod) and `workout-db-staging`.
2. **Seth, PROD Neon SQL editor** - confirm host `ep-solitary-sea-an56mioq`
   in the URL bar, then run (checksums copied from staging's rows):
```sql
CREATE TABLE "CoachUsage" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachUsage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CoachUsage_userId_createdAt_idx" ON "CoachUsage"("userId", "createdAt");
ALTER TABLE "CoachUsage" ADD CONSTRAINT "CoachUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid(), '9f351f23ba0a01578f581a09dd573d11dc1e5f3640a34210f99f668f10180125', now(), '20260927120000_add_coach_usage', NULL, NULL, now(), 1);

ALTER TABLE "WorkoutSession" ADD COLUMN "reopenedAt" TIMESTAMP(3);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid(), '5c915adace825938f9b6bb33563781f4b82c5332d015dc9fb1b3af2a6af5fefe', now(), '20260927130000_add_session_reopened_at', NULL, NULL, now(), 1);

-- verify: expect 1 row, 0, and both migration rows
SELECT column_name FROM information_schema.columns WHERE table_name = 'WorkoutSession' AND column_name = 'reopenedAt';
SELECT count(*) FROM "CoachUsage";
SELECT migration_name, checksum FROM "_prisma_migrations" WHERE migration_name LIKE '20260927%';
```
3. **"push to main"** -> RUNBOOK merge ritual in a temp worktree, fast-forward
   `main` to the `ai-connector-wave` tip, one command at a time, each approved.
4. **After the deploy:** RUNBOOK 5 (Render SHA = `main` HEAD); on prod: log in,
   open Home + a past workout (the `reopenedAt` column path), start and discard
   an empty workout, ask the coach twice (second answer fast; Render log shows
   `[coach] cursor ... agentRuns=1` and no "Ripgrep path not configured").
5. **Then M2:** repoint staging Render to `main`.

## ▶ PICK UP HERE - the post-merge patch

> **Agent reading this:** research is DONE (Opus, Sept 27, read-only) - do not
> redo it. P-A is Seth's dashboard step first; only if it still fails after
> that does it become a diagnosis block. P-B = CP2, AUTHORED Sept 27 (Opus);
> the block supersedes the "CP2 block shape" notes below. Land it with
> `land-unit` from `cursor-lane-2`.

### Patch-wave smoke items (carried forward - handed over ONCE at wave end)

- **CP2 (`b9dd0ae`):** on staging, ask the coach two questions in a row - the
  second should answer in a few seconds (the first after a deploy still pays
  one slow probe, by design). Staging Render logs: one `[coach] cursor mode=
  inline agentRuns=... ttft_ms=... total_ms=...` line per question, and NO
  "Ripgrep path not configured" stack traces. Palette studio still generates
  a valid palette.
- **CQ1 (`b07fea2`):** set `COACH_UNCAPPED_EMAILS=sethjknisel@gmail.com` on
  staging Render first. As Seth: no cap line in the coach panel. As a
  non-exempt test account on the hosted key: "N of 7 questions left this week"
  drops by one per answered question; after 7 the ask box is disabled and says
  when the next frees up (local time); a BYO-key user sees no cap; the palette
  studio is never capped.
- **WD1 (`712b696`):** start a workout, log nothing, tap X -> straight to Home,
  "Workout discarded", no resume bar. Start one, log a set, tap X -> inline
  confirm; "Keep logging" changes nothing; "Discard workout" -> Home; Back does
  not return to it. Reopen a FINISHED workout -> NO X. Type into a set and tap
  X at once -> no error toast afterward. Check the X at 360px wide and in a
  couple of palettes, light and dark.

### P-A. The connector will not connect on prod (AI access ON) - CONFIG

**Evidence (read directly Sept 27, not delegated):**

- **WorkOS Production -> Connect -> Configuration:** DCR Enabled, CIMD Enabled,
  resource indicator `https://workout-db-l3gc.onrender.com/mcp` (Default) -
  all correct. **External Sign-in URI = `https://workout-db-psi.vercel.app/` -
  the site ROOT, missing `/connector/login`.** Staging's reads
  `<preview host>/connector/login` and works.
- **Mechanism:** AuthKit hands the user to the sign-in URI with
  `?external_auth_id=`. Only `client/src/pages/ConnectorLoginPage.jsx:14`
  reads that parameter; at `/` the Home page ignores it, the completion call
  never fires, the 300 s handshake expires and Claude reports it cannot
  connect. Same class as the Aug 8 AI8 failure (wrong sign-in URI).
- **Everything else on the path checked GREEN:** prod `/ai/consent` 401 (wave
  is deployed); discovery advertises `resource
  https://workout-db-l3gc.onrender.com/mcp` and `authorization_servers
  https://palatable-frog-16.authkit.app`; `/mcp` 401 + `WWW-Authenticate` with
  `resource_metadata`; prod AuthKit metadata serves `registration_endpoint`
  and `client_id_metadata_document_supported: true`; the prod client
  `https://workout-db-psi.vercel.app/connector/login` returns 200 (SPA route);
  prod API CORS allows that origin with credentials.

**Fix, in order:**

1. **Seth, WorkOS dashboard** (agents cannot - the auto-mode classifier
   refused agent writes to prod WorkOS auth config twice on Sept 26):
   Production -> Connect -> Configuration -> Edit external sign-in URI ->
   `https://workout-db-psi.vercel.app/connector/login` (no trailing slash).
2. **In Claude, use the PROD connector address**
   `https://workout-db-l3gc.onrender.com/mcp`. The custom connector Seth added
   for the Sept 26 STAGING smoke points at `workout-db-staging.onrender.com/mcp`
   - confirm which one he is retrying; add a separate prod one (remove and
   re-add if Claude cached a failed registration).
3. **Retry once, AI access ON.** If it still fails: capture the callback URL
   and its `error=` value BEFORE anything else (the Aug 6 lesson), then read
   prod Render logs around the completion call in `server/src/ai/workosClient.js`
   - a WorkOS 401 there means `WORKOS_API_KEY` on `workout-db-l3gc` is not the
   PRODUCTION-environment key (`logchamp_prod`, created Sept 26). Only then
   write a Cursor DIAGNOSIS block.
4. **Once it connects, the ID1 live checks on prod:** "Continue as <email>"
   stop on `/connector/login`; the tool result names the account
   (`boundAccount`); Profile -> AI access -> "Sign out of connected assistants"
   must say **"Signed out of connected assistants."** - "Nothing to sign out"
   means WorkOS does not file our `User.id` as `external_id` (Door A open;
   report it). This check has never passed live anywhere yet.
5. **Unverified:** the prod AuthKit session lifetime (Applications -> the app
   -> Sessions). Staging's was shortened Sept 26; prod's was on Seth's list.

### P-B. The hosted coach is slow on prod - CP2 (code)

Seth, Sept 27: "coach seems to work but its slow". Not yet MEASURED on prod.
Causes, by likely weight:

1. **Two agent runs per question.** `streamCursor`
   (`server/src/coach/cursorProvider.js:343-403`) always tries a run WITH
   `systemPrompt` first. This Cursor account is gated for it, so every request
   pays a full `Agent.create` + `send` + failing `wait()` (`:314-323`) before
   the inline retry (`:382-394`) does the real work. There is NO memo. Fix:
   remember the gate per process - after the first gate error, go straight to
   inline.
2. **Local-agent start-up per attempt:** `sdk.Agent.create` (`:269`) with a
   fresh `mkdtemp` store and cwd (`:99-106`) every time. Item 1 halves this.
3. **Six "Ripgrep path not configured" stack traces per request** - Render log
   flood, some time. The SDK exports `configureRipgrepPath()` (present in
   `@cursor/sdk/dist`). It needs a ripgrep binary path; if that means adding
   `@vscode/ripgrep`, that is **gate item 5 - ask Seth**. Prefer a quieter
   option that adds no package.
4. **Rule out the platform:** check the prod Render instance type (a
   spin-down tier adds a cold start to the first request after idle).

**CP2 block shape (for the author):** FILES TO TOUCH
`server/src/coach/cursorProvider.js` + its unit test; criteria: second and
later requests in a process make ONE agent run, persona still delivered
inline, BYO Anthropic path untouched, and a **mandatory LIVE smoke**
(`scripts/smoke-cursor-coach.mjs`) - the fake SDK encoded a wrong belief once
already (CP1). **Measure before and after:** time to first token and total
time of `POST /coach/ask` (browser Network tab or Render logs). MODEL: auto.
Known and NOT in scope unless Seth says so: the persona riding inside the
user message (weaker separation, no tools so blast radius is text only).

### How the patch reaches `main`

- **The patch lands ON `ai-connector-wave` itself (Opus, Sept 27)** - not a
  new branch. It is `main` plus docs-only HANDOFF commits, `main` stays an
  ancestor, so the merge is a clean fast-forward; and staging already tracks
  it, which saves Seth a Render repoint.
- **Staging Render `workout-db-staging` still tracks `ai-connector-wave`**
  unless Seth has repointed it (post-merge M2, not confirmed done) - confirm
  before the smoke. After the patch merges, point it at `main` (RUNBOOK
  step 7).
- The relay as usual: author -> dispatch -> `land-unit` -> Seth smokes on
  staging -> `pre-main-review` on the small delta -> Seth says "push to main"
  -> temp worktree, one command at a time with approval. No migration, no new
  env vars. P-A needs NO code if step 1 fixes it.
- **Staging connector caveat:** the STAGING External Sign-in URI is pinned to
  the `ai-connector-wave` Vercel PREVIEW host. A patch branch gets a different
  preview host - only matters if a patch touches the connector (CP2 does not).

### Post-merge leftovers

- **M2, Seth:** repoint staging Render back to `main` (after the patch).
- **Prod login: VERIFIED** - Seth logged in and used the coach after the
  merge, so the migration-before-code ordering held.
- **Do NOT check `/coach/status` by opening the API URL in a tab** - the prod
  session cookie is `partitioned` (`server/src/app.js:169-170`), so a
  top-level visit sends no cookie and returns 401 even when signed in. Check
  in-app (Profile -> AI access). RUNBOOK 10d item 4 is annotated.
- **The F/E-wave prod smoke is still open** (section "PROD smoke" below).
- A stale `.git/worktrees/merge-main` admin dir survived the merge cleanup
  (OneDrive lock on delete) - `git worktree prune` clears it.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from this wave and not blocking (prod's build never runs `migrate deploy`):
  checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

### (from HANDOFF) the Sept 27 session line

**Updated:** September 27, 2026, fifty-first session (Opus, frontier - **the
merge**). Across Sept 26-27: Seth made the four merge calls (C1-C4); `zod`
declared, unit lane 324/324, frontier check of that post-gate delta clean
(`bdad1c1`); Seth ran the prod migration by hand (checksum matches staging),
set the prod Render env, turned on Cursor Privacy Mode, shortened the staging
AuthKit session, and unlocked WorkOS Production (billing); the agent enabled
DCR + CIMD there and read the prod issuer; **"push to main" -> merged
`59e27dc..bdad1c1`**, five commands each approved, `origin/main` confirmed;
RUNBOOK 10d 1-4 passed on prod. Seth then reported P-A and P-B; both
researched read-only (above). The pre-merge sections - PICK UP HERE
checklist, gate verdict, ROAD TO MAIN, the AI-wave unit tables, carry-forward,
CR2 note, consolidated smoke, repo and lane state - moved VERBATIM to the
archive. Prior: September 26, fiftieth session (Opus - CP1 salvage + ID1
landed, smoke + SF1, the pre-main gate PASS WITH FIXES). Older sessions
archived.

## ARCHIVED September 27, 2026 (fifty-first session, Opus) - HANDOFF sections
## moved verbatim at the AI-wave MERGE (`main` `59e27dc..bdad1c1`, Sept 26).
## Superseded, not summarized: the Sept 26 header, Seth's PICK UP HERE
## checklist to `main` (as ticked through the merge), the Sept 26 session line
## and PRE-MAIN GATE verdict, the ROAD TO MAIN work order, the AI-wave section
## (unit tables, CP2 follow-ups, carry-forward, CR2 note, the consolidated wave
## smoke), and the pre-merge repo/deploy and lane state.

### (from HANDOFF) Sept 26 header through the AI-wave section, as of the merge

> **WHERE WE ARE (Sept 26, end of session):** the AI wave is **LANDED (4/4),
> SMOKED, SIGNED OFF and GATED - PASS WITH FIXES** (fixes landed; branch head
> `7206ff7`, 62 commits ahead of `main`, 0 behind, clean ff). No agent work is
> left before the merge. Everything below is SETH's: two calls (plus two optional), two
> dashboard settings, three prod prerequisites, then "push to main". Nothing is
> in flight.

**Next action (human):** calls are made (C1-C3 decided, C4 awaiting its lane
check) - do S1 (Cursor Privacy Mode) and S2, then P1-P3.

## ▶ PICK UP HERE - Seth's checklist to `main`

> **Agent reading this for Seth: show him THIS checklist first, as-is, and ask
> which item he is on.** Do not start the gate again (it PASSED), do not
> dispatch anything, and never run a prod step - agents may DISPLAY prod
> commands, Seth executes them (AGENTS.md gate items 1-3). If any CODE lands on
> the branch after `7206ff7`, the gate verdict no longer covers it - a frontier
> seat re-reviews that delta before the merge. Tick items here as Seth reports
> them done.

**Calls - Seth decides, tells the agent:**

- [x] **C1. Privacy page - DECIDED Sept 26 (Seth): next wave.** Merge without
  it; the privacy page + ToS (`ai-layer.md` section 6) is the next wave's work.
- [x] **C2. What's New - DECIDED Sept 26 (Seth): ship `2026-08-ai-assistant`
  AS IS, connector only, "nothing more".** It already says exactly that, so
  NO code change - it fires for every prod user on the merge deploy.
- [x] **C3. CR2 polish - SKIPPED (Seth, Sept 26).** Ship at 7.5.
- [x] **C4. Declare `zod` - DONE Sept 26 (approved by Seth).** `"zod":
  "^4.4.3"` in `server/package.json` (the Cursor SDK keeps its own nested zod
  3); the lockfile adds only that line plus CP1's `engines` sync, no resolved
  version moves. Unit lane 324/324 in 30 suites. Frontier check of this
  post-gate delta (Opus): clean. Road #10 also cleared - the install
  refreshed the main-tree `node_modules`.

**Settings - Seth, in dashboards:**

- [ ] **S1. Cursor Privacy Mode ON** for the Cursor account that owns the
  coach key (Cursor dashboard -> Settings -> Privacy). Do this BEFORE P3 puts
  the key on prod - user training summaries pass through it.
- [ ] **S2. AuthKit session lifetime, STAGING** - shorten it in the WorkOS
  dashboard (staging environment -> Sessions). ID1's residual: a stale session
  for an account the user cannot sign in as is only covered by expiry.

**Prod prerequisites - Seth runs them (agents display, never execute):**

- [ ] **P1. Prod migration by hand (road #2).** Paste the SQL block under
  "V2 RESULT" in `docs/RUNBOOK.md` section 10a into the PROD Neon SQL editor -
  confirm `ep-solitary-sea-an56mioq` in the URL bar first - then run RUNBOOK
  section 4 (migration history diff): prod must match staging on
  `20260804180000_add_ai_consent`. Additive and safe on today's `main`; it MUST
  land before the merge or prod login breaks.
- [x] **P1 DONE Sept 26 (Seth).** SQL run on prod; section 4 diff shows
  `20260804180000_add_ai_consent` on prod with the SAME checksum as staging.
  **Older drift found, pre-wave, NOT a merge blocker** (prod build never runs
  `migrate deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.
- [x] **P3 DONE Sept 26 (Seth)** - all prod Render env vars set.
- [ ] **P2 - IN PROGRESS Sept 26.** Billing added and prod API key
  `logchamp_prod` created (Seth); DCR + CIMD ENABLED (agent). Prod AuthKit
  issuer = `https://palatable-frog-16.authkit.app`. **Seth still (the auto-mode
  classifier refuses agent writes to prod auth config, twice):** resource
  indicator `https://workout-db-l3gc.onrender.com/mcp` (Default), External
  Sign-in URI `<prod client origin>/connector/login`, prod session lifetime.
  Not a merge blocker - the prod connector is dead until they are set.
- [ ] **P2. PROD AuthKit environment (road #11).** RUNBOOK 10c: a SEPARATE prod
  environment (one environment has ONE External Sign-in URI, so prod and
  staging cannot share). Set its External Sign-in URI to
  `<prod client origin>/connector/login`, and set a short session lifetime
  there too (S2's prod twin).
- [ ] **P3. Prod env vars on `workout-db-l3gc` (road #12).** RUNBOOK 10b:
  `MCP_RESOURCE_URL` = `https://<prod API host>/mcp` (unset silently means
  localhost and every real token fails); `MCP_AUTHORIZATION_SERVER` = the PROD
  AuthKit issuer from P2 (read at module load - needs a restart);
  `WORKOS_API_KEY` = the prod key; `COACH_PROVIDER` = `cursor`;
  `COACH_API_KEY` = a Cursor key (after S1; staging's key or a separate prod
  one). Leave `COACH_MODEL` unset, and set no `NODE_VERSION` (the `engines`
  field pins Node 22.x). No duplicate keys - Render takes one value per name.

**Merge - Seth's trigger:**

- [ ] **M1. Say "push to main"** (verbatim). The agent then runs RUNBOOK
  section 2 and the merge ONE command at a time, waiting for your approval
  before each - in a temp git worktree, never stash + checkout (OneDrive).
  It reports the merged commits, SHAs and confirmed `origin/main` HEAD.
- [ ] **M2. Post-merge (road #16).** Repoint staging Render back to `main`
  (RUNBOOK step 7 is NOT a no-op this wave), then RUNBOOK 10d in order - the
  single most informative check is **logging in on prod**. Then the connector
  from a real prod account, and the still-open F/E-wave prod smoke (section
  "PROD smoke" below).

**Already DONE - do not redo:** road #1 (prod Node >= 22.12, cleared Sept 25),
#3 (CP1), #4 (AI10), #5 code half (ID1), #6 (Cursor key on staging, live),
#7 (smoke + SF1 re-smoke signed off), #9 (gate PASS WITH FIXES). Road #10
(main-tree `npm install`) is housekeeping only.

**Smoke record, Sept 26 (Seth):** PASSED - the connector works inside Claude
from his real account, AI access OFF redirects correctly, `/coach/status`
`available: true` on the Cursor key. Two findings, both fixed by SF1 `ab35aca`
and re-smoked ("looks good"): registering a NEW account through the connector
link now returns to "Continue as <email>" and connects via an inline "Turn on
AI access and connect" step; the consent facts fold behind a pale "More info"
(open while AI access is off). **Deferred by Seth to a later wave:** the in-app
coach is not discoverable - he found the BYO-key field but no way to chat (the
panel sits under the Analytics stat tiles and on finished workouts).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** September 26, 2026, fiftieth session (Opus, frontier - **the wave
closed out, smoked, fixed and gated**). In order: salvage + land CP1, land
ID1, Seth's staging smoke (passed bar two findings), SF1 authored, dispatched
and landed, Seth's SF1 re-smoke (passed), then the pre-main gate (PASS WITH
FIXES, verdict block below), then this file restructured around the PICK UP
HERE checklist at Seth's request. The first half, in detail: found the Sept 25 session had stopped mid-relay: ID1 had
delivered clean, but CP1's run had DIED - connection lost, then an
`ActionRequiredError` auth error, after hanging ~13 hours with no timeout
around it and leaving no `DELIVERY.md`. `cursor-agent status` showed the relay
key still logged in. Backed CP1's lane up and re-dispatched it as a SALVAGE
into the same lane under a 45-minute hard kill (the AI7 precedent), and
audited ID1 in parallel. **ID1 LANDED `ebf7b80`** (frontier audit, no fix).
CP1's salvage run found the live smoke FAILING - SDK 1.0.32 reports the
account-gated `systemPrompt` error from `wait()`, not as a `send()` throw -
fixed the retry, and stopped as its block orders. The reviewer re-ran the live
smoke (PASS: stream via the inline fallback, palette validated), verified the
salvage byte-for-byte against the backup, and applied one fix: BYO keys must
never inherit a cursor `COACH_MODEL`. **CP1 LANDED `8ab7dcf`.** Combined tree:
unit 324/324 in 30 suites. **Wave 3/3.** Seven stale sections moved VERBATIM
to the archive; this file is still over its ~300-line cap - the ROAD TO MAIN
section and most of the AI-wave section go wholesale in the post-merge
rewrite. Prior: September 25 (Opus - Seth's
road-to-main answers; AI10 landed `ce51242`; CP1 + ID1 authored and dispatched
in parallel; the session ended before either returned, without a HANDOFF
session line). Older sessions archived.

**PRE-MAIN GATE, Sept 26 (Opus) - VERDICT: PASS WITH FIXES.** Scope: the
whole unmerged branch (`59e27dc..HEAD`, ~110 code files - Lane A, the five
unblocked Sept 9 commits, AI10, ID1, CP1, SF1). Fresh lanes on the gate head:
unit 324/324 in 30 suites, client build clean, `check-hex origin/main...HEAD`
clean, `require('./src/app')` loads without `@cursor/sdk`. Gate fuel: three
Cursor report lanes on the auto rung (R1 AI1-AI9 criterion coverage + cross-unit
seams; R2 AI10/ID1/CP1/SF1 coverage + the coach/palette code against
`ai-layer.md` and `ai-theming.md` + client/server contract seams; R3 tokens,
scope leakage, cross-doc drift, dangling references), each ~5 minutes, each
kept its no-edits contract; reports were left untracked in the lanes.
**Read directly (never delegated):** CORS split (wildcard WITHOUT credentials
on connector paths only, allowlist unchanged elsewhere); `tokenVerifier`
(issuer + audience pinned via `jose`, `sub` required, null on any failure);
`connectorAuth` (identity only from the verified token, never the cookie
session; consent + kill-switch every request; unknown `sub` fails closed);
`analyticsAccess` (every read goes through `fetchAllTimeEnrichedSets(userId)`,
so model-supplied exercise ids only filter the caller's own sets); coach +
palette routes (`authRequired` on all three; consent on ask + palette - status
reports it instead); BYO key (tab `sessionStorage`, per-request header, never
stored, logged or echoed); `CoachMarkdown` (React nodes only, no `innerHTML`
anywhere in `client/src`); palette apply (client re-checks hex, `scene` goes
through the `SCENE_URLS` whitelist before `url()`); the additive migration.
**No cross-unit contract drift:** every earlier contract a later unit changed
was changed on purpose (AI7 dropped the scope 403, AI8 moved the Login URI, SF1
replaced the consent redirect, Sept 9 rewrote copy).
**Fixes applied in-seat (landed with the verdict):** (1) the connect confirm
step now warns "Only continue if you just started connecting from your own AI
assistant" - the residual of the login-CSRF class: the page cannot name the
requesting client, so a phishing link opened inside the 300s window still
needs only a click or two; (2) doc drift - `ai-layer.md` CORRECTION 7
(as-built: engines pinned, `/coach/*` paths, BYO never stored, provider
`anthropic|cursor|mock`, roadmap ids, the unmet privacy item), an AS-BUILT
note atop `ai-theming.md`, RUNBOOK 10b/10e (Cursor key + Privacy Mode; ID1 and
AI10 landed), AGENTS.md palette enum (`chill` + `custom`, 10 combos), the
superseded Login URI in `workos-staging-handoff.md`, QUEUE's stale Active
header.
**Seth's calls before merge:** (a) `ai-layer.md` section 6 requires a privacy
policy + ToS "in the SAME wave" and the app has NONE - recommendation: do not
block the merge on it, but HOLD the What's New announcement (#13) until a short
plain-language privacy page exists (first unit of the next wave), since users'
training summaries now reach Cursor (hosted coach), Anthropic (BYO) and the
assistant they connect; (b) turn on **Privacy Mode** for the Cursor account
that owns `COACH_API_KEY` before the prod key goes on (#12).
**Follow-ups, not blockers:** show the requesting client's name on the confirm
step if WorkOS exposes it; CP2 (memoize the systemPrompt gate, quiet the
ripgrep log noise); make the in-app coach discoverable (Seth, deferred);
`4255782` put ~1.7 MB of PNGs under `claudefiledrop/` onto the branch - they
will ride into `main`.

---

## ROAD TO MAIN - the ordered work order (TRANSIENT: delete this section once the merge lands)

Compiled September 17, 2026 (Opus) from a ground-truth readiness pass over the
branch, NOT from prose. **This section is scratch, not permanent state** - the
agent that finishes the merge deletes it wholesale in the post-merge HANDOFF
rewrite. Keep it ordered; items 1-2 can veto everything below them.

**Already verified, do NOT re-derive:** the branch is 55 commits ahead of
`main` (recounted Sept 26) with **zero** commits on `main` that it lacks
(clean ff merge, no conflict risk); the wave's one migration
`20260804180000_add_ai_consent` is **additive** (new table +
`User.aiConnectorEnabled BOOLEAN NOT NULL DEFAULT true`), applied on staging,
NOT on prod; all four new runtime deps are declared
(`@modelcontextprotocol/sdk`, `express-rate-limit`, `jose`, and CP1's
`@cursor/sdk`, which loads LAZILY - requiring `src/app.js` leaves it out of
`require.cache`, so boot never depends on it); missing coach config **degrades
honestly** rather than crashing (`keyResolver` -> `no_key`, `askCoach` ->
`coach_unavailable`, `/coach/status` -> `available:false`); and the unit lane
is **324/324 in 30 suites** on the combined AI10 + ID1 + CP1 tree (Sept 26).

| # | Do | Owner | Blocks because |
|---|---|---|---|
| 1 | ~~VETO CHECK: prod Render Node >= 22.12~~ **CLEARED Sept 25 (Seth checked the dashboard)** | Seth | was: `app.js:10` requires ESM `zod`/`jose` at boot. #14 is still the permanent fix |
| 2 | **VETO FIRED Sept 25, path chosen:** prod build is `npm install && npx prisma generate` - it does NOT migrate. Keep it (prod migrations stay Seth's). **Seth hand-applies the migration via the ready-to-paste SQL in RUNBOOK 10a (V2 RESULT), then runs RUNBOOK section 4, BEFORE the merge** | Seth | without it the new code selects `User.aiConnectorEnabled` against a missing column and login breaks. Safe to run any time - `main` never reads the new table and the column has a DEFAULT |
| 3 | ~~DECISION: hosted key or dark~~ **DONE: CP1 LANDED `8ab7dcf` Sept 26** - the hosted coach runs on a CURSOR API key (Seth, Sept 25: "im not using an anthropic one") via `@cursor/sdk`; its live smoke PASSED in-seat (stream + palette). BYO keys stay Anthropic | done | #13 must describe the coach. CP2 follow-ups (gate memo, log noise) are listed in the AI-wave section - not blockers |
| 4 | ~~AI10~~ **LANDED `ce51242` Sept 25** (8000/3000 caps, truncation handled, smoke scripts) | done | still applies to BYO Anthropic keys. Its smoke scripts are unrun live |
| 5 | ~~DECISION: ship or fix the wrong-identity bind~~ **FIX LANDED: ID1 `ebf7b80` Sept 26, frontier audit** (confirm step on `/connector/login`, "Sign out of connected assistants" revoking WorkOS sessions + apps, `boundAccount` on tool output). Residual Seth step: shorten the AuthKit session lifetime in the WorkOS dashboard (Applications -> Sessions), staging now and the prod env at #11 | Seth | a stale AuthKit session belonging to an account the user cannot sign in as is only covered by session expiry. ID1's `external_id` lookup is unproven until the Part B live check |
| 6 | **UNBLOCKED Sept 26 (CP1 landed; Seth has minted the separate key).** Put it on STAGING Render: `COACH_PROVIDER=cursor` + `COACH_API_KEY=<the new key>`, `COACH_MODEL` left UNSET (defaults to `auto`). Never reuse the relay's `CURSOR_API_KEY`, so revoking one never kills the other. CP1 added `engines` `>=22.13 <23`, so Render should pick Node 22.x itself - confirm the version in the deploy log (a `NODE_VERSION` env var on the service overrides `engines`) | Seth | only the in-seat smoke script has reached the real model; no deployed coach path has. Without it #7 cannot test the coach |
| 7 | **THE SMOKE: Part A surfaces + Part B connector from Seth's REAL account** (checklist below in this file) | Seth | the hard stop. The gate does not start until he signs off; a gate run before smoke gets partly re-run after it. A smoke defect re-enters as a diagnosis block and RESETS the sign-off |
| 8 | **DECISION (optional):** work CR2 to its 8+ bar, or ship at 7.5 | Seth | `docs/tasks/cr2-critic-round-2-FINDINGS.md` is the work order; a UI block must be authored FROM it, not from memory. Product polish only - does not block a merge |
| 9 | ~~Pre-main gate review~~ **DONE Sept 26: PASS WITH FIXES** (verdict block near the top of this file; fixes landed). Two Seth calls came out of it: the privacy page (hold #13 until it exists?) and Cursor Privacy Mode before #12 | Seth | the gate itself is cleared |
| 10 | `npm install` in main-tree `server/` (gate item 5 - ask first) | agent | housekeeping only now - the gate ran its fresh lanes in `cursor-lane-2` (full install). The main tree still lacks `express-rate-limit` and `@cursor/sdk`, so two suites fail to LOAD there |
| 11 | Create a **PROD** AuthKit environment; set its External Sign-in URI to `<prod client origin>/connector/login` (RUNBOOK 10c) | Seth | an AuthKit environment has exactly ONE External Sign-in URI, so **prod and staging cannot share one** - pointing it at prod breaks the staging connector and vice versa. Today it points at this branch's Vercel PREVIEW host |
| 12 | Set prod env vars on `workout-db-l3gc`: `MCP_RESOURCE_URL`, `MCP_AUTHORIZATION_SERVER`, `WORKOS_API_KEY` (+ `COACH_*` per #3) - RUNBOOK 10b | Seth | `MCP_RESOURCE_URL` unset **silently defaults to `http://localhost:3000/mcp`** (`routes/index.js:18`, `middleware/connectorAuth.js:21`) - discovery advertises localhost and every real token fails the audience check with no error anywhere. `MCP_AUTHORIZATION_SERVER` is read at MODULE LOAD (`ai/tokenVerifier.js:1-2`), so it needs a RESTART to take effect |
| 13 | **DECISION:** write a What's New entry for the September 9 wave, or hold the announcement | Seth | entry `2026-08-ai-assistant` (dated Aug 5) is prod-gated via `lib/appEnv.js` and **fires for every prod user on this deploy**. It describes the CONNECTOR ONLY - it predates the coach, the palette studio and the entire Sept 9 redesign - and advertises a feature that does nothing until #11 and #12 are complete |
| 14 | Gate-item-5 call: declare `zod` in `package.json` (the Node pin half is DONE - CP1's `engines` `>=22.13 <23`) | Seth | the permanent fix for #1. Touches `package.json`, so it asks first |
| 15 | Seth says **"push to main"** verbatim -> merge, ONE command at a time with approval before each | Seth | gate item 1. Report commits, SHAs and confirmed `origin/main` HEAD after the push |
| 16 | Post-merge: repoint staging Render to `main` (**RUNBOOK step 7 is NOT a no-op this wave**), run RUNBOOK 10d verification, then the prod smoke | Seth + agent | staging Render tracks THIS BRANCH today. 10d's most informative check is simply **logging in on prod** - the migration adds a NOT NULL column to `User`, so if login works the ordering held |

**Full cutover detail is `docs/RUNBOOK.md` section 10** (vetoes, env matrix,
AuthKit ruling, verification curls, known-at-cutover defects, rollback). Do not
re-write that content here. **Rollback is cheap:** the migration is additive
with a `DEFAULT`, so reverting `main` to `59e27dc` is safe and needs no
down-migration - leave the table and column in place.

---

## The AI-wave - COMPLETE: Lane A 9/9, Lane B swept, follow-ups 3/3

Branch `ai-connector-wave` off `main` `59e27dc`; code HEAD `8ab7dcf` (CP1),
docs-only after it.
**Staging Render tracks THIS BRANCH**, so every push here deploys to
`workout-db-staging`. **RUNBOOK step 7 is NOT a no-op for this wave** - staging
must be repointed back to `main` after the merge.

**Lane A - the connector (`docs/specs/ai-layer.md` Lane A, blocks AI1-AI9):**

| Unit | SHA | What landed |
|---|---|---|
| AI1 | `83d82c8` | consent record + entitlement flag + `/profile/ai` page |
| AI2 | `5c051bc` | discovery doc, Bearer guard, scope+consent enforcement, rate limit |
| AI3 | `eecd2e9` | MCP server on `/mcp`, four read-only tools, shared analytics path |
| AI4 | `c89570e` | WorkOS JWKS verification + Login URI |
| AI5 | `9a2f63a` | the connect surface: copyable address, four steps, tier note |
| AI6 | `c1398a8` | rate-limit the connector by identity, not IP (fixes finding 1) |
| AI7 | `d925bd2` | drop `training:read` - the scope AuthKit cannot issue |
| AI8 | `bca098b` | move the Login URI to the client origin (the Aug 8 smoke fix) |
| AI9 | `43a4ceb` | per-client setup instructions: Claude, ChatGPT, Grok, generic |

ZERO bounces across all nine; four reviewer fixes. Per-unit audit reasoning is
in `docs/tasks/QUEUE.md`.

**Lane B + the critic loop - landed September 9, NO per-unit audit at the time:**

| SHA | What landed |
|---|---|
| `8455059` | the in-app coach: `POST /coach/ask` SSE proxy over plain `fetch`, `GET /coach/status`, one code path for BYO / hosted / mock keys, identity-keyed 40-per-15min limiter, `CoachPanel` on Analytics + a one-tap session debrief, 28 unit tests |
| `4f364ee` | full-bleed scenes, the barbell loading motif + shape-matched skeletons, Chakra Petch as `--font-display`, month-grouped History, nav/theme-color polish |
| `d28989b` | palette studio (`docs/specs/ai-theming.md` v1): `POST /coach/palette` returns a VALIDATED token record (hex only, never CSS), applied as a sixth `data-palette` value `custom`, per device via localStorage |
| `2080128` | critic loop round 1 (baseline scored 5/10): finished workouts as a record, History rows, the phone 16px gutter restored, light-mode scene, chart fixes |
| `932fa25` | critic loop round 2 (round 1 scored 7/10): Exercises as real analytics, the AI-access rebuild, crisp pixel light mode, heatmap headers, Profile two-column |


**The Sept 12 audit's follow-up units - all LANDED:**

| Unit | SHA | What landed |
|---|---|---|
| AI10 | `ce51242` | coach/palette caps 8000/3000 (thinking STAYS ON - never lower them), `max_tokens` handled on both paths, the thinking pause given a face, `scripts/smoke-coach.mjs` + `smoke-connector.mjs` (still unrun live) |
| ID1 | `ebf7b80` | the wrong-identity bind: "Continue as <email>" / "Use a different account" on `/connector/login`, `POST /ai/connector/signout` (revokes the user's WorkOS sessions + authorized apps), the same cleanup best-effort on consent revoke, `boundAccount` on every tool result |
| CP1 | `8ab7dcf` | the HOSTED coach + palette studio on a Cursor key: `@cursor/sdk` local agent, `tools: []`, fresh tmp cwd, lazy-loaded; BYO keys stay Anthropic; `scripts/smoke-cursor-coach.mjs` passed live Sept 26 |
| SF1 | `ab35aca` | Seth's smoke fixes: `next` survives Login <-> Register (`lib/safeNext.js`), an inline consent step on `/connector/login` so a new account still connects, the consent facts in one component (`AiConsentFacts`) folded behind "More info" when AI access is on |

**Follow-ups surfaced at landing - candidates for a CP2, NOT merge blockers:**

- **This Cursor account is gated for `systemPrompt`,** so EVERY hosted request
  makes one failing attempt before the inline fallback runs - wasted latency on
  every question. Memoize the gate per process.
- **The SDK prints six "Ripgrep path not configured" stack traces per request**
  (it tries to read `.gitignore` / `.cursorignore` in the empty tmp cwd). Harmless,
  but it will flood Render logs. `configureRipgrepPath()` or a quieter option.
- **The persona now rides INSIDE the user message** (the inline fallback), not a
  true system prompt - weaker separation from user text. The agent has no
  tools, so the blast radius is the answer text only.
- ID1: `revokeConsent` now makes a LIVE WorkOS call wherever `WORKOS_API_KEY`
  is set - including the integration lane if `server/.env` carries it.

### Carry-forward that still governs (full evidence in the archive)

- **The connector's server side PASSED end to end live (Aug 14)** with a real
  WorkOS token; AI8 is confirmed live; the consent kill-switch passes on both
  `tools/call` and `tools/list`, with no cache lag.
- **`external_auth_id` TTL is 300 seconds** - a slow password screen can
  genuinely expire a handshake. ID1's confirm step now says so on the page.
- **The wrong-identity bind is closed as far as code can close it (ID1).**
  Residual: a stale AuthKit session for an account the user cannot sign in as
  is covered only by session expiry (WorkOS dashboard, Seth - road #5).
  **Unproven until smoke:** that WorkOS files our `User.id` as the WorkOS
  user's `external_id` - Part B's ID1 live check settles it.
- **Trap before prod:** the staging Login URI host is a Vercel PREVIEW deploy
  behind Deployment Protection - any cold context gets 302'd to
  `vercel.com/sso-api`. Staging-only; prod's domain is public.
- **OPEN: `zod` is an undeclared phantom dependency** - ESM-only, required at
  boot by `mcpServer.js`. CP1's `engines` field now pins Node 22.x; declaring
  `zod` is what remains of road #14.
- **MCP revision `2026-07-28` is deliberately NOT targeted** - it changes the
  transport incompatibly; `ai-layer.md` section 4.0 "CORRECTIONS" is
  authoritative. A dual-era server is a future unit.
- **Cross-user isolation surfaces** (AI2's Bearer guard, AI4's token
  verification, ID1's signout) are standing frontier-seat escalations
  regardless of who writes them.
- **DO NOT READ A GREEN UNIT LANE AS COVERAGE OF AN ENDPOINT.** It matches only
  `test/analytics/**` and `test/lib/**` and never loads a route, controller or
  middleware; the integration lane needs `server/.env`, which no lane has.

### CR2 - the critic loop's round-2 report, UNWORKED

`docs/tasks/cr2-critic-round-2-FINDINGS.md` (7.5/10, preserved verbatim on
Sept 12 from gitignored `.playwright-mcp/critic/round-2.md`). **Not a
dispatchable block** - its ten ranked fixes and twelve bugs are the outstanding
work order, and **a UI block should be authored FROM it rather than from
memory.** The reusable loop recipe is `docs/design/critic-brief.md` (also
rescued from gitignore). **Rounds 0 and 1 were rescued Sept 17** as
`cr0-critic-round-0-FINDINGS.md` (the 5/10 baseline) and
`cr1-critic-round-1-FINDINGS.md` (7/10) - both WORKED and superseded, kept for
the baseline itself and for CR1's "Round-0 fixes status", the only item-by-item
audit of what `2080128` delivered. **CR2 is the one live work order of the
three;** do not author against CR0 or CR1, their lists were re-ranked twice. What holds the product under 8 is no longer any single
broken screen but unfinished micro-detail: labels repeated per row instead of
set once as a column header, a "Tracked" badge that distinguishes nothing,
em-dash placeholders standing in for real empty states, four hero sparklines
that all draw the same straight line, and the iron/crimson scenes being nowhere
near champ's standard. One listed bug is already RULED OUT: the identical
`1h 2m` durations are uniform seed data - `client/src/lib/sessionFacts.js`
computes per session from `startedAt`/`completedAt`.

### CONSOLIDATED WAVE SMOKE - Seth, on the staging Vercel deploy

**REWRITTEN September 26** for ID1 + CP1 (the Sept 12 version is verbatim in
the archive). Confirm `origin/ai-connector-wave` is at `8ab7dcf` or a
docs-only commit after it, and that BOTH the Vercel and Render staging deploys
have built it. **Do road-to-main #6 first** (the Cursor key on staging
Render), then **probe `GET /coach/status` on staging while signed in** - it
should read `available: true`, `source: "hosted"`, `provider: "cursor"`,
`model: "auto"`. Anything else means the coach checks below are testing the
wrong path.

**Part A - the surfaces:**

- **Profile -> AI access**: switch row + state line, three facts, the coach
  status, and the mono address `https://workout-db-staging.onrender.com/mcp`
  with copy (wrong address = `VITE_API_URL` on Vercel is wrong). AI9's
  accordions: Claude open, ChatGPT / Grok / generic collapsed. Check on phone.
- **NEW (ID1): a "Connected assistants" section with "Sign out of connected
  assistants"** - present with AI access ON and with it OFF.
- **The coach panel on Analytics** - ask something and watch the answer stream
  AND END. It now runs on the Cursor key: expect a slower first word than
  before (one gated attempt + local-agent start-up). Note roughly how long.
- **The session debrief** - one tap on a finished workout.
- **Palette studio** on Profile -> Appearance: describe a look, live preview,
  keep / try another / discard. "The model did not return a palette" is now a
  Cursor-path finding - write down the description you used.
- **BYO key** (only if you have an Anthropic key): paste it on Profile -> AI
  access and ask the coach - it must still answer (the Anthropic path).
- **The Sept 9 UI pass**, read as a user: full-bleed scenes, crisp light mode,
  the barbell motif and skeletons, month-grouped History, the Home hero,
  Exercises as analytics. **Check iron and crimson** - the critic scored both
  well below champ.
- **Regression:** log out and back in, load Analytics, start and finish a
  workout. What's New does NOT appear on staging - prod-gated by design.

**Part B - the real connector. THIS IS THE PASS THAT MATTERS.**

- **From your REAL account**, add the connector inside Claude (Customize ->
  Connectors -> Add custom connector). The AuthKit browser session may still
  be on the `smoke-b8@example.com` throwaway - clear AuthKit cookies or use a
  fresh browser profile (that stuck session is exactly the residual ID1 cannot
  close from code).
- **NEW (ID1): `/connector/login` must STOP and ask "Continue as <your
  email>" or "Use a different account"** - it never completes on its own any
  more. Run it once signed out and once already signed in.
- **"Use a different account"** must log you out and, after you sign in, bring
  you back to the same connect page.
- **If the handshake fails, capture the callback URL and its `error=` value
  BEFORE anything else** - Aug 6's real error was only visible there.
- Ask Claude "how has my bench press moved this month?" - the numbers match
  Analytics, and **the tool result now names your email (`boundAccount`)**.
- **THE ID1 LIVE CHECK:** after a successful connect, press "Sign out of
  connected assistants". It must say **"Signed out of connected assistants."**
  **"Nothing to sign out" means WorkOS does NOT file our user id as
  `external_id` - Door A is still open; report it.** Then ask Claude again -
  it should have to re-authorize.
- **Consent-blocked path:** with AI access OFF, the connector flow lands on
  `/profile/ai`, and a question in Claude must fail.
- **A second LogChamp account** (register in a SEPARATE browser profile) closes
  AI6's two-identity rate-limit check AND is the real wrong-account test:
  connected as A, start a connect while signed in as B - the confirm step must
  name B.

### (from HANDOFF) Repo / deploy state + Lane worktree state, pre-merge

## Repo / deploy state

- **THE PROD CUTOVER IS WRITTEN DOWN NOW - `docs/RUNBOOK.md` section 10**,
  added Sept 17. Merging this wave does NOT give prod a working AI layer: it
  needs three env vars (`MCP_RESOURCE_URL` unset silently defaults to
  `localhost`, which rejects every real connector token), a PROD AuthKit
  environment whose External Sign-in URI is the prod client origin, and a
  ruling on whether prod shares staging's AuthKit - **it cannot; one
  environment has ONE sign-in URI, so sharing means prod and staging take
  turns being broken.** Section 10 carries the vetoes, the env matrix, the
  post-deploy verification curls, and the rollback note (the migration is
  additive, so reverting to `59e27dc` needs no down-migration).
- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. One command
  settles it: a GET of `/ai/consent` on a host returns **401** if that host
  serves the wave branch and **404** if it serves `main`.
- **A staging Render DEPLOY is also a staging MIGRATION.** The server's
  `render-build` script is `prisma generate && prisma migrate deploy` - that is
  how the `AiConsent` migration got applied on August 4 without anyone running
  it. Check prod Render's build command before assuming prod differs.
- **`ai-connector-wave` code HEAD is `8ab7dcf`** (CP1; docs-only commits after
  it), local == origin. **Staging Render
  `workout-db-staging` tracks it**, so pushes auto-deploy. **RUNBOOK step 7 is
  NOT a no-op:** repoint staging back to `main` after the merge.
- **`main` is at `59e27dc`** - the F-wave merge, August 4. **Prod Render
  `workout-db-l3gc` and prod Vercel are on `main`.** Any push to `main` is a
  prod-bound push (gate 2). **Prod smoke still open.**
- **`effort-mandatory-wave` and `effort-wave` are MERGED and closed** - all their
  CODE is on `main`, but each sits one or two DOCS-ONLY commits ahead (post-merge
  HANDOFF upkeep). **Therefore NOT safe deletion candidates.** Prior waves
  resolved this by landing the post-merge HANDOFF commit on `main` (`f2be093`,
  `869c5f1`) - a docs-only prod-bound push needing Seth's say-so.
- FP8 (PWA icons) is the only open FP unit - DRAFT, blocked on Seth dropping icon
  PNGs into `claudefiledrop/`. Icons LAST by his rider.
- **Main-tree `node_modules` is stale** - `express-rate-limit` (declared by AI2)
  and `@cursor/sdk` (CP1) were never installed there, because every unit of
  this wave was built in lane worktrees. Two suites fail to LOAD in the main tree as a result; zero assertion
  failures. An `npm install` in `server/` clears it - deliberately not run
  unasked (gate item 5).

### Lane worktree state

**All three lanes are CLEAN and FREE (Sept 26)** - lane 1 on `cursor/ai10` at
`ce51242`, lane 2 on `cursor/cp1` at `8ab7dcf`, lane 3 on `cursor/id1` at
`ebf7b80`, each holding a STALE gitignored `DELIVERY.md`. **Repoint any lane
off the target wave branch before use or the delivery lands on the wrong
base.** Installs differ: lane 3's `server` and `client` `node_modules` are
JUNCTIONS into lane 1 (which lacks `@cursor/sdk`); lane 2's `server` has its
own install WITH the SDK.

**Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status`** - it is
gitignored, so a stale report reads as "clean". The written warning was not
enough on its own on August 8; what caught it was mtime. Prefer a DISTINCT
report filename per lane run (`RECON-R1.md` / `RECON-R2.md`) so a stale file
cannot impersonate a fresh one at all.

**Lane `node_modules` drift is real.** When a lane's failures are
`Cannot find module`, suspect the environment before the code, and verify in a
lane known to be current.

---

## ARCHIVED September 26, 2026 (fiftieth session, Opus) - HANDOFF sections
## moved verbatim when the AI wave closed out (AI10, ID1 and CP1 all LANDED;
## the wave is at its hard stop for Seth's smoke). Superseded, not
## summarized: the Sept 17 header and session line, the Sept 12 audit and its
## AI10 follow-up (AI10 landed `ce51242`), the Aug 14 carry-forward and the
## three AI2/AI3 findings (now carried as a compact list in HANDOFF), the
## Sept 12 consolidated smoke (rewritten for ID1 + CP1), and the old lane
## state.

### (from HANDOFF) The Sept 17 header - WHERE WE ARE + session line

> **WHERE WE ARE (Sept 17):** the AI wave has TWO lanes on one branch.
> **Lane A (the connector, AI1-AI9) is 9/9 landed** and parked at its hard
> stop awaiting Seth's smoke. **Lane B (the in-app coach + palette studio)
> landed on September 9 in FIVE commits that never passed through
> `land-unit`** - no per-unit audit, no QUEUE entry, no HANDOFF record.
> A September 12 frontier audit swept them: Lane A is untouched, the lanes
> are green, and nothing is in flight. `ai-connector-wave` is at `932fa25`,
> pushed, staging deployed. One unit (AI10) is QUEUED and NOT dispatched.
> A Sept 17 integrity check CONFIRMS that Sept 12 rewrite completed rather
> than died mid-flight, and closed the one gap it left: the critic loop's
> full round 0-2 ladder is now in-repo instead of in gitignore.

**Updated:** September 17, 2026, forty-ninth session (Opus, frontier - **a
state-integrity check**). No code changed. Confirmed the Sept 12 rewrite
COMPLETED: HANDOFF, archive, QUEUE, AI10 and both rescues all present and
pushed; `932fa25..HEAD` is docs-only, so the September 9 work is untouched;
all three lanes clean, free, and carrying no `DELIVERY.md`. Closed the one gap
that pass left - critic rounds 0 and 1 rescued out of gitignore as
`cr0-`/`cr1-critic-round-*-FINDINGS.md`. Prior: September 12, forty-eighth
session (Opus, frontier - **the Lane-B audit**). No code changed. Swept the five unaudited September 9 commits
against Lane A and the specs, authored AI10 from the findings, and rescued two
files that were living only in gitignored paths (`docs/design/critic-brief.md`,
`docs/tasks/cr2-critic-round-2-FINDINGS.md`). Three HANDOFF sections moved
VERBATIM to the archive in this rewrite. Prior: August 14, forty-seventh
session (Opus - the live handshake probe: the connector's server side passes
end to end with a real WorkOS token; findings 1 and 3 closed, the AuthKit
identity-binding finding opened). Prior: August 8, forty-sixth (the Part B
smoke FAILED; AI8+AI9 authored, dispatched in parallel, landed - wave 9/9);
August 8, forty-fifth (the AI7 salvage); August 5, forty-fourth (AI5+AI6, the
live 26/26 run); August 5, forty-third (workflow - gate item 3 split); August
4, forty-second (AI1-AI3 + the prod-deploy incident); August 4, forty-first
(the AI wave authored); August 4, fortieth (F-wave gated and merged to `main`
`59e27dc`). All archived.

### (from HANDOFF) The September 12 audit + AI10 as QUEUED

### The September 12 audit - what it cleared, and what it did not

**Clean:**

- **ZERO Lane A regression.** `ai/mcpServer.js`, `connectorAuth.js`,
  `connectorAuthorize.js` and `connectorAuthController.js` are BYTE-IDENTICAL
  to `43a4ceb`; `aiApi.js` untouched; AI9's per-client accordions survive the
  AI-access rebuild intact.
- `npm run test:unit` **295/295 in 27 suites** (the +28 coach tests are real).
- Client build clean; `node scripts/check-hex.mjs` clean across the whole
  range despite **+3485 lines** of `index.css`.
- **No schema change, so no migration is owed** by this lane.

**Not clean - the two findings that produced the follow-up work:**

1. **Lane B has never made a real API call.** `server/.env` carries no
   `COACH_*` keys at all and the unit lane injects `fetchImpl`, so every coach
   and palette path has only ever run against `COACH_PROVIDER=mock`. Three
   budget-shaped defects follow from that and are AI10's contract: adaptive
   thinking on `claude-sonnet-5` shares `max_tokens` with the answer (the code
   deliberately sends no `thinking` parameter, pinned by
   `coachProvider.test.js:113`), so `MAX_TOKENS = 1500` invites a truncated
   answer; `PALETTE_MAX_TOKENS = 800` is the same bug with a harder failure
   (`JSON.parse` throws -> `502 palette_invalid`, and the controller branches
   on `stop_reason: "refusal"` but not `"max_tokens"`); and `CoachPanel.jsx:322`
   renders a bare caret while the model thinks, which reads as hung.
2. **The critic loop stopped one pass short of its own exit bar.** Round 0
   5/10 -> `2080128` -> round 1 7/10 -> `932fa25` -> **round 2 7.5/10, written
   11 minutes after the last commit and never acted on.** The brief sets the
   exit bar at 8+.

### AI10 - QUEUED, authored Sept 12, NOT dispatched

`docs/tasks/ai10-ai-layer-live-proof.md`, MODEL auto, MODE 1-relay. Raises both
ceilings (1500 -> 8000, 800 -> 3000), branches on `stop_reason: "max_tokens"` on
both paths so a truncated answer never reads as complete, gives the thinking
pause a face in `CoachPanel`, and leaves behind `scripts/smoke-coach.mjs` +
`scripts/smoke-connector.mjs`. **Ruling baked into the block: thinking STAYS
ON, the caps go up** - an unused ceiling costs nothing, because billing follows
emitted tokens. Do not let a later unit "optimize" 8000/3000 back down.
The scripts are WRITTEN but NOT RUN by Cursor (no key, no `server/.env` in the
lane); running them is the reviewer's or Seth's step, and `smoke-connector.mjs`
makes the August 14 in-seat connector probe repeatable for the first time.

### (from HANDOFF) Lane A carry-forward + the three AI2/AI3 findings

### Lane A carry-forward - what the Aug 14 live probe settled

Full detail moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (forty-eighth session
header). The conclusions that still govern:

- **The server side PASSES end to end** with a real WorkOS token: discovery,
  authorize, PKCE exchange, `initialize`, `tools/list`, all four `tools/call`,
  and refresh. Protocol `2025-11-25`, `serverInfo: logchamp 1.0.0`.
- **AI8 is confirmed live** - the External Sign-in URI is the client origin and
  the `external_auth_id` survives the login detour. No Vercel 404.
- **Consent kill-switch PASSES live**, on both `tools/call` and `tools/list`,
  with no cache lag.
- **`external_auth_id` TTL is 300 seconds** (AuthKit sets `Max-Age=300`). AI8's
  "assume no window and degrade gracefully" stance holds, but a slow password
  screen can genuinely expire a handshake.
- **OPEN FINDING, probably its own unit: a stale AuthKit session silently binds
  the WRONG identity, with no escape hatch.** `prompt=login` is IGNORED; AuthKit
  reuses its cached session, so a user who lands on the wrong LogChamp account
  once stays bound to it and the connector answers confidently with the wrong
  account's data. Most likely mechanism behind "I added it and it still didn't
  work." Not config-fixable from the client side.
- **Trap before prod:** the staging Login URI host is a Vercel PREVIEW deploy
  behind Deployment Protection - any cold context (curl, no cookies) gets 302'd
  to `vercel.com/sso-api`. Staging-only (prod's domain is public), but nothing
  except Seth's own browser can reach that URL today.

### The three AI2/AI3 findings - two closed, one open

1. **~~Rate limiter cannot key on connector identity~~ - FIXED by AI6
   `c1398a8`, and the wiring is now proven live** (two distinct buckets; the
   identity counter continued across a DIFFERENT token for the same `sub`
   without resetting). Only a literal two-identity check remains; it needs a
   second LogChamp account, Seth's to create.
2. **OPEN: `zod` and `jose` are ESM-only on an UNPINNED Node.** `zod` 4.4.3 is
   `"type": "module"` and is **completely undeclared in `package.json`** - a
   phantom transitive of the MCP SDK that `mcpServer.js` requires at boot. AI3
   deploying PROVES Render's Node is >= 22.12, so nothing is broken today, but
   a Render default change silently reintroduces a total-outage boot failure.
   Two cheap fixes, both Seth's call (gate item 5, touches `package.json`):
   pin Node, declare `zod`.
3. **~~`sub`-to-user mapping unverified~~ - CLOSED Aug 14, it PASSES.** `sub`
   comes back as a LogChamp `cuid()`, not a `user_`-prefixed WorkOS id, because
   WorkOS echoes the id `completeConnectorAuthorization` sent it.

**The design decision most easily re-broken later: MCP's current revision is
`2026-07-28` and we are deliberately NOT targeting it.** That revision changes
the transport incompatibly and drops `initialize`/`Mcp-Session-Id`; Anthropic's
connector docs still list support only through `2025-11-25`. Dated decision,
not oversight - `ai-layer.md` **section 4.0 "CORRECTIONS"** is authoritative
where it and older prose disagree. A dual-era server is a future unit.

**Two units are cross-user isolation surfaces** - AI2's Bearer guard and AI4's
token verification - and are standing frontier-seat escalations regardless of
who writes them.

**DO NOT READ A GREEN LANE AS COVERAGE OF AN ENDPOINT THIS WAVE.**
`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware; the integration lane needs
`server/.env`, which no lane worktree has.

### (from HANDOFF) The Sept 12 consolidated wave smoke

### CONSOLIDATED WAVE SMOKE - Seth, on the staging Vercel deploy

**REWRITTEN September 12** - the August version's Part A is superseded (the
Sept 9 rebuild changed the AI-access page and killed the double-"Copied"
residual it described); the old text is verbatim in the archive. Confirm the
Vercel staging deploy has built `932fa25` before starting.

**Part 0 is DONE** (the External Sign-in URI points at the client origin) and
the four Render env vars are set. **Probe `GET /coach/status` on staging FIRST**
- it tells you whether the coach is running on a hosted key, on mock, or is
unavailable, and every coach check below depends on that answer.

**Part A - the surfaces, including everything Sept 9 changed:**

- **Profile -> AI access**: switch row + state line, three facts, the quiet
  coach status, and the mono address with copy. Before consent, only the
  consent statement and the toggle show; turning AI access ON reveals the
  connection section. **The address reads
  `https://workout-db-staging.onrender.com/mcp`** - wrong means `VITE_API_URL`
  on Vercel is wrong.
- **AI9's per-client accordion survived the rebuild** (audited): Claude open by
  default, ChatGPT / Grok / generic collapsed, each independent. Check on phone.
- **The coach panel on Analytics** - opens in place, range/view-aware, the
  suggested questions derive from the summary. **Ask it something and watch the
  answer END** - if it stops mid-sentence you have just reproduced AI10's
  truncation finding on a live key.
- **The session debrief** - one tap on a finished workout.
- **BYO key** on Profile -> AI access (sessionStorage only, never stored).
- **Palette studio** on Profile -> Appearance: describe a look, live preview,
  keep / try another / discard / forget. Kept palettes are **per device**.
  A failure reading "The model did not return a palette" is AI10's finding 2.
- **The Sept 9 UI pass**, read as a user: full-bleed scenes in dark mode, light
  mode as crisp pixel art rather than fog, the barbell loading motif and
  shape-matched skeletons, month-grouped History rows with top set / tonnage /
  duration, the Home date + greeting hero, Exercises as real analytics.
  **Check iron and crimson** - the critic scored both scenes well below champ.
- **Regression:** log out and back in, load Analytics, start and finish a
  workout. **What's New does NOT appear on staging** - prod-gated by design.

**Part B - the real connector. THIS IS THE PASS THAT MATTERS.**
Everything a token can reach already passed in-seat on Aug 14. Two items still
need YOU:

- **The handshake from your REAL account.** The AuthKit session is stuck on the
  `smoke-b8@example.com` throwaway and `prompt=login` will not shake it - clear
  AuthKit cookies or use a fresh browser profile.
- **Adding the connector inside Claude itself**: Customize -> Connectors -> Add
  custom connector. Run it SIGNED OUT at least once (the path AI8 changed most
  and no lane can reach), and once already signed in (should be near-instant).
- **If it fails, capture the exact callback URL and its `error=` value BEFORE
  anything else.** August 6's real error was only visible there; the
  client-surfaced message was actively misleading.
- **Consent-blocked path:** with AI access OFF, the connector flow should land
  on `/profile/ai`, not an error page.
- Ask Claude "how has my bench press moved this month?" and confirm the numbers
  match the Analytics page. Then turn AI access OFF and ask again - **it must
  fail.**
- **A second LogChamp account** (register in a SEPARATE browser profile so the
  existing session survives) is the one thing that closes AI6's two-identity
  `RateLimit-*` check.

### (from HANDOFF) Lane worktree state as of Sept 17

### Lane worktree state

**All three lanes are CLEAN and FREE.** Lane 1 on `cursor/ai8` and lane 2 on
`cursor/ai9`, both at `43a4ceb`; lane 3 on `recon/ai9-r2` at `892d610` -
**repoint any lane off the target wave branch before use or the delivery lands
on the wrong base.**

---

## ARCHIVED September 12, 2026 (forty-eighth session, Opus) - three AI-wave
## sections moved verbatim out of HANDOFF during the Lane-B audit rewrite,
## newest first. All three are closed or superseded history: the Aug 14
## handshake evidence is now carried as conclusions in HANDOFF, the Aug 8
## 404 chain was fixed by AI8, and the consolidated wave smoke was rewritten
## because Fable's Sept 9 AI-access rebuild made Part A's checklist stale
## (the "Copied appears TWICE" residual it describes is gone). Nothing was
## summarized.

### (from HANDOFF) The Aug 14 live handshake, and the Aug 8 connector 404

### The Aug 14 live handshake — the server side PASSES

Run in-seat (Opus) against staging with a REAL WorkOS token: a throwaway OAuth
client registered via AuthKit's DCR endpoint, a real `/oauth2/authorize` driven
in Seth's browser, PKCE code exchange, then direct calls to `/mcp`. Not a mock,
not a lane. **Every server-side item passed.**

- **Discovery** — `/mcp` 401s with a correct `WWW-Authenticate` +
  `resource_metadata`; `/.well-known/oauth-protected-resource` points at
  `https://scientific-mist-64-staging.authkit.app`.
- **AI8 confirmed live.** Part 0 IS done — WorkOS's External Sign-in URI is
  `https://workout-db-git-ai-connector-wave-sethysethyseths-projects.vercel.app/connector/login`.
  Signed out, authorize -> that URL -> `/login?next=%2Fconnector%2Flogin%3F
  external_auth_id%3D...`: **relative, and the id survives.** No Vercel 404.
- **`initialize`, `tools/list`, and all four `tools/call` return correct
  per-user data.** Protocol `2025-11-25`, `serverInfo: logchamp 1.0.0`.
- **Refresh works** (`offline_access`) — new `jti`, same `sub`.

**Finding 3 (`sub`-to-user mapping) is CLOSED — it PASSES.** The token's
`sub` is `cmrp90q100000em21f4bomlz1` — a LogChamp **cuid**, NOT a `user_`-
prefixed WorkOS id. WorkOS echoes back the id `completeConnectorAuthorization`
sent it, so `payload.sub` -> `findUnique({ id })` resolves to the right user;
`/auth/me` on the same session returns that exact id. This was the wave's
highest-severity unverified line. It needed a real token and now has one.

**Finding 1's residual is effectively closed.** Two distinct buckets observed
live on `/mcp`: authenticated `ratelimit-limit: 300` counting the caller's own
calls, unauthenticated `600` in a separate bucket. Better, the counter
continued across a DIFFERENT access token for the same `sub` (295 -> 292, new
`jti`, no reset) — so the key is identity, not token or client. Only a literal
two-user check remains, and it needs a second account (Seth's to create).

**Consent kill-switch — PASS, verified live rather than by curl.** AI access
OFF -> the connect section vanishes (AI5's gating contract) AND an
already-issued, unexpired token gets `403 {"error":"forbidden","reason":
"no_consent"}` on both `tools/call` and `tools/list`, with no cache lag. Back
ON -> 200 and data again. **Side effect: this rewrote `smoke-b8`'s consent
row**, so `/profile/ai` now reads "turned it on on Aug 14, 2026" (was Aug 6).

**NEW FINDING, probably its own unit: a stale AuthKit session silently binds
the wrong identity, and there is no escape hatch.** Signed in, authorize
skipped the External Sign-in URI entirely and went straight to consent reading
"Logged in as smoke-b8@example.com" — a July 17 throwaway. **`prompt=login` is
IGNORED**; AuthKit reuses the cached WorkOS session regardless. So a user who
lands on the wrong LogChamp account once is bound to it with no visible way to
re-choose, and the connector will confidently answer with the wrong account's
data. This is the most likely mechanism behind "I added it and it still didn't
work." Not config-fixable from the client side.

**One more R1 unknown answered: `external_auth_id` TTL is 300 seconds.**
AuthKit sets `external_auth=...; Max-Age=300` alongside the redirect. AI8's
"assume no window and degrade gracefully" stance holds, but the window is real
and a slow password screen can genuinely expire a handshake.

**Trap worth clearing before prod:** the Login URI host is a Vercel PREVIEW
deploy behind Deployment Protection. Any cold context (curl, no cookies) gets
302'd to `vercel.com/sso-api` instead of the page; Seth's browser passes only
because it holds `_vercel_jwt`. Staging-only — prod's domain is public — but
nothing except his own browser can reach that URL today.

**Still NOT settled by this run:** the handshake from Seth's REAL account
(blocked by the stale AuthKit session), and the two-identity `RateLimit-*`
check (needs a second LogChamp account).

### AI8 and the August 8 live failure — the connector 404

Adding the connector died on Vercel's `404 DEPLOYMENT_NOT_FOUND`. Diagnosed
in-seat (Opus — connector auth is a standing escalation trigger). **Three
stacked defects, all verified rather than reasoned**, root-caused to AI4 putting
the Login URI on the API origin:

1. The redirect base was the FIRST entry of `CLIENT_ORIGIN` — a CORS
   ALLOWLIST — whose staging value is a dead per-deployment Vercel URL. The app
   was unaffected because `isAllowedVercelPreviewOrigin` pattern-matches
   `workout-*.vercel.app`, so the stale entry never mattered until something
   derived a REDIRECT from it.
2. `LoginPage` could not follow an absolute cross-origin `next`. Proven by
   running react-router's own resolver: it returns
   `/login/https:/workout-db-staging.onrender.com/ai/connector/login`, which the
   catch-all route silently bounces to `/`.
3. **The structural one:** the session cookie carries `Partitioned` (proven by
   serializing the real config: `HttpOnly; Secure; Partitioned; SameSite=None`).
   CHIPS keys it to the TOP-LEVEL site, so an API-origin Login URI reached by
   top-level navigation from WorkOS is in a different partition and can NEVER
   see the session. Fixing 1 and 2 alone yields an INFINITE LOGIN LOOP — there
   was no config-only workaround.

**Two Cursor recon lanes (R1 WorkOS docs, R2 per-client setup) fed both blocks.**
R1 confirmed WorkOS documents no same-origin constraint, so the move is
permitted, and that the completion call must stay server-side (secret API key).
**R1 could NOT source four things and they remain unknown:** `external_auth_id`
TTL, single-use semantics, repeat-`complete` behaviour, and `redirect_uri`
expiry. AI8 therefore assumes no window and degrades gracefully; only smoke can
answer these. R2 found the shipped ChatGPT copy pointed at a path that exists
only in third-party blogs, and confirmed no vendor requires MCP `2026-07-28`
yet — so this wave's `2025-11-25` targeting holds.

**Deferred, deliberately not scoped:** MCP's current revision is now
`2026-07-28`, which drops `initialize` and `Mcp-Session-Id` entirely. Hosted
assistants have not moved, so nothing is broken — but a dual-era server is a
future unit.

**A dispatch-ritual gap this session exposed.** `dispatch-unit` gates a lane on
`git status` being clean, but `DELIVERY.md` is gitignored, so a worktree holding
an unlanded delivery reads as CLEAN. Two recon lanes still held August 4
`DELIVERY.md` files and a naive readiness check matched them as fresh; caught by
timestamp, not by the precondition. Worth adding `--ignored` or an explicit
`DELIVERY.md` check to the skill.

**Main-tree `node_modules` is stale** — `express-rate-limit` (declared by AI2)
was never installed there, because every unit of this wave was built in lane
worktrees. Two suites fail to LOAD in the main tree as a result. Not a
regression, zero assertion failures; final verification was run in
`cursor-lane` at the merged HEAD (247/247). An `npm install` in `server/` would
clear it — deliberately not run unasked (gate item 5).


### (from HANDOFF) CONSOLIDATED WAVE SMOKE as written August 8-14 - SUPERSEDED

### CONSOLIDATED WAVE SMOKE — Seth, on the staging Vercel deploy

`origin/ai-connector-wave` is at `43a4ceb`; confirm the Vercel staging deploy
has built that SHA before starting. Both parts are live — the four Render env
vars are set.

> **DO PART 0 FIRST — Part B cannot pass without it.** In the WorkOS dashboard
> (Connect -> Configuration, "External Sign-in URI"), repoint the Login URI to
> `https://<staging client origin>/connector/login`. AI8 DELETED the old
> server-side route, so the previous value now points at nothing. One Login URI
> per environment, so staging and prod are configured separately.
>
> Optional while you are in there: clear the dead per-deployment Vercel URL out
> of `CLIENT_ORIGIN` on the staging Render service. Nothing derives a redirect
> from it any more, so it is inert — but it is a live trap for the next thing
> that reads it.

**Part A — the user-facing surface (AI1 + AI5), quick regression:**

- **Profile -> AI access exists and is reachable** (not gated behind
  `isProdEnv()`, so it is on staging).
- **Before consent, only the consent statement and the toggle show** — no
  connector address, no setup steps. That gating is the AI5 contract.
- **Turn AI access ON** → the connection section appears: "Connect your AI
  assistant", the address, and (AI9) a four-section accordion.
- **AI9's accordion (new):** Claude is open by default; ChatGPT, Grok, and
  "Any other AI assistant" are collapsed. Each opens and closes independently
  and they do not collapse each other. Check it on your phone too — this is the
  codebase's first disclosure pattern, so nothing else exercises it.
- **Read the ChatGPT steps carefully.** They changed: it is Settings ->
  "Security and login" -> Developer mode, then Plugins. The old copy pointed at
  a path that exists only in third-party blogs. If you have a ChatGPT account
  that qualifies, walking it once would be worth more than reading it.
- **The address reads `https://workout-db-staging.onrender.com/mcp`** — staging,
  not prod, not `localhost`, not a bare `/mcp`. Wrong ⇒ `VITE_API_URL` on Vercel
  is wrong.
- **Copy address works.** Known cosmetic residual: "Copied" appears TWICE (button
  label flips AND a success line renders), and the button keeps reading "Copied"
  until re-render. Both block-specified — say if you want one dropped.
- **Read the copy as a user, not a reviewer** (the E3 lesson): does the tier note
  read honest rather than discouraging? Is four steps enough to actually do it?
- **Turn AI access OFF** → the connection section disappears.
- **Regression check, because AI6 touched `app.js`:** log out and back in, load
  Analytics, start and finish a workout.
- **What's New does NOT appear on staging** — prod-gated by design.

**Part B — the real connector. THIS IS THE PASS THAT MATTERS.**
**Aug 14 update:** Part 0 is DONE, and everything below that a token can reach
already passed in-seat — the discovery/authorize/exchange/`initialize`/
`tools/list`/`tools/call` chain, the `sub` mapping, and the consent kill-switch.
Two items below still need YOU: the handshake **from your real account** (the
AuthKit session is stuck on `smoke-b8@example.com` and `prompt=login` will not
shake it), and adding the connector inside Claude itself.

- Add the address in Claude -> Customize -> Connectors -> Add custom connector.
- **You should get past both prior failures now** — `invalid_scope` (AI7) and the
  Vercel 404 (AI8). You should land on LogChamp's own page, then come straight
  back.
- **Run it SIGNED OUT of LogChamp at least once.** This is the path AI8 changed
  most and the one no lane can reach: sign out first, then add the connector.
  You should get LogChamp's login form, and after signing in be returned
  straight to the handshake rather than dumped on the home page.
  **This is also the only way to probe the biggest remaining unknown** — WorkOS
  does not document an `external_auth_id` TTL, so taking your time on the
  password screen is the real test. If you see "This connection link expired",
  that unknown just became a known and it needs a follow-up unit.
- **Also try it already signed in** — that path should be near-instant, with no
  login detour at all.
- **If it fails again, capture the exact callback URL and its `error=` value
  before anything else.** August 6's real error was only visible there; Claude's
  surfaced message (`state: Field required`) was misleading and would have sent
  a debugger down the wrong path entirely.
- **Consent-blocked path:** with AI access OFF, hitting the connector flow should
  land you on `/profile/ai` (where the toggle is), not on an error page.
- Ask Claude "how has my bench press moved this month?" and confirm the numbers
  match the Analytics page — the deterministic engine computes them, the model
  only narrates.
- **Turn AI access OFF in LogChamp, then ask Claude again — it must fail.** The
  consent kill-switch, verified live rather than by curl.

**What smoke CANNOT settle, and stays open into the gate:** the `sub`-to-user
mapping (finding 3) and AI6's two-identity `RateLimit-*` header check. Both need
a real WorkOS token in flight; a successful Part B is what makes them checkable.


## ARCHIVED August 8, 2026 (forty-sixth session, Opus) - two AI-wave sections
## moved verbatim out of HANDOFF at the AI8/AI9 landing, newest first. Both are
## closed history: AI7's defect is superseded by AI8's, and the 26/26 run is
## fixed August 5 evidence. Neither was summarized.

### (from HANDOFF) AI7 and the August 6 live failure

### AI7 and the August 6 live failure — read this before smoking Part B

With the four Render env vars finally set, adding the custom connector in Claude
died at `https://claude.ai/api/mcp/auth_callback?error=invalid_scope`, surfaced
to the user as the misleading `state: Field required` (Claude's callback
validating `state` on an ERROR redirect, which by definition carries none).
**Cause: WorkOS AuthKit advertises a FIXED scope vocabulary** —
`["email","offline_access","openid","profile"]` — with no dashboard affordance
for a custom one, while our protected-resource metadata advertised
`scopes_supported: ["training:read"]`. Claude dutifully requested it; AuthKit
refused. AI7 removes the scope as a protocol assertion and as an access control.

**Not a security relaxation.** Audience validation
(`tokenVerifier.js:49-52`), the `sub`-to-user mapping, the consent kill switch,
the entitlement flag, and four read-only tools that accept no user identifier
are all untouched. `CONNECTOR_SCOPE` survives as a local descriptor on the
`AiConsent` audit row. The scope was a fourth belt the authorization server has
no buckle for.

**The durable lesson, worth more than the fix.** `ai-layer.md:285` asserted "the
scopes are ours" — TRUE under Path 2 (in-house authorization server), FALSE
under Path 1 (the vendor), and it was carried across the pivot as though it
survived. AI1 hardcoded it, AI2 enforced it, nothing re-derived it against what
WorkOS can actually issue. **And no evidence in this wave could have caught it:**
the lanes never load a route, and the wave's strongest evidence — the live 26/26
run — went through AI2's swappable verifier seam with ordinary LogChamp tokens,
which never consults AuthKit's scope vocabulary at all. **A verification seam
that stands in for the vendor cannot test the vendor's constraints.**

**AI7 proves the cause is removed; it does NOT prove the handshake completes.**
Every lane is pure-function. Treat a successful Part B smoke as the first real
evidence, not a confirmation.


### (from HANDOFF) The live 26/26 run, August 5

### The wave's other strongest evidence — the live 26/26 run, August 5

Before AI4 closed the window, the whole chain was driven against staging with
real HTTP using two throwaway accounts. **26 checks, 26 passed** — consent
grant/revoke, 403-not-401 for unconsented, `WWW-Authenticate` carrying
`resource_metadata`, revocation closing `/mcp` on the next request, `initialize`
negotiating `2025-11-25`, exactly four tools none taking a user id, a second
account seeing only its own world, and statelessness holding across separate
HTTP requests. Detail in QUEUE.md. That window is closed (AI4's verifier rejects
ordinary LogChamp tokens); Part B is its successor.

---


## ARCHIVED August 8, 2026 (forty-fifth session, Opus resident relay) - the AI7
## SALVAGE. Session log, verbatim, newest first.

Session opened cold with a state-summary request. HANDOFF was three days stale
(last written August 5 at the 6/6 wave close) and did NOT describe reality:
between then and now Seth had set the four Render env vars, attempted the real
connector handshake in Claude, hit `error=invalid_scope`, and an AI7 block had
been authored and dispatched on August 6. QUEUE.md carried all of that; HANDOFF
carried none of it. **The lesson is the one already written at the bottom of
HANDOFF and it earned its place again: if this file looks stale, verify from
ground truth before trusting it.** QUEUE.md was the file that was current,
because `land-unit` writes it per unit while HANDOFF is rewritten per session -
and a session that ends by dying writes neither.

**Ground-truth sweep found the August 6 run DEAD, not finished.** No
`cursor-agent` process alive; lane `C:\dev\worktrees\cursor-lane` on `cursor/ai7`
off `e7b52f0` held five modified files last written August 6 at 1:56 PM; NO
`DELIVERY.md` at all. Reading the diff showed all five of the block's CHANGE
items fully implemented across exactly the five FILES TO TOUCH. So the run had
completed the CODE and died before running a single lane or writing a line of
report - it lost the evidence, not the work. Per the standing memory note
(`cursor-plan-is-auto-rung-only`): check the lane for salvageable work when a run
dies mid-flight. There was some.

**Salvage decision: re-dispatch into the same DIRTY lane rather than re-run from
scratch.** `dispatch-unit` section 2 normally marks a dirty lane UNAVAILABLE,
because dirty usually means another unit's delivery is unlanded; the exception it
names - "stop if the dirty delivery is the very unit in question" - is exactly
this case, so here the dirtiness was the asset. Three guards made that safe:
(1) the working diff was backed up to the session scratchpad
(`ai7-lane-salvage-backup.patch`, 7613 bytes) BEFORE any agent was pointed at the
tree, so a run that ignored its instructions and rewrote the work could not
destroy it; (2) the dispatch line ordered the run to VERIFY-not-redo, in caps,
with an explicit "do not rewrite working code just to put your own stamp on it";
(3) the report was ordered to label every acceptance criterion INHERITED vs
written-this-run, so the reviewer could see which code had a run behind it.

Channel B AUTO rung, same as the dead run. Run took under three minutes and
changed zero code, exactly as instructed.

**The salvage claim was then verified MECHANICALLY rather than accepted.**
`Get-FileHash` on the pre-dispatch backup and the post-run diff matched BYTE FOR
BYTE. This is the durable technique worth keeping: **back the lane up before a
salvage re-dispatch, and the agent's "I changed nothing" becomes a checkable
claim instead of a trust exercise.** Without the backup there is no way to
distinguish "verified the inherited work" from "quietly rewrote it and liked the
result."

**Why a salvage delivery gets a HARDER audit, not a softer one.** The code in
that lane was written by a run that never proved anything about it, and a second
run inheriting a diff has every incentive to bless what it finds - its cheapest
path to a green report is to declare the tree good. So the report was treated as
evidence of the LANES only, and correctness was read in-seat: the two seams no
lane can reach (the consent kill switch surviving the removal of the adjacent
scope 403; `resource_metadata` surviving the loss of `sendUnauthorized`'s `scope`
argument) were read directly, plus a repo-wide dangling-ref sweep for
`CONNECTOR_SCOPE` that the block's own acceptance criteria did not cover
(criterion 9 greps `server/src` only, while the deleted export was imported by a
file under `server/test/`). All clean. Full audit record in QUEUE.md.

Lanes re-run FRESH by the reviewer: unit 242/242 in 21 suites, client build
green, `require('./src/app.js')` exit 0. The 243 -> 242 decrement was chased
rather than waved through - it is one deliberately deleted assertion folded into
another test, not a dropped suite.

LANDED `d925bd2`, rebased off `6f1b476` and ff-merged onto `ai-connector-wave`,
pushed. **Wave is 7/7 and at its HARD STOP for Seth's smoke.** No gate, no
`/code-review`, no branch diff reading until he signs off.

**What AI7 does NOT prove, recorded because it is the whole point of the unit:**
nothing in the delivery shows the connector handshake now COMPLETES. Every lane
is pure-function; the module-graph check only proves boot. AI7 removes the one
cause identified from the August 6 live failure and cannot show there is no
second cause behind it. A successful Part B smoke is the FIRST real evidence,
not a confirmation of something already established.

## ARCHIVED August 5, 2026 (forty-fourth session) - the /doctor pass's EXACT
## CUTS for workflow-backlog item 4, moved VERBATIM from HANDOFF at the AI-wave
## rewrite. The backlog ITEM is still open and still summarised in HANDOFF;
## only this line-level scoping moved here. Read it before doing item 4.

   *Scoped August 5 by a `/doctor` pass (read-only; nothing applied - the
   AI-wave was mid-flight at 3/5). Exact cuts, ~750 est. tokens/session:*

   - **CLAUDE.md 25-38** - the dated amendment chronology ("Decided July 3,
     2026 (v3...); amended July 6... July 14... July 20 (v5.3...)"). Move
     VERBATIM to `docs/specs/autonomous-cursor-dispatch.md`; leave `Three
     roles:` plus a one-line pointer. ~225 est. tokens. Lines 17-23 (the
     seat-naming block) STAY - that is a live instruction, not history.
   - **CLAUDE.md 90-113 + 121-128** - relay steps 1-5 and 7 each restate a
     skill that already carries the ritual at full fidelity
     (`author-task-block`, `dispatch-unit`, `land-unit`, `pre-main-review`).
     Compress to one-line pointers, ~33 lines -> ~8. ~375 est. tokens.
     **Step 6 stays resident verbatim** - the wave-end HARD STOP is an
     ordering constraint a session must know BEFORE it picks a skill; buried
     in a lazy-loaded skill, a session could gate before Seth's smoke.
     Lines 130-132 (HANDOFF/ARCHIVE channel split) also stay.
   - **AGENTS.md 32-37, 41-45, 55, 59** - derivable from the repo itself:
     the framework list (`package.json` says React+Vite/Express/Prisma 6;
     the repo name is in `git remote`), the standard `npm install -> npm run
     dev` recipe, the `npm run build` line, and two pure-location Structure
     entries (`client/src/components`, `server/`). ~150 est. tokens. KEEP the
     hosting targets, "SEPARATE prod and staging projects", the
     `prisma.config.ts, not package.json` note, `npm run dev:mobile`, and the
     whole test-lanes block (46-54) - gotchas, not derivable.

   Same doctor pass found the rest of the setup clean: install, version
   (2.1.222 = latest), auto mode already default, no hooks, no unused
   skills/plugins/MCP servers, and no allow-rule gaps. Its only other action
   was deleting two auto-memory entries that duplicated these files
   (`cursor-relay-v52-workflow`, `fable-withheld-opus-executes`).

---
## ARCHIVED August 5, 2026 (forty-fourth session) - three CLOSED sections moved
## VERBATIM from HANDOFF when it exceeded its cap at the end of the AI-wave:
## the August 4 prod-deploy incident, the WorkOS staging-dashboard record, and
## the August 5 relay-tooling changes. All three are done; nothing in them is
## outstanding. The AI4 "three findings" section is NOT here - findings 2 and 3
## are still open and stayed in HANDOFF.

### INCIDENT, August 4 — prod Render was building from the wave branch

**Closed, no data impact, but the mechanism is worth remembering.** Prod Render
`workout-db-l3gc` was pointed at `ai-connector-wave` instead of `main`, so the
AI1 push auto-deployed unreviewed, ungated server code straight to production.
Caught by probing both services rather than by reading docs: prod answered
`GET /ai/consent` with **401** (route mounted) while 404ing `/ai/nonsense`, and
`git branch -r --contains 83d82c8` returned only `origin/ai-connector-wave` —
`main` had no `/ai` mount at all. Seth repointed prod back to `main` and moved
staging onto the wave branch; both re-verified from ground truth afterwards
(prod `/ai/consent` -> 404, staging -> 401, both `/health` 200).

**No data was at risk** — the migration had not run anywhere, AI1 added no code
to any existing route, and prod's client had no link to the page. **The durable
lesson: HANDOFF's deploy topology is a CLAIM, not ground truth.** The relay
pushed three times on the assumption "this branch is staging-side" because the
doc said so. Probe the actual services before the first push of any wave that
carries server code — a 401-vs-404 diff across two hosts costs one command and
settles it.

### AI4 / WorkOS — staging dashboard RESOLVED August 4

Driven in-browser this session. Staging environment of project "Cool's
Project". **Checklist steps 1, 2, 3, 5, 6, 7, 8 are DONE** — CIMD and DCR both
Enabled, resource indicator added and marked Default, sign-in URI set.

- `WORKOS_CLIENT_ID=client_01KZ7E8C99MTQQQ4RC6GEH4DQ2`
- `MCP_AUTHORIZATION_SERVER=https://scientific-mist-64-staging.authkit.app`
- `MCP_RESOURCE_URL=https://workout-db-staging.onrender.com/mcp`
- sign-in URI `https://workout-db-staging.onrender.com/ai/connector/login`
- `WORKOS_API_KEY` — `sk_test_...1eFc`, NOT retrieved by any agent; Seth
  reveals and pastes it himself.

**Only step 9 remains** — the four vars on the `workout-db-staging` Render
service. Step 10 (production) is untouched and deliberate; nothing copies
across environments.

**Two corrections the block itself does NOT yet carry.** (1) Step 4, "create an
OAuth application", is UNNECESSARY — with DCR/CIMD enabled, MCP clients register
themselves; the Applications list is for clients you manage, which Claude is
not. The create dialog forces a consent-model and a PKCE choice, so it was
backed out of rather than guessed at. (2) The dashboard calls the Login URI
**"External Sign-in URI"** — Connect -> Configuration. Full hand-off detail for
whoever finishes this: **`docs/specs/workos-staging-handoff.md`** (`d814cec`) —
preserved VERBATIM into the repo from a session scratchpad, because the original
reference was to a temp directory that would not have survived. Read its section
0 before touching anything: `WORKOS_API_KEY` is never handled by an agent.

## Relay tooling — August 5 (workflow session, no product code)

Two changes, both mid-wave-safe. AI4/AI5 stay QUEUED and nothing about how a
block is authored, dispatched, or landed moved.

1. **Gate item 3 split** (`AGENTS.md`). Staging migrations are agent-run behind
   the verbatim trigger phrase **"migrate staging"**, one command at a time with
   approval before each, `prisma migrate status` reported after. Prod migrations
   are unchanged: Seth runs them, item 2 stacks on top, an agent may only print
   the sequence. The ordering invariant (DB before dependent code deploys) is
   now stated once, in item 3, and the duplicate paragraph lower in AGENTS.md
   points at it. `dispatch-unit` section 4 was corrected to match — a
   migration-carrying block IS dispatchable, because the block only ever has
   Cursor WRITE the migration; a lane still never runs `prisma migrate`.
   Rationale: the original any-environment rule was written defensively around a
   weaker non-Anthropic model, and `dbHostGuard.assertSafeForBoot()` already
   makes staging's blast radius mechanical rather than procedural.

2. **`scripts/cursor-watch.mjs` is now the whole relay's dashboard**, not one
   lane's. It watches every existing lane in the v5.2 pool (`cursor-lane`, `-2`,
   `-3`) from ONE server on one port, so fan-out no longer means three tabs —
   the auto-open and notify controllers moved onto a shared hub and are consumed
   once, by whichever lane stirs first. It also parses `docs/tasks/QUEUE.md` for
   the live wave rail (the contiguous leading run of same-prefix units in
   `## Active`, which is what keeps the AI-wave at five instead of swallowing
   the F-wave below it) and renders n/N. `--lane` now repeats to pin an explicit
   set; omitted, it auto-discovers. The Startup shortcut needs no change — it
   already passes `--open-on-activity --notify` and now covers all three lanes.
   Verified live: three lanes discovered, wave parsed `AI-wave 3/5`,
   `AI1..AI3 LANDED / AI4 AI5 QUEUED`.

---

## ARCHIVED August 4, 2026 (forty-second session) - the F-wave MERGE RECORD,
## moved VERBATIM from HANDOFF when it exceeded its cap during the AI-wave.
## The wave is CLOSED and merged to main as 59e27dc. Its PROD SMOKE checklist
## was left live in HANDOFF because that pass is still outstanding.

## The F-wave (effort MANDATORY) — GATED and MERGED to `main`

**Merged August 4 as a clean fast-forward, `8541bca..59e27dc`** (14 commits).
Smoked by Seth on staging, then gated. **No schema change or migration anywhere
in it**; F1/F2/F3 are client-only, but F0 IS a `server/` change and is the first
server code to reach prod in a while — prod smoke is open.

- **F0** `00e06d9` — a template's stored effort signal now reaches the live
  session (six server selects + a one-time client seed).
- **F1** `3da8bf5` — either-or signal control (`rir | rpe | null`) plus
  `effortSignalPref.js`, wired to all five call sites.
- **F2** `bfa010a` — legacy both-false templates get a REQUIRED CHOICE on open;
  Save blocked until the user picks; loading one writes nothing.
- **F3** `0ee258b` — live session either-or control, signal locks after the
  first effort value, Finish blocked while a core-logged set is missing it.

- **Gate fix** `59e27dc` — the one finding, authored in-seat.

**What the gate caught, and why per-unit review could not.** F1 made the
device effort-signal pref writable from four template screens; F3's lock is
signal-AGNOSTIC (any non-blank `rir` OR `rpe` locks the control) while its
mandate counts only the ACTIVE signal. The live signal is re-seeded on every
remount from OUTSIDE the session — device pref for quick logs, template
booleans for template sessions. So changing the pref or the template mid-workout
re-seeded an in-progress session onto a signal its sets had no values for: the
control locked (a set carried effort), Finish blocked demanding the other
signal, and no way back, since the locked control is `pointer-events: none`.
Exactly the mid-workout dead end F3's own enforcement boundary forbids. **Each
unit met its contract exactly — the defect existed only where two units met.**
Both seed branches now prefer the currency already logged on the session's sets.
**Invariant: a session is never seeded onto a signal it has no values for.**

**Residual, accepted not fixed:** a legacy in-progress session holding MIXED
`rir` and `rpe` on different sets seeds to RIR, so its rpe-only sets ask for a
RIR value before Finish. Actionable (the field is visible on every set) and the
honest reading of the one-currency mandate. Do not "fix" it into a per-set
exception.

**Merged WITHOUT a re-smoke of the gate fix, by Seth's August 4 ruling** — the
change is state-seeding only, no markup or CSS, so there is no visual surface
smoke could have checked. All eight seed cases were walked by reading. If a
mid-workout Finish-block report ever arrives, start here.

**The durable lesson of this wave: the recurring failure was AUTHORING, not
execution — three times, in the same shape.** F0's block named
`FULL_SESSION_RELATIONS`, one of the TWO locations recon had found, so the fix
landed where it could never fire. F2's block named the required-choice prompt
but not `RirRpeToggleRow`'s built-in null-state nudge — one of the TWO things
that render that state — so the same sentence shipped twice on one screen. The
gate finding is the third: F3's block specified the lock without enumerating
what could re-seed the signal underneath it. **Generalized rule: when a contract
touches a state, it must enumerate everything already acting on that state, or
say why not** — and at wave scale, everything that can WRITE that state from
another screen.

---

## ARCHIVED August 4, 2026 - the F-wave RULINGS section, moved VERBATIM from
## HANDOFF when it exceeded its cap after the merge. The wave is CLOSED, merged
## to main as 59e27dc. These are the rulings the four units were built from;
## the merge record and the gate finding stay live in HANDOFF.

## The F-wave rulings — the WHY behind the four landed units

Kept because the gate and any future effort work need the reasoning, not just
the diff. All four units are LANDED (see the section at the top); nothing here
is outstanding. Seth's August 1 rulings, from the E-wave smoke, which superseded
the "someday" framing of the mandate:

1. **RIR and RPE are EITHER-OR, never both.** Two independent toggles is
   the wrong model — one effort signal per template/session, RIR default.
2. **Mandatory lands in the SAME wave as either-or.** He was offered a
   3-state `RIR | RPE | Off` interim and explicitly chose `RIR | RPE`
   with no Off state.
3. **Capture preference must be REMEMBERED, device-local.** Extend the
   existing `quickWorkoutLogPrefs.js` localStorage pattern (same
   precedent as `weightUnitPref.js`) to template creation and block
   templates. Explicitly NOT an account-level column — no schema change,
   no migration.

**The conflict this creates, and the agreed resolution.** With no Off
state, an existing template storing both toggles `false` (no backfill
ever ran, so these exist) renders a control with nothing selected. The
two naive exits are both wrong: auto-selecting RIR silently rewrites a
stored user choice — exactly what E-wave smoke item 5 existed to catch —
and keeping an implicit off-state is the 3-state option in disguise.
Resolution put to Seth and not contested:

- **New templates, block templates, quick logs:** hard 2-state, one
  signal always selected, RIR default, remembered from prefs. No Off.
- **Legacy templates with both off:** a one-time REQUIRED CHOICE on open.
  Nothing is written until the user picks. E2's copy is not deleted — it
  is repurposed from a quiet hint into that prompt, which also satisfies
  the standing "the mandate ships WITH user education" requirement.
- **Enforcement:** block session completion when a captured-effort set
  has no value. Already-completed historical sessions untouched.

**Where the pref gap actually is** (verified August 1, not assumed):
preference memory exists for QUICK LOGS ONLY. `quickWorkoutLogPrefs.js`
persists `useRIR`/`useRPE`/`useExerciseNotes`, restored at
`SessionDetailPage.jsx:2199-2206`. Template creation ignores it entirely
(`CreateTemplatePage.jsx:46-47` hardcodes `useState(true)`/
`useState(false)`; block equivalents the same), and template-driven live
sessions take the template's stored booleans via the
`session.workoutTemplate` branch at `SessionDetailPage.jsx:2190-2196` and
never consult prefs. Net effect: an RPE user is handed RIR-on/RPE-off on
every new template, forever. Weight unit DOES already persist
device-local (`weightUnitPref.js`, defaults lbs) — if it appears to
forget, that is a SEPARATE bug and needs a repro.

**AUTHORED AND SHIPPED** as F0-F3 (August 2-3). The estimate of ~3 units was
one short: F0 was added when authoring recon found the stored signal never
reached the live session at all, which would have made F3 enforce a field the
session never showed.

---

## ARCHIVED August 3, 2026 - the E-wave section, moved VERBATIM from HANDOFF
## when it exceeded its cap. The wave is CLOSED, merged to main as d272930.

## The E-wave — CLOSED. 4/4 landed, smoked, gated, MERGED to main.

**Merged August 2 as a clean fast-forward, `7d1c9ba..d272930`**, verified on
`origin/main` by SHA (`origin/main` == `origin/effort-wave` == `d272930`). No
merge commit. Branched off `main` `90248f9`. Client-only throughout — five
client files, no server code, no schema change, no migration, so the merge
carried no DB work and the manual migration track was never engaged.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.
- **E3** `19c2c20` (August 2) — the "why we ask for effort" rationale as a
  `HowCalculatedButton` on the Analytics Data-quality coverage row.
- **E4** `965b2c8` (August 2) — the same rationale, one short sentence, ALWAYS
  VISIBLE under the coverage meter. The `(?)` stays and keeps the long copy.

**Smoke sign-off: Seth, August 1 — covers E1/E2 ONLY.** He raised three
findings; all three were classified as next-wave scope, none an E1/E2
contract failure (see the F-wave section). He then explicitly chose to gate
and merge the wave as-is rather than hold or revert E2. **E3 and E4 postdate
that sign-off and are NOT covered by it.**

**Pre-main gate: PASSED August 1, but only through `1a585ed`.** Lanes were
re-run fresh on the branch — 204 unit tests / 15 suites green, client build
clean, `check-hex.mjs` exit 0. Each commit touched exactly the files its
block named (E1 two, E2 two); `schema.prisma` absent from the diff as
contracted; no scope leakage; no security/auth/cross-user surface.

**Scoped gate on the delta: PASSED August 2** (Opus frontier seat), covering
`1a585ed..8b34138` — E3, E4, and the docs/spec/queue commits between them. Seth
smoked E3+E4 and signed off first, in order. Lanes re-run fresh on the branch:
204 unit tests / 15 suites green, client build clean, `check-hex.mjs` exit 0.
The delta's only code file is `AnalyticsPage.jsx` (E1/E2's files are untouched
by it, so their August 1 PASS still stands); zero server, schema, or migration
files anywhere in the wave; no scope leakage. Both blocks' contracts met
verbatim, including E4's grid-SIBLING placement constraint and the
byte-identical `effortCoverage === null` branch.

**The one cross-unit seam was checked directly, not assumed.** E2 modified the
SHARED `RirRpeToggleRow`, whose nudge keys off prop ABSENCE (`!useRIR &&
!useRPE`) — so call sites no block ever named could render it spuriously with a
green build. Both untouched sites (`EditTemplatePage.jsx:198`,
`EditBlockTemplatePage.jsx:313`) pass `useRIR`/`useRPE` explicitly. Seam clean.

**Merge mechanics, verified:** `main` is an ancestor of `effort-wave`, so the
merge is a clean fast-forward with no divergence to reconcile.

### E3/E4 — the effort rationale, and why it took two units

Both touch only `client/src/pages/AnalyticsPage.jsx`. E3 filed the rationale
behind the Data-quality `(?)`; E4 added the always-visible one-liner under the
coverage meter when smoke found E3 invisible. Both live in the
`effortCoverage !== null` branch only — a user at 0% coverage renders that row
and IS the intended reader, while `null` means no attributed sets at all.
Deliberately NOT mid-workout: an explainer bolted to a mandatory field signals
the field is an imposition. Full rationale in HANDOFF-ARCHIVE.

The copy reuses E2's smoke-approved line, which is load-bearing for the
F-wave: E2's nudge fires on `!useRIR && !useRPE`, impossible once one signal
is always selected, so that copy would otherwise have become dead code.

**Gate note, August 2 — copy drift, for whoever authors the F-wave.** "Reuses"
above is generous: the "two sets of 10" sentence now ships in THREE hand-varied
forms — E2's nudge (`RirRpeToggleRow.jsx:22`, colon, "taken to the limit",
"RIR is how"), E3's `HOW_EFFORT_MATTERS` (hyphen, "taken to the limit", "RIR
(or RPE) is how"), and E4's `EFFORT_RATIONALE_SHORT` (hyphen, "at the limit",
"Effort is how"). Each is defensible alone and none is a defect, so this did
NOT block the gate. But the F-wave plans to repurpose E2's copy into the
legacy required-choice prompt, which would make a FOURTH variant. Pick one
canonical wording and a single shared constant at that point instead of
authoring another — three near-identical strings drifting independently is how
product voice erodes, and the F-wave is the natural moment to consolidate.

# HANDOFF ARCHIVE — session-log history (append-only)

E3/E4 detail excerpt (August 2, 2026, THIRTY-SEVENTH session - Opus).
Moved out of HANDOFF verbatim the same session for the cap; the condensed
version stays in HANDOFF. Written at the time:

### E3 — what landed and why it is where it is

One file (`client/src/pages/AnalyticsPage.jsx`), 4 insertions. Adds a
`HOW_EFFORT_MATTERS` copy constant beside the existing `HOW_*` constants and
renders the already-imported `HowCalculatedButton` on the coverage row in
`DataQualitySection`.

Placement rationale, so it is not "improved" later by accident: the page
already explained what each metric COSTS without effort
(`HOW_STIMULATING_SETS`) and `MetricInfoButton` already DEFINES RIR/RPE at
logging time. The missing layer was the conceptual why, and it belongs where
the user reads their own coverage number — not mid-workout, where an
explainer on a mandatory field signals that the field is an imposition.
Deliberately scoped to the `effortCoverage !== null` branch: a user at 0%
coverage still renders that row and IS the intended reader, while `null`
means no attributed sets at all and has nothing to explain.

The copy reuses E2's smoke-approved line. That is load-bearing for the
F-wave: E2's nudge fires on `!useRIR && !useRPE`, which becomes impossible
once the F-wave makes one signal always selected, so the copy would
otherwise have become dead code.

**Why E4 exists, recorded as a process finding.** E3 met every acceptance
criterion in its block - button renders, correct branch, copy verbatim, no
CSS, lanes green - and still failed its purpose: Seth looked at the page and
saw nothing. Machine-checkable criteria can assert that an element EXISTS;
they structurally cannot assert that a human NOTICES it. That gap is what the
smoke pass is for, and it worked. Do not "fix" this by writing vaguer
criteria - fix it by remembering that discoverability is a smoke question.
E4's placement trap is the companion lesson: `.coverage-row` is a two-column
grid, so the new line had to be a SIBLING of it. As a child it would have
rendered squeezed into the narrow first column, with a green build.

---

Gate-detail excerpt (August 1, 2026, THIRTY-SIXTH session - Opus pre-main
gate on E1/E2). Moved out of HANDOFF verbatim August 2 when E3 landed and the
file exceeded its cap; the E1/E2 gate PASS itself still stands and is
summarized in HANDOFF. Written at the time:

Three things the gate verified DIRECTLY rather than trusting the reports
— re-verify these if the code moves:

- `--color-muted` (`index.css:63`) resolves in all 8 palette x mode
  combos. It aliases `--color-text-secondary`, overridden only at
  `:root:12` and `html[data-theme="dark"]:94` — both root selectors, no
  palette block touches it. Had a palette overridden it on a descendant,
  the nudge would have computed to nothing in 6 of 8 combos.
- All five `RirRpeToggleRow` call sites pass BOTH `useRIR` and `useRPE`
  explicitly. The nudge keys on ABSENCE (`!useRIR && !useRPE`), so one
  omitted prop renders it on a template that IS capturing effort.
- Neither edit page can flash the nudge pre-hydration —
  `EditTemplatePage.jsx:110` and `EditBlockTemplatePage.jsx:220` both
  early-return on `loading`, so the toggle row never mounts against the
  `useState(false)` initial values.

**Gate process note, recorded as a deliberate call:** the diff was read
in-seat rather than fanned out to Cursor report lanes. 37 lines across 4
files — fan-out exists to move grunt SEARCH off the frontier seat and
there was no search here. Not a skipped step; do not read it as
precedent for larger waves.

**Hard constraints held:** no schema change, no migration, no backfill.
The Prisma `useRIR Boolean @default(false)` is untouched; existing
templates keep their stored values and are nudged, never silently
rewritten.

---

Session log (July 29, 2026, THIRTY-FIFTH session (resident relay — E-wave
CODE-COMPLETE 2/2, awaiting Seth's smoke sign-off). Written at the time:

Branch **`effort-wave`** at **`3eadc64`**, pushed (`origin/effort-wave`
confirmed). Branched off `main` `90248f9`. Client-only; no server code,
no schema change, no migration.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.

Both dispatched CONCURRENTLY (lanes 1 and 2, Channel B auto rung) and
landed serially through one reviewer. The frontier seat's "preferred E1
then E2" turned out to be a readability preference, not a dependency:
E2's acceptance criteria are all prop-driven on `RirRpeToggleRow` and
never read E1's defaults. Cost of the parallelism was one extra rebase.

**Session log — what the audit found beyond the reports:**

- **E1 carried one real gap, declared but unfixed.** `resetFlow()` — the
  **Back** button on both create forms (`CreateTemplatePage.jsx:299`,
  `:420`) — still reset `useRIR`/`blockUseRIR` to `false`, so the next
  "first render" would have contradicted the new default. Cursor flagged
  it as a residual and left it, reading the block's named line numbers as
  the scope boundary. Fixed directly (trivia tier, diagnosis was the
  whole job): both flipped to `true`, lanes re-run green after.
- **E2 was clean** — no deviations declared, none found. Copy verified
  character-by-character against the block's verbatim spec.
- Two build-invisible risks checked by hand on E2, both clear: the new
  `var(--color-muted)` genuinely resolves (`index.css:63`, an alias of
  `--color-text-secondary`, so all 8 palette/mode combos inherit it), and
  all five `RirRpeToggleRow` call sites pass BOTH `useRIR` and `useRPE`
  explicitly — the nudge keys on absence, so an omitted prop would have
  rendered it spuriously.
- E2's lanes were re-run after rebasing onto E1, i.e. against the
  combined wave state rather than the delivered state.
- **Lane hygiene:** all three lanes were stale on FP-wave branches as
  warned. Lane 1 also carried a zero-byte `index.lock` about five hours
  old with no git process behind it (OneDrive lag) — cleared before
  checkout. Stale FP `DELIVERY.md` files were deleted from both lanes
  first, per the gitignored-report staleness trap.

**Why this wave is only 2 units.** The effort stack is ALREADY BUILT end
to end: `rir`/`rpe` on `WorkoutSet`, `deriveEffortRir()`
(`server/src/analytics/effort.js`), `meta.effortCoverage`
(`summary.js:143`), the coverage meter (`AnalyticsPage.jsx:600-607`), the
sub-60% note (`WeeklyReport.jsx:164`), and the adaptive volume headline
via `EFFORT_COVERAGE_HEADLINE_THRESHOLD` (`StatTiles.jsx:16`). A planned
third unit (coverage honesty surface) and most of a fourth (education
copy) were DROPPED as already implemented. **Do not re-author them.**
The only real gap was that capture defaults OFF
(`SessionDetailPage.jsx:2205`, `CreateTemplatePage.jsx:46-47`, `:493-494`).

---

Session log (July 29, 2026, THIRTY-FOURTH session (Opus frontier seat —
AI-layer planning pass from Seth's chatbot brainstorm; two specs
authored, `analytics-engine.md` section 8 amended, E-wave opened with
E1/E2 QUEUED on branch `effort-wave` `b214247`, pushed. Nothing
dispatched). Written at the time:

**The brainstorm.** Seth proposed an AI chatbot to personalize LogChamp,
with three sub-ideas: BYO API key, connecting an LLM subscription the
user already pays for, and a hosted paid tier whose edge includes
AI-customized frontend theming. He also asked whether his `.mil` access
could supply free tokens. Research changed two premises:

1. **`.mil` credentials: permanently out.** GenAI.mil (launched Dec 9,
   2025; Gemini/Grok/ChatGPT to ~3M DoD users), NIPRGPT, CamoGPT, and
   Ask Sage's CDAO contract are all real, and Ask Sage exposes an API.
   But 5 CFR 2635.704 limits government property to authorized purposes
   and de minimis personal use does not cover commercial activity; the
   credentials are unit-furnished; civilian users' workout data would
   transit a government enclave. Ruled out entirely, recorded in
   `ai-layer.md` section 3. Do not revisit.
2. **Consumer-subscription OAuth in third-party apps is a ToS
   violation**, not merely unavailable — Anthropic began blocking it
   Jan 2026, clarified the docs Feb 19, 2026, and the later partial
   reinstatement meters third-party calls against a separate prepaid
   balance. The original section 8 correction was right and now has
   teeth. **The unlock is to invert the direction:** remote MCP
   connectors (OAuth 2.1) are supported on Claude Pro/Max/Team/
   Enterprise and ChatGPT Plus/Pro, so the user adds LogChamp inside the
   app they already pay for and their subscription funds inference. That
   became Lane A and the first thing to build.

**Seth's four decisions this session:** both surfaces with connector
first; free at launch with the entitlement gate designed in; effort
logging BEFORE the AI work; theming spec'd now, built later.

**Scope finding that halved the E-wave.** Recon found the effort stack
already built end to end — `rir`/`rpe` on `WorkoutSet`,
`deriveEffortRir()` (`server/src/analytics/effort.js`),
`meta.effortCoverage` (`summary.js:143`), the coverage meter
(`AnalyticsPage.jsx:600-607`), the sub-60% note (`WeeklyReport.jsx:164`),
and the adaptive volume headline via
`EFFORT_COVERAGE_HEADLINE_THRESHOLD` (`StatTiles.jsx:16`). A planned
third unit (coverage honesty surface) and most of a fourth (education
copy) were DROPPED as already implemented rather than authored. The only
real gap was that capture DEFAULTS OFF
(`SessionDetailPage.jsx:2205`, `CreateTemplatePage.jsx:46-47`, `:493-494`).

**Correction recorded in `ai-theming.md` section 4:** `check-hex.mjs`
cannot gate AI-generated palettes — it scans a git diff
(`check-hex.mjs:23`), so runtime-generated output never passes through
it. It stays the right tripwire for the feature's own authored code. A
separate pure validator is specified instead (shape, hex-only, cascade
parity, contrast vs the FIXED text tokens, surface separation).

**Branch choice:** committed to `effort-wave`, not `main` — prod Vercel
and Render both track `main`, so a docs push there would have been a
prod-bound push (gate item 2).

**Verbatim record of the FP wave's smoke checklist**, moved here from
HANDOFF when the FP wave closed. Seth signed off July 21 ("smoke test is
passed, this looks much better"); no findings were left open. Preserved
as the record of what was verified and as gate-fuel reference:

> ## WAVE SMOKE — SETH SIGNED OFF July 21
>
> Tested against the **staging Vercel deploy** (never local dev) on
> branch `frontier-parity-wave`. Staging Render tracked this branch too
> (Seth repointed it before smoking), so server-side fixes (FP9) were
> live there for the first time this wave.
>
> **New this round (FP9-FP11, the fixes for the July 20 smoke
> findings):**
> - Exercises detail -> Personal records: the e1RM row reads as an
>   estimate with its source set shown as provenance (e.g.
>   "~267 lbs (from 160 lbs x 20)"), never as a performed set.
> - Log a high-rep set (13+ reps) on an exercise whose real best is a
>   lower-rep set: Working weight targets and the e1RM-derived numbers
>   should NOT be inflated by the high-rep set.
> - An exercise trained ONLY above 12 reps: e1RM / rep targets should
>   show the existing "not enough data" unlock copy, not an error or a
>   blank.
> - Home weekly report band: a week with 2+ PRs on the SAME exercise
>   names it once, with achievements grouped under it (reusing the PR
>   chip from completed-set rows). 5+ PRs in a week shows 3 plus a quiet
>   "+N more". The four digest lines (PRs/Movers/Execution/Note) should
>   read as a ranked list, not four identical grey paragraphs.
> - Exercises detail -> Top sets: five DISTINCT sets, no repeats (a set
>   you hit 3 times should occupy one slot, not three) — open the
>   browser console and confirm no duplicate-key warning.
> - Exercises detail -> Working weight targets: should read as one curve
>   (a ladder/bar visualization), not a bare two-column table. Muted
>   out-of-range rows + footnote should still be there.
> - Exercises detail -> Personal records: Weight/e1RM/Reps rows should
>   each be visually distinguishable by kind (badges), with the e1RM row
>   staying visually distinct as an estimate.
>
> **Carried forward from earlier in the wave:**
> - Tab title and HelloPage read "LogChamp"; save-to-home-screen line
>   correct; never-gate-history guarantee line renders.
> - Home's This-week strip: Workouts tile agrees with the Sets/Top-set
>   windows; recent workouts render as 3 vertical full-width rows.
> - Analytics > Strength: chart and table both sort noteworthy-first, a
>   muted "N exercises with a single session" toggle exists; Exercises
>   roster defaults to Active with All one tap away.
> - Analytics > Muscles with an empty range: 4 stepped ghost bars + the
>   "Log 3 workouts..." unlock line, nothing tappable.
> - Complete a session with a genuine PR: the set gets a small muted
>   "PR" chip; a different exercise sharing that weight/reps in the same
>   session does NOT get chipped; completed session pages load without
>   console errors.
> - Exercises detail -> Personal records: a Reps row appears ONLY when a
>   genuine reps-at-weight record exists — never a warmup set, never
>   dated to the exercise's first session.

Session log (July 28, 2026, THIRTY-THIRD session (Opus frontier seat —
FP wave confirmed shipped in prod; workflow-debt items 1/3/4 from the
parked cross-pollination handoff absorbed). Seth closed all three open
items manually: prod deploy SHA verified and live on the merged wave;
staging Render repointed back to `main`; prod smoke passed ("main smoke
has passed, it works fine live"), no prod defects. **The
frontier-parity wave is fully shipped and verified in production;
nothing from it is outstanding.** Gate finding worth carrying (NON-
BLOCKING, no fix authored): the SessionDetailPage PR-chip window is the
session's full UTC calendar day, so two sessions on the SAME day could
cross-chip only if exercise identity + weight + reps coincide exactly
(vanishingly unlikely, and the set genuinely tied a record that day).
Revisit only if it ever surfaces in real use.

Session log (July 20-21, 2026, THIRTIETH session (Opus, FRONTIER SEAT)
and THIRTY-FIRST session (Sonnet resident) — Seth's smoke on the
27-unit wave surfaced one real engine defect (uncapped Epley e1RM) and
a presentation critique; FP9-FP11 authored, dispatched, and ALL THREE
LANDED (FP9 `a356e4a`, FP10 `6ddda4b`, FP11 `5ca24f4`); wave now awaits
Seth's re-smoke and the re-run pre-main gate). Verbatim, as written at
the time:

**Updated:** July 20, 2026, thirtieth session (Opus, FRONTIER SEAT —
**Seth's smoke came back with findings; the wave is NOT merging yet.
FP9-FP11 authored from three recon lanes; FP9 + FP10 DELIVERED and
AWAITING REVIEW; FP11 queued behind them**). Branch tip `267271c`,
pushed.

**SETH'S RULING, July 20 — the wave does NOT go to main yet:** "this is
not getting pushed to main, we will edit and improve upon this wave
before pushing to main." His smoke passed functionally ("things looked
good") but surfaced one real engine defect and a presentation critique.
So: **the July 20 pre-main gate verdict is now STALE** — it read a diff
that predates FPFIX1's final form and all of FP9-FP11. The gate MUST be
re-run after the new units land and Seth re-smokes. Do not treat the
earlier PASS WITH FIXES as live.

**FIVE QUESTIONS Opus left for the next session, ALL ANSWERED July 21
at the start of the thirty-first session** (AskUserQuestion, batched,
each with a recommendation): Q1 Render repoint — Seth had ALREADY
repointed staging Render to `frontier-parity-wave` himself. Q2 the
12-rep Epley window — keep 12 (recommendation accepted). Q3 FP10
eyeball-first vs land-then-smoke — land then smoke (recommendation
accepted). Q4 FP11 Top-sets dedupe direction — earliest date
(recommendation accepted, no change from the authored contract). Q5
the standing reps-record rule (heaviest-weight vs most-reps) — keep
heaviest-weight, no change.

**FP9 LANDED `a356e4a`** (thirty-first session, Sonnet resident).
Audited per `land-unit`: lane worktree `C:\dev\worktrees\cursor-lane`,
branch `cursor/fp9`, scope exact (4 files matching FILES TO TOUCH),
lanes re-run fresh (202/202 unit tests, client build clean, check-hex
clean), every acceptance criterion hand-verified against the diff
(`EPLEY_VALIDITY_MAX_REPS = 12` named constant with rationale comment;
`formatPRValue` gives `e1rmPR` its own branch rendering
`~267 lbs (from 160 lbs x 20)`; `weightPR`/`repsAtWeightPR` branches
untouched). No deviations. Lane rebased onto `b365914` then ff-merged,
pushed, origin HEAD confirmed.

**FP10 LANDED `6ddda4b`** (thirty-first session). Audited per
`land-unit`: lane worktree `C:\dev\worktrees\cursor-lane-2`, branch
`cursor/fp10`, scope exact (2 files), lanes re-run fresh (198/198 unit
tests unchanged, client build clean, check-hex clean),
`.session-set-pr-chip` confirmed reused not redefined (no new class
definition for it in the CSS diff), every empty/partial-state branch in
`DigestSection` verified preserved by reading the diff directly, `e1RM`
row confirmed to omit reps (`"e1RM 267 lbs"`, no `x <reps>` pairing). No
deviations. Lane rebased onto `9cc98f4` then ff-merged, pushed, origin
HEAD confirmed.

**FP11 LANDED `5ca24f4`** (thirty-first session), the wave's last code
unit. Dispatched via `dispatch-unit` to lane `C:\dev\worktrees\cursor-lane`
(reused from FP9, now free), branch `cursor/fp11`, Channel B named rung
(`--model opus`), launched DETACHED per the thirtieth session's
operational lesson (`Start-Process pwsh -WindowStyle Hidden` running a
generated `.ps1`) — completed clean this time, no reap. Audited per
`land-unit`: scope exact (4 files matching FILES TO TOUCH), lanes
re-run fresh (204/204 unit tests incl. two new dedupe fixtures, client
build clean, check-hex clean). Diff-verified: `dedupeTopSets` keys by
`` `${weight}:${reps}` ``, keeps the entry with the earliest
`performedAt`, preserves the existing weight-desc/reps-desc sort order
post-dedupe (the old third tiebreak on `performedAt` becomes moot once
duplicates are removed, so dropping it is not a behavior change); React
key at `ExercisesView.jsx` now includes reps as defense in depth; no
`card--live`, no raw colors outside `index.css`, all three
empty/unlock states (`Top sets`, rep-targets unlock, PR-card unlock)
confirmed present in the diff. No deviations. Lane rebased onto
`d9775c4` then ff-merged, pushed, origin HEAD confirmed.

**Wave task list used for the first time this session** (per
`dispatch-unit` section 2b-2): five tasks created (FP9/FP10/FP11, Seth
smoke sign-off, pre-main gate review), landings flipped to `completed`
in real time, smoke sign-off flipped to `in_progress` at wave end so
the terminal shows exactly one open item with the gate blocked behind
it.

**THE SMOKE FINDINGS (what this wave existed to fix), preserved for the
pre-main gate's reference:**

1. **e1RM was fabricating numbers — the serious one.** Seth logged one
set of `160 lbs x 20` on bench. `estimateOneRepMax`
(`server/src/analytics/setMetrics.js:7-16`) computed Epley
`weight * (1 + reps/30)` with NO rep bound (only Brzycki was guarded,
at its reps>=37 singularity), so that set produced e1RM 266.7 and
became the all-time best. It cascaded to FIVE surfaces: the
Personal-records e1RM row, the Home weekly PR line, the Home "TOP GAIN
+32 lbs estimated 1RM" tile, the e1RM history sparkline, and — worst —
the "Working weight targets" card, which INVERTED bestE1rm to
PRESCRIBE working loads. Arithmetic verified against his screenshot:
with bestE1rm 266.7 the card told him 227.5x5 when his real best five
was 220x5, ~3.5% inflated. Seth wondered about a lbs/kg bug — RULED OUT
conclusively (stored weights are unit-agnostic and never converted,
`client/src/lib/weightUnitPref.js:3-7`; display helpers only append a
label). Separately, the Personal-records card rendered the estimate AS
A PERFORMED SET ("266.7 lbs x 20") because `formatPRValue`
(`ExercisesView.jsx:246-254`) routed `e1rmPR` through the same
`weight x reps` branch as `weightPR` — Home's PR line already handled
this correctly, so it was one formatter being wrong, not a systemic
pattern. **Both fixed by FP9.**

2. **"The UX isn't very pleasing and it's quite plain."** Seth's words,
about the Home PR line, Working weight targets, and Top sets. His
brief: "find something in between too much and too simple." Root cause
was uniform: the server ships fully STRUCTURED data and the client
flattened it into run-on sentences and undifferentiated lists. **Fixed
by FP10 (Home digest) and FP11 (exercise-detail cards).**

3. **Top sets had a real defect, not just plainness.** No dedupe at
`exerciseDetail.js:213-223` — three working sets of 220x5 took three of
the five slots — AND the React key `${performedAt}-${weight}`
(`ExercisesView.jsx:422`) omitted reps, so those rows DUPLICATED React
keys. **Fixed by FP11.**

**OPERATIONAL LESSONS FROM THE THIRTIETH SESSION (dispatch mechanism,
still load-bearing for future waves):**

1. **Background-task dispatch gets REAPED — launch detached instead.**
Three consecutive dispatches were KILLED mid-run. Diagnosis, with
evidence: the named `opus` rung answered a PONG probe in 10s (healthy —
NOT quota, NOT auth, so the fallback ladder was the wrong response);
short runs survived (recon lanes 2-3 min); and FP9 + FP10 both died at
~6 min simultaneously despite a 30s stagger — two independently started
tasks dying at one instant means an external reap of the harness's
background children, not per-task timeouts. **The fix is mechanism, not
rung:** launch via `Start-Process pwsh -WindowStyle Hidden` running a
small generated `.ps1` that sets `CURSOR_API_KEY`, cds to the lane, and
redirects `*>` to a log file. Detached from the task tree, units then
complete exit 0. Confirmed working again on FP11 the following session.

2. **`DELIVERY.md` IS GITIGNORED (`.gitignore:48`) — so
`git status --untracked-files=all` reports a lane CLEAN while it still
holds a stale report.** The thirtieth session read a two-day-old gate
report as if it were fresh recon and nearly fed it into contract
authoring; caught by mtime. **Check lane cleanliness by TIMESTAMP on
DELIVERY.md, not by git status.** This compounds the 29th session's
lesson (a report lane that invented line numbers) — that makes two
near-misses in two sessions from trusting report lanes without a cheap
spot-check.

3. **Partial work from a killed run is worth preserving, not
resuming.** Both killed lanes held real, largely CORRECT work (FP9's
core change was already contract-perfect). Saved as `PARTIAL-fp9.patch`
/ `PARTIAL-fp10.patch` in the scratchpad, then the lanes were RESET
rather than resumed — a half-finished run with no DELIVERY.md is
unverified by definition, and re-running from a dirty tree confuses the
agent.

4. **Recon fan-out earned its keep.** Three Cursor report lanes
(exec-blocks / ux-surfaces / e1rm-blast, `--model auto`, session-scoped,
reports NOT committed) produced the file:line evidence behind every
contract in this arc — including the block-execution finding Seth had
asked about directly, and the Top-sets duplicate-React-key defect
nobody had noticed. Reports preserved in the scratchpad as `RECON-*.md`.

---

Session log (July 20, 2026, TWENTY-NINTH session, Opus FRONTIER SEAT -
pre-main gate run out of order at Seth's explicit one-time override;
verdict PASS WITH FIXES; FPFIX1 authored/dispatched/landed f144fee same
session). Verbatim, as written at the time:

**Updated:** July 20, 2026, twenty-ninth session (Opus, FRONTIER SEAT —
**PRE-MAIN GATE RUN; verdict PASS WITH FIXES; the one required fix
FPFIX1 authored, dispatched, and LANDED `f144fee` same session**).
Branch tip `0392e85`, pushed. **Seth's smoke is STILL OWED and is the
only thing between this branch and the merge ritual.**

**ORDER EXCEPTION, one time only, recorded so it does not become a
pattern:** Seth explicitly overrode the wave-end order ("this is a one
time exception, run the review and i will smoke before pushing to main,
this will never happen again"). The gate therefore ran BEFORE smoke —
the inversion `pre-main-review` section 0 exists to prevent. The
standing order is unchanged for every future wave: N/N -> smoke -> gate
-> merge. The cost is live: FPFIX1 changed engine behavior AFTER the
gate read the diff, so the 00c checklist covers a wave the gate never
reviewed in its final form.

**Gate fuel fanned out to three CURSOR report lanes** (never Claude
subagents, per the standing rule); reports kept in the session
scratchpad, not committed. Verification lane (auto): 195/195, build
green, check-hex clean — trustworthy, real output. Doc/tokens sweep
(auto): high quality, tokens-only confirmed clean wave-wide, its doc
findings folded into this rewrite. **Coverage lane (sonnet): NOT
TRUSTWORTHY, do not cite it** — it returned 22/22 SATISFIED while citing
`EmptyStateGhosts.jsx:648-666` for a 91-line file and resting verdicts
on "no build-breaking changes detected in diff" instead of a run. Its
conclusions were discarded and the load-bearing criteria re-verified by
hand (they DO hold). **Lesson for future gates: a report lane's line
numbers are checkable cheaply — spot-check them before using its
verdicts.**

**The blocking finding (now FIXED, kept short here because the full
diagnosis lives in `docs/tasks/fpfix1-standing-pr-semantics.md` and
QUEUE.md).** FP5 had shipped TWO implementations of the same PR
vocabulary in `server/src/analytics/prs.js`: `detectPRs` (correct) and
`computeStandingPRs` (a parallel reimplementation that drifted — it
selected `repsAtWeightPR` by global max reps ignoring weight, and
dropped first-session suppression). Net user-visible effect, reproduced
by node-eval at the gate rather than inferred: the Exercises "Personal
records" card rendered **"Reps - 45 lb x 20"** — a warmup set, dated to
a first session. Per-unit review could not have caught it: 24 solid
`detectPRs` fixtures but ONE `computeStandingPRs` fixture that passes
under both the buggy and the correct logic. Green tests, false
confidence — exactly the second-implementation class the gate exists
for.

**FPFIX1 LANDED `f144fee`** (authored -> dispatched -> audited -> landed
same session; Channel B named rung `--model opus`, chosen over auto
because FP5's two prior deliveries both under-verified on this exact
file). The fix is STRUCTURAL: `computeStandingPRs` now folds
`repsAtWeightPR` down from `detectPRs`' event stream, so the two
surfaces cannot diverge again by construction and suppression is
inherited rather than half-tracked. `weightPR`/`e1rmPR` deliberately
keep all-time-best behavior including first-session sets.
`getPRsForSet` deleted (zero callers, a third definition).
**ONE REVIEWER FIX on top, undeclared by the delivery** (trivia tier,
direct-fix exception): removing the vestigial `isFirstSession` block
also removed the chronological sort, making `weightPR`/`e1rmPR` tie
resolution depend on caller input order — proved by node-eval (same sets
reversed gave Jan 15 / 4 reps vs Jan 22 / 6 reps). Sort restored,
determinism fixture added. Lanes after: **198/198, build green.**

**Gate findings folded in rather than left open:** the Repo/deploy
inventory had omitted FP6 and overstated "deploys nowhere" (the branch
is HALF-deployed) — both corrected below; HANDOFF was 414 lines against
its ~300 cap — this rewrite ages the twenty-eighth session out and
compresses closed issues 8/9 and the merged NT/A-wave bullets. It is
still OVER the cap (~390 vs ~300) even after that — the resume
instructions at the head of "Next up" cost lines deliberately. Trim it
properly next session; the U5, Analytics-track, and Issues sections are
the remaining fat.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 19 **twenty-eighth** session (Sonnet resident —
FP5 bounce-1 fix landed `9eb7e8d`, FP6 dispatched and landed `0805064`)
and everything older, unchanged. Grep the archive by session number or
SHA when provenance matters.

Previous entries (incl. the July 10 sixth session in full, the July 10
Fable N-wave skeleton session, the July 9 spec-complete session and the
July 8 A-wave prod rollout) archived verbatim in
`docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

**Updated:** July 19, 2026, twenty-eighth session (Sonnet resident —
**FP5 BOUNCE 1 FIX LANDED `9eb7e8d`; FP6 DISPATCHED AND LANDED
`0805064` same session — FP-WAVE CODE-COMPLETE except FP8**).
Continued from the twenty-seventh session's bounce; picked up the SAME
lane (`C:\dev\worktrees\cursor-lane`, branch `cursor/fp5-pr-detection`)
exactly as the handover specified, landed FP5, then dispatched and
landed FP6 (its gate, FP2+FP5, cleared) in the same lane on a fresh
branch, all in one resident session.

**Wave state: 6 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf`, FP5 `9eb7e8d`, FP6 `0805064`
(plus the FP0 report `137e0ea`). Branch `frontier-parity-wave`, all
pushed to origin, deploys nowhere (staging Render tracks `main`). Only
FP8 remains (DRAFT, blocked on Seth's icon PNGs) — the wave is
code-complete for everything else. **Next gate is the pre-main review
(Opus, per the standing fallback) + Seth's consolidated smoke, not
another dispatch.**

**FP5 re-dispatched on the bounce channel (named rung, `--model
opus`, same lane), then landed after a reviewer-driven live audit.**
Cursor's bounce-fix delivery threaded `setHasPR` through as a real
prop (F1) and re-keyed the chip match to include `exerciseName` (F2
partial); lanes came back fresh and green (195/195 in 15 suites, build
green, check-hex clean). But its OWN evidence for F1 repeated exactly
the mistake the bounce warned against — it claimed "Vite/esbuild catch
undefined variable references at bundle time" (false for plain JS
runtime errors) and punted the actual browser-drive/render-test proof
to Seth as "manual verification steps." Given this is a second
engagement on the same unit, the reviewer did not trust the writeup
and drove the completed view live instead of accepting it or bouncing
a third time: copied the main tree's staging `.env` into the lane's
`server/`, started server + client dev instances there
(`VITE_API_URL` pointed at the local server, not prod), registered a
throwaway test account, and built a two-session fixture via direct API
calls designed to hit exactly the F2 scenario (session A baseline —
Bench 135x5, Curl 200x5, completed; session B — Bench 145x5, a real
weight+e1RM PR, Curl 145x5 sharing that exact weight/reps but NOT a PR
for curl) and loaded session B's completed view in a real browser.
Found the delivery's F2 fix was still built on `exerciseName` alone,
not identity as the block explicitly asked — fixed directly (trivia
tier, not a third bounce): added a `prMatchKey(exerciseId,
userExerciseId, exerciseName)` helper keyed on `se.exerciseId`/
`se.userExerciseId` (confirmed present on the full session-exercise
row) matching `pr.identity` from `summary.js`'s `identityFromKey`, with
a name fallback. Then found a SECOND, undeclared defect only visible by
actually loading the page: the chip could never render at all, because
`setHasPR`'s date-scoping compared `session.performedAt` to each PR's
`performedAt` for EXACT millisecond equality — but `session.performedAt`
reflects the most recently written SET's timestamp, not any specific
PR set's, so the check was always false. Fixed by dropping it (also
trivia tier): the summary fetch's own `from`/`to` window already scopes
PRs to the session's calendar day, so no extra date check was needed.
Re-verified live after both fixes: exactly one PR chip rendered,
correctly attributed to Bench Press and NOT Bicep Curl, zero console
errors. Lanes re-run fresh once more post-fix (195/195, build green,
check-hex clean). Verification servers torn down, the copied `.env`
deleted from the lane afterward; only staging Neon
(`ep-bitter-breeze-am81izlh`) touched, never prod. Lane rebased onto
`d1cd3fb` then ff-merged `9eb7e8d`, pushed, origin HEAD confirmed. Full
narrative (including the kept engine-half audit from bounce 1) in
QUEUE.md's FP5 entry.

**FP6 (weekly digest) dispatched and landed clean same session, no
bounce** — the wave's last code unit, unblocked the moment FP5 landed
(gate was FP2+FP5 both LANDED). Named rung (`--model opus`), fresh lane
branch off the post-FP5 wave tip. Audited per land-unit: scope exact (2
files), lanes fresh (195/195, build green, check-hex clean), no
deviations. Given FP5's lesson that plausible-looking code can silently
never fire, the reviewer went a step further than the report and
verified the digest's data assumptions directly against the real server
shapes rather than trusting the node-eval examples alone: `execution`
array fields (`loadAdherence`/`volumeAdherence`/`effortDrift`) confirmed
exact-match against `planVsActual.js`, `meta.effortCoverage` confirmed
real against `summary.js`, and the empty-week guard confirmed
structurally unreachable-when-empty by reading the surrounding branch
logic (both-empty and nudge-only states both return before the digest
component is ever mounted). Rebased onto `ac9bc69` (routine 1-commit
divergence — the lane branched one docs commit before the FP6-dispatch
flip landed) then ff-merged `0805064`, pushed, origin HEAD confirmed.
Full narrative in QUEUE.md's FP6 entry.

**Standing question Seth raised, still NOT actioned (his call to take
to the frontier seat):** whether big/complicated waves should route
Cursor to frontier models. This session adds a second data point for that
conversation — FP5's bounce-fix delivery itself needed two more
reviewer-caught fixes even after landing on the named rung, both of
the "the block already said what to do, the delivery just didn't do
it or verify it" shape, same as the ambiguity pattern noted last
session. Facts already gathered (last session): `cursor-agent
--list-models` carries `claude-opus-4-8-thinking-high` and
`claude-fable-5-thinking-high` (both 1M, flagged **NO ZDR** on the
Fable variant); `dispatch-unit` passes bare aliases (`--model opus`)
rather than exact ids. Seth owns raising this; no docs changed for it.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 19 **twenty-seventh** session (Opus resident —
FP4 landed `d6180cf`, FP5 dispatched on the named rung and BOUNCED with
the F1/F2 findings recorded above) and everything older, unchanged from
prior rewrites. Grep the archive by session number or SHA when a
decision's provenance matters; the still-live conclusions are all
carried in QUEUE.md's per-unit records, the `-FINDINGS.md` files, and
the sections below.

---

July 19, 2026, twenty-seventh session (Opus resident — **FP4 LANDED
`d6180cf`; FP5 DISPATCHED on the named rung and BOUNCED on audit — NOT
landed**). This entry covers BOTH July 19 resident sessions; the first
one landed FP2 `056be0c` and FP3 `3de1749` (after one bounce) and
dispatched FP4, then stepped out with the run in flight, leaving a
relay-handover note in QUEUE. That handover worked as written: this
session picked the FP4 delivery straight out of the lane worktree and
landed it.

**Wave state: 4 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf` (plus the FP0 report
`137e0ea`). Branch `frontier-parity-wave`, all pushed to
origin, deploys nowhere (staging Render tracks `main`).

**FP4 (empty-state ghosts) LANDED `d6180cf`**, audited per land-unit:
lanes fresh in lane (unit 171/171, build green 130 modules, check-hex
clean), scope exact (5 files), every ghost verified aria-hidden +
pointer-events:none with zero interactive elements, CSS diff free of
animation/transition/@keyframes and of raw color, and every class and
token the ghosts lean on verified to pre-exist and behave
(`.analytics-unlock` :5654, `--chart-track` :5682, `.mv-track` IS
`position: relative` so the absolute ghost bar anchors,
`.balance-scale--ghost` :6397). Two declared deviations accepted: view
tabs now render on the page-empty branch (required — three of the four
per-view teases are otherwise unreachable without a URL edit), and the
exercises empty copy split into title + unlock around the ghost.

**FP5 (PR detection) BOUNCED — bounce 1, delivery left uncommitted in
the lane for the fix run.** First named-rung dispatch of the wave
(`--model opus`, no descent). The lanes came back GREEN and stayed
green when re-run fresh in the lane (unit 195/195 in 15 suites incl.
24 new `prs.js` fixtures, build green, check-hex clean, purity grep
clean) — **the bounce is not a lane failure, it is a defect the lanes
structurally cannot see.** The ENGINE HALF passed audit and is kept:
identity keying verified correct by direct read (`enrichSet.js:25`
synthesizes a `user:<id>` catalogEntry for custom exercises, so
`summary.js`'s helpers — copied verbatim from `exerciseDetail.js`'s
landed N5 pattern — cover catalog AND custom), and cross-user
isolation verified (the new all-time fetch reuses the pre-existing
userId-scoped `fetchAllTimeEnrichedSets`, `where: { userId }` on both
queries; no new query written). Two findings, both confined to
`SessionDetailPage.jsx`, written into the block as BOUNCE 1 FINDINGS:
**F1, BLOCKER and UNDECLARED** — `setHasPR` is a `const` inside the
`SessionDetailPage` component (:2036) but is CALLED inside the
top-level `SessionExerciseBlock` (:1709, :1738), which never receives
it (call sites :2914/:2979 pass no such prop), so every COMPLETED
session detail page throws `ReferenceError: setHasPR is not defined`;
live sessions survive only via the `isCompleted &&` short-circuit.
Invisible to both lanes (Vite does not resolve undefined identifiers,
there are no client render tests) while the report claimed the chip
worked — automatic bounce. **F2** — the chip matches PRs to rows by
`weight:reps` alone, so bench 135x5 (a real PR) and curl 135x5 (not)
both light up in the same session; the payload already carries
`identity` + `exerciseName`, so the match must key on exercise
identity. A false PR badge is a honesty-layer violation. Accepted and
explicitly NOT to be "fixed" in the bounce: the extra
`GET /analytics/summary` call on the completed view (the block
permitted extending the response already touched), and `getSummary`
now fetching all-time sets per request (inherent to the contract — PRs
need history beyond the range).

**Standing question Seth raised, deliberately NOT actioned here (his
call to take to a Fable agent):** whether big/complicated waves should
route Cursor to frontier models. Facts gathered for that conversation:
`cursor-agent --list-models` DOES carry the frontier tier —
`claude-opus-4-8-thinking-high` (1M, thinking) and
`claude-fable-5-thinking-high` (1M thinking, flagged **NO ZDR**) —
alongside the Codex/GPT-5.x ladder and Composer. Two observations
worth putting to Fable: (a) `dispatch-unit` passes bare aliases like
`--model opus` rather than exact ids, which resolved fine but is the
same class of papercut as the July 14 "CLI remembers the last model"
lesson; (b) the evidence so far says spend on AMBIGUITY, not size —
MW's deliberate all-auto descent landed 8/8, while this wave's two
bounces (FP3 chart-view partition, FP5's chip) were both places the
block left a judgment call open. Seth owns raising this; no docs were
changed for it.

Previous entry (July 17, twenty-fifth session, Fable — **PRE-MAIN
GATE PASSED + MW-WAVE MERGED TO MAIN `3b325db`**). Seth confirmed the
MW6+MW8 smoke PASSED and gave the trigger phrase; merge ran per the
RUNBOOK ritual one command at a time in a scratch worktree
(`C:\dev\worktrees\merge-main`, per the OneDrive lesson): ff-only
`c473e21..3b325db`, 35 commits, no merge commit, `origin/main` HEAD
verified `3b325db` post-push, worktree removed. NO migration —
code-only deploy. **Seth completed all three post-merge steps same
day: staging Render repointed to `main`, prod deploy SHA verified ==
`3b325db`, prod smoke PASSED (MW pass + the previously-owed NT items
incl. the What's New modal — the NT-wave verification trio is
retired).** `maintenance-wave` is now fully contained in `main` and
staging no longer points at it — a deletion candidate (gated). The wave that just shipped, for the record below: MW1-MW8 +
the CW dev-tooling arc + `a5294e3`. Gate details in the review record
that follows.

Gate record (same session, pre-merge):
Reviewed the full accumulated diff `c473e21..a5294e3` (34 commits:
MW1-MW8 + the CW dev-tooling arc + one post-wave direct fix) against
the blocks, QUEUE's per-unit audit records, and the archived session
logs per the gate ritual. Lanes re-run fresh AT THE GATE: unit 170/170
(14 suites), Vite build green, check-hex clean. Verified by direct
diff read: MW2's guard/identity un-nesting matches the July 16 ruling
exactly (`:531` guard counts `identityParse.provided`, identity arm
wins over name-derivation when both arrive — so the NTFIX2 client's
name+id PATCH is id-authoritative), MW3's reopen ladder is
ownership-correct (userId in the findFirst) with a completedAt-only
flip and completeSession's include shape, MW1's un-nest is
structurally sound (pill/summary are SIBLINGS of the toggle, the
stopPropagation removal is safe because no ancestor handler remains),
MW6's detector table + auto-pair guards (busyRef, sets.length,
setCountBusy, commit-vs-draft, override-false-wins) all hold and the
RIR keystroke gate makes the flush-path integer guards
belt-and-suspenders, MW7/MW8 are surgical, watcher script confirmed
NEVER imported by client or server (dev tooling stays out of runtime).
**`a5294e3` recorded:** an off-flow July 16 evening direct fix (ONE
confirm when deleting a filled L/R pair, no confirm on a blank pair,
singles keep the per-set confirm) — committed outside land-unit during
what was evidently Seth's MW6 smoke; now gate-reviewed directly,
clean, on origin. NO fix blocks needed, nothing bounced, no Cursor
busywork identified. (Both pre-merge conditions were then met same
session: Seth confirmed the MW6+MW8 smoke PASSED and said "push to
main" — see the merge record above.)
Flagged, not blocking: `docs/specs/cursor-token-savings-{stats.md,
data.json}` and `docs/parked/*` sit UNTRACKED since ~July 11-13
(side-project artifacts for the poor-man's-agentic-workflow repo) —
Seth to rule whether they belong in this repo's history or move out.


Previous entry (July 18, 2026, twenty-sixth session (Fable — **FP-WAVE
OPENED: FP0 frontier-parity report authored, dispatched, and LANDED
`137e0ea` in one session; NO implementation blocks yet by design**).
Seth's ask: make the direction calls on the July 17 product-review
findings and have Cursor produce a NOW/CHANGE report he can read
before anything ships. New branch `frontier-parity-wave` off
maintenance-wave HEAD `0206d30` (= main `3b325db` + two post-merge
docs commits). Fable made the calls (baked into
`docs/tasks/fp0-frontier-parity-report.md`, block `a5444b7`): retitle
to LogChamp; interim "LC" monogram PWA icons; ONE window + ONE data
source for the This-week strip; recent workouts go VERTICAL (3 rows,
full titles); empty analytics tease the wedge with static ghost
previews + honesty-voice unlock lines; tagline stays Seth's call
(3 alternatives presented); PR detection as a pure engine module with
quiet chips (no confetti); weekly digest extends the existing
WeeklyReport band; Strength Score flagged NEEDS FABLE DESIGN PASS
jointly with the queued per-side unit; never-gate-history verified
true and becomes product copy. FP0 dispatched Channel B auto rung,
landed same session per land-unit: lane porcelain-EMPTY (report-only
contract held), unit lane fresh 170/170, spot-checks by direct read —
the R3 diagnosis is REAL (Workouts tile counts by `completedAt` in
LOCAL bounds at WeeklyReport.jsx:31-44 while Sets/Top-set ride
/analytics/summary filtered by `performedAt` in UTC bounds — two
clocks, two sources in one strip). Full report preserved verbatim in
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md`; audit record in
QUEUE.md.

**Same session, phase 2 (after Seth's read):** Seth APPROVED the
critiques with riders — icons LAST (needs his intervention), and
everything Fable-gated must be set up for OPUS because **Fable is
unavailable after July 18**. He brought two new insights, both
designed same session: (1) his strength-view screenshot (in
claudefiledrop/) shows single-session/dormant exercises burying the
real trends — became FP3 (active-exercise lens: noteworthy-first sort,
single-session rows collapsed, Active|All roster lens, history never
hidden); (2) different-gym machine variance skews analytics (his
screenshot's "Single arm lat pulldown -52.5 lbs" is the live example)
— his location idea designed into `docs/specs/gym-context.md`
(one-shot opt-in location at session start, Gym entity + session tag,
ANNOTATE-never-adjust analytics + home-only filter; continuous
tracking rejected on PWA/privacy/battery grounds, criteria named in
the spec). The R9 design pass is DONE too:
`docs/specs/strength-score-per-side.md` (self-referenced score,
per-side comparison verdicts, imbalance headline; SS1-SS3 block plan).
**FP-WAVE SKELETON AUTHORED `4e09379`: FP1-FP6 QUEUED, FP8 DRAFT**
(order + serialization + the full Opus handover in QUEUE.md's FABLE
HANDOVER section). FP1 DISPATCHED same session (Channel B auto rung).
Open Seth items: R6 tagline pick; icon PNGs into claudefiledrop/ to
un-DRAFT FP8; G1's migration when the G-wave starts.

Previous entry (July 16, twenty-fourth session, Opus resident —
**MW-WAVE CODE-COMPLETE: MW6 `bfbbe56` + MW8 `52e84cf` dispatched and
LANDED, all 8 units in**). Both went over Channel B in the lane
worktree: MW6 (MODEL opus) on the auto rung as a DELIBERATE descent —
Seth's dispatch instruction restated the standing "run on auto, Opus
audits" call — MW8 (MODEL auto) on its own rung. Audits per
`land-unit`, lanes fresh in the lane both times (unit 170/170, Vite
build, check-hex), full diffs read. MW6: detector name table re-run
independently by node eval (13/13), single pair-creation path +
commit-vs-draft discipline + override-false-wins + completed-path
triple-guard + no-respawn all verified by direct read; no deviations;
one judged-accepted narrowing (bare `\bsingle\b` names like "Squat
(single)" no longer auto-trigger — the name table is the contract,
and `anySetHasSide` keeps existing sided data in per-side mode). MW8:
formatter verified byte-for-byte the `formatEffortValue` body, eval
re-run independently (8.5->"8.5", 8->"8", 10.25->"10.3"), null-reps
ternaries untouched at all 5 sites; one reviewer trivia fix (stray
blank line in StrengthTrendChart.jsx). Per-unit audit records in
QUEUE.md. **Remaining: Seth smokes MW6+MW8 on staging (checklist in
"Next up" 00 — MW1/2/3/7 already PASSED), then the pre-main gate
(Fable + Seth) closes the wave.**

Previous entry (July 16, twenty-third session, Fable — **RULINGS
INTERPRETED + LAST TWO WAVE UNITS AUTHORED: MW6 finalized and QUEUED,
MW8 (new) QUEUED**). Seth's MW4/MW5 answers (`docs/tasks/
mw6-seth-rulings.md`) were brainstormed with him live and dispositioned
— the interpretation section appended to that file is the durable
record. The short version: (1) pair = 2 sets RATIFIED, zero engine
code, heading's raw row count is CORRECT and stays; (2) adherence
pairs/planned DEFERRED into the ruling-3 unit (same side-plumbing);
(3) ruling 3 is a NEW FEATURE — per-side L/R comparison analytics
(side into enrichSet, exerciseDetail splits, Exercises-tab comparison
UI) — Seth confirmed: own unit, NEXT wave, registered as a QUEUE.md
candidate with the design sketch, needs a Fable design pass; (4)
sessions-list "Sets: N" keeps raw rows, zero code; (5) collapsed
summary gains a side letter, folded into MW6. Display vocabulary (Seth
chose from previews): the stepper alone speaks "Pairs" in per-side
mode; everything that COUNTS says sets. MW5's REJECT-decimal-RIR stands
ratified plus Seth's rider ("make it impossible or inform the user") —
a client-side RIR input gate folded into MW6. **MW6 as QUEUED now
carries:** detector broadening with a machine-checkable name table
(One-Arm/one-leg names TRUE, "single response" FALSE), the
auto-first-pair trigger (committed-name discipline, override-on
trigger ruled IN, delete respected/no re-trigger, derived-MODE keying
so override=false wins), the Pairs stepper relabel via a new default-
"Sets" label prop on PlanningSetCountControl (template/block builders
zero-diff), the summary side cue, and the RIR gate. **MW8 (MODEL
auto):** shared reps formatter (`client/src/lib/repsDisplay.js`)
replacing Math.round at the 5 analytics top-set sites so 8.5 stops
rendering as 9; null-reps gating per site untouched. MW6 + MW8 are
fully file-disjoint — batchable back-to-back for one review session;
they are the wave's LAST code units, then Seth's smoke, then the
pre-main gate.

Previous entry (July 16, twenty-second session, Opus resident —
**MW-WAVE DISPATCH RAN THE WHOLE QUEUE: 6 of 7 units dispatched +
LANDED in ONE session** — MW4 `c005c2a`, MW5 `87d6b37`, MW1 `f9a6dfd`,
MW2 `859f3d3`, MW3 `9511e8f`, MW7 `b6c885f`; only MW6 remains, DRAFT,
gated on rulings + Fable). All six went over Channel B; the four
opus-tier units ran on the AUTO rung as a **DELIBERATE ladder descent —
Seth's call mid-session** ("run them on auto and you will review them
as opus") instead of waiting for the 7/17 named-rung reset, with the
Opus audit as the compensating control. Every audit ran per
`land-unit`: lanes fresh in the lane each time (unit 170/170, Vite
build, check-hex on UI units), full diffs read, claims spot-checked by
direct read/grep, and the written-not-run integration tests RUN at
land time in the main tree (MW2: 17/17 incl. the 5-row id-only PATCH
matrix; MW3: 11/11 incl. the reopen round trip). Per-unit audit
records + accepted deviations live in QUEUE.md. **Also this session:**
wave-progress messaging (n/N at dispatch, n/N summary per landing,
N/N complete) added to `dispatch-unit` 2b + `land-unit` 5 as Seth's
standing ask (`627c520`); one transient OneDrive index.lock hiccup
(self-cleared, no damage). **The diagnosis findings** (full reports in
`docs/tasks/mw4-*-FINDINGS.md` / `mw5-*-FINDINGS.md`): MW4 — per-side
storage CORRECT, engine side-blind; volume/counts/e1RM AMBIGUOUS (L+R
pair = 2 full sets everywhere; 5 product-ruling questions for
Seth/Fable); display BROKEN (heading "2 sets" vs toolbar 1 pair);
detection BROKEN (regex misses all ~50 One-Arm names). MW5 — reps 8.5
fine except 5 analytics surfaces Math.round it to 9 (fix-block
candidate: shared reps formatter); RPE 8.5 correct end-to-end; RIR 1.5
cleanly 400-rejected by design — recommendation: REJECT, don't widen. MW4 (per-side end-to-end audit,
DIAGNOSIS, no code) audited per `land-unit`: lane 170/170 fresh, zero
source edits, every spot-checked claim confirmed by direct read/grep/
count. **Verdicts:** storage + manual L/R logging CORRECT (side
persists; engine side-blind by construction — zero `side` refs in
`server/src/analytics/`); volume / set counts / e1RM AMBIGUOUS (an L+R
pair counts as 2 full sets on every counting surface; series bucketing
does NOT double-count sessions; planned-vs-actual adherence reads 2.0
on paired work); display BROKEN (heading `:1359` says "2 sets" while
the per-side toolbar `:1318` says 1 pair); detection BROKEN (regex is
exactly `\bsingle\b` — misses all ~50 One-Arm catalog names of 873,
false-positives on "single response"). Overall: trustworthy WITH
CAVEATS; **MW6 must not ship on the current detector** — its DRAFT
note now points at the findings. Full report preserved verbatim in
`docs/tasks/mw4-per-side-analytics-audit-FINDINGS.md` (DELIVERY.md is
gitignored); it ends with **5 product-ruling questions for Seth/Fable**
(pair = 1 or 2 sets? adherence? per-side e1RM footing? sessions-list
count? last-logged side cue?) — rulings needed before any AMBIGUOUS
surface gets a fix block; the two BROKEN fixes (detector broadening,
heading pair count) are block-ready without rulings.

Previous entry (July 16, twenty-first session, Fable — **MW-WAVE
(maintenance wave) SKELETON AUTHORED: 7 blocks on new branch
`maintenance-wave`**, branched off not-tracked-ux-wave HEAD `5e3d981` =
main `c473e21` + the CW dev-tooling arc, which therefore rides this
wave's pre-main gate). Scope settled with Seth this session: item 12 =
custom EXERCISES (not templates); **un-finish IS the edit path** for
items 10+11 (one mechanism — reopen to live, edit with the existing live
UI, finish again; no second editing surface); item 16 (catalog/search
review) deliberately NOT authored, stays a candidate alongside A3.
Units: MW1 heading-pill un-nest (the gate's shipped-knowingly finding),
MW2 identity contract (issues 8+9 — and **issue 8 is now RULED: the
server accepts id-only identity PATCHes**, fixing BOTH
sessionController `:531` and `:575`), MW3 reopen-completed-session
(`POST /sessions/:id/reopen`, completedAt-only flip; reopened sessions
leaving history/analytics until re-finished is INTENDED), MW4 per-side
end-to-end audit (diagnosis, no code), MW5 decimals audit (diagnosis,
no code; `rir` is `Int?` in schema — the 1.5-RIR question), MW6
per-side auto-first-pair (**DRAFT, gated on MW4's verdict**), MW7
custom-exercise Library tab (client half only; L3 server routes exist).
Dispatch order + serialization matrix in QUEUE.md: MW1+MW2 batchable
(file-disjoint), MW3 after both, MW7 after MW3 (index.css overlap),
MW4/MW5 solo anytime between reviews, never back-to-back with anything.
Dispatch is the resident session's job next — NOTE the named rung is
exhausted until the 7/17 reset, so the economical order is MW4/MW5
(MODEL auto) today, the opus-tier units after the reset. **STAGING
REPOINT AMENDED:** when Seth does RUNBOOK step 6, point staging at
`maintenance-wave` (NOT back to `main`) — that is where this wave's
smokes happen. Seth's post-merge trio (prod SHA verify == `c473e21`,
the repoint, prod smoke incl. the What's New modal) and the CW3 visual
sign-off remain owed, unchanged by this session.

Previous entry (July 15, twentieth session, Fable — **the cursor-watch
arc, all landed: CW1 `018a6ae`, CW2 `a26a2c8`, CW3 `6907d4a`**; wave at
`6907d4a` on origin, resident session ran authored -> dispatched ->
audited -> landed three times). CW2 (auto-open): `--open`,
`--open-on-activity` (once per run, re-armed by DELIVERY.md removal or
branch change), `--open-cmd` test override — audited with a live
marker-cycle check (atStart=False, afterFirst=1, afterSecond=1,
afterRearmWrite=2). CW3 (frontier visuals + DONE): layered panels,
phase-driven accent, event-rate presence orb + sparkline, tool-call
activity cards, DELIVERY READY page sweep + title/favicon state for
background tabs, off-by-default chime, and server-side `--notify` OS
toast (once per run; `--notify-cmd` override) — audited by driving the
page in a REAL browser (Playwright: all three states render, titles
flip, zero console errors) plus a live notify check (afterDelivery=1,
afterMoreWrites=1). MODEL auto for CW3 was DELIBERATE (named rung
exhausted until the 7/17 reset); the fully-specified design block
protected quality. **Persistent setup on Seth's machine (his "anything
ever" ask):** resident watcher runs `--open-on-activity --notify`, and
a Startup shortcut (`shell:startup\cursor-watch.lnk`, hidden
powershell -> node) relaunches it at every login — the dashboard pops
and a toast fires whenever the lane stirs, no agent involved, zero
tokens. **Papercut logged, not a defect in real use:** pointing the
watcher at a NON-git directory lets git walk up to an enclosing repo,
so the totals chip can count foreign files (seen in the audit scratch
dir); the real lane is always a git worktree, unaffected. **Owed:
Seth's visual sign-off on the next live run** — open items: does the
WORKING page read as "a frontier agent at work"; does the DONE moment
land (sweep, lockup, toast). Below, the original CW1 entry.
Seth asked for a live visual of Cursor working, token cost weighed.
Shipped as dev tooling: `scripts/cursor-watch.mjs` — zero-dependency
(Node built-ins only), binds 127.0.0.1 only; run
`node scripts/cursor-watch.mjs`, open `http://127.0.0.1:4646`.
Recursive fs.watch + 3s git poll of the lane worktree, SSE to an
embedded dark mission-control page: live activity feed, per-file +/-
diff bars, typing-reveal pane on the newest diff, WAITING -> CURSOR IS
WORKING -> DELIVERY READY keyed off `DELIVERY.md`, optional
`cursor-run.log` tail. **Zero tokens to watch** — no LLM in the loop;
built by Cursor on the free B-auto rung (the tool that visualizes
Cursor was itself an autonomous dispatch). Audited per `land-unit`:
lanes re-run fresh in the lane (unit 170/170 in 14 suites, Vite build
128 modules); live contract spot-checked against a scratch dir (200
text/html; file write -> WORKING event; DELIVERY.md -> DELIVERY READY;
missing lane exits 1); imports all `node:` built-ins; no external URLs
in the page; no deviations. **CW2 dispatched same session** (auto-open:
`--open`, `--open-on-activity` with once-per-run re-arm on DELIVERY.md
removal/branch change, `--open-cmd` test override) so the dashboard
POPS the moment Cursor starts working; `dispatch-unit` amended with
the pop-the-visual step (ensure watcher serving + open browser at
dispatch; skip gracefully where the script doesn't exist). Two-agents
note, a precedent that WORKED: this session interleaved with the
nineteenth (gate/merge) in the SAME tree — the gate session
deliberately carried this session's uncommitted CW2 QUEUE entry in
`2318a87` and left its in-flight skill edit unstaged; this session
committed those in `1b9174b`; status checks before every commit, zero
collisions. No staging smoke owed — dev tooling, never in the client
build; Seth verifies by watching the dashboard during a live run.

Previous entry (July 15, nineteenth session, Opus — **PRE-MAIN GATE
PASSED + NT-WAVE MERGED TO MAIN `c473e21`**). The gate ran on the full
`main...not-tracked-ux-wave` diff with the archive in hand, then Seth
gave the trigger phrase and the merge went ff-only via a scratch
worktree outside OneDrive (`C:\dev\worktrees\main-merge`, removed
after — the `ui-palettes-v2` precedent; never stash+checkout on this
repo). **`origin/main` CONFIRMED at `c473e21`**, fast-forwarded
`57b1fc8..c473e21`, 28 commits, no merge commit, history still linear.
Product units in it: NT1 `f4baee3`, NT2 `f26e783`, NTFIX1 `e0ba383`,
NT3 `98963f6`, NTFIX2 `888e44d`; the rest are docs/blocks/skills/relay
v5+v5.1 doctrine + `check-hex.mjs`. **No schema, no migration anywhere
in the wave** (server surface = `searchCatalog.js` + its test, both
analytics-pure), so this was a code-only deploy with no DB track.

**GATE RESULTS — read before acting on any of these.** Passed: both
lanes re-run fresh on the merge candidate (unit 170/170 in 14 suites;
Vite build 128 modules); tokens-only holds COMPLETELY (zero raw colors
added anywhere in `client/src` across the wave, `index.css` included —
all 274 new CSS lines are `var()`/`color-mix`); motion is 180ms on
`--ease-standard`, inside the 150-250ms bar, gated behind
`prefers-reduced-motion: no-preference`; cross-user isolation sound
(`validateOptionalExerciseIdentity` scopes `userExerciseId` by
`findFirst({ id, userId })`, session ownership separately 403s — note
NTFIX2 makes that path reachable for the FIRST time and it is correctly
guarded); NT2's runtime-invisible criteria all verified (`CHIP_CYCLE`/
`nextChipRole` gone, retroactivity line in the CREATE done-state only,
LINK variant correctly omits it, link paths use the
`buildSessionExerciseNamePatch` idiom); permissions additive with no
destructive allowlisting.

**RULED — do not re-litigate: the NTFIX2 rename is CONTRACT-SANCTIONED,
not a deviation.** NT2's block (`docs/tasks/nt2-add-exercise-stepped-
sheet.md`, lines 101-104) specifies the create path commits
`userExerciseId` "via the same updateSessionExercise path (**name
unchanged if it already matches**)" — a parenthetical that only parses
if the name is SENT alongside the id. NTFIX2 restored the specified
behavior; the id-only version was the deviation that made the path
silently no-op. The design treats row renames as routine (the LINK
done-copy refuses the retroactivity claim precisely BECAUSE "a rename
affects only this session's row"). Seth's smoke passed it. Closed.
Also accepted on the record: NTFIX2's relay deviations (Claude Code
authored the product code — direct-fix exception + Seth's explicit ask;
audited per `land-unit` before landing).

**SHIPPED KNOWINGLY — the gate's one real finding, now the top
follow-up (see "Next up" 0a).** Nested `<button>` on the LIVE-session
path: `SessionDetailPage.jsx:1468` renders
`<button className="session-exercise-heading-toggle">{headingInner}</button>`
and `headingInner` contains `ExerciseTrackedIndicator`, which renders a
`<button>` when interactive (`:127`). Completed sessions use a `<div>`
wrapper (`:1479`) and are FINE — this is live-only, i.e. exactly the
path NT2 made interactive. Invalid HTML + React nesting warning +
nested interactive controls are an AT problem (the inner control's
accessible name can be swallowed). Functions today only because the
inner `onClick` calls `stopPropagation`. NOT pre-existing relative to
main — this wave introduced it when NT2 turned the pill into a button.
Fix: lift the pill out of `headingInner` so it renders as a SIBLING of
the toggle. Seth chose to ship and follow up.

**NEXT UP — post-merge verification (Seth's, all three).** The NT-wave
is DONE: gate passed, NTFIX2 smoke passed (all five items incl. the
rename), merged to main `c473e21`. Owed now, none of which an agent can
do from here: **(1) verify the prod deploy SHA == `c473e21`** in Render
AND Vercel Events — push is NOT proof of deploy, a redeploy rebuilds the
OLD HEAD until it catches up; **(2) RUNBOOK step 6** — repoint staging
Render off `not-tracked-ux-wave` back to `main`, verify that redeploy's
SHA too; **(3) prod smoke** — the NT flow on prod, folding in the
carried N-wave item: the "Every exercise, in one place" What's New modal
fires for a logged-in user (prod is the ONLY place it renders).
Open findings that SURVIVED the gate, in priority order: the nested
`<button>` (top entry — "Next up" 0a), **F** ("Failed to fetch" = Render
cold-start, no client defect; needs a live Network-tab repro, not code),
the **G server-side question** (issue 8 — client fix already shipped), and
"Use that name" being unable to stamp identity for custom exercises
(issue 9).

Previous entry (July 15, eighteenth session, Fable — relay v5.1:
RESIDENT-SESSION AMENDMENT; docs only, no product code). Seth asked
whether the wave should batch into one big Cursor run + one big audit;
the settled answer, now doctrine: **batch SETH'S touchpoints, never
the machine checkpoints.** One resident Sonnet session per wave is now
the stated norm for the relay loop — "run the relay" once, and the
SAME session dispatches, monitors on scheduled wakeups, lands, and
dispatches-next until the queue empties; a fresh session per unit is
the crash/hand-relay fallback, not the design. Seth smokes ONCE per
wave against a consolidated checklist handed over at wave end (the
July 14 NTFIX1+NT3 sign-off is the precedent). Per-unit audit,
one-commit-per-unit, and bisectable history are explicitly UNCHANGED —
do NOT extend this into batching Cursor execution across units
(sequential units compound errors; a wave-end bounce costs the wave,
not the unit). Files: `docs/specs/autonomous-cursor-dispatch.md`
(status header + relay-loop section + Seth's-touchpoints paragraph),
`dispatch-unit` skill (norm pinned up top), `land-unit` skill
(section 5: carry smoke items forward in a relay session,
dispatch-next in the SAME session). Outside the repo: Seth's cheat
sheet (`Desktop\Cursor\workflowandskillscheat.md`, steps 2+3 merged
into one "relay session" step) and the smoke-checklist memory amended
to match. `author-task-block` deliberately untouched — authoring is
unaffected. Next up UNCHANGED — NTFIX2 smoke + the pre-main gate
(below); the wave-end-smoke norm starts with the NEXT wave, it does
not retroactively bundle NTFIX2's owed smoke.

Previous entry (July 15, seventeenth session, Opus — orphaned
findings-fix work traced, audited, LANDED as **NTFIX2 `888e44d`**;
wave now at `888e44d` on origin).
A pre-gate tree check found `AddExerciseToLibrarySheet.jsx` +
`SessionDetailPage.jsx` modified and uncommitted, mtimes July 14 15:09,
unstaged by a bare `git reset` at reflog `HEAD@{0}`. Seth did not write
them and no `DELIVERY.md` or QUEUE entry claims them. **PROVENANCE NOW
TRACED (do not re-litigate):** Claude Code session
`ee60a330-d305-49c3-b2dc-0ec82b2fe35f`, July 14 **14:47-15:10 local**
(18:47-19:10Z — the window brackets the 15:09 mtimes), prompt **"fix all
findings and test to see if everything works"**. It fixed FOUR findings,
ran the lanes green, reported in full, ended by asking *"I haven't
committed - want me to land this?"* — **and never got an answer.** The
session closed and the work sat in the tree. Not a rogue writer, not a
lane-isolation breach; Cursor is exonerated (every recorded cursor-agent
session that day ended by 10:11, and all NT3 relay activity clusters
10:00-10:53). **Its self-reported four fixes:** (1) **finding G / HIGH** —
stamp PATCH sent id-only, server 400s, and because `http()` throws the
throw ALSO skipped the cache invalidate/refresh, so the pill stayed stale
after a mid-session create; now sends name+id in a `try/catch` so
resolution always runs; (2) **MEDIUM** — `seedSearchLoading` stuck on
"Searching..." because the `<2 chars` early-return skipped clearing the
flag; (3) **MEDIUM** — pill went interactive on a stale committed name
mid-edit (visual keys off the draft, click now keys off the committed
name; NT3's completed-session interactivity preserved); (4) **LOW** —
duplicate search on the suggest->seed hop, deduped via
`seedFetchedTermRef`. **AUDITED AND LANDED as NTFIX2 `888e44d`**, pushed to
staging. Sequence: parked verbatim on `parked/unattributed-g-fix`
(`532125d`) -> wave restored to the audited `98963f6` tree -> full
`land-unit` audit -> landed as one unit with an accurate message.
**Audit evidence (lanes re-run FRESH in the lane worktree, never trusted
from the report):** server unit 170/170 in 14 suites, client Vite build
green 128 modules, `check-hex` clean, scope exactly the 2 claimed files
with nothing unexpected, all four criteria verified by direct read, and
G's mechanism confirmed independently against source (issue 8).
**Deviations stated, not hidden:** Claude Code authored product code
(covered by the AGENTS.md direct-fix exception + Seth's explicit ask, but
a deviation); fix 4 is an optimization beyond the findings; no block file
or `DELIVERY.md` exists, so the session's final report stood in for one
and QUEUE.md carries the record instead. **NOTE: `532125d`'s own commit
message is superseded** — written before the trace, it calls the work
unattributed, unaudited and partly scope creep; all three are wrong.
**BEHAVIOR NOTE FOR THE GATE:** the stamp PATCH now carries
`exerciseName`, so the session-exercise row **renames** to the sheet's
name on create. NT2's handler always anticipated this (its pre-existing
`oldName !== name` invalidation) but the rename never fired while the
PATCH 400'd — newly LIVE behavior, not new code. Worth an explicit ruling
at the gate.

---

Previous entry (July 14, sixteenth session, Sonnet — smoke sign-off).
Seth smoked NTFIX1 + NT3 on the staging preview against the four-item list
from the prior entry (completed-session pill interactive/create-only
context, live-session NT2 flow unchanged, Main/Assists toggle pressed-state,
mid-flow close with no nag) — **PASSED, all four.** No code changes.
**NEXT UP is now solely the pre-main Fable/Opus full-branch-diff review**
(open items: finding F cold-start confirmation, finding G stamp-contract
reconciliation, DOM-nesting warning) — the dispatch queue is empty (NT3 was
the last unit, no other block is QUEUED per `docs/tasks/QUEUE.md`).

Previous entry (July 14, fifteenth session, Fable — relay v5 DOC
ALIGNMENT: skills + task-queue protocol swept for the v4 remnants the
adoption left behind; no product code). Four files. **`author-task-block`**
now frames the dispatch line as channel-agnostic, marks the contract-first
rules carried unchanged into v5, notes MODEL doubles as the
dispatch-routing lever (`auto` -> free CLI rung), pins that MODE governs
only the hand-relay fallback (autonomous dispatch always uses the lane
worktree), adds the DB-free-lanes-only constraint on dispatched blocks
(no `server/.env` in the lane worktree or the cloud — a block needing
the integration lane is a hand-relay flag), and ends by invoking
`dispatch-unit` instead of "hand Seth the dispatch line" (the line
survives as the documented fallback). **`land-unit`** now names the lane
worktree as the primary of THREE delivery modes (audit + lanes run in
`C:\dev\worktrees\cursor-lane`; commit in the lane on `cursor/<unit>`,
ff-merge onto the wave branch, push — the NT3 precedent), scopes the
OneDrive sync-lag caveat to the main tree, and closes with the
relay-loop continuation (idle + QUEUED unit -> `dispatch-unit`; wave
complete -> stop, the gate is Fable + Seth). **`dispatch-unit`** gains
its one missing beat: Channel B flips DISPATCHED in QUEUE.md before the
run (bookkeeping parity with Channel A). **`docs/tasks/README.md`**
rewritten from the v4 "Seth dispatches" loop to v5 (dispatch step =
`dispatch-unit` with the hand-relay line kept as fallback, DELIVERY.md
lands at the root of whichever tree the block runs in, DISPATCHED
flipped by the dispatcher, "Two modes" demoted to hand-relay paths,
Seth's job = go-aheads / bug reports / smoke sign-off / gate items,
MODEL guidance aligned with the Fable-withheld rule). `_TEMPLATE.md`
untouched DELIBERATELY — the standing footer is verbatim-standing and
"repo root" already reads correctly in whichever tree the block runs.
Next up unchanged: the pre-main gate (NEXT UP paragraph below).

Previous entry (July 14, fourteenth session, Fable — RELAY v5 ADOPTED:
pricing probe run + NT3 landed as the FIRST AUTONOMOUS DISPATCH; NT-WAVE
NOW CODE-COMPLETE). Resume sequence executed end-to-end this session:
**(1) Setup verified from ground truth** — the session restart still did
NOT propagate env/PATH to the Claude Code shell (parent process chain
holds the stale environment; durable workaround now in the spec + skill:
read `CURSOR_API_KEY` from the registry inline, invoke
`C:\Users\Sethy\AppData\Local\cursor-agent\cursor-agent.ps1` by full
path); CLI `2026.07.09-a3815c0` responds and `cursor-agent status` ->
logged in as Seth (the item last session couldn't confirm). **(2)
Pricing probe, all three rungs, $0 spent — verdict decisive:** Channel A
(cloud agents) requires usage-based pricing ON with >=$2 headroom and
NEVER draws the included Pro pool -> with Seth's overage toggle OFF it
refuses cleanly at dispatch (`400 usage_limit_exceeded`), so the
per-unit cost question is MOOT and **Channel B is the backbone for ALL
blocks**; B-named is exhausted this cycle ("saved $64 on API model
usage", resets 7/17 — the July 13 "33% consumed" dashboard reading was
evidently a different meter); B-auto works. Routing defaults flipped in
the spec + `dispatch-unit`. **(3) NT3 dispatched autonomously and LANDED
`98963f6`** — Channel B auto rung, lane worktree
`C:\dev\worktrees\cursor-lane` (created off wave HEAD, deps installed,
persists for future dispatches), 45-min hard-timeout wrapper. One
dispatch hiccup, lesson pinned in the skill: **the CLI remembers the
last-used `--model`** — the first flagless dispatch inherited the
exhausted haiku from a probe and quota-refused; ALWAYS pass `--model`
explicitly. Delivery audited per `land-unit`: lanes re-run fresh (unit
170/170, client build green), scope exact (3 files = FILES TO TOUCH),
all 7 criteria verified incl. by direct read (completed-context sheet
opens at seed with name prefilled + hadSuggestStep cleared; parent
create handler skips the stamp PATCH without `userExerciseId` — also
sidesteps bug G on this path — but still invalidates + refreshes name
resolution; live path is a no-op change; check-hex clean; slot-pill
fade-in targets a real class, `prefers-reduced-motion` gated,
tokens-only). Committed in the lane, rebased onto the wave branch,
ff-merged, pushed. **(4) Doctrine amended:** AGENTS.md + CLAUDE.md now
describe relay v5 (autonomous dispatch via `dispatch-unit`; Seth
hand-relaying still works), spec flipped ADOPTED. Also this session:
QUEUE.md had NTFIX1 stale-QUEUED — flipped to LANDED `e0ba383`; HANDOFF
aging pass done (five entries July 10-13 moved verbatim to the
archive). **Leftover (gated deletion candidates):** lane branches
`cursor/pricing-probe` and `cursor/nt3-entry-deferability-polish` (the
latter == wave HEAD; both get re-pointed by `checkout -B` on the next
dispatch anyway).

---

**What this is:** the big-picture tier of the two-tier state channel
(relay v4, July 6, 2026). When `docs/HANDOFF.md` is rewritten at the end
of a session, aged session logs move HERE verbatim — newest first, nothing
summarized, nothing lost. Fable/Opus greps this file for pre-main review
and big-picture planning (decision rationale, sequencing-flag precedents,
accepted deviations and nits, incident history). Sonnet and Cursor never
load it. Single writer: Claude Code, same rule as HANDOFF.

History older than this file: `WORKOUTDB_MASTER_PROMPT_17.md` (stable
context) and the git history of `docs/HANDOFF.md`.

---

Previous entry (July 14, thirteenth session, Sonnet — MANUAL SETUP FOR
RELAY v5 COMPLETE, no product code). Walked Seth through the four-item
one-time setup checklist from `docs/specs/autonomous-cursor-dispatch.md`
("One-time setup" section) in chat: (1) **`CURSOR_API_KEY` minted +
set as a User env var** — confirmed present in the registry
(`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')` ->
truthy); (2) **Cursor CLI installed** via `irm
'https://cursor.com/install?win32=true' | iex` (Windows installer, not
the Unix curl form the spec's prose implied — worth a spec correction
whenever Fable next touches that doc) — **`agent login` completion is
UNCONFIRMED**, Seth moved to step 4 before answering; not necessarily
blocking since the spec allows relying on `CURSOR_API_KEY` alone in CI
mode, but verify explicitly before the first dispatch; (3) worktree
root `C:\dev\worktrees\` already existed (n5 precedent), nothing to do;
(4) **overage toggle confirmed OFF** — dashboard screenshot showed
"On-Demand Spending: Disabled" and "Monthly Limit: Disabled" under Pro
($20/mo, 33% of included usage consumed, resets Jul 17) — matches the
billing precondition exactly (exhaustion means refusals, never a
surprise charge). **Known environment gotcha hit twice this session:**
neither the env var nor the newly-installed CLI (`agent` / `cursor-agent`
on PATH) were visible to this Claude Code session's own shell after
Seth set/installed them in a separate terminal window — Windows only
hands updated env/PATH to processes spawned after the change reaches
whatever launched the session, not to an already-running one. **Session
was restarted specifically to pick these up; next session should verify
first** (`Get-Command agent`, `$env:CURSOR_API_KEY` truthy) before
attempting anything else. **Next up per the resume sequence: skip
straight to step (2)** — run the spec's pricing probe (read-only cloud
agent -> `GET /v1/agents/{id}/usage`, plus the CLI-auto rung), record
the numbers in the spec, then confirm/flip routing defaults, then the
NT3 live dispatch trial. Status still PROPOSED — nothing adopted into
AGENTS.md/CLAUDE.md until the probe validates and NT3 lands clean via
the new channels.

Previous entry (July 13, twelfth session, Fable — AUTONOMOUS-DISPATCH
WORKFLOW PROPOSAL, no product code). Seth green-lit the relay v5 design:
Claude Code dispatches task blocks to Cursor itself instead of Seth
relaying them - Channel A = Cloud Agents API (`POST api.cursor.com
/v1/agents`, delivery stays the accepted `cursor/` branch + PR-body
pattern), Channel B = headless CLI (`agent -p`) in a persistent lane
worktree at `C:\dev\worktrees\cursor-lane` (outside OneDrive, n5
precedent), with a quota fallback ladder A-named -> B-named -> B-auto
and a Sonnet-seat relay loop (dispatch -> poll -> land-unit -> next).
Gate, one-writer rule, land-unit, escalation triggers, and the pre-main
Fable gate all unchanged. **Status PROPOSED, nothing adopted yet** -
blocked on Seth's one-time setup (mint CURSOR_API_KEY, install the
Cursor CLI) + a pricing probe of cloud-agent credit burn (the single
blocking unknown; routing defaults flip on it). Spec:
`docs/specs/autonomous-cursor-dispatch.md`; dispatch ritual:
`.claude/skills/dispatch-unit/SKILL.md`. AGENTS.md/CLAUDE.md still
describe relay v4 by design - amend only after the probe validates and
the first autonomous unit lands clean. **Billing settled with Seth:**
everything rides the Pro plan's included usage (CLI-auto rung is free;
cloud agents + named models draw the ~$20/mo included pool) PROVIDED
on-demand/usage-based overage is toggled OFF or capped in the Cursor
dashboard - Seth must verify that toggle during setup so exhaustion
means refusals (which the ladder absorbs), never surprise charges.
**Resume sequence for the next session, in order:** (1) Seth's setup -
mint CURSOR_API_KEY (dashboard -> API Keys, set as User env var; does
NOT conflict with the ANTHROPIC_API_KEY rule, that one is Claude-auth
only), install the Cursor CLI + `agent login`, verify the overage
toggle; (2) Claude Code runs the spec's pricing probe (read-only cloud
agent -> `GET /v1/agents/{id}/usage`, plus the CLI-auto rung) and
records the numbers in the spec; (3) routing defaults confirmed or
flipped from the probe; (4) first live trial = dispatch NT3
(`nt3-entry-deferability-polish.md`, QUEUED, MODEL auto -> Channel B
auto rung per the spec's defaults) via `dispatch-unit`, land it via
`land-unit`, and only after that clean landing amend AGENTS.md/
CLAUDE.md to relay v5. (This file is over its ~300-line cap; aging
pass owed at the next state rewrite - not done this session to keep
the workflow commit clean.)

Previous entry (July 12, eleventh session, Sonnet — NTFIX1 AUDITED +
LANDED on `not-tracked-ux-wave`, pushed to staging). Cursor's cloud-branch
delivery (`cursor/ntfix1-nt2-smoke-bugs-1341`, PR #3) for the five NT2
smoke findings was fetched, audited, and ff-merged as **`e0ba383`**
(`804b65b..e0ba383`, `origin/not-tracked-ux-wave` confirmed; PR #3 now
MERGED). Both lanes re-run FRESH green (client `npm run build`; server
`test:unit` 170/170 tripwire), diff stays inside the two allowed client
files, and the runtime-invisible checks a build can't catch all hold:
`resolveExerciseNames` response shape (`data.results[0].resolved`) matches
how the sheet already reads it, `inputToSessionExerciseName` is imported in
`SessionDetailPage`, and the name-input `onChange` (~line 627) fires NO
mutation (write stays commit-on-blur). **Landed fixes: (B)** dead `goBack`
ternary collapsed; **(C)** post-create stamp made best-effort (inner
try/catch swallows a stamp failure so create still reaches `done`; only a
`createCustomExercise` throw surfaces an error); **(D)** Main/Assists toggle
converted from broken `role="tablist"` to `aria-pressed` toggle semantics;
**(E)** as-you-type tracked pill — new debounced (300ms, seq-guarded),
WRITE-FREE `resolveExerciseNames` in `SessionExerciseFields` reports a draft
status up to `SessionExerciseBlock`, which renders
`displayTrackedStatus = draftTrackedStatus ?? trackedStatus`; live-only
(`!isCompleted`), no commit-on-blur regression. **(F) STILL OPEN — diagnosed,
NOT fixed (no client defect found):** "Failed to fetch" creating an exercise
from scratch. Cursor could not do a full-stack local repro (cloud workspace
had no `DATABASE_URL`), so it curl-probed staging instead: `/exercises/custom`
preflight + unauthed POST behave identically to `/exercises/resolve`
(204 preflight w/ correct CORS headers, 401 on POST), which CONTRADICTS
"CORS blocks all POSTs" / "wrong API origin." `createCustomExercise` builds
the request correctly via the same `http()` wrapper as the working calls; a
raw `Failed to fetch` is a native fetch `TypeError` (no response), not an
`ApiError`. Ranked candidate: **Render cold-start / transient 502 on the
heavier POST** (staging-repoint caveat applies) — needs a live device/Network
-tab repro or the pre-main gate to confirm. No F code change (correct per the
diagnose-first contract). Deviation logged: F local browser repro not run
(no DB in cloud), curl probe used as supplementary evidence.

**LIVE BROWSER TEST OF F (same eleventh session, Sonnet — Playwright, local
`not-tracked-ux-wave` client via inline `VITE_API_URL` override -> STAGING
Render API `workout-db-staging.onrender.com`, smoke acct `smoke_b8`; NEVER
prod).** Drove the full flow: live session 342 -> typed novel name
`Zzz Cable Thruster Xyz` (pill flipped to "Not tracked" — E confirmed via
multiple write-free `/exercises/resolve -> 200`) -> "Not tracked - add?" ->
"Start from scratch" -> chest Main -> submit. **Results:** (1) **F did NOT
reproduce on the warm backend** — `POST /exercises/custom -> 201`, sheet
reached "Added to your library". Confirms no deterministic client defect;
consistent with the cold-start diagnosis, and directly corroborated by a
measured **22.5s cold-start** on the staging Render `GET /` earlier this
session (that spin-up window is exactly when a POST gets an edge 502 w/o CORS
headers -> `TypeError: Failed to fetch`). (2) **Finding C's fix VERIFIED LIVE:**
the post-create stamp `PATCH /sessions/342/exercises/510` returned **400**,
was swallowed, and the flow still completed — the exact create-succeeds/
stamp-fails path C was written for. (3) **D confirmed** — Main/Assists render
`aria-pressed`/`[pressed]`. **NEW CONFIRMED BUG for the pre-main gate (call it
G — pre-existing NT2, non-fatal, NOT NTFIX1's regression):** the
`userExerciseId` stamp on create-in-live-context 400s EVERY time. Client sends
id-only `{ userExerciseId }` (`SessionDetailPage.jsx:1833`
`handleAddToLibraryCreateCommitted`); server `updateSessionExercise`
(`sessionController.js`) only merges identity into `data` INSIDE the
`if (data.exerciseName !== undefined)` block (~line 577-605) and otherwise trips
"No fields to update" (line 531) — so a stamp-only PATCH can never persist.
Response body confirmed: `400 {"error":"No fields to update"}` for body
`{"userExerciseId":37}`. Net effect: the session_exercise row keeps
`userExerciseId = null`; attribution still works purely by name-based
resolution (why C made the stamp best-effort), but NT2/A4's structural id-link
on this path silently no-ops. Fix is a client/server contract reconciliation
(server accept id-only identity PATCH, OR client send name+id together) — a
new task block, NOT in NTFIX1 scope. **Also observed (pre-existing, not
NTFIX1):** React DOM-nesting warning — the "Not tracked - add?" pill `<button>`
is nested inside the heading-toggle `<button>` in `SessionExerciseBlock`
(invalid HTML / hydration warning). **Test residue on staging smoke acct:**
live session 342 (no sets) + custom exercise `Zzz Cable Thruster Xyz`
(userExercise 37) left behind — harmless staging pollution, not cleaned up.

Previous entry (July 11, ninth session, Opus — NT1 + NT2 LANDED on
`not-tracked-ux-wave`, pushed to staging). **NT1** (`f4baee3`) already on
staging: searchCatalog rows carry `secondaryMuscles` (additive, pure;
170/170 unit lane). **NT2** (`f26e783`) — the wave centerpiece — landed
this session: `AddExerciseToLibrarySheet` rebuilt as the suggest -> seed
-> curate -> done stepped flow (catalog-seeded, segmented Main/Assists
picker replacing the old 3-state cycling chip; `CHIP_CYCLE`/`nextChipRole`
deleted), with LINK wiring into `SessionDetailPage` via the
`updateSessionExercise` + `buildNamePatch` idiom and a `userExerciseId`
stamp on create-in-live-context. Delivered by **Composer** (Cursor was out
of Opus tokens) and audited by **Opus in Claude Code instead of Sonnet**
per Seth: both lanes re-run fresh green (client `npm run build`; server
`test:unit` 170/170 tripwire), all 11 acceptance criteria independently
verified, and the runtime-invisible things a build can't catch checked —
search-row + `resolveExerciseNames` shapes match the sheet's reads exactly,
every CSS `var()` token resolves, no dangling refs, scope limited to the 3
FILES TO TOUCH. **One reviewer fix folded into the commit:** dropped a
vestigial `getMuscles` fetch whose payload was discarded but whose
loading/error state gated the picker (chips render from the hardcoded
17-muscle constant = the server vocab). **Open findings logged for the
pre-main Fable gate (non-blocking):** (B) dead ternary in `goBack`
(`hadSuggestStep ? "seed" : "seed"`); (C) create-succeeds-but-stamp-fails
edge shows an error though the exercise was created (recoverable via the
already-tracked path; stamp is best-effort, retroactivity still works by
name); (D) `role="tablist"`/`"tab"` on the Main/Assists segmented control
has no tabpanel/roving-tabindex (minor a11y). **NT3 flipped DRAFT ->
QUEUED** (unblocked — shares both client files with NT2). Smoke NT2 on the
staging Vercel preview once Render/Vercel track this branch (see the
staging-repoint follow-up below).

Previous entry (July 11, eighth session, Fable — NT-WAVE SKELETON
AUTHORED, no product code). Seth settled the brainstorm doc's three open
questions: (1) variant-of seeding IS in scope this wave; (2) the
retroactive-attribution message lives in the sheet's success moment ONLY
— brief, informative, fires every time; no What's New copy asked for;
(3) the pain is BOTH structural and visual — full flow rebuild AND a
visual bar, not a styling pass. Three task blocks authored on
`not-tracked-ux-wave` per the relay v4 template:
**`nt1-search-secondary-muscles.md`** (QUEUED, MODEL auto — searchCatalog
rows gain `secondaryMuscles`, additive + pure, so the existing search
endpoint carries the full seeding profile; NO new endpoint, no schema, no
migration anywhere in the wave), **`nt2-add-exercise-stepped-sheet.md`**
(QUEUED, MODEL opus — Seth's July 11 call, Fable withheld for the
pre-main gate — the centerpiece: sheet rebuilt as suggest-link /
seed / curate / done stepped flow; cycling chip replaced by a segmented
Main/Assists explicit-role picker; link wiring into SessionDetailPage via
the existing `updateSessionExercise` + `buildNamePatch` idiom; create in
live context also stamps `userExerciseId` on the row; judgment-heavy
visual, so the block carries fuller design detail per the CLAUDE.md
carve-out), and **`nt3-entry-deferability-polish.md`** (DRAFT until NT2
lands — shares both client files with NT2). Facts verified during
authoring, load-bearing: catalog entries' `primaryMuscles`/
`secondaryMuscles` are ALREADY the 17-muscle picker vocabulary
(`deriveMuscleVocabulary` derives it from those fields — no translation
layer needed); completed sessions are LOCKED server-side (every
sessionController mutation guards `completedAt`), so LINK/rename is
live-only while CREATE works from completed sessions too and
retroactively lights them up via name-based resolution — that asymmetry
is NT3's whole design. Dispatch: NT1 then NT2 (file-disjoint, batchable
back-to-back, one review session), NT3 strictly after NT2. QUEUE.md
restructured: N-wave section moved under Landed, NT-wave now Active.

Previous entry (July 10, seventh session, Fable — not-tracked flow
brainstorm, NO code): Next addition chosen by Seth: rework the
"not tracked" custom-exercise UI (the `AddExerciseToLibrarySheet`
bottom sheet + its "Not tracked - add?" pill entry in
`SessionDetailPage.jsx`) — current sheet's three-state cycling muscle
chips + build-from-zero curation flow judged not user friendly. Full
brainstorm written to
**`docs/design/not-tracked-add-flow-brainstorm.md`** (diagnosis, three
directions, recommendation: catalog-seeded stepped flow A with
explicit-role picker B as its final step, body-map C parked; verified
mechanism: name-based resolution makes custom-exercise creation
RETROACTIVE over past sessions — a copy moment to use). Session stopped
before Seth answered the doc's three open questions (settled July 11 —
see top entry). Committed on new branch `not-tracked-ux-wave` off
`analytics-rebalance-wave` HEAD `e960645` (= `main` `57b1fc8` + one
docs bookkeeping commit); the rebalance branch itself stays a clean
deletion candidate.

Previous entry (July 10, sixth session, Opus — weekly-volume graph
rebuild + pre-main review): Seth smoked the N-wave on staging: passed,
one critique — the per-exercise "Weekly volume" mini read as odd (bare
bars, no values/dates/baseline, 8% min-height floor flattening small
weeks + hiding rest weeks). **Rebuilt + LANDED `2bcb6e9`** (client-only:
`ExercisesView.jsx` `WeeklyVolumeMini` + its `index.css` block): zero-based
`niceScale` heights (floor hack gone), visible baseline + faint empty-week
stubs (rest weeks read as gaps not missing data), direct peak-value label +
first/last week dates, accent fill matching sparkline/heatmap, per-bar
`title` tips. Client build green fresh; unit lane 167/167 fresh (no server
touch); tokens-only, no hex. Pushed to `origin/analytics-rebalance-wave`
(`4d89a06..2bcb6e9`). **Pre-main Opus review of the full branch diff DONE
and CLEAN** (36 files, ~4.4k insertions): cross-user isolation verified
single-point (both new exercise endpoints route through
`fetchAllTimeEnrichedSets(userId)`, same doctrine as `getSummary`; a
foreign `userExerciseId` filters to 404, no leak); NO migration coupling
in the diff (catalog/FK migrations were the A-wave, already on main);
unit lane 167/167. **N-WAVE MERGED TO MAIN `8068ffb`** (July 10, clean
ff `13a1e59..8068ffb`, 26 commits, `origin/main` confirmed == branch
tip; done via throwaway worktree per the merge-to-main ritual, no
OneDrive churn). No migration coupling, so no prod DB step. Prod
Vercel/Render track `main` and auto-deploy on push. **Open follow-ups:**
(1) verify prod deploy SHA == `8068ffb` in Render/Vercel Events (push !=
live); (2) prod smoke of the exercises tab + new weekly-volume graph;
(3) RUNBOOK step 6 — repoint staging Render from `analytics-rebalance-wave`
back to `main`, verify redeploy SHA. `analytics-rebalance-wave` is now
fully contained in `main` and is a deletion candidate (gated).

**What's New — DONE + MERGED TO MAIN (`57b1fc8`, July 10; clean ff
`8068ffb..57b1fc8`, 3 commits, no migration).** Seth's standing
not-yet-actioned note is closed: the whole
What's New surface is now PROD-ONLY via new `client/src/lib/appEnv.js`
`isProdEnv()` (keys off the API host `workout-db-l3gc`, NOT Vite build
mode — a staging Vercel build also reads PROD; same doctrine as server
`dbHostGuard`). Modal (`WhatsNewGate`) returns null off prod, archive
page (`WhatsNewPage`) redirects to `/profile`, Profile link hidden —
staging + local dev show no release notes. New release entry
`2026-07-exercises-tab` (2026-07-10) prepended to `whatsNew.js`
(non-technical copy, outcomes only); its new id re-fires the modal on
prod. Build green. **Note: because the surface is prod-only by design,
there is NOTHING to smoke on staging except confirming it stays HIDDEN;
the modal is first visible on PROD after this deploy lands — verify the
"Every exercise, in one place" modal fires there for a logged-in user.**
`main` and `analytics-rebalance-wave` are now identical (`57b1fc8`) — the
branch is a clean deletion candidate (gated).

- **Wave loose ends still open:** staging Render must be REPOINTED from
  `main` to `analytics-rebalance-wave` before Seth smokes any
  server-touching unit (N1/N2 carry engine tails). Smoke account was
  re-seeded July 10 (TODO 0b done).

Previous entry (July 10, fifth session, Sonnet — N6 LANDED
`28efeba`, the LAST N-wave unit: Cursor's delivery audited, committed +
pushed to `origin/analytics-rebalance-wave` (`5778bae..28efeba`). Unit
lane 167/167 (tripwire, no server touch) + client build re-run fresh;
scope exact (4 files, matches FILES TO TOUCH). Page empty state now
splits new-user (all-time index empty -> warm copy + "Log your first
workout" CTA) from data-exists-but-not-in-range (range chips as the
implied action), verified by direct read of the `isNewUser` gate; range
choice (2/4/8/12 weeks) now persists via `analyticsRangePref.js`,
confirmed byte-for-byte the `weightUnitPref.js` accessor pattern; Top
set / Top gain KPI tiles link to `?view=exercises&exercise=...`, volume
headline links to `?view=muscles`, empty-data tiles confirmed staying
plain (non-link) divs; `.stat-tile--link` >=44px with focus-visible +
color-mix hover, no hex in CSS diff. No deviations. **The N-wave
(analytics UI rebalance) is now CODE-COMPLETE on
`analytics-rebalance-wave` — N1/N5/N2/N4/N7/N3/N6 all landed. Next:
the wave's pre-main Fable review of the full branch diff (grep
`HANDOFF-ARCHIVE.md` for the full session history first), then Seth's
"push to main" trigger.** Visual smoke of N3/N6 together (exercises tab
+ new empty states + tile tap-through) still owed to Seth on staging —
repoint check below still applies before that smoke.

**Seth's note this session (not yet actioned — no task block written):**
the What's New modal/page currently has NO environment gate (`WhatsNewGate.jsx`
shows to any logged-in user regardless of host) - Seth wants it PROD-ONLY,
never on staging. Content-authoring process (prepend an entry to
`client/src/data/whatsNew.js`, the token-efficient data-file-edit pattern
already in use) is fine as-is and should continue. Standing copy
requirement for future releases: keep it non-technical and straight to
the point (no implementation jargon, no internal metric names - user-facing
outcomes only). Worth a small task block (env check in `WhatsNewGate.jsx` -
likely `import.meta.env.MODE` or a prod-hostname check, same family as
`dbHostGuard`'s prod/staging split) whenever Seth wants it queued; not
part of the N-wave.

Previous entry (July 10, third session, Fable — N4 LANDED `4f37361`
AND N7 LANDED `d1b2871`, both Fable-direct in the main working tree, no
worktree needed since Cursor is idle. **N4:** strength tab reframed
progression-first — table columns Exercise | Top set | Top-set trend |
Matched effort, e1RM columns + HOW_BEST_E1RM removed, footer link
"Estimated 1RM has its own view →" targets `?view=exercises` (muscles
fallback until N3, by design — now landed); sparklines re-anchored to
whole-number top-set weights via N2's `topSetSeries`, marks per the
signed July 9 mock (re-fetched and checked against its actual source:
2px accent line, 10% wash, single ringed 9px end dot, no intermediate
dots, 40px plot, bare-number endpoint labels, delta chip "+20 lbs ·
top set 245 × 3"). Unit lane 162/162 + build fresh, scope exact 3
files, e1rm grep clean, no hex. **N7:** Trend view replaced by the
binned 4-step volume heatmap; engine series bucketing parametrized
week|day (granularity derives from range, <= 14 days -> day cells;
series keys now periodStart/periodEnd; meta.seriesGranularity added);
2-weeks range chip added and rangeForWeeks fixed to span exactly N*7
calendar days inclusive (kills a latent 5th-bucket artifact); volume
table de-noised (right-aligned tabular-nums, em-dash + one footnote,
"3d" recency with warn tint at >= 14d, ? buttons out of headers); ramp
validated with the dataviz ordinal checks for all TEN palette x mode
combos — iron light anchors toward text ink (accent-vs-surface can
never clear 2:1 there), everything else on shared per-mode P constants
(light 51/66/81/100, dark 40/60/80/100). Unit lane 167/167 (5 new
fixtures, both bucket modes) + build fresh. Full evidence per unit in
QUEUE.md. Seth's on-device smoke still owed for N4/N7/N3 together.)

Session log (July 10, Fable — N-WAVE SKELETON BUILT + N5 SHIPPED +
N1 LANDED): all 7 unit blocks authored + queued on new branch
`analytics-rebalance-wave` (off catalog-fk-wave HEAD `3d4e874` = main +
docs + a settings commit); N5 implemented Fable-direct same session
(`c4e3ba8` — exercise index/detail endpoints + rep-target engine, unit
lane 153/153, isolation+purity greps clean, built in worktree
`C:\dev\worktrees\n5`, kept for N4/N7); N1 landed Cursor-relay same day
(`11b9c71` — shared weight/effort formatters + component sweep, unit
lane 157/157, Fable-audited deeper than the standard pass since Fable
authored the block, no deviations).
- Blocks: `docs/tasks/n{1,2,3,4,5,6,7}-*.md` (see QUEUE.md Active for the
  index). **Filename collision marked:** the June nav-wave's landed
  n1/n2/n3 task files still exist — dispatch by FULL filename only.
- **Division settled with Seth:** Cursor lane N1 → N2 → N3 → N6
  (mechanical/relay); Fable-direct N5 → N4 → N7 (isolation surface +
  the two mock-signed visual units). N4/N7/N3 all touch
  `AnalyticsPage.jsx` — strictly sequential N4 → N7 → N3.
- Spec open items SETTLED during authoring: rep ladder 1/3/5/8/10/12/15
  (20 rejected: Epley error > plate increment that far out); adaptive
  coverage threshold 0.6 (named constant, landed in N2); plate
  increments 2.5 lbs / 1.25 kg (N1 `roundToPlate`). Spec gap found +
  fixed in-block: N4's sparklines need a per-session top-set weight
  series the payload lacked — `topSetSeries` added to N2's engine tail
  (now landed) so N4 stays client-only.
- **Loose ends for this wave:** (a) staging Render must be REPOINTED
  from `main` to `analytics-rebalance-wave` before Seth smokes any
  server-touching unit (N1 and N2 both carry engine tails, both now
  landed); (b) re-seed the staging smoke account before visual sign-off
  (TODO 0b).

---

Session log (July 9, Fable — N-wave spec complete): criteria + chart
forms signed off via mock. Docs-only session, no code.) Seth set the
wave's completion bar ("passes as a professional frontier weightlifting
app, down to every detail") and the session turned that into contract
material in `docs/specs/analytics-ui-rebalance.md`:
- **3rd pass (`2929579`):** code-level audit of the whole analytics tab
  against the bar → the **F-test** (10-item exit checklist; runs per-unit
  on touched files + in full at pre-main review). Findings folded into
  units: weight/estimate formatting into N1 (four duplicated `formatWeight`
  copies all print "225.0 lbs"; new `weightDisplay.js`, estimates rounded
  whole), two mechanical traps named in N3 (4th tab breaks the hardcoded
  3-col tabs grid; `setView`'s `setSearchParams` CLOBBERS other query
  params), plate rounding added to N5 rep targets (client-side, 2.5 lbs /
  1.25 kg), and a new **N6 frontier-polish unit** (actionable two-variant
  page empty state, range persistence via `analyticsRangePref.js`, KPI
  tile deep-links).
- **4th pass (`fa3b4f8`):** chart-form design pass (dataviz method) on
  Seth's "trend and table are a mash" feedback. Built a side-by-side mock
  artifact ("LogChamp — Analytics chart-form proposals",
  claude.ai/code/artifact/2470c620-b4d9-47aa-a301-0a14181162f5), rendered +
  verified light/dark/390px. **Seth SIGNED OFF:** Muscles Trend becomes a
  binned volume HEATMAP (4-step accent-derived ramp, validator-passed for
  champ both modes; empty cell = faint neutral, deliberately NOT ramp
  step 1), Table de-noised (right-aligned tabular nums, ONE unlock
  footnote replacing per-cell sentences, 14d recency warn tint), Strength
  sparklines get the full mark spec (top-set series, 2px accent line, 10%
  wash, ringed endpoint — folded into N4). All landed as new unit **N7**.
- **Seth's period question, tested against the bar at his instruction
  ("don't take my word as absolute"):** 10/15/20-day bucket lengths
  REJECTED (nonstandard denominators — nobody can benchmark "sets per 10
  days"); accepted mechanism = **new 2-week preset rendering DAY
  granularity** (14 cells; the honest non-weekly-split answer — mock
  section 1b, phone-width verified). Custom date picker rejected for the
  wave; presets now 2/4/8/12; granularity derives from range, never a
  second knob. Rationale written into the spec so it isn't re-litigated.
- **Wave shape now: N1 → N2 → N4 → N7 → (N5 → N3) → N6**, spec-complete.
  N4+N7 both touch `AnalyticsPage.jsx` — sequential, don't batch.

---

**Updated:** July 8, 2026 (Opus — A-WAVE PROD ROLLOUT COMPLETE, MERGED TO MAIN,
SMOKED LIVE.)** Executed the full prod choreography WITH Seth (agent did
reads/prep only; Seth ran every prod write). All steps verified:
- **Step 0 (read):** prod had 14 healthy migrations, NO `Exercise` table, NO
  failed records — the CLEAN case (unlike staging's old May-27 collision). No
  `readonly_agent` role was stood up; Seth ran the Step-0 reads in the Neon
  editor and pasted output.
- **Steps 1 + 3 (migrations, Seth hand-applied in Neon editor):** catalog
  `20260707120000_add_exercise_catalog` and FK-linkage
  `20260707130000_add_exercise_fk_linkage`, each as one transactional block
  (DDL + hand-inserted `_prisma_migrations` row). Checksums derived from the
  migration files via **LF-normalized sha256** — proven correct against two
  existing prod rows FIRST; the working tree is CRLF so a raw `sha256sum` is
  wrong, must `tr -d '\r'` before hashing. Values: catalog `85908f0e…a6d5a`,
  fk-linkage `1cb43415…dfc63`, both == staging's stored rows.
- **Step 2 (seed, Seth ran):** `npm run prisma:seed` against prod via
  shell-set `$env:DATABASE_URL` — dotenv does NOT override an already-set
  shell var, which is the mechanism that lets prod win while `.env` stays on
  staging. Two false starts, both instructive: (a) the `<PLACEHOLDER>` URL
  pasted verbatim → guard "unparseable" (which PROVED dotenv wasn't
  clobbering); (b) a non-owner role → `42501 permission denied for table
  Exercise`. Fixed by using the **`neondb_owner`** connection string (it owns
  the table). Result `Seeded 873 exercises (30 with muscleWeights
  overrides)`; verified `count = 873` / `30`.
- **Step 4 (diff):** prod ledger = 16 rows, all `finished_at` set, last two
  checksums canonical → prod == staging == code, no drift. (Closes old Open
  TODOs #2 migration-diff and #3 username-checksum — prod's
  `add_user_username` checksum matched the canonical file exactly.)
- **Step 5 (merge, gated "push to main"):** clean fast-forward
  `3767840 → 13a1e59`, done via `git branch -f main` (no-checkout, to dodge
  the OneDrive lock + the dirty working tree; true ff so safe). Pushed;
  `origin/main` confirmed `13a1e59`.
- **Step 6 (smoke):** Seth smoked prod LIVE — login + exercise typeahead +
  existing sessions + analytics/attribution all work. **Confirmed working.**
DB-before-code ordering held throughout; zero code-ahead-of-DB window.
**Remaining, non-urgent:** optional Step-7 historical backfill
(`scripts/backfill-exercise-ids.mjs`, dry-run then `--apply`) — historical
rows carry valid NULL identity until then. (Staging Render already repointed
to `main` — Seth confirmed July 8.) **Still
open from the prior EOD:** codify the read-only-prod-review exception into
AGENTS.md invariant #9 + gate item 2 (needs Seth's exact wording — do NOT
unilaterally rewrite the safety invariants).

---

**Updated:** July 7, 2026 latest+5 (Opus — EOD; prod choreography PREPPED,
handoff for next session. Seth done for the day.)** No prod writes happened
this session — the whole prod rollout is teed up for the next session to
execute WITH Seth. Decisions locked here:
- **NEW RULE (Seth, this session):** during **Opus/Fable review sessions**
  the reviewing agent gets a **READ-ONLY prod DB connection** for diagnostics
  (dedicated `readonly_agent` Neon role, SELECT-only); **all prod WRITES
  (migrations, seed) still stay with Seth.** Does NOT extend to Sonnet/Cursor.
  Rationale: the May-2026 wipe was a *different, non-frontier* model. Saved to
  memory (`opus-fable-review-prod-access`). **TODO next session: codify this
  scoped exception into AGENTS.md invariant #9 + gate item 2 (get Seth's exact
  wording — do NOT unilaterally rewrite the safety invariants).**
- **Read-only access NOT yet stood up.** To do the agent-side Step-0 read,
  Seth creates the `readonly_agent` role on prod (SELECT-only CREATE ROLE +
  GRANTs) and drops the real conn string in an OFF-TRANSCRIPT scratchpad file;
  OR just pastes the Step-0 query output from the Neon editor and skips the
  role entirely (both queries are in Next-up item 0). Placeholder string Seth
  first pasted had a template password (`choose-a-strong-password-here`) — not
  usable; real creds go via file, never chat.
- **Seed method LOCKED = Option A:** `npx prisma db seed` against prod (tested,
  idempotent, no hand-written SQL, identical 873-row result). It's a WRITE, so
  **Seth runs it** with the write-capable prod owner URL (NOT `readonly_agent`).
  Today's `assertRecognizedHost` guard split is what lets seed run on prod.
- **State unchanged on prod:** prod still has NEITHER catalog nor FK migration;
  `origin/main` still `3767840`; branch `catalog-fk-wave` `6331647` is
  review-clean and pushed. NOT merged. Full ordered choreography = Next-up
  item 0.

**Updated:** July 7, 2026 latest+4 (Opus — PRE-MAIN REVIEW DONE + guard-split
fix landed `0e6f32a`.)** Ran the mandated Fable/Opus pre-main branch-diff
review of the whole A-wave (`catalog-fk-wave` vs `main`), with the archived
session logs in hand. **Verdict: code is clean and mergeable** — schema/
migrations additive and consistent (nullable FKs, SET NULL, one-identity
CHECKs, indexed), the `userExerciseId` tier correctly threaded resolve ->
enrichSet -> attribution (the `0d2118e` regression fix holds and is pinned),
write-path controllers enforce cross-user ownership on `userExerciseId` and
reject both-set, backfill is idempotent/dry-run-default/`--apply`-gated, client
picker is debounced+seq-guarded+no-portal+a11y, CSS token-clean. Fresh lanes:
unit 129/129 then 137/137 after the fix, client build green.
**One finding, fixed this session (direct-fix, diagnosis was the work):** the
prod migration choreography needs `npx prisma db seed` (873 catalog rows) and
the A6b backfill `--apply` on prod, but BOTH called `assertSafeForReset`, which
denylists the prod host — the prod rollout would have been blocked by its own
guard at the seed step. Split the guard: new `assertRecognizedHost` (permits
prod deliberately, still rejects unknown/typo'd hosts) now guards seed.js +
backfill; `assertSafeForReset` (staging/localhost only) still guards the
destructive test-reset path (`jest.setup.js`) unchanged. Added first-ever
`dbHostGuard` unit tests (137 total now) routed into the fast unit lane
(`test/lib/**`). Committed `0e6f32a`, pushed, origin confirmed.
**Minor note (not fixed, non-blocking):** `updateSessionExercise` silently
drops a provided identity when the patch carries no `exerciseName` — harmless,
the picker always sends both.

---

**Updated:** July 7, 2026 latest+3 (Sonnet — A5 + A6b LANDED, both audited
and committed same session; ALSO fixed a real A4 regression found during
the audit.)** Render confirmed pointed at `catalog-fk-wave` on the latest
commit (Seth verified), so the A-wave code is confirmed live on staging.
Dispatched A5 (`a5-exercise-picker.md`) and A6b
(`a6b-exercise-id-backfill.md`) to Cursor back-to-back per the v4
batchable-disjoint-files rule; Cursor delivered both, but overwrote its own
`DELIVERY.md` running the second task, so A5's per-criterion evidence
report was lost — audited A5 directly against the tree instead (re-ran
every lane fresh, read the fixture tests to confirm they pin real
behavior rather than trusting the report). **Worth flagging for future
dispatches: DELIVERY.md is single-file, so back-to-back units on the same
task file will clobber each other's report - review right after each stops,
or expect to reconstruct the first unit's evidence by hand.**

Audit surfaced a real bug, not caused by this session's diff: A4's
`resolve.js` added a `userExerciseId` stored-id resolution tier, but
`attribution.js`'s source check was never updated to recognize it (only
matched `"userExercise"`) - so any session exercise resolved via the new
tier (the normal case once A4 stamps ids at write time) silently lost its
muscle attribution entirely. Surfaced because this was the first full
`npm test` run since staging's migration made the tier actually reachable
(`exercises.integration.test.js`'s custom-exercise analytics test failed
with an undefined quadriceps bucket). Root-caused by tracing resolve.js ->
enrichSet.js -> attribution.js; one-line fix, shipped directly per the
direct-fix exception (diagnosis was the bulk of the work) rather than a
Cursor diagnosis-block round trip. **Committed separately from A5/A6b**
since it's outside their FILES TO TOUCH.

Three commits, in order: `0d2118e` (attribution fix), `c7c8ca6` (A5),
`eeaa30c` (A6b) - all pushed, origin confirmed. Full suite re-run fresh
after the fix: 185/185 green (20 suites). Client build green, no hex in
CSS diff, searchCatalog purity/no-portal greps clean, A6b's
`assertSafeForReset` guard + `--apply` gating verified directly (not
trusted from the report). **A-wave is now feature-complete on
`catalog-fk-wave`.** Given the whole wave is backend/script-shaped except
A5's live-session typeahead, and very little of it is visually smoke-able,
Seth explicitly opted to skip his own visual sign-off on A5 and rely on
the mandated Fable/Opus pre-main branch-diff review as the sole gate
before merge. **Next: kick off that review** (it should grep
`HANDOFF-ARCHIVE.md` for the wave's full session history per the standing
rule) - then, if clean, the prod migration choreography (same choreography
as staging, but check prod's `_prisma_migrations` for the same
old-migration-name situation first - unverified) - then "push to main"
(Seth's trigger phrase, gated).

**Updated:** July 7, 2026 latest+2 (Fable — workflow-docs side session, NO
code, NO A-wave movement).** The poor-mans-workflow tracking doc
(`docs/specs/poor-mans-agentic-workflow.md`) gained three sections at
Seth's direction: 6 steering layer (keep-human-on-task + anti-loop
mechanisms, "erosion-resistant not foolproof"), 7 adopter setup interview,
8 measured pilot receipts (~24 units/6 days, zero bounces, 2 prod-breaking
defects caught; old sections 6/7 renumbered 9/10). The public shell repo
(`C:\dev\the-poor-mans-agentic-workflow`) was refreshed in the same
session: source-material re-scrubbed to current v4 files (+ QUEUE and
HANDOFF-ARCHIVE snapshots added as receipts ground truth), BRIEF rewritten
to the v4 story with Seth's publishing decisions settled and written in
(MIT, named-tools-first, provenance-only receipts, on-ramp tone) - it is
now READY for the claude.ai/code buildout. One docs commit here on
`catalog-fk-wave`; the Render staging-service check in the entry below is
STILL the next A-wave action.

**Updated:** July 7, 2026 latest+1 (Sonnet — STAGING MIGRATED: A1 + A4 both
now live on staging; CORRECTS a wrong historical claim below.)** Ran the
staging migration choreography and found ground truth did not match this
file: **the May 27 catalog migration (`20260527120000_add_exercise_catalog`,
from the abandoned pre-A1 branch) was never wiped from staging** — it has
been applied and the `Exercise` table has held all 873 rows, fully seeded,
continuously since May 27. The July 6 entry below claiming "test resets
wiped it from staging, 14 migrations, zero drift" was simply wrong (verified
directly via `_prisma_migrations` + row count query, not inferred). On top
of that, an earlier `prisma migrate deploy` attempt today against staging
(pre-dating this fix) tried to apply the new re-timestamped
`20260707120000_add_exercise_catalog` migration, hit `relation "Exercise"
already exists`, and left a FAILED migration record blocking all further
deploys. **Fix applied (Seth approved all 3 steps):** (1)
`prisma migrate resolve --applied 20260707120000_add_exercise_catalog` to
baseline the bookkeeping onto the schema state that already existed, (2)
`npx prisma db seed` (idempotent — refreshed muscleWeights curation to the
current A2-cleaned 30-key set; row count unchanged at 873, confirmed against
`exercises.json`), (3) `npx prisma migrate deploy` applied A4's
`20260707130000_add_exercise_fk_linkage` cleanly. **Verified directly by SQL
query** (not just `migrate status`): `exerciseId`/`userExerciseId` present on
TemplateExercise/SessionExercise/BlockWorkoutExercise, `blockWorkoutSetId` on
WorkoutSet, all three `_one_identity_chk` CHECK constraints present. The
orphan `20260527120000_add_exercise_catalog` row stays in `_prisma_migrations`
harmlessly (not present locally, but not blocking — matches no local
migration name so `migrate status` will always flag it as drift; low-priority
cleanup candidate, not urgent). **Open question for whoever does the prod
migration:** confirm the SAME old-migration situation isn't also true on
prod before assuming the choreography there starts from a clean slate — this
session did not check prod. **Next: verify whether Render's staging service
is actually pointed at `catalog-fk-wave`** (RUNBOOK step 2 - it normally
tracks `main` and needs manual repointing) before assuming the already-pushed
A4 code is live; confirm deploy SHA in Events either way. Then A5/A6b dispatch.
**Session closed here (Seth, July 7, EOD).** Nothing else in flight - working
tree clean except `.claude/settings.json` (local permissions, untracked
elsewhere) and `claudefiledrop/` (two Discord CDN `.url` shortcuts, not yet
the expected Gemini sprite PNGs). Pick up next session with the Render
check above.

**Updated:** July 7, 2026 latest (Sonnet — A4 LANDED `0743070`; L-wave prod
smoke closed.)** Seth confirmed the L-wave prod smoke (Open TODO #1) is
complete — no issues reported. **A4 (`a4-exercise-fk-linkage.md`) audited and
committed `0743070`, pushed, origin confirmed on `catalog-fk-wave`.** Nullable
`exerciseId`/`userExerciseId` on TemplateExercise/SessionExercise/
BlockWorkoutExercise (+ at-most-one CHECK per model), `blockWorkoutSetId`
groundwork on WorkoutSet, write-path stamping helper
(`server/src/lib/exerciseIdentity.js`, catalog beats userExercise, mirrors
`resolveExercise` tier order), `resolve.js` gains a stored-`userExerciseId`
tier ahead of name resolution. Audit re-ran both lanes fresh (unit 124/124,
`prisma validate` clean — matches `DELIVERY.md`'s claims), confirmed scope
exact against FILES TO TOUCH (13 files, no client touch), verified the
migration SQL by hand (7 ADD COLUMN / 7 indexes / 7 SET-NULL FKs / 3 CHECK,
no DROP/NOT NULL/DEFAULT), confirmed schema types match the block's exact
spec (String? on the Exercise FK, Int? on the UserExercise FK — avoids L3's
wrong-FK-type mistake), and spot-checked `analyticsController.js`'s id
precedence against the pre-existing `exerciseName` derivation precedence
(`sessionExercise ?? templateExercise ?? null`) — identical shape, not
invented. Integration lane written (4 tests) but deliberately NOT run per
the block's sequencing flag. **Migration is NOT applied to any environment
yet.** Next: Seth's staging migration choreography (RUNBOOK, gated) — (1)
`20260707120000_add_exercise_catalog`, (2) `npx prisma db seed` from
`server/`, (3) `20260707130000_add_exercise_fk_linkage`, in that order —
then staging Render redeploy, then dispatch A5/A6b.

---

## Superseded current-state entries (July 7, 2026 latest+1)

**Updated:** July 7, 2026 (Fable — A-WAVE OPENED: Track A structural
exercise identity. A1 landed direct; A4/A5/A6b authored and queued.)**
New branch `catalog-fk-wave` (off `logging-ux-wave` HEAD `80373e1` = main
`3767840` + one docs commit). **A1 LANDED `3a6bc25` (Fable direct):** the
stale `exercise-catalog-seed` branch (`c27a6de`, May 27) reconciled by
hand, NOT merged - its package.json predated `test:unit` (a blind merge
would have deleted it) and its prisma.config.ts seed shape predated Prisma
6.19 (`migrations.seed` is the current location; the deprecated
package.json `prisma` block was deliberately skipped). Exercise model added
standalone (no FKs), migration re-timestamped `20260527120000` ->
`20260707120000_add_exercise_catalog` (safe: never applied to prod, and
test resets wiped it from staging - July 6 verification showed 14
migrations, zero drift), seed.js verbatim (idempotent upserts,
`assertSafeForReset` guard), `server/data/README.md` updated for the
curated muscle-weights/aliases reality. `exercises.json` was already
byte-identical on main - data shipped with the engine, only the table
never landed. Unit lane 119/119 + `prisma validate` green; deploy-safe
before its migration (nothing queries the table). **Wave blocks authored
(contract-first): `a4-exercise-fk-linkage.md`** (nullable
exerciseId String? / userExerciseId Int? on TemplateExercise /
SessionExercise / BlockWorkoutExercise + CHECK at-most-one + WorkoutSet.
blockWorkoutSetId groundwork for block plan-vs-actual; write-path stamping
helper; engine gains a stored-userExerciseId tier; schema snippet in the
block IS the contract - L3's wrong-FK-type lesson), **`a5-exercise-picker.
md`** (pure searchCatalog + GET /exercises/search + live-session typeahead
writing ids on commit; free text stays first-class), **`a6b-exercise-id-
backfill.md`** (dry-run-default script stamping historical rows; unresolved
report feeds alias curation). **Migration choreography (Seth, RUNBOOK,
gated): after A4 lands - staging gets catalog migration, then `npx prisma
db seed`, then the A4 linkage migration, in that order (stamped FK values
need catalog rows), then Render redeploy, then A5/A6b.** A4's sequencing
flag is app-wide (regenerated client selects new columns on every
template/session/block read). Housekeeping this session: stale TODO #0
closed (reps `step="1"` verified at SessionDetailPage.jsx:934 - L6 fixed
it), moot `prod-migrate-l1-l3-prep.md` task file deleted (prod migrations
were applied by hand July 6), QUEUE rewritten for the A-wave. **Next:
dispatch A4 to Cursor; Seth's prod smoke of the L-wave on `3767840` is
still outstanding (list below).**
(Superseded: its claim that staging's May 27 catalog migration was "wiped"
by test resets was WRONG - see the July 7 latest+1 HANDOFF entry that
corrects this from a direct DB query. Also superseded by A4 landing and
the staging migration choreography completing.)

## Superseded current-state entries (July 7, 2026 latest+2)

**Updated:** July 6, 2026 latest+1 (Opus — T3B "basic" cold-start lifter
loader MERGED TO MAIN; Gemini sprite upgrade queued.)** `logging-ux-wave`
fast-forwarded onto `origin/main` again — clean ff `451a3d6..3767840`, two
commits only: `73becdc` (feat: animated lifter mark on the cold-start boot
loader) + `3767840` (QUEUE doc). No migrations, no schema, no server change —
client CSS + docs only; **prod DB untouched**, deploys the client to prod
Vercel. Local + origin `main` both at `3767840` (local ref fast-forwarded to
match; ff push straight to `origin/main`, no checkout — avoids the OneDrive
lock hang). **What shipped:** the page-tone `LoadingState` (ProtectedRoute's
sole `tone="page"` user — the boot screen shown while `/auth/me` wakes a cold
Render server) swapped its breathing ring for an accent-tinted pixel-lifter
mask (`client/src/assets/brand/lifter.png`) doing a CSS-transform "rep"
(translateY + scaleY, `coldstart-lift`/`coldstart-glow` keyframes, lockout
glow, reduced-motion static, label cross-fade + delayed reveal untouched).
**This is a deliberate PLACEHOLDER** — Seth judged the single-silhouette bob
"not professional" (no articulation, no face). **Queued upgrade (decided this
session):** replace it with a real 3-frame full-color expressive pixel sprite —
Rack (bar at shoulders, elbows bent) / Drive (mid, gritted-teeth effort) /
Lockout (bar overhead, arms straight) — looped **A-B-C-B** via CSS `steps()`.
Art direction settled: full-color expressive mascot, ONE master character
recolored per palette (unique-per-theme, like the scene rasters). **Seth
generates the 3 frames in Gemini** (hero-then-image-edit workflow; prompts
handed off this session — flat limited palette, neutral skin / chalk-gray
singlet / steel bar so recolor is clean, feet+hips locked across frames to
prevent jump), drops the transparent PNGs in `claudefiledrop/`; then Claude
Code slices+aligns into a sheet, builds the `steps()` A-B-C-B animation,
generates the 4 palette recolors, wires it into `LoadingState`/`index.css`,
refreshes the preview harness. **Preview harness exists:** a standalone
Artifact (real sprite mask + real per-palette tokens + exact keyframes, with
palette/theme/motion/size controls) to judge the loader without a cold-start
wait or deploy — reuse/refresh it when the real sprite lands. **Verify (Seth,
browser):** Vercel prod Events show `3767840` deployed. Next: Gemini frames ->
sprite upgrade.
(Superseded: still the current plan for T3C, just archived for HANDOFF
capping - see the "Next up" section in HANDOFF.md for the live pointer.
Note as of this archiving: the two files dropped in `claudefiledrop/` are
Discord CDN `.url` shortcuts, not yet the expected transparent PNG frames.)

## Superseded current-state entries (July 7, 2026)

**Updated:** July 6, 2026 latest (Opus — L-wave MERGED TO MAIN; prod migrations
applied + verified first.)** `logging-ux-wave` (`d927fb8`) fast-forwarded onto
`origin/main` — the whole L-wave (L1/L2/L2B/L3/L4/L5/L6 + A6), the off-queue
login-UX + resume-hero fixes, and the docs/relay-v4 restructuring are now on
`main`. **State correction:** `main` was NOT at `750c42b` as the older entries
below say — `ui-nav-overhaul` had already merged (main was at `516d249`, nav
features live), so the feared merge-order conflict was moot and the What's New
copy (which advertises the nav overhaul) is accurate. Merge was a clean ff
(`516d249..d927fb8`), no worktree, no conflicts; local + origin `main` both
confirmed at `d927fb8`. **Prod DB migrated FIRST (schema-ahead-of-code, the
safe order), by Seth by hand in the prod Neon SQL editor
(`ep-solitary-sea-an56mioq`), verified this session from his screenshots:**
`WorkoutSet.side` (`text`) exists; `UserExercise` table has its 6 columns;
`_prisma_migrations` went 12 -> 14 rows. Both ledger rows carry the real
staging checksums (pulled read-only this session):
`20260704120000_add_workout_set_side` =
`0dea47c048f0d8db874880e3a32200d0da46c09e0eac1769e83dbe7eb312308c`,
`20260704130000_add_user_exercise` =
`4b2195e0821ef9e6df5afd2b55fcb3b8246fbbe6f297d0ec185e927da645866b` (both
`applied_steps_count` 1). **Next: verify prod Render/Vercel Events show
`d927fb8` deployed, then smoke prod** — analytics/summary end-to-end (the path
the L3 flag threatened), unilateral L/R logging, the tracked-exercise pills +
add-to-library sheet, and the What's New modal firing once. Pre-existing Open
TODOs (#1-6) below still stand. Cursor's migration-prep branch
(`origin/cursor/prod-migrate-l1-l3-prep-0b4a`) is now redundant — deletable
whenever.
(Superseded by the July 7 entry recording the L-wave prod smoke as complete
and A4 landing on `catalog-fk-wave`.)

## Superseded current-state entries (July 6, 2026)

**Updated:** July 6, 2026 late night (Fable — two Seth-directed direct UX
fixes landed off-queue on `logging-ux-wave`, disjoint from all L-wave
files; origin confirmed at `c0d37fb`.)** (1) `3a530a7`: logged-out
first-open no longer sits on the "Loading session…" boot spinner waiting
for a cold server - no stored `authToken` means ProtectedRoute redirects
straight to `/login` (the form renders instantly; `/auth/me` still fires
and warms the server in the background). `/login` now bounces
already-signed-in users onward (covers the valid-cookie/cleared-storage
edge), and a definitive `/auth/me` 401 clears the dead stored token.
(2) `c0d37fb`: finishing (or deleting) a workout now dispatches a
`sessions:changed` window event from `sessionApi`; `ActiveSessionContext`
applies it locally at once and re-fetches - the home "Resume workout"
hero/persistent bar clear immediately instead of surviving until the 20s
poll or a manual refresh. Both verified end-to-end (Playwright against a
local server on the staging DB; register -> start -> finish -> home flip,
plus logout/reload/login-visit probes; throwaway staging account
`smoke_fable_jul6` created in the process). This session was the "second
agent" flagged in QUEUE's L5-audit warning - flag resolved in QUEUE, the
L5 audit's leave-it-out call was correct. **Add to Seth's combined smoke:
open the app logged-out (should land on login instantly) and finish a
workout (Resume hero should vanish on return to Home).** Next unchanged:
Seth's combined smoke -> Fable pre-main branch-diff review -> merge.
Previous entry retained below for continuity.

**Updated:** July 6, 2026 (Fable — relay v4: two-tier state channel +
Cursor rebalance. Docs-only session, no app code touched.)** HANDOFF is now
CAPPED: current state, repo/deploy state, the latest 1-2 session entries,
Open TODOs / Next up, and the short reference sections. Everything older
moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (append-only, newest first —
Fable greps it for pre-main review and big-picture work; Sonnet and Cursor
never load it). Workflow changes codified in CLAUDE.md ("v4"), AGENTS.md,
`cursor-task-block-template.md`, and `docs/tasks/` (template + README):
Cursor now self-verifies and writes a `DELIVERY.md` report (repo root,
gitignored) before stopping; Sonnet AUDITS that report against the tree and
re-runs only the cheap lanes fresh (unit + client build — never trusts the
report for green tests) instead of re-deriving the whole delivery; bugs get
a Cursor DIAGNOSIS block first (root cause + evidence + proposed fix, no
code); the direct-fix exception is now stated (when diagnosis was ~95% of
the work and the fix is trivial, the diagnosing agent ships it — everything
else goes to Cursor, however small); non-colliding units may batch two
Cursor blocks per review session. All gates unchanged: single git/state
writer, migration track, pre-main Fable review, "push to main" verbatim.
**Next: unchanged from the entry below** — Seth's smoke of
`/analytics/summary` end-to-end, then the combined
L1+L2+L2B+A6+L6+wheel-fix backlog, then L4 dispatches.
Previous entry retained below for continuity.

**Updated:** July 6, 2026 (Sonnet — L3's CRITICAL SEQUENCING FLAG resolved:
migration applied to STAGING, independently verified.)** Seth applied the
`UserExercise` migration to staging manually per RUNBOOK "Schema-change
deploy" (same precedent as L1). Independently re-verified this session
(verify-before-trust): `npx prisma migrate status` against staging -
Datasource resolved to `ep-bitter-breeze-am81izlh` (confirmed correct
staging host, never `ep-solitary-sea-an56mioq` prod) - "Database schema is
up to date!", 14 migrations, zero drift. Direct `information_schema.columns`
query confirms the `UserExercise` table exists with the exact columns L3
shipped (`id`, `userId` **text** - matching the deliberate String-not-Int
deviation from the block, `name`, `normalizedName`, `muscles` jsonb,
`createdAt`). Staging Render root (`https://workout-db-staging.onrender.com/`)
responds 200 `{"message":"WorkoutDB API running"}` - not crash-looping, so
the feared app-wide `/analytics/summary` 500 (every user, not just
custom-exercise users, per the flag) is no longer live now that the table
exists ahead of/alongside the deploy. **Not independently verified this
session (needs Seth):** the exact deploy SHA in Render's Events tab (should
read `fbb054b` or later - confirm before treating this as fully live), and
an authenticated end-to-end hit on `/analytics/summary` (root health alone
doesn't exercise the `userExercise.findMany` code path the flag was about).
**Next: Seth's smoke** - `/analytics/summary` end-to-end first (the specific
path the flag threatened), then the still-pending combined
L1+L2+L2B+A6+L6+wheel-fix backlog (custom-exercise CRUD has no UI yet - L4
builds that) - then L4 dispatches.
Previous entry retained below for continuity.

## Superseded current-state entries (July 5, 2026)

**Updated:** July 5, 2026 latest+4 (Sonnet — L3 landed `fbb054b`, pushed to
`origin/logging-ux-wave`. CRITICAL SEQUENCING FLAG, unresolved.)**
Cursor executed `l3-custom-exercises-server.md`; reviewed and committed (12
files, +830/-65). Scope exact match to the block's FILES TO TOUCH. One
deliberate correct deviation from spec: `UserExercise.userId` is `String`,
not the block's stated `Int` - the block's schema snippet was wrong,
`User.id` is `String @default(cuid())`; `Int` would have been a broken FK.
Delivered: `UserExercise` model + migration (hand-authored, matches
existing migration rendering); `GET /api/exercises/muscles` (17-muscle
vocabulary, catalog-derived, not hardcoded); custom-exercise CRUD (POST
rejects catalog/alias-resolvable names and duplicate normalizedNames,
GET/DELETE both userId-scoped, DELETE 404s in the standard
not-found-shape on not-own-or-missing, matching the existing pattern used
across every other controller); `resolveExercise` gained an optional
third `userIndex` arg, catalog+alias still wins on collision, then the
user overlay, `source: "userExercise"` threaded through
`/exercises/resolve`; `userExercises.js` (pure, no Prisma) has
`buildUserExerciseIndex` + `userExerciseWeights` (primary 1.0/secondary
0.5, same fallback convention as `attribution.js`); `enrichSet` gives a
user-exercise resolution a synthetic `catalogEntry.id = user:<id>` so
`aggregateExerciseMetrics`'s existing id-keyed grouping works unmodified;
`analyticsController.getSummary` now also fetches the caller's
`UserExercise` rows and builds the overlay index. Server unit lane
119/119 (new pure tests: weights math, catalog-beats-user precedence,
unresolved-stays-unresolved-with-overlay, a user-exercise set landing
fractional volume in `perMuscle`). Purity grep
(`prisma\|@prisma` under `server/src/analytics/`) - zero hits. Client
untouched, `server/package.json` byte-identical. Integration tests
WRITTEN (custom CRUD happy path, cross-user isolation 404, catalog-name
rejection, resolve endpoint's `userExercise` source, summary
end-to-end volume) but deliberately NOT RUN - `npm test` would
auto-apply the parked migration, exactly the gate the block specified.
**CRITICAL SEQUENCING FLAG (same class as L1's, caught in review before
any further action):** `analyticsController.getSummary` now
unconditionally runs `prisma.userExercise.findMany({ where: { userId } })`
on EVERY summary request, not just when a custom exercise is involved.
Staging Render is repointed to `logging-ux-wave` and auto-deploys on
push - once it redeploys at `fbb054b`, `/analytics/summary` will 500 for
ALL users (not just custom-exercise users) until the `UserExercise`
migration is applied, because the regenerated Prisma client will expect a
table that doesn't exist yet on staging. **Not yet done: apply the
migration to STAGING per RUNBOOK "Schema-change deploy" (confirm
`noisy-surf`/`ep-bitter-breeze-am81izlh` host, same as L1 - never prod)
before or immediately after this redeploys; verify `npx prisma migrate
status` clean afterward, same as the L1 precedent.** Only after that:
Seth's smoke (custom exercise CRUD via API/client is not built yet - L4
is the UI - so this session's smoke is really "does the rest of the app,
especially analytics, still work" - the summary endpoint end-to-end is
the thing to check first) - then L4 dispatches (custom-exercise UI,
builds on this).

**Updated:** July 5, 2026 latest+3 (Sonnet — root-caused + fixed the
weight->reps promotion glitch that survived L6, `ae49cbe`, pushed to
`origin/logging-ux-wave`.** Seth reported it was "still a little glitchy
sometimes when switching from weight to reps" even after L6 + the
wheel-scroll fix. Root cause was structural, not timing: `SessionExerciseBlock`
rendered the 0-sets branch as a bare `<div>` wrapping the draft
`SessionSetRow`, and the >0-sets branch as a `<>` Fragment wrapping the row
list + add-set footer. Switching element TYPE (div vs Fragment) at that one
JSX position forces React to unmount the entire old subtree on every
draft->real promotion, no matter what key the inner row carries - so the
Weight/Reps `<input>` was destroyed and recreated mid-keystroke every single
time an exercise's first set was logged, regardless of L6's rAF
focus-search hack (which could only refocus a NEW element, not prevent the
old one's destruction). Fixed by unifying both branches under one
persistent Fragment/div shell (branching only INSIDE it) and giving the
row that transitions from draft to real (index 0, non-per-side) a stable
key (`session-set-slot-${se.id}`) shared across both states. React now
reuses the same fiber/DOM node across the transition, so the pre-existing
echo-suppressing resync effect (from L6) picks up the handoff for free -
focus and cursor position are never disturbed, no hack needed. Removed the
now-dead id-search-and-refocus block in `tryPromote` (the draft row never
unmounts anymore, so it had nothing left to do). Client build + lint
verified clean (one pre-existing unrelated `sessionExerciseId`
exhaustive-deps warning fixed as a trivial side effect of the removal; all
other lint errors on the file predate this change and are untouched).
**Not yet smoked by Seth** - fold into the next combined smoke pass.
Previous entry retained below for continuity.

**Updated:** July 5, 2026 latest+2 (Sonnet — L6 landed `cac5999`, then a
follow-up wheel-scroll fix `4d82311`, both pushed to
`origin/logging-ux-wave`.** Seth's report right after the L6 push ("weight
adds a decimal randomly when I move fast, same for tracked/untracked") is
a DIFFERENT bug, not a regression in L6: Chrome/Edge nudge a focused
`type="number"` input by its `step` on wheel/trackpad scroll — Weight's
`step="0.01"` means scrolling past a still-focused field silently appends
a decimal, independent of tracked status (matches the report exactly).
Same root cause as the old reps decimal bug (`9112eda7`, May); L6's
`step="1"` change only shrank reps' exposure, it didn't stop the wheel
from acting on either field. Fixed directly (mechanical, 1-line-per-field):
`onWheel={(e) => e.currentTarget.blur()}` added to both Weight and Reps
inputs (the only two `type="number"` inputs in the file) so scrolling
defocuses instead of mutating the value. Build re-verified green. All three root-cause mechanisms fixed exactly
per the block: focus handoff from the draft row to the promoted real row
(`document.activeElement` check right after the `await` resolves, before
React's unmount/remount commits, then a `requestAnimationFrame` retry-once
to find the new field once it has), an echo-equality check in the resync
effect that skips `setDraft` when the server's PATCH response matches the
draft already held (no more pointless re-render in the blur gap), and the
tracked pill now rendering inside a fixed-size `inline-grid` slot (hidden
sizer + stacked pill, `grid-area: 1/1`) so its null -> pill transition
never reflows the heading. Reps `step="0.01"` -> `step="1"` folded in
(weight untouched). Reviewed clean: client build green, all acceptance
greps pass (`session-exercise-tracked-slot` in both files, `step="0.01"`
count now 1, `log-set-` handoff construction present), no new hex, no new
deps, `package.json` byte-identical, scope exactly the 2 specced files
(usual stray unrelated `.claude/settings.json` permission edit left
uncommitted). No bounces. **Next: Seth's combined smoke of
L1+L2+L2B+A6+L6 (+ the wheel fix)** (verify staging Render redeployed at
`4d82311` first; the L6 block's own manual-verification notes — Slow-3G
weight-to-reps typing test, and pill-appearing-must-not-move-inputs on a
rename — plus a scroll-past-a-focused-Weight/Reps-field check for the new
fix, are the smoke's focus), then L3 -> L4 -> L5, strictly serialized. Release copy in `client/src/data/whatsNew.js` still DRAFT.
**`ui-nav-overhaul` still CLEARED FOR MERGE awaiting Seth's "push to main"
trigger phrase** — the L-wave branch stacks on top of it; reconcile
`logging-ux-wave` after that merge lands.)

---

## Session log (July 5 latest+3 — weight->reps promotion glitch root-caused + fixed, Sonnet)

- **Seth's report:** "still is a little glitchy sometimes when switching
  from weight to reps" - after both L6 (focus handoff, resync echo, pill
  reflow) and the wheel-scroll fix had already landed, so this was a
  residual symptom, not a fresh regression.
- **Root-caused by reading the render branch, not by live repro:**
  `SessionExerciseBlock`'s sets area had two top-level branches at the same
  JSX position - `sets.length === 0` rendered a bare `<div
  className="session-set-rows">` wrapping the draft `SessionSetRow`;
  `sets.length > 0` rendered a `<>` Fragment wrapping the row list plus the
  add-set footer. React's reconciler keys off element TYPE at a given tree
  position before it ever looks at a child's `key` - div vs Fragment is a
  type change, so EVERY draft->real promotion unmounted the whole subtree
  and mounted a fresh one, destroying and recreating the Weight/Reps
  `<input>` out from under the user's keystrokes. L6's rAF
  id-search-and-refocus hack could only refocus a brand-new element after
  the fact; it could never stop the old one from being destroyed first -
  that destruction (not a focus race) was the residual "glitchy" feel.
- **Fixed structurally:** unified both branches under one persistent
  Fragment/div shell (the `sets.length` check now only decides what renders
  INSIDE it), and gave the row that transitions from draft to real (index 0
  of `renderUnits`, non-per-side only - per-side sets never go through a
  draft) a stable key, `session-set-slot-${se.id}`, shared by both its
  draft and real-set renders. Same key + same position + now-same wrapper
  type = React reuses the existing fiber and DOM node across the
  transition instead of remounting. The pre-existing echo-suppressing
  resync effect (added in L6, previously only exercised on later edits)
  now also naturally absorbs the draft->real handoff: it sees the draft
  already matches what the server just echoed back and returns without
  calling `setDraft`, so focus/cursor position are never touched - no hack
  needed at all.
- **Removed the now-dead code in `tryPromote`** (the
  `document.activeElement` id-search + double-`requestAnimationFrame`
  refocus block from L6): with the row never unmounting, it had nothing
  left to do. Left the OTHER piece of L6's promotion logic untouched (the
  in-flight-keystroke patch onto the newly-created set) - that one is
  about syncing the SERVER's copy across the async gap, unrelated to
  DOM/focus identity, still needed regardless of remounting.
- **Verified:** client `npm run build` green; `npm run lint` clean on this
  file except pre-existing, unrelated errors/warnings that predate this
  change (confirmed by their line numbers sitting in untouched code -
  `ActiveSessionContext.jsx`, `ThemeContext.jsx`, `DashboardPage.jsx`, and
  three `set-state-in-effect` findings elsewhere in this same file, none
  touched by this diff). One lint warning WAS caused by this edit
  (`sessionExerciseId` became an unused `useCallback` dependency once the
  dead block was removed) and was fixed by dropping it from the deps
  array.
- **Committed `ae49cbe`** (1 file, +49/-71), pushed, confirmed on
  `origin/logging-ux-wave`. No live browser repro was done this session
  (no staging URL/credentials in hand) - the diagnosis and fix are from
  direct code/render-semantics reading, same precedent as L6's own
  no-repro-needed diagnosis.
- **Not yet done:** Seth's smoke - specifically, re-run the L6 smoke notes
  (Slow-3G weight-to-reps typing test) on `ae49cbe` and confirm the
  glitch is gone; fold into the same pending combined
  L1+L2+L2B+A6+L6+wheel-fix smoke below.

## Session log (July 5 latest+2 — wheel-scroll decimal bug fixed, Sonnet)

- **Seth's report immediately after the L6 push:** "when i go to weight
  too fast it will add a decimal randomly, same for tracked and untracked
  exercises" — the "same for tracked/untracked" phrasing ruled out the
  pill work, pointing at something field-level and independent of L6's
  actual changes.
- **Root cause (code read, no live repro needed):** Chrome/Edge's native
  behavior for a FOCUSED `<input type="number">` is to nudge the value by
  `step` on mouse-wheel/trackpad scroll. Weight (`step="0.01"`) and Reps
  (`step="1"` as of L6) are the only two `type="number"` inputs in
  `SessionDetailPage.jsx` (grep-confirmed). Scrolling the page while one
  of these is still focused (e.g., right after tapping it, mid-flick to
  see more of the screen) silently mutates the value — for Weight this
  reads exactly as "a random decimal appears." This is the same
  underlying mechanism as the old reps decimal bug (`9112eda7`, May,
  logged July 4 latest+10) — that fix only changed reps' `step`, which
  narrowed its exposure but never addressed the wheel behavior itself, and
  never touched Weight at all.
- **Fixed directly** (mechanical one-liner per field, no relay needed):
  `onWheel={(e) => e.currentTarget.blur()}` added to both inputs — a
  scroll over a focused Weight/Reps field now defocuses it instead of
  changing its value. Client build re-verified green. Committed
  (`4d82311`, 1 file, +2), pushed to `origin/logging-ux-wave`.
- **Not yet done:** folded into the same pending combined smoke as L6 (see
  above) — Seth should also try scrolling/flicking past a focused
  Weight/Reps field and confirm the value no longer moves.

## Session log (July 5 latest+1 — L6 landed, Sonnet)

- **Cursor executed `l6-logging-focus-interruptions.md`; Sonnet reviewed
  and committed (`cac5999`, 2 files, +113/-49), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 2 specced files; usual
  stray unrelated `.claude/settings.json` permission edit left
  uncommitted). Client build green. Verified all three fixes by direct
  diff read against the block's root-cause writeup:
  - Focus handoff (`tryPromote`): the `document.activeElement?.id`
    prefix check runs synchronously right after the `await` resolves —
    before React's scheduler actually commits the unmount/remount, so
    the draft field is still focused at check time — then a
    `requestAnimationFrame` (retry once on the next frame, silent
    give-up, never throws) does the actual `getElementById` + `.focus()`
    once the promoted row has committed. `sessionExerciseId` correctly
    added to the callback's dependency array.
  - Resync echo suppression: `echoedKey` computed once, compared against
    the current draft's key; equal -> set `lastSentKeyRef` and return
    with no `setDraft` call; the pre-existing focused-row guard is kept
    unchanged immediately after, for the genuinely-different case.
  - Tracked pill: `session-exercise-tracked-slot` (`inline-grid`) wraps
    an always-rendered hidden sizer (widest "Not tracked" markup,
    `aria-hidden`, no title) plus the real pill, both `grid-area: 1/1`;
    `margin-left: 8px` moved from the pill class to the slot. CSS diff
    is structural-only, no new hex.
  - Reps `step="0.01"` -> `step="1"` confirmed the only such change
    (grep count 1, weight untouched).
  All acceptance-criteria greps re-run and passed; `package.json`
  byte-identical. Clean delivery — no bounces, no reviewer fixes needed.
- **Not yet done:** Seth's combined smoke of L1+L2+L2B+A6+L6 on
  `cac5999` (verify staging Render redeployed at that SHA first) — for
  L6 specifically, the block's manual notes: Slow-3G throttle, type a
  weight on a fresh 0-set exercise, click straight into Reps and keep
  typing (focus/keystrokes must survive the promotion), and rename an
  exercise then click Weight (the pill landing must not shift the
  inputs). L3 dispatches after sign-off (carries the `UserExercise`
  migration — Cursor must NOT run `npm test`).

## Session log (July 5 latest — A6 designed + landed, Fable)

- **Design settled (the escalation's question):** aliases live in VENDORED
  DATA (`server/data/exercise-aliases.json`, alias -> catalog id), not a
  DB table/column (the catalog itself is a vendored file that never
  touches the DB — a migration would be wrong-layer and drags in the
  gated migration track for nothing) and not client-side (L2 already
  enforces no client catalog duplication). Curated + deterministic, NO
  fuzzy matching: a fuzzy false positive silently books volume against
  the wrong muscles; the honesty principle prefers a true "Not tracked".
  One mechanical rule rides along: a trailing-s plural fold (guarded
  against "ss" endings so "press"/"leg press" are safe, and against
  <=3-char strings), applied to catalog names at load AND queries at
  lookup — buys "squats", "push ups", "chin ups", and singular queries
  against plural catalog entries ("seated cable row" -> "Seated Cable
  Rows") without curating every plural.
- **Executed directly by Fable, no relay** (hybrid precedent from July 4:
  block-authoring would cost the same Fable tokens as just doing it, and
  the alias curation is itself the judgment work). 92 aliases, every
  target validated against the catalog by the authoring script (which
  also caught that "Seated Calf Raise" exists verbatim and would have
  been shadowed); `loadCatalog()` re-validates at load with warn-and-skip
  (unknown target / shadows-real-name / duplicate), matching the existing
  collision pattern. `resolveExercise` precedence: exerciseId > exact
  normalized name > alias/fold > unresolved; alias hits report
  `source: "alias"` and carry the target `catalogEntry`, so attribution,
  the resolve endpoint, and the L2B pill all work unchanged.
- **Ambiguity calls recorded in `server/data/exercise-aliases-rationale.md`**
  (same-commit rule, like muscle-weights): "bench press" -> Barbell Bench
  Press - Medium Grip; OHP family -> Standing Military Press; "dip" ->
  Dips - Triceps Version; "pec deck" -> Butterfly; "lunge" -> Dumbbell
  Lunges; etc. Deliberately NOT aliased: bulgarian split squat, pendlay
  row — genuinely missing upstream, aliasing to a neighbor would
  misattribute; they're the motivating cases for L3 custom exercises.
- **Verified:** unit lane 111/111 (8 new resolve tests incl. the pinned
  10-name smoke list at 10/10 and a no-alias-shadows-real-name sweep);
  direct node check: all 10 smoke names + 26 broader colloquial spellings
  resolve to the right canonical ids, gibberish still false. Integration
  lane deliberately NOT run: the endpoint is untouched (pure-function
  change) and `npm test` resets the staging DB — would wipe smoke
  accounts right before Seth's pending sign-off.
- **Committed `3f7fe14`** (6 files: 2 new data/doc, 3 engine, 1 test),
  pushed, confirmed on `origin/logging-ux-wave`. Stray
  `.claude/settings.json` edit left uncommitted per standing precedent.
- **L3/L4/L5 dispatch UNPAUSED** (QUEUE.md updated; A6 NOTE added to the
  L3 block: "resolves against the catalog" now includes alias/fold hits,
  no spec change needed). A6 QUEUE candidate closed out as a pointer.
- **Same session, second ask — L6 authored from Seth's follow-up smoke
  report** ("tracked check can interrupt tapping weight/reps; same thing
  sometimes going weight -> reps"). Fable root-caused three independent
  mechanisms, all in SessionDetailPage.jsx: (1) the 0-set DRAFT set row
  unmounts mid-interaction when its promotion POST resolves (`sets.length`
  0 -> 1 swaps the ternary at ~line 1265 and destroys the reps input the
  user just tapped — data survives via the in-flight-keystroke patch,
  focus does not); (2) the real-row resync effect fires on the server
  ECHO of a flush if the PATCH lands in the blur gap between weight and
  reps (activeElement is body, so the focused-row guard misses); (3) the
  tracked pill renders null -> pill when the async resolve lands,
  reflowing the heading (and re-wrapping it at narrow widths) under the
  user's finger. `l6-logging-focus-interruptions.md` authored + QUEUED
  (MODEL sonnet, 2 files): focus handoff draft -> promoted row via the
  deterministic field ids, echo-equality skip in the resync effect,
  always-rendered fixed-size pill slot (inline-grid + hidden sizer), and
  the pre-existing decimal-reps `step="0.01"` Open TODO folded in (reps
  -> `step="1"`, weight untouched). Dispatch order now L6 -> L3 -> L4 ->
  L5 (L6 collides with L4 on both files, none with L3; landing L6 first
  lets one smoke pass cover the whole stack).
- **Not yet done:** dispatch L6 (Seth points Cursor at it); Seth's
  combined smoke of L1+L2+L2B+A6+L6 once L6 lands (verify staging Render
  redeployed at the reviewed SHA first); then L3 dispatches (carries the
  UserExercise migration — Cursor must NOT run `npm test`; Seth applies
  per RUNBOOK before L4).

## Session log (July 5 earlier — resolution gap found, escalated to Fable, Sonnet)

- **Seth smoked L2B via two phone screenshots** (dropped as Discord-CDN
  `.url` shortcuts in `claudefiledrop/`, fetched directly since the
  folder held only shortcuts, not the actual images): a live session with
  a real "Bench press" exercise showed the dashed "Not tracked" pill —
  same as a gibberish-named exercise ("Sheghdjksishbe") in the same
  session. Visually the pill itself renders correctly for both states;
  the problem is which state "Bench press" gets assigned.
- **Root-caused by reading the resolve chain end to end** (client cache ->
  `POST /exercises/resolve` -> `resolveExercise` -> `loadCatalog`): all of
  it behaves correctly per its own contract. `resolveExercise`
  (`server/src/analytics/resolve.js`) does exact
  `normalizeExerciseName` match against `catalog.byNormalizedName`, built
  straight off `entry.name` in `server/data/exercises.json` with zero
  alias/fuzzy layer. That catalog (873 entries, vendored free-exercise-db)
  simply has no bare "Bench Press" record — only qualified variants
  ("Barbell Bench Press - Medium Grip", "Dumbbell Bench Press", "Machine
  Bench Press", "Bench Press - Powerlifting", etc.).
- **Confirmed the blast radius with a direct node check** against 10
  common colloquial lift names: bench press, squat, deadlift, overhead
  press, pull up, push up, bent-over row, curl, lat pulldown all resolve
  `false`; only "leg press" happened to match a verbatim entry. 9/10
  failure rate on exactly the names a real user types — this is not an
  edge case, it's the common case.
- **This is the standing A6 candidate** ("name-resolution
  backfill/aliasing", QUEUE.md Candidates section, previously noted as
  needing A4 first) — it was already known-missing, just not yet visible
  because L2B is what made the resolved/unresolved status legible enough
  to notice from a screenshot.
- **Put the fork to Seth directly** (escalate now vs. quick alias patch
  vs. continue L-wave and fix later): **Seth chose escalate to Fable now.**
  Per CLAUDE.md's model-split rules this is squarely Fable-tier (data-
  model/matching-strategy judgment, not mechanical) — Sonnet does not
  design the resolution strategy, only flags it clearly and stops.
- **L3 dispatch PAUSED.** L3 (custom-exercises server, `UserExercise`
  table + resolver/attribution overlay) is exactly the kind of unit that
  would compound this gap if built on top of it unresolved — worth
  having Fable weigh in on whether A6 should land before or alongside L3.
- **Not yet done:** a Fable session to design A6 (likely: alias table or
  fuzzy/normalized-substring matching over the existing catalog — schema
  question is whether aliases live in new rows, a new column, or a
  client-side synonym map; Fable's call). Once that's designed and
  queued, L3/L4/L5 dispatch resumes. Seth's L1+L2+L2B mechanical smoke
  sign-off is otherwise clear to give independently of this finding.

## Session log (July 5 later — L2B landed, Sonnet)

- **Cursor executed `l2b-tracked-indicator-visibility.md`; Sonnet reviewed
  and committed (`ef4ac98`, 2 files, +27/-17), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 2 specced files; the usual
  stray unrelated `.claude/settings.json` edit left uncommitted). Client
  build green, server unit lane 103/103 (no server touch, as expected).
  `grep session-exercise-tracked-badge` -> zero hits (old classes fully
  replaced). Package.json byte-identical both sides, no new hex - the
  resolved pill uses the success-token family exactly as specified
  (`--color-success-bg/border/text`, defined for both light and dark),
  the unresolved pill keeps the dashed-border pattern via `color-mix` off
  `--color-text-secondary`. Placement matches spec exactly: indicator
  moved out of the muted `session-exercise-heading-meta` span, now a
  direct sibling before `summaryLine`. **One acceptance-criterion grep
  didn't literally match** (`>Tracked<`/`>Not tracked<` assumes compiled-
  HTML shape; the JSX source has `Tracked`/`Not tracked` as plain text
  children on their own line, not wrapped in `>...<`) — verified by direct
  read instead (both labels present, correctly gated per status), same
  precedent as N1's `tryNavigate` grep-wording mismatch. Not bounced.
  Clean delivery otherwise - no reviewer fixes needed.
- **Not yet done:** Seth's combined smoke of L1 + L2 + L2B on `ef4ac98`
  (per-side toggle, tracked-exercise resolution, and now the pill's
  legibility across palettes x light/dark on both collapsed and expanded
  headings, plus ~360px width wrap behavior). L3 dispatches after
  sign-off — it carries the `UserExercise` migration, so Cursor must NOT
  run `npm test` on it.

## Session log (July 5 — L2B + What's New: skeleton built, two blocks authored, Fable)

- **Seth's two asks this session:** (1) the tracked checkmark AND the
  not-in-database state must be far more obvious to the user; (2) a
  "What's New" feature joins this cycle before anything merges to main —
  Overwatch-patch-notes feel (release date + what changed) but in the
  LogChamp aesthetic/theme, skeleton built now, and Fable personally owns
  the checkmark design (still executed via a Cursor block, per the relay).
- **L2B block authored (`l2b-tracked-indicator-visibility.md`, MODEL
  sonnet):** the 14px glyph tucked in the muted "· N sets" meta text
  becomes labeled status pills rendered as their own element on the
  heading line — "Tracked" (success-token family: bg/border/text, NOT
  accent, so it reads as status rather than something selectable) and
  "Not tracked" (dashed border, muted text — the dashed semantics carry
  over from the old hollow circle). Exact placement, classes, CSS values,
  and the success-vs-accent rationale are written into the block so
  Cursor implements rather than improvises. L4 compatibility preserved:
  all pill markup stays inside `ExerciseTrackedIndicator`, and L4's
  entry-point wording was amended in place to build on the pill.
- **What's New SKELETON built directly by Fable (T3 pattern - structure/
  behavior in-session, visuals to a block), client build green:**
  - `client/src/data/whatsNew.js` — versioned releases array (newest
    first), `LATEST_RELEASE`, `formatReleaseDate`; bumping the top entry's
    `id` is what re-fires the modal per device. Seeded with DRAFT copy for
    this merge train (analytics/logging/navigation/look-and-feel sections)
    — Seth finalizes wording + date at merge time.
  - `client/src/lib/whatsNewStorage.js` — `workoutdb-whats-new-seen`
    localStorage key (rename-boundary compliant; accessor pattern copied
    from `weightUnitPref.js` for later account-level promotion).
  - `client/src/components/whatsnew/` — `WhatsNewGate` (logged-in only,
    fires once per device per release, mounted in `Layout.jsx`),
    `WhatsNewModal` (fixed-overlay pattern from `UsernameRequiredModal`,
    inside #root so no portal/stacking hazard; dismiss = Got it, backdrop,
    Escape, or the see-all link; role=dialog + aria wiring),
    `WhatsNewContent` (one release: date kicker/title/tagline/sections —
    shared by modal + archive page).
  - `client/src/pages/profile/WhatsNewPage.jsx` at `/profile/whats-new` —
    full archive, newest first, profile sub-page pattern (back pill,
    settings-page-title); visiting marks the latest release seen. New
    "What's new" settings row on the Profile hub.
  - `client/src/index.css` — structural rules only under a comment
    explicitly marking them SKELETON for L5 to replace/extend.
- **L5 block authored (`l5-whats-new-visuals.md`, MODEL fable —
  judgment-heavy visual design, same reasoning as T3's visual block):**
  the Overwatch translation — announcement-poster header band, strong
  accent-derived section headers, bullet rhythm, ONE restrained entrance
  (150-250ms, ease-out), archive page as a changelog of posters. Gate/
  storage/dismiss/a11y/data all explicitly off-limits.
- **Dispatch order updated in QUEUE.md: L2B -> L3 -> L4 -> L5, strictly
  serialized** (index.css + SessionDetailPage collisions; L2B before L4
  because L4's entry point builds on the pill). U11 candidate closed out
  as promoted into the wave.
- **Not yet done:** dispatch L2B (Seth points Cursor at it); Seth's
  combined smoke of L1 + L2 + L2B once L2B lands (supersedes the pending
  `0ee1a51` re-smoke — one pass covers all three); everything else in
  Open TODOs unchanged.

## Session log (July 4 latest+10 — L1 blank-toggle bug found + fixed, Sonnet)

- **Seth reported L1 + L2 "changes aren't showing" on the `logging-ux-wave`
  staging deploy**, with two screenshots showing the session-edit form
  displaying `9.98`/`9.99` in the Reps field (docs/smoke-tests/
  L2-DECIMAL-REPS-SMOKE.md, committed this session alongside the images).
- **Decimal-reps triage (code read, no live repro needed):** the Reps
  `<input type="number">` (SessionDetailPage.jsx ~line 883) has
  `step="0.01"`, copied from the adjacent Weight field which legitimately
  needs decimals. The native spinner/mouse-wheel-over-focused-input
  decrements by 0.01 per tick — two ticks down from 10 gives exactly
  `9.99` then `9.98`, matching both screenshots. `git blame` traces this to
  `9112eda7` (May 5, 2026), ~2 months before L1/L2 — confirmed unrelated to
  either feature, would reproduce on `main` too. **Not fixed yet** (out of
  L-wave scope, low severity) — see Open TODOs.
- **The checkmark badge in the screenshots (next to "Set 1") is also
  unrelated** — it's the pre-existing "Saved" sync badge (`f8f3cb0`, April),
  not L2's tracked-exercise indicator. L2's indicator renders in the
  exercise's collapsed heading line ("· N sets ✓"), never in the open
  edit-form view the screenshots showed — so those screenshots couldn't
  have shown it either way.
- **Live-tested both features directly** (Playwright browser, since reading
  code alone couldn't confirm runtime behavior): the documented staging
  smoke credentials (`smoke_b8` / `SmokeTest-B8-2026`) returned 401 — gone,
  almost certainly wiped by the full `npm test` re-run recorded in the
  latest+9 log below (integration lane resets the staging DB on every run,
  a standing AGENTS.md gotcha). Registered a throwaway account
  (`smoke_lwave`) instead to keep testing unblocked.
  - **L2 confirmed working:** naming an exercise "Barbell curl" and
    blurring the field triggered `POST /exercises/resolve` (200) and the
    heading correctly rendered "Tracked - counts toward your analytics"
    with the check icon.
  - **L1 bug found:** toggling `L/R` on while the exercise still had 0 sets
    made the entire sets area render `null` (SessionDetailPage.jsx line
    ~1266, `perSideMode ? null : (<SessionSetRow isDraft .../>)`) — no
    input fields, no visible affordance, indistinguishable from the
    feature not working. The toolbar's "+ Add set" button was still present
    and functional underneath (clicking it correctly created a real
    Left/Right pair against the migrated `side` column) but nothing in the
    empty state pointed at it.
- **Fix applied and pushed (`0ee1a51`):** the `null` branch now renders a
  one-line hint ("Tap \"+ Add set\" above to log your first left/right
  pair.") using the same `session-empty-sets` class as the existing
  completed-session empty state — no new architecture, no CSS, reuses the
  working "+ Add set" control. Client `npm run build` re-verified green.
  Committed separately from the original L1 unit for a clean scope
  boundary; pushed straight to `origin/logging-ux-wave` (`11a9f0e..0ee1a51`,
  confirmed via `git log origin/logging-ux-wave`).
- **Not yet done:** Seth's re-smoke of L1 (retry the L/R toggle on a fresh
  exercise, confirm the hint + "+ Add set" now reads as working) and L2
  (check the collapsed-heading checkmark, not the open edit form) on
  `0ee1a51`. L3 dispatches after this sign-off, same as before.

## Session log (July 4 latest+9 — L1 landed + migration applied to staging, Sonnet)

- **Cursor executed `l1-unilateral-side-logging.md`; Sonnet reviewed and
  committed (`4ae0fbf`, 6 files, +470/-56), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 6 specced files, plus the
  new hand-authored migration file; same stray unrelated
  `.claude/settings.json` edit left uncommitted as before). Server unit
  103/103, client build green (the only two lanes safe to run before the
  migration existed anywhere - integration deliberately NOT run yet, per
  the block's own gate). Schema diff is exactly the one `side String?`
  line; migration.sql is exactly one `ALTER TABLE` statement. Delivered:
  `validateOptionalSide` follows the codebase's existing optional-field
  validator pattern; per-side mode derives reactively from
  `manualOverride ?? (anySetHasSide || /\bsingle\b/i.test(name))` so the
  name-based trigger re-derives for free on every name commit with no
  special-case code; set-count control and add/remove operate on L/R
  pairs (`groupSetsIntoRenderUnits` degrades an odd trailing row to a
  plain labeled row rather than crashing); the Right-weight autofill on
  Left blur reuses the PRE-EXISTING focus-guard effect (row skips
  resyncing from the `set` prop while it contains focus) - so "must not
  steal focus" came for free from infrastructure already in place, not
  new code. CSS tokens-only, no hex. Clean delivery - no bounces, no
  reviewer fixes needed.
- **CRITICAL SEQUENCING FLAG caught in review (before any deploy):** the
  controller unconditionally includes `side` (defaulting to `null`) in
  EVERY set-creation call, not just per-side sets. Once `prisma generate`
  regenerates the client with the new field, ANY set creation - not just
  the new feature - would 500 against a database missing the `side`
  column (Postgres "column does not exist"). This is the exact
  code-ahead-of-DB hazard from the June 8 incident, but sharper here:
  normal logging breaks app-wide, not just the new surface. Flagged to
  Seth before any Render repoint.
- **Migration applied to STAGING, done by Seth manually (browser agent,
  RUNBOOK "Schema-change deploy"):** confirmed host `noisy-surf` /
  `ep-bitter-breeze-am81izlh` throughout, never touched
  `snowy-resonance` / `ep-solitary-sea-an56mioq` (prod). `ALTER TABLE
  "WorkoutSet" ADD COLUMN "side" TEXT;` run, `_prisma_migrations` row
  inserted with checksum `0dea47c048f0d8db874880e3a32200d0da46c09e0eac1769e83dbe7eb312308c`
  (SHA-256 of the committed migration.sql, confirmed to be pure-LF/49
  bytes so the hash is checkout-independent), column verified present via
  `information_schema.columns`. Staging Render (`workout-db-staging`)
  repointed from its prior branch to `logging-ux-wave`, redeployed at
  `4ae0fbf`.
- **Independently re-verified by Sonnet after Seth's report (verify-
  before-trust):** `npx prisma migrate status` against staging ->
  "Database schema is up to date!", 13 migrations, zero drift (confirms
  the manually-inserted checksum was accepted cleanly). Full `npm test`
  (both lanes) re-run fresh -> **16 suites / 143 tests, all green**,
  including the L1 side-round-trip integration test (create with
  `side:"L"` round-trips, `side:"X"` -> 400, PATCH `side:null` clears it)
  now running for real against the migrated column, and L2's
  `/exercises/resolve` tests still green alongside it - no regression
  from the schema change.
- **Not yet done:** Seth's visual/manual smoke of L2 (tracked indicator)
  + L1 (per-side logging: name-trigger, L/R toggle both ways, pair
  add/remove, weight autofill L->R, non-per-side flow unchanged) on the
  `logging-ux-wave` Render+Vercel staging deploy. **L3 dispatches only
  after that sign-off** (L3 also carries a migration - `UserExercise`
  table - so the same code-ahead-of-DB discipline applies again).

## Session log (July 4 latest+8 — L2 landed, Sonnet)

- **Cursor executed `l2-tracked-exercise-indicator.md`; Sonnet reviewed and
  committed (`f66f9ea`, 6 files, +293/-12), pushed to
  `origin/logging-ux-wave`.** Scope exact (the 6 specced files; one stray
  unrelated `.claude/settings.json` permission-list edit found in the
  working tree, left uncommitted/unstaged as out of scope, same precedent
  as the N3 stray edit). Server unit lane 103/103, client build green,
  integration lane re-run fresh (3/3: 401 unauthenticated, 400 on
  `names: []`, happy path resolving a real catalog name + rejecting a
  fake one) - confirmed no pending migrations, safe per the block's own
  note. Delivered: `POST /exercises/resolve` (batched, `authRequired`,
  caps at 100 names, imports `resolveExercise` from
  `server/src/analytics/resolve.js` - engine untouched); client
  `exerciseApi.js` mirrors `analyticsApi.js`'s shape; SessionDetailPage
  gained a module-level resolution cache (keyed by trimmed-lowercase
  name, survives session navigation) populated by one batched call per
  session load plus a single-name re-resolve after `onExerciseCommitted`;
  quiet check-circle (resolved) / hollow dashed circle (unresolved)
  indicator via inline SVG, tokens-only color-mix off
  `--color-interactive`/`--color-text-secondary`, network failures render
  no indicator rather than a wrong one. The acceptance grep
  (`normalizeExerciseName\|exercises.json` in `client/src`) found one hit
  in `smartWorkoutName.js` - verified pre-existing and unrelated (a
  different, unchanged helper for smart session-naming, not catalog
  duplication) - not a violation. Clean delivery - no bounces, no
  reviewer fixes needed.
- **Not yet done:** dispatch L1 (`l1-unilateral-side-logging.md`) - Cursor
  must NOT run `npm test` on it (parks an unapplied `WorkoutSet.side`
  migration that pretest would silently apply).

## Session log (July 4 latest+7 — L-wave authored + misc fixes, Fable)

- **Seth's batch of five asks, split hybrid at his choice** (Fable does the
  tiny items directly, authors blocks for the big ones - cheaper than
  full-relay for small items since block-authoring costs ~the same Fable
  tokens as just doing them):
  1. Unilateral "single" logging -> L1 block
  2. Tracked-workout indicator -> L2 block
  3. Custom exercise creation (name + per-muscle intensity) -> L3+L4 blocks
  4. Profile sub-page back button too small -> fixed directly
  5. "Is feedback actually going somewhere?" -> audited directly
- **New branch `logging-ux-wave`** off `ui-nav-overhaul` HEAD (`516d249`) -
  NOT off main, because the fixes touch N2's profile sub-pages which don't
  exist on main yet. After the pending ui-nav-overhaul -> main merge, this
  branch fast-forwards cleanly over it.
- **Back-link fix (direct):** `.settings-page-back` restyled from a muted
  small text link to a tappable pill chip (border + `--color-nav-active-bg`
  fill + focus ring off `--color-interactive`, matching the range-chip
  pattern); dropped the `muted small` classes on the three profile
  sub-pages. Tokens only. Client build green.
- **Feedback pipeline audit (no code change needed):** submissions POST to
  `/api/feedback` -> `Feedback` table in whichever DB the deployed server
  points at; reviewers read them at `/dev/feedback` (reviewer-gated both
  ends). Code is sound. THE GAP IS CONFIG, not code: `client/.env` (which
  holds `VITE_FEEDBACK_REVIEWER_EMAILS`) is NOT committed, so the Vercel
  build only shows Seth the Dev feedback row if that var is set in the
  Vercel dashboard; likewise the server check needs
  `FEEDBACK_REVIEWER_EMAILS` set in Render's env (both prod + staging
  services). 30-second self-test for Seth on prod: open Profile - if the
  "Dev feedback" row is visible, the Vercel var is set; click it - if
  entries load (not a 403), the Render var is set too. Both vars =
  `sethjknisel@gmail.com` (matching is case-insensitive).
- **L-wave authored + QUEUED (all MODEL: sonnet, MODE: 1-relay), dispatch
  strictly serialized L2 -> L1 -> L3 -> L4** (order rationale + per-unit
  scope in QUEUE.md). Two gated migrations ride this wave: L1 adds
  nullable `WorkoutSet.side` ("L"/"R"), L3 adds the `UserExercise` table
  (per-user custom exercises with primary/secondary muscle designations
  feeding the engine's existing fallback attribution math). Cursor is
  forbidden from running `npm test` in L1/L3 (pretest would auto-apply
  the parked migrations to staging); Seth applies each per RUNBOOK before
  the next unit needs it. Seth settled the "single" ambiguity: it means
  UNILATERAL per-side L/R entry (not 1-rep singles), right side defaults
  its weight from the left.
- **Not yet done:** dispatch (starts with L2 once Seth points Cursor at
  it); Seth's visual smoke of the back-link pill on the branch Vercel
  deploy; the two env-var checks above; and the still-pending
  ui-nav-overhaul merge (item 0 below).

## Session log (July 4 latest+6 — Fable pre-main review of ui-nav-overhaul)

- **Seth smoked N3 on the branch Vercel deploy — passed** (with N1/N1b/N2
  already passed, the whole N-wave has visual sign-off).
- **Fable pre-main branch-diff review DONE (the v3 mandated gate).** Full
  `main...ui-nav-overhaul` diff (20 files, +1490/-380) read against all four
  task blocks. Verified: N1 guard extraction is behavior-identical (every
  Navbar per-link handler maps exactly onto `guardedClick`'s end/prefix
  short-circuits); N2 sub-pages are verbatim extractions (markup, state,
  API calls) and `profileStats` matches its weekStreak contract; N3 is a
  pure JSX reorg with the fetch effect untouched (`[weeks]` deps). Cross-
  cutting: zero hex in added CSS (the one rgba box-shadow matches 12
  pre-existing occurrences); `.workout-tab::before` exists ONLY as a
  dark-theme rule, so N1b's single dark override is complete scene-lift
  coverage; both `body::before` base rules precede the lift override (and
  `:has` outranks them on specificity anyway); the sticky-top override
  correctly follows its base rule; all Layout routes are ProtectedRoute
  (Login/Register live under AuthLayout), so the mobile chrome rules are
  effectively logged-in-only. Re-ran both lanes fresh: client build green,
  server unit 103/103.
- **One reviewer fix (`3a1a7fc`, pushed):** the profile hub gated its
  stat-tile em-dash placeholder on bare `sessionsLoading`, but
  ActiveSessionContext re-enters loading on every 20s background poll —
  all three tiles flashed to dashes every 20 seconds while sitting on
  /profile. Now gated on loading AND `sessions.length === 0` (initial load
  only). Root cause was the N2 block's own wording ("while loading render
  an em dash"), not a Cursor error.
- **Two accepted nits, recorded not fixed:** (1) on the live session detail
  page `.app:has(.persistent-workout-bar) .main` still adds its +64px pill
  clearance even though the pill itself is hidden there (the bar is in the
  DOM inside the display:none wrap, so `:has` matches) — ~64px of extra
  scroll headroom above the finish dock, invisible in practice; (2) a
  cold direct load of /profile can paint one frame of "0" before the
  provider's effect flips loading true — unreachable in practice since the
  provider fetches at app mount, well before /profile can be visited.
- **VERDICT: cleared for merge.** Nothing ships to main without this pass;
  it has now happened. Merge stays gated on Seth's "push to main" verbatim
  (then one command at a time per the gate). No schema/migration coupling
  anywhere in the N-wave (client + docs only).

## Session log (July 4 latest+5 — N2 smoked, N3 landed, Sonnet)

- **Seth smoked N2 on the `ui-nav-overhaul` Vercel deploy — passed.**
  Confirmed N3 does not touch analytics engine/data, only page layout. N3
  dispatched immediately after.
- **Cursor executed `n3-analytics-subviews.md`; Sonnet reviewed and
  committed (`f5767f8`, 3 files, +102/-4), pushed to
  `origin/ui-nav-overhaul`.** Scope exact (the 3 specced files, nothing
  extra - one unrelated stray edit to `.claude/settings.json` found in the
  working tree, left uncommitted/unstaged as out of scope, flagged to
  Seth separately); client build green; no new hex in the CSS diff; the
  fetch `useEffect`'s dependency array confirmed still `[weeks]` only (grep
  verified) so switching views triggers no refetch; `client/package.json`
  and every other file under `client/src/components/analytics/` untouched.
  Delivered: `AnalyticsViewTabs.jsx` (page-level segmented control, same
  aria pattern as `ChartTableToggle`, active cell via `--color-nav-active-bg`
  / `color-mix`); `AnalyticsPage.jsx` restructured so `view` lives in
  `?view=` via `useSearchParams` (`parseAnalyticsView` defaults any
  unknown/absent value to `muscles`, `setSearchParams(..., { replace: true
  })` so switching tabs doesn't spam history), StatTiles + tabs persistent
  above the swapped body (muscles -> PerMuscleSection + BalanceSection,
  strength -> PerExerciseSection, execution -> ExecutionSection),
  DataQualitySection always last on every view; empty-range state still
  replaces tabs + body with the single empty card. Clean delivery - no
  bounces, no reviewer fixes needed.
- **N-wave is now fully landed on `ui-nav-overhaul`** (N1 `d266242`, N1b
  `b366e17`, N2 `4dcd829`, N3 `f5767f8`) - all four units in, nothing left
  queued for this branch.
- **Not yet done:** Seth's visual smoke of N3 (view switching via tabs,
  `?view=strength`/`?view=execution` deep-links, `?view=bogus` falls back to
  muscles, range-chip refetch preserves the selected view, empty-range state
  still shows no tabs). After sign-off: the Fable/Opus pre-main
  branch-diff review (mandated by the v3 workflow, not optional) before any
  merge to `main` - gated on Seth's "push to main" trigger phrase as always.

## Session log (July 4 latest+4 — N1b smoked, N2 landed, Sonnet)

- **Seth smoked N1b on the `ui-nav-overhaul` Vercel deploy — passed.** No
  critiques recorded; N2 dispatched immediately after.
- **Cursor executed `n2-profile-hub.md`; Sonnet reviewed and committed
  (`4dcd829`, 9 files, +652/-273), pushed to `origin/ui-nav-overhaul`.**
  Scope exact (the 9 specced files, nothing extra); client build green;
  `client/package.json` byte-identical; no new hex in the CSS diff (the one
  `rgba(15, 23, 42, ...)` box-shadow matches the pre-existing established
  pattern used elsewhere in `index.css`, not a new token violation).
  Delivered: `ProfilePage.jsx` is now the hub (initials avatar, name/email,
  "Member since" from `createdAt`, 3 stat tiles wired to
  `useActiveSession()` with em-dash loading placeholders, settings rows to
  the three sub-routes + conditional Dev feedback row, logout footer
  unchanged); `AppearancePage.jsx`/`SecurityPage.jsx`/`FeedbackPage.jsx` are
  verbatim extractions of the old ProfilePage sections (confirmed by diff
  against the pre-N2 file — identical class names, state logic, and API
  calls), each with a `← Profile` back link; `profileStats.js`
  (`countCompleted`/`countThisWeek`/`weekStreak`, Monday-based local weeks)
  verified by direct node eval against all 5 of the block's acceptance
  assertions (3/2/1/0-streak cases + the last-Sunday exclusion), all passed;
  `reviewerEmails.js` centralizes `parseReviewerEmails` — grep confirms it
  only lives there, Navbar's diff is a pure import swap (`canReviewFeedback`
  in, local parser out), zero behavior change. Copy fix verified: "Help
  improve LogChamp." present in `FeedbackPage.jsx`, old "WorkoutDB." string
  gone repo-wide. Clean delivery — no bounces, no reviewer fixes needed.
- **Not yet done:** Seth's visual smoke of N2 on the branch Vercel deploy
  (hub layout, stat tile values against real seeded data, sub-route back
  links, Dev feedback row gating). N3 dispatches after sign-off.

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

---

## Open forks — SETTLED (Seth, July 4, pre-merge)

1. **Theme storage** — went with the proposed default: device-local (matches existing appearance setting, zero schema change), all reads through one accessor so account-level promotion later is one swap + an additive migration.
2. **Login tagline** ("Log your shit dog") — went with the proposed default: keep, with a trigger condition: it changes the day a stranger can sign up. One constant either way.

---

## Analytics/catalog track — full build history (B1–B9, Track B v1)

*Archived July 6, 2026; section header below kept verbatim (its status line is stale — Track B v1 merged to main `e9ce82c`, July 4). Live open items stay in HANDOFF.*

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
