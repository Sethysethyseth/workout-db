# TASK SF1: smoke fixes - a new account made through the connector link still connects; AI facts fold behind "More info"

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Two findings from Seth's Sept 26 staging smoke of the AI wave (`docs/specs/ai-layer.md`
Lane A; ID1 `ebf7b80` added the "Continue as <email>" confirm step on
`/connector/login`).
1. **Registering through the connector link does not connect.** A user sent from
   Claude to `/connector/login?external_auth_id=...` while signed out lands on
   `/login?next=<that path>`. `LoginPage.jsx` honors `next`, but its
   "Need an account? Register" link is a bare `to="/register"` (line ~73) and
   `RegisterPage.jsx` always does `navigate("/")` after `register()` (line ~34) -
   so the connect link is dropped and the user lands in the app, unconnected.
   Second half: a brand-new account has AI access OFF, so even with `next` kept,
   "Continue" gets `403 consent_required` from `POST /ai/connector/authorize`
   and `ConnectorLoginPage.jsx` does `<Navigate to="/profile/ai" />`, losing the
   `external_auth_id` again. The 403 is returned BEFORE any WorkOS call
   (`server/src/controllers/connectorAuthController.js` checks consent before
   `completeConnectorAuthorization`), so the id is still unused at that point.
2. **Profile -> AI access shows the three consent facts permanently.** Seth wants
   them tucked behind a small, pale "More info" toggle.
No server change in this unit.

FILES TO TOUCH:
- `client/src/lib/safeNext.js`                    (NEW - the shared `next` guard)
- `client/src/pages/LoginPage.jsx`                (use the shared guard; the
                                                   Register crosslink carries `next`)
- `client/src/pages/RegisterPage.jsx`             (honor `next`; the Login
                                                   crosslink carries `next`)
- `client/src/pages/ConnectorLoginPage.jsx`       (inline consent step on 403)
- `client/src/components/ai/AiConsentFacts.jsx`   (NEW - the three facts, one source)
- `client/src/pages/profile/AiConnectorPage.jsx`  (use `AiConsentFacts`; the
                                                   "More info" disclosure)
- `client/src/index.css`                          (disclosure styling - tokens only)
Do NOT modify anything outside these files. No server files, no `aiApi.js`
changes (the existing `grantAiConsent` and `authorizeConnector` are enough).

CHANGE:

**A. `next` survives the Login <-> Register crosslinks.** Move `LoginPage`'s
existing `nextUrl` guard (`next` must start with `/` and must not start with
`//`, otherwise `/`) into `client/src/lib/safeNext.js` as an exported pure
function `safeNextPath(searchParams)` returning the safe path string. LoginPage
uses it with IDENTICAL behavior. RegisterPage uses it too and, after a
successful `register()`, navigates to that path (replace) instead of `/`. Each
page's crosslink to the other carries `?next=<encodeURIComponent(path)>` when
the safe path is not `/`, and stays a bare `/register` / `/login` otherwise.

**B. `ConnectorLoginPage` - an account with AI access off can still finish.**
On `403` from `authorizeConnector`, do NOT navigate away. Stay on the page and
show an inline consent step: one line saying AI access is off for this account
and must be on to connect, the three facts (`AiConsentFacts`, shown EXPANDED -
this is the moment of consent), a primary button "Turn on AI access and
connect", and a quiet secondary link "Not now" to `/profile/ai`. The primary
button calls the existing `grantAiConsent()` and then `authorizeConnector` ONE
more time for the same `external_auth_id`, then follows the returned
`redirectUri` exactly as the Continue path does. Rules:
- Consent is only ever granted by that explicit click - never from an effect,
  never automatically on 403.
- The existing one-attempt latch (`attemptedIdRef`) must allow exactly this ONE
  post-consent retry and nothing more; a double click on either button must
  never POST twice. Keep the existing 409 (expired) and generic-error views.
- If `grantAiConsent()` fails, show the existing `ErrorMessage` and do not call
  `authorizeConnector`.
- Everything else ID1 built on this page (the "Continue as <email>" /
  "Use a different account" step, the expiry note) is unchanged.

**C. One source for the three facts.** Move the three `ai-facts` list items
("What it unlocks." / "What leaves LogChamp." / "What never leaves.") verbatim
from `AiConnectorPage.jsx` into `AiConsentFacts.jsx`; both pages render it. The
copy must not change.

**D. "More info" on Profile -> AI access.** Wrap the facts in a native
`<details>` (the same element and open/close mechanics `ai-key-details` uses on
this page, BY NAME) but visually QUIETER than `ai-key-details`: no bordered
box or surface fill, a small muted "More info" summary with the same
rotating-chevron affordance, facts revealed beneath it. Collapsed by default
when AI access is ON; rendered OPEN by default when AI access is OFF (it is the
consent disclosure, and the user is about to decide). New class names only,
tokens only - no raw colors (derive from existing `--color-*` tokens as
`ai-key-details` does).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` clean from `client/`; `node scripts/check-hex.mjs` exits 0
  from the repo root.
- `npm run test:unit` from `server/` still green at 324 tests / 30 suites (no
  server file touched - paste the counts).
- `safeNextPath` examples, proven with a node one-liner from the repo root
  (`node -e "import('./client/src/lib/safeNext.js').then(m => ...)"` - paste
  the output):
  - `next=%2Fconnector%2Flogin%3Fexternal_auth_id%3Dabc` -> `/connector/login?external_auth_id=abc`
  - `next=%2F%2Fevil.com` -> `/`
  - `next=https%3A%2F%2Fevil.com` -> `/`
  - no `next` -> `/`
- `grep -n 'to="/register"' client/src/pages/LoginPage.jsx` and
  `grep -n 'navigate("/"' client/src/pages/RegisterPage.jsx` both return
  nothing - paste them.
- `grep -n "useEffect\|grantAiConsent\|authorizeConnector" client/src/pages/ConnectorLoginPage.jsx`
  shows NO `useEffect`, and both API calls only inside click-handler paths -
  paste it and name the handler each call sits in.
- `grep -rn "What never leaves" client/src` shows exactly ONE hit, in
  `AiConsentFacts.jsx`.
- In `DELIVERY.md`, walk the new-account flow as code-reading evidence, step by
  step with file:line: signed-out connect link -> `/login?next=...` -> Register
  link keeps `next` -> register -> back on `/connector/login` -> Continue -> 403
  -> consent step -> "Turn on AI access and connect" -> grant -> second
  authorize -> redirect. State that no browser run was possible in the lane, if
  so.

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
