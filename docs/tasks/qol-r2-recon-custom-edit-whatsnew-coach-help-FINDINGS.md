# DELIVERY — qol-r2 recon (custom exercises, What's New, coach app-help)

Report only. No code changes. No git writes (one read-only `git log` / `git status`, required by B.3 and the acceptance check).

## Files touched

- `DELIVERY.md` (this file). Nothing else.

## Test output

No test lane is in this block. Not run.

## Acceptance

- Working tree: after this file is written, `git status` should show no tracked changes. `DELIVERY.md` is gitignored (`AGENTS.md`); an ignored file satisfies "untracked or ignored `DELIVERY.md`". Evidence is at the bottom of this report.
- Sections A–D below. Each numbered question has a file:line that exists on this branch, or "not found" plus where it was looked for.

## Deviations

None. B.3 uses read-only `git log` because the block requires it. No commit, push, or other git write.

---

## A. Custom exercises (ask 5)

### A1. Prisma model

The user-owned row is `UserExercise` (`server/prisma/schema.prisma` 274–287). It is not a row of the catalog `Exercise` model (293–313). There is no FK from `UserExercise` to `Exercise`.

```274:287:server/prisma/schema.prisma
model UserExercise {
  id                    Int                    @id @default(autoincrement())
  userId                String
  user                  User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                  String
  normalizedName        String
  muscles               Json
  createdAt             DateTime               @default(now())
  templateExercises     TemplateExercise[]
  sessionExercises      SessionExercise[]
  blockWorkoutExercises BlockWorkoutExercise[]

  @@unique([userId, normalizedName])
  @@index([userId])
}
```

| Asked field | On `UserExercise`? |
|---|---|
| Name | `name` (display) + `normalizedName` (dedupe key) |
| Uniqueness | `@@unique([userId, normalizedName])` line 286 |
| Catalog relation | none. Catalog collision is a create-time check, not a schema FK (A5) |
| Muscles | one `Json` object, keys = muscle names, values = `"primary"` or `"secondary"` (validator at `exerciseController.js` 26–72). Not separate `primaryMuscles` / `secondaryMuscles` columns |
| Muscle weights | not stored. Derived at read time: primary 1.0, secondary 0.5, then normalized (`server/src/analytics/userExercises.js` 3–22). Catalog `Exercise.muscleWeights` (`schema.prisma` 305) is catalog-only |
| Equipment | not on `UserExercise`. Catalog `Exercise.equipment` is `schema.prisma` 299. Search rows for customs hardcode `equipment: null` (`searchCatalog.js` 140–149) |
| Per-side flag | not on `UserExercise`. `BlockWorkoutExercise.perSide Boolean?` (`schema.prisma` 263) is a block-plan column. Logger per-side for a name with no plan flag is a name heuristic: `exerciseNameImpliesPerSide` in `client/src/components/blocks/log/perSideMode.js` 7 |

`User` back-relation: `userExercises UserExercise[]` at `schema.prisma` 29.

### A2. Routes

Mounted at `/exercises` (`server/src/routes/index.js` 54). Handlers are inline in the controller. No separate validator module (looked in `server/src/routes/exerciseRoutes.js` and `server/src/controllers/exerciseController.js`).

| Method + path | Handler | Lines |
|---|---|---|
| `GET /exercises/custom` | `listCustomExercises` | route `exerciseRoutes.js` 16; controller 192–211 |
| `POST /exercises/custom` | `createCustomExercise` | route 17; controller 123–190. Body `{ name, muscles }`. Validates name length ≤ 120 (line 6, 143–147), `normalizeExerciseName`, catalog collision, own-library `normalizedName`, `validateMuscles` |
| `DELETE /exercises/custom/:id` | `deleteCustomExercise` | route 18; controller 213–248. Owner-scoped `findFirst`, then delete. 204 |
| Update | **none** | `exerciseRoutes.js` 14–19 has search, muscles, list, create, delete, resolve. Grep of `server/src` for `updateCustomExercise`, `router.patch`/`router.put` on custom: not found |

Related reads that are not CRUD of the custom row:

- `GET /exercises/search` — `searchExercises` (`exerciseRoutes.js` 14)
- `GET /exercises/muscles` — vocabulary for the picker (`exerciseRoutes.js` 15, controller 107–121)
- `POST /exercises/resolve` — name resolution (`exerciseRoutes.js` 19)

Client wrappers: `client/src/api/exerciseApi.js` 19–28 (`createCustomExercise`, `listCustomExercises`, `deleteCustomExercise`). No update function.

### A3. What references a custom exercise

Both an **FK id** and a **copied name string** are stored. The name is not a live lookup.

| Surface | Link | Evidence |
|---|---|---|
| Session exercises | `exerciseName String` **and** optional `userExerciseId` FK, `onDelete: SetNull` | `schema.prisma` 178–185 |
| Template exercises | same pair, `onDelete: SetNull` | `schema.prisma` 87–94 |
| Block exercises | same pair, `onDelete: SetNull` | `schema.prisma` 250–257 |
| Session started from a template | copies `exerciseName`, `exerciseId`, and `userExerciseId` onto the new `SessionExercise` | `sessionController.js` 278–289 |
| Quick-add session exercise | writes `exerciseName` from the body; identity parse can also set `userExerciseId` | `sessionController.js` 534–535 and `parseOptionalExerciseIdentity` 140–180; rename of the session row is `updateSessionExercise` 719–736 (`exerciseName` only if the body sends it) |
| Block run → session | copies `userExerciseId` | `server/src/blocks/blockRunLogic.js` 54 |
| Analytics resolve | **id wins over the stored name** when `userExerciseId` is in the user index | `server/src/analytics/resolve.js` 19–26, then name match at 68–74 |
| Muscle volume | live `UserExercise.muscles` via `userExerciseWeights` when the resolution source is `userExercise` or `userExerciseId` | `attribution.js` 9–18, `enrichSet.js` 22–34 |
| `searchCatalog` | user rows keyed by id; muscles split back into primary/secondary arrays; `equipment: null` | `searchCatalog.js` 107–150 |
| Exercise detail | `GET /analytics/exercise` requires exactly one of `exerciseId` or `userExerciseId` | `analyticsRoutes.js` 13; `analyticsController.js` 101–126. Client panel: `client/src/components/analytics/ExercisesView.jsx` 365 and 603–607. Not a separate route (no `/exercises/:id` in `client/src/App.jsx`) |

What goes stale if the custom row changes:

- **Rename.** Linked rows keep the old `exerciseName` string. The logger renders that string (`BlockExerciseCard.jsx` 386–387), so history and block/template titles stay on the old name until something PATCHes them. Analytics that still has `userExerciseId` resolves the **current** `UserExercise.name` (`enrichSet.js` 31–32) and current muscles. Rows whose `userExerciseId` is null resolve only by normalized name (`resolve.js` 68–74); after `normalizedName` changes they stop matching this custom exercise.
- **Muscle edit.** Attribution is recomputed from the current `muscles` Json (`attribution.js` 14). Historical sets are not snapshotted, so past muscle volume moves with the edit for any set that still resolves to this id.
- **Delete.** FK `onDelete: SetNull` (`schema.prisma` 185, 94, 257). The name string remains. Library copy states the consequence: `LibraryExerciseCard.jsx` 46–48 — logged sets stay, the link drops, analytics stops attributing those sets to its muscles. After SetNull, name resolution can still hit the custom exercise only if some other row still has the same `normalizedName` (it will not; the row is gone), so the leftover name string becomes unresolved unless it also matches the catalog.

### A4. Library UI and create flow

List: Library page is `client/src/pages/MyTemplatesPage.jsx`. Exercises tab loads `exerciseApi.listCustomExercises()` (100) and renders `LibraryExerciseCard` (536–547). Empty copy (501–508) points at the builder search, import "Not in your library" rows, and the live-workout "Not tracked" pill. The card shows name, muscle summary, and Delete only (`LibraryExerciseCard.jsx` 6–7, 28–32, 74–82). No edit control.

Create UI: `AddExerciseToLibrarySheet` (`client/src/components/workout/AddExerciseToLibrarySheet.jsx`). Stepped sheet (`STEP_TITLES` 103–108): `suggest` → `seed` → `curate` → `done`. Library context (`context === "library"`, line 123) is opened from the block builder (`BlockBuilder.jsx` 1519) and import preview (`ImportPreviewStep.jsx` 399). Live/completed logger opens it from `SessionDetailPage.jsx` 3904–3910 with `initialName`.

Fields the create form collects (curate step, 661–680, submit 463–469):

- **Name** (text input). Seeded from `initialName` on open (162–163).
- **Muscles**, picker roles `main` / `assist`, posted as `"primary"` / `"secondary"`.
- Not collected: equipment, per-side, weights, instructions.

`muscleRoles` starts `{}` (145). A catalog search match can seed roles via `muscleRolesFromSearchRow` (66–75). Nothing reads an existing `UserExercise` back into the sheet.

Could it reopen pre-filled for edit? The curate step is already "name + muscle map." `initialName` pre-fills the name only. There is no `initialMuscles` / edit-id prop, and submit always calls `createCustomExercise` (469), never an update. Reusing the sheet for edit means a new mode and a pre-fill of `muscleRoles` from `muscles` (`primary`→`main`, `secondary`→`assist`). The Library card does not open the sheet today.

### A5. Name dedupe on create

1. Trim, max 120 chars (`exerciseController.js` 141–147).
2. `normalizeExerciseName` (`server/src/analytics/normalize.js` 1–8): lowercase, hyphens/underscores to spaces, strip characters other than `a-z0-9` and space, collapse whitespace. So `Bench Press` and `bench-press` are the same key. Plural fold (`foldExerciseNamePlural`, 15–19) is **not** applied to the stored `normalizedName`.
3. Catalog collision: `resolveExercise({ exerciseName })` with no user index (`exerciseController.js` 156–160). That path includes catalog name, alias, and plural fold (`resolve.js` 28–66). 400 `already tracked as ${catalogEntry.name}`.
4. Own library: `findFirst({ userId, normalizedName })` (163–169). 400 `a custom exercise with this name already exists in your library`. Backed by `@@unique([userId, normalizedName])` (`schema.prisma` 286).
5. Case: handled by step 2 (lowercase), not a separate case-insensitive DB collation check.

---

## B. What's New (ask 2)

### B1. Pieces and `isProdEnv()` gates

`isProdEnv` (`client/src/lib/appEnv.js` 15–18): false when `import.meta.env.DEV`; otherwise true only if `VITE_API_URL` contains `workout-db-l3gc`.

| Piece | Where | Gated? |
|---|---|---|
| `RELEASES` shape | `client/src/data/whatsNew.js` 17–95. Fields used: `id`, `date`, `title`, optional `tagline`, `sections[]` of `{ heading, items[] }`. `LATEST_RELEASE = RELEASES[0]` (97). Comment at 1–15 says newest first | Data module. Not gated itself. Comment 14–15 says modal + archive are prod-only |
| `WhatsNewContent` | `client/src/components/whatsnew/WhatsNewContent.jsx` 41–48 | No `isProdEnv` check. Callers decide |
| `WhatsNewModal` | `WhatsNewModal.jsx` 14–57 | No `isProdEnv` check |
| `WhatsNewGate` | `WhatsNewGate.jsx` 14–18, mounted from `Layout.jsx` 5 and 18 | `if (!isProdEnv()) return null` (18). Also requires `currentUser` and `LATEST_RELEASE` (19) |
| Storage | `client/src/lib/whatsNewStorage.js` 1–27. Key `workoutdb-whats-new-seen` | No env gate. Callers only save in prod (gate + page) |
| Route | `client/src/App.jsx` 177–182, path `/profile/whats-new`, `WhatsNewPage` inside `ProtectedRoute` | Route is always registered. Page redirects when not prod |
| Page | `client/src/pages/profile/WhatsNewPage.jsx` 14–19 | `if (!isProdEnv()) return <Navigate to="/profile" replace />` |
| Profile link | `client/src/pages/ProfilePage.jsx` 138–147, to `/profile/whats-new` | Wrapped in `{isProdEnv() ? ( ... ) : null}` |

### B2. When the modal shows, and what the archive renders

Show rule (`WhatsNewGate.jsx` 14–27): prod, logged in, `LATEST_RELEASE` exists, and `loadLastSeenRelease()` !== `LATEST_RELEASE.id`. Dismiss (button, backdrop, Escape, or "See all updates") calls `saveLastSeenRelease(LATEST_RELEASE.id)` (`WhatsNewModal.jsx` 16–18, 44–52; gate 22–25). Opening the archive also saves the latest id (`WhatsNewPage.jsx` 15–17), so the modal does not re-fire.

Archive (`WhatsNewPage.jsx` 29–33) maps every `RELEASES` entry through `WhatsNewContent`. Sections are a flat list of `<h3>` + `<ul>` (`WhatsNewContent.jsx` 17–32). No collapse state, no accordion, no "expanded" toggle. All sections of every release render open. The modal uses the same section component for the latest release only (`WhatsNewModal.jsx` 39–41).

### B3. Latest release date, and user-facing work since then with no release entry

Latest entry: `id: "2026-08-ai-assistant"`, `date: "2026-08-05"`, title "Ask your AI assistant about your training" (`whatsNew.js` 18–29). No later `RELEASES` entry.

`git log --oneline --since=2026-08-05` on this branch (`recon/qol-r-2`) includes the product history. `docs` commit `37f1532` records `ai-connector-wave` merged to `main` (`7d3b91e..ef5e908`, fast-forward). `origin/main` and this branch share merge-base `b5c6777`; this branch is one docs commit ahead (`8090b10`). Product commits below are on `main`. None of them added a `RELEASES` entry (the file still ends at 2026-08-05).

Newest first. LANDED units only, one-line scope from `docs/tasks/QUEUE.md`. Diagnosis-only `LANDED (report)` rows are omitted (no user-facing change). Critic-fix units are included because they changed the UI.

**sr3 critic round (landed Oct 7)**

- `sr3f3-add-to-library-shorter-path.md` (`ccf468b`) — library context: skip empty "similar", no "Added" sheet, 5 taps to 3 (`QUEUE.md` 397)
- `sr3f2-builder-critic-fixes.md` (`b64de00`) — default day names renumber; free-text stays "Not in library"; Per side chip visible (`QUEUE.md` 396)
- `sr3f1-library-resume-in-place-paused-look.md` (`cf4fdee`) — Start/Resume confirm on the tapped card; Paused chip + days done (`QUEUE.md` 395)

**sr3 (Oct 6–7)**

- `sr3-6-long-press-reorder-days-weeks.md` (`468bab9`) — hold a day/week pill to drag-reorder (`QUEUE.md` 378)
- `sr3-4-add-to-library-builder-import.md` (`f1fbf55`) — add a not-in-library exercise from the builder and import (`QUEUE.md` 377)
- `sr3-3-builder-header-actions-effort-public.md` (`ba415bf`, seat fix `230d4c0`) — week/day "..." menus, effort chip, Public line (`QUEUE.md` 375)
- `sr3-5-block-exercise-per-side.md` (`c6ae089`) — Per side on block exercises (`QUEUE.md` 376)
- `sr3-2-seven-day-week-cap.md` (`9c7f1f1`) — a week holds at most 7 days (`QUEUE.md` 374)
- `sr3-1-block-pause-resume.md` (`077f4b2`) — switching blocks pauses the old run; Resume or Start over (`QUEUE.md` 373)
- `sr3-d1` — diagnosis plus seat fix `a6f007f`: exercise picker keeps a definite height so Android search is not covered (`QUEUE.md` 372). Not a separate LANDED sha line.

**bkr fix wave (Oct 5–6)**

- `bkrf1c-import-library-logger.md` (`4352e91`) — AI-fix explains itself; Library/logger confirms in-page (`QUEUE.md` 351)
- `bkrf1b-home-stability.md` (`b1ed933`) — Home block card no longer jumps in late (`QUEUE.md` 350)
- `bkrf1a-builder-sheets-tokens.md` (`07bd1ea`) — dark scrim, value chips, finished sheets (`QUEUE.md` 349)
- `bkr5-home-log-first.md` (`52ee633`) — Home hero is "Start a workout"; running block as a card under it (`QUEUE.md` 345)
- `bkr4-builder-exercise-menu.md` (`1f6d42a`) — exercise settings as chips; round "..." is actions only (`QUEUE.md` 344)
- `bkr3-ai-file-fix.md` (`fb896ec`) — one "Have AI fix this file" button, cost 1–4 uses (`QUEUE.md` 343)
- `bkr1-ai-wait-loader.md` (`3373a9b`) — shared crown wait on AI actions; 120s client timeout (`QUEUE.md` 341)
- `bkr-f1-finish-bar-keyboard.md` (`eebadf4`) — Finish bar returns when the phone keypad closes (`QUEUE.md` 340)
- `bkr2-coach-guardrails.md` (`ed92b31`) — usage ledger; palette costs 1; coach on-topic only, short declines refunded (`QUEUE.md` 338)

**BK smoke fixes (Sept 30–Oct 1)** — scopes are the text after the unit id on each `LANDED` line:

- `bksf3b-logger-row-binding.md` (`b5e42f2`) — only the next planned row logs (`QUEUE.md` 305)
- `bksf3a-builder-range-header.md` (`2fd8773`) — rep-range headers line up on a phone (`QUEUE.md` 303)
- `bksf2c-home-run-round2.md` (`848ff3b`) — Home hero starts the block day (`QUEUE.md` 299)
- `bksf2b-import-round2.md` (`10cfb3a`) — AI read does not stick; sets×reps without AI (`QUEUE.md` 297)
- `bksf2a-builder-search-round2.md` (`d1c1940`) — RPE inline; your exercises rank first (`QUEUE.md` 295)
- `bksf1d-library-home-critic-fixes.md` (`d540d77`) — Library first card; "Open"; Home names the next day (`QUEUE.md` 289)
- `bksf1c-import-critic-fixes.md` (`fcba6f1`) — import weight unit from the source (`QUEUE.md` 287)
- `bksf1b-builder-search-critic-fixes.md` (`095e517`) — search ranking, limit 50, pinned picker (`QUEUE.md` 285)
- `bksf1a-logger-critic-fixes.md` (`28af540`) — logger keypad, finish confirm, Per side label (`QUEUE.md` 283)
- `bks4-xlsx-upload.md` (`a4eeff0`) — Excel upload on import (`QUEUE.md` 318)
- `bks3-library-redesign.md` (`fb2bda1`) — Library redesign, blocks first, running strip (`QUEUE.md` 307)
- `bks2-block-logger-planned-rows.md` (`5853dd4`) — block-day logger, a row per planned set (`QUEUE.md` 273)
- `bks1-ai-layout-import.md` (`1fc5bf8`) — AI reads sheet layout (`QUEUE.md` 264)

**BK feature units (wave opened Sept 28, `QUEUE.md` 9)**

- `bkf2-critic-round-2-fixes.md` (`9082443`) — block header critic fixes (`QUEUE.md` 242)
- `bkf1c-summary-timed-analytics-dates.md` (`0ddc413`) — finished-summary / timed analytics dates (`QUEUE.md` 231)
- `bkf1b-import-page-fixes.md` (`61dbae2`) — import preview opens at the right place (`QUEUE.md` 224)
- `bkf1a-builder-run-library-fixes.md` (`f69f278`) — empty days and related builder/run/library fixes (`QUEUE.md` 212)
- `bk12-coach-block-assist.md` (`f901f84`) — coach converts/generates a block draft (`QUEUE.md` 196)
- `bk11-connector-block-drafts.md` (`8d3f3eb`) — connector can create draft blocks (`QUEUE.md` 176)
- `bk9-logger-plan-timed-sets.md` (`06c0761`) — logger shows plan targets and timed sets (`QUEUE.md` 163)
- `bk8-run-a-block-client.md` (`8a8e5f3`) — `/blocks/current` (`QUEUE.md` 152)
- `bk6-import-export-ui.md` (`ab4a692`) — import page (`QUEUE.md` 140)
- `bk10-execution-block-branch.md` (`4bfd5cd`) — Execution judges block sessions (`QUEUE.md` 125)
- `bk5b-copy-forward-progression-view.md` (`506b916`) — copy a week forward (`QUEUE.md` 114)
- `bk5-block-builder-core.md` (`f6d6f4e`) — reworked block builder (`QUEUE.md` 85)
- `bk7-run-a-block-server.md` (`a004ced`) — BlockRun endpoints (`QUEUE.md` 102)
- `bk3-import-export-api.md` (`aadb365`) — format / import-preview / import / export (`QUEUE.md` 72)
- `bk4-block-ui-primitives.md` (`ec4c5a3`) — block UI primitives (`QUEUE.md` 59)
- `bk2-block-format-parsers.md` (`3220d3d`) — Block Format v1 (`QUEUE.md` 47)
- `bk1-schema-block-persistence.md` (`21c0df6`) — blocks schema (`QUEUE.md` 27)

**Post-merge patch (opened Sept 27, `QUEUE.md` 405)**

- `wd1-discard-workout.md` (`712b696`) — small X to discard a live workout, never a reopened one (`QUEUE.md` 473)
- `cq1-coach-weekly-cap.md` (`b07fea2`) — hosted coach capped at 7 questions per rolling 7 days (`QUEUE.md` 454)
- `cp2-coach-latency.md` (`b9dd0ae`) — hosted coach: one agent run per question after the first (`QUEUE.md` 413)

**Lane-B audit wave (opened Sept 12, `QUEUE.md` 497). Sept 9 commits have no QUEUE unit id; the audit lists the SHAs:**

- `sf1-smoke-fixes-connector-register.md` (`ab35aca`) — Sept 26 staging smoke fixes for connector register (`QUEUE.md` 611)
- `id1-connector-identity-bind.md` (`ebf7b80`) — connector identity bind (`QUEUE.md` 579)
- `cp1-coach-on-cursor-key.md` (`8ab7dcf`) — hosted coach + palette on a Cursor API key (`QUEUE.md` 532)
- `ai10-ai-layer-live-proof.md` (`ce51242`) — higher coach token ceilings, truncation handling (`QUEUE.md` 515)
- `932fa25` — critic round 2: exercises as analytics, AI access rebuild (no unit id; `QUEUE.md` 498)
- `2080128` — critic round 1: read-view summary, history rows (`QUEUE.md` 498)
- `d28989b` — palette studio (`git log` subject; SHA listed `QUEUE.md` 498)
- `4f364ee` — full-bleed scenes, barbell loading, skeletons (`QUEUE.md` 498)
- `8455059` — in-app coach, analytics panel, session debrief (`git log` subject; SHA listed `QUEUE.md` 498)

**Still after 2026-08-05, before the in-app coach (Aug 6–8):**

- `ai9-per-client-connector-instructions.md` (`43a4ceb`, Aug 8) — four-client connector instructions (`QUEUE.md` 1575)
- `ai8-connector-login-uri-to-client.md` (`bca098b`, Aug 8) — WorkOS Login URI moves to the client (`QUEUE.md` 1538)
- `ai7-drop-unissuable-connector-scope.md` (`d925bd2`, Aug 6) — stop requiring a scope AuthKit cannot issue (`QUEUE.md` 1326)

The 2026-08-05 release text covers "connect LogChamp to Claude" (`whatsNew.js` 26). It does not mention the in-app coach, blocks, Library redesign, weekly cap, or discard. Those have no release entry.

`git log origin/main --since=2026-08-06 --oneline --grep=^feat` was the cross-check. Subjects match the unit ids above (newest `468bab9`, oldest in that grep `43a4ceb`).

### B4. Changelog-ish files

Not found. Looked for `CHANGELOG*`, `changelog*`, and `docs/releases/**` (glob, 0 files). Release notes that exist are only `client/src/data/whatsNew.js`.

---

## C. Coach app-help (ask 6)

### C1. Client

Mounts (three pages, not global):

- Analytics: `client/src/pages/AnalyticsPage.jsx` 846–852. `mode="ask"`, `focus={{ type: "view", view }}`, suggestions from `buildSuggestedQuestions` (747).
- Session detail: `SessionDetailPage.jsx` 3785–3789. `mode="debrief"`, `autoAsk="Debrief this workout."`, label "Debrief this workout".
- Block builder: `BlockBuilder.jsx` 1434–1448, inside a sheet titled "Ask the coach". `focus.type === "block"`, `defaultOpen`, chips at 80–84: "Is the volume balanced?", "Where should the deload go?", "Are the effort caps realistic?"

Collapsed row (`CoachPanel.jsx` 286–296): crown, the word "Coach", and `collapsedLabel` (default "Ask about these numbers", line 91). Open header (327–332): "Coach", badge "beta", scope line from `scopeLabel` (129–136): analytics range, "Reading this workout against your last four weeks", or "Reading this block against your recent training".

Empty thread: no intro paragraph. If suggestions exist and the user is not capped, chips render (404–411). Composer placeholder (425): debrief "Ask a follow-up…", otherwise "Ask about these numbers…". Footer (442–443): "Numbers come from LogChamp's engine; the coach only explains them."

Suggestion chips for analytics: `client/src/lib/coachSuggestions.js` 11–16 and 18–45. Up to 3, from PRs, low effort coverage, a stale muscle, then a view question. All training questions. No "how do I use the app" chip.

Consent: opening the panel calls `getCoachStatus` (`CoachPanel.jsx` 111–125). If `status.available` is false, copy is `UNAVAILABLE_COPY` (24–41). `no_consent` title "AI access is off", body says only the computed summary is shared, link to `/profile/ai` (368–374). Server rejects `POST /coach/ask` with 403 `reason: "no_consent"` when `access.consentGranted` is false (`coachController.js` 290–291).

Loading while waiting for the first answer:

- Status not back yet: barbell + "Checking the coach…" (`CoachPanel.jsx` 357–366).
- After ask, pending message with no text yet: `AiWait variant="block" verb="Thinking..."` (390–391). `AiWait` (`client/src/components/coach/AiWait.jsx` 4–9, 18–45): block variant shows the crown immediately and the verb after 400ms, then "Still working…" at 15s (default slow copy is about big blocks), "Almost there. Hang tight." at 45s.
- Once deltas arrive, a caret replaces the wait (392–393).

### C2. Server

Routes (`server/src/routes/coachRoutes.js` 14–19), mounted at `/coach` (`routes/index.js` 62):

- `GET /coach/status`
- `POST /coach/ask` — the Q&A stream (`coachController.js` 260–268)
- `POST /coach/palette`, `POST /coach/block-draft`, `POST /coach/import-map`, `POST /coach/import-fix` — other AI jobs, not the ask panel

System prompt structure (`server/src/coach/prompt.js`):

- `COACH_PERSONA` static string, lines 22–47. Quoted shape: persona sentence; "What you have" (JSON already computed); "Scope - on-topic only" (training, LogChamp data, technique, programming, **and how to use LogChamp**); off-topic list (code, math, homework, trivia, other apps) must start with `[[OFF_TOPIC]]` (line 20, 30); rules (quote numbers, effort coverage, 2–4 paragraphs, no medical advice); glossary of effective/stimulating sets, e1RM, execution, balance.
- `buildCoachSystemBlocks` (209–255) order: persona text block, then data JSON with `cache_control: ephemeral`, then volatile framing (today, weight unit, `describeFocus`).
- User turns: history + question (`buildCoachMessages` 257–259).

Context sent: the **computed summary**, not raw sets. `compactSummaryForCoach` (141–177) keeps range, workout count, per-muscle weekly figures, per-exercise endpoints (not full series when over budget), PRs, balance, execution, meta. Cap `MAX_DATA_CHARS = 60000` (12), `COACH_MAX_EXERCISES = 30` (13). Comment at 1–6: "never sees a raw set". Session focus sends that workout's summary plus trailing four weeks (`askCoach.js` 112–116, prompt 220–227). Block focus sends compact block text plus the summary (229–237).

Provider (`server/src/coach/config.js` 20–24, 31–45): `COACH_PROVIDER` `mock` | `cursor` | anything else → `anthropic`. `resolveCoachProvider` (`askCoach.js` 69–109): mock short-circuits; else `resolveCoachKey` (`keyResolver.js` 29–49) prefers a BYO key (`x-coach-key`, header name `coachController.js` 70) and forces Anthropic for BYO (94–107); hosted key only if `aiConnectorEnabled` (`askCoach.js` 60). Hosted provider follows `COACH_PROVIDER`.

Caps: `CoachUsage` is who+when only (`schema.prisma` 46–52). Weekly rule: 7 counted uses per rolling 7 days for **hosted** keys (`weeklyCap.js` 5–7, 67–69). Ask costs 1 (`ASK_COST` 23). BYO and mock do not count. Short off-topic declines (≤ 400 chars, `coachController.js` 72, 401–407) are refunded. Uncapped emails via `COACH_UNCAPPED_EMAILS`.

Sizes:

- Question ≤ 1000 chars, history ≤ 12 turns and 4000 chars per turn (`coachRequest.js` 9–11, 112–113).
- Model `max_tokens` 8000, thinking + visible answer (`config.js` 14–18, 43).
- Data block ≤ 60000 characters (`prompt.js` 12).

### C3. In-repo "app guide" candidates

No file is an app guide written for the coach. Candidates, line counts from `wc -l`:

| Candidate | Lines | What it actually is |
|---|---|---|
| `client/src/data/whatsNew.js` | 108 | User-facing release blurbs. Stops at 2026-08-05. No screen map |
| `README.md` | 74 | Repo/dev readme, not a product tour |
| `client/README.md` | 28 | Client dev readme |
| `docs/specs/ai-layer.md` | 457 | Coach/connector spec (internal) |
| `docs/specs/blocks-v2.md` | 661 | Blocks spec (internal) |
| `docs/specs/analytics-ui-rebalance.md` | 492 | Analytics UI spec (internal) |
| `docs/specs/analytics-engine.md` | 219 | Engine spec (internal) |
| `docs/REFERENCE.md` | 308 | Agent/deploy context |
| `AGENTS.md` | 244 | Agent context |
| Onboarding module | not found | Grep of `client/src` for `onboarding` found no module. Empty-state lines exist (e.g. `AnalyticsPage.jsx` 798) |

The persona glossary (`prompt.js` 40–46) is the only product language already inside the prompt.

### C4. Does the coach refuse non-training questions?

Yes, by prompt rule, with a refund. It does **not** refuse "how to use LogChamp".

- On-topic includes "how to use LogChamp" (`prompt.js` 28).
- Anything else (code, general math, homework, trivia, other apps, unrelated writing) must not be done; reply ≤ two sentences and must start with `[[OFF_TOPIC]]` (`prompt.js` 27–30).
- The ask handler strips that marker from the SSE stream and refunds the weekly use when the decline is ≤ 400 characters (`coachController.js` 338–339, 401–407). A long answer hiding behind the marker is charged.
- Provider `stop_reason: "refusal"` becomes an error event "The coach can't answer that one." (`coachController.js` 376–381).
- Tests: `server/test/lib/coachPrompt.test.js` 136–141 (persona contains the scope rule and the marker) and 204+ / 275 (off-topic marker stripped, use refunded). Block-draft has a separate off-topic path (`coachBlockDraft.test.js` 388).

There is no tool, retrieval step, or screen catalog the model can use to answer a navigation question. The line that allows "how to use LogChamp" is the only mechanism. The data block is training numbers.

---

## D. Collision map

Candidate files for a later contract. This recon did not edit them.

**Ask 5 — edit custom exercises**

- `server/prisma/schema.prisma` — only if new fields (equipment, per-side) are added. Name + muscles already exist. A rename does not need a migration.
- `server/src/routes/exerciseRoutes.js`
- `server/src/controllers/exerciseController.js`
- `server/src/analytics/normalize.js` (dedupe already lives here; reuse, maybe no edit)
- `client/src/api/exerciseApi.js`
- `client/src/pages/MyTemplatesPage.jsx`
- `client/src/components/library/LibraryExerciseCard.jsx`
- `client/src/components/library/meta.js`
- `client/src/components/workout/AddExerciseToLibrarySheet.jsx` (reuse the curate step)
- `client/src/styles/blocks/bk-library.css`
- `client/src/index.css` (`.add-exercise-library-sheet*` at 5345)
- Tests: `server/test/exercises.integration.test.js` (custom API, line 128), `server/test/analytics/userExercises.test.js`, `server/test/analytics/resolve.test.js`
- If a rename must rewrite historical titles: `server/src/controllers/sessionController.js`, template/block exercise writers, `client/src/components/blocks/log/BlockExerciseCard.jsx` (reads `exerciseName`)

**Ask 2 — What's New pipeline**

- `client/src/data/whatsNew.js` (today's source; a separate notes file would be new)
- `client/src/components/whatsnew/WhatsNewContent.jsx`
- `client/src/components/whatsnew/WhatsNewModal.jsx`
- `client/src/components/whatsnew/WhatsNewGate.jsx`
- `client/src/lib/whatsNewStorage.js`
- `client/src/lib/appEnv.js`
- `client/src/pages/profile/WhatsNewPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/App.jsx` (route 177)
- `client/src/components/Layout.jsx` (gate mount)
- `client/src/index.css` (`.whats-new-*` at 6074)

**Ask 6 — coach can navigate the app**

- `server/src/coach/prompt.js` (persona scope already names "how to use LogChamp")
- `server/src/coach/askCoach.js` / `server/src/controllers/coachController.js` if a guide blob is attached to the prompt
- A new guide module (none exists)
- `client/src/components/coach/CoachPanel.jsx` (chips, empty copy)
- `client/src/lib/coachSuggestions.js`
- `client/src/components/blocks/builder/BlockBuilder.jsx` (block chips, lines 80–84)
- `client/src/index.css` (`.coach-panel` at 8370)
- `server/test/lib/coachPrompt.test.js`

**Files that sit under more than one ask**

| File | Asks | Why |
|---|---|---|
| `client/src/index.css` | 5, 2, and 6 | Library-sheet rules (5345), What's New rules (6074), coach panel rules (8370) |
| `client/src/data/whatsNew.js` | 2 and 6 | Release source for ask 2; the only user-facing feature list ask 6 could quote. Wiring the coach to it makes it a shared file |
| `client/src/components/coach/CoachPanel.jsx` | 6, and ask 2 only if What's New is surfaced inside the coach | Ask 6 owns it. Not required for a What's New pipeline |
| `server/src/controllers/sessionController.js` | ask 5 only if rename rewrites `exerciseName` | Not on the What's New or coach paths |

No other file above is shared. `ProfilePage.jsx` is ask 2 (the link). The coach's consent link targets `/profile/ai`, not that row. `AddExerciseToLibrarySheet.jsx` is ask 5 only.
