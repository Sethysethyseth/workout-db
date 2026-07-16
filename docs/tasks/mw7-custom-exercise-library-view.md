# TASK MW7: custom exercises get a home in the Library

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's ask #12 (July 16, disambiguated: custom EXERCISES, not templates).
Users create custom exercises via the in-session "Add to library" sheet
(L4/NT2), but there is nowhere to SEE them afterwards. The server already
has the full read/delete surface from L3
(`server/src/routes/exerciseRoutes.js`: `GET /exercises/custom`,
`DELETE /exercises/custom/:id`); this unit is the client half. Home for
it: the Library page (`client/src/pages/MyTemplatesPage.jsx`, the
"Library" tab's `/templates` route), which already has a
Workouts | Blocks type-tab idiom (`programs-type-tab`, ~:276-291) in the
"yours" area - custom exercises become the third tab.

FILES TO TOUCH:
- client/src/api/exerciseApi.js            (listCustomExercises,
                                            deleteCustomExercise - the
                                            server routes exist; follow the
                                            file's existing fetch idiom)
- client/src/pages/MyTemplatesPage.jsx     (third "Exercises" tab)
- client/src/index.css                     (row styles if needed; tokens-only)
Do NOT modify anything outside these files.

CHANGE:
Add an "Exercises" tab alongside Workouts | Blocks in the "yours" area
(community area untouched - custom exercises have no community concept).
The tab lists the user's custom exercises from `GET /exercises/custom`:

- Each row: exercise name + a muscle summary derived from the
  `muscles` designations - primary muscles as "Main", secondary as
  "Assists", mirroring the vocabulary/grouping the AddExerciseToLibrarySheet
  curate step uses. Presentation (card vs list rows) is your call -
  match the page's existing card idioms and keep it tokens-only.
- Per-row delete with a two-step confirm (the page already has
  acting/confirm patterns; match them). The confirm copy must carry the
  real consequence: sessions that referenced this exercise keep their
  logged data but lose the structural link, so analytics stops
  attributing those sets to its muscles (the FK is SET NULL - that is
  existing server behavior, state it honestly, don't soften it).
- Empty state: actionable, not bare - explain that custom exercises are
  created from a live workout via the "Not tracked - add?" pill on any
  exercise the library doesn't know, per the existing empty-state bar
  (N6 precedent: name the action, don't just say "nothing here").
- Loading/error states follow the page's existing `LoadingState` /
  `ErrorMessage` usage. The two template tabs' behavior must be
  completely unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `exerciseApi.js` gains `listCustomExercises()` and
  `deleteCustomExercise(id)` hitting `GET /exercises/custom` and
  `DELETE /exercises/custom/:id`, following the file's existing helpers.
- The "yours" area renders three type tabs; the Exercises tab lists rows
  with name + Main/Assists summary (verifiable by direct read); delete
  goes through a confirm step and removes the row on success without a
  full page reload.
- Empty state names the in-session "Add to library" path.
- Community area (`?area=community`) renders exactly as before -
  no Exercises tab there.
- Client `npm run build` compiles with no errors.
- `npm run test:unit` green from server/ (tripwire - no server files
  touched).
- Any new CSS uses tokens/`color-mix` only - zero raw color values
  (`scripts/check-hex.mjs` passes).

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
