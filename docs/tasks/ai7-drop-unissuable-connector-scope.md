# TASK AI7: stop requiring an OAuth scope the authorization server cannot issue

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The AI-wave shipped a custom OAuth scope, `training:read`, invented in AI1 and
enforced in AI2. **WorkOS AuthKit cannot issue it.** Its authorization-server
metadata advertises a fixed vocabulary - `["email","offline_access","openid",
"profile"]` - and there is no dashboard affordance anywhere to add a custom one
(Connect -> Configuration, MCP Auth, and MCP resource indicators were all
checked live on August 6). Because LogChamp's protected-resource metadata
advertises `scopes_supported: ["training:read"]`, Claude dutifully requests it,
AuthKit rejects the authorization request, and the flow dies at
`https://claude.ai/api/mcp/auth_callback?error=invalid_scope` - which Claude
then reports as the misleading `state: Field required`. Reproduced live in the
browser, August 6. This unit removes the scope as a protocol assertion and as
an access control. Design of record: `docs/specs/ai-layer.md` Lane A.

**Why removing it is not a security regression.** The scope was never the
isolation boundary. Every real control survives untouched: audience validation
(`tokenVerifier.js:49-52` rejects any token whose `aud` is not
`MCP_RESOURCE_URL`), the `sub`-to-user mapping, the consent record gate
(`connectorAccess` in `server/src/ai/consent.js`), the entitlement flag, and
the fact that only four read-only tools exist and none accepts a user
id/account/email input. A token AuthKit mints against our resource indicator is
already bound to this MCP server by audience. `training:read` was a fourth belt
the authorization server has no buckle for.

FILES TO TOUCH:
- server/src/middleware/connectorAuth.js   (drop the scope requirement and the
                                            `scope=` parameter on the 401)
- server/src/routes/index.js               (stop advertising `scopes_supported`)
- server/src/ai/consent.js                 (comment only - see CHANGE item 4)
- server/test/lib/connectorScope.test.js   (update to the new contract)
- server/test/lib/aiProtectedResource.test.js (update to the new contract)
Do NOT modify anything outside these files. In particular do NOT touch
`server/src/controllers/aiController.js`, `server/src/ai/tokenVerifier.js`, or
anything under `client/`.

CHANGE:

**1. `connectorAuth.js` - `classifyConnectorToken` stops gating on scope.**
The function keeps its name, its export, and its shape (`{ ok, status,
failure }`) so callers and tests stay recognisable. New behaviour: a falsy
`verified` still returns `{ ok: false, status: 401, failure: "unauthorized" }`;
anything else returns `{ ok: true, status: 200, failure: null }`. The
`insufficient_scope` branch and the 403 it produced are removed entirely -
including the `if (!classified.ok && classified.status === 403)` arm inside
`connectorAuth`. The consent-based 403 further down (`access.allowed`, which
returns `{ error: "forbidden", reason }`) is a DIFFERENT check and must stay
exactly as it is - it is the kill switch.

**2. `connectorAuth.js` - `sendUnauthorized` stops asserting a scope.** Call
`buildWwwAuthenticateHeader` without a `scope` property. That helper already
omits the parameter when scope is null/empty
(`server/src/ai/protectedResource.js`) - use that existing behaviour rather
than editing the helper. The `resource_metadata` parameter must be unchanged.

**3. `routes/index.js` - stop advertising `scopes_supported`.** The
protected-resource document must no longer carry the key at all. RFC 9728
makes it OPTIONAL, and `buildProtectedResourceMetadata` already deletes keys
whose value is `undefined` - use that existing behaviour rather than editing
the helper. `resource`, `authorization_servers`, and
`bearer_methods_supported` are unchanged. `getAuthorizationServers()` and
`getMcpResourceUrl()` are unchanged.

**4. `consent.js` - keep `CONNECTOR_SCOPE`, demote it in a comment.** Do NOT
delete the constant and do NOT change its value. It is still written to the
`AiConsent` row by `aiController.js` as a human-readable record of what the
user consented to, and that audit value is worth keeping. Add a short comment
above it stating that it is a LOCAL descriptor for the consent record only,
and must never again be advertised in protected-resource metadata, sent in a
`WWW-Authenticate` header, or required of an access token - because the
authorization server cannot issue it. No other change to this file.

**5. Tests.** Update the two named test files so they assert the new contract
rather than the old one. Follow the existing style in those files. Between
them they must cover: a token with NO scopes now passes classification; a
falsy/unverified token still yields 401; the metadata document has no
`scopes_supported` key; and the `WWW-Authenticate` header contains
`resource_metadata` but no `scope=` parameter. Delete assertions that only
existed to prove the removed behaviour - do not leave them skipped.

**Lane gap, stated in writing:** `npm run test:unit` matches only
`test/analytics/**` and `test/lib/**` and never loads a route, controller, or
middleware, and no dispatch channel can run the integration lane. So the lanes
prove the pure functions and NOT the wiring. Criterion 2 below is the cheapest
available proof that the module graph still loads; the real proof is a live
connector handshake, which only Seth can run.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with the two updated test files
  passing and no skipped tests left behind.
- `node -e "require('./src/app.js')"` from `server/` exits 0 and prints
  nothing to stderr - proves the module graph still loads after the edits.
- `classifyConnectorToken({ userId: "u1", scopes: [] })` returns
  `{ ok: true, status: 200, failure: null }`.
- `classifyConnectorToken({ userId: "u1", scopes: ["anything"] })` returns
  `{ ok: true, status: 200, failure: null }`.
- `classifyConnectorToken(null)` returns
  `{ ok: false, status: 401, failure: "unauthorized" }`.
- `buildProtectedResourceMetadata` as called from `routes/index.js` yields an
  object with NO `scopes_supported` key (`"scopes_supported" in doc === false`,
  not merely undefined).
- The `WWW-Authenticate` header built by `sendUnauthorized` contains
  `resource_metadata="..."` and does NOT contain the substring `scope=`.
- `grep -rn "insufficient_scope" server/src` returns no matches.
- `grep -rn "CONNECTOR_SCOPE" server/src` returns matches ONLY in
  `server/src/ai/consent.js` and `server/src/controllers/aiController.js`.
- Client `npm run build` compiles with no errors (no client files change; this
  is the standing regression lane).

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
