# TASK AI8: move the connector Login URI to the client origin

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's August 8 smoke of the connector handshake failed. AI4 put the WorkOS
Login URI on the API origin (`GET /ai/connector/login`), and that placement is
the root of three stacked defects (evidence below). This unit moves the Login
URI to the CLIENT origin as a React route that calls the API over XHR, which
removes all three at once. Recon lane RECON-R1 (August 8) confirmed against
current WorkOS docs that nothing requires the Login URI to share an origin with
the `/mcp` resource - they are separate dashboard settings, and WorkOS's own
example Login URI is an app hostname. Spec: `docs/specs/ai-layer.md` Lane A;
the flow AI4 built is documented in `docs/tasks/ai4-workos-connector-auth.md`.

THE THREE DEFECTS THIS FIXES (all three verified, do not re-litigate them):

1. **Dead redirect origin.** `connectorAuthController.js:7-15` takes the FIRST
   comma-separated entry of `CLIENT_ORIGIN` - a CORS ALLOWLIST - and uses it as
   the canonical app origin. On staging that entry is a per-deployment Vercel
   URL that no longer exists, so the user gets Vercel's
   `404 DEPLOYMENT_NOT_FOUND`. A CORS allowlist is the wrong source for a
   redirect base; this unit stops deriving one at all.
2. **`navigate()` cannot follow an absolute `next`.** `LoginPage.jsx:30` and
   `:39` call react-router's `navigate(nextUrl)` with an absolute cross-origin
   URL. The app uses `BrowserRouter` (`main.jsx:13`), so this goes through
   `useNavigateUnstable` -> `resolveTo`, which parses the absolute URL as a
   RELATIVE PATH. Verified by executing react-router's own resolver:
   `resolvePath("https://workout-db-staging.onrender.com/ai/connector/login?external_auth_id=X", "/login")`
   returns pathname `/login/https:/workout-db-staging.onrender.com/ai/connector/login`.
   That matches `App.jsx`'s `<Route path="*">` and silently redirects to `/`.
3. **The session cookie is invisible to the API-origin Login URI.** The session
   cookie is serialized with `Partitioned` (`app.js:161-168`; express-session
   1.19.0 + cookie 0.7.2 do emit it - verified by serializing the real config,
   which yields `HttpOnly; Secure; Partitioned; SameSite=None`). CHIPS keys the
   cookie to the TOP-LEVEL site. It is set while the top-level site is the
   Vercel client; WorkOS sends the browser top-level to the API origin, a
   DIFFERENT partition, so the cookie is not sent and `req.authUserId` is
   always falsy there. Fixing 1 and 2 alone would produce an INFINITE LOGIN
   LOOP. This is why the route must live on the client origin, where the XHR
   runs in the partition that owns the cookie.

FILES TO TOUCH:
- `client/src/pages/ConnectorLoginPage.jsx`   (NEW - the Login URI route)
- `client/src/App.jsx`                         (register the new route)
- `client/src/api/aiApi.js`                    (new API function)
- `client/src/pages/LoginPage.jsx`             (`next` handling hardening)
- `server/src/controllers/connectorAuthController.js` (replace browser flow
                                                  with a JSON endpoint)
- `server/src/routes/aiRoutes.js`              (route swap)
- `server/src/lib/connectorAuthorize.js`       (NEW - pure decision helper)
- `server/test/lib/connectorAuthorize.test.js` (NEW - unit tests)
Do NOT modify anything outside these files.

CHANGE:

**1. New pure helper `server/src/lib/connectorAuthorize.js`.** Follow the
shape and purity discipline of `server/src/ai/rateLimitKeys.js` and AI1's
`connectorAccess` in `server/src/ai/consent.js` - property reads only, no
Prisma, no `process.env`, no response handling, so `npm run test:unit` can load
it. Export `connectorAuthorizeDecision({ authUserId, externalAuthId, access })`
returning a plain object `{ ok: boolean, reason: string | null }` where `reason`
is one of `"unauthenticated"`, `"missing_external_auth_id"`,
`"consent_required"`, or `null` when `ok` is true. Blank/whitespace-only
`externalAuthId` counts as missing. Precedence: missing id is reported BEFORE
consent (a malformed request is not a consent problem). Do not duplicate the
consent decision - the caller passes AI1's `connectorAccess(...)` result in as
`access`.

**2. `server/src/controllers/connectorAuthController.js` - replace the browser
flow with a JSON endpoint.** Delete `connectorLogin`, `getClientOrigin`, and
`currentRequestUrl` entirely; the server no longer builds any client URL, and
`CLIENT_ORIGIN` goes back to being only a CORS allowlist. Export
`connectorAuthorize(req, res)` instead:

- reads `external_auth_id` from the JSON body (`req.body`), not the query
- loads the user exactly as the current handler does (same `select`), and calls
  `connectorAccess(...)` exactly as it does now - keep AI1's contract, do not
  re-derive it
- calls `connectorAuthorizeDecision(...)` for the branch, then:
  - `ok` -> call the EXISTING `completeConnectorAuthorization` unchanged and
    respond `200 { redirectUri }`
  - `"missing_external_auth_id"` -> `400 { error: "missing_external_auth_id" }`
  - `"consent_required"` -> `403 { error: "consent_required" }`
- if `completeConnectorAuthorization` THROWS, respond
  `409 { error: "authorization_expired" }` and log server-side. This is a
  deliberate contract change from the current 500: WorkOS documents that an
  invalid `external_auth_id` makes the completion call fail, and RECON-R1
  found their guidance is to handle it gracefully rather than error. This
  matters more after this unit than before it, because the flow can now
  include a login detour. Never leak the WorkOS response body to the client -
  the current handler's discipline on that is correct, keep it.

**3. `server/src/routes/aiRoutes.js`.** Remove
`router.get("/connector/login", connectorLogin)`. Add
`router.post("/connector/authorize", authRequired, connectorAuthorize)`. It
MUST carry `authRequired` (unlike the old route, whose unauthenticated case was
the normal one) - the client route handles the signed-out case before it ever
calls this. `attachAuthUser` mounts at `app.js:173`, before routes at `:218`,
so identity is present.

**4. `client/src/api/aiApi.js`.** Add
`authorizeConnector(externalAuthId)` -> `http("/ai/connector/authorize", {
method: "POST", body: { external_auth_id: externalAuthId } })`, matching the
existing one-line style of `grantAiConsent` / `revokeAiConsent` in that file.

**5. NEW `client/src/pages/ConnectorLoginPage.jsx`.** This is the Login URI.
Read `external_auth_id` with `useSearchParams()`. Behaviour:

- **No/blank id** -> a short human message that the link is incomplete, plus a
  link back to `/`. User-facing copy, not a JSON blob or a raw error.
- **Signed out** (no `currentUser` from `useAuth()`, matching how
  `ProtectedRoute.jsx` reads auth) -> redirect to
  `/login?next=<RELATIVE path back to this route with the id preserved>`.
  The `next` value MUST be a relative path (`/connector/login?...`), never an
  absolute URL - that is defect 2 and the whole reason this route exists.
- **Signed in** -> call `authorizeConnector(...)` once, then leave the SPA with
  `window.location.assign(redirectUri)`. Do NOT use react-router `navigate()`
  for this - the target is a WorkOS origin and `navigate()` cannot leave the
  app (defect 2). Guard against double-submitting in React 18 StrictMode, the
  way existing pages guard effects (see the `cancelled` flag pattern in
  `AiConnectorPage.jsx:43-61`).
- **403 `consent_required`** -> send the user to `/profile/ai`, where the
  toggle is. This preserves AI4's ruling that a consent-blocked user is routed
  to the fix, not shown an error.
- **409 `authorization_expired`** -> a short human message saying the
  connection link expired and to start again from their AI assistant, plus a
  link back to `/`. This is the visible half of the unknown documented in
  RECON-R1: WorkOS does not publish an `external_auth_id` TTL, so this path
  must be graceful rather than a crash.
- **Any other failure** -> reuse `ErrorMessage` as the rest of the app does.

Use existing layout/classes; introduce no new CSS and no hardcoded colours
(the tokens-only rule in AGENTS.md). This page is transient - restraint over
decoration.

**6. `client/src/App.jsx`.** Register `/connector/login` ->
`ConnectorLoginPage`. It MUST NOT be wrapped in `<ProtectedRoute>` - it has to
render for signed-out users so it can perform its own redirect with the
`external_auth_id` preserved. A `ProtectedRoute` wrapper would drop the id.
Place it alongside the ungated `/login` and `/register` routes; whether it sits
under `AuthLayout` is your call - match whatever renders cleanly.

**7. `client/src/pages/LoginPage.jsx` - harden `next`.** Two changes:
   a. Remove the `decodeURIComponent(raw)` at `:14-18`. `useSearchParams().get()`
      has ALREADY decoded once; the second decode is a latent double-decode bug.
   b. Reject absolute URLs: if the `next` value does not start with a single
      `/`, or starts with `//`, fall back to `"/"`. After this unit nothing
      legitimately passes an absolute `next`, and this closes the redirect
      surface rather than leaving it to react-router's parsing accident.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (report the verbatim suite/test
  counts; the pre-unit baseline is 242 tests in 21 suites).
- New tests in `server/test/lib/connectorAuthorize.test.js` cover, with these
  exact input -> output pairs:
  - `{ authUserId: "u1", externalAuthId: "01ABC", access: { allowed: true } }`
    -> `{ ok: true, reason: null }`
  - `{ authUserId: "u1", externalAuthId: "   ", access: { allowed: true } }`
    -> `{ ok: false, reason: "missing_external_auth_id" }`
  - `{ authUserId: "u1", externalAuthId: "", access: { allowed: false } }`
    -> `{ ok: false, reason: "missing_external_auth_id" }`  (missing beats
    consent - the precedence rule above)
  - `{ authUserId: "u1", externalAuthId: "01ABC", access: { allowed: false } }`
    -> `{ ok: false, reason: "consent_required" }`
  - `{ authUserId: null, externalAuthId: "01ABC", access: { allowed: true } }`
    -> `{ ok: false, reason: "unauthenticated" }`
- Client `npm run build` compiles with no errors from `client/`.
- `node -e "require('./src/app.js')"` from `server/` exits 0 with a localhost
  `DATABASE_URL` (this is the only lane that loads the route table).
- `grep -rn "getClientOrigin\|currentRequestUrl" server/src` returns NO matches.
- `grep -rn "connector/login" server/src` returns NO matches (the server-side
  browser route is gone).
- `grep -rn "decodeURIComponent" client/src/pages/LoginPage.jsx` returns NO
  matches.
- `node scripts/check-hex.mjs` passes (tokens-only tripwire) if the script
  exists on this branch.
- State explicitly in DELIVERY.md that NO lane exercises the real WorkOS
  handshake, the browser redirect chain, or a real `external_auth_id`. Green
  lanes here are NOT evidence the flow works - only Seth's staging smoke is.
  Do not mock WorkOS to manufacture a green claim.

NOT IN SCOPE (do not do these):
- Do NOT touch `client/vercel.json` - its catch-all rewrite already makes
  `/connector/login` deep-link correctly (verified).
- Do NOT change the session cookie config in `app.js`. `Partitioned` is
  load-bearing for the Vercel -> Render split under third-party-cookie
  deprecation; removing it would trade a broken connector for a broken app.
- Do NOT change `CLIENT_ORIGIN` handling in `app.js` CORS - the allowlist and
  the `workout-*.vercel.app` preview matcher are correct and stay.
- Do NOT touch the `/mcp` surface, `connectorAuth`, or the rate limiters.

HUMAN CHECKLIST (Seth - not Cursor; this unit is inert until these are done):
1. In the WorkOS dashboard (Connect -> Configuration, labelled "External
   Sign-in URI" per `docs/specs/workos-staging-handoff.md`), repoint the Login
   URI from `https://workout-db-staging.onrender.com/ai/connector/login` to
   `https://<staging client origin>/connector/login`. One Login URI per
   environment, so staging and prod are set separately.
2. Optional but recommended: clear the dead per-deployment Vercel URL out of
   `CLIENT_ORIGIN` on the staging Render service. It is inert after this unit
   (nothing derives a redirect from it any more), but it is a live trap for the
   next thing that reads it.

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
