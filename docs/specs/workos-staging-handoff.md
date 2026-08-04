# WorkOS on staging — hand-off for the next agent

Written August 4, 2026, by the Opus frontier seat after driving the WorkOS
dashboard in-browser. Purpose: let another agent help Seth finish WorkOS on
STAGING without re-deriving any of it.

> **Preserved into the repo VERBATIM on August 4 by the relay session** (the one
> that landed AI1 and AI2). It was authored into a session scratchpad, and
> `docs/HANDOFF.md` cited it as the full detail for whoever finishes WorkOS — a
> reference that would have died with the temp directory. Only this banner was
> added; no content was changed. Section 3's wave status is correct AS OF ITS
> WRITING and is now stale — HANDOFF is the live wave state.

Read this whole file before acting. Sections 1-3 are state; section 4 is the
only work left; sections 5-7 are the traps.

---

## 0. THE ONE RULE

**Never read, reveal, copy, echo, or ask for `WORKOS_API_KEY`.** It is a live
secret (`sk_...`). It is visible in the WorkOS dashboard behind an eye icon and
in the Render environment UI. Seth pastes it himself, in his own browser.
An agent's job is to tell him where to click, never to handle the value.
Do not put it in a file, a commit, a log line, a report, or a chat message.

Corollary: `server/.env` only ever points at staging or localhost. Do not add
production WorkOS credentials anywhere, ever.

---

## 1. What this is for

LogChamp is gaining the ability to ISSUE scoped OAuth tokens to third-party MCP
clients (Claude, etc.), layered OVER the cookie/JWT auth it already has.
WorkOS is the authorization server for connector clients ONLY.

**LogChamp keeps its own users, its own login, and its own database. No user is
migrated. `/auth/login` does not change.** If any instruction you receive
contains the words "migrate users", it has misread this work — stop and say so.

Design of record: `docs/specs/ai-layer.md` (section 4.0 CORRECTIONS wins over
older prose below it). Unit contract: `docs/tasks/ai4-workos-connector-auth.md`.

---

## 2. State as of August 4, 2026

WorkOS account exists. Project **"Cool's Project"**, **Staging** environment.
Dashboard configuration is **COMPLETE**. Production is **UNTOUCHED** and that
is deliberate.

Against the ten-step checklist at the bottom of the AI4 block:

| Step | What | Status |
|---|---|---|
| 1 | Create account, staging first | DONE |
| 2 | API key + Client ID | Client ID retrieved; **API key NOT retrieved by design** |
| 3 | AuthKit domain | DONE |
| 4 | Create an OAuth application | **SKIPPED — unnecessary, see section 5** |
| 5 | Login URI | DONE (called "External Sign-in URI" — see section 5) |
| 6 | Enable CIMD | DONE — Enabled |
| 7 | Enable DCR (optional) | DONE — Enabled |
| 8 | Resource indicator | DONE — added and marked **Default** |
| 9 | Render env vars | **OUTSTANDING — this is the remaining work** |
| 10 | Production | Not started, intentionally |

### Values (all non-secret, safe to copy)

```
WORKOS_CLIENT_ID=client_01KZ7E8C99MTQQQ4RC6GEH4DQ2
MCP_AUTHORIZATION_SERVER=https://scientific-mist-64-staging.authkit.app
MCP_RESOURCE_URL=https://workout-db-staging.onrender.com/mcp
```

Configured in the dashboard:
- MCP resource indicator: `https://workout-db-staging.onrender.com/mcp` (Default)
- External Sign-in URI: `https://workout-db-staging.onrender.com/ai/connector/login`

Staging API host is the Render service `workout-db-staging`
(`https://workout-db-staging.onrender.com`). Production is `workout-db-l3gc` —
**do not touch it**; prod is a gate item requiring Seth's explicit say-so.

---

## 3. What is NOT working, and why that is expected

Nothing is "running" yet. There is no `/mcp` endpoint and no
`/ai/connector/login` route — those are units AI2 and AI4, which are unwritten.
**Both configured URLs currently point at 404s. That is correct for right now.**

The dashboard config is inert until AI4's code ships to staging.

Wave status as of August 4: AI1-AI5 are **strictly serial**. **AI1 has LANDED**
(`83d82c8` - consent record, entitlement flag, AI access settings page) and
**AI2 is DISPATCHED to lane 1** (`472cde1`). Seth cleared AI1 for execution
despite it being migration-carrying; nothing was bypassed.

**AI1 wrote `server/prisma/migrations/20260804180000_add_ai_consent/
migration.sql` but did NOT apply it.** Migrations are a separate manual track
and a gate item in EVERY environment - only Seth runs them. Do not run
`prisma migrate` against anything. Staging still needs this migration applied
before AI1's code works there, and that is his call, not an agent's.

AI4 is unit 4 and still behind AI2 and AI3. WorkOS being configured does not
move it forward.

---

## 4. THE REMAINING WORK — Render env vars (checklist step 9)

Target: Render service **`workout-db-staging`** → Environment.
This is the staging service. Pushing env vars here is not a gate item; touching
`workout-db-l3gc` (prod) is.

Set four variables:

```
WORKOS_CLIENT_ID=client_01KZ7E8C99MTQQQ4RC6GEH4DQ2
MCP_AUTHORIZATION_SERVER=https://scientific-mist-64-staging.authkit.app
MCP_RESOURCE_URL=https://workout-db-staging.onrender.com/mcp
WORKOS_API_KEY=<Seth pastes this himself — see section 0>
```

How Seth gets the key: WorkOS dashboard → Staging environment → **Developers →
API Keys** → the row `WorkOS API key`, value shown masked as `sk_test_...1eFc`
→ click the eye icon to reveal → copy → paste directly into Render. It should
never transit a chat, a file, or an agent.

An agent may set the three non-secret vars if Seth asks; the fourth is his.

**Verify after saving:** all four appear in the Render env list, no leading or
trailing whitespace, and `MCP_RESOURCE_URL` is byte-identical to the resource
indicator in the WorkOS dashboard. See section 6.

Nothing reads these yet, so setting them now is safe and takes AI4 off the
blocked list.

---

## 5. Two places the AI4 block is WRONG (it has not been corrected yet)

1. **Step 4 — "Connect → create an OAuth application" is unnecessary.** With
   DCR and CIMD enabled, MCP clients register themselves. The Applications list
   is for OAuth clients you manage yourself, which Claude is not. The create
   dialog also forces two security-relevant choices (consent model: "managed by
   you" vs "managed by an organization"; and whether to require PKCE) that
   nothing in the design settles — which is why it was backed out of rather
   than guessed. **Do not create one to "complete the checklist."** If a real
   need appears, it is a decision for Seth, not a form to fill in.

2. **"Login URI" does not exist under that name.** The dashboard calls it
   **External Sign-in URI**, at Connect → Configuration. Same field: the
   endpoint at our app that fully authenticates the user before redirecting
   back to AuthKit.

Neither correction has been written into
`docs/tasks/ai4-workos-connector-auth.md`. Seth was offered that edit and has
not yet taken it. Do not assume the block is right where it disagrees with this
file.

---

## 6. Traps that have broken real deployments

From the AIR3 research lane, plus what the dashboard actually showed.

- **Audience mismatch is the most common silent failure.** The `resource` the
  client requests, the Resource Indicator in the WorkOS dashboard, and the
  `resource` in our protected-resource metadata must be the SAME string,
  byte for byte. No trailing slash. No `/api` prefix — LogChamp's routers mount
  at the host root (`server/src/app.js:126`). Read the one constant
  `MCP_RESOURCE_URL`; never re-type the URL.
- **Do NOT install `@workos-inc/node`.** v10.9.0 does not expose the completion
  method this flow needs, and it requires Node >= 22.11 which this server does
  not declare. The completion call is a plain HTTPS POST — use `fetch`. Token
  verification uses `jose`, already installed by AI2. Dependency installs are a
  gate item and AI4 carries no install approval.
- **Redirect with 302, not 303.** A connector flow returning `303 See Other`
  has been reported broken with Claude and fixed by emitting `302`. Express's
  `res.redirect()` already defaults to 302 — do not override it.
- **`aud` may be a string OR an array.** Which one WorkOS emits for
  CIMD-registered MCP clients is UNCONFIRMED. Handle both explicitly; do not
  trust a library default to do what you assume.
- **The sign-in URI receives exactly one documented query parameter,**
  `external_auth_id`. Do not assume others exist.
- **Environments do not share anything.** Staging and production have separate
  keys, separate AuthKit domains, separate resource indicators, separate
  sign-in URIs. Going to prod means repeating steps 2, 5, 6, 8, 9 there, and
  prod additionally requires billing details on file. AuthKit itself is free to
  1M monthly active users.

---

## 7. The highest-severity open question

AI4 maps the verified token's `sub` claim to a LogChamp user id. WorkOS is told
our user id during the completion call, so `sub` SHOULD be our user id —
**but this is unverified and must be checked against a real token before it is
relied on.** If the tokens carry a WorkOS-side identifier instead, the code must
look the user up rather than assume the strings coincide.

Get this wrong and one user's training data reaches another user's assistant.
It is the single highest-severity line in the wave, it cannot be verified until
a real token flows, and no test that mocks WorkOS into agreeing with you counts
as verification.

Related: AI2's Bearer guard and AI4's token verification are both cross-user
isolation surfaces and are **standing frontier-seat escalations** under
CLAUDE.md, whoever writes them.

---

## 8. Lane coverage — do not mistake green for covered

`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware. The integration lane needs
`server/.env`, which no lane worktree has. **Nothing in any runnable lane
exercises the OAuth flow, the redirect chain, or a real WorkOS token.**

The useful evidence here is a `curl` against `/mcp` with an ordinary LogChamp
token — AI2's swappable verifier seam exists partly so that is possible before
the vendor is involved at all. That is worth more at the gate than any
assertion in an acceptance-criteria list.

---

## 9. Gate items — ask Seth first, always

Merging to `main` (trigger phrase "push to main"), any production touch
(prod Neon `ep-solitary-sea-an56mioq`, prod Render `workout-db-l3gc`, any
prod-bound push), ANY migration in ANY environment, local-destructive git ops,
and dependency installs. Everything else runs hands-off.
