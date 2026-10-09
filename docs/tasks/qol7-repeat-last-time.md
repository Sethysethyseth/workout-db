# TASK qol7: Repeat last time - last session's weight and reps as ghosts in the logger

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's ask 3, "hands down the biggest recommendation" from users: an
opt-in setting that mirrors each lift's weight and reps from the last time
it was logged, "like how the blocks are".

Ruling 2 (`docs/specs/quality-of-life-wave.md`) makes these GHOSTS, the
same as block days: greyed placeholders that are never saved until the
lifter logs them. The pref already exists: qol2's
`client/src/lib/trainingPrefs.js` (`mirrorLast`, default off).

What exists today:
- Block-day ghosts: `client/src/components/blocks/log/ghostPlaceholders.js`
  (`weightGhostFromPlan`, `doseGhostFromPlan`,
  `fillDraftFromPlanExceptEffort`).
- The non-block "As planned" fill: `AsPlannedControl.jsx`, wired in
  `SessionDetailPage.jsx` ~1101-1119 and ~1358.

No "last sets for exercise X" endpoint exists. Identity resolution lives
in `server/src/analytics/resolve.js` (`resolveExercise`), and the grouping
key rule is `identityKeyOf` in `server/src/analytics/exerciseDetail.js`
25-28.

Recon (read it, all file:line are there):
`docs/tasks/qol-r1-...-FINDINGS.md` section B, especially B5: any
non-blank draft auto-promotes, which is WHY these must be placeholders.

FILES TO TOUCH:
- server/src/analytics/lastPerformance.js         (new, pure)
- server/test/analytics/lastPerformance.test.js   (new)
- server/src/controllers/sessionController.js     (one new handler)
- server/src/routes/sessionRoutes.js              (one new route)
- client/src/api/sessionApi.js
- client/src/pages/SessionDetailPage.jsx
- client/src/components/blocks/log/AsPlannedControl.jsx
- client/src/components/blocks/log/ghostPlaceholders.js
- client/src/components/blocks/log/BlockExerciseCard.jsx
- client/src/components/blocks/log/BlockSetRow.jsx
Do NOT modify anything outside these files.

CHANGE:
**Server**
1. **`lastPerformance.js`** (pure: no Prisma, no DB, like the rest of
   `server/src/analytics/`) exports `buildLastPerformance({ targets,
   priorSessions, userIndex })`.
   - `targets`: `[{ sessionExerciseId, exerciseId, userExerciseId,
     exerciseName }]`.
   - `priorSessions`: completed sessions, any order, each with its
     exercises and sets.
   - For each target, resolve its identity key with the SAME rule the
     analytics engine uses (`resolveExercise` + the `identityKeyOf`
     convention). An unresolvable name falls back to
     `name:<normalizedName>`.
   - Find the MOST RECENT prior session (by `performedAt`) containing an
     exercise with that key. Return its sets for the FIRST matching
     exercise in that session, in logged order. Keep only core-logged sets
     (weight AND reps both present, or `durationSec` present), as
     `{ side, weight, reps, durationSec }`.
   - Output: `[{ sessionExerciseId, lastPerformedAt, sets }]`. Targets
     with no history are omitted.
2. **`GET /sessions/:id/last-performance`** (owner-scoped: someone else's
   session returns 404, the same as the existing `GET /sessions/:id`).
   - Load the user's COMPLETED sessions, excluding this one, with
     `performedAt` within the 180 days before this session's
     `performedAt`, newest first, capped at 120 sessions. Select only the
     fields the pure function needs.
   - Respond `{ exercises: buildLastPerformance(...) }`.
   - This is a cross-user surface. The query's WHERE clause carries
     `userId` - never fetch-then-check.

**Client**
3. **Fetching.** When `mirrorLast` is ON and the session is live (not
   completed), fetch once on load and again after an exercise is added.
   Index the result by `sessionExerciseId`. When the pref is OFF: no
   request, and today's behavior byte-for-byte.
4. **Non-block exercises** (quick logs and template sessions). Treat last
   time's sets as the row-level plan, so the existing ghost and "As
   planned" machinery does the work.
   - Map each row index (side-aware for per-side pairs) to `{ weight,
     reps, durationSec }`.
   - Empty fields show those values with the SAME ghost styling block
     days use.
   - The set-number button gets aria-label "Log set N as last time" and
     fills weight and reps (never effort) through
     `fillDraftFromPlanExceptEffort`, then promotes as "As planned" does.
   - Typing overrides a ghost.
   - An exercise with zero sets whose last time had N sets renders N ghost
     draft rows (unsaved) instead of one.
   - Under the exercise name, one muted caption: "Last time: Oct 2" (the
     app's existing short date format).
   - No history means no caption and nothing changes.
   - **The ghosts are this unit's one visual element** - no new badges or
     colors.
5. **Block days.** The plan always wins. Only where the plan's weight is
   empty does that row's weight ghost (and its set-button fill) use last
   time's weight for the same row index. Reps and seconds never come from
   last time on a block day.
6. `buildCreateSetBodyFromLast` (within-session copy) keeps working
   unchanged.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with `lastPerformance.test.js`
  covering:
  - catalog-id match
  - a legacy name-only row matching a catalog-id target (via alias)
  - a custom exercise via `userExerciseId`
  - per-side sets keep their L/R `side` and order
  - weight-only and reps-only sets are dropped
  - the most recent session wins over older ones
  - the current session is excluded (caller contract, documented)
  - no history -> target omitted
- `grep -n "prisma" server/src/analytics/lastPerformance.js` returns zero
  hits.
- Client `npm run build` clean. `node scripts/check-hex.mjs` passes.
- Live checks the reviewer runs (demo.critic on staging, mock coach):
  - `GET /sessions/<own live id>/last-performance` returns prior sets
  - another user's session id returns 404
  - with the pref ON, a quick log adding an exercise done last week shows
    ghost rows and "Last time: <date>"
  - tapping set 1 logs last time's weight and reps with effort blank
  - with the pref OFF, no `/last-performance` request fires (network
    panel)

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
