# TASK bkr-d3: DIAGNOSIS - Login screen flashes on a hard load of a deep link

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (Oct 5, `docs/tasks/bk-smoke-FINDINGS.md`, seat-found P3).
While already signed in (valid `workoutdb.sid` cookie), a hard load of
`/blocks/import` rendered the Login form ("Email or username", "Password")
for a moment, then the import page appeared without any user action. On a
phone PWA this reads as "I got logged out". This is a DIAGNOSIS block -
report only.

FILES TO TOUCH:
- DELIVERY.md (repo root, the report) - NOTHING else.
Do NOT modify any source file.

CHANGE:
Trace, make NO code changes. Start at `client/src/App.jsx` (route table,
any protected-route wrapper), the auth context/provider and its `/auth/me`
bootstrap, and the login page. Answer:
1. What renders while the session check is pending, per route type
   (protected deep link vs `/`)? Why does `/` show a loading state (Home
   rendered "Loading workout" on hard load) while `/blocks/import` shows
   the Login form?
2. Root cause with file:line and the exact state sequence.
3. Every route affected (list them).
4. Smallest correct fix (prose plus a sketch, not applied): what should
   render while auth is pending - follow the existing `LoadingState`
   pattern in `client/src/components/LoadingState.jsx` (delay-before-show,
   no flash on fast loads). Confirm the fix keeps the `next=` redirect for
   genuinely signed-out users.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain` shows no change except the untracked DELIVERY.md.
- DELIVERY.md names the component and file:line that renders Login during
  the pending state, and lists the affected routes.

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
