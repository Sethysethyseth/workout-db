# REPORT QOL gate r3: acceptance-criteria coverage on HEAD

Branch `quality-of-life-updates` vs `main` @ `b5c6777`. Report only. Real-app taps were not run.

Accepted QUEUE deviations are not counted as gaps. A landing-only fence (`git diff --name-only` lists only that unit's files, or "no server file in this unit") is HOLDS when the unit commit kept the fence and a later unit's own contract touched other files. Those are not HEAD invariants.

## Summary

Shared lanes, run once on this tree:

- `server/` `npm run test:unit`: 51 suites, 578 tests, all passed (5.076 s).
- `client/` `npm run build`: exit 0 (`built in 3.61s`). Vite warned that one JS chunk is over 500 kB and that plugin time was mostly CSS. That warning is pre-existing build noise, not a failed compile.
- `node scripts/check-hex.mjs` (repo root): `check-hex: clean - no raw colors added outside index.css (diff: HEAD)`.
- `npx prisma validate`: `The schema at prisma\schema.prisma is valid`. This shell injected 0 env vars from `server/.env`, so validate was given dummy `DATABASE_URL` and `DIRECT_URL` (`postgresql://127.0.0.1:5432/validate_only`). It did not connect to a database.

| Block | Criteria | HOLDS | BROKEN-ON-HEAD | UNSURE | REVIEWER-ONLY |
| --- | ---: | ---: | ---: | ---: | ---: |
| qol1 | 5 | 4 | 0 | 1 | 0 |
| qol2 | 10 | 5 | 0 | 0 | 5 |
| qol3 | 9 | 4 | 0 | 0 | 5 |
| qol4 | 9 | 4 | 0 | 0 | 5 |
| qol5 | 4 | 3 | 0 | 0 | 1 |
| qol6 | 8 | 3 | 0 | 0 | 5 |
| qol7 | 8 | 3 | 0 | 0 | 5 |
| qol8 | 7 | 2 | 0 | 0 | 5 |
| qol9 | 10 | 4 | 0 | 0 | 6 |
| qol10 | 8 | 3 | 0 | 0 | 5 |
| qol11 | 11 | 5 | 0 | 0 | 6 |
| qol12 | 9 | 3 | 0 | 0 | 6 |
| qol13 | 7 | 3 | 0 | 0 | 4 |
| qol14 | 7 | 3 | 0 | 1 | 3 |
| qol15 | 6 | 4 | 1 | 0 | 1 |
| qolf1 | 14 | 3 | 0 | 1 | 10 |
| qolf2 | 14 | 6 | 0 | 1 | 7 |
| qolf3 | 9 | 5 | 0 | 1 | 3 |
| qolf4 | 9 | 4 | 1 | 1 | 3 |
| qolf5 | 8 | 4 | 0 | 1 | 3 |
| qolf6 | 8 | 5 | 0 | 1 | 2 |
| qolf7 | 8 | 4 | 0 | 1 | 3 |
| qolf8 | 10 | 6 | 0 | 1 | 3 |
| qolf9 | 10 | 6 | 0 | 1 | 3 |
| **Total** | **208** | **96** | **2** | **11** | **99** |

UNSURE rows are landing-process checks that are not properties of HEAD (the unit's own `DELIVERY.md`, or "DELIVERY.md says which rule produces each real-app result"). They are not silent product gaps.

The two BROKEN-ON-HEAD rows are both from `2d4cb0e` (qolf9). See section 2.

## 1. Per-block criteria on HEAD

### qol1 schema

1. **HOLDS.** Unit lane: 578/578.
2. **HOLDS.** `prisma validate` passed with the dummy URLs noted above.
3. **HOLDS.** `server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql`: three `CREATE TABLE` (`UserCoachKey`, `CoachConversation`, `CoachMessage`), two `CREATE INDEX` (`CoachConversation_userId_updatedAt_idx`, `CoachMessage_conversationId_createdAt_idx`), three `ALTER TABLE` foreign keys and all three say `ON DELETE CASCADE`. Every `ALTER TABLE` names one of those three new tables. No `DROP`.
4. **HOLDS.** `git diff b5c6777...HEAD -- server/prisma/schema.prisma` is only the two User lines `coachKey` / `coachConversations` plus the three models, comments included, matching the block.
5. **UNSURE.** "DELIVERY.md pastes the full migration.sql" is the unit's delivery report, not a file on HEAD.

### qol2 training preferences

1. **HOLDS.** Client build exit 0. Unit lane 578/578.
2. **HOLDS.** check-hex clean. `client/src/styles/training-prefs.css` grep for hex / `rgb(` / `hsl(`: no output.
3. **HOLDS.** `SessionDetailPage.jsx` grep `RirRpeToggleRow|saveWeightUnit|saveEffortSignal|saveQuickLog`: no output.
4. **HOLDS.** Keys unchanged:
   - `client/src/lib/weightUnitPref.js:1` `workoutdb-weight-unit`
   - `client/src/lib/effortSignalPref.js:1` `workoutdb-effort-signal`
   - `client/src/lib/quickWorkoutLogPrefs.js:1` `workoutdb_quick_log_display_prefs_v1`
5. **HOLDS.** `client/src/App.jsx:169-173` registers `/profile/training` inside `ProtectedRoute`.
6-10. **REVIEWER-ONLY.** kg on the Home strip; sheet updates the pill without reload; quick log follows RPE; a session that already has RIR keeps RIR; an exercise note with text shows when notes are off. The Home-strip half of item 6 is no longer the surface: qolf8 removed the strip from Home (section 3). The logger and Profile form are the places to check the rest.

### qol3 hold to move

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** check-hex clean.
3. **HOLDS.** `git log b5c6777..HEAD -- WeekStrip.jsx DayPicker.jsx` is empty (no edit). `useHoldToReorder.js:192` default `axis = "x"`. The builder call passes `axis: "y"` (`BlockBuilder.jsx:440`).
4. **HOLDS.** `reorderExercise` (`blockBuilderState.js:786`) splices one item out and inserts it. `[A,B,C,D]` 0 to 2 is `[B,C,A,D]`. 3 to 0 is `[D,A,B,C]`. Equal indexes return the same state (`:798`). `BlockBuilder.jsx:442` returns before `applyState` when `fromIdx === toIdx`, so the builder is not marked unsaved. A real move goes through `applyState`, which sets dirty (`:320-327`).
5-9. **REVIEWER-ONLY.** Hold collapses rows; drag last to top scrolls and commits; Unsaved; save survives reload; a plain swipe does not lift.

### qol4 confirm, finish, discard

1. **HOLDS.** Build, unit lane, check-hex.
2. **HOLDS.** `grep window.confirm` and `confirm(` in `SessionDetailPage.jsx`: no output. The bare `confirm("Delete this set?")` qol4 left behind is also gone (qolf3).
3. **HOLDS.** `SessionDetailPage.jsx:3760` `const canFinishWorkout = totalSetsLogged >= 1;`. `effortMandateOk` does not appear in that file.
4. **HOLDS (landing fence).** qol4's commit did not change server files. Later units did, under their own contracts.
5-9. **REVIEWER-ONLY.** Finish warning copy and scroll; block-day "Finish with gaps?"; Home discard flash; no x on a reopened session; set-count lower uses the in-app panel.

### qol5 413 and history cap

1. **HOLDS.** Unit lane includes `server/test/lib/blocks/historyToBlock.topTitles.test.js`: 9 titles keep 7 days and the warning names skipped titles; the file also covers exactly 7 titles and the title tie-break (`:48` starts the 9-title case; warning text matches `historyToBlock.js:192`).
2. **HOLDS.** Client build.
3. **HOLDS.** `server/src/app.js:140` `app.use("/coach", express.json({ limit: "2mb" }));` then `:141` `app.use(express.json());` with no limit argument. `client/src/api/http.js:31-37` `ApiError extends Error`; `:40-44` message is exactly "That's too large to send. Try a smaller file or paste less text." with `status: 413`.
4. **REVIEWER-ONLY.** Live 300 kB POST to `/coach/import-map` is not 413. QUEUE already records a 401-vs-413 check from the landing audit.

### qol6 app help

1. **HOLDS.** `coachHelpMode.test.js` accepts `{type:"help"}` and rejects `{type:"nope"}` (`:24-30`), asserts help blocks contain the guide and general contains both, and `getAppGuide()` length `< 12000` (`:18`). `askCoach.js:125` returns before any summary load when `focus.type === "help"`. `prompt.js:205-223` documents help as persona + guide + framing only. `coachController.js:306` `help: { available: resolved.ok }`.
2. **HOLDS.** Build and check-hex.
3. **HOLDS.** `server/data/app-guide.md` is 11923 characters. Headings: Home; Logging a workout; Blocks (build, run, pause/resume); Templates; Library (Blocks, Workouts, Exercises, Coach); History; Analytics and Exercises; Importing a block or history; Profile (Training, Appearance, AI access, Security, What's new); The coach; Not in LogChamp yet. Grep `.jsx|Controller|/api/|endpoint`: no output. Grep `/` hits two non-routes: line 27 `pause/resume`, line 43 `Reps / Time`.
4-8. **REVIEWER-ONLY.** No-consent help stream; focus `view` is 403 `no_consent`; `/coach/status` `help.available`; Home entry opens `/coach` (the control is a chat bubble, `Ask the coach`, not a crown; that is what qol6 CHANGE 8 specified); composer stays visible with the keypad up.

### qol7 repeat last time

1. **HOLDS.** `lastPerformance.test.js` covers catalog id, alias name-only, `userExerciseId`, L/R order, dropping weight-only and reps-only, most recent session, caller-excludes-current, and no history omitted (`:19-233`).
2. **HOLDS.** `grep prisma server/src/analytics/lastPerformance.js`: no output.
3. **HOLDS.** Build and check-hex.
4-8. **REVIEWER-ONLY.** Own live id returns prior sets; another user's id is 404; ghosts and "Last time" with the pref on; set 1 logs weight and reps with effort blank; pref off fires no request.

### qol8 edit custom exercises

1. **HOLDS.** `customExerciseRename.test.js` adopts "bulgarian-split squat" and "Bulgarian  split squat", rejects "Bulgarian Split Squats" and "Split Squat", and the file's import line is only `normalizeExerciseName`. `grep prisma` on `server/src/lib/customExerciseRename.js`: the only hit is the word inside `require("../analytics/normalize")`, not a Prisma import.
2. **HOLDS.** Build and check-hex.
3-7. **REVIEWER-ONLY.** Rename propagates; catalog name 400; foreign id 404; muscle edit; Exercises tab paints while block runs load.

### qol9 builder polish

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** check-hex.
3. **HOLDS.** `grep bk-actions-list client/src`: no output.
4. **HOLDS.** `.bk-week--selected` in `bk-ui.css:221-233` uses `color-mix` of `--color-interactive`. No `--bk-ink` inside those rules. `--bk-ink` still exists elsewhere in the file.
5-10. **REVIEWER-ONLY.** Long name; new-block header zone; matching sheets; Per side absent on Bench Press and present on a unilateral name; selected week not white; empty search shows Recent.

### qol10 coach history

1. **HOLDS.** `coachConversationTitle.test.js:22` `""` and whitespace become "Coach conversation". The suite is in the green unit lane (120-character and collapsed-whitespace cases live in that file; the lane passed).
2. **HOLDS.** Build and check-hex.
3. **HOLDS.** Every `where` in `conversationStore.js` includes `userId`: lines 15, 43, 56, 65, 93, 119, 125.
4-8. **REVIEWER-ONLY.** Ask creates a conversation and emits meta; follow-up appends; Library Coach tab reopens it; user B's GET, DELETE, and ask 404; delete-all empties the list.

### qol11 key vault

1. **HOLDS.** `coachKeyVault.test.js` is in the green unit lane, including `decryptCoachKey("v2:...")` throws (`:67`).
2. **HOLDS.** `grep x-coach-key|readByoKey|BYO_KEY_HEADER` in `server/src` and `client/src`: no output.
3. **HOLDS.** `saveCoachKey` appears once, `client/src/api/coachApi.js:79`. `loadCoachKey`: no output.
4. **HOLDS.** `grep console.|logger` in `server/src/coach/keyVault.js`: no output.
5. **HOLDS.** Build and check-hex.
6-11. **REVIEWER-ONLY.** PUT shape and ciphertext; `/auth/me` has no key; status `saved`; DELETE; secret unset returns 503; `x-coach-key` is ignored. QUEUE notes `scripts/smoke-coach.mjs --key` is inert.

### qol12 rest timer

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** check-hex.
3. **HOLDS.** `restTimer.js` has no React import. Evaluated on HEAD:
   - `restDurationFor({planRestSec:90, prefSeconds:120})` is 90
   - `planRestSec: null` is 120
   - `planRestSec: 0` is 120
   - `formatRest(0|61000|119500)` is `0:00`, `1:01`, `2:00`
   - `storageKeyFor(42)` is `workoutdb-rest-timer-run:42`
   - `remainingMs` clamps at 0
4-9. **REVIEWER-ONLY.** Bar at pref duration; block rest 90s starts at 1:30; +15s and Skip; leave and return; keypad hides the bar; pref off shows no bar.

### qol13 crimson, bar, whole numbers, login, forward

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** check-hex clean. Crimson success hexes live in `index.css` under `html[data-theme="dark"][data-palette="crimson"]` (`:8951-8954`) and `html:not([data-theme="dark"])[data-palette="crimson"]` (`:8972-8975`). Comment at `:8939-8944` says gold was replaced because it matched warning amber.
3. **HOLDS.** Contrast and hue recomputed against crimson `--color-surface-1` (`#241114` dark, `#fffcfc` light) and warn accent `#f59e0b` (hue 37.7):

   | Token | Hex | Hue | Contrast vs surface | Degrees from warn |
   | --- | --- | ---: | ---: | ---: |
   | dark text | `#86efac` | 141.7 | 12.83 | 104.0 |
   | dark accent | `#22c55e` | 142.1 | 7.91 | 104.4 |
   | light text | `#14532d` | 143.8 | 8.93 | 106.1 |
   | light accent | `#15803d` | 142.4 | 4.92 | 104.7 |

   Text is above 4.5:1, accent above 3:1, hue between 130 and 170, and more than 60 degrees from warning.

   Whole-number example, using the real payload keys (`setsPerSession`, `effortRir`) and `formatPlanActual` (`executionVerdict.js:96`): planned `{3, 8.33, 102.5, rir 2}` vs actual `{2.67, 7.5, 186.67, rir 1.25}` renders `Planned 3×8 @ 103 lb @ 2 RIR → Did 3×8 @ 187 lb @ 1 RIR`. `Math.round` half-up makes 7.5 into 8 and 186.67 into 187. The separators are the line's existing `×` and `@`, plus the unit.

   Forward: `App.jsx:34-36` `pathname === "/"` and `params.has("external_auth_id")` navigates to `` `/connector/login${location.search}` `` with `replace`. Other paths are untouched by this branch.

4-7. **REVIEWER-ONLY.** Crimson good reads green; 1280 bar vs column (qolf1 later changed the width rule; see that block); no Login flash with a valid cookie; `/?external_auth_id=test` lands on connector login. QUEUE gate note: a logged-out visitor on a cold server waits on "Loading session" (`ProtectedRoute.jsx:11-18`).

### qol14 what's new system

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** check-hex.
3. **UNSURE as a HEAD invariant (landing fence, then a later contract).** qol14 required that unit's `whatsNew.js` diff to be the header comment only. qol15's contract then writes `RELEASES`. On HEAD the header still documents `details`, the five-bullet cap, and `?preview=1` (`whatsNew.js:15-28`). That is the qol14 edit. The release bodies are qol15, not a silent undo.
4. **HOLDS.** `WhatsNewGate.jsx:5` imports `isProdEnv` and `:18` `if (!isProdEnv()) return null;`. No `isWhatsNewPreview` in that file. Preview lives in `appEnv.js:28-32` and is used by `WhatsNewPage.jsx` and `ProfilePage.jsx`, not the modal.
5-7. **REVIEWER-ONLY.** `/profile/whats-new` redirects off-prod; `?preview=1` shows the note and the Profile card; a release with no `details` has no disclosure; the modal never appears off-prod. (The "temporarily add details" check is obsolete: qol15 committed details.)

### qol15 what's new release

1. **HOLDS.** Build and unit lane.
2. **HOLDS.** Newest first: `2026-10-quality-of-life` (`:32`), then `2026-10-blocks-and-coach` (`:174`), then the older entries. `git diff 9a57cef HEAD -- client/src/data/whatsNew.js` changes only the wave release's Logging bullet, its "Logging setup" detail, and the Repeat-last detail. Older entries are untouched after the qol15 commit.
3. **HOLDS for the count of bullets, BROKEN for one bullet's length.** Each new release has 5 section bullets. The catch-up release's five bullets are 25, 20, 21, 21, and 20 words. The wave release's are 29, 21, 18, 19, and 20. The 29-word bullet is section 2.
4. **HOLDS.** Grep of `whatsNew.js` for `endpoint|api|schema|migration|component|qol[0-9]|.jsx|workoutdb` (case insensitive) hits only the header comment at line 11 (`workoutdb-` prefix, rename boundary). No hit inside `RELEASES` strings. "WorkoutDB" does not appear.
5. **HOLDS.** App guide 11923 characters, under 12000.
6. **REVIEWER-ONLY as a document, not a device check.** The ledger-to-release table was the unit's DELIVERY. QUEUE says both UNRELEASED sections (29 entries) moved to RELEASED.md at landing. That table is not re-derived here.

### qolf1 bar, home, confirm, analytics

1. **HOLDS.** Unit lane (no server change required).
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).** Later units also edit the bar and Home. That is their contracts.
4. **UNSURE.** "DELIVERY.md says which rule produces each real-app result" is the unit report, not HEAD.
5-14. **REVIEWER-ONLY.** 390 bar: one-line eyebrow, one-line title, "Resume", x clear of the button. 1280 column alignment within 8px. Discard notice copy. Live card heading is the workout title. Keyboard focus lands on "Keep workout" with a visible ring (`confirm.css:32` `:focus-visible`). Strength view `scrollWidth <= 390`. Reduced motion. Code present for the reviewer: `PersistentWorkoutBar.jsx:42-54` "Resume" under 420px; `:99-106` column by pathname; `DashboardPage.jsx:364-369` "Workout discarded" / "Nothing was saved to your history." / Dismiss.

### qolf2 coach page, history, key form

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS.** `grep aria-haspopup` in `CoachConversationList.jsx`: no output.
5. **HOLDS.** `grep ·` in `CoachConversationList.jsx`: no output.
6. **HOLDS.** `grep "lives on the Analytics page|Open Analytics to ask"` in `client/src`: no output.
7. **UNSURE.** Per-item real-app rule map lived in that unit's DELIVERY.
8-14. **REVIEWER-ONLY.** Continued thread has one scroll container; embedded Analytics coach unchanged; composer backing; Stop contrast; delete button and copy; AI access form stacks; copy points at `/coach`.

### qolf3 logger room

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS.** `Builder View|Table View|Reps in Reserve` in `SessionDetailPage.jsx`, `ViewModeToggle.jsx`, `SetRow.jsx`, `WorkoutTemplateTableView.jsx`: no output. The same words still exist outside those files (`RirRpeToggleRow.jsx`, `MetricInfoButton.jsx`), which this grep did not include.
5. **HOLDS.** No `window.confirm` or `confirm(` in `SessionDetailPage.jsx`.
6. **UNSURE.** Per-item rule map was the unit DELIVERY.
7-9. **REVIEWER-ONLY.** Sticky header <= 64px; Finish dock <= 80px with a set logged; ghost set buttons show the outline and check, and remove still asks. (The block's real-app list is one group; counted as 3 clusters: header/dock, labels plus Add RIR, ghost cue plus remove.)

### qolf4 prefs, builder selection

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS.** `grep "this phone"` in `client/src`: no output.
5. **BROKEN-ON-HEAD.** The notes-pill map `(on,on) -> "Notes on"`, `(on,off) -> "Exercise notes"`, `(off,on) -> "Set notes"`, `(off,off) -> no pill` is not in `TrainingPrefsStrip.jsx`. The strip's notes control is a single "Exercise notes" chip (`:52-58`). See section 2.
6. **UNSURE.** Per-item rule map was the unit DELIVERY.
7-9. **REVIEWER-ONLY.** Sheet height; off-switch contrast; builder day pill and lift. The "1280 segmented <= 380px" and "this device" wording are still the Training page's job for the reviewer.

### qolf5 effort hint

1. **HOLDS.** `lastPerformance.test.js:253-285`: rpe 7 with rir null; rir 2 with rpe null; both null. Existing cases are in the same green file.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).** The controller also contains older `rpe`/`rir` lines outside the last-performance select. The two select lines are `sessionController.js:1057-1058` inside the last-performance `sets.select`.
4. **HOLDS.** Logged-set hint: `SessionDetailPage.jsx:1484-1490` says a logged set still receives last time via `lastTimeFieldsForRow`, and the placeholder comes from `effortPlaceholderFromPlan`. Block plan first: `ghostPlaceholders.js:94-100` `effortPlaceholderWithLastTime` returns the plan ghost when it is not "—", otherwise last time's plain number.
5. **UNSURE.** The unit DELIVERY quote requirement.
6-8. **REVIEWER-ONLY.** Grey 7 on ghost rows; log set 1 leaves RPE empty with grey 7; Finish still counts hint-only sets as missing; switching to RIR shows "—".

### qolf6 logger round 2

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS.** `grep LAST_TIME_GHOST_INPUT_STYLE` in `SessionDetailPage.jsx`: no output.
5. **HOLDS.** `grep "Yes, remove"` in `SessionDetailPage.jsx`: no output.
6. **UNSURE.** Per-item rule map was the unit DELIVERY.
7-8. **REVIEWER-ONLY.** Add RIR tint with Repeat last on; trash confirm names the logged-set count; suggestion list clears the dock; Sets select matches the rows and Add set stays below them.

### qolf7 coach, prefs, run, home

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS (accepted deviation).** `grep "Open the coach from the chat bubble at the top of Home"` is not empty. The one hit is release copy, `whatsNew.js:104`. QUEUE for qolf7: "the grep hit left in whatsNew.js is release copy."
5. **UNSURE.** Per-item rule map was the unit DELIVERY.
6-8. **REVIEWER-ONLY.** Bar hidden on `/coach` (code is `PersistentWorkoutBar.jsx:90-95`, including `/coach` with any query via pathname); sheet gaps; cold-load scroll; composer seam; AI access switch; run-page day tint. The Last 7 days check is not on HEAD: CHANGE item 7 was reverted (section 3).

### qolf8 strip into the workout

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).**
4. **HOLDS.** `grep TrainingPrefsStrip` in `DashboardPage.jsx`: no output.
5. **HOLDS.** `grep -i "strip on home|under that, a short strip"` in `app-guide.md`: no output.
6. **HOLDS.** `SessionDetailPage.jsx:3747-3754`:
   - not a quick log, scale known: "This workout's plan uses RIR/RPE. Your choice applies to quick workouts."
   - quick log that already has a logged signal: "This workout already has RIR/RPE logged, so it stays RIR/RPE. Your choice applies from your next workout."
   - otherwise `liveEffortNote` stays null.
7. **UNSURE.** Per-item rule map was the unit DELIVERY.
8-10. **REVIEWER-ONLY.** Home has no strip and the card gap is normal; quick log and block day show the right pill and note; a completed session has no strip. Counted as 3 reviewer clusters.

### qolf9 hotbar

1. **HOLDS.** Unit lane.
2. **HOLDS.** Build and check-hex.
3. **HOLDS (landing fence).** `SessionDetailPage.jsx` is not in qolf9's commit; qolf8 already placed the strip. HEAD still renders it (`SessionDetailPage.jsx:3983` and `:4070`).
4. **HOLDS.** `aria-pressed` at `TrainingPrefsStrip.jsx:37,45,55,63`. `grep SlidersIcon|weightUnit` in that file: no output.
5. **HOLDS.** App-guide grep `shows your logging setup|setup strip sits at the top`: no output. `whatsNew.js` grep `which notes are on|shows your setup`: no output.
6. **HOLDS.** Handlers in `TrainingPrefsStrip.jsx`: `onScaleTap` (`:20-27`) returns when the half is already lit; if `effortNote` is set, opens the sheet; otherwise `setTrainingPref("effortSignal", next)`. Exercise notes (`:56`) toggles `useExerciseNotes`. Repeat last (`:65`) toggles `mirrorLast`. Edit (`:72`) opens the sheet. Focus return is `editRef` (`:16`).
7. **UNSURE.** Per-item rule map was the unit DELIVERY.
8-10. **REVIEWER-ONLY.** Quick-log taps move the glow and do not reload or clear a typed weight; a locked scale opens the sheet and does not change the pref; a block day lights the plan scale and the other half opens the plan note.

## 2. Later-unit regressions

### qolf4 notes-pill map

**BROKEN-ON-HEAD.** The four-way notes pill is gone from `TrainingPrefsStrip.jsx`.

`git log -S "Notes on" -- client/src/components/prefs/TrainingPrefsStrip.jsx` shows the string added in `0437015` (qol2) and removed in `2d4cb0e`:

`2d4cb0e feat(qolf9): the setup strip becomes a hotbar`

qolf9 CHANGE item 1: "Removed from the bar: the sliders icon, the weight-unit pill, and the combined notes pill ("Notes on" / "Set notes")."

QUEUE does not record a qolf4 deviation that drops this map. The later block's contract does explain it. Set notes remain on `TrainingPrefsForm.jsx:106`, not on the bar.

### qol15 25-word bullet

**BROKEN-ON-HEAD.** Wave release, Logging, first bullet, 29 words:

"Units, effort, notes, repeat last time, and the rest timer now live under Training. The bar at the top of each workout switches the common ones in one tap."

At qol15 (`9a57cef`) the second sentence was "A strip on Home shows your setup." That bullet was 21 words. `git log -S "switches the common ones in one tap"` attributes the new sentence to `2d4cb0e` (qolf9).

qolf9 CHANGE item 6 required that sentence in `whatsNew.js`. It does not mention the 25-word cap. QUEUE for qolf9 does not waive the cap. The copy change is required; the word-count breach is a side effect nothing records.

The other nine new bullets are 25 words or fewer. Older releases were not edited after `9a57cef` except this wave release's three copy spots (Logging bullet, Logging-setup detail, Repeat-last detail). The Repeat-last detail change matches qolf5's "effort is a grey reminder" wording.

## 3. CHANGE items with no net diff

Checked as: the numbered CHANGE's outcome is visible in `git diff b5c6777...HEAD` or still present on HEAD. Process steps that were never meant to leave a file (qol1's temp schema copy, generating the migration by hand) are not gaps; the migration file and schema diff are the result.

### Listed

**qol2 CHANGE 4, Home strip.** `DashboardPage.jsx` does not import or render `TrainingPrefsStrip` (grep: no output). QUEUE's qol2 accepted deviations do not say the strip was removed (they cover block-day note fields, table note columns, 1024px grid, and "Add a workout note").

A later contract does: qolf8 CHANGE 1, "Remove `<TrainingPrefsStrip />` and its import from `DashboardPage.jsx`." Commit `9c27ff3`. The strip now mounts from `SessionDetailPage.jsx` on live sessions.

**qolf4 CHANGE 3, honest notes pill.** Same removal as section 2. Not in the net strip. qolf9 CHANGE 1 removes that pill. QUEUE does not call it a qolf4 deviation.

### Reverted, confirmed gone

**qolf7 CHANGE 7, Last 7 days finished-only.** QUEUE: "REVERTED item 7 (#12, Last 7 days): the summary API has no completedAt, so Cursor rebuilt the stats client-side by approximation (subtracting sets, patching top set) and movers/execution stayed wrong. That is analytics math in the UI. STOWED: the summary endpoint should exclude unfinished sessions."

Confirmed absent: `grep completedAt` under `client/src/components` matching `Weekly*` is no output. Home does not filter unfinished sessions out of Last 7 days in the client.

No other numbered CHANGE item was missing from the net tree. Later edits that replaced an implementation (qolf1 replacing qol13's fixed 720px bar with pathname columns; qolf9 replacing qol2's pill row with the hotbar) still left the successor on HEAD, so they are not "no diff". They are the section 2 cases when they also break an earlier acceptance line.

## 4. Shared surfaces

### Who touched them (`git log --format='%h %s' b5c6777..HEAD`)

`client/src/pages/SessionDetailPage.jsx`

- `9c27ff3` qolf8 strip into the workout
- `9d6b646` qolf6 logger round 2
- `f857166` qolf5 effort hint
- `e9a893a` qolf3 logger room
- `e7afea7` qol12 rest timer
- `1812ecd` qol7 repeat last time
- `6bb3301` qol4 confirm / finish / discard
- `0437015` qol2 training preferences

`client/src/components/workout/PersistentWorkoutBar.jsx`

- `47328fe` qolf7 hide on `/coach`
- `dd2052f` qolf1 phone layout and column
- `6bb3301` qol4 discard

`client/src/pages/DashboardPage.jsx`

- `9c27ff3` qolf8 strip leaves Home
- `dd2052f` qolf1 discarded notice
- `3ad3420` qol6 coach entry
- `6bb3301` qol4 discard
- `0437015` qol2 strip

`client/src/components/prefs/*`

- `2d4cb0e` qolf9 hotbar
- `9c27ff3` qolf8 effort note
- `47328fe` qolf7 sheet spacing
- `6483ec4` qolf4 sheet, switches, notes pill
- `0437015` qol2 form, strip, sheet

### Dangling names

None found.

Method: hyphenated or underscored identifiers added on these paths between `b5c6777` and HEAD, then absent from the current text of those files, then searched under `client/src`, `server/src`, and `server/data`. Hits that remained were CSS properties (`grid-row`, `margin-bottom`, `--color-input-border`) and `.bk-log-effort-slot`, which is still defined at `bk-log.css:555` and referenced by no component. That is an unused rule, not a caller of a removed name.

`training-prefs-pill` was added in qol2 and removed in `2d4cb0e`. Grep on HEAD: no output. qolf9's reviewer note removed the dead rules with the JSX, so nothing still says the old class.

Pref keys `workoutdb-weight-unit`, `workoutdb-effort-signal`, `workoutdb_quick_log_display_prefs_v1`, `workoutdb-mirror-last`, and `workoutdb-rest-timer` are still the names the form writes. No renamed key left a caller on the old name.

## git status

```
?? REPORT-QOL-GATE-R3.md
```
