# Block execution gap - the half-built programming layer

**Status: PARKED (Seth's ruling, July 20, 2026) - "that's for another wave."**
Do NOT author blocks against this document. It exists so the evidence
survives the session that found it; the product decision is unmade and is
Seth's alone.

**Provenance:** Cursor recon lane `recon/exec-blocks`, dispatched July 20,
2026 during the FP9-FP11 authoring session (Opus). Every claim below carries
file:line and was spot-checked by the frontier seat. Full raw report was
session-scoped and not committed; its load-bearing content is reproduced
here.

**Origin:** Seth's July 20 staging smoke asked directly - "how does the
execution tab work? does it tie in to creating blocks? do these numbers come
from planning a block. we need to seriously think about what part block
creation plays in this app."

---

## The finding, in one line

A multi-week programming layer is **already designed, already shipped, and
not wired to anything.** Users can author a block; they cannot train it.

## What exists today

**Full schema hierarchy** (`server/prisma/schema.prisma`):

- `BlockTemplate` (:167-184) - `name`, `description`, `isPublic`,
  `durationWeeks`, `useRIR`, `useRPE`, `useDuration`, `userId`
- `BlockWeek` (:186-195) - ordered weeks under a block
- `BlockWorkout` (:197-207) - ordered named workouts under a week
- `BlockWorkoutExercise` (:209-228)
- `BlockWorkoutSet` (:271-285) - planned `reps`, `weight`, `rpe`, `rir`
- `WorkoutSet.blockWorkoutSetId` (:133-134) - **the FK that would link a
  logged set back to its planned set**

**Full API:** `server/src/routes/blockTemplateRoutes.js` +
`blockTemplateController.js` - CRUD plus clone. Planned rows persist via
`templateExerciseNormalize.js:227-232`.

**Full authoring UI:** `/create-template?type=block` (`App.jsx:58-64`),
`EditBlockTemplatePage` (`App.jsx:74-80`), `BlockWeeksBuilder`,
`BlockTemplateTableView`, "Multi-week plan" copy at
`CreateTemplatePage.jsx:257,268-270`. Blocks appear in the Library with a
"Block" pill (`MyTemplatesPage.jsx:602`) and can be shared publicly.

## What does not exist

1. **No write path for `WorkoutSet.blockWorkoutSetId`.** Zero assignments
   anywhere under `server/src/`. The FK is dead.
2. **No "start session from a block."** Block cards carry Edit / public /
   delete / "Set as current" only (`MyTemplatesPage.jsx:646-684`). Only
   `WorkoutTemplate` ids reach `POST /sessions/start/:templateId`.
3. **"Set as current" is localStorage** (`currentProgramStorage.js:1-34`,
   key `workoutdb.currentProgram.v1`). It never reaches the server. There is
   no active-block enrollment, no current-week index, no start date, no
   completed-day tracking.
4. **No progression rules.** No models, no engine code. The only trace is
   placeholder copy - "Goals, progression, notes"
   (`CreateTemplatePage.jsx:445`).
5. **No calendar or schedule.** `durationWeeks` is a week-count cap on the
   definition (`blockTemplateController.js:10-13`), not a schedule.
6. **The Execution engine cannot see blocks.** `computeExecutionFidelity`
   (`server/src/analytics/planVsActual.js:36-48`) and `planLookup`
   (`analyticsController.js:199-207`) understand `TemplateSet` via
   `templateExerciseId` only - there is no `BlockWorkoutSet` branch. The
   engine's own header comment (`planVsActual.js:1-5`) names this an honest
   gap, and the UI already admits it to users: "Only sets logged from a
   template count - block plans aren't linked yet."
   (`AnalyticsPage.jsx:56-57`).

## What "planned" actually means today

The Execution tab compares logged sets against **live `TemplateSet` rows on
a single-workout template you started a session from**. Lineage:

1. Author a workout template -> `TemplateSet` rows
   (`workoutBuilderState.js:53-90`, schema :83-96)
2. `POST /sessions/start/:templateId` copies each template exercise into
   `SessionExercise` carrying `templateExerciseId`
   (`sessionController.js:197-216`)
3. Logged sets attach via `sessionExerciseId`
   (`sessionController.js:888-899`)
4. Analytics resolves `planSource.templateSets` into `planLookup`
   (`analyticsController.js:199-230`)

**Separate correctness concern, worth its own look whenever this is
revisited:** planned numbers are read LIVE at analytics time, not
snapshotted onto the session (`planVsActual.js` lineage above). Editing a
template retroactively changes what past sessions are judged against. That
is arguably a defect independent of the block question.

Quick-log and non-template sessions feed Execution nothing.

"Working weight targets" is unrelated to planning entirely - it inverts
`bestE1rm` from logged history (`exerciseDetail.js:95-107`).

## The fork (unmade - Seth's call)

**Finish it.** Start-session-from-block, write `blockWorkoutSetId`, teach
`planVsActual` a `BlockWorkoutSet` branch, add active-block enrollment with
a week index. Almost certainly wants progression rules to be worth having.
Multi-unit wave; needs a real spec first; touches schema, so the migration
track is Seth's manual work (gate item 3).

**Cut it.** Remove the block authoring UI and leave the schema dormant. A
builder that leads nowhere is worse than no builder - a user who invests an
hour authoring a six-week program and then finds no way to run it has been
actively misled.

No third option is honest. The current state - ship the authoring, hide the
dead end behind a help string - is the one position that should not persist.

## Related open items

- `docs/specs/gym-context.md` (G1 is migration-carrying = Seth's manual
  track) and `docs/specs/strength-score-per-side.md` (SS1-SS3) are the other
  spec'd-but-unbuilt arcs; sequence this against them rather than in
  isolation.
