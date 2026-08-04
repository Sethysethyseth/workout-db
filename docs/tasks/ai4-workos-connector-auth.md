# TASK AI4: WorkOS Standalone Connect - issue real connector tokens over the existing login

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

**CROSS-USER ISOLATION SURFACE - mandatory frontier-seat review** under
CLAUDE.md, whoever writes it. Also **BLOCKED ON A HUMAN STEP**: the WorkOS
account, its dashboard configuration, and its secrets are Seth's to create (the
checklist is at the bottom of this block). The CODE in this unit can be written
and lane-checked without them; it cannot be SMOKED without them. If the
environment variables are absent when you run, implement fully, verify what you
can, and say plainly in the report that the live flow is unverified - do not
stub the verification to make something pass.

CONTEXT:
Fourth unit of the AI connector wave. AI2 built the perimeter with a deliberately
swappable token verifier whose v1 implementation accepts an ordinary LogChamp
Bearer token. This unit replaces that implementation with real OAuth: WorkOS
acts as the authorization server for connector clients, while **LogChamp keeps
its own users, its own login, and its own database**. No user is migrated.
Nothing about `/auth/login` changes.

That shape is the August 2 ruling in `docs/specs/ai-layer.md` section 4.2, and
the reason is blast radius rather than cost: an identity provider in the app's
login path is a new single point of failure for the entire product - their
outage means nobody can open LogChamp at all. Scoped to the connector, the same
outage means the connector is down and the app is fine.

**If any future reader finds the words "migrate users" attached to this work,
they have misread it.** This is additive.

Grounding from the AIR3 research lane (August 4). Every one of these is a
concrete trap that has broken real deployments:

1. **Do NOT install `@workos-inc/node`.** Version 10.9.0 does not expose the
   completion method this flow needs (verified against the published type
   declarations), and it requires Node >= 22.11, which this server does not
   declare. The completion call is a documented plain HTTPS POST - use `fetch`.
   Token verification uses `jose`, which AI2 already installed.
2. **Redirect with 302, not 303.** A connector flow returning `303 See Other`
   has been reported broken with Claude and fixed by emitting `302`. Express's
   `res.redirect()` defaults to 302; do not override it.
3. **Audience mismatch is the most common silent failure.** The `resource`
   the client requests, the Resource Indicator configured in the WorkOS
   dashboard, and the `resource` field in our own protected-resource metadata
   must all be the SAME string. AI2 already centralized it as
   `MCP_RESOURCE_URL` - read that one constant; never re-type the URL.
4. **`aud` may be a string or an array.** Which one WorkOS emits for
   CIMD-registered MCP clients is UNCONFIRMED. Handle both.
5. **The Login URI receives exactly one documented query parameter,**
   `external_auth_id`. Do not assume others exist.

FILES TO TOUCH:
- `server/src/ai/tokenVerifier.js`     (replace the v1 implementation)
- `server/src/ai/workosClient.js`      (new - the completion call)
- `server/src/controllers/connectorAuthController.js`  (new - the Login URI handler)
- `server/src/routes/aiRoutes.js`      (one new route)
- `server/src/ai/protectedResource.js` (supply the real authorization server)
- `server/.env.example`                (document the new vars)
- `server/test/lib/workosToken.test.js` (new)
Do NOT modify anything outside these files. In particular do NOT touch
`server/src/middleware/connectorAuth.js` - AI2 built the seam so this unit
would not have to. If you find yourself needing to change the guard, stop and
explain why instead; that is a contract problem, not an implementation detail.

**NO NEW DEPENDENCIES.** `jose` is already installed by AI2. If you believe you
need another package, stop - installs are a gate item and this block does not
carry approval for one.

CHANGE:

**1. `server/src/ai/tokenVerifier.js` - real verification.** Keep the interface
exactly as AI2 defined it: `createTokenVerifier()` returning
`{ verify(token) -> { userId, scopes } | null }`, never throwing on a bad token.

The implementation now:
- builds a remote JWK set once at module scope with `jose`'s
  `createRemoteJWKSet(new URL(<authkit domain> + "/oauth2/jwks"))` - once, not
  per request; the helper caches and refreshes on its own, and rebuilding it per
  call turns every tool invocation into a network round trip
- verifies with `jwtVerify(token, JWKS, { issuer, audience })` where `issuer` is
  the AuthKit domain and `audience` is `MCP_RESOURCE_URL` (finding 3)
- accepts an `aud` claim that is either a string or an array containing the
  expected value (finding 4). Write this check explicitly rather than trusting a
  library default to do what you assume.
- maps the verified `sub` to a LogChamp user id, and reads scopes from the
  token's `scope` (space-delimited string) or `scopes` claim, whichever is
  present, normalizing to a string array
- returns `null` on ANY failure - bad signature, expired, wrong issuer, wrong
  audience, missing subject

**The mapping from `sub` to a LogChamp user must be exact.** WorkOS is told our
user id during completion (step 2), so `sub` should BE our user id - but verify
that assumption against a real token before relying on it, and if the tokens
carry a WorkOS-side identifier instead, look the user up rather than assuming
the strings coincide. A wrong mapping here hands one user's training data to
another; it is the single highest-severity line in this wave.

**2. `server/src/ai/workosClient.js` - the completion call.** One exported async
function taking the user's identity and the `external_auth_id`, performing:

- `POST https://api.workos.com/authkit/oauth2/complete`
- headers `Authorization: Bearer ${WORKOS_API_KEY}` and
  `Content-Type: application/json`
- body `{ external_auth_id, user: { id, email } }` - LogChamp's own user id and
  email, from our database
- returns the `redirect_uri` from the JSON response

Handle a non-2xx response by throwing an error carrying the status and body, so
the controller can log it and show something honest. **Never log
`WORKOS_API_KEY`, and never include it in an error message or response body.**

**3. `server/src/controllers/connectorAuthController.js` - the Login URI
handler.** This is the endpoint WorkOS redirects the user's browser to. Flow:

a. Read `external_auth_id` from the query string. Missing or blank -> a plain
   400 with a short human-readable message. This URL is hit by a real person in
   a real browser, so the failure text is user-facing copy, not a JSON blob.
b. Check for an existing LogChamp session. **Use the identity `attachAuthUser`
   already put on the request (`req.authUserId`) - do not re-implement session
   parsing.** This is the "layer over existing auth" ruling made concrete: we
   authenticate against our own stack, exactly as we already do everywhere else.
c. **Not logged in** -> redirect (302) to the CLIENT's login page with a `next`
   parameter that returns here, `external_auth_id` preserved. The login page is
   on the client origin, not this server, so build the URL from `CLIENT_ORIGIN`;
   follow the `?next=` convention `client/src/components/ProtectedRoute.jsx`
   already uses so the client handles it without new code. Do NOT invent a
   server-rendered login page.
d. **Logged in** -> load the user's email, call the completion API from step 2,
   then redirect (302, finding 2) to the returned `redirect_uri`.
e. Any failure in (d) -> a plain 500 page with a short human message and a
   server-side log line. Do not leak the WorkOS response body to the browser.

**Consent gate.** A user who has not granted AI consent (AI1) must not silently
complete this flow. Check `connectorAccess(...)` before calling the completion
API; when it denies, redirect (302) to the client's `/profile/ai` page rather
than showing an error - the user's next action is to turn the setting on, so
send them where they can. Do not duplicate the consent decision; call AI1's
function.

**4. `server/src/routes/aiRoutes.js`.** Add `GET /connector/login` ->
the handler. **This route must NOT have `authRequired`** - an unauthenticated
hit is the normal case that step 3c handles, and a 401 there would dead-end the
user in their AI assistant with no way forward. It also must not have
`connectorAuth`; this is the browser flow, not the token flow.

The full public path is `/ai/connector/login` (no `/api` prefix). That exact URL
is what Seth configures as the Login URI in the WorkOS dashboard, so it appears
in the human checklist below - if you change the path, the checklist is wrong.

**5. `server/src/ai/protectedResource.js`.** AI2 built this to accept an
`authorization_servers` array and tolerate it being empty. Now supply the real
AuthKit issuer from `MCP_AUTHORIZATION_SERVER`. The only change is that the
value is now present; do not restructure the module.

**6. Environment variables.** Document all of these in `server/.env.example`,
commented, in the existing style. Mark clearly which are SECRET:
- `WORKOS_API_KEY` - **SECRET**, server-side only, never sent to the client
- `WORKOS_CLIENT_ID` - not secret
- `MCP_AUTHORIZATION_SERVER` - the AuthKit domain / issuer URL
- `MCP_RESOURCE_URL` - already added by AI2; do not duplicate the entry

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with `server/test/lib/workosToken.test.js`
  running in it (`server/test/lib/` is what the unit project matches).
- `workosToken.test.js` covers the pure claim-handling in isolation, without
  network: given a decoded payload, the audience check accepts `aud` as the
  exact string, accepts `aud` as an array CONTAINING the expected value, rejects
  an array that does not contain it, and rejects a mismatched string. Extract
  whatever small pure helper makes this testable - the point is that finding 4
  is covered by an assertion, not by a comment.
- The scope normalizer is tested both ways: a space-delimited `scope` string and
  a `scopes` array both produce the same string array.
- `node --check` passes on every added/edited file under `server/src/`. Paste
  the output.
- `grep -rn "@workos-inc" server/` returns NOTHING (finding 1).
- `grep -rn "res.redirect" server/src/controllers/connectorAuthController.js`
  shows no explicit `303` anywhere (finding 2).
- `grep -rn "WORKOS_API_KEY" server/src/` shows it read in exactly one module
  (`workosClient.js`) and appearing in no log statement or response body.
- `grep -n "MCP_RESOURCE_URL" server/src/ai/tokenVerifier.js` shows the audience
  is read from that one constant rather than a re-typed literal (finding 3).
- `server/package.json` is UNCHANGED - show `git diff --stat` for it.
- Client `npm run build` compiles with no errors (regression check).

**LANE GAP, stated honestly.** Nothing in any runnable lane exercises the OAuth
flow, the redirect chain, or a real WorkOS token. The pure claim-handling is
gated; everything else is a smoke item and, until Seth's account exists, cannot
be smoked at all. Report exactly which parts you verified and which you did not.
**Do not write a test that mocks WorkOS into agreeing with you** - a green mock
of an unverified assumption is worse than an honest gap, because it reads as
coverage at the gate.

---

## SETH'S MANUAL STEPS (dashboard configuration - not Cursor's work)

These are human actions in the WorkOS dashboard. The code above is inert until
they are done, and `MCP_RESOURCE_URL` must be byte-identical everywhere it
appears (finding 3).

1. Create a WorkOS account. Staging and production are separate environments and
   staging is free; do staging first.
2. **Developer -> API Keys**: copy the API key (`sk_...`) and the Client ID
   (`client_...`). The API key is a secret - it goes in Render's environment,
   never in the repo.
3. Note the AuthKit domain (the issuer URL) -> `MCP_AUTHORIZATION_SERVER`.
4. **Connect -> create an OAuth application.**
5. **Connect -> Configuration -> Login URI**: set it to
   `https://<api host>/ai/connector/login` (staging first). One Login URI per
   environment.
6. **Connect -> Configuration -> enable Client ID Metadata Documents (CIMD).**
   Off by default; current MCP clients need it.
7. Optionally enable **Dynamic Client Registration (DCR)** for clients that do
   not yet support CIMD. The MCP spec has demoted DCR to optional, so this is
   belt-and-braces rather than required.
8. **Add the MCP server URL as a Resource Indicator**, exactly matching
   `MCP_RESOURCE_URL`. Consider marking it the default for clients that omit
   the `resource` parameter.
9. Set `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `MCP_AUTHORIZATION_SERVER`, and
   `MCP_RESOURCE_URL` in the Render environment for the staging service.
10. Going to production later means repeating steps 2, 5, 6, 8, and 9 in the
    production environment - **nothing copies across automatically**, and
    production additionally requires billing details on file (AuthKit itself is
    free to 1M monthly active users).

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
