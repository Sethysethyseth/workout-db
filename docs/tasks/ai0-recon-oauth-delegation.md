# TASK AI0-RECON: OAuth delegation options for the MCP connector (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
`docs/specs/ai-layer.md` section 4.2 blocks the entire Lane A (remote MCP
connector) roadmap on one decision: LogChamp has no OAuth today (cookie sessions
+ `server/src/lib/jwt.js`), and remote MCP connectors require OAuth 2.1 with
dynamic client registration. Seth ruled on August 2, 2026 that LogChamp's own
login must NOT be migrated to a third-party identity provider - an IdP in the
login path is a new single point of failure for the whole app. The chosen shape
is OAuth layered OVER the existing authentication, scoped to the connector only.

This lane exists to establish whether that shape is actually purchasable, and at
what price. It produces a REPORT that feeds a spec amendment. It does not
decide anything and it does not write code.

FILES TO TOUCH:
- NONE. This is a REPORT-ONLY lane. Make ZERO changes to the repository.
  Write findings to DELIVERY.md at the repo root and nothing else.

CHANGE:
Produce a report answering the questions below. Use web research; this is
current-product-landscape work and internal knowledge will be stale. Cite a URL
for every factual claim about a vendor, and give the date the page was accessed.
Where you cannot confirm something from a primary source (the vendor's own docs
or pricing page), say "UNCONFIRMED" rather than inferring - an unconfirmed free
tier that turns out to be paid would invert the recommendation.

THE CENTRAL QUESTION. Which identity/auth vendors support acting as an OAuth 2.1
authorization server for an application that KEEPS its own user table and its own
login? The pattern goes by names like "connected apps", "OAuth provider mode",
"auth for MCP servers", or "bring your own authentication" - the app tells the
vendor "this already-authenticated session belongs to user X" and the vendor
mints/refreshes/revokes the OAuth token for the third-party client. The pattern
that must be EXCLUDED is the one where the vendor becomes the identity source
and existing users must be migrated into it.

For each candidate vendor, report:
1. Does it support the layer-over-existing-auth pattern above? Yes / No /
   UNCONFIRMED, with the doc URL that shows it.
2. Does it support DYNAMIC CLIENT REGISTRATION (RFC 7591)? This is a hard
   requirement for remote MCP connectors - a vendor without it is disqualified
   regardless of price. Note if DCR is gated to a higher tier.
3. Free tier: exact limits (MAU or otherwise), and the first paid price point.
   Flag explicitly if the free tier EXCLUDES the features in (1) or (2).
4. What LogChamp would still have to build itself on that vendor.
5. Whether the vendor is in the login path at runtime (it should NOT be - if an
   outage on their side can block normal app login, say so loudly).

Candidates to cover at minimum: WorkOS, Stytch, Clerk, Auth0/Okta, Descope,
Logto, Keycloak, Ory (Hydra). Add any others that plainly fit. Note that
several of these shipped MCP-specific auth products recently - check for those
specifically rather than only reading the general auth docs.

ALSO REPORT:
- The current state of the MCP authorization specification as it applies here:
  what an MCP server is required to implement (protected-resource metadata,
  discovery documents, PKCE, scope handling) versus what the authorization
  server supplies. A short, sourced summary - this determines the size of the
  fallback build.
- The FALLBACK SIZING. If LogChamp built a minimal authorization server itself
  in Express - authorization-code + PKCE over the EXISTING session cookie,
  read-only scopes, short-lived tokens, one client type, no general-purpose IdP -
  what are the required endpoints and what well-maintained Node/Express libraries
  exist for it? Name libraries with their maintenance status (last release,
  weekly downloads). Do NOT write any implementation.
- A RANKED recommendation with the ranking criterion stated. Weight: (a) zero
  migration of existing users, (b) not in the app-login path, (c) free at
  LogChamp's scale, (d) DCR supported, (e) least code authored here.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain` is EMPTY except for the untracked/modified
  DELIVERY.md. Any other changed file is a failed criterion.
- DELIVERY.md contains a table covering all eight named vendors, with the five
  numbered fields above for each.
- Every vendor claim carries a source URL and an access date.
- The report explicitly names any vendor it DISQUALIFIES and the reason.
- The report ends with a ranked recommendation and states its ranking criterion.

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
