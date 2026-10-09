# DELIVERY qol-r1: RECON - logging preferences, mirror-last-numbers, finish-without-effort

MODE: report only. No code changes. No git operations (including no `git status`). No test lane: this block allows none.

Files touched: `DELIVERY.md` only.

## A. Where the preferences live today

### A1. lbs / kg

The only write path is the quick-log Units row on the live session screen. Storage is device `localStorage` key `workoutdb-weight-unit`. There is no account column.

Accessor (`client/src/lib/weightUnitPref.js`):

```1:25:client/src/lib/weightUnitPref.js
const STORAGE_KEY = "workoutdb-weight-unit";
// ...
export function loadWeightUnit() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "kg" || raw === "lbs" ? raw : "lbs";
  } catch {
    return "lbs";
  }
}
export function saveWeightUnit(unit) { /* setItem same key; rejects other values */ }
```

Comment at lines 3-7: display-only, stored weights are never converted, "Device-local for now".

The only `saveWeightUnit` call site is `client/src/pages/SessionDetailPage.jsx` 3643-3660, inside the quick-log branch (`isFromTemplate` is false at 3611; template sessions and block days do not render this control). Two buttons, `lbs` and `kg`, class `quick-log-toggle`, also call `setWeightUnit`. State is initialized at line 2062 from `loadWeightUnit()`.

Read-only consumers of `loadWeightUnit()` (labels, not a toggle):

| File | Line | What it does |
|---|---|---|
| `client/src/lib/weightDisplay.js` | 1, 19, 32 | `formatWeight` / `formatEstimate` default unit |
| `client/src/pages/SessionDetailPage.jsx` | 3510 | passes `weightUnit` into `BlockExerciseCard` |
| `client/src/pages/DashboardPage.jsx` | 251 | tonnage label on Recent |
| `client/src/pages/SessionsPage.jsx` | 42 | history list |
| `client/src/pages/AnalyticsPage.jsx` | 563, 598, 601 | plan/actual strings |
| `client/src/components/analytics/ExercisesView.jsx` | 309 | exercise roster |
| `client/src/components/coach/CoachPanel.jsx` | 158 | coach request `unit` |
| `client/src/components/blocks/builder/BlockBuilder.jsx` | 214 | `deviceUnit` |
| `client/src/pages/ImportBlockPage.jsx` | 76 | `devicePref` |
| `client/src/pages/BlockRunPage.jsx` | 30 | run page unit |

`User` (`server/prisma/schema.prisma` 13-30) has no weight-unit field. Grep of `schema.prisma` for `weightUnit` / `preference`: not found.

### A2. RIR vs RPE, effort on/off, notes on/off

Four stores, different scopes.

**1. Device effort signal** — `client/src/lib/effortSignalPref.js` 1-24. Key `workoutdb-effort-signal`. Values `"rir"` | `"rpe"`. Default `"rir"`. Per device. Comment lines 4-6: defaults for new templates and quick logs. Never stores null.

Written from:

- Quick log live session: `SessionDetailPage.jsx` `onLiveEffortSignalChange` 3225-3229 calls `saveEffortSignal` only when `isQuickLog`.
- Create template: `CreateTemplatePage.jsx` 207-212 calls `saveEffortSignal` on the `RirRpeToggleRow`.

**2. Quick-log notes (and a legacy effort pair)** — `client/src/lib/quickWorkoutLogPrefs.js` 1-26. Key `workoutdb_quick_log_display_prefs_v1`. JSON `{ useRIR?, useRPE?, useExerciseNotes?, useSessionNotes? }`. Per device. Comment line 6: `useSessionNotes` is legacy; Quick Workout no longer surfaces it.

Read/write on the live quick-log screen only (`SessionDetailPage.jsx` 2607-2618 seed, 3621-3629 notes toggle). Seed forces `useSessionNotes: false` (2608-2609). Exercise notes default **on** when the key has no boolean (2610-2612). The same seed prefers an effort signal already on the session's sets over `loadEffortSignal()` (2615-2617). The UI does not write `useRIR`/`useRPE` except as a side effect of the notes toggle (3624-3628 copies the current live booleans). The visible RIR/RPE control is `RirRpeToggleRow`, which persists via `saveEffortSignal`, not this JSON.

**3. Per template** — `WorkoutTemplate.useRIR` / `useRPE` booleans (`schema.prisma` 74-75, default false). Written by `POST /templates` and `PATCH /templates/:id` (`server/src/controllers/templateController.js` 32, 66-78 create; 237, 262-274 update). Client sends them from `client/src/api/templateApi.js` 3-6 and `CreateTemplatePage.jsx` 77-83. `EditTemplatePage.jsx` 18-21 maps stored booleans to a signal (RIR wins if both). There is **no** `useExerciseNotes` / `useSetNotes` column. Those checkboxes (`CreateTemplatePage.jsx` 179-204, `EditTemplatePage.jsx` 187-212) are page state that shows or hides note fields in `WorkoutBuilder` / `SetRow`. Note **text** that the user types is stored on `TemplateExercise.notes` (`schema.prisma` 97) and `TemplateSet.notes` (117). `EditTemplatePage.jsx` does not call `saveEffortSignal`; changing the signal there updates the template columns only (215-217).

**4. Per block** — `BlockTemplate.useRIR` / `useRPE` (`schema.prisma` 212-213). Also `useDuration` (214), but `serializeToPayload` always sends `useDuration: false` (`client/src/components/blocks/builder/blockBuilderState.js` 313-324). The settings sheet is `BlockSettingsSheet.jsx` 82-91: segmented `EFFORT_OPTIONS` `rpe` | `rir` | `none` (lines 5-9), copy from `effortScaleNote` (11-14). No notes on/off control in that sheet. Persist path: `blockBuilderState.js` 322-323 maps `effort` to the two booleans; server writes them in `server/src/controllers/blockTemplateController.js` 195-241 and `server/src/blocks/blockTemplateStore.js` 63-64, 205-217. Scope: per block template, not per day.

**5. Live session screen** (`SessionDetailPage.jsx`) — not its own columns. `WorkoutSession` has `notes` (schema 134) but no effort-mode columns. Seed effect 2563-2618:

- From a template (2572-2588): RIR/RPE from `workoutTemplate.useRIR` / `useRPE`, except a signal already present on sets wins (`sessionLoggedEffortSignal`, 365-369). Both template booleans false stays off (null). Workout-description / exercise-notes / set-notes checkboxes initialize from whether any of those note strings are already non-blank (2573-2577). Those three toggles (3581-3607) are React state for this visit; they are not written back to the template or to localStorage.
- From a block (2591-2604): same resolution from `blockContext.useRIR` / `useRPE` (`sessionController.js` `resolveBlockContext` 116-117). `setLiveUseExerciseNotes(false)` always (2595). If the block chose a scale, the toggle is replaced by a locked chip (3232-3245).
- Quick log: device prefs, as above. Set notes forced off (2618).

The either-or control is `client/src/components/templates/RirRpeToggleRow.jsx` 12-107. It cannot select null (comment 22-23). Null only renders the "Effort logging off" nudge (24-36). Once any set has a non-blank rir or rpe, the control locks (`SessionDetailPage.jsx` 3206-3210, copy 3260-3263).

Block-day logger rows read `effortSignal` and show one column (`BlockSetRow.jsx` 144-145, 479-503). They do not store a preference.

Scope summary:

| Control | Scope | Storage |
|---|---|---|
| lbs/kg | per device | `localStorage` `workoutdb-weight-unit` |
| Quick-log RIR vs RPE | per device (overridden for a session that already has effort values) | `localStorage` `workoutdb-effort-signal` |
| Quick-log exercise notes | per device | `localStorage` `workoutdb_quick_log_display_prefs_v1` `.useExerciseNotes` |
| Template RIR vs RPE | per template | `WorkoutTemplate.useRIR` / `useRPE` |
| Template notes visibility | per page visit while editing/creating | React state; note text on template exercise/set rows |
| Block effort scale including None | per block | `BlockTemplate.useRIR` / `useRPE` |
| Live template/block note toggles | per session visit | React state, seeded from existing note strings |
| A session's logged effort values | per set | `WorkoutSet.rir` / `rpe` |

There is no per-session effort-mode column.

### A3. Server columns, writers, `/me`

Columns that exist:

- `WorkoutTemplate.useRIR`, `useRPE` — `schema.prisma` 74-75. Writers: `templateController.js` create 66-78, update 262-274. Routes: `server/src/routes/templateRoutes.js` mounted at `/templates` (`server/src/routes/index.js` 55).
- `BlockTemplate.useRIR`, `useRPE`, `useDuration` — `schema.prisma` 212-214. Writers: `blockTemplateController.js` 229-241, `blockTemplateStore.js` 205-217. Routes: `/block-templates` (`index.js` 56).
- Note text: `WorkoutSession.notes` 134, `SessionExercise.notes` 188, `WorkoutSet.notes` 159, `TemplateExercise.notes` 97, `TemplateSet.notes` 117, `BlockWorkoutExercise.notes` 260.
- `User` 13-30: `email`, `displayName`, `usernameKey`, `passwordHash`, `aiConnectorEnabled`, relations. No preference columns.

`GET /auth/me` (`authRoutes.js` 14, `authController.js` `me` 245-270) returns `sanitizeUser` (lines 8-14), which strips only `passwordHash`. No settings sub-object. No other preferences or settings route was found under `server/src/routes/` (searched route files for `/me`, `preferences`, `settings`).

`useExerciseNotes` / `useSetNotes` / weight unit: not found as Prisma fields (grep of `schema.prisma` and `sessionController.js`).

### A4. Profile and Home at phone width, and existing settings surfaces

No `@media` targets 390px. The narrow layout is the default; wider rules start at `min-width: 640px` (home gap), `max-width: 719px` (home min-height above the bottom nav), and `min-width: 900px` (profile becomes a two-column grid). A 390px phone uses the default single column.

**Profile** (`/profile`, `client/src/App.jsx` 137-140), component `client/src/pages/ProfilePage.jsx`, CSS `client/src/index.css` from 1310 (`.settings-page`, `.profile-hub-*`, `.settings-section` 1541, `.settings-group` 1562). Top to bottom in `ProfilePage.jsx` 64-172:

1. `header.profile-hub-header` — avatar, name, email, member since (66-81).
2. `.profile-hub-stats` — three tiles: Workouts, This week, Week streak (83-99).
3. `section.settings-section` heading "Settings" (101-159): links Appearance `/profile/appearance`, Security `/profile/security`, AI access `/profile/ai`, Send feedback `/profile/feedback`, What's new (prod only), Dev feedback (reviewer emails only).
4. `ErrorMessage` if logout failed (161).
5. `footer.settings-logout-region` Log out (163-172).

Child routes, same app file: appearance 145, security 153, ai 161, feedback 169, whats-new 177. Appearance is theme/palette (`AppearancePage.jsx`); it does not host weight or effort prefs. This is the existing settings list. No logging-preferences row.

**Home** is `DashboardPage` at `/` (`App.jsx` 43), CSS `client/src/index.css` `.workout-tab` 4749, `.home-masthead` 4814, `.workout-tab-recent` 4989. Render order `DashboardPage.jsx` 324-499:

1. `header.home-masthead` — wordmark + date (326-332). CSS in `index.css`.
2. Optional "Workout saved" / "Workout discarded" flashes and start errors (333-367).
3. `.workout-tab__log-row` (369-406): `StartWorkoutHero` (`client/src/components/workout/StartWorkoutHero.jsx`, imports `client/src/styles/blocks/bk-run.css`) or `ActiveWorkoutHero` (`client/src/components/workout/ActiveWorkoutHero.jsx`, styles in `index.css`). Then, when a block is active and nothing is live, `UpNextCard` (`client/src/components/blocks/run/UpNextCard.jsx`, `bk-run.css`) or a placeholder.
4. If a workout is live and a block is active: a second, muted `UpNextCard` (408-417).
5. `WeeklyReport` (`client/src/components/analytics/WeeklyReport.jsx`, styles in `index.css`) with optional `WeekStrip` (`client/src/components/workout/WeekStrip.jsx`) when the block card is not showing (422-432).
6. `section.workout-tab-recent` "Recent workouts" (434-494).
7. `StartWorkoutPicker` (`client/src/components/workout/StartWorkoutPicker.jsx`) is a closed sheet until the hero opens it (496+). Not a resting section.

No settings or preferences section on Home. The log control is the hero in section 3.

## B. Mirror last numbers

### B1. How a normal workout's set rows start

`POST /sessions/start/:templateId` (`sessionController.js` `startSession` 219-347) copies template **exercises** onto `SessionExercise` (names, `exerciseId`, `userExerciseId`, `targetSets`, `targetReps`, `notes` at 277-290). It does **not** create `WorkoutSet` rows and does not read `TemplateSet`. `POST /sessions` ad hoc (`createAdHocSession` 485-513) creates an empty session. So the first set row is not filled from the template and not filled from a previous workout.

On the client, an exercise with zero sets renders one local draft (`SessionDetailPage.jsx` 1911-1926, `isDraft`). Draft fields start empty (`reps: ""`, `weight: ""`, … at 884 and the blank path around 928). Placeholders are the literal `"e.g. 185"` for weight when there is no plan (`1300-1301`) and the next-set hint "Enter weight & reps for this set." (1351-1356). A template's planned line, when there is no block `plan`, is only `targetSets` / `targetReps` text (1845-1849), not per-set load.

**Same exercise, next set:** `buildCreateSetBodyFromLast` (242-257) copies `weight`, `rpe`, `rir`, and `notes` from the last set of that exercise and **does not copy reps**. Comment 248: "Intentionally do NOT copy reps: it can make a new set look completed." Callers: `onCreateSetForExercise` 2813-2818 (last set of the exercise) and set-count increase 2946-2952. Per-side pairs copy from the last set of the **same side** (`createSetPairForExercise` 300-309). That copy is a real `POST /sessions/:id/sets` body, so the weight is saved as soon as the row is added. The first row of an exercise has no `last`, so it stays a blank draft until the user types.

No "last time" / previous-column / hint line was found in the logger. Searched `SessionDetailPage.jsx` for `last time`, `previous`, `e.g. 185` (placeholder only). Exercise detail (B3) shows a heaviest top set, not the previous session's loads, and it is the analytics page, not the logger.

### B2. Block-day ghosts

`startSessionFromBlock` (`sessionController.js` 350-479) stores a `plan` JSON on each `SessionExercise` and still creates **no** set rows. Plan shape is built in `server/src/blocks/blockRunLogic.js` `buildSessionFromBlockWorkout` 38-72: `plan.v`, `effort`, `effortCap`, `perSide`, `restSec`, `notes`, and `sets[]` of `{ reps, repsMax, durationSec, weight, rpe, rir }` from `planSetsFromExercise` (16-28).

Ghosts are HTML placeholders, not saved values. `client/src/components/blocks/log/ghostPlaceholders.js`:

- `weightGhostFromPlan` 36-44 — planned weight, else the unit hint.
- `doseGhostFromPlan` 53-56 — reps or seconds.
- `effortGhostFromPlan` 17-28 — display only (`≥` / `≤` when capped).
- `fillDraftFromPlanExceptEffort` 65-78 — copies weight and reps or seconds into the draft **only for fields that are still empty**. Never copies rir/rpe. Comment line 59.

`BlockSetRow.jsx` header comment 98: "Ghosts are placeholders only; chk tap fills from plan except effort." The control is the set-number button (430-438), `aria-label` "Log set N as planned" / title "Log as planned". `onChkTap` 324-352 writes `fillDraftFromPlanExceptEffort` into the draft, then:

- If the row is still a draft and the filled draft is not blank, `tryPromote()` (332-334), which creates a server set only when `blockDraftHasDose` is true (reps non-blank, or a parseable duration). Weight alone does not promote (`BlockSetRow.jsx` 42-47, 220-221).
- Effort is explicitly not invented (347).

A grey placeholder is not a `WorkoutSet`. The checkmark (`done`, 396-399) is true only after the row counts as logged (reps or seconds on the saved set, or the local draft already has a dose). `AsPlannedControl` (`client/src/components/blocks/log/AsPlannedControl.jsx` 7-19) is a second fill button ("As planned") on the non-block `SessionSetRow` when `planSet != null` (`SessionDetailPage.jsx` 1101-1119, 1358-1361). It also fills weight and reps/seconds and never effort, then promotes or flushes.

### B3. "Last completed set for exercise X"

Not found as a dedicated endpoint or helper.

What exists:

- `GET /analytics/exercise` (`server/src/routes/analyticsRoutes.js` 13, handler `analyticsController.js` `getExerciseDetail` 101-150). Query: exactly one of `exerciseId` or `userExerciseId`, optional `from` / `to`. 404 `"No logged sets for that exercise"` (148). Implementation: `server/src/ai/analyticsAccess.js` `loadExerciseDetail` 216-226 calls `fetchAllTimeEnrichedSets` (33-74), which loads **every** session for the user (not only `completedAt != null`) and every set, then `buildExerciseDetail` (`server/src/analytics/exerciseDetail.js` 188-275).

Response shape (257-274): `{ identity: { exerciseId } | { userExerciseId }, name, totals: { sessions, sets, effectiveSets, stimulatingSets }, topSet, topSets, bestE1rm, e1rmHistory, matchedEffortTrend, weeklyVolume, repTargets, loggedRepRange, personalRecords }`. `topSet` / each `topSets` entry is `{ weight, reps, performedAt }` (`serializeTopSet` 88-93). `topSet` is the **heaviest** set (`isHeavier` 78-86), not the latest. `topSets` is up to 5 distinct (weight, reps) pairs, earliest date each was hit (154-176). No `side`, no `durationSec`, no per-session set list. `from`/`to` bound only `weeklyVolume` (comment 182-186).

- `GET /analytics/exercises` returns `{ exercises: [{ identity, name, lastPerformed, sessionCount }] }` (`exerciseDetail.js` `buildExerciseIndex` 47-75). Date only, no loads.
- `GET /sessions/mine` (`sessionController.js` 856-900) returns sessions newest `performedAt` first, and each set as `{ weight, reps }` only (889-893). No exercise id or name on those sets, so it cannot answer "last time for exercise X" without another request.
- `GET /sessions/:id` returns full sets with `sessionExercise` (906-954).

Match rule for the analytics identity (`server/src/analytics/resolve.js` `resolveExercise` 7-78, used when enriching): catalog `exerciseId` if it is in the catalog; else `userExerciseId`; else normalized `exerciseName`, then alias, then plural fold, then the user's custom exercise by normalized name. `identityKeyOf` (`exerciseDetail.js` 25-28) then groups by `resolution.catalogEntry.id`, which is the catalog id or `user:<id>`. Name-matched catalog rows and id-stamped rows of the same exercise share one key (comment 21-24).

### B4. Per-side and duration rows

`WorkoutSet.side` is an optional string (`schema.prisma` 160). Server accepts only `"L"`, `"R"`, or null (`sessionController.js` `validateOptionalSide` 127-137). `WorkoutSet.durationSec` is optional int (161). `BlockWorkoutExercise.perSide` is optional boolean (263).

Block logger (`BlockExerciseCard.jsx` 196-207, 278, 301-305): a row is timed when the plan set has `durationSec` or every plan set is timed (`planHelpers.js` `isTimedPlanSet` 23-26, `isTimedPlanExercise` 32-36). Timed rows edit seconds instead of reps (`BlockSetRow.jsx` 450). Per-side mode is `derivePerSideMode(perSideOverride ?? plan.perSide, exerciseName, sets)` — three arguments (`perSideMode.js` 27-30): explicit true/false wins, else any existing L/R set, else a name heuristic (one-arm, one-leg, single-arm/leg/dumbbell, unilateral; "single response" excluded, lines 7-16). When on, the card renders a Left column and a Right column (`sides` around 332).

Normal logger (`SessionDetailPage.jsx` 259-298, 1611, 1914-1961): same `derivePerSideMode`, but the call passes the override, the name, and the sets (the plan's `perSide` is not the first argument on this path). Pairs are grouped L/R (`groupSetsIntoRenderUnits`). Timed mode is passed only when a block `plan` is present (1936, 1980, 2014). A non-block workout's rows are weight + reps. Left-side weight blur can copy weight onto the partner set (`onWeightFieldBlur` 1088-1097).

A prefill that only knows weight/reps misses: `side` (two rows per pair), `durationSec` (timed plan sets have no reps), and the block rule that reps-or-seconds, not weight, is what counts as logged.

### B5. What marks a set logged

Two different predicates.

**Normal finish / "core logged"** — `sessionSetHasCoreLogged` (`SessionDetailPage.jsx` 328-337): `durationSec` non-blank, **or** both weight and reps non-blank. Not a checkbox. Optional rir/rpe/notes are ignored. The finish **count** is different: `totalSetsLogged` is `session.sets.length` (3203), so any persisted row counts toward "at least one set", even a weight-only row created by `buildCreateSetBodyFromLast`.

**Block progress / checkmark** — `blockSetIsLogged` (`BlockSetRow.jsx` 49-55): `durationSec` non-blank **or** reps non-blank. Weight is not required. Comment 42-43: weight or effort alone stays a local draft.

**When a draft becomes a saved row (normal):** any non-blank field (`sessionSetRowIsBlank` is false, 315-325) promotes after 900ms or on blur (`tryPromote` 1010-1015, debounce 1122-1134). A pre-filled weight **and** reps sitting in the draft as real input values would POST and become core-logged. A ghost that is only a `placeholder` attribute would not. Block promote additionally requires a dose (B2).

So a mirror-last feature that writes weight+reps into the draft the way chk-tap writes the plan will save the set without a separate "I did this" action, and (when an effort signal is on) will then demand RIR/RPE before Finish (section C).

## C. Finish without effort

### C1. Normal workouts

The gate is client-only, in `SessionDetailPage.jsx`:

```3211:3217:client/src/pages/SessionDetailPage.jsx
  const coreLoggedSets = sessionSets.filter((s) => sessionSetHasCoreLogged(s));
  const setsMissingEffort =
    !isCompleted && liveEffortSignal != null
      ? coreLoggedSets.filter((s) => !sessionSetHasSignalEffort(s, liveEffortSignal)).length
      : 0;
  const effortMandateOk = liveEffortSignal == null || setsMissingEffort === 0;
  const canFinishWorkout = totalSetsLogged >= 1 && effortMandateOk;
```

`liveEffortSignal` is `"rir"` if `liveUseRIR`, else `"rpe"` if `liveUseRPE`, else null (3204). Null (effort logging off: template or block with both booleans false) skips the mandate. `sessionSetHasSignalEffort` (346-352) requires a non-blank `rir` or `rpe` matching the active signal. Highlight of empty effort fields: 1233-1237 (`highlightMissingEffort`).

`requestFinishWorkout` (3274-3280) returns immediately when `!canFinishWorkout`. The button is `disabled={!canFinishWorkout || ...}` (3888-3892). Hint copy (3869-3886): "Log at least one set anywhere to enable Finish workout." or "Add RPE/RIR on N more set(s) to enable Finish workout."

`POST /sessions/:id/complete` (`sessionRoutes.js` 31, `completeSession` `sessionController.js` 1524-1626) checks auth, id, ownership, and `completedAt` ("Session is already completed", 1563-1566). It sets `completedAt` and, for ad hoc sessions, a name. It does not read sets, rir, or rpe. No validator and no effort error message.

Integration evidence, not a unit test: `server/test/sessions.lifecycle.test.js` 297-307 posts a set `{ reps: 5, weight: 100 }` with no rir/rpe and expects `POST .../complete` **200**.

### C2. Block days

Same page, same `canFinishWorkout`, same dock, same `requestFinishWorkout`. Block days are `SessionDetailPage` with `isFromBlock`, not a second finish function. Extra gate after the effort gate: if `blockUnloggedPlanned > 0`, Finish opens a confirm instead of completing (3276-3279, 3838-3862). Copy: `"{n} of {total} planned sets not logged - finish anyway?"` with buttons "Finish anyway" and "Keep logging" (classes `session-finish-confirm`). Unlogged count uses `blockSetIsLogged` (reps or seconds), via `blockProgress` (3186). A block whose scale is None (`liveEffortSignal == null`) is not effort-blocked. A block locked to RIR or RPE is.

### C3. Mandate copy and confirm patterns a warning could reuse by name

Mandate / education copy that exists:

- Finish dock hints, `SessionDetailPage.jsx` 3869-3886 (the disable message).
- Lock line, 3260-3263: "Signal locked - fixed for this workout once effort is logged on a set."
- Block chip title, 3241: scale locked by the block.
- `RirRpeToggleRow.jsx` 26-35: "Effort logging off…" and the "Two sets of 10…" sentence. Shown only when `value === null`.
- `EditTemplatePage.jsx` 27 and 220: `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT` / "Choose RIR or RPE before saving." That gates **template save**, not workout finish.
- `BlockSettingsSheet.jsx` `effortScaleNote` 11-14.
- Analytics unlock strings ("log RIR or RPE…") live on the analytics pages (`AnalyticsPage.jsx`, `ExercisesView.jsx`, `WeeklyReport.jsx` 156). They are not on the finish button.

Confirm patterns, by the names in the task:

- `confirmLeaveLiveSession` — `client/src/lib/confirmLeaveLiveSession.js` 1-5. `window.confirm("You have a workout in progress. Leave this screen? ...")`. Used by `client/src/lib/useGuardedNav.js` 21. This is the browser dialog, not the in-page panel.
- `.session-discard-confirm` — markup in `SessionDetailPage.jsx` 3428-3460 (title `session-discard-confirm__title`, body `__body`, actions `__actions`, danger button `__discard`). CSS `client/src/index.css` 9565-9611. Also reused by name in `BlockSettingsSheet.jsx` 158, `BlockBuilder.jsx` 1755+, library cards, `BlockRunPage.jsx` 362. That panel is the discard warning, not finish.
- Closest finish-anyway panel already on the logger: `.session-finish-confirm` (`SessionDetailPage.jsx` 3838-3862, CSS `client/src/styles/blocks/bk-log.css` 539+). Title, then "Finish anyway" / "Keep logging". It currently fires only for unlogged **planned** sets on block days.

In-page leave confirm (unsaved writes) is a different class: `.session-leave-confirm` (`SessionDetailPage.jsx` 3404-3426).

### C4. Unit tests that encode the finish mandate

Not found under `server/test/analytics/**` or `server/test/lib/**`.

Searched those trees for `canFinishWorkout`, `setsMissingEffort`, `complete` + effort, "RIR required", "missing effort". No test asserts that finishing is rejected or disabled when a core-logged set has no RIR/RPE. The analytics tests treat missing effort as a data case (coverage drops, stimulating sets null) — for example `server/test/analytics/summary.test.js` 164-178 and `server/test/analytics/effort.test.js`. Relaxing the client finish gate would not fail them, because they never call `completeSession` and they already allow sets with no effort.

The test that actually completes a session with no effort is the integration file `server/test/sessions.lifecycle.test.js` 297-307 (outside the two directories). It expects 200, so it encodes the **absence** of a server mandate. It would keep passing if the client stops blocking Finish.

## D. Collision map

Candidate files a contract would touch. Starred files sit under more than one ask.

**Ask 1 — move unit + effort/notes toggles to one preferences surface**

- `client/src/lib/weightUnitPref.js`
- `client/src/lib/effortSignalPref.js`
- `client/src/lib/quickWorkoutLogPrefs.js`
- `client/src/lib/weightDisplay.js`
- `client/src/components/templates/RirRpeToggleRow.jsx`
- `client/src/pages/ProfilePage.jsx` and/or `client/src/pages/DashboardPage.jsx` (the new surface)
- `client/src/pages/profile/AppearancePage.jsx` only if the surface is hung off Appearance (it is theme/palette today)
- `client/src/App.jsx` if a new route is added
- `client/src/index.css` (`.settings-*`, `.quick-log-toggle`, `.profile-hub-*`, `.workout-tab`)
- `client/src/pages/CreateTemplatePage.jsx`
- `client/src/pages/EditTemplatePage.jsx`
- `client/src/components/blocks/builder/BlockSettingsSheet.jsx`
- `client/src/components/blocks/builder/blockBuilderState.js`
- `client/src/api/templateApi.js`
- `server/prisma/schema.prisma` and a migration only if the pref becomes an account column (none exists)
- `server/src/controllers/authController.js` (`me` / `sanitizeUser`) and `server/src/routes/authRoutes.js` if `/me` grows settings
- `server/src/controllers/templateController.js`
- `server/src/controllers/blockTemplateController.js`
- `server/src/blocks/blockTemplateStore.js`
- Read sites that would pick up a moved unit pref: `DashboardPage.jsx`, `SessionsPage.jsx`, `AnalyticsPage.jsx`, `ExercisesView.jsx`, `CoachPanel.jsx`, `BlockBuilder.jsx`, `ImportBlockPage.jsx`, `BlockRunPage.jsx`

**Ask 3 — opt-in mirror of last weight/reps**

- `client/src/pages/SessionDetailPage.jsx` (`buildCreateSetBodyFromLast`, draft promote, placeholders)
- `client/src/components/blocks/log/ghostPlaceholders.js`
- `client/src/components/blocks/log/planHelpers.js`
- `client/src/components/blocks/log/BlockSetRow.jsx`
- `client/src/components/blocks/log/BlockExerciseCard.jsx`
- `client/src/components/blocks/log/perSideMode.js`
- `client/src/components/blocks/log/AsPlannedControl.jsx`
- `server/src/controllers/sessionController.js` (`startSession`, `startSessionFromBlock`, `completeSession` only if prefill is server-side)
- `server/src/blocks/blockRunLogic.js` (plan snapshot; not last-session data)
- `server/src/ai/analyticsAccess.js` (`fetchAllTimeEnrichedSets` — closest set fetch, no "last set" shape)
- `server/src/analytics/exerciseDetail.js`
- `server/src/analytics/resolve.js`
- `server/src/controllers/analyticsController.js`
- `server/src/routes/analyticsRoutes.js`
- `server/prisma/schema.prisma` (`WorkoutSet.side`, `durationSec`, exercise FKs) if the query is new
- Tests: `server/test/analytics/exerciseDetail.test.js` if the detail payload grows; new client or server tests for prefill

**Ask 4 — warn and finish without effort**

- `client/src/pages/SessionDetailPage.jsx` (the gate, the dock, `requestFinishWorkout`, `.session-finish-confirm`)
- `client/src/styles/blocks/bk-log.css` (`.session-finish-confirm`)
- `client/src/index.css` (`.session-discard-confirm`) if that panel is reused
- `client/src/lib/confirmLeaveLiveSession.js` and `client/src/lib/useGuardedNav.js` only if the warning uses the browser confirm
- `client/src/components/blocks/log/BlockSetRow.jsx` only for the missing-effort highlight on block rows
- `server/src/controllers/sessionController.js` `completeSession` only if a server check is added (there is none today)
- `server/test/sessions.lifecycle.test.js` if server behavior changes
- No file under `server/test/analytics/**` or `server/test/lib/**` encodes the gate

**Files under more than one ask**

- `client/src/pages/SessionDetailPage.jsx` — asks 1, 3, and 4. The toggles, the draft/prefill path, and the finish gate are all in this file.
- `client/src/index.css` — asks 1 and 4 (settings rows, quick-log toggles, discard confirm).
- `client/src/pages/DashboardPage.jsx` — asks 1 and 3 if Home is the preferences surface or the opt-in control; it also reads the unit for tonnage.
- `client/src/components/blocks/log/BlockSetRow.jsx` — asks 3 and 4 (ghost fill vs what counts as logged; effort cell).
- `client/src/components/blocks/log/BlockExerciseCard.jsx` — asks 1 (effort signal prop) and 3 (per-side / timed rows).
- `server/src/controllers/sessionController.js` — asks 3 and 4 (`startSession` / block plan vs `completeSession`).
- `server/prisma/schema.prisma` — asks 1 and 3 if either an account pref column or a new query depends on it.

`BlockSettingsSheet.jsx`, the template pages, and the pref libs are ask 1 only. `ghostPlaceholders.js`, `planHelpers.js`, and the analytics modules are ask 3 only. `confirmLeaveLiveSession.js` and `bk-log.css` are ask 4 only.

## Acceptance criteria

1. Working tree: this block forbids git operations, and the user instruction forbids them, so `git status` was not run. The only file written is `DELIVERY.md`.
2. Sections A-D are above. Each numbered question has file:line citations that were read in this worktree. "Not found" is used for: a weight-unit account column, a `useExerciseNotes` column, a `/me` preferences payload, a 390px breakpoint, a last-set endpoint, and unit tests of the finish mandate under `server/test/analytics/**` and `server/test/lib/**`.

## Deviations

None. Report only; no tests were run because the block allows no lane.
