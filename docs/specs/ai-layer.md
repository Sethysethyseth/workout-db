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

### 4.1 Data surface (no new plumbing)

Tools read the endpoints that already exist:

- `GET /api/analytics/summary?from=&to=` -> `server/src/routes/
  analyticsRoutes.js`, built by `server/src/analytics/summary.js`.
- The exercise-detail surface -> `server/src/analytics/exerciseDetail.js`.

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

Two options, to be decided before any Lane A block is authored:

- **A1. Implement an authorization server in Express.** Full control, no new
  vendor, no new monthly cost, data stays in our stack. Cost: OAuth 2.1 is
  security-critical surface and getting it subtly wrong is a cross-user
  isolation bug - exactly the category CLAUDE.md says escalates to the
  frontier seat. Needs token issuance/refresh/revocation, dynamic client
  registration, consent screen, and scope enforcement.
- **A2. Delegate to a managed identity provider.** Correct-by-default OAuth,
  much less security surface authored here. Cost: a new vendor and likely a new
  bill, plus a migration path for existing cookie/JWT users, plus an external
  dependency in the login path.

**Recommendation: A2 unless the cost is disqualifying.** Rationale: the value
of Lane A is that it is cheap to run, and hand-rolling an OAuth 2.1
authorization server converts "cheap" into "the most security-sensitive code
in the repo, authored once, maintained forever." Seth's call - it is a
vendor/cost decision as much as a technical one.

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
