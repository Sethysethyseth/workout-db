# TASK AI2: the connector perimeter - discovery document, Bearer guard, scope + consent enforcement, rate limiting

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

**CROSS-USER ISOLATION SURFACE.** Per CLAUDE.md this is a standing frontier-seat
escalation regardless of who writes it: the reviewer must read every line of the
guard, and the pre-main gate must re-read it. A bug here is one user's training
data reaching another user's AI assistant. Nothing in this block is "mechanical"
even though the MODEL header says auto.

CONTEXT:
Second unit of the AI connector wave (`docs/specs/ai-layer.md`). AI1 built the
consent record and the entitlement flag. This unit builds the PERIMETER the MCP
server (AI3) will sit behind, with the vendor-specific token verification left
as a seam that AI4 fills.

Why the seam matters: the vendor (WorkOS) account does not exist yet, and the
MCP tools should be testable before it does. So this unit ships a verifier
interface with the EXISTING JWT Bearer path as its first implementation -
meaning `/mcp` can be driven with `curl` using a normal LogChamp token the
moment AI3 lands, and AI4 swaps the implementation without touching the guard,
the routes, or the tools.

Grounding from the AIR1/AIR3 recon (August 4) that the contract depends on:

- **There is no rate limiting, helmet, or CSRF anywhere in the server today.**
  Verified against `server/package.json` and a grep of `server/src/`.
- **There is no `/api` prefix.** Routers mount at the host root
  (`server/src/app.js:126`). `ai-layer.md` section 4.1 says `/api/analytics/...`
  and is WRONG against the tree.
- **Middleware order in `server/src/app.js` is:** request logger (`:25-28`) ->
  CORS (`:65-76`) -> `express.json()` (`:78`) -> session (`:100-117`) ->
  `attachAuthUser` (`:120`) -> `/health` (`:122`) -> `app.use("/", routes)`
  (`:126`) -> `errorHandler` (`:128`). Order is load-bearing for step 4 below.
- **The existing CORS is an allowlist with `credentials: true`**
  (`server/src/app.js:45-76`) - `CLIENT_ORIGIN`, `CLIENT_ORIGIN_MOBILE`,
  localhost:5173, and `https://workout-*.vercel.app`. This is correct for the
  cookie-authenticated app and must not be loosened.
- **The two top real-world failure modes** for remote MCP servers, from the
  research lane, are (a) a 401 that omits `resource_metadata` in its
  `WWW-Authenticate` header, so the client never discovers where to authenticate
  and shows only "couldn't connect", and (b) CORS/OPTIONS preflight failures on
  the discovery and MCP routes. Both are designed against below. Do not treat
  them as edge cases; they are the common case.
- **The unit lane covers only `server/test/analytics/**` and
  `server/test/lib/**`** (`jest.config.js:11-14`). Pure logic goes in
  `server/test/lib/` or it is not gated by any lane.

FILES TO TOUCH:
- `server/package.json` + `server/package-lock.json`  (TWO dependencies, see below)
- `server/src/ai/protectedResource.js`   (new - PURE)
- `server/src/ai/tokenVerifier.js`       (new - the swappable seam)
- `server/src/middleware/connectorAuth.js`  (new)
- `server/src/routes/index.js`           (mount the discovery route)
- `server/src/app.js`                    (connector CORS + rate limiter, see step 4)
- `server/test/lib/aiProtectedResource.test.js`  (new)
- `server/test/lib/connectorScope.test.js`       (new)
- `server/.env.example`                  (document the new env vars)
Do NOT modify anything outside these files. In particular do NOT touch
`server/src/ai/consent.js` - AI1 owns it and this unit CONSUMES it.

**DEPENDENCIES - approved by Seth on August 4, install exactly these two:**
- `express-rate-limit` (the abuse control `ai-layer.md` section 6 requires)
- `jose` (JWKS verification; unused by this unit's default verifier but needed
  by the seam AI4 fills, and installing it here keeps AI4 free of a dependency
  gate). Install with `npm install` from `server/`; do NOT add anything else,
  and specifically do NOT install `@workos-inc/node` - it lacks the completion
  method we need and demands Node >= 22.11, which this server does not declare.

CHANGE:

**1. `server/src/ai/protectedResource.js` - PURE, no Express import.** RFC 9728
Protected Resource Metadata is a MUST for MCP servers. Export:

- `buildProtectedResourceMetadata({ resourceUrl, authorizationServers, scopes })`
  -> the JSON document. Required field `resource` (the canonical MCP server
  URL); `authorization_servers` (array, at least one, may be empty-array until
  AI4 supplies the real issuer); `bearer_methods_supported: ["header"]`;
  `scopes_supported` from the passed scopes. Do not emit keys with `undefined`
  values.
- `buildWwwAuthenticateHeader({ resourceMetadataUrl, scope })` -> the exact
  header STRING for a 401. It MUST contain
  `resource_metadata="<absolute https url>"`. Shape:
  `Bearer error="unauthorized", error_description="Authorization needed", resource_metadata="...", scope="..."`
  Omit the `scope` parameter entirely when no scope is supplied rather than
  emitting an empty one.

`resource_metadata` is the load-bearing parameter - a 401 without it is the
single most common reason a connector silently fails to offer a login. The
acceptance criteria assert on it directly.

**2. `server/src/ai/tokenVerifier.js` - the seam.** Export a single factory
`createTokenVerifier()` returning an object with one async method:

`verify(token)` -> `{ userId: string, scopes: string[] }` on success, or `null`
on any failure. It must never throw for a bad token - a malformed, expired, or
wrong-audience token is a `null` return, not an exception.

The v1 implementation delegates to the EXISTING `verifyAuthToken` from
`server/src/lib/jwt.js` and returns `{ userId, scopes: [CONNECTOR_SCOPE] }` -
i.e. a normal LogChamp Bearer token is accepted, carrying the connector scope.
This is deliberate and temporary: it makes the MCP surface drivable with `curl`
before the vendor exists.

**Leave exactly one comment marking the seam:**
`// AI4 replaces this implementation with WorkOS JWKS verification (jose) + audience binding. The interface does not change.`
Do NOT build the JWKS path here, do NOT read WorkOS env vars here, and do NOT
invent a config switch between implementations - AI4 replaces the function body.

**3. `server/src/middleware/connectorAuth.js` - the guard.** An async Express
middleware. It is NOT `authRequired` and must not be confused with it:
`authRequired` guards the cookie/JWT app surface and is unchanged.

In order:

a. Parse the Bearer token from the `Authorization` header. Follow the parsing
   in `server/src/middleware/attachAuthUser.js` BY NAME (same
   `scheme.toLowerCase() !== "bearer"` shape) rather than writing a new parser.
b. No token -> respond 401 with the `WWW-Authenticate` header from step 1 and a
   JSON body. **Return, do not call `next()`.**
c. `verify(token)` returns null -> the same 401.
d. Token lacks `CONNECTOR_SCOPE` in its `scopes` -> **403**, not 401 (the caller
   authenticated fine; it just isn't allowed this resource). A 401 here would
   send the client into a pointless re-authentication loop.
e. Load the user's consent row and `aiConnectorEnabled`, then call
   `connectorAccess()` from `server/src/ai/consent.js` (AI1). **Do not
   re-implement that decision** - it is the single gate, and duplicating it is
   exactly how the two halves drift apart. On `allowed: false`, respond 403 with
   a body carrying the `reason` verbatim (`"no_consent"` / `"not_entitled"`) so
   AI5's UI can tell the user which thing to fix.
f. On success set `req.connectorUserId` and `req.connectorScopes`, then
   `next()`. **Use a distinct property name - do NOT set `req.authUserId`.**
   That property means "authenticated on the app surface" and is set globally by
   `attachAuthUser`; overloading it would let a connector token silently satisfy
   every `authRequired` route in the app. This is the single highest-severity
   trap in the unit.

**4. `server/src/app.js` - two additions, placement is load-bearing.**

(a) **Connector CORS.** The MCP endpoint and the discovery documents are Bearer-
protected, not cookie-protected, and are fetched by third-party clients from
arbitrary origins. Add a NARROW CORS handler that applies ONLY to
`/.well-known/*` and `/mcp*`, mounted BEFORE the existing `app.use(cors(...))`
at `:65`. It must allow any origin, allow the `Authorization`,
`Content-Type`, `Accept`, and `MCP-Protocol-Version` request headers, allow
`GET`, `POST`, and `OPTIONS`, and answer preflight `OPTIONS` with a 204.

**It must NOT set `Access-Control-Allow-Credentials`.** Wildcard origin plus
credentials is the classic cross-origin data leak, and these routes never use
the cookie. The existing app CORS block at `:45-76` must be left byte-identical
- do not "simplify" the two into one.

(b) **Rate limiting.** Apply `express-rate-limit` to the connector surface only
(`/mcp*` and `/ai/*`), NOT app-wide. Key on the authenticated identity when one
is present (`req.connectorUserId ?? req.authUserId`) and fall back to IP
otherwise, so one user's assistant cannot exhaust another's budget. Pick a
generous window that will not fight normal assistant use (a few hundred requests
per 15 minutes is the right order of magnitude) and put the numbers in named
constants at the top of the file, not inline.

Stated as a known gap rather than fixed here, because it is outside this wave's
contract: `/auth/login` and `/auth/register` remain unthrottled. Note it in the
delivery report; do not fix it in this block.

**5. `server/src/routes/index.js` - the discovery route.** Add
`GET /.well-known/oauth-protected-resource` returning the document from step 1
with HTTP 200 and `Content-Type: application/json`. It is PUBLIC - no
`authRequired`, no `connectorAuth`. Place it next to the existing `/health`
route. The MCP spec also allows a path-suffixed form
(`/.well-known/oauth-protected-resource/mcp`); serve BOTH paths from the same
handler, because clients differ on which they request and a 404 on the one a
given client picks is indistinguishable from a broken server.

**6. Configuration.** Read from env, with sensible fallbacks so a dev server
boots without new setup:
- `MCP_RESOURCE_URL` - the canonical public URL of the MCP endpoint, e.g.
  `https://workout-db-l3gc.onrender.com/mcp`. This value is what the `resource`
  field and the audience check must agree on, so it is a single constant read
  once.
- `MCP_AUTHORIZATION_SERVER` - the AS issuer URL. Optional in this unit (AI4
  supplies the real one); when unset, `authorization_servers` is an empty array
  and the document still validates.
Document BOTH in `server/.env.example`, commented, following the style of the
existing entries there.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with the two new test files running
  in it (they are under `server/test/lib/`, which the unit project matches -
  `jest.config.js:11-14`).
- `server/test/lib/aiProtectedResource.test.js` asserts, at minimum:
  - the metadata document contains a `resource` key equal to the passed
    `resourceUrl`
  - `bearer_methods_supported` is exactly `["header"]`
  - `buildWwwAuthenticateHeader(...)` output CONTAINS the literal substring
    `resource_metadata="` followed by the passed URL - assert on the string, not
    on a parsed object
  - the header omits the `scope=` parameter entirely when no scope is passed
- `server/test/lib/connectorScope.test.js` asserts the scope check in isolation:
  a token whose `scopes` lacks `CONNECTOR_SCOPE` is rejected, one that has it
  passes, and the rejection is distinguishable from an authentication failure.
- `node --check` passes on every edited/added file under `server/src/`. Paste
  the output - the unit lane never loads middleware or routes.
- `grep -n "Access-Control-Allow-Credentials" server/src/app.js` shows the
  connector CORS block does NOT set it.
- `grep -n "req.authUserId" server/src/middleware/connectorAuth.js` returns
  NOTHING - the guard must never write that property.
- `grep -n "allowed" server/src/middleware/connectorAuth.js` shows the guard
  calls `connectorAccess(...)` from `server/src/ai/consent.js` rather than
  re-deriving consent or entitlement.
- The existing CORS block (`server/src/app.js:45-76`) is byte-identical in the
  diff - show the diff hunks for `app.js` in full.
- `server/package.json` gained exactly two dependencies, `express-rate-limit`
  and `jose`, and nothing else. Paste the dependency diff.
- Client `npm run build` compiles with no errors (this unit touches no client
  code; the build is a regression check).

**LANE GAP:** no runnable lane exercises Express middleware. The guard's actual
401/403 behaviour, the CORS headers, and the discovery route are SMOKE items.
Say so in the report. If you can demonstrate any of them with a local `curl`
against a dev server you started yourself, include the verbatim request and
response - that is worth more than any assertion in this list.

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
