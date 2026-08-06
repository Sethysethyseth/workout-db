# Spec: AI layer (connector-first, in-app second)

*Authored July 29, 2026 (Opus frontier seat) from Seth's AI-chatbot brainstorm.
Supersedes `analytics-engine.md` section 8 as the AI design of record; that
section is amended to point here. Track C in the analytics roadmap now means
"this spec."*

## 1. What this is

LogChamp gains an AI layer that answers questions about the user's own
training. It has TWO surfaces, built in this order:

- **Lane A - remote MCP connector.** LogChamp exposes a remote MCP server. The
  user adds it inside the AI app they ALREADY pay for (Claude, ChatGPT) and
  asks their assistant about their training. Their subscription pays for
  inference; LogChamp pays zero tokens.
- **Lane B - in-app chat.** A coach panel inside LogChamp. Two key sources over
  one code path: the user's own API key (BYO), or LogChamp's key on a paid
  tier.

Decided with Seth July 29, 2026: **both surfaces, connector first**; **free at
launch with the entitlement gate designed in**; theming lives in a separate
spec (`ai-theming.md`).

## 2. Hard boundary (inherited, non-negotiable)

**The deterministic engine computes EVERY number. The AI never computes a
stat.** The model receives the computed summary object plus a question and
returns narrative. Prompts feed the summary (`analytics-engine.md` section 6),
never a raw set dump - better answers, fewer tokens, less data exposure, and it
forces the model to cite our honest numbers.

This holds identically on both lanes. On Lane A it is enforced by what the MCP
tools return; on Lane B by what the proxy puts in the prompt. An MCP tool that
returned raw sets and let the model do arithmetic would break the contract
silently, so tool outputs are summary-shaped by construction.

Corollary that matters for trust: the coverage and honesty metadata travel WITH
the numbers. `meta.effortCoverage` and `meta.honestyNotes` are part of every
payload the model sees, so it can say "on 40% effort coverage this is a weak
read" instead of asserting a confident wrong thing.

## 3. Two premises that changed in 2026 (read before redesigning)

- **Consumer-subscription OAuth in third-party apps is a ToS violation, not
  just unavailable.** Anthropic began blocking third-party consumer-plan OAuth
  in January 2026 and clarified the docs on February 19, 2026; the later
  partial reinstatement meters third-party calls against a separate prepaid
  "extra usage credits" balance - paid usage, not free subscription quota.
  So "let the user log in with Claude Pro and spend their quota" is closed.
  `analytics-engine.md`'s original correction was right and now has
  enforcement behind it.
- **The sanctioned path is to invert the direction.** Remote MCP connectors
  with OAuth 2.1 are supported on Claude Pro/Max/Team/Enterprise and ChatGPT
  Plus/Pro. Instead of LogChamp spending the user's subscription, the user's
  subscription comes to LogChamp. This is the faithful version of the
  zero-cost idea, and it is Lane A.

**Ruled permanently out of scope: DoD/`.mil`-sourced credentials.** GenAI.mil,
NIPRGPT, CamoGPT, and Ask Sage's CDAO contract are real and Ask Sage exposes an
API, but 5 CFR 2635.704 limits government property to authorized purposes and
de minimis personal use does not cover commercial activity; the credentials are
unit-furnished, and civilian users' workout data would transit a government
enclave. Do not design against this and do not revisit it. Free prototyping
uses ordinary free tiers (Cerebras, Groq, Gemini Flash, OpenRouter free
models).

## 4. Lane A - remote MCP server

### 4.0 CORRECTIONS, August 4, 2026 - read before implementing anything below

Three parallel Cursor recon lanes (AIR1 server now-state, AIR2 client now-state,
AIR3 MCP + WorkOS research) checked this section against the tree and against
current published documentation. **Five things below this line are wrong or
stale.** They are corrected here rather than rewritten in place so the drift is
visible; where this subsection and the text below disagree, THIS subsection
wins.

1. **There is no `/api` prefix.** Routers mount at the API host root via
   `app.use("/", routes)` (`server/src/app.js:126`). The live paths are
   `/analytics/summary` and `/analytics/exercise`. Section 4.1's
   `/api/analytics/summary` has never been correct.
2. **The MCP spec has moved to revision `2026-07-28`, and we are deliberately
   NOT targeting it.** That revision changes Streamable HTTP incompatibly
   (POST-only, protocol-level sessions and the GET SSE channel removed,
   `Mcp-Method` / `Mcp-Name` headers required) and formally DEPRECATES dynamic
   client registration in favour of CIMD. But Anthropic's connector
   documentation still lists authorization-spec support only through
   `2025-11-25`. A server built to the newest spec is a server today's Claude
   cannot talk to. **Target `2025-11-25`; revisit when Anthropic's docs move.**
   This is a dated decision, not an oversight.
3. **Use `@modelcontextprotocol/sdk` (the v1 line), not `@modelcontextprotocol/
   server` (v2).** The v2 packages are ESM-only and require Node >= 20;
   `server/package.json` declares no `"type": "module"` and no `engines`, so the
   server is CommonJS. v1 is dual CJS/ESM on Node >= 18.
4. **Do NOT install `@workos-inc/node`.** Version 10.9.0 does not expose the
   OAuth completion method this design needs, and it requires Node >= 22.11,
   which this server does not declare. The completion call is a documented plain
   HTTPS POST; token verification uses `jose`.
5. **`buildExerciseDetail` returns no `meta` key**
   (`server/src/analytics/exerciseDetail.js:254-272`), so the coverage and
   honesty metadata that section 2 requires to travel WITH the numbers is absent
   on that surface. The MCP tool must attach it rather than shipping bare
   numbers - an absent caveat reads as a confident number.

**CORRECTION 6, added August 6, 2026 - "the scopes are ours" is FALSE on
Path 1.** Section 4.2 below says, in the vendor-lock-in paragraph: "the tokens
are opaque to third-party clients, **the scopes are ours**, and the user mapping
stays in our database". The middle clause is true only under **Path 2** (the
in-house authorization server). On **Path 1 - the path actually taken** - the
scope vocabulary belongs to the VENDOR. WorkOS AuthKit issues a fixed set
(`email`, `offline_access`, `openid`, `profile`) and offers no dashboard
affordance to define a custom one; verified live in the WorkOS dashboard on
August 6. The custom scope `training:read` that AI1 introduced and AI2 enforced
was therefore unissuable from the day the vendor was chosen, and it broke the
real connector handshake with `error=invalid_scope` at the first live attempt.
AI7 removes it.

**The generalisable rule, which is the point of recording this:** when a
capability is delegated to a vendor, every property the design assumed while it
was still in-house must be RE-DERIVED against that vendor's actual limits, not
inherited. A pivot in who provides a capability invalidates the premises that
were true only because we provided it. The lock-in paragraph was arguing
reversibility and reached for properties that made the argument work; nothing
downstream re-checked them.

**Corollary about verification seams.** AI2's swappable token verifier let the
chain be exercised end to end before the vendor existed - genuinely valuable,
and it produced the wave's 26/26 live run. But a seam that STANDS IN for a
vendor cannot test that vendor's constraints, and the green result read as
broader coverage than it was. Any seam of this shape must carry an explicit
written list of what it cannot prove.

One further finding that changes who this feature serves, though not what we
build: **custom connectors are available on every Claude tier including Free**
(one connector on Free), but in **ChatGPT they are limited to Business,
Enterprise, and Edu workspaces** - not available on free or personal accounts.
Section 1's "Claude, ChatGPT" framing is therefore half right. Claude is the
real target; ChatGPT support arrives free with the same server but reaches a
much narrower audience. User-facing copy must not promise otherwise.

Two operational limits worth designing against: Claude caps tool results at
roughly 150,000 characters and tool calls at a 300-second timeout, and it
connects from Anthropic's cloud rather than the user's device - so the server
must be publicly reachable over HTTPS, and `localhost` never works without a
tunnel.

Recon also confirmed the two most common real-world failure modes for remote MCP
servers, both now designed against explicitly in the AI2 task block: a `401`
whose `WWW-Authenticate` header omits `resource_metadata` (the client never
discovers where to authenticate and surfaces only "couldn't connect"), and
CORS / OPTIONS preflight failures on the discovery and MCP routes.

### 4.1 Data surface (no new plumbing)

Tools read the endpoints that already exist (paths corrected per 4.0 item 1):

- `GET /analytics/summary?from=&to=` -> `server/src/routes/
  analyticsRoutes.js:11`, built by `server/src/analytics/summary.js`. Both
  `from` and `to` are REQUIRED and the endpoint 400s without them.
- `GET /analytics/exercise` -> `server/src/routes/analyticsRoutes.js:13`, built
  by `server/src/analytics/exerciseDetail.js`. See 4.0 item 5 on its missing
  `meta`.

Proposed tools, all summary-shaped:

| Tool | Returns |
| --- | --- |
| `get_training_summary` | the summary object for a date range |
| `get_exercise_detail` | one exercise's detail (PRs, top sets, matched-effort trend, rep targets) |
| `list_exercises` | the user's roster, active-first |
| `get_recent_sessions` | session headers, not set dumps |

Each tool's description must state that the numbers are precomputed and must
not be recalculated, and must surface coverage caveats. Tool descriptions are
prompt surface - they are product copy, not incidental strings.

### 4.2 The one hard problem: auth

**The server has no OAuth today.** Auth is cookie sessions plus JWT Bearer
(`server/src/lib/jwt.js`, `server/src/middleware/attachAuthUser.js`,
`server/src/controllers/authController.js`). Remote MCP connectors require
**OAuth 2.1**, including dynamic client registration, PKCE, and a discovery
document. This is the single largest new piece of infrastructure in the entire
AI layer, and it is genuinely new work - not an adaptation of the JWT path.

#### RULED August 2, 2026 by Seth. The original A1/A2 binary was FALSE.

This subsection originally offered two options: build an authorization server
in Express (A1), or delegate to a managed identity provider (A2). Both were
framed as all-or-nothing for LogChamp's identity, and A2 was costed as
including "a migration path for existing cookie/JWT users." That framing was
wrong and is superseded. It conflated two surfaces that have different
requirements and do not have to share an answer:

- **App login** (browser -> LogChamp). Cookie sessions. Works today, users
  exist, nothing about the AI layer requires touching it.
- **Connector auth** (Claude / ChatGPT -> LogChamp API). Needs OAuth 2.1 plus a
  registration mechanism for clients we have no prior relationship with (see
  the CIMD correction below).

Only the second needs anything new. **The ruling: OAuth is layered OVER the
existing authentication, scoped to the connector only. LogChamp's login and
user table do not move, and no existing user is migrated.**

The deciding argument is not cost, it is blast radius. **An identity provider
in the app-login path is a new single point of failure for the entire product**
- their outage means nobody can open LogChamp at all. Scoped to the connector,
the same outage means the connector is down and the app is fine. That
asymmetry decides it on its own, and it holds regardless of what the vendor
research comes back with.

**What this means concretely.** The pattern to buy is the one where the vendor
acts as an authorization server for an app that keeps its own users - sold
variously as "connected apps", "OAuth provider mode", or "auth for MCP
servers". LogChamp tells the vendor "this already-authenticated session belongs
to user X"; the vendor handles client registration, consent, and token
issuance / refresh / revocation. LogChamp's server validates the resulting
token and maps it to a user. Explicitly NOT purchased: any arrangement where
the vendor becomes the identity source.

#### CORRECTION, August 2, 2026: DCR is NOT the hard requirement.

The paragraph above originally said remote MCP connectors "require OAuth 2.1,
including dynamic client registration." That was true of an earlier revision of
the MCP authorization spec and is now WRONG. Verified directly against
`https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization`
(read in-seat August 2, not taken from the recon report):

- Authorization servers and clients **SHOULD** support **Client ID Metadata
  Documents** (CIMD) - the client uses an HTTPS URL as its `client_id` and
  hosts its metadata there. This is now the preferred mechanism for the
  no-prior-relationship case, which is exactly ours.
- Authorization servers and clients **MAY** support **DCR** (RFC 7591). The
  spec states it is "included for backwards compatibility with earlier
  versions of the MCP authorization spec."
- MCP **servers MUST** implement **Protected Resource Metadata** (RFC 9728) and
  return `401` with a `WWW-Authenticate: ... resource_metadata=...` header.
- MCP servers **MUST** validate that a token was issued for them specifically -
  audience binding via RFC 8707 resource indicators is a MUST, not a nicety.

Practical effect: prefer an AS supporting **both CIMD and DCR** (CIMD for
current clients, DCR for lagging ones); treat CIMD as the requirement and DCR
as strongly desirable. A vendor lacking BOTH is disqualified. This slightly
widens the vendor field rather than narrowing it, so it does not disturb the
ruling.

**Open input, not an open decision - now ANSWERED.** Whether the
layer-over-existing-auth shape is purchasable was dispatched August 2 as the
`ai0-recon-oauth-delegation` report lane. Findings preserved at
`docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`. **It is purchasable, and
free at LogChamp's scale.** The shape is sold today by WorkOS (Standalone
Connect), Scalekit, Stytch (Connected Apps) and Descope, and is the native
architecture of Ory Hydra. Two claims were spot-checked in-seat rather than
trusted: the MCP spec correction above, and WorkOS Standalone Connect's flow
(`workos.com/docs/authkit/connect/standalone` - WorkOS redirects to OUR login
URI, we authenticate against our own stack, we call a completion API with the
identity, WorkOS issues the token; "maintain your existing authentication
stack"). Both held.

Recon's ranked recommendation, criterion = zero migration > not in login path >
free at our scale > registration support > least code authored here:

1. **WorkOS Standalone Connect** - exact pattern fit, 1M MAU free, CIMD
   documented on the standalone page, smallest glue.
2. **Scalekit** BYOA - same fit, MCP-native docs, 1M MAU free.
3. **Stytch** Connected Apps - 10k MAU free, but its trusted-auth-token
   profile wants an `email` claim and `server/src/lib/jwt.js` signs only
   `{ sub }` today, so more glue.

Disqualified: Clerk and Auth0 (both assume they own identity - migration plus
login-path SPOF), Logto (no DCR, IdP-centric third-party apps), Keycloak
(soft - its own MCP matrix lists RFC 8707 resource indicators unsupported,
which collides with the audience-binding MUST above, plus heavy ops).

One caveat carried forward rather than buried: the WorkOS standalone page
documents CIMD but not DCR; the DCR claim comes from a separate WorkOS MCP
guide page. Given DCR is now MAY and CIMD is SHOULD, this is not
disqualifying - but confirm DCR availability before committing if
lagging-client support turns out to matter.

- **Path 1 (preferred, and now the live plan).** Delegate to a vendor
  supporting layer-over-existing-auth on a free tier. LogChamp authors the
  Login URI handler, the protected-resource-metadata endpoint, Bearer
  validation against the vendor's JWKS with audience checking, and scope
  enforcement - nothing more.
- **Path 2 (fallback).** No vendor qualifies. LogChamp builds a MINIMAL
  authorization server - authorization-code + PKCE over the existing session
  cookie, read-only scopes, short-lived tokens, one client type. This is not
  A1: A1 imagined a general-purpose identity provider, which is why it read as
  enormous. Scoped to "issue read-only tokens to one kind of client for a user
  who is already logged in", it is far smaller than A1. It remains a cross-user
  isolation surface and therefore a mandatory frontier-seat review under
  CLAUDE.md, whoever writes it.

  **Sizing correction, August 2.** This path was described in-seat as "a few
  hundred lines and genuinely reviewable" before the recon enumerated the
  actual surface. That estimate was too low. The real list is authorize +
  token + refresh + revoke + PKCE verification + RFC 8414 discovery +
  protected-resource metadata + a registration mechanism (CIMD fetch and/or
  DCR) + a consent page + persistence for clients, codes, refresh tokens and
  consents + JWKS or introspection. Honest order of magnitude is multi-day to
  multi-week security-sensitive work, plus a standing obligation to track MCP
  spec churn - the CIMD correction above is an example of that churn landing
  inside a year. `oidc-provider` (panva, actively maintained, last release
  2026-07-27) is the library to build on if this path is ever taken;
  `oauth2orize` is stale (last release 2023) and should not be chosen. This
  correction makes Path 1 MORE clearly right, not less - it is recorded so the
  fallback is never costed optimistically in a later planning session.

**The long-term-risk question Seth asked, answered plainly.** Path 1's
reversibility risk is vendor lock-in on token issuance. It is bounded: the
tokens are opaque to third-party clients, the scopes are ours, and the user
mapping stays in our database, so switching vendors - or falling back to Path 2
later - re-issues connector tokens and forces users to re-link the connector.
That is an annoyance, not a data migration and not a login outage. There is no
identified failure mode here that cannot be fixed forward. Had the IdP owned
app login, the same switch would have been a full user migration; that is
precisely the outcome this ruling avoids.

Whichever is chosen, scopes are **read-only for v1**. No MCP tool writes
workout data. Logging a set from Claude is a plausible later feature and a bad
first one: write scope on a connector multiplies both the abuse surface and the
blast radius of an auth bug.

### 4.3 Entitlement gate

Lane A ships free, but behind a real check from day one (Seth's decision 2).
The check is a server-side entitlement lookup on the connector's token, not a
client-side flag, so flipping to paid is configuration rather than a refactor.

Stated plainly because it is the one genuine revenue-limiter identified in the
brainstorm: shipping the connector free AND ungated trains users to expect
LogChamp intelligence for free inside Claude, and reclaiming that later reads
as a takeaway. The flag costs almost nothing now and preserves the option.

## 5. Lane B - in-app chat

Shape inherited from `analytics-engine.md` section 8, none of which exists yet:

- `POST /api/coach/ask { question }` -> `server/src/routes/coachRoutes.js`
- Prompt assembly + provider call -> `server/src/coach/`
- Chat panel on the analytics screen, flag-gated.

**BYO-key and hosted are ONE code path with a different key source.** Build the
proxy so the key resolves from: per-user stored key if present, else the
tier-provisioned key if entitled, else a clear "not available" state. Never two
implementations.

Realistic expectation on BYO: it requires the user to create a developer
account and usually add a card, so it will serve a small technical minority.
Its value is that it is the cheapest way to build and dogfood the in-app
surface that the paid tier later reuses - not that it is a growth feature.

Provider choice is deliberately abstracted behind a thin adapter in
`server/src/coach/`, defaulting to a Sonnet-class model for cost. The summary
object is provider-agnostic, so this stays a small seam.

## 6. Privacy and consent (the one hard-to-reverse item)

**Consent lands with the FIRST AI feature, not at productization.** Workout
data leaving the app is a privacy event, and retrofitting consent onto users who
already have the feature is the only genuinely irreversible mistake available
here. Required with lane A:

- Explicit, opt-in, per-user data-sharing consent, recorded with a timestamp
  and the scope consented to. Off by default. Revocable, and revocation kills
  live connector tokens.
- A plain-language statement of what leaves the app: the computed summary, not
  raw logs. This is true and it is a genuine selling point - say it.
- Per-user API keys encrypted at rest, never plaintext, never logged, never
  returned by any endpoint once stored.
- Rate limiting and abuse handling on both lanes, per user and per token.
- Privacy policy and ToS updated in the SAME wave as the first AI feature.

## 7. Roadmap

Effort logging (the E-wave) lands FIRST - Seth's decision 3 - so the coach
reasons over data that supports the Stimulating Sets wedge. A coach on sparse
RIR can only say "volume is up," which any app can say.

- **AI0. Auth decision (Seth + frontier seat).** Resolve A1 vs A2 in section
  4.2. Blocks everything in Lane A. Not a Cursor block.
- **AI1. Consent + entitlement foundation.** Consent record, opt-in UI,
  entitlement lookup, rate-limit scaffold. Ships before any model call.
- **AI2. OAuth 2.1 per the AI0 decision.** RED - frontier seat authors and
  reviews; cross-user isolation surface.
- **AI3. MCP server + read-only tools** over the existing summary endpoints.
- **AI4. Connector onboarding UX** - the in-app "connect to Claude/ChatGPT"
  flow and copy.
- **AI5. Coach proxy** (`/api/coach/ask`, `server/src/coach/`) with per-user
  key resolution.
- **AI6. Coach chat UI**, flag-gated.
- Deferred: hosted paid tier billing (Stripe, quotas, packaging) - see
  section 8; write scopes on MCP; multi-provider adapters beyond the first.

## 8. Explicitly deferred

Billing infrastructure. The entitlement FLAG exists from AI1, but no payments,
no Stripe, no packaging decisions. When it comes: per-tier quotas, overage
behavior, and dunning are their own wave, and it is the point at which LogChamp
acquires cost of goods sold for the first time.

## 9. Model / escalation

**Frontier seat (Opus) owns:** AI0 (the auth decision), AI2 (OAuth - security
and cross-user isolation), and the consent design in AI1. These are exactly the
standing escalation triggers in CLAUDE.md.

Sonnet + Cursor blocks: AI3 tool wiring, AI4 onboarding UX, AI5 proxy
plumbing, AI6 chat UI - each contract-first, each with the section 2 boundary
restated in its acceptance criteria so no unit quietly hands raw sets to a
model.
