# DELIVERY — AI0-RECON: OAuth delegation options for the MCP connector

**Mode:** REPORT-ONLY (zero repository code changes)
**Access date for all web sources below:** 2026-08-02
**Files touched:** `DELIVERY.md` only

---

## Central question (answer first)

Vendors that **can** act as an OAuth 2.1 authorization server while LogChamp **keeps** its own user table and cookie login (layer-over / BYOA / Standalone / Connected Apps):

| Fits the pattern | Does not (for LogChamp’s ruling) |
| --- | --- |
| WorkOS Standalone Connect | Clerk (OAuth AS assumes Clerk users) |
| Stytch Connected Apps + Trusted Auth Tokens | Auth0/Okta as primary IdP (migration or Enterprise Custom DB) |
| Descope MCP Auth BYOA | Logto (no DCR; Logto-as-IdP) |
| Scalekit MCP Auth BYOA *(extra candidate)* | |
| Ory Hydra (headless AS; login app is yours) | |
| Keycloak *(partial — federation / custom auth, not cookie-assert)* | |

**Fallback:** build a minimal authorization server in Express over the existing session cookie (sized below).

---

## Vendor comparison table

Each row answers the five required fields.

### 1. WorkOS (AuthKit Connect / Standalone)

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Yes.** [Standalone Connect](https://workos.com/docs/authkit/connect/standalone) and [Standalone MCP Auth](https://workos.com/docs/authkit/mcp#standalone-mcp-auth): AuthKit redirects to your Login URI; your app authenticates with the existing stack; you POST user identity to AuthKit’s completion API; AuthKit does consent + token issuance. Marketing: “no migration necessary” ([workos.com/mcp](https://workos.com/mcp)). |
| **2. DCR (RFC 7591)?** | **Yes.** AuthKit metadata exposes `registration_endpoint` (`/oauth2/register`). Dashboard can enable **DCR** for clients that lack CIMD, and **CIMD** (preferred in current MCP spec). ([MCP guide](https://workos.com/docs/authkit/mcp)) |
| **3. Free tier / first paid** | AuthKit: **first 1M MAUs free**; then **$2,500/mo per additional 1M**. Staging free. Custom domain **$99/mo** (optional). SSO/Directory Sync are separate per-connection products (not required for this use). ([workos.com/pricing](https://workos.com/pricing)). Free tier does **not** appear to exclude Standalone Connect or DCR/CIMD toggles (documented as dashboard config on Connect). |
| **4. What LogChamp still builds** | Login URI handler (`external_auth_id` → session check → complete API → redirect); `/.well-known/oauth-protected-resource`; Bearer middleware verifying AuthKit JWKS + `aud`; optional AS-metadata proxy for old clients; WorkOS dashboard: Resource Indicator = MCP URL, enable CIMD (+ DCR for legacy clients). |
| **5. In app-login path?** | **No.** Normal LogChamp cookie login unchanged. WorkOS outage breaks **connector OAuth only**, not app login. |

### 2. Stytch (Connected Apps)

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Yes.** [Integrate with existing system](https://stytch.com/docs/connected-apps/guides/integrate-with-existing-system): “without migrating your entire authentication system”; Trusted Auth Tokens + Stytch consent UI; Stytch issues OAuth tokens. Launch note 2025-09-09 confirms Connected Apps for existing stacks ([stytch.launchnotes.io](https://stytch.launchnotes.io/announcements/ann_ong9oqgNipSzx)). |
| **2. DCR?** | **Yes.** Dashboard-enableable DCR; RFC 7591 / OIDC DCR endpoints documented for B2B and Consumer ([client types](https://stytch.com/docs/connected-apps/oauth-learn-more/client-types), [DCR API](https://stytch.com/docs/api-reference/b2b/api/connected-apps/application-management/dynamic-client-registration)). Also CIMD (beta called out in same docs). |
| **3. Free tier / first paid** | Connected Apps billed as **MAUs**; **first 10,000 MAUs / AI agents free** ([Connected Apps](https://stytch.com/connected-apps/), [pricing](https://stytch.com/pricing?vertical=B2B)). Pay-as-you-go beyond that; SSO/SCIM **$125/connection** after 5 free. **Exact per-MAU overage dollar rate:** UNCONFIRMED from static pricing page (calculator-driven; page says “rates outlined above” without a fixed MAU unit price in the fetched HTML). Free tier includes Connected Apps / DCR per product copy — **not** gated off free. |
| **4. What LogChamp still builds** | Trusted Auth Token profile; Authorization URL page hosting Stytch `OAuthAuthorize` / IdentityProvider component; JWT (or keypair) handshake. **Friction:** Stytch docs require a JWT `access_token`/`id_token` **with an `email` claim**. LogChamp’s current JWT (`server/src/lib/jwt.js`) signs only `{ sub: userId }` — would need a connector-scoped JWT (or keypair path) plus email lookup. Then: PRM endpoint, Stytch access-token verify, scopes. |
| **5. In app-login path?** | **No** for normal login (Connected Apps standalone path). Stytch outage affects connector OAuth / consent, not cookie sessions. |

### 3. Clerk

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **No** (for the AS pattern required here). Clerk MCP guides assume **Clerk as the authorization server and user store** ([build MCP server](https://clerk.com/docs/expressjs/guides/ai/mcp/build-mcp-server), [how Clerk implements OAuth](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth)). `@clerk/mcp-tools` “custom auth” is **resource-server token verification**, not “assert LogChamp session → Clerk mints OAuth.” No documented Standalone/BYOA equivalent found. |
| **2. DCR?** | **Yes** (when using Clerk as AS). Dashboard toggle / Backend API `dynamic_oauth_client_registration` ([connect MCP client](https://clerk.com/docs/guides/ai/mcp/connect-mcp-client)). |
| **3. Free tier / first paid** | Hobby: **up to 50,000 MRU** free; Pro from **$25/mo** ([Clerk pricing explained](https://clerk.com/articles/clerk-pricing-explained), cites [clerk.com/pricing](https://clerk.com/pricing)). OAuth/DCR available; **irrelevant** if pattern (1) fails. |
| **4. What LogChamp would still build** | Full user migration or dual identity into Clerk; then MCP helpers + PRM. |
| **5. In app-login path?** | **Yes if adopted as IdP** — Clerk outage / dependency would sit on identity. Violates Seth’s Aug 2 ruling. |

### 4. Auth0 / Okta

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **No** for LogChamp’s ruling without paid migration mechanics. [Auth for MCP](https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/) / [why auth for MCP](https://auth0.com/ai/docs/mcp/intro/why-auth-for-mcp): users authenticate **with Auth0**; Auth0 is the AS. [Custom Database](https://auth0.com/docs/authenticate/database-connections/custom-db/overview-custom-db-connections) (own user store) is plan-gated (“Auth0 plan or custom agreement affects whether this feature is available”); community + docs historically place Custom DB on **Enterprise**, not Free ([Auth0 Community](https://community.auth0.com/t/can-i-use-a-personal-db-with-the-free-tier-account/70948)). That is “Auth0 in front of your DB,” not “mint tokens over an already-authenticated LogChamp cookie.” |
| **2. DCR?** | **Yes.** Enable OIDC Dynamic Application Registration; `POST /oidc/register` ([docs](https://auth0.com/docs/get-started/applications/dynamic-client-registration)). Auth0 also pushes CIMD for production MCP. |
| **3. Free tier / first paid** | Free: **25,000 MAUs** ([auth0.com/pricing.md](https://auth0.com/pricing.md)). First paid: B2C Essentials **$35/mo** at 500 MAUs (tier ladder). **Custom DB / true BYOA: UNCONFIRMED on Free** — treat as excluded from Free. |
| **4. What LogChamp still builds** | If forced onto Auth0-as-IdP: user migration or Enterprise Custom DB scripts; enable DCR + resource indicators; PRM; token validation. |
| **5. In app-login path?** | **Yes** for connector auth (Auth0 login UI). If app login also moved to Auth0, **Auth0 outage blocks the whole app** — exactly the SPOF Seth ruled out. |

### 5. Descope (Agentic Identity / MCP Auth)

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Yes.** [MCP Auth FAQ / BYOA](https://www.descope.com/mcp-auth): keep existing IdP; Descope is OAuth AS for MCP. Homegrown path: Generic HTTP Connector validates session/credentials in consent flow, then Descope issues JWT. |
| **2. DCR?** | **Yes.** Product claims DCR + CIMD ([mcp-auth](https://www.descope.com/mcp-auth), [DCR hardening post](https://www.descope.com/blog/post/dcr-hardening-mcp)). |
| **3. Free tier / first paid** | Free Forever: **7,500 MAUs**, **2,000 Monthly Active Consents (MACs)** (MCP/Inbound Apps meter), 2,000 MATKs, 10k M2M exchanges. First paid: **Pro $249/mo** (10k MAUs, 5k MACs). ([descope.com/pricing](https://www.descope.com/pricing)). Free includes MCP-relevant MAC quota — not excluded — but **hard cap** (upgrade required to exceed; grace then possible loss of access). |
| **4. What LogChamp still builds** | Consent-flow connector to validate LogChamp session; Descope project/flows; PRM; JWT validation; scope mapping for read-only tools. |
| **5. In app-login path?** | **No** if BYOA only for MCP. Descope outage → connector consent/tokens fail; cookie login unaffected. |

### 6. Logto

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **No** for connector-only layering. Third-party apps use **Logto as IdP** ([third-party apps](https://docs.logto.io/integrate-logto/third-party-applications)). Would migrate connector identity into Logto. |
| **2. DCR?** | **No** (current). MCP Auth provider guide: “Logto does not support Dynamic Client Registration yet” — manual client registration only ([mcp-auth.dev Logto guide](https://mcp-auth.dev/docs/provider-guides/logto)). Logto’s own DCR blog is educational, not a product claim of support ([blog](https://blog.logto.io/dynamic-client-registration-oauth-guide)). |
| **3. Free tier / first paid** | Free: **50k MAU**, 50k tokens; Pro from **$24/mo**. Third-party OAuth apps: **$8/app/mo** on Pro ([logto.io/pricing](https://logto.io/pricing), [billing docs](https://docs.logto.io/logto-cloud/billing-and-pricing)). Free excludes third-party apps (Pro add-on). |
| **4. What LogChamp still builds** | N/A if disqualified; otherwise full Logto IdP adoption + manual client IDs per MCP host. |
| **5. In app-login path?** | Would be **Yes** if Logto became IdP. |

### 7. Keycloak

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Partial / UNCONFIRMED for cookie-assert.** Keycloak is a full IdP. You can federate an existing user store or build custom authenticators; there is **no** first-class “complete OAuth with already-authenticated LogChamp session” API like WorkOS/Scalekit. Closest fit: run Keycloak **only** for MCP OAuth and point federation at LogChamp’s DB — still Keycloak-owned login UI for the connector flow. |
| **2. DCR?** | **Yes.** OIDC/OAuth DCR supported ([client registration](https://www.keycloak.org/securing-apps/client-registration)); MCP guide documents DCR + experimental CIMD ([MCP authz server](https://www.keycloak.org/securing-apps/mcp-authz-server)). Anonymous DCR needs Client Registration Policies (trusted hosts / CORS). |
| **3. Free tier / first paid** | **OSS: $0** (self-host). No MAU meter. Cost is ops (HA Postgres, upgrades, hardening). Red Hat build / support: commercial (out of scope; UNCONFIRMED pricing here). |
| **4. What LogChamp still builds** | Deploy/operate Keycloak; realm + DCR policies; login theme or federation; PRM on MCP server; token validation. **Gap:** Keycloak MCP matrix lists **Resource Indicators (RFC 8707) = Not supported** ([same MCP page](https://www.keycloak.org/securing-apps/mcp-authz-server)) — MCP clients **MUST** send `resource`; servers must audience-bind. Workarounds UNCONFIRMED. |
| **5. In app-login path?** | **No** if app login stays on LogChamp cookies and Keycloak is MCP-only. Keycloak outage still blocks connector OAuth. Users **do** authenticate at Keycloak during connect. |

### 8. Ory (Hydra)

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Yes (by design).** Hydra has **no user store**; authentication is a login/consent app you write that talks to Hydra’s headless APIs ([ory.com/hydra](https://www.ory.com/hydra), [github.com/ory/hydra](https://github.com/ory/hydra)). Ideal architectural match for “keep LogChamp users.” |
| **2. DCR?** | **Yes.** OpenID Dynamic Client Registration; enable via config / Ory Console ([oauth2-clients guide](https://www.ory.com/docs/hydra/guides/oauth2-clients)). Available on Ory Network when enabled ([Terraform provider note](https://registry.terraform.io/providers/ory/orynetwork/latest/docs/resources/orynetwork_oidc_dynamic_client)). |
| **3. Free tier / first paid** | Self-host OSS: **$0**. Ory Network: **Developer free** (PoC); first production plan **Production $770/year** ([ory.com/pricing](https://ory.com/pricing)). |
| **4. What LogChamp still builds** | Login + consent app (session cookie → accept login/consent challenges); Hydra deploy or Network project; DCR enablement; PRM; token introspection/JWT validation; PKCE/resource indicator config. More surface than WorkOS/Scalekit completion APIs. |
| **5. In app-login path?** | **No.** App login stays LogChamp. Hydra/Network outage → connector OAuth only. |

### Extra candidate: Scalekit (MCP Auth)

| # | Finding |
| --- | --- |
| **1. Layer-over existing auth?** | **Yes.** Explicit [Bring Your Own Auth](https://docs.scalekit.com/mcp/auth-methods/custom-auth/): Scalekit redirects to your login; you POST `sub`/`email` after session auth; Scalekit completes consent/tokens. |
| **2. DCR?** | **Yes** (plus CIMD) ([MCP overview](https://docs.scalekit.com/authenticate/mcp/overview/), [mcp-auth product](https://www.scalekit.com/mcp-auth)). |
| **3. Free tier / first paid** | SaaSKit Scale: **$0** with **1M MAUs**, then **$0.05/MAU**; MCP Auth billed after included MAU free tier ([pricing](https://www.scalekit.com/auth-for-saas-pricing)). Dev environments free. |
| **4. What LogChamp still builds** | Login endpoint for `login_request_id`/`state`; backend `updateLoginUserDetails`; redirect to partner callback; PRM; Scalekit JWT validation. |
| **5. In app-login path?** | **No.** |

---

## DISQUALIFICATIONS (explicit)

| Vendor | Reason |
| --- | --- |
| **Clerk** | No documented layer-over AS pattern; adopting Clerk OAuth means Clerk owns users → user migration / IdP SPOF. |
| **Auth0 / Okta** | Auth for MCP treats Auth0 as the login IdP; Custom DB (own store) is not Free-tier; fails zero-migration + not-in-login-path ruling for LogChamp. |
| **Logto** | **No DCR** (hard requirement in this task / `ai-layer.md` §4.2). Also IdP-centric third-party apps. |
| **Keycloak** *(soft)* | DCR exists, but **RFC 8707 Resource Indicators unsupported** per Keycloak’s own MCP matrix — risky for MCP audience binding. Heavy ops. Not a clean cookie-assert BYOA. Treat as **disqualified for managed-delegate shortlist** unless Resource Indicators land. |

---

## MCP authorization specification (current, sourced)

**Primary source:** [MCP Authorization — 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) (accessed 2026-08-02).

### Roles

| Role | Who | Duty |
| --- | --- | --- |
| **Resource server** | LogChamp MCP HTTP endpoint | Accept Bearer tokens; reject with `401` + discovery hints |
| **Authorization server** | Vendor AS **or** self-built AS | User auth (or delegated), consent, codes, tokens, refresh, client registration |
| **Client** | Claude / ChatGPT / other MCP hosts | DCR or CIMD, PKCE, token use |

### What the **MCP server (LogChamp)** must implement

- **MUST** implement **Protected Resource Metadata (RFC 9728)** — e.g. `/.well-known/oauth-protected-resource` with `authorization_servers`, `resource`, scopes.
- **MUST** return **`401`** with **`WWW-Authenticate`** including `resource_metadata=...` (and SHOULD include `scope=`).
- Validate access tokens (signature/introspection), enforce **audience / resource binding**, enforce scopes (read-only for v1).
- Optional compatibility: proxy `/.well-known/oauth-authorization-server` to the real AS for older clients (WorkOS docs show this pattern).

### What the **authorization server** supplies

- **MUST** implement **OAuth 2.1** with PKCE for public clients (`S256`).
- **MUST** expose discovery: **RFC 8414** and/or **OIDC Discovery**.
- **SHOULD** support **Client ID Metadata Documents (CIMD)** — now the preferred registration mechanism for strangers.
- **MAY** support **DCR (RFC 7591)** — demoted to optional/back-compat in the 2025-11-25 spec (clients should prefer CIMD, then DCR, then pre-registration).
- Token endpoint, authorize endpoint, refresh, revocation/introspection as configured; consent UX.

### Spec vs this task’s hard DCR requirement

`ai-layer.md` §4.2 and this recon treat **DCR as hard** for remote connectors (Claude/ChatGPT interoperability). The **spec itself** now says DCR is **MAY** and CIMD is **SHOULD**. Practical implication: prefer an AS with **both CIMD and DCR** (WorkOS, Stytch, Descope, Scalekit, Hydra, Keycloak) so current *and* lagging clients work. Vendors with **only** CIMD and no DCR would fail this task’s criterion even if they match the latest spec letter.

### Fallback build size (what you avoid buying)

If LogChamp is the AS, it must also supply: authorize + token (+ refresh) + PKCE + discovery metadata + registration (DCR and/or CIMD) + consent UI + client store + token store/JWKS — on top of the MCP resource-server pieces above.

---

## FALLBACK SIZING — minimal Express authorization server

**Goal:** authorization-code + PKCE over **existing session cookie**; read-only scopes; short-lived tokens; one public-client class; no general-purpose IdP.

### Required endpoints / surfaces

| Surface | Purpose |
| --- | --- |
| `GET /.well-known/oauth-protected-resource` | RFC 9728 (on MCP host) |
| `GET /.well-known/oauth-authorization-server` (and/or OIDC discovery) | RFC 8414 |
| `POST /oauth/register` | RFC 7591 DCR (and/or CIMD fetch support) |
| `GET /oauth/authorize` | Auth code + PKCE; if `workoutdb.sid` present, skip login; else redirect to existing login and return |
| Consent page (first-party) | Approve read-only scopes for named client |
| `POST /oauth/token` | code→token, refresh; PKCE verify |
| `POST /oauth/revoke` and/or short TTL | Revocation / expiry |
| JWKS or introspection | MCP resource server validates tokens |
| Persistence | clients, auth codes, refresh tokens, consents (Prisma tables) |

**Not in scope for minimal:** full OIDC UserInfo, social login, multi-tenant admin, write scopes, general app SSO.

### Node / Express libraries (maintenance status, accessed 2026-08-02)

| Library | Role | Last release (npm `time.modified`) | Weekly downloads (npm API, week ending 2026-08-01) |
| --- | --- | --- | --- |
| [`oidc-provider`](https://www.npmjs.com/package/oidc-provider) (panva) | Full OAuth 2 / OIDC AS; mounts on Express; PKCE, DCR, discovery | **2026-07-27** — v9.11.1 | **616,358** |
| [`@node-oauth/oauth2-server`](https://www.npmjs.com/package/@node-oauth/oauth2-server) | OAuth2 server core (model you implement) | **2026-08-02** — v5.3.0 | **200,441** |
| [`oauth2orize`](https://www.npmjs.com/package/oauth2orize) | Toolkit / middleware style | **2023-10-13** — v1.12.0 (stale) | **152,593** |

**Recommendation if building:** `oidc-provider` — actively maintained, Express-mountable, covers discovery/PKCE/DCR with far less hand-rolled crypto than oauth2orize. Still requires: Adapter for Prisma storage, login/consent integration with LogChamp session, resource-indicator/`aud` policy, threat model for open DCR, and ongoing spec chase (CIMD). Order-of-magnitude: **multi-day to multi-week** security-sensitive work (fits AI2 RED / frontier review), not a weekend glue job.

---

## RANKED recommendation

**Ranking criterion (as specified):**  
(a) zero migration of existing users → (b) not in the app-login path → (c) free at LogChamp’s scale → (d) DCR supported → (e) least code authored here.

| Rank | Option | Why |
| --- | --- | --- |
| **1** | **WorkOS Standalone Connect** | Exact cookie/session → complete-API pattern; DCR **and** CIMD; **1M MAUs free**; not on app login; smallest glue (Login URI + JWKS + PRM). |
| **2** | **Scalekit MCP Auth BYOA** | Same architectural fit; DCR+CIMD; **1M MAUs free** then $0.05; slightly less “household name” than WorkOS but docs are MCP-native. |
| **3** | **Stytch Connected Apps** | Solid BYOA + DCR; **10k free** (enough early); needs Trusted Auth Token with **email** (LogChamp JWT today has only `sub`) → more glue than #1/#2. |
| **4** | **Descope BYOA** | Real BYOA + DCR; Free **2k MACs** fine at tiny scale; first paid cliff **$249/mo** is worse than WorkOS/Scalekit free envelopes. |
| **5** | **Ory Hydra (self-host or Network)** | Perfect AS/login separation; DCR yes; more **code + ops** (login/consent app, infra). Network Production **$770/yr** if not self-hosting. |
| **6** | **Self-build (`oidc-provider`)** | Meets (a)(b)(d) with max control; fails (e) badly; ongoing MCP-spec maintenance. Keep as exit ramp if vendors misbehave. |
| — | Clerk / Auth0 / Logto / Keycloak | Disqualified or soft-disqualified above. |

### Bottom line for AI0

**Purchasable.** The layer-over shape Seth ruled is sold today by **WorkOS, Scalekit, Stytch, Descope**, and is the native model of **Ory Hydra**. At LogChamp’s scale and with least new code, **delegate to WorkOS Standalone Connect** (Scalekit close second). Prefer a vendor with **both CIMD and DCR**. Do **not** migrate login to Clerk/Auth0/Logto for this lane.

---

## Acceptance criteria evidence

| Criterion | Evidence |
| --- | --- |
| `git status --porcelain` empty except DELIVERY.md | See shell check below (run at end of lane). |
| Table covering all eight named vendors with five fields | Sections 1–8 above (+ Scalekit extra). |
| Every vendor claim has URL + access date | URLs inline; access date **2026-08-02** at top. |
| Explicit disqualifications | “DISQUALIFICATIONS” section. |
| Ranked recommendation + criterion | “RANKED recommendation” section. |
| No repo code changes / no git ops | Report-only; no commit. |

## Deviations

- Added **Scalekit** as an extra candidate (plainly fits BYOA + MCP + DCR); not one of the eight named, but required by “Add any others that plainly fit.”
- MCP spec now marks DCR as **MAY** (CIMD preferred); report notes that while still treating DCR as hard per this task/`ai-layer.md`.
- Stytch exact MAU overage **$/MAU**: UNCONFIRMED from static pricing HTML.
- Auth0 Custom DB tier gating: UNCONFIRMED as of 2026 on Free beyond historical community + “plan affects availability” docs — treated as not Free.

## Test / lane output

Report-only lane: no `test:unit` / client build required by FILES TO TOUCH (none).

Verbatim `git status --porcelain --untracked-files=all` (empty = no tracked/untracked edits; `DELIVERY.md` is gitignored per `.gitignore:48`):

```
```

Verbatim `git status --porcelain --ignored` (shows ignored delivery report only):

```
!! DELIVERY.md
```

Verbatim `git check-ignore -v DELIVERY.md`:

```
.gitignore:48:/DELIVERY.md	DELIVERY.md
```

Working tree otherwise clean (`nothing to commit, working tree clean`). No commits, no pushes, no other files modified.
