# TASK qol8: Edit your own exercises in Library (name and muscles), and Library loads per tab

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's ask 5: "in library where your created exercises live, there should
be an option for you to edit them, name, what they hit, etc". Today there
is create, list and delete only. There is no update route, and
`LibraryExerciseCard` offers Delete only.
- A custom exercise is `UserExercise`: `name`, `normalizedName`, and a
  `muscles` Json of name -> "primary" | "secondary", with
  `@@unique([userId, normalizedName])`.
- Session, template and block exercises store BOTH an optional
  `userExerciseId` FK AND a copied `exerciseName` string. A rename must
  therefore rewrite the copies, or history keeps the old name.
- Rows that matched by NAME only (both ids null) would silently stop
  resolving after a rename, so the rename adopts them.

Also folded in: sr3 critic P3-10. Library waits on a five-request
`Promise.all` before rendering anything (`MyTemplatesPage.jsx` 97-103).

Recon: `docs/tasks/qol-r2-...-FINDINGS.md` section A and
`docs/tasks/qol-r3-...-FINDINGS.md` section D1 (P3-10). Design rules:
`docs/specs/quality-of-life-wave.md` section 2. "etc." beyond name and
muscles (equipment, per-side) has no column today and is OUT of scope - no
schema change in this unit.

FILES TO TOUCH:
- server/src/routes/exerciseRoutes.js
- server/src/controllers/exerciseController.js
- server/src/lib/customExerciseRename.js          (new, pure)
- server/test/lib/customExerciseRename.test.js    (new)
- client/src/api/exerciseApi.js
- client/src/components/library/LibraryExerciseCard.jsx
- client/src/components/workout/AddExerciseToLibrarySheet.jsx
- client/src/pages/MyTemplatesPage.jsx
- client/src/styles/blocks/bk-library.css
Do NOT modify anything outside these files.

CHANGE:
**Server**
1. **`PATCH /exercises/custom/:id`** with body `{ name?, muscles? }`; at
   least one is required, otherwise 400.
   - Owner-scoped: someone else's id returns 404. The WHERE clause carries
     `userId`.
   - Validation and dedupe are IDENTICAL to `createCustomExercise`: the
     name trim and 120-character cap, `normalizeExerciseName`, the catalog
     collision via `resolveExercise` (same 400 message), the own-library
     collision EXCLUDING this row (same 400 message), and
     `validateMuscles`. Extract the shared checks into a helper both
     handlers call, so they cannot drift.
2. **Rename propagation**, in ONE transaction with the update, only when
   the normalized name changes or the display name changes:
   - **(a)** Every `SessionExercise`, `TemplateExercise` and
     `BlockWorkoutExercise` OWNED BY THIS USER with `userExerciseId = id`
     gets `exerciseName = <new name>`. Ownership goes through the
     relations: session.userId, template.userId, and
     blockWorkout -> blockWeek -> blockTemplate.userId. Never match on
     `userExerciseId` alone.
   - **(b) Adoption.** Rows owned by this user with `exerciseId` null AND
     `userExerciseId` null, whose `normalizeExerciseName(exerciseName)`
     equals the OLD `normalizedName`, get `userExerciseId = id` and
     `exerciseName = <new name>`.
   - The selection logic for (b) lives in the pure
     `customExerciseRename.js` (`selectRowsToAdopt(rows, oldNormalized)`).
     The controller fetches the candidate rows (`id` + `exerciseName`
     only, both ids null, owner-scoped) and updates by id.
3. Respond with the updated exercise in the same shape `GET
   /exercises/custom` returns for a row, plus `renamedRows` (the count).
   Muscle edits need no propagation (attribution reads the live
   `muscles`).

**Client**
4. `exerciseApi.updateCustomExercise(id, patch)`.
5. **`AddExerciseToLibrarySheet`** gains `mode="edit"` with an `exercise`
   prop.
   - It opens straight on the curate step, pre-filled: the name, plus
     `muscleRoles` mapped from `muscles` (primary -> main, secondary ->
     assist).
   - Sheet title "Edit exercise". Primary button "Save changes", disabled
     until something differs.
   - When the name differs, one muted line under the field: "Past
     workouts will show the new name."
   - Server 400s render inline under the name field.
   - On success, close and hand the updated row back.
   - The create flow is unchanged.
6. **`LibraryExerciseCard`.** Tapping the card (or an "Edit" action)
   opens the sheet in edit mode. Delete stays available on the card, with
   its existing consequence copy. After a save, the card updates in place
   with no list reload, and a short inline "Saved" acknowledgment fades
   after ~2s.
7. **Library load (P3-10).** In `MyTemplatesPage`, each type tab renders
   as soon as ITS data arrives, with a per-tab skeleton until then. One
   slow request no longer blanks the page. The block-run requests are
   skipped when `area=community`. Behavior once loaded is unchanged.
8. Library styles go in `bk-library.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with `customExerciseRename`
  tests:
  - "Bulgarian Split Squat" adopts rows named "bulgarian-split squat" and
    "Bulgarian  split squat"
  - it does NOT adopt "Bulgarian Split Squats" or "Split Squat"
  - an empty list returns `[]`
  - the function imports nothing from Prisma (grep)
- Client `npm run build` clean. `node scripts/check-hex.mjs` passes.
- Live checks the reviewer runs (a writable staging account; NOT
  demo.critic's library, NOT test123):
  - create a custom exercise, log it in a quick workout, rename it via
    PATCH -> that session's exercise shows the new name and `renamedRows`
    >= 1
  - renaming to a catalog name ("Bench Press") returns 400 with the
    catalog message
  - PATCH on another user's id returns 404
  - editing muscles changes them on the Library card
  - on Library, the Exercises tab shows while block runs are still
    loading (throttle the network in devtools)

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
