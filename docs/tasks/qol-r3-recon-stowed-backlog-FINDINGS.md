# DELIVERY qol-r3

Report only. No code changes. No test lane is named in this block.

## Files touched

- `DELIVERY.md` (this file)

## Test output

No lane is allowed by this block (report only; no `npm` test or build).

## A. Discard from the live-workout entry points

1. Home card: `ActiveWorkoutHero` in `client/src/components/workout/ActiveWorkoutHero.jsx:38` (eyebrow "In progress" `:63`, CTA "Resume workout" `:65` and `:103`). Mounted from `client/src/pages/DashboardPage.jsx:371`. Resume only; no discard control in that file.
2. Floating bar: `PersistentWorkoutBar` in `client/src/components/workout/PersistentWorkoutBar.jsx:21`. Copy "In progress" `:59`, "Resume workout" `:64`. Rendered by `client/src/components/Layout.jsx:11-12` inside `.persistent-workout-bar-wrap`. Hidden on `/` and `/blocks/import` (`PersistentWorkoutBar.jsx:47`) so Home uses the hero only.
3. WD1 confirm is inline JSX in `SessionDetailPage`, not a component. Markup: `client/src/pages/SessionDetailPage.jsx:3429-3454` (classes `session-discard-confirm` and `__title` / `__body` / `__actions` / `__discard`). Discard X: `:3334` and `:3384`. Handler `sessionApi.discardSession` at `:2765`. Client call: `client/src/api/sessionApi.js:60-62` `POST /sessions/${id}/discard`. Server route: `server/src/routes/sessionRoutes.js:33`. CSS: `client/src/index.css:9565`. The same class is copied as inline JSX in the builder, library cards, and `BlockRunPage` (end-block, not session discard) — see G.
4. A block day uses the same session entry points and the same discard route. Starting or resuming a block day navigates to `/sessions/${id}` (`client/src/pages/BlockRunPage.jsx:120` and `:131`), which is `SessionDetailPage` (`client/src/App.jsx:129-132`). Home still shows `ActiveWorkoutHero` for that live session (`DashboardPage.jsx:305` comment, mount `:371`). Discard does not branch on block vs quick-log; it always posts `/sessions/:id/discard`. `BlockRunPage.jsx:362` reuses the confirm CSS for "End this block", which calls the block-run end path, not session discard.

## B. Coach "thinking" state

1. Between send and the first token, `CoachPanel` appends a pending coach message and renders `AiWait variant="block" verb="Thinking..."` until `content` arrives (`client/src/components/coach/CoachPanel.jsx:390-393`). After the first token, the pending row shows a caret (`:393`) instead of `AiWait`.
2. Answers stream. Panel comment `:16`. Client: `askCoachStream` `POST /coach/ask` with `Accept: text/event-stream` (`client/src/api/coachApi.js:171-176`) and an SSE buffer (`:233`).
3. Reusable loaders by name:
   - `LoadingState` (`client/src/components/LoadingState.jsx:106`) — T3 dynamic screens: `Barbell` `:30`, skeleton variants `list` / `analytics` / `history` / `session` / `settings` `:48-104`, tones `page` `:119`, `skeleton` `:148`, default `soft`.
   - `AiWait` and `AiWaitButtonLabel` (`client/src/components/coach/AiWait.jsx:18` and `:97`) — bkr1 AI wait (crown + copy ladder; variants `inline` / `block` / `status`).

## C. Exercise hold-to-move in the builder

1. `useHoldToReorder` — `client/src/components/blocks/ui/useHoldToReorder.js:80`. Args: `{ enabled, itemCount, onReorder }`. Returns `containerRef`, `containerClassName`, `setItemRef`, `getItemStyle`, `getItemClassNames`, `getItemPointerProps` (`:397-404`). Axis: horizontal only. File comment `:77` ("horizontal pill strips"). Slot math uses `clientX` / `left` / `width` (`:24-28`, `:50-57`). Drag transform is `translateX` (`:347`, `:354`). No axis argument.
2. Used for weeks in `WeekStrip` (`client/src/components/blocks/ui/WeekStrip.jsx:32`) and days in `DayPicker` (`client/src/components/blocks/ui/DayPicker.jsx:37`). Builder wires both: `BlockBuilder.jsx:1103` (`onReorder={handleReorderWeek}`) and `:1159` (`DayPicker`).
3. Exercise list is inline in `BlockBuilder.jsx:1251-1253`: `(currentDay.exercises || []).map` rendering `ExerciseCard`. Not a separate list component. Order is array position. `moveExercise` swaps neighbors (`client/src/components/blocks/builder/blockBuilderState.js:769-778`). UI is Move up / Move down in the exercise action sheet (`ExerciseCard.jsx:434-456`), called from `BlockBuilder.jsx:1280-1284`. No `order` field in `server/src/blocks/blockFormat.js` (searched `order`: not found). `useHoldToReorder` is not used on exercises.

## D. Polish deferrals

1. sr3 P3s (`docs/tasks/sr3-critic-round-1-FINDINGS.md:81-90`):
   - P3-1 name row. `StickyHeader` puts the name (`eyebrow={nameNode}`) and the Unsaved/Save/… cluster (`right={headerRight}`) on one flex row (`BlockBuilder.jsx:1050-1053`; row CSS `client/src/styles/blocks/bk-ui.css:726-731`). Name node: `BlockBuilder.jsx:918-923` (`.bk-builder-name-input`). Save cluster: `:875-910`. Name CSS `client/src/styles/blocks/bk-builder.css:65-71` (`min-width: 0; width: 100%` inside the left cell). What it does now: name and status/Save share one sticky row, so the input shrinks beside Unsaved, Save, and ….
   - P3-2 coach box / title wrap. On a new empty block, `CoachDraftCard` sits after the week strip and before `DayPicker` (`BlockBuilder.jsx:1103-1159`, card `:1148-1152`). Exercise title: `.bk-ex-card__name` is uppercase 23px with `min-width: 0` and no nowrap (`bk-builder.css:507-515`), so long free-text names wrap beside the chip. What it does now: the draft box splits week strip from day strip, and the card title wraps.
   - P3-5 action sheets. Two style implementations, plus a third caller of the icon-list class:
     - Bordered button rows: `.bk-actions-list` / `__btn` (`bk-builder.css:1199-1215`). Callers: week sheet `BlockBuilder.jsx:1548`, day sheet `:1652`, export-copy sheet `:1460`, settings actions `BlockSettingsSheet.jsx:116`.
     - Icon + text list: `.bk-ex-actions` / `__row` (`bk-builder.css:741-759`, border 0). Caller: exercise sheet `ExerciseCard.jsx:427-433`.
     - Same icon-list class without icons: block header menu `BlockBuilder.jsx:1349-1355`.
     Shared chrome is `BuilderSheet` (`client/src/components/blocks/builder/BuilderSheet.jsx:42`). What it does now: day/week use bordered rows; the exercise sheet uses an icon list.
   - P3-8 empty search. `ExercisePicker` returns before any request when the query is empty (`ExercisePicker.jsx:46-51`) and clears results on an empty field (`:145-149`). `showResults` is `trimmedQuery.length > 0` (`:118`). No recent-exercise fetch in this file (searched `recent`: not found). What it does now: an empty query shows no exercise list.
   - P3-10 Library load. `MyTemplatesPage` `load()` on mount (`MyTemplatesPage.jsx:141-142`) fires 5 requests in one `Promise.all` (`:97-103`): `GET /templates/mine` (`templateApi.js:10-11`), `GET /block-templates/mine` (`blockTemplateApi.js:10-11`), `GET /exercises/custom` (`exerciseApi.js:23-24`), `GET /block-runs/active` (`blockRunApi.js:30-31`), `GET /block-runs/left-off` (`blockRunApi.js:38-39`). That `load()` always runs, including when `area=community`. Community adds 2 more only while `LibraryCommunitySection` is mounted (`MyTemplatesPage.jsx:416-417`; `LibraryCommunitySection.jsx:37-39` and `:49-50`): `GET /templates/public`, `GET /block-templates/public`. Default area is yours (`MyTemplatesPage.jsx:50`), so a plain Library open is 5 requests. What it does now: the page waits on that `Promise.all` behind `LoadingState` (`MyTemplatesPage.jsx:462`).
2. Rest timer. No countdown / rest-timer component in `client/src` (searched `restTimer`, `countdown`: not found). `restSec` is a planned prescription only: builder chip and sheet `ExerciseCard.jsx:170-171` and `:535`, stored on the exercise `blockBuilderState.js:72`. Intervals in the client are elapsed-workout clocks (`PersistentWorkoutBar.jsx:29`, `DashboardPage.jsx:168`), not rest.
3. Fractional Execution numbers. Values render in `ExecutionSection` (`client/src/pages/AnalyticsPage.jsx:514`). Percents are integer (`formatAdherence` `:443-445`, meter label `:507`). The fractional line is `formatPlanActual` (`:562-563`), which prints sets/reps/weight/RIR via `formatDecimalCount` (`client/src/lib/executionVerdict.js:3-7` and `:73-97`): one decimal, trailing `.0` stripped. Those numbers are means rounded to 2 decimals in `server/src/analytics/planVsActual.js:20-22` (`round2`) and `:234-244` (`setsPerSession`, `reps`, `weight`, `effortRir` for planned and actual).
4. Desktop In-progress bar width. `.persistent-workout-bar` is `width: 100%` (`client/src/index.css:5769-5770`) inside `.persistent-workout-bar-wrap.container` (`Layout.jsx:11`). `.container` is `max-width: 980px` (`index.css:499-504`). The fixed bottom bar rules apply only under `max-width: 719px` (`index.css:5869-5882`). At desktop the bar is a full-width sticky strip up to 980px (`:5755-5763`).
5. "Per side" on bilateral lifts. The chip is always rendered (`ExerciseCard.jsx:307-314`), not hidden for bilateral names. Pressed state defaults to `exercise.perSide` or `exerciseNameImpliesPerSide` (`:177-180`). The heuristic matches unilateral names only (`client/src/components/blocks/log/perSideMode.js:7-16`) and returns false for a bilateral name, so the chip still shows, unpressed, and toggles `perSide` (`:311`).
6. Builder week pill. Selected pill: `.bk-week--selected` sets `background` and `border-color` to `var(--bk-ink)` and text to `var(--bk-bg)` (`client/src/styles/blocks/bk-ui.css:221-224`). `--bk-ink` is `var(--color-text)` (`bk-ui.css:8`). Dark `--color-text` is `#f1f5f9` (`client/src/index.css:102`). The inner bar is `.bk-week__bar` (`bk-ui.css:207-211`); selected fill is `var(--bk-bg)` (`:231-232`). What it does now: in dark mode the selected week pill is a near-white (`#f1f5f9`) bar.
7. Crimson "good" colour. Comment at `client/src/index.css:8925-8928` ("gold on crimson"). Dark crimson success tokens `:8935-8938`: `--color-success-accent: rgb(251 191 36)` (amber), text `#fde68a`. Light crimson `:8956-8958`: accent `rgb(217 119 6)`, text `#92400e`. Blocks alias `--bk-good` to `--color-success-accent` (`bk-ui.css:16`).
8. Remaining `window.confirm` / `alert` / `prompt` in `client/src` (`prompt`: not found):
   - `SessionDetailPage.jsx:1671` — confirm removing a filled L/R pair.
   - `SessionDetailPage.jsx:2917` — confirm lowering per-side set count.
   - `SessionDetailPage.jsx:2962` — confirm lowering bilateral set count.
   - `client/src/lib/confirmLeaveLiveSession.js:2` — confirm leaving a live workout.
   - `HelloPage.jsx:86` — `window.alert` ("Or throw me a text").
9. Login flash after cleared site data. `AuthProvider` starts `authLoading` true and calls `/auth/me` (`client/src/context/AuthContext.jsx:46`, `:86-88`). `hasStoredAuthToken` reads `localStorage` `authToken` (`:34-41`). `ProtectedRoute` while loading with no stored token redirects straight to `/login?next=` and skips `LoadingState` (`client/src/components/ProtectedRoute.jsx:11-17`). `LoginPage` leaves the form up until `currentUser` is set, then `navigate(nextUrl)` (`client/src/pages/LoginPage.jsx:20-25`). What it does now: cleared storage takes the user to the login form immediately; a still-valid cookie resolved by the in-flight `/auth/me` then bounces them off that form.

## E. Server stowed items

1. Body limit vs char caps. Global parser is `app.use(express.json())` with no `limit` (`server/src/app.js:138`). When `limit` is omitted, body-parser uses `'100kb'` (`server/node_modules/body-parser/lib/utils.js:63-64`). Import paths are special-cased earlier at 2mb (`app.js:137`), which does not cover `/coach/*`. Caps: `MAX_TEXT_CHARS = 1_000_000` in `server/src/coach/importMap.js:15`, enforced `:80-85`. Import-fix reuses that cap for every body (`server/src/coach/importFix.js:14` and `:109-114`). The recipe path sends a sample; the convert path is additionally capped at `BLOCK_DRAFT_MAX_TEXT_CHARS` (20_000) before the model (`server/src/controllers/coachController.js:1037-1042`; constant `server/src/coach/blockDraft.js:14`). Preview text itself allows 1_000_000 chars (`server/src/blocks/importPreview.js:18`, `:462`) but that route sits on the 2mb parser. No client branch handles 413 (searched `413`: not found). `http.js:128-130` throws `Request failed (${status} ${statusText})` when the body is not JSON. Import preview shows that string as `networkError` (`ImportBlockPage.jsx:247-248`). Coach import-fix passes it as the `coachErrorMessage` fallback (`ImportBlockPage.jsx:389-416`); the default arm returns the fallback (`coachApi.js:66-67`), so the raw status line is what renders.
2. History 8+ titles. History builds one day per distinct title in the window (`server/src/blocks/historyToBlock.js:167-193`). Cap constant: `MAX_DAYS_PER_WEEK = 7` (`server/src/blocks/blockFormat.js:12`). Preview runs `validateBlockDraft` (`importPreview.js:512-521`). Failure: `Week ${n} has ${count} days - a week holds at most 7.` (`blockFormat.js:205-208`). "Keep the 7 most-used, warn about the skipped" would touch `historyToBlock.js` (where `byTitle` becomes `days`, `:167-192`) and the `warnings` array that function already returns (`:222-224`). Preview copies those warnings through (`importPreview.js:366` and `:531`). `blockFormat.js` would stay the hard cap unless the trim happens before validation.
3. Migration line endings. No `.gitattributes` in the repo (searched the worktree root: not found). This checkout: 22 files under `server/prisma/migrations/`, all CRLF, 0 LF (21 `migration.sql` plus `migration_lock.toml`).

## F. Coach discoverability

`CoachPanel` is mounted in three places:

- Analytics, route `/analytics` (`client/src/App.jsx:121`; panel `client/src/pages/AnalyticsPage.jsx:846`). Mode `ask`.
- Completed workout debrief, route `/sessions/:id` (`App.jsx:129`; panel `SessionDetailPage.jsx:3785`). Mode `debrief`, only in the completed branch (after `:3762`), not on the live logger.
- Builder "Ask the coach" sheet (`BlockBuilder.jsx:1434-1449`), opened from block settings when the coach is available (`:1398-1401`). Builder mounts: create flow `/create-template` (`App.jsx:64`, `CreateTemplatePage.jsx:256`) and edit `/blocks/:id/edit` (`App.jsx:80-83`, `EditBlockTemplatePage.jsx:8`).

No other `CoachPanel` import in `client/src` (searched: those three files only).

Nav:

- Bottom nav (`client/src/components/layout/BottomNav.jsx:5-65`): Home `/`, Analytics `/analytics`, History `/sessions`, Library `/templates`, Profile `/profile`.
- Desktop header (`Navbar.jsx:33-44`): Workout `/`, Library `/templates`, History `/sessions`, Analytics `/analytics`, plus Dev feedback when enabled (`:45-48`). Profile is a separate link (`:25`).
- Profile sections (`client/src/pages/ProfilePage.jsx:101-139`): Appearance `/profile/appearance`, Security `/profile/security`, AI access `/profile/ai`, Feedback `/profile/feedback`, What's new `/profile/whats-new`.

A persistent entry could sit on the bottom nav, the desktop header, or the Profile hub. The panel already opens in place on Analytics; Home (`DashboardPage`) and Library (`MyTemplatesPage`) do not mount it.

## G. Collision map

Candidate units and FILES TO TOUCH. Tests listed only where a matching suite already exists.

1. **Discard on Home + bar (A).** `ActiveWorkoutHero.jsx`, `PersistentWorkoutBar.jsx`, `DashboardPage.jsx`, `Layout.jsx`, `sessionApi.js`, `SessionDetailPage.jsx` (inline confirm to reuse or copy), `index.css` (`.session-discard-confirm`, `.persistent-workout-bar`). Server route already exists (`sessionRoutes.js`); no new route required unless the contract adds one. Session integration tests if the client starts calling discard from a new button only — server behavior unchanged.
2. **Coach thinking (B).** `CoachPanel.jsx`, `AiWait.jsx`, `client/src/styles/ai-wait.css`, `coachApi.js`. `LoadingState.jsx` only if a T3 skeleton is reused inside the panel.
3. **Exercise hold-to-move (C).** `useHoldToReorder.js`, `WeekStrip.jsx`, `DayPicker.jsx` (if the hook API grows an axis), `BlockBuilder.jsx`, `ExerciseCard.jsx`, `blockBuilderState.js`, `bk-ui.css`, `bk-builder.css`.
4. **Builder chrome P3s (D1 name, D2 coach box, D3 sheets, D5 per side, D6 week pill).** `BlockBuilder.jsx`, `StickyHeader.jsx`, `ExerciseCard.jsx`, `BuilderSheet.jsx`, `BlockSettingsSheet.jsx`, `CoachDraftCard.jsx`, `ExercisePicker.jsx` (empty search is its own file but lives in the builder), `perSideMode.js`, `bk-builder.css`, `bk-ui.css`, `index.css` only if the week pill stops using `--color-text`.
5. **Empty-search recents (D1 P3-8),** if split from (4): `ExercisePicker.jsx` plus whichever list endpoint already returns recent exercises (not present in `ExercisePicker` today).
6. **Library load (D1 P3-10).** `MyTemplatesPage.jsx`, `LibraryCommunitySection.jsx`, `templateApi.js`, `blockTemplateApi.js`, `exerciseApi.js`, `blockRunApi.js`. Server list handlers only if the fix is fewer or combined routes.
7. **Rest timer (D2).** New timer component; live log surfaces `SessionDetailPage.jsx` and `client/src/components/blocks/log/BlockExerciseCard.jsx`; prescription already on `ExerciseCard.jsx` / `blockBuilderState.js`. CSS: `bk-log.css` and/or `index.css`.
8. **Fractional Execution (D3).** `server/src/analytics/planVsActual.js`, `client/src/lib/executionVerdict.js`, `AnalyticsPage.jsx`, `server/test/analytics/` plan-vs-actual tests.
9. **Desktop bar width (D4).** `index.css`, `Layout.jsx`, `PersistentWorkoutBar.jsx`.
10. **Crimson good colour (D7).** `index.css` only (`:8935-8958`).
11. **Browser dialogs (D8).** `SessionDetailPage.jsx`, `confirmLeaveLiveSession.js`, `HelloPage.jsx`. Confirm CSS already in `index.css`.
12. **Login flash (D9).** `ProtectedRoute.jsx`, `AuthContext.jsx`, `LoginPage.jsx`.
13. **JSON 413 vs char caps (E1).** `server/src/app.js`, `coachController.js` (only if a friendly 413 is app-level), `ImportBlockPage.jsx`, `http.js` or `coachApi.js`. Import preview already has the 2mb parser (`app.js:137`).
14. **History title cap (E2).** `historyToBlock.js`, `importPreview.js` (warning passthrough), `blockFormat.js` only if the cap message changes. Tests: `server/test/lib/blocks/` history/preview suites.
15. **`.gitattributes` (E3).** New `.gitattributes` at repo root. No migration file rewrite is required for the rule itself; existing CRLF bytes stay until renormalized.
16. **Coach entry point (F).** `BottomNav.jsx` and/or `Navbar.jsx` and/or `ProfilePage.jsx`, plus a mount of `CoachPanel.jsx`. `App.jsx` only if a new route is added.

Files in more than one group:

| File | Groups |
| --- | --- |
| `client/src/index.css` | 1 (discard + bar), 9 (bar width), 10 (crimson tokens), 11 (confirm styles already here), 4 if week-pill tokens change |
| `client/src/pages/DashboardPage.jsx` (Home) | 1 only among these units |
| Builder `BlockBuilder.jsx` | 3, 4, 16 (ask-coach sheet) |
| `ExerciseCard.jsx` | 3 (move buttons), 4 (sheets, per-side chip, title wrap) |
| `bk-builder.css` | 3, 4 |
| `bk-ui.css` | 3 (reorder classes / week pill), 4 (sticky header, week pill) |
| `SessionDetailPage.jsx` (live session) | 1 (discard confirm), 7 (rest timer), 11 (`window.confirm`), 16 (debrief panel on the completed branch) |
| `CoachPanel.jsx` | 2, 16 |
| `useHoldToReorder.js` | 3 only, but weeks/days regress if the hook grows a vertical axis (`WeekStrip.jsx`, `DayPicker.jsx`) |

`DashboardPage.jsx` does not collide with the builder or `index.css` units except through the shared bar component in unit 1 vs unit 9 (`PersistentWorkoutBar.jsx`, `index.css`).

## Acceptance criteria

- Working tree: see the `git status` evidence below. Expected: ignored `DELIVERY.md` only.
- Sections A-G are above. Each answer cites a path:line that exists on this branch, or says not found plus where it was looked up.

### git status (read-only check)

```
$ git status --untracked-files=all
On branch recon/qol-r-3
nothing to commit, working tree clean

$ git check-ignore -v DELIVERY.md
.gitignore:48:/DELIVERY.md	DELIVERY.md

$ git status --ignored --short --untracked-files=all -- DELIVERY.md
!! DELIVERY.md
```

`!!` is git's ignored-file mark. No other path is modified.

## Deviations

None. Axis support, 100kb default, and CRLF counts are from this checkout, not from memory.
