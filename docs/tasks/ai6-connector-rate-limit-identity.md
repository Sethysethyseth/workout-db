# TASK AI6: rate-limit the connector by connector identity, not by IP

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Sixth and final unit of the AI connector wave, added August 5 after AI4 landed.
It fixes a defect that lives where AI2 and AI4 meet: neither unit is wrong on
its own, and AI2 implemented exactly what its block specified - the block
specified an ordering that cannot work. Same shape as the F-wave gate finding.

**The defect, stated precisely.** `server/src/app.js:159-172` builds one rate
limiter whose `keyGenerator` reads `req.connectorUserId ?? req.authUserId`, and
mounts it on `/mcp` (`:171`) and `/ai` (`:172`). But `req.connectorUserId` is set
by `connectorAuth`, which does not run until `:176`. **So on `/mcp` the first
operand is ALWAYS undefined when `keyGenerator` runs** - it is dead code on that
path.

Until AI4 this was harmless: the v1 verifier accepted an ordinary LogChamp
Bearer token, and `attachAuthUser` (`:157`) sets `req.authUserId` from that same
token, so the second operand carried the identity. **AI4 removed that.** A
WorkOS-issued token is not signed with our `JWT_SECRET`, so `attachAuthUser`
leaves `authUserId` unset and every `/mcp` request now falls through to
`ip:`. All Claude connector traffic egresses from a small set of Anthropic IPs,
so in production **every LogChamp user would share ONE 300-per-15-minute
bucket** - precisely the "one user's assistant cannot exhaust another user's
budget" requirement the keying was written to satisfy. One busy user would
throttle everyone.

**`/ai` is NOT affected and must not be 'fixed' as though it were.** Verified by
reading the mount order: `attachAuthUser` at `:157` runs BEFORE the limiter at
`:172`, so `req.authUserId` is populated there. `/ai` keys correctly today.

FILES TO TOUCH:
- `server/src/app.js`                        (limiter construction + mount order)
- `server/src/ai/rateLimitKeys.js`           (NEW - the pure key derivation)
- `server/test/lib/rateLimitKeys.test.js`    (NEW - the lane's only reach into this unit)
Do NOT modify anything outside these files. **`server/package.json` must come
back byte-unchanged** - this unit adds NO dependency; `express-rate-limit` v8.6.2
is already installed and already imported by `app.js`.

CHANGE:

**1. Two limiters on `/mcp`, not one limiter moved.** The obvious fix - move the
existing limiter behind `connectorAuth` - is wrong on its own, because it would
leave the unauthenticated surface with no ceiling at all: a broken client looping
forever on a rejected token would hit signature verification on every request,
unthrottled. Build both:

a. **A pre-auth FAILURE ceiling**, mounted on `/mcp` BEFORE `connectorAuth`.
   Keyed by IP. It must count only requests that FAIL - use
   `skipSuccessfulRequests: true` (confirmed present in the installed v8.6.2
   type definitions). This matters and is the whole reason the ceiling is
   tolerable: legitimate connector traffic from Anthropic's shared egress IPs
   returns 200 and therefore consumes NOTHING from this bucket, so the fix does
   not quietly reintroduce the shared-bucket bug one layer earlier.

b. **A per-identity budget**, mounted in the `/mcp` chain AFTER `connectorAuth`
   and BEFORE `handleMcpRequest`. Keyed strictly on `req.connectorUserId`. This
   is the real budget and it carries the existing 300-per-15-minute intent.

**2. `/ai` keeps its own limiter instance, keyed on `req.authUserId`.** Today
`/ai` and `/mcp` share ONE limiter object and therefore ONE bucket; splitting
them is deliberate, so a connector flood cannot consume the settings surface's
allowance. Drop the dead `req.connectorUserId ??` operand from this one - on
`/ai` it is never set, and leaving it there preserves the exact confusion this
unit exists to remove.

**3. Extract the key derivation into `server/src/ai/rateLimitKeys.js`.** The
lane cannot load `app.js` (see LANE GAP), so the logic that decides identity
must live in a pure module the lane CAN load, following the pattern
`server/src/ai/consent.js` established in AI1 - pure functions, no `req`
handling beyond reading plain properties, no Prisma, no env. Export one function
per surface. IPv6 normalization must still go through `express-rate-limit`'s
`ipKeyGenerator` helper rather than raw `req.ip` - AI2 added that for a reason
(v8 requires it) and removing it is a regression.

**The single most important line in this unit:** the connector key function must
**never consult `req.authUserId`**. Not as a fallback, not as a default. A
WorkOS-authenticated request and a cookie-authenticated request are different
identities from different issuers, and quietly substituting one for the other on
a rate-limit key is how a security surface starts lying about who it is talking
to. If `connectorUserId` is absent, fall back to the IP key - never to another
identity.

**4. Constants.** Keep the existing `CONNECTOR_RATE_LIMIT_WINDOW_MS` /
`CONNECTOR_RATE_LIMIT_MAX` naming style, at the top of `app.js` with the others.
The per-identity budget stays **300 per 15 minutes** (unchanged intent). The
pre-auth failure ceiling is **600 per 15 minutes per IP** - a deliberate,
scale-dependent choice, so put a comment on it saying so: it is a flood ceiling
against a misbehaving client retrying a rejected token in a loop, NOT a
credential-guessing defence (guessing a JWT signature is infeasible, so that is
not the threat) and NOT a usage budget. Note in the delivery report that a 401
is a normal part of an OAuth expiry cycle, so this bucket does see legitimate
traffic and the number should be revisited if the connector ever has many
concurrent users behind one egress IP.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, and the new `rateLimitKeys` suite is
  IN it - paste the suite count before and after and show the number rose.
  (`jest.config.js:11-14` matches `test/lib/**`, so a test placed anywhere else
  silently does not run.)
- The new test proves these exact input -> output pairs:
  - `{ connectorUserId: "cku_abc", authUserId: "cku_other", ip: "1.2.3.4" }`
    -> `"id:cku_abc"` (connector identity wins)
  - **`{ authUserId: "cku_999", ip: "1.2.3.4" }` -> an `ip:`-prefixed key, and
    NOT `"id:cku_999"`** - this is the criterion that encodes the entire bug;
    if it passes with the old `??` logic, it is written wrong.
  - two different `connectorUserId` values -> two different keys
  - the `/ai` surface function: `{ authUserId: "u1", ip: "1.2.3.4" }` -> `"id:u1"`
- `grep -n "connectorUserId ?? req.authUserId" server/src/app.js` returns
  NOTHING. Paste the grep.
- `node -e "require('./src/app.js')"` from `server/` exits 0 with a localhost
  `DATABASE_URL` (`dbHostGuard` permits localhost). The unit lane never loads
  `app.js`, so this is the only proof the module graph still resolves.
- **Mount order, shown by quotation, not asserted.** Paste the mount lines from
  the edited `app.js` in source order and show: the failure ceiling is mounted on
  `/mcp` before `connectorAuth`; the identity limiter sits between
  `connectorAuth` and `handleMcpRequest` in the same chain; `attachAuthUser`
  still precedes the `/ai` limiter.
- `git diff --stat server/package.json` is EMPTY.
- Client build is untouched by this unit - do not run it.

LANE GAP - state this in the delivery report:
`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware. **No lane in this repo can prove that
the limiter actually keys by connector identity on a live request** - the tests
above prove the key FUNCTION is correct, and the quoted mount order is a reading,
not an execution. Say so plainly rather than presenting a green lane as proof of
the fix. Do not mock Express middleware into agreeing with you; a test that
fakes the ordering proves nothing about `app.js`.

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
