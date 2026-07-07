# TASK a5-exercise-picker: typeahead exercise picker that writes structural identity

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

DISPATCH GATE: only after a4-exercise-fk-linkage has LANDED and its staging
migration choreography is done (catalog migration + seed + linkage migration
applied to staging - see QUEUE.md Active section). The integration lane is
allowed in this block because of that gate.

CONTEXT:
Track A unit A5 (spec: `docs/specs/analytics-engine.md` section 9): "exercise
picker writes catalog IDs." Today exercise names are free-typed; A4 made the
server stamp identity by resolving the typed string. This unit closes the loop
at the source: while naming an exercise in a live session, the user gets
typeahead suggestions from the catalog (+ their own custom exercises) and a
selection carries exact identity ids to the server - typo-proof instead of
resolution-dependent. Free text must remain a first-class path (unresolved
names keep the L4 "Not tracked - add?" pill flow untouched).

FILES TO TOUCH:
- server/src/analytics/searchCatalog.js       (new PURE search/rank module -
                                               no Prisma, no fs; takes the
                                               loaded catalog + user index)
- server/src/analytics/index.js               (export it)
- server/src/controllers/exerciseController.js (GET search handler)
- server/src/routes/exerciseRoutes.js         (route)
- server/src/controllers/sessionController.js (accept + validate optional ids)
- server/test/analytics/**                    (unit tests for searchCatalog)
- server/test/**                              (integration tests for the route)
- client/src/api/exerciseApi.js               (search call)
- client/src/components/workout/ExercisePickerSuggestions.jsx (new)
- client/src/pages/SessionDetailPage.jsx      (wire into the live-session
                                               exercise-name input)
- client/src/index.css                        (styles - tokens only)
Do NOT modify anything outside these files. Template/block builders keep free
text in this unit (candidate A5B).

CHANGE:

1. PURE SEARCH - `searchCatalog(catalog, userIndex, query, { limit })`:
   normalizes the query with `normalizeExerciseName`; matches over catalog
   normalized names, alias keys (`catalog.byAlias`), and the user's
   UserExercise normalized names. Rank: exact > prefix > substring; within a
   rank, userExercise rows before catalog rows, then alphabetical by canonical
   name; alias hits dedupe to their canonical catalog entry (report the
   matched alias). Catalog results are restricted to the lifting subset:
   `category` in {"strength", "powerlifting", "olympic weightlifting",
   "strongman"}; user exercises are never filtered. Result row shape:
   `{ source: "catalog"|"userExercise", exerciseId, userExerciseId, name,
   matchedAlias, primaryMuscles, equipment }` (ids null-filled per source).

2. ENDPOINT - `GET /api/exercises/search?q=&limit=` (authRequired, mirroring
   the existing `/resolve` handler's validation style): missing/non-string
   `q` -> 400; `limit` clamped to [1, 25], default 10; loads the user's
   UserExercise rows once per request (`buildUserExerciseIndex`), delegates to
   searchCatalog, returns `{ results }`.

3. SESSION WRITES CARRY IDS - the ad-hoc add / rename-commit paths in
   sessionController accept optional `exerciseId` / `userExerciseId` in the
   body. Validation (never trust client ids): at most one of the two (400
   otherwise, matching the A4 CHECK semantics); `exerciseId` must exist in
   `loadCatalog().byId`; `userExerciseId` must belong to the authenticated
   user; invalid -> 400. When ids are absent the A4 stamping helper resolves
   from the name exactly as before - zero behavior change for free text.

4. CLIENT - typeahead on the exercise-name input in LIVE sessions only
   (SessionExerciseBlock's name editing inside SessionDetailPage.jsx):
   - Fetch (debounced ~200ms) from 2 typed characters; render
     ExercisePickerSuggestions as an inline positioned listbox under the
     input (inside #root - do NOT portal it; see the scene-layer stacking
     note in AGENTS.md).
   - Rows show the canonical name; userExercise rows carry a quiet "Custom"
     tag. Keyboard: ArrowUp/Down + Enter select, Escape dismisses; tap
     selects on mobile.
   - Selecting fills the input with the canonical name and the commit call
     carries the row's ids; committing free text (no selection) sends no ids.
   - Motion within the app's restraint band (~150-250ms ease-out) with a
     reduced-motion opt-out; all colors via existing tokens (accent-adjacent
     states derive from --color-interactive via color-mix, per AGENTS.md).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from server/, including searchCatalog fixture
  tests that pin: exact-beats-prefix-beats-substring; userExercise-before-
  catalog within a rank; an alias query (e.g. "skullcrushers") returning its
  canonical entry with matchedAlias set; a stretching-category entry excluded
  from results; limit respected.
- `grep -rn "prisma\|require(\"fs\")" server/src/analytics/searchCatalog.js`
  -> no hits (pure module).
- Integration tests green (this block may run `npm test` - staging is
  migrated per the dispatch gate): 401 unauthenticated; 400 missing q; 400
  both ids on the session write; 400 foreign userExerciseId (another user's);
  happy path returning a catalog row and a userExercise row; session write
  with a valid exerciseId persists it.
- Client `npm run build` green.
- No hex colors in the CSS diff (`git diff -- client/src/index.css` shows
  token/color-mix usage only).
- ExercisePickerSuggestions is NOT rendered via a portal (grep for
  createPortal in the new component -> no hits).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
