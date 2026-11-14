# HANDOFF — current state

> **Nov 14 (cloud session, design seat): ARENA ROUND 1 DESIGN IS DONE AND
> SETH SAID GO ("Looks and feels good").** Read this note before any
> older ARENA note below; where they differ, this one wins.
> - **Design of record:** `docs/design/mocks/motion/arena-draft-3.html`
>   (Artifact https://claude.ai/artifact/TCamsFYqboRqw6VVFJqoiX) plus
>   `docs/design/mocks/motion/ARENA-ROUND-1.md` beside it (a ruling for
>   every ledger item 1-10, the state matrix, the build file list).
>   `arena-draft-2.html` is history. Commits `cd5bc64`, `3c25636` and the
>   one that carries this note, on `claude/inspiring-darwin-s2cr9p`.
> - **What changed since the older notes (do not build from them):**
>   (a) the scoreboard strip (18svh) is for the live logger and live Home
>   ONLY; every other folded page, Coach included, gets a thin RAIL
>   (item 8) - so "Coach stays on the strip" now reads "Coach stays
>   folded: the rail". (b) Under Arena the live logger is one row (name,
>   Setup, X) then the lifts; the hotbar and the view switch move into the
>   Setup sheet (item 9). (c) The live logger lights Home, one clock, the
>   room has a roof, slide-up sheets are skinned (items 3-6). (d) The
>   strip's History / Library / Profile / Analytics faces from AR4/AR5
>   are no longer shown on the strip; they stay on the room's board.
> - **Seth's condition on the GO:** every feature of the app carries
>   over (he named importing workouts). ARENA-ROUND-1.md "Nothing is
>   lost" states how: Arena is a skin over the same pages, unlisted
>   routes keep their page and get the rail, only the logger's controls
>   move, and the build proves each route.
> - **BUILT (Nov 14, later): ar-r1b LANDED `58d2615`** on
>   `ccr-ac9fe067-pc08f1` (= `claude/inspiring-darwin-s2cr9p` + this
>   session). Cursor named credit is capped to 11/18 (Opus and GPT-5.6
>   Sol both refused), so Seth sent it to the AUTO rung: one bounce
>   (strip miscut, block-day n OF total, sheet skins, flushSync, rail
>   apostrophe, proofs), then three reviewer fixes - sticky exercise
>   header now stops under the folded stage; Finish now really takes the
>   fade path and Home opens at the top on the SAVED room (RouteTransition
>   read the stage mode after ArenaStage had already switched it); a
>   reopened workout keeps its "Editing" line. Detail in QUEUE.
> - **Seth's standing call (Nov 14):** if a Cursor delivery fails twice
>   this wave, the Opus seat takes the edits itself (Sonnet does not
>   re-check that work); proof sweeps go to a Sonnet subagent.
> - **Light smoke DONE (Sonnet subagent, Nov 14):** all 10 checks pass at
>   412 + 360 (state matrix with typing, strip, rail, Coach box, one-row
>   logger, Finish with zero errors and the SAVED room, roof, Nothing is
>   lost, 5 palettes, Arena OFF). Two defects fixed in-seat at `868b801`
>   (strip follows the typed name; short pages fold all the way to the
>   rail). Three left open as ledger rows 11-13 (Reopen under the bar at
>   360, no in-progress bar on Coach - both pre-existing - and a note).
> - Seth smoked ARENA round 1 on his phone (Nov 14): "look nice but had
>   some missing features" - see the next bullet. Not merged anywhere.
> - **Nov 14, Seth's phone smoke of round 1 - two findings, both ruled
>   and built in-seat (Seth gave the frontier seat the final say and
>   leave to edit directly), ledger rows 14-15:** (14) the logger's quick
>   toggles are back under Arena as one slim chip row under the one row
>   (RIR / RPE, Exercise notes, Repeat last, plus a Table chip); Setup
>   still opens the sheet. (15) A folded room stays folded across a tab
>   change (`lib/arenaFold.js`; RouteTransition starts the new page at
>   its fold end, a cut with scroll anchoring off); leaving a page open
>   arrives open; the logger's exit still opens Home at the top.
>   ARENA-ROUND-1.md items 8 and 9 carry the amendments. Proved in the
>   cloud rig at 412 + 360: every chip toggles the logger, the row fits
>   at 360, fold carry across all five tabs, reduced motion, Arena OFF
>   unchanged, zero console errors; unit 587/587, build, check-hex clean.
> - **Next action (human):** Seth re-smokes those two on his phone and
>   signs off round 1 or adds ledger rows. Rows 11-13 are still open.
> - Not in this round, unchanged: AR6 light-mode arena, AR7 Arena as
>   default, swipe-to-walk, What's New (bookmarked).

> **FOR THE OPUS SEAT (Nov 13): Fable is NOT a standing dependency.**
> Fable 5.2 is on Cursor today, but it can leave, get quota-capped, or
> be unavailable for a wave. Do not plan a wave around it. When it is
> not there:
> - **Check before dispatch:** `cursor-agent --list-models` for the named
>   model. Quota or usage refusal -> descend the ladder (named -> auto,
>   `dispatch-unit` section 3) and log the descent in the QUEUE notes.
> - **Design passes without Fable:** the Opus seat draws the design
>   itself, in the artifact, from the same brief (`ar-r1a` shape:
>   rulings for every ledger item, every state drawn, `ARENA-ROUND-1.md`
>   with the state matrix and file list). Seth still does the one look
>   before any build.
> - **Build blocks without Fable:** use the best available named model
>   for judgment work (Opus), `auto` for mechanical units. The block
>   contract (artifact as spec, state matrix, side-by-side proof) does
>   not change with the model.
> - **Never fill a design gap with invented rules.** If Fable is out
>   and the artifact does not draw it, the frontier seat draws it first.
> - **Record who delivered** in the QUEUE notes (model + rung), so the
>   audit knows what it is reviewing.
> - The landing audit and light smoke are model-independent; the
>   reviewer's checks do not get looser when the executor changes.

> **Nov 12, later - Seth's first phone smoke of the ARENA wave (sign-off
> RESET):** (1) DEFECT - Coach: "you can't type, can only use recs" -
> the ask box is not on screen (his shot: Arena ON, live workout
> running, strip shows the live clock, no composer anywhere above the
> nav). Lead hypothesis, unverified: `.coach-page` is sized to 100dvh
> minus the nav, so under Arena the stage strip (and the workout bar)
> push the composer below the bottom nav. -> diagnosis block first.
> (2) DESIGN - "the weird timer background isn't crazy appealing" (the
> strip scoreboard: huge LED clock on near-black) and "not sure what to
> do from here in terms of creativity" - Seth floated handing the
> creative call to a Fable design pass. DECIDED Nov 13: keep smoking,
> collect every critique in `docs/tasks/ar-critique-ledger.md`, then ONE
> Fable round (design on the artifact first, Seth go/tweak, then one
> build unit for the look + every FIX), based on the artifact and
> Fable's instructions.

> **Nov 12 (cloud session, Opus seat): ARENA WAVE AR3-AR5 LANDED -
> 6/6 complete, STOPPED for Seth's phone smoke.** Run per
> `docs/tasks/AR-WAVE-BRIEF.md` on `claude/inspiring-darwin-s2cr9p`
> (motion-wave + AR1-AR5; not merged anywhere, no PR). Seth's calls this
> session: no Draft 2 nitpick notes - AR3 built from the prototype; What's
> New BOOKMARKED for pre-launch (not authored; QUEUE DRAFT line - covers
> the MX + AR ledger sections). All three units ran Channel B named rung
> (`claude-opus-5-5-medium`, lane `/home/user/worktrees/cursor-lane`),
> serially (the smoke rig binds ports 3000/5173), clean first runs, no
> bounces. Audits: fresh lanes (unit 587/587, build, check-hex), block
> contract node checks, contact sheets vs the prototype. Accepted calls
> per unit are in QUEUE.
> - **AR3 `cfc6da7`** - the page's skin: `client/src/styles/arena-skin.css`
>   (every selector under `html[data-arena]`) + one import in `main.jsx`.
>   Squared outlined panels, accent rule on feature cards, square dark
>   inputs, display face on titles / numbers. Arena OFF pixel-identical.
> - **AR4 `38362ef`** - boards from real data: `lib/arenaFacts.js`
>   (pages publish what they already fetched) + `lib/arenaBoards.js`
>   (pure faces). Four Analytics faces, Home week faces, BLOCK Wn board,
>   chalkboard dots + answer lines. No new requests (ON/OFF lists equal).
> - **AR5 `a152bf9`** - places: hashed crowd + front row (last 7 days) +
>   steady marker on the selected workout; past-workout strip (date +
>   name); earned banners as crowns; Library / Profile strip headlines and
>   full-view lines.
> - Not in this run (brief): AR6 light-mode arena (design gap), AR7 Arena
>   as default (Seth's call after smoke). Open calls still defaulted:
>   Coach stays on the strip; no swipe-to-walk.
> - Older AR session notes (Draft 2, AR1/AR2/AR2f landings, the headless
>   smoke) moved verbatim to HANDOFF-ARCHIVE.md (Nov 12 entry).

**Next action:** see the Nov 14 note at the top - the design step is
done and Seth said go; the build block is next (frontier seat). New
phone findings still go in the ledger as new rows. The checklist below
describes the app as landed at AR5 (old strip); it is superseded where
ARENA-ROUND-1.md rules otherwise.

## ARENA wave smoke - AR1 through AR5 (Arena view ON unless noted)

Turn on Profile > Appearance > Arena view (beta). Dark mode first, champ.

Stage and motion (AR1, AR2f):
- Scroll Home: the room and the page edge move together and fold to the
  scoreboard strip - no swoop, no gap. Home -> Coach shrinks without a gap.
- Arrival size: History shows the stands to the top row; Library the
  whole program board and rack; Profile the three banners and lockers;
  Home and Analytics the board with its crown. Too much room, or right?
- Start a workout, go Home: scoreboard strip, not the big room; finish:
  the room is back with SAVED + the name cut at a word.
- Tap the room -> full view; switch tabs, still full view; tap -> back.
- Coach typing box stays above the keyboard.

Look closer (AR2):
- Hold the arena on Home -> full view + 3x zoom; drag pans; pinch in /
  tap steps back; a tab change steps back. Any stutter at 3x?
- Find the crowned Log in the far stands, tap it zoomed: it presses a
  bar, the crowd waves, the line above the tabs reads LOG CHAMP.
- Zoomed: chalkboard fine print, "1" on your locker.
- Tap the Home crown 5x -> crowns rain inside the arena.
- Hold Start empty workout -> the bar lifts; let go -> drops; the press
  still starts a workout (Android: no context menu?).

Page skin (AR3):
- Home: cards square and outlined, Last 7 days lamps square, PR chip
  readable, the main button still rounded.
- Live workout: square dark inputs, numbers in the display face, done
  tick unchanged, Finish rounded.
- Walk Analytics, History, Coach, Library, Profile - nothing broken or
  unreadable. Open a running block (`/blocks/current`) - NOT seen
  headless (seed had no block): does it look right?
- Try iron and light mode once (light is AR6's - readable is enough).

Boards (AR4):
- Analytics: switch Muscles / Strength / Exercises / Execution - the
  board follows, bars charge in once; scrolled, the strip reads the
  view's headline; on 4 weeks the line says "last 4 weeks".
- Home board + strip cycle 7 DAYS sets / workouts / TOP SET / TOP GAIN /
  RECORDS (RECORDS counts every PR row - want distinct lifts instead?).
- Library with a running block: the rack board reads BLOCK W<n>, done
  days lit, the next day mid tone.
- Coach: ask something - dots on the board and strip, then the answer's
  first words in chalk; full view while it thinks: "The coach is thinking".

Places (AR5):
- History: a hashed crowd, a front row of this week's workouts, a bright
  marker on the newest seat. Open an older workout from the list: the
  strip reads its date + name; in full view the marker moved, the line
  reads "<name> · seat k of n".
- Library strip (scrolled): BLOCK W<n> / <done> OF <total> DAYS, or
  LIBRARY / <n> WORKOUTS with no block.
- Profile: earned banners are crowns, the rest show 100 / 1K dim; strip
  reads STREAK / <n> WEEKS; full view "<n> week streak · k of 3 banners hung".

Everywhere:
- Arena view OFF: the app looks exactly as before.
- Reduced motion on: nothing new moves; Home strip stays on its first face.
- Feel only a phone can judge: smooth fold and tab walk, haptic ticks,
  pinch feel, real long-press on Start.


## Smoke for the next round (carry forward - fill at each landing)

Everything through MXF10 is smoked and PASSED (Nov 9; history in the
archive). MXF11 `1bf3ee7` - functionally passes per Seth ("definitely
works in the barest sense"), feel NOT signed off. Its items, to re-run
after the feel pass (start a workout so the bar shows, then go to
Analytics):
- Drag the workout bar left or right: it follows your finger and fades;
  let go early -> springs back; past about a third, or a quick flick ->
  flies off. Reopen the app (close it fully) -> the bar is back.
- Scrolling the page with your thumb on the bar never moves it.
- Swipe starting on the bar's X -> it hides; it does NOT ask to discard.
  A plain tap on the X still asks.
- Ask the coach something, leave, swipe the "working" bar away -> when
  the answer is ready the bar returns once as "Coach answered"; swipe it
  again -> gone for good. The answer is in History > Coach either way.
First Nov 10 session (MX-CI crown intro, crown play, MXF12 bar exit and
any-direction drag, loader hand-off, polish 1): STILL UNSMOKED on a phone;
the item-by-item list moved verbatim to HANDOFF-ARCHIVE (Nov 10 entry).
MX7a logger floor + saved moment (Nov 10, second cloud Fable session,
built directly at Seth's ask; `a6338da`; headless-checked only, champ +
crimson dark, champ + forest light, reduced motion):
- Open a quick workout: under "Log workout" a line reads LIVE + a running
  clock + the set count. No "Live session. Updates save..." sentence.
- Log weight + reps on a set: a square tick springs in on the set, the
  row washes once, the header's live pixel pings and the count pops.
  Typing is never interrupted; a focused row never moves.
- "+ Add set" / "+ Add exercise": the new row or lift drops in.
- First set logged: one glint crosses Finish workout.
- The name field reads "WORKOUT NAME", bigger type, the long helper
  sentence is gone (placeholder says it is named for you at finish).
- Finish: Home has NO green "Workout saved" card. The Start card itself
  reads WORKOUT SAVED + the workout's name + sets / minutes, a pixel
  crown stamps onto its corner, a light runs once round the frame; after
  ~5 s it rolls back to "Start a workout". Both buttons work throughout.
- Reduced motion: same words, no travel.
- NOT touched: the block-day logger (its own header and grid), the rest
  dock, the finish sheet (MX9). Block-day finishes still get the saved
  hero.
Champ Arena is the DEFAULT scene (Seth, Nov 10: "PLEASE add champ arena
and make it the new default"; headless-checked only):
- Dark mode, Champ palette: the skyline is gone. The bottom of every page
  is an arena - lifting platform, loaded bar, two light towers, the crown
  banner, stands. Light mode shows it washed, as the skyline was.
- Start a workout: the left tower switches on, then the right, and the
  lights STAY up on every page while the workout is live.
- Finish: the lights flicker like camera flashes for ~2 s, then go low.
- Rest timer runs out: the lights blink once (with the buzz).
- Other palettes: unchanged. Reduced motion: lights just on or off.
- Easter egg: press and hold Start empty workout - the dumbbell curls.
- Stills: `client/src/assets/scenes/champ.png` + `champ-live.png`, drawn by
  `scripts/gen-champ-arena.cjs`; the old skyline is kept at
  `docs/design/mocks/champ-city-retired.jpg`. Wiring: `lib/sceneSignal.js`
  sets `data-scene-live` / `data-scene-cheer` on <html>; the lit layer is
  `html::after` (index.css, "Champ Arena"). Preview page:
  `docs/design/mocks/motion/champ-arena.html` (Artifact
  B89CfhvmvGiF86h7oN4AsE) - its "Room to grow" ideas (seats fill with
  history, plates match the last top set, milestone banners) are NOT built.
UI overhaul direction (Seth, Nov 10 - PROTOTYPES ONLY, nothing in the
app): Seth wants the arena brought forward ("we are absolutely onto
something"). `docs/design/mocks/motion/arena-ui-concepts.html` (three
concepts, Artifact DHV5E4bdodEXcwcsAVNBiL) -> he picked the full rethink
-> `arena-ui-v2.html` ("LogChamp Arena", Artifact in the session log):
one continuous arena, tabs are places (platform / scoreboard / stands /
coach's corner / rack / locker room), one sheet holds all input. His
stated fear: losing what is built. The v2 page's answer: second skin
over existing components, an "Arena view" switch in Appearance (off by
default), one place at a time, Home + logger first. NOT decided, NOT
planned into ROADMAP. Open: light mode, long pages, desktop, keyboard.
ARENA FINAL DRAFT (Seth, Nov 10 - PROTOTYPE, the design to build from):
`docs/design/mocks/motion/arena-final-draft.html`. Seth prefers the
prototype's arena-native sheet over the in-app beta's "old pages under a
stage" ("I like the look of the arena pre merge with the old"). The draft
adds what he asked for: an Advanced analytics view (real charts in the
sheet - reuse the existing analytics components, themed but serious), the
block flow (Home card -> block page at the rack -> block-day logger with
plan + "As planned" -> program board fills), and the whole logger with
every setup option. Its page lists the function map and a build order.
The in-app beta below is the scaffold (stage, camera, signals); the next
step is making each page arena-native per the draft, Home + logger first.
NOT yet planned into ROADMAP / task blocks - needs Seth's go and an Opus
planning pass (this is a wave, not a unit).
ARENA VIEW (BETA) IS IN THE APP (Seth, Nov 10: "one last trial holding
all of the features of the old into the new" - built as a real switch,
not a third mock; headless-checked only, phone + 1280 desktop):
- Profile > Appearance > "Arena view (beta)": Classic / Arena. Off by
  default, this device only (`workoutdb-arena`).
- On: a pixel arena fills the top of every screen and the page is a sheet
  that scrolls up over it. Tabs move the camera: Home = platform,
  Analytics = scoreboard (widens into 8 weeks of sets), History = stands
  (one lit seat per finished workout), Coach = chalkboard, Library = rack,
  Profile = lockers + banners. EVERY page is the existing page, unchanged.
- Board on Home: sets in the last 7 days + a lamp per trained day. Live
  workout: lights up, running clock, SET n, plates added as sets land;
  rest timer = REST m:ss with the lights dipping; finish = flashes +
  SAVED + the workout name.
- Works in all palettes (the room is mixed from the accent) and in light
  mode (the stage stays dark - not designed yet).
- Smoke: every tab, a full workout incl. rest timer and finish, the coach
  page WITH THE KEYBOARD OPEN (never exercised - /coach has its own
  keyboard fit), scrolling long pages, switching back to Classic.
- Code: `components/arena/` (ArenaStage.jsx, arenaEngine.js, arena.css),
  `lib/arenaPref.js`, `lib/sceneSignal.js` (now also emits "set"),
  `Layout.jsx`. Under `html[data-arena]` the bottom scene band is hidden.
- FIXED after Seth's first phone try (same day): the sheet's full-bleed
  trick (100vmax shadow + pseudo) made the page 3x wide, so Android Chrome
  zoomed the whole app out. The sheet is now a real wrapper
  (`.arena-sheet`, Layout.jsx). LESSON: desktop-headless screenshots do
  not show this - check `documentElement.scrollWidth` under a phone device
  profile (Playwright `devices`) for any layout change.
- Not done: analytics views on the board (it shows weekly sets only),
  coach answers on the chalkboard, the block on the program board,
  swipe-to-walk, light-mode arena. Decision pending Seth's phone run:
  keep going place by place, or cut.
Seth, Nov 10: crown intro timing stays AS IS (every cold open).
RESOLVED - was: is ~2 s on EVERY cold open right, or only the first open
of the day? (`TIMING` in `crownIntroEngine.js` holds every duration.)
Open questions for Seth: keep the crown on coach answers + the Analytics
coach card, or the bubble everywhere? `/coach/status` and `/coach/stop`
count against the coach limit - OK? Tapping outside the "still answering"
sheet counts as Open anyway (the answer still saves) - fine?

## PICK UP HERE (next session)

0. **THE ARENA - pick up here (Seth, Nov 10).** He wants the next Fable
   chat to continue from the final draft and "add onto it".
   - **What exists.** (a) The design: `arena-final-draft.html` - one
     continuous pixel arena, tabs are places (platform / scoreboard /
     stands / coach's corner / rack / locker room), ONE sheet holds all
     input; full logger with every setup option, block flow, and an
     Advanced analytics view with real charts. Its page carries the
     function map and a build order. (b) In the app, behind Profile >
     Appearance > "Arena view (beta)": the stage, camera-by-route and
     real workout signals (`components/arena/`, `lib/arenaPref.js`,
     `lib/sceneSignal.js`) - but the PAGES are still the classic pages
     under the stage.
   - **Seth's rulings.** He prefers the prototype's arena-native sheet
     over the beta's "old pages under a stage". Nothing built so far may
     be lost: every feature keeps a home (the draft's map). Analytics
     must keep its serious charts - "Advanced view" reuses the existing
     analytics components, LogChamp-themed but "a tiny bit more serious".
     Two permanent modes is NOT the goal: the switch is a trial that ends
     in Arena-as-default or a cut.
   - **First move next chat:** ask Seth what he wants to add to the
     draft (he said "add onto it"), change the prototype first, and only
     then plan the build. The build is a WAVE: needs his go, a ROADMAP
     section and (on the laptop) Opus-authored blocks; from a cloud chat
     it can only be built directly, as this session did.
   - **Suggested build order (not yet agreed):** sheet + stage on Home
     and the logger -> Analytics with the advanced view -> blocks at the
     rack -> History, Coach, Profile.
   - **Open design questions:** light-mode arena; long pages vs a thin
     arena strip; desktop (sheet as a side panel?); the keyboard owning
     the screen while typing; exercise search / rename inside the sheet
     (not in the prototype); the coach page's keyboard fit under the
     beta (never exercised).
   - **Verification lesson (cost Seth a broken phone view):** a layout
     change is not checked until `documentElement.scrollWidth` equals the
     screen width under a PHONE device profile (Playwright `devices`).
     Desktop-headless screenshots do not show an over-wide page.
   - **Carried from the first Nov 10 session:** Seth asked for a polish
     pass over all the new animations (only "polish 1" done); none of the
     Nov 10 work has a What's New entry yet (add at the wave's unit).
   - **Small fixes offered, not done:** bottom nav highlights History
     while logging; exercise header truncates early; the logger's X means
     discard; exercise-notes box open by default; RPE helper repeated per
     set; two near-duplicate hint lines in the Finish dock.
1. **Continue the MX wave** (opened Oct 9, see the top block):
   - next unit after 0 = the first non-DONE unit in `ROADMAP.md` (MX7
     logger floor, recommended to Seth Nov 9 - or MX5b / MX10 scenes if
     he picks those); write a broad brief (MX0/MX1-4/MX5-6 briefs are the
     pattern), dispatch on Fable 5.2 (named rung), land via `land-unit`.
     The old Fable 5.1 chat `eb56cfff...` can still be resumed for MX
     context, but a fresh 5.2 chat is fine - ROADMAP carries the state.
   - every wave ends with a What's New unit (`_WHATS_NEW.md`); release
     bullets stay at 25 words or fewer. The ledger has the MX section.
   - known lint noise from MX1-4 (lint is not in CI): Cascade.jsx `Tag`
     unused (JSX false positive) + mixed exports; useCountUp setState in
     effect - same patterns as pre-existing files.
   - legacy `.exercise-roster-stat*` rules in index.css are now unmatched
     (cleanup later); `--chart-up/down` live on `.analytics-page`
     (promote to `:root` when MX8/MX9 need them).
2. **Prod migration-history drift - reconcile under "migrate prod"
   before anyone points `prisma migrate deploy` at prod** (found Oct 9):
   - prod HAS the schema for `20260929120000_blocks_v2` and
     `20261006200000_block_exercise_per_side` (`BlockRun` exists,
     `perSide` exists) but NO `_prisma_migrations` rows for them; the
     Oct 7 note that their checksums were copied was wrong. Fix: insert the
     two rows with staging's checksums.
   - plus the older Sept 26 drift (Housekeeping).
   - the helper used for the coach migration (staging-checksum,
     prod-precheck, prod-apply, prod-verify, all through `pg` with the
     creds file) was session scratch; rebuild it the same way - the
     RUNBOOK section 3 ritual, one transaction, never print the URL.
3. **Gate follow-ups (not blockers, none authored):**
   - saved coach conversations have no per-user cap (bounded by the 40 per
     15 min coach limit and the hosted weekly cap)
   - the `/coach` 2 MB JSON parser runs before auth (same shape as
     `/block-templates/import`)
   - conversation paging cursors on `updatedAt` alone (a same-millisecond
     tie could skip a row)
   - `.bk-log-effort-slot` (`bk-log.css`) is an unused rule
   - carried: qol13 cold-server "Loading session" for logged-out visitors;
     qolf1 bar column matched by pathname; qolf1 ConfirmPanel focus ring on
     tap; qol11 `scripts/smoke-coach.mjs --key` inert; no rate limiter on
     `/block-templates/import*` or `/block-runs`; STOWED summary endpoint
     should exclude unfinished sessions (qolf7)
   - MXF6: `/coach/stop` counts against the app-level coach limiter; a
     dropped connection no longer aborts a hung provider stream (provider
     timeouts govern); early stops are held in memory (2 min, 1000 cap)

## Stowed (none authored)

- **Exercise search synonyms - HELD for Seth's own planned change (Oct 7).**
  The pure `searchCatalog` already AND-matches words. "single leg calf"
  misses on a SYNONYM gap ("single" vs "one"). Fold it into Seth's change
  (likely `server/data/exercise-aliases.json` + its rationale doc).
- **Swap an exercise for today on a block day** - PARKED by Seth.
- **Privacy page + ToS (BK0)** - DRAFT until Seth supplies the operator
  name, the contact email and the US state. **BK0's copy must change
  before it queues:**
  - qol10 STORES coach chat content, so the "records only who and when"
    claim is no longer true
  - qol11 makes "encrypted at rest" true for BYO keys
- **CP3** only if prod Render spins down when idle (QUEUE's CP2 notes).
- **CR2 polish** remains the live UI work order (REFERENCE "Still
  governing").
- **Gate note (Oct 7):** no rate limiter on `/block-templates/import*` or
  `/block-runs` (authed, DB-only).

## Open on prod - Seth's checks, none blocking

- **F/E-wave PROD smoke** - still open (the QOL and BK merges were
  smoked on prod Oct 9 / Oct 7 - done):

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed Aug 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on -> the RIR field appears untouched.
- Log a set with effort -> the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** - the highest-value case in the vocabulary.
- Open an OLD completed session -> nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Housekeeping

- **Staging Render tracks `motion-wave`** (probed Oct 11). Repoint it to
  each new wave branch. The STAGING WorkOS
  External Sign-in URI is pinned to the `ai-connector-wave` Vercel PREVIEW
  host - never delete `ai-connector-wave` (or its preview) while that URI
  points at it. If staging ever looks stale, check Render -> Settings ->
  Branch FIRST (Sept 29 lesson).
- **`quality-of-life-updates` = `main` + docs-only state commits** until
  they reach `main` with the next merge.
- **Git cleanup done Oct 7 (Seth's OK):** 112 merged local `cursor/*` and
  `gate/*` branches deleted (`git branch -d`, none refused); the merge
  worktree `merge-main-0927` removed. Old wave branches, `recon/*`,
  `parked/*`, `stash-preserve/*` and all REMOTE branches untouched.
- **Stale `.git/worktrees/merge-main`, `merge-main-0927`, `merge-main-1007` admin dirs**
  (OneDrive lock): git prints `failed to delete ... Permission denied` on
  fetch/commit. Harmless; `git worktree prune` once the lock clears.
- **`claudefiledrop/` (untracked, keep):** holds Seth's Oct 10 smoke
  screenshots (`Screenshot_20261010-170614/-171027.png`). Three older
  tracked PNGs show as deleted - his call, unstaged.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from any recent wave and not blocking (prod's build never runs `migrate
  deploy`): checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

## Repo / deploy state (Oct 9, night - verify from the services)

- **`main` = `b82ad8c`.** Prod Render `workout-db-l3gc` and prod Vercel
  `https://workout-db-psi.vercel.app` serve it - probed Oct 9:
  `/coach/conversations`, `/coach/status`,
  `/sessions/:id/last-performance` and `/block-runs/active` all 401;
  bundle `index-d4dwyLkk.js` holds the QOL release and the setup bar. Any
  push to `main` is prod-bound (gate 2).
- **Prod DB migrations:** `add_ai_consent` (Sept 26), `CoachUsage` +
  `WorkoutSession.reopenedAt` (Sept 27), `blocks_v2` +
  `block_exercise_per_side` (Oct 7, by Seth - schema present, history rows
  MISSING, see PICK UP HERE item 2), `coach_key_and_history` (Oct 9, by
  Claude Code under "migrate prod": SQL + `_prisma_migrations` row with
  staging's checksum `e7370e9e...dc64e` in one transaction, verified).
  Prod's build never migrates.
- **Prod migrations are trigger-phrase tier since Oct 9** (AGENTS.md gate
  3): "migrate prod", one command at a time, Seth approves each. The
  write-capable URL is in `C:\dev\secrets\prod-db.env` (bare URL, owner
  role, pooled host - strip `-pooler` for the direct host); the prod
  `COACH_KEY_SECRET` value is `C:\dev\secrets\coach-key-secret.txt`.
  Read both only at run time; never print them.
- **Staging DB** has the same plus everything via Render's `migrate deploy`
  (a staging Render DEPLOY is also a staging MIGRATION).
- Stable topology (prod env, WorkOS, verify-from-services, branch-deletion
  cautions): REFERENCE -> "Deploy topology".

## Lanes + verification (Nov 9)

- `cursor-lane` on `cursor/mxf11` @ `1bf3ee7` (Nov 9), `-2` on
  `cursor/mxf7` @ `fec6d06`, `-3` on `cursor/qol-gate-r3` @ `ac40874`; all
  porcelain clean, no DELIVERY.md (moved to session scratch).
  Before a dispatch: `git checkout -B cursor/<unit> <wave-branch>`. Lane 2's
  `server` has its own install WITH `@cursor/sdk` (live coach calls); lane
  3's `node_modules` are junctions into lane 1; lane 3 holds three
  untracked mock PNGs in `client/src/assets/scenes/` - never stage them.
  Lessons: REFERENCE.
- **Simpler recipe used Nov 9** (MXF9-11): the MAIN tree's API from
  `server/` with `COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=
  http://localhost:5174` set in the PowerShell session, then `Start-Process
  node src/server.js` (child inherits env; passing `$env:` inside a
  `-Command` string broke and the client fell back to PROD - kill it at
  once if that happens); lane client `VITE_API_URL=http://localhost:3001`
  via `Start-Process npx.cmd vite --port 5174`. Log in with a fetch to
  `/auth/login` from the page. CORS refuses any origin not in
  CLIENT_ORIGIN. Synthetic touch `PointerEvent`s drive swipe checks.
- **Real-app check recipe** (MXF6/7): the LANE's API on the STAGING DB -
  from the lane's `server/`: `DOTENV_CONFIG_PATH=<main tree>/server/.env
  COACH_PROVIDER=mock PORT=3001 CLIENT_ORIGIN=http://localhost:5174,
  http://localhost:5175 node -r dotenv/config src/server.js`; lane clients
  with `VITE_API_URL=http://localhost:3001 npx vite --port 5174`
  (`client/.env` = PROD - never use it); Playwright MCP 390x844. The coach
  limiter (40 / 15 min, ALL `/coach` paths, in memory) trips in testing -
  restart the API. Stop all servers after.
- **Staging accounts:** `test123` / `password` (Seth's smoke account -
  READ-ONLY for agents; running "Imported block" run 8 with W1 D1 in
  progress, "Upper/Lower Strength - 4wk" paused at W1 · Lower A) and
  `demo.critic@example.com` / `CriticDemo!2026` (writable; running "Phase 1"
  run 3, W1 · Day 3 next, no custom exercises - leave it that way).

## Seth items (decisions, not work)

- Still open:
  - **BOOKMARKED for discussion (Oct 9):** which button the "N sets have no
    RIR" finish sheet focuses by default. It stays "Finish anyway" for now;
    critic r2 #10 suggested "Add RIR".
  - the R6 tagline pick (a one-line `AuthLayout.jsx` swap)
  - FP8 icon PNGs (drop them into `claudefiledrop/`)
  - the Cursor model-routing question
  - the `docs/parked/*` ruling
  - BK0's open facts (operator name, contact email, US state)
- Settled Oct 8, recorded in the wave spec section 1: connector hardening
  (in), BYO-key design (server-encrypted), coach history (kept until
  deleted; History > Coach since MXC1).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** November 9, 2026 (Opus seat). Session log (Nov 9; the Oct
10-11 log is in the archive):
- Nov 9 (Opus seat): Seth's smoke - MXF8 passes; coach box still cut off
  (shot without the readout; asked again for `/coach?kbdebug=1`, no third
  guess shipped). His ask: exercise detail inline under the tapped row ->
  MXF9 authored (`9757e26`), dispatched auto rung (run 1 reaped by low
  memory, resumed same chat), landed `78a4cd6` with 3 reviewer fixes +
  real-app check (QUEUE has the audit). What's New mxf9 added.
- Nov 9: Seth sent the kbdebug shot. Chrome's virtualKeyboard rect is off
  by the nav strip under edge-to-edge (461 vs ~425). MXF10 `f5826af`
  (direct): /coach drops viewport-fit=cover in Chromium. PICK UP HERE 0
  is superseded by this unless his re-smoke still misses.
- Nov 9: Seth re-smoked - MXF9 + MXF10 pass. IDEAS 16 promoted with his
  rulings (asked: sideways only, hide until next app open with X staying
  discard, coach bar returns once as answered, this wave) -> MXF11
  authored `cbace35`, Fable 5.1 named rung, landed `1bf3ee7` clean (no
  reviewer fixes; real-app check in QUEUE). Fable 5.2 appeared on the
  CLI mid-run. Corrected in chat: the wave is NOT near its end - ROADMAP
  MX7-MX16 remain; next unit is Seth's pick.
- Nov 9, end: Seth on MXF11 - "it definitely works in the barest sense";
  asked to update HANDOFF and hand off to another agent. No feel
  specifics given -> PICK UP HERE 0 asks him first. Aged log + closed
  coach-keyboard item archived verbatim; lane DELIVERY.md to scratch.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
