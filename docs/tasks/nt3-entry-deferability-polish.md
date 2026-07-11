# TASK NT3: not-tracked entry pill - completed-session path + deferability polish

STATUS: DRAFT   <!-- flips to QUEUED once NT2 lands; shares both files with NT2 -->
MODEL: auto
MODE: 1-relay

CONTEXT:
Final unit of the not-tracked-ux wave (branch `not-tracked-ux-wave`;
design doc: `docs/design/not-tracked-add-flow-brainstorm.md`, the
"deferability principle"). NT2 rebuilt the sheet; this unit makes "do it
later" a first-class path. Key server fact (verified July 11): completed
sessions are LOCKED - every sessionController mutation guards on
`completedAt` - so RENAMING (the link path) is live-only, but CREATING a
custom exercise is a library operation that works from anywhere, and
name-based resolution means it retroactively attributes the completed
session the user is looking at. That asymmetry drives the design below.
Strictly sequential AFTER NT2 (shares AddExerciseToLibrarySheet.jsx,
SessionDetailPage.jsx, and index.css).

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (completed-session pill becomes
                                            interactive; sheet context prop)
- client/src/components/workout/AddExerciseToLibrarySheet.jsx  (completed
                                            context: create-only flow)
- client/src/index.css                     (pill polish only, if needed)
Do NOT modify anything outside these files.

CHANGE:

1. COMPLETED-SESSION ENTRY: the unresolved pill on completed sessions is
   currently informational only (interactive is gated `!isCompleted`,
   SessionDetailPage.jsx ~line 1342). Make it interactive there too - same
   "Not tracked - add?" action pill - opening the sheet with a new
   `context="completed"` prop (default `"live"` preserves NT2 behavior
   exactly).

2. COMPLETED CONTEXT IN THE SHEET (create-only flow):
   - Skip the `suggest` (link) step entirely: a completed session cannot
     be renamed, so open directly at `seed`. The "Use that name" action in
     `curate` is likewise hidden in this context (it is a rename).
   - Do NOT attempt the post-create `userExerciseId` stamp on the session
     exercise row (that PATCH would 4xx on a locked session) - create the
     library entry, then invalidate + refresh resolution only. Name-based
     resolution flips the pill to Tracked without any row write.
   - The `done` CREATE variant keeps NT2's retroactive line unchanged - it
     is at its most persuasive here (the session on screen just lit up).

3. DEFERABILITY POLISH (both contexts):
   - Closing the sheet at any step (Escape, backdrop, Cancel, back out) is
     consequence-free and silent: pill persists, no confirm dialog, no
     nag, no re-prompt.
   - On success, the pill flips to "Tracked" via the EXISTING crossfade
     slot machinery (session-exercise-tracked-slot, SessionDetailPage.jsx
     ~lines 141-180) - verify it animates in both live and completed
     variants and fix within these files if it does not.
   - Any pill styling adjustments stay tokens-only and within the existing
     pill classes.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green.
- `npm run test:unit` green from `server/` (tripwire - no server touch).
- Grep evidence: the interactive gating no longer requires `!isCompleted`;
  completed-session render path passes `context="completed"` and a live
  session passes/defaults `"live"`.
- Code-path evidence: in completed context the sheet never renders the
  `suggest` step, never shows "Use that name", and the post-create
  updateSessionExercise stamp is not reachable (cite the branch).
- Code-path evidence: live-context behavior is unchanged from NT2 (the
  default prop path).
- No hex colors in the index.css diff.
- No confirm/alert added on close (grep for window.confirm/alert in the
  touched files returns nothing new).

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
