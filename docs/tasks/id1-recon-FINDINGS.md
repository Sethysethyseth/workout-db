# RECON-ID — Claude connector stale-AuthKit identity bind

**Mode:** REPORT-ONLY (this file only). No code changes, no installs, no git.
**Access date for all WorkOS / web sources:** 2026-09-25.
**Symptom (live, Aug 14):** a stale AuthKit session silently binds the wrong LogChamp identity. `prompt=login` is ignored; AuthKit reuses its cached session. A user who once connected as account X stays bound to X even when they are logged into LogChamp as Y. There is no escape hatch.

Every repo claim has `file:line`. Every external claim has a URL. Anything not verified is marked **UNVERIFIED**.

---

## Executive takeaway

The bind happens **before** LogChamp sees the request. AuthKit, acting as the OAuth authorization server, will skip the External Sign-in URI (`/connector/login`) when it already has a browser session, and will mint MCP tokens whose `sub` is the previously completed LogChamp user. Our server then does the right thing with a wrong principal: JWT `sub` is treated as `User.id`, consent is checked for that user, and the tools return that user's data.

A confirmation step on `/connector/login` cannot close the skip-Login-URI path by itself. Clearing the AuthKit session (logout redirect and/or User Management session revoke) cannot close the silent auto-complete path by itself. **Together they close both paths.** Echoing the bound account is detection only. Shortening AuthKit session lifetime is dashboard-only and only partially documented for this Standalone Connect shape.

`server/src/coach/*` and `server/src/controllers/coachController.js` share the **consent/entitlement row**, not the WorkOS handshake. Do not put identity-echo into `analyticsAccess.js` (the coach reads that path). Wiring WorkOS revoke into the existing AI-access toggle is the one coach-adjacent choice; `coachController.js` itself would not need edits.

---

## Part 1 — NOW-state, end to end

### 1.1 Actors and two sessions

There are two independent sessions:

| Session | Cookie / token | Issuer | What it identifies |
|---|---|---|---|
| LogChamp app | `workoutdb.sid` (7 days) plus optional JWT | LogChamp | `req.authUserId` |
| AuthKit / Connect | hosted on the AuthKit domain (cookie name/lifetime **UNVERIFIED**) | WorkOS AuthKit | the previously completed external user; minted into MCP access-token `sub` |

LogChamp session cookie: `server/src/app.js:159-172` (`name: "workoutdb.sid"`, `maxAge: 1000 * 60 * 60 * 24 * 7`). `attachAuthUser` sets `req.authUserId` from Bearer JWT or `req.session.userId` (`server/src/middleware/attachAuthUser.js:12-31`). Connector tokens never go through this middleware; `/mcp` uses `connectorAuth`.

### 1.2 Discovery and the MCP perimeter

`POST/GET/DELETE /mcp` is mounted in `server/src/app.js:226-232`: pre-auth IP failure limiter, then `connectorAuth`, then per-identity limiter, then `handleMcpRequest`.

`connectorAuth` (`server/src/middleware/connectorAuth.js:53-87`):

1. Parse `Authorization: Bearer` (`:10-17`). Missing token → 401 + `WWW-Authenticate` pointing at protected-resource metadata (`:42-50`, `:19-27`).
2. `createTokenVerifier().verify(token)` (`:60`).
3. `classifyConnectorToken` accepts any verified token regardless of scopes (`:35-39`). AuthKit cannot issue the local `training:read` descriptor (`server/src/ai/consent.js:1-4`).
4. `prisma.user.findUnique({ where: { id: verified.userId } })` (`:66-72`). **`verified.userId` is the JWT `sub` with no remapping.**
5. `connectorAccess({ consentRow, aiConnectorEnabled })` (`:74-77`). Denied → 403 `{ error: "forbidden", reason }` (`:78-82`).
6. Sets `req.connectorUserId = verified.userId` (`:85`).

Protected-resource metadata is public at both path forms (`server/src/routes/index.js:45-50`). `authorization_servers` is `[MCP_AUTHORIZATION_SERVER]` when set (`:21-27`). Default `MCP_RESOURCE_URL` if unset is `http://localhost:3000/mcp` (`:17-18`; same fallback at `connectorAuth.js:21`).

### 1.3 Token verification and `sub` → LogChamp user

`server/src/ai/tokenVerifier.js`:

- Issuer = `MCP_AUTHORIZATION_SERVER` (read at **module load**, `:1`).
- JWKS = `{issuer}/oauth2/jwks` (`:8-9`).
- `jwtVerify` with `issuer` + `audience: MCP_RESOURCE_URL` (`:47-50`).
- Extra `aud` check accepts string or array (`:16-24`, `:51-53`).
- Missing/empty `sub` → `null` (`:54-56`).
- Return `{ userId: payload.sub, scopes }` (`:57-60`). **No lookup table. `sub` is used as `User.id`.**

Live Aug 14 closed this mapping: token `sub` was `cmrp90q100000em21f4bomlz1` (a LogChamp `cuid()`), not a `user_`-prefixed WorkOS id. WorkOS echoed the id sent to `completeConnectorAuthorization`. Same id came back from `/auth/me` on that session. Evidence: `docs/HANDOFF-ARCHIVE.md:30-35` and `docs/HANDOFF.md:242-244`.

Generic Connect docs still describe `sub` as "User ID" and show `payload.sub` used as a WorkOS `user_id` in membership lookups ([token claims](https://workos.com/docs/authkit/connect/token-claims)). For **this** Standalone deployment, live evidence overrides that generic wording.

### 1.4 External sign-in (the only WorkOS write we make)

The only WorkOS API call in `server/src` is the completion POST.

`server/src/ai/workosClient.js:1-44`:

- **Endpoint:** `POST https://api.workos.com/authkit/oauth2/complete` (`:1`, `:9`).
- **Headers:** `Authorization: Bearer ${WORKOS_API_KEY}`, `Content-Type: application/json` (`:11-14`).
- **Body fields actually sent:**

```
{
  external_auth_id: <string from the Login URI>,
  user: {
    id:    <LogChamp User.id>,
    email: <LogChamp User.email>
  }
}
```

(`:15-21`). We do **not** send `first_name`, `last_name`, `name`, `metadata`, or `user_consent_options` (those are optional in the WorkOS docs).

- Returns `payload.redirect_uri` (`:40-43`). Non-2xx throws with status + body (`:25-31`); controller maps that to 409 `authorization_expired` (`server/src/controllers/connectorAuthController.js:56-58`).

`WORKOS_API_KEY` is read only here (`workosClient.js:4`). `WORKOS_CLIENT_ID` is documented in `server/.env.example:24` and is **not read anywhere under `server/src`**.

Official contract: completion "Create or update the user in AuthKit, using the given `id` as its `external_id`" ([Standalone Connect reference](https://workos.com/docs/reference/workos-connect/standalone)). Emails are unique; a new `id` with an existing email fails.

### 1.5 Login URI → completion (browser path)

AI8 moved the WorkOS External Sign-in URI to the **client** origin. Route: `/connector/login` on the Vite app, **not** `/ai/connector/login` on the API (`client/src/App.jsx:33`; `docs/HANDOFF-ARCHIVE.md:22-25`).

`client/src/pages/ConnectorLoginPage.jsx`:

1. Reads `external_auth_id` from the query string (`:13-14`). Missing → "connection link is incomplete" (`:62-70`).
2. While auth is loading, spinner (`:73-80`).
3. No `currentUser` → `<Navigate to={`/login?next=...`}>` preserving path+search (`:83-86`). `LoginPage` only accepts a relative `next` (`client/src/pages/LoginPage.jsx:12-18`) and navigates there after login (`:27-30`, `:38`).
4. **If signed in, the page auto-POSTs.** One attempt per `external_auth_id` (`:27-32`, `:40`). No "signed in as …" confirmation. No chance to switch account.
5. `authorizeConnector` → `POST /ai/connector/authorize` with `{ external_auth_id }` (`client/src/api/aiApi.js:15-19`).
6. Success → `window.location.assign(data.redirectUri)` (`ConnectorLoginPage.jsx:42`).
7. 403 → `/profile/ai` (`:45-47`, `:88-90`). 409 → expired-link copy (`:49-52`, `:92-102`).

Server handler `connectorAuthorize` (`server/src/controllers/connectorAuthController.js:10-64`):

- Route: `POST /ai/connector/authorize` behind `authRequired` (`server/src/routes/aiRoutes.js:14`). Unauthenticated → 401 from `authRequired` (`server/src/middleware/authRequired.js:1-8`).
- Loads `User.id`, `email`, `aiConnectorEnabled`, `aiConsent` (`connectorAuthController.js:17-25`).
- `connectorAccess` then `connectorAuthorizeDecision` (`:30-38`).
- Missing id → 400; no consent → 403 `consent_required`; no `authUserId` → 401 (`:40-47`).
- On ok, calls `completeConnectorAuthorization({ id, email }, externalAuthId.trim())` (`:51-54`).

Pure decision helper: `server/src/lib/connectorAuthorize.js:9-24` (property reads only; no Prisma, no WorkOS).

### 1.6 After completion: AuthKit consent and tokens

We never see the AuthKit consent page in our code. Official flow: redirect to `redirect_uri` → AuthKit shows consent if needed → client gets a code → `POST {AuthKit}/oauth2/token` ([Standalone Connect](https://workos.com/docs/authkit/connect/standalone)). Live Aug 14: signed-in authorize **skipped `/connector/login` entirely** and landed on AuthKit consent reading "Logged in as smoke-b8@example.com" (`docs/HANDOFF-ARCHIVE.md:51-59`). Refresh with `offline_access` issued a new `jti`, same `sub` (`docs/HANDOFF-ARCHIVE.md:28`).

`external_auth_id` TTL observed live: AuthKit set `external_auth=...; Max-Age=300` (`docs/HANDOFF-ARCHIVE.md:61-64`). That is the handshake cookie, not the session cookie.

### 1.7 MCP tools: identity is closed over, never an argument

`createMcpServerForUser(connectorUserId)` (`server/src/ai/mcpServer.js:90`). All four tools load data with that id:

- `get_training_summary` → `loadSummary(connectorUserId, …)` (`:127`)
- `get_exercise_detail` → `loadExerciseDetail(connectorUserId, …)` (`:205`)
- `list_exercises` → `loadExerciseRoster(connectorUserId, …)` (`:278`)
- `get_recent_sessions` → `loadRecentSessions(connectorUserId, …)` (`:308`)

Cross-user isolation in the data layer is `where: { userId }` (`server/src/ai/analyticsAccess.js:29-36`, `:239-241`). Tool JSON does **not** include the bound email, display name, or user id (`mcpServer.js:22-26` just `JSON.stringify(payload)`). A wrong bind is invisible in the tool output.

`handleMcpRequest` 401s if `req.connectorUserId` is missing (`:323-328`) and builds a fresh server+transport per request (`:331-336`).

### 1.8 Consent + entitlement (`AiConsent` and `User.aiConnectorEnabled`)

Schema (`server/prisma/schema.prisma:21-41`):

- `User.aiConnectorEnabled Boolean @default(true)`
- `AiConsent` 1:1: `userId`, `scope`, `grantedAt`, `revokedAt`

Helpers (`server/src/ai/consent.js`):

- `isConsentActive`: row exists, `grantedAt` set, `revokedAt` null (`:7-12`)
- `connectorAccess`: no active consent → `no_consent`; flag false → `not_entitled`; else allowed (`:29-36`)
- `CONNECTOR_SCOPE = "training:read"` is a **local audit label only** (`:1-5`, `:51`)

Grant/revoke (`server/src/controllers/aiController.js`):

- `GET/POST/DELETE /ai/consent` (`server/src/routes/aiRoutes.js:15-17`), all `authRequired`.
- Grant upserts `grantedAt=now`, `revokedAt=null`, `scope=CONNECTOR_SCOPE` (`aiController.js:47-60`).
- Revoke sets `revokedAt` if currently active (`:79-87`). **That is the only disconnect path.**

Comment at `aiController.js:79` says "AI4: revoking consent must also revoke issued connector tokens." **No WorkOS call follows.** The kill-switch is our middleware: next `/mcp` with a still-valid JWT gets 403 `no_consent` (`connectorAuth.js:74-82`). Live Aug 14 confirmed that on `tools/call` and `tools/list` with no cache lag (`docs/HANDOFF-ARCHIVE.md:44-47`).

So today, "Disconnect" (the AI-access toggle) revokes **our consent row only**. It does not revoke WorkOS sessions, does not revoke MCP access/refresh tokens at the AS, and does not clear the AuthKit browser cookie. Re-authorize with a stale AuthKit session re-binds to X even if Y is now the LogChamp session.

### 1.9 Client: Profile → AI access

Route `/profile/ai` behind `ProtectedRoute` (`client/src/App.jsx:142-148`). Hub link: `client/src/pages/ProfilePage.jsx:122-128`.

`AiConnectorPage` (`client/src/pages/profile/AiConnectorPage.jsx`):

- One switch: grant vs `revokeAiConsent` (`:201-220`, `:294-304`). Copy: "One switch for the in-app coach and for outside AI assistants" (`:267`). "Turning it off cuts access everywhere at once" (`:290`).
- Per-client accordions (Claude / ChatGPT / Grok / other) via `ConnectorSetupAccordion` (`:447-450`; data at `:15-96`; component `client/src/components/ai/ConnectorSetupAccordion.jsx`).
- No "Disconnect Claude" / "Switch account" / bound-identity display distinct from the kill-switch.
- Coach BYO-key UI is on the same page (`:322-396`) and is gated on `granted` (`:322`).

### 1.10 Coach overlap (read-only for this bug)

`server/src/coach/askCoach.js:48-57` — `loadCoachAccess` reads the **same** `aiConnectorEnabled` + `aiConsent` and uses `isConsentActive`. `coachController.js` uses that for `/coach/status` (`:33-48`) and 403s ask/palette on `no_consent` (`:78-79`, `:181-182`). No WorkOS, no `external_auth_id`, no MCP token.

`server/src/coach/provider.js:4` only mentions `workosClient.js` as a "plain HTTPS" style note.

The coach is affected only if a fix mutates the shared consent row or `analyticsAccess.js`.

### 1.11 Unit tests that cover this flow

The unit lane never loads routes, controllers, or the `connectorAuth` middleware body (`docs/HANDOFF.md:257-260`). Coverage is helpers only:

| File | What it actually asserts |
|---|---|
| `server/test/lib/connectorAuthorize.test.js:5-54` | `connectorAuthorizeDecision` branches: ok / missing id / missing-beats-consent / consent_required / unauthenticated |
| `server/test/lib/workosToken.test.js:8-49` | `hasExpectedAudience` (string + array) and `normalizeScopes` (`scope` string vs `scopes` array). **Does not call `verify()`, does not hit JWKS, does not map `sub`.** |
| `server/test/lib/connectorScope.test.js:4-38` | `classifyConnectorToken`: empty scopes pass, arbitrary scopes pass, null → 401 |
| `server/test/lib/aiConsent.test.js:23-84` | `isConsentActive` / `consentStateFor` / `connectorAccess` including revoked → `no_consent` |
| `server/test/lib/aiProtectedResource.test.js:10-40` | metadata shape + `WWW-Authenticate` without `scope=` |
| `server/test/lib/rateLimitKeys.test.js:6-48` | `/mcp` key is `req.connectorUserId`, never `authUserId` |
| `server/test/lib/toolPayloads.test.js` | payload trim / honesty notes — no identity |

**No unit test** for `workosClient.js`, `connectorAuthController.js`, `tokenVerifier.verify`, `ConnectorLoginPage` auto-complete, or session/token revoke. The handshake is smoke-only. `scripts/smoke-connector.mjs` is specified by AI10 and is **not in this tree** (`Glob **/smoke-connector*` → 0 files; HANDOFF says AI10 is dispatched on another lane).

---

## Part 2 — WorkOS facts (official docs, 2026-09-25)

### 2.1 How the AuthKit browser session persists

**Hosted AuthKit / User Management sessions** ([Sessions](https://workos.com/docs/authkit/sessions)):

- A session is created on sign-in. Dashboard: Users → user → Sessions tab.
- Configure per application at **Applications → (app) → Sessions**: maximum session length, access-token duration, inactivity timeout. After max length or inactivity (no refresh), the user must sign in again.
- Sign-out: take `sid` from the access token, delete the app cookie, redirect the browser to the logout endpoint; user returns to the configured homepage / Sign-out URI.

**SDK session cookies** (AuthKit-as-your-login, **not** our stack): Next.js / React Router default cookie name `wos-session`, default `maxAge` 400 days ([AuthKit Next.js](https://workos.com/docs/sdks/authkit-nextjs), [AuthKit React Router](https://workos.com/docs/sdks/authkit-react-router)). LogChamp does not use these SDKs.

**For Standalone Connect / MCP specifically:**

- AuthKit redirects to our Login URI only when it needs external authentication ([Standalone Connect](https://workos.com/docs/authkit/connect/standalone), [Standalone MCP Auth](https://workos.com/docs/authkit/mcp#standalone-mcp-auth)).
- Official docs do **not** name the cookie on `*.authkit.app`, its `Max-Age`, or whether Applications → Sessions applies to that hosted consent session. **UNVERIFIED.**
- Live: AuthKit reused a session and showed "Logged in as smoke-b8@example.com" without hitting `/connector/login` (`docs/HANDOFF-ARCHIVE.md:51-59`). That implies a cookie on the AuthKit host, not `workoutdb.sid`.
- Default numeric values for max session length / inactivity timeout are **UNVERIFIED** (docs say they are configurable, do not publish defaults).

### 2.2 Does AuthKit honor `prompt=login` / `prompt=select_account` on `/oauth2/authorize`?

Connect `GET /oauth2/authorize` documented parameters: `client_id`, `nonce`, `redirect_uri`, `response_type`, `scope`, `state`, `code_challenge`, `code_challenge_method`. **No `prompt`. No `max_age`.** ([Authorize](https://workos.com/docs/reference/workos-connect/authorize))

Live Aug 14: `prompt=login` was ignored (`docs/HANDOFF-ARCHIVE.md:54-55`). That matches the documented parameter table.

`max_age` / `maxAge: 0` **is** documented as the way to force a fresh sign-in — on `workos.userManagement.getAuthorizationUrl` (AuthKit-as-login / reauthentication), not on Connect `/oauth2/authorize` ([Reauthentication](https://workos.com/docs/authkit/reauthentication)). An MCP client does not call `getAuthorizationUrl`. Whether adding `max_age=0` to Connect authorize would work is **UNVERIFIED**; it is not in the Connect parameter table.

Documented ways that *do* exist to force re-authentication:

1. User Management reauth with `max_age=0` ([Reauthentication](https://workos.com/docs/authkit/reauthentication)) — wrong entry point for MCP clients.
2. Browser redirect to logout (`GET /user_management/sessions/logout`) ([Logout](https://workos.com/docs/reference/authkit/logout/get-logout-url)).
3. `POST /user_management/sessions/revoke` ([Revoke session](https://workos.com/docs/reference/authkit/session/revoke)).
4. Wait for configured session expiry ([Sessions](https://workos.com/docs/authkit/sessions)).
5. Our Login URI always re-authenticates **when it is actually hit** ([Standalone Connect](https://workos.com/docs/authkit/connect/standalone) step 3: "If users have an active session, skip to the next step" — that is *our* session, which is why a confirmation step is on us).

### 2.3 External sign-in → User Management user; list/revoke sessions

Yes: completion creates or updates a User Management user; the `user.id` we send becomes `external_id` ([Standalone Connect reference](https://workos.com/docs/reference/workos-connect/standalone)).

Lookup by our id:

- `GET https://api.workos.com/user_management/users/external_id/{external_id}` ([Get user by external ID](https://workos.com/docs/reference/authkit/user/get-by-external-id))

List sessions (requires the **WorkOS** `user_…` id, not our cuid):

- `GET https://api.workos.com/user_management/users/{id}/sessions` ([List sessions](https://workos.com/docs/reference/authkit/session/list))

Revoke one session:

- `POST https://api.workos.com/user_management/sessions/revoke` body `{ "session_id": "session_…" }` ([Revoke session](https://workos.com/docs/reference/authkit/session/revoke))
- Docs say `session_id` "can be extracted from the `sid` claim of the access token."

**Caveat for Connect tokens:** Connect user-token `sid` is documented as **Consent ID**, not a User Management session id ([token claims](https://workos.com/docs/authkit/connect/token-claims)). Do not pass an MCP token's `sid` to session revoke without checking the prefix. Use list-sessions on the UM user instead.

**Does revoking a UM session invalidate already-issued MCP access/refresh tokens?** Official session docs say they revoke "a user session." They do not say Connect refresh tokens die. Standalone Connect says "See the Connect documentation for details on token expiration, refresh tokens, and revocation" ([Standalone Connect](https://workos.com/docs/authkit/connect/standalone)) but the Connect pages fetched (OAuth, token, token-claims, metadata, MCP) do not specify that UM session revoke cascades to Connect tokens. **UNVERIFIED.** Safer assumption: session revoke / logout clears the **browser** AuthKit session (next authorize re-hits Login URI); already-issued MCP JWTs remain valid until `exp` unless we also 403 them (we already do, via consent) or introspection starts failing.

Related, not a session API: list/delete the user's authorized Connect applications

- `GET /user_management/users/{user_id}/authorized_applications`
- `DELETE /user_management/users/{user_id}/authorized_applications/{application_id}` (`application_id` may be the client id)

([Delete authorized application](https://workos.com/docs/reference/authkit/user/authorized-application/delete)). Docs do **not** say this invalidates outstanding tokens or the AuthKit cookie. **UNVERIFIED** as a token-kill. It is the closest documented "un-consent this OAuth client" API.

### 2.4 OAuth token revocation endpoint for the MCP client's tokens?

AuthKit AS metadata advertises `authorization_endpoint`, `token_endpoint`, `introspection_endpoint`, `registration_endpoint`, `jwks_uri`. **No `revocation_endpoint`.** ([MCP guide](https://workos.com/docs/authkit/mcp), [Connect metadata](https://workos.com/docs/reference/workos-connect/metadata))

Documented token APIs: `POST {AuthKit}/oauth2/token` (code + refresh) ([Token](https://workos.com/docs/reference/workos-connect/token)); `POST {AuthKit}/oauth2/introspection` ([Introspection](https://workos.com/docs/reference/workos-connect/introspection)).

We verify JWTs locally (`tokenVerifier.js`) and do **not** introspect. A revoked-at-AS token would still pass JWKS until expiry.

**No RFC 7009 `/oauth2/revoke` is documented or advertised. UNVERIFIED that one exists unpublished.**

Agent-session revoke (`POST /agents/sessions/{id}/revoke`) is a different product ([Agent Auth](https://workos.com/docs/authkit/agent-blueprints)) and does not apply to this MCP connector.

### 2.5 Logout URL that clears the AuthKit cookie, and chaining back

Yes:

- `GET https://api.workos.com/user_management/sessions/logout?session_id=session_…&return_to=https://…` ([Get logout URL](https://workos.com/docs/reference/authkit/logout/get-logout-url), [Sessions — Signing Out](https://workos.com/docs/authkit/sessions))
- Browser must be redirected there (it is a cookie-clearing navigation, not a server-to-server POST).
- `return_to` is optional. Non-default values must be registered as Sign-out URIs in the dashboard. Default Sign-out URI is required for the no-`return_to` case. Wildcards allowed for subdomains with stated rules; a wildcard URI cannot be the default.

Chaining back to our site: register e.g. `https://<client-origin>/connector/login` (and/or `/profile/ai`) as a Sign-out URI, then pass it as `return_to`. **We do not have a `session_id` in-process** (we never hold an AuthKit access token). Obtain it via list-sessions after resolving the UM user by `external_id` = LogChamp `User.id`.

Whether logout of a Standalone-Connect-created session actually clears the cookie that caused the Aug 14 skip is **UNVERIFIED** in docs; it is the documented mechanism for ending an AuthKit session in the browser.

---

## Part 3 — Ranked candidate fixes

Constraint from Part 1+2: the bug has **two doors**.

| Door | When it opens | What must change |
|---|---|---|
| A. AuthKit skips Login URI | AuthKit already has a session for X | Clear that session (logout/revoke/expiry) so authorize re-hits `/connector/login` |
| B. Login URI auto-completes | AuthKit *does* send the user to us, and LogChamp session is whoever is logged in | Stop auto-POST; confirm identity; offer switch |

Neither door is closed by dashboard config of `prompt`. Live evidence + the authorize parameter table.

### Candidate 1 — Signed-in-as confirmation on `/connector/login` (always)

**Closes:** Door B fully. Door A **not at all** (page never renders when AuthKit skips). Partial vs the reported symptom.

**Code vs dashboard:** code only.

**Blast radius:** low. Handshake grows one click. `external_auth_id` TTL is 300s live — a slow confirm+password can 409. No coach path. No schema.

**Evidence it works:** Standalone step 3 leaves "already has a session → complete immediately" as *our* choice ([Standalone Connect](https://workos.com/docs/authkit/connect/standalone)). Today we auto-complete (`ConnectorLoginPage.jsx:29-42`). A confirm that shows `currentUser.email` (available: `sanitizeUser` keeps email, `authController.js:8-15`) is local and testable. It does not make AuthKit honor `prompt`.

**FILES TO TOUCH:**

- `client/src/pages/ConnectorLoginPage.jsx` (gate the POST on an explicit Continue; show email; "Use a different account" → LogChamp logout + `/login?next=…`)
- optional: `client/src/pages/LoginPage.jsx` only if switch-account copy needs it (already supports `next`)
- no server change required for the minimum version

**Coach overlap:** none.

### Candidate 2 — Disconnect that clears AuthKit session (+ our consent)

**Closes:** Door A **if** logout/session-revoke actually drops the hosted AuthKit cookie (docs say that is what logout is for; Standalone-Connect applicability **UNVERIFIED** until smoked). Does not close Door B. Combined with Candidate 1, both doors close. Already-issued MCP JWTs stay valid until `exp` unless we also flip consent (today's 403) or start introspecting.

**Code vs dashboard:** code + one dashboard Sign-out URI if we use `return_to`.

**Blast radius:** medium. New WorkOS reads/writes in `workosClient.js`. If hooked to the existing AI-access toggle, coach goes dark too — **already the product copy** (`AiConnectorPage.jsx:267, 290`). A separate "Disconnect assistants" button could revoke WorkOS without touching `AiConsent`; then the coach stays up. That is a product choice.

Need WorkOS `user_…` id: `GET /user_management/users/external_id/{LogChamp User.id}` then list/revoke sessions. Optional: `DELETE …/authorized_applications/{client_id}` ([authorized application](https://workos.com/docs/reference/authkit/user/authorized-application/delete)) — token-kill **UNVERIFIED**.

`aiController.js:79` already claims token revoke; implementing WorkOS calls there matches the comment. Do **not** install `@workos-inc/node` (AI4 ruling, `docs/tasks/ai4-workos-connector-auth.md:36-39`); keep `fetch`.

**Evidence it works:** logout + session revoke are the documented escape hatches ([Sessions](https://workos.com/docs/authkit/sessions), [Logout](https://workos.com/docs/reference/authkit/logout/get-logout-url), [Revoke](https://workos.com/docs/reference/authkit/session/revoke)). Live bug is an AuthKit session that `prompt=login` cannot shake — these APIs are the ones that target that session. Smoke required: after revoke/logout, a new `/oauth2/authorize` must hit `/connector/login`.

**FILES TO TOUCH:**

- `server/src/ai/workosClient.js` (get-by-external-id, list sessions, revoke session, optional delete authorized app, logout URL builder)
- `server/src/controllers/aiController.js` (`revokeConsent` and/or a new handler)
- `server/src/routes/aiRoutes.js` only if a new route (e.g. `POST /ai/connector/disconnect`)
- `client/src/api/aiApi.js`
- `client/src/pages/profile/AiConnectorPage.jsx` (button + copy)
- tests: `server/test/lib/` for any extracted pure URL/body helpers
- dashboard (human): register Sign-out URI if using `return_to`

**Coach overlap:** `coachController.js` — **no edit** if we keep using `AiConsent`. `askCoach.js` — **no edit**. Shared row means coach 403s when the toggle is the hook; that is existing behavior, not a new coupling. Do not import WorkOS into `server/src/coach/*`.

### Candidate 3 — Short AuthKit session lifetime (dashboard)

**Closes:** Door A **eventually** (after expiry / inactivity). Door B never. Partial, and delayed. A user stuck on X stays stuck until the clock runs out.

**Code vs dashboard:** dashboard only. Applications → Sessions: max session length, inactivity timeout ([Sessions](https://workos.com/docs/authkit/sessions)).

**Blast radius:** low for our repo; UX cost is more frequent AuthKit re-auth for every connector user. **UNVERIFIED** that this tab governs the Standalone Connect hosted cookie (docs describe it for AuthKit-as-login applications).

**Evidence it works:** docs say expired session ⇒ sign in again. Live skip happens because the session is still valid. Shortening it reduces how long a wrong bind persists; it does not add an escape hatch.

**FILES TO TOUCH:** none in repo. Human step in WorkOS staging **and** prod (environments do not share config; `docs/specs/workos-staging-handoff.md:187-190`).

**Coach overlap:** none.

### Candidate 4 — Echo the bound account in connector tool output

**Closes:** nothing. Detection / honesty only. A user (or the model) can see "bound to smoke-b8@…" and complain. The connector still answers with X's data.

**Code vs dashboard:** code only.

**Blast radius:** low if the echo is added in `mcpServer.js` `toolText` (or a wrapper) by loading email for `connectorUserId` once per request. **Do not** put it in `loadSummary` / `analyticsAccess.js` — the coach uses that path (`askCoach.js:11`). Keep PII to email (already sent to WorkOS).

**Evidence it works:** tools currently stringify analytics only (`mcpServer.js:22-26`). Adding a `boundAccount` field is local and unit-testable. It does not change AuthKit.

**FILES TO TOUCH:**

- `server/src/ai/mcpServer.js`
- optional small helper next to it (not `analyticsAccess.js`)
- `server/test/lib/` for the wrapper

**Coach overlap:** none if scoped to `mcpServer.js`. **Collision** if someone "helps" by adding the field in `analyticsAccess.js` or `server/src/coach/*`.

---

### Recommended combination (for the unit author)

| Rank | Candidate | Door A | Door B | Full close? |
|---|---|---|---|---|
| 1+2 | Confirm on Login URI **and** Disconnect that logs out / revokes AuthKit sessions (keep consent kill-switch) | yes, after smoke of logout | yes | **yes, if smoke confirms logout re-hits Login URI** |
| 1 only | Confirm | no | yes | no |
| 2 only | Disconnect / logout | yes* | no | no |
| 3 | Short session | delayed* | no | no |
| 4 | Echo identity | n/a | n/a | no (visibility) |

\* starred items depend on UNVERIFIED Standalone-Connect applicability of UM session APIs.

Ship 4 as a cheap honesty note in the same unit as 1, not as the fix.

**Suggested FILES TO TOUCH for a 1+2 unit** (disjoint from coach except the shared consent row):

- `client/src/pages/ConnectorLoginPage.jsx`
- `client/src/pages/profile/AiConnectorPage.jsx`
- `client/src/api/aiApi.js`
- `server/src/ai/workosClient.js`
- `server/src/controllers/aiController.js`
- `server/src/routes/aiRoutes.js` (only if new route)
- `server/test/lib/` (new pure helpers)
- optional identity stamp: `server/src/ai/mcpServer.js` only

**Do not touch:** `server/src/coach/*`, `server/src/controllers/coachController.js`, `server/src/ai/analyticsAccess.js`, `server/src/ai/tokenVerifier.js` (mapping is already correct), `docs/HANDOFF.md`, `docs/tasks/*`.

---

## UNVERIFIED checklist (do not treat as facts)

1. Cookie name / `Max-Age` of the hosted AuthKit session used by Standalone Connect / MCP consent.
2. Whether Applications → Sessions (max length, inactivity) applies to that hosted session.
3. Whether `max_age=0` on Connect `/oauth2/authorize` is honored (not in the parameter table).
4. Whether UM session revoke invalidates Connect access/refresh tokens (vs browser session only).
5. Whether `DELETE …/authorized_applications/{id}` invalidates tokens or the AuthKit cookie.
6. Whether `GET /user_management/sessions/logout` for a Standalone-created user clears the cookie that caused the Aug 14 skip.
7. Whether Standalone completion always creates a listable UM session (`auth_method` value **UNVERIFIED**).
8. `external_auth_id` single-use / repeat-complete behavior (R1 still open; TTL 300s is the one live answer).
9. Default dashboard numbers for max session length / inactivity timeout.

---

## Sources

**Repo (primary):** files cited inline.

**Official WorkOS (2026-09-25):**

- https://workos.com/docs/authkit/mcp
- https://workos.com/docs/authkit/connect/standalone
- https://workos.com/docs/reference/workos-connect/standalone
- https://workos.com/docs/reference/workos-connect/authorize
- https://workos.com/docs/reference/workos-connect/token
- https://workos.com/docs/reference/workos-connect/introspection
- https://workos.com/docs/reference/workos-connect/metadata
- https://workos.com/docs/authkit/connect/token-claims
- https://workos.com/docs/authkit/connect/oauth
- https://workos.com/docs/authkit/sessions
- https://workos.com/docs/authkit/reauthentication
- https://workos.com/docs/reference/authkit/session
- https://workos.com/docs/reference/authkit/session/list
- https://workos.com/docs/reference/authkit/session/revoke
- https://workos.com/docs/reference/authkit/logout/get-logout-url
- https://workos.com/docs/reference/authkit/user/get-by-external-id
- https://workos.com/docs/reference/authkit/user/authorized-application/delete

**Live probe (not docs, not re-run this lane):** `docs/HANDOFF-ARCHIVE.md:12-74`, `docs/HANDOFF.md:202-226`, `docs/RUNBOOK.md:369-372`.
