# TASK MW3: reopen a completed workout (un-finish = the edit path)

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Seth's asks #10 and #11 (July 16), scoped by the gate tier as ONE
mechanism: a completed workout can be REOPENED back to the live
in-progress state, edited with the full existing live UI (add sets, add
exercises, fix anything), and finished again. No second editing surface
gets built. This also covers the "hit Finish by accident" recovery case.
Today the server hard-rejects every write to a completed session
(`SESSION_COMPLETED` guards throughout
`server/src/controllers/sessionController.js`) - those guards all STAY;
reopening flips the session back to the state they already permit.
No schema change: completion is just `completedAt` (nullable DateTime).

Accepted consequence, stated so nobody "fixes" it: a reopened session
drops out of history/analytics (which key off `completedAt`) until it is
finished again, and the dashboard resume hero offers it again via the
existing `pickLatestActiveSession` path. That is the intended semantics.

FILES TO TOUCH:
- server/src/routes/sessionRoutes.js               (new route)
- server/src/controllers/sessionController.js      (new handler + export)
- server/test/sessions.lifecycle.test.js           (reopen contract tests)
- client/src/api/sessionApi.js                     (reopenSession + event)
- client/src/context/ActiveSessionContext.jsx      (handle "reopened")
- client/src/pages/SessionDetailPage.jsx           (Reopen affordance)
- client/src/index.css                             (only if needed; tokens-only)
Do NOT modify anything outside these files.

CHANGE:
Server:
- `POST /sessions/:id/reopen` -> new `reopenSession` handler, modeled
  directly on `completeSession` (~:1283): 401 unauthenticated, 400 bad
  id, 404 when `findFirst({ id, userId })` misses (never leak other
  users' sessions), 400 "Session is not completed" when `completedAt` is
  null. On success set `completedAt: null` - touch NOTHING else (name
  stays, `performedAt`/`startedAt` stay). Respond with the same
  `{ session }` include shape `completeSession` returns.

Client:
- `sessionApi.js`: add `reopenSession(sessionId)` following
  `completeSession`'s fetch idiom, and dispatch the existing
  `SESSIONS_CHANGED_EVENT` with `{ type: "reopened", sessionId }` on
  success (mirror how completion/deletion dispatch theirs).
- `ActiveSessionContext.jsx`: the `onSessionsChanged` local-apply gains a
  `"reopened"` branch that sets `completedAt: null` on the matching
  session (string-compared ids, same as the `"completed"` branch), then
  the existing `refresh()` reconciles. This is what makes the dashboard
  resume hero reappear without waiting for the 20s poll.
- `SessionDetailPage.jsx`: on the COMPLETED view (the read-only
  `session-log-workout-form` card), add a "Reopen workout" affordance
  with a two-step confirm, following the existing confirm idiom (the
  Remove-exercise confirm, ~:1416-1450). Placement within the completed
  view is your call. Confirm copy must say plainly what happens - the
  workout goes back to in-progress, leaves your history/analytics until
  you finish it again, and nothing already logged is lost. On success:
  refresh the page's session state in place (the page's existing `load()`)
  so the live builder UX + finish dock take over - no navigation away.
  While the reopen call is in flight, disable the control (mirror
  `completeBusy`).

ACCEPTANCE CRITERIA (machine-checkable):
- Integration tests (WRITTEN in `sessions.lifecycle.test.js` but NOT RUN -
  no DB in the lane; the reviewer runs them at land time) cover:
  - complete a session, `POST /sessions/:id/reopen` -> 200,
    `completedAt` null in the response, name unchanged; a subsequent
    set-write succeeds; re-complete -> 200 and `completedAt` set again.
  - reopen on a LIVE session -> 400 "Session is not completed".
  - reopen on another user's session -> 404.
- `npm run test:unit` green from server/ (tripwire).
- Client `npm run build` compiles with no errors.
- Direct-read checks: the reopen handler contains the same
  401/400/404/ownership guard ladder as `completeSession`; the
  `"reopened"` branch exists in `ActiveSessionContext`; the completed
  view renders the confirm-step control and calls
  `sessionApi.reopenSession`.
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
