# TASK AI10: prove the AI layer against the live API - budget fixes + two smoke scripts

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Lane B (the in-app coach + palette studio, `docs/specs/ai-layer.md` section 5
and `docs/specs/ai-theming.md`) shipped September 9 in five commits that never
went through a per-unit audit. Every one of them was built and screenshotted
with `COACH_PROVIDER=mock`: `server/.env` has no `COACH_*` keys at all, and the
unit lane injects `fetchImpl`, so **no code on either Lane B path has ever
reached `api.anthropic.com`.** A September 12 frontier audit found three
budget-shaped defects that only a real call can surface, plus the fact that
nothing in the repo can re-run the August 14 connector probe. This unit fixes
the budgets and leaves behind two scripts that turn "does the AI layer work"
into one command per lane.

The defects, with the documented mechanism (verified against current Anthropic
API docs, not recalled):

1. **Adaptive thinking shares `max_tokens`.** `config.js` targets
   `claude-sonnet-5` and `provider.js` deliberately sends no `thinking`
   parameter (pinned by `coachProvider.test.js:113`). On Sonnet 5, omitting
   `thinking` runs **adaptive thinking** - a change from Sonnet 4.6, which ran
   thinking-off - and `max_tokens` is a hard cap on **thinking plus response
   text**. `MAX_TOKENS = 1500` against a data block budgeted to
   `MAX_DATA_CHARS = 60000` invites the documented symptom: a response that is
   mostly thinking followed by a truncated answer and `stop_reason:
   "max_tokens"`.
2. **The palette call is the same bug with a harder failure.**
   `coachController.js` sends `PALETTE_MAX_TOKENS = 800` and must get a
   COMPLETE JSON record back or `JSON.parse` throws -> `502 palette_invalid`
   -> "The model did not return a palette." It handles `stop_reason:
   "refusal"` but not `"max_tokens"`, which is the likelier outcome.
3. **The panel looks hung while the model thinks.** Thinking `display`
   defaults to `"omitted"` on Sonnet 5, so thinking blocks stream with empty
   text. `interpretAnthropicEvent` correctly drops them, so nothing breaks -
   but `CoachPanel.jsx:322` renders a bare `coach-caret` for a pending message
   with no content, which is a blinking cursor and nothing else for as long as
   the model thinks.

**The ruling on the fix (do not substitute your own):** thinking STAYS ON. The
coach reasoning over a computed summary is the product wedge, and disabling
thought to save a cap is the wrong trade. Raise the caps instead - an unused
ceiling costs nothing, because billing follows emitted tokens, not the cap.
Do NOT add a `thinking` parameter to either call.

FILES TO TOUCH:
- `server/src/coach/config.js`               (the `MAX_TOKENS` ceiling)
- `server/src/controllers/coachController.js` (`PALETTE_MAX_TOKENS`; the
                                              truncation branch on the palette
                                              path)
- `client/src/components/coach/CoachPanel.jsx` (the pre-first-token state; the
                                              truncated-answer notice)
- `client/src/index.css`                     (any new class the two states need)
- `server/test/lib/`                         (new/extended unit tests)
- `scripts/smoke-coach.mjs`                  (NEW)
- `scripts/smoke-connector.mjs`              (NEW)
Do NOT modify anything outside these files. In particular: do not touch
`server/src/coach/provider.js`, `prompt.js`, or `askCoach.js` - the request
shape and the cache breakpoint are correct as they stand and are already
pinned by `coachProvider.test.js` and `coachPrompt.test.js`.

CHANGE:

**A. Raise the two ceilings.**
- `MAX_TOKENS`: 1500 -> 8000. The coach call is a streaming request, so a large
  ceiling carries no HTTP-timeout risk.
- `PALETTE_MAX_TOKENS`: 800 -> 3000. Non-streaming, but a palette record is a
  few hundred tokens of JSON; the headroom is for thinking.
Keep both as named module constants with a comment saying WHY the number is
what it is (thinking shares the budget) - the next reader must not "optimize"
them back down.

**B. Never let a truncated answer read as a complete one.**
- Palette path: after `completeAnthropic` returns, branch on
  `message.stop_reason === "max_tokens"` BEFORE attempting `JSON.parse`, and
  return a distinct error code (not `palette_invalid`) whose message says the
  model ran out of room. Follow the existing `palette_refused` branch BY NAME
  for the shape.
- Coach path: the server already writes `done { stopReason }`; the client
  already resolves `stopReason` from `streamCoachAnswer` in
  `client/src/api/coachApi.js` and then drops it. Surface it: when
  `stopReason === "max_tokens"`, render a quiet one-line notice under that
  answer saying it was cut short. Tokens only - no raw colors outside
  `index.css`.

**C. Give the thinking pause a face.**
In `CoachPanel.jsx`, a pending assistant message with empty content currently
renders only `coach-caret`. Add a calm "working" state for that exact case
(pending AND no text yet) that reads as deliberate rather than stalled, and
drop back to the existing caret once the first delta lands. Match the restraint
already in the file - this is a text/opacity state, not a new animation. Respect
`prefers-reduced-motion` the way the existing loaders do.

**D. `scripts/smoke-coach.mjs` - the Lane B live proof. WRITE IT, DO NOT RUN IT.**
Follow `scripts/seed-staging-smoke.mjs` BY NAME for the shape: plain HTTP over
`fetch`, no DB connection (so no `dbHostGuard` call - correct here, do not add
one), a usage header comment at the top, no new dependencies.
- Usage: `node scripts/smoke-coach.mjs` with `--base <url>` (default the staging
  Render host that `seed-staging-smoke.mjs` already hardcodes), credentials for
  the smoke account from flags or env, and an optional `--key sk-ant-...` sent
  as the `x-coach-key` BYO header.
- It logs in, then exercises, in order: `GET /coach/status`,
  `POST /coach/ask` (a range question - consume the SSE stream), a second
  `POST /coach/ask` with a `session` focus (debrief mode), and
  `POST /coach/palette`.
- For each step print PASS/FAIL plus the evidence that matters for THIS unit:
  the `meta` frame, **`stopReason`**, the byte/char length of the answer, and
  for the palette either the validated record or the exact error code. A run
  that returns `stopReason: "max_tokens"` must print FAIL, not PASS.
- It must degrade honestly, not crash: no key and no hosted key is a clean
  `SKIPPED - coach unavailable (no_key)`, not a stack trace.

**E. `scripts/smoke-connector.mjs` - make the August 14 probe repeatable.
WRITE IT, DO NOT RUN IT.**
Same shape and constraints. This one takes a WorkOS access token the operator
already holds (`--token`, or `COACH_SMOKE_BEARER`) - it does NOT drive the OAuth
handshake, which needs a browser.
- Unauthenticated first: `GET /mcp` must 401 with a `WWW-Authenticate` carrying
  `resource_metadata`, and `GET /.well-known/oauth-protected-resource` must
  return the document. Print both.
- Then with the Bearer token: `initialize` (assert protocol `2025-11-25` and
  `serverInfo.name` `logchamp`), `tools/list` (assert exactly the four tools),
  and one `tools/call` per tool, printing a short shape summary of each result.
- Print the `RateLimit-*` headers seen on the authenticated calls, since the
  two-identity check is still open.
- No token supplied = run the unauthenticated half and print
  `SKIPPED - no bearer token` for the rest.

**F. Tests.** Unit-lane coverage for what is now testable without a key:
the palette truncation branch, and the client-side notice logic if you factor
it into a pure helper. Do not write tests that need network or a DB.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - report the verbatim suite/test
  counts. The current baseline is 27 suites / 295 tests; your number must be
  >= that, and no previously passing test may be modified to make it pass.
- `npm run build` clean from `client/`.
- `node scripts/check-hex.mjs` from the repo root exits 0 (no raw colors added
  to `client/src` outside `index.css`).
- `node --check scripts/smoke-coach.mjs` and `node --check scripts/smoke-connector.mjs`
  both exit 0. Paste the commands and their exit codes.
- `node scripts/smoke-coach.mjs --help` (or equivalent no-arg invocation) prints
  its usage and exits 0 WITHOUT making a network call. Same for
  `smoke-connector.mjs`. Paste the output.
- `grep -n "MAX_TOKENS" server/src/coach/config.js` shows 8000 and
  `grep -n "PALETTE_MAX_TOKENS" server/src/controllers/coachController.js`
  shows 3000. Paste both.
- `grep -rn "thinking" server/src/coach/provider.js` shows no `thinking` key
  added to either request body - the omission is deliberate and must survive
  this unit.
- In `DELIVERY.md`, state explicitly that you did NOT run either smoke script
  against a live host, and that no real Anthropic API call was made.

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
