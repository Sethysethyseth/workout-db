# TASK ID1: close the connector's wrong-identity bind (confirm, escape hatch, visible account)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Cross-user isolation bug in the Claude connector (`docs/specs/ai-layer.md`,
Lane A; WorkOS AuthKit is the OAuth server, LogChamp is its External Sign-in
provider). Observed live Aug 14: AuthKit keeps its OWN browser session, ignores
`prompt=login` (Connect's `/oauth2/authorize` documents no `prompt` or
`max_age` parameter), and re-issues tokens for whichever LogChamp user it last
completed - so a user who once connected as account X stays bound to X even
while logged into LogChamp as Y, and the connector answers with X's data.
A Sept 25 recon (report preserved by the reviewer) found the bug has TWO doors,
and this unit closes both as far as code can:
- **Door B - our Login URI auto-completes.** `client/src/pages/ConnectorLoginPage.jsx`
  POSTs `authorizeConnector` the moment a LogChamp session exists, with no
  "signed in as" step and no way to switch account.
- **Door A - AuthKit skips our Login URI entirely** when its own session is
  alive. Only ending that WorkOS session reopens the door. Today "turn AI off"
  (`revokeConsent` in `server/src/controllers/aiController.js`) flips our
  `AiConsent` row only - its own comment says it "must also revoke issued
  connector tokens," and nothing does.
- Tool output never names the bound account, so a wrong bind is invisible.

WorkOS endpoints (official docs, verify each before use - the docs win over
this list, record any difference as a deviation):
- completion already in use: `POST https://api.workos.com/authkit/oauth2/complete`
  sends our `User.id` as the WorkOS user's `external_id`.
- `GET https://api.workos.com/user_management/users/external_id/{external_id}`
  (https://workos.com/docs/reference/authkit/user/get-by-external-id)
- `GET https://api.workos.com/user_management/users/{id}/sessions`
  (https://workos.com/docs/reference/authkit/session/list)
- `POST https://api.workos.com/user_management/sessions/revoke` `{ session_id }`
  (https://workos.com/docs/reference/authkit/session/revoke)
- `GET` / `DELETE https://api.workos.com/user_management/users/{user_id}/authorized_applications[/{application_id}]`
  (https://workos.com/docs/reference/authkit/user/authorized-application/delete)
All with `Authorization: Bearer WORKOS_API_KEY`, plain `fetch` - do NOT add
`@workos-inc/node` (AI4 ruling).

FILES TO TOUCH:
- `client/src/pages/ConnectorLoginPage.jsx` (explicit confirm step)
- `client/src/pages/profile/AiConnectorPage.jsx` (the escape-hatch button)
- `client/src/api/aiApi.js`                  (client call for the new route)
- `client/src/index.css`                     (only if a new class is needed;
                                              tokens only)
- `server/src/ai/workosClient.js`            (session/app revoke helpers)
- `server/src/controllers/aiController.js`   (new handler; revokeConsent
                                              best-effort cleanup)
- `server/src/routes/aiRoutes.js`            (the new route)
- `server/src/ai/mcpServer.js`               (bound-account stamp on tool
                                              output)
- `server/test/lib/`                         (new unit tests)
Do NOT modify anything outside these files. In particular do NOT touch
`server/src/coach/*`, `server/src/controllers/coachController.js`,
`server/src/ai/analyticsAccess.js` (the coach reads it), or
`server/src/ai/tokenVerifier.js` (the `sub` -> `User.id` mapping is correct
and was proven live). A parallel unit (CP1) owns the coach files and
`server/package.json`.

CHANGE:

**A. Door B - `ConnectorLoginPage` never completes silently.** When a
LogChamp session exists, show which account is about to be connected (the
signed-in user's email, from the existing auth context) with two actions:
"Continue as <email>" -> the existing `authorizeConnector` call, and "Use a
different account" -> log out of LogChamp through the existing auth-context
logout BY NAME, then go to `/login?next=<this page's path + query>` (the
existing `next` mechanism `LoginPage` already honors). `authorizeConnector`
must run ONLY from the Continue click - never from an effect. Keep the
existing one-attempt-per-`external_auth_id` latch semantics (a double click
must not POST twice) and the existing 403 / 409 handling. Add one line of copy
that the link expires within a few minutes and, if it does, to start the
connection again from the assistant.

**B. Door A - an escape hatch that ends the WorkOS session.** New
authenticated route `POST /ai/connector/signout` (follow the existing
`aiRoutes.js` / `authRequired` pattern). For the CURRENT LogChamp user it:
looks up the WorkOS user by `external_id` = `User.id`; if none exists,
returns `{ found: false, sessionsRevoked: 0, applicationsRemoved: 0 }` with
200; otherwise lists and revokes EVERY session, lists and deletes EVERY
authorized application, and returns `{ found: true, sessionsRevoked,
applicationsRemoved }`. It does NOT touch `AiConsent` or
`aiConnectorEnabled` - the in-app coach stays up. Missing `WORKOS_API_KEY` or
a WorkOS failure -> 502 `{ error: "workos_unavailable" }` (never a crash,
never a partial-success lie: report the counts actually achieved in the log).
Put the WorkOS calls in `workosClient.js` next to
`completeConnectorAuthorization`, as small functions taking an injectable
`fetchImpl` (the pattern `streamAnthropic` uses in `server/src/coach/provider.js`)
so they are unit-testable. Handle list pagination if the docs describe it.

**C. `revokeConsent` keeps its promise, best effort.** After it marks the
consent row revoked (unchanged), it also runs the same WorkOS cleanup. A
WorkOS failure there is LOGGED and does NOT fail the request - the consent
kill-switch in `connectorAuth` is still the authoritative block.

**D. Profile -> AI access.** Add a "Sign out of connected assistants" action
to `AiConnectorPage` near the per-client setup accordions, with one short line
of copy: use it if an assistant is showing the wrong account's data, then
reconnect from the assistant. Show the result plainly (signed out / nothing to
sign out / couldn't reach the sign-in service). Tokens-only styling; follow the
page's existing button and status patterns BY NAME. Available whether or not
the AI switch is on.

**E. Make a wrong bind visible.** Every connector tool result from
`mcpServer.js` carries a `boundAccount: { email }` field for the token's
user, loaded ONCE per MCP request (not per tool), plus a short fixed note
field telling the assistant: if this is not the account the user expects,
tell them to use "Sign out of connected assistants" under Profile -> AI access
in LogChamp and reconnect. Implement it as a pure wrapper function (e.g.
`withBoundAccount(payload, email)`) in or beside `mcpServer.js` - NOT in
`analyticsAccess.js`. Identity stays closed over `connectorUserId`, exactly as
today; the stamp is read-only display.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - paste verbatim counts. Baseline
  is 28 suites / 302 tests; yours must be >= that, with no existing test
  modified to make it pass.
- `npm run build` clean from `client/`; `node scripts/check-hex.mjs` exits 0.
- New unit tests (fake `fetchImpl`, no network) prove, at minimum:
  - external-id lookup 404 -> `{ found: false, sessionsRevoked: 0,
    applicationsRemoved: 0 }` and NO further calls.
  - user found with sessions `session_1`, `session_2` and one authorized app
    -> exactly two revoke POSTs whose bodies carry those `session_id`s, one
    DELETE for the app, result `{ found: true, sessionsRevoked: 2,
    applicationsRemoved: 1 }`; every request carries `Authorization: Bearer
    <key>`; the external id in the lookup URL is URL-encoded.
  - a 500 from WorkOS on any step -> the helper throws with the status (the
    controller maps it to 502 `workos_unavailable`).
  - missing `WORKOS_API_KEY` -> throws before any fetch.
  - `withBoundAccount({ a: 1 }, "x@y.z")` -> `{ a: 1, boundAccount: { email:
    "x@y.z" }, ... note }` and does not mutate its input.
- `grep -n "authorizeConnector" client/src/pages/ConnectorLoginPage.jsx`
  shows the call ONLY inside the Continue click handler path, not in a
  `useEffect` - paste it.
- `grep -n "connector/signout" server/src/routes/aiRoutes.js` shows the route
  behind `authRequired` - paste it.
- In `DELIVERY.md`: state that no live WorkOS call was made, list every
  WorkOS endpoint used with the doc URL you verified it against, and flag any
  endpoint whose shape you could NOT confirm from the docs.

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
