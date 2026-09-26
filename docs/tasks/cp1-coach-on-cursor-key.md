# TASK CP1: run the hosted coach on a CURSOR API key (`@cursor/sdk`)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The in-app coach and palette studio (`docs/specs/ai-layer.md` section 5,
`docs/specs/ai-theming.md`) run on one code path with two key sources: a
HOSTED app key (`COACH_API_KEY`) and a user's BYO key (`x-coach-key` header).
Today both must be Anthropic keys. **Seth's ruling, Sept 25, 2026: the hosted
coach ships on a Cursor API key, not an Anthropic one.** This unit adds a third
provider, `cursor`, used ONLY for the hosted key. BYO keys stay Anthropic and
keep the existing `streamAnthropic` / `completeAnthropic` path untouched.

Grounding: a Sept 25 recon read `@cursor/sdk@1.0.32` and its official docs
(https://cursor.com/docs/sdk/typescript). The facts this block relies on:
- It is an AGENT SDK, not a chat-completions API. The only documented way to
  get a text-only answer with our own persona is a LOCAL agent:
  `Agent.create({ apiKey, model, systemPrompt, tools: [], local: { cwd } })`.
  `tools: []` officially means NO built-in tools (text only). `systemPrompt`
  and `tools` are local-only and throw on a cloud agent - never use `cloud`.
- The package is dual (it ships a CommonJS export), `engines.node >= 22.13`.
- Token-level text arrives through `send(message, { onDelta })` with
  `update.type === "text-delta"`. Completion is `await run.wait()` ->
  `{ status: "finished" | "error" | "cancelled", result?, error? }`. Always
  wait, always dispose (`agent[Symbol.asyncDispose]()` or `agent.close()`).
- `systemPrompt` access is ACCOUNT-GATED: without it, the first `send()`
  fails with an error naming the system prompt / `InvalidArgument`.
- Errors extend `CursorSdkError` (`AuthenticationError`, `RateLimitError` -
  covers burst AND monthly usage cap, `ConfigurationError`, `NetworkError`).
- There is no `max_tokens` / `stop_reason` / `effort` / structured-output
  equivalent. Do not invent one.
- Model: this Cursor plan refuses named models, so the default model id for
  this provider is `auto`. `COACH_MODEL` still overrides it.
- Local runs write a store to disk; default is `node:sqlite` under the
  workspace/home. Use the SDK's JSONL store (or equivalent documented option)
  pointed under `os.tmpdir()` so nothing depends on a home dir on Render.
Verify each of these against the installed package's own `.d.ts` files before
relying on it; where the installed package disagrees with this list, the
package wins - record the difference as a deviation.

FILES TO TOUCH:
- `server/src/coach/cursorProvider.js`   (NEW - the whole Cursor adapter)
- `server/src/coach/config.js`           (accept `COACH_PROVIDER=cursor`;
                                          per-provider default model)
- `server/src/coach/keyResolver.js`      (hosted key format depends on the
                                          provider; BYO stays `sk-ant-`)
- `server/src/coach/askCoach.js`         (`openCoachStream` third branch)
- `server/src/controllers/coachController.js` (palette path branch for the
                                          cursor provider only)
- `server/package.json` + `server/package-lock.json` (add `@cursor/sdk`;
                                          add `engines`)
- `server/.env.example`                  (document `COACH_PROVIDER=cursor`)
- `server/test/lib/`                     (new/extended unit tests)
- `scripts/smoke-cursor-coach.mjs`       (NEW - live proof of the adapter)
Do NOT modify anything outside these files. In particular: do NOT touch
`server/src/coach/provider.js`, `prompt.js`, `mockProvider.js`, anything
under `client/`, anything under `server/src/ai/`, or `AiConnectorPage.jsx` -
a parallel unit (ID1) owns the connector files.

CHANGE:

**A. The one authorized dependency.** Seth approved adding `@cursor/sdk` on
Sept 25, 2026 ("make it work"). That approval covers exactly this package and
overrides the footer's "Do NOT add dependencies" line for it alone. Install it
from `server/` with `npm install @cursor/sdk@^1.0.32` (let npm record the
per-platform optional packages in the lockfile - do NOT use
`--omit=optional`). Also add `"engines": { "node": ">=22.13 <23" }` to
`server/package.json` (Render resolves an engines range to the highest
matching 22.x). No other package changes.

**B. Config.** `getCoachConfig` accepts `COACH_PROVIDER=cursor` as a third
value. Unset still means `anthropic`, `mock` still means mock - existing
behavior unchanged. Default model becomes per-provider: `claude-sonnet-5` for
anthropic (unchanged), `auto` for cursor; `COACH_MODEL` overrides either.

**C. Key resolution - the routing rule.** The provider is chosen PER REQUEST
from the key source, not only from config:
- BYO key present and `sk-ant-` shaped -> source `byo`, provider `anthropic`
  (the existing Anthropic path), regardless of `COACH_PROVIDER`.
- Otherwise the hosted key -> provider = `config.provider`. When that is
  `cursor`, the hosted key is NOT checked against the `sk-ant-` pattern (a
  Cursor key has a different shape); it only has to be non-empty. Entitlement
  rules are unchanged.
Make the resolved provider visible to `openCoachStream`, the palette path,
and `/coach/status` (whose `provider` field should then read `cursor` when the
hosted Cursor key is what would run). Follow `resolveCoachProvider` /
`resolveCoachKey` BY NAME; extend them rather than adding a parallel resolver.

**D. `cursorProvider.js`.** Exports a streaming function with the SAME item
contract as `streamAnthropic` and `streamMock` (`start` / `text` / `stop` /
`error` - see `provider.js` and `mockProvider.js`), plus a non-streaming
`completeCursor` that returns the final text. Requirements:
- Load the SDK LAZILY inside the call (never at module load), so server boot
  never depends on `@cursor/sdk` or its Node floor. Accept an injected SDK for
  tests, the way `streamAnthropic` accepts `fetchImpl`.
- Agent options: `apiKey` passed EXPLICITLY (never read from the process
  env inside this module), `model: { id: <config model> }`, `tools: []`,
  `local.cwd` = a fresh empty directory under `os.tmpdir()` (NEVER the repo or
  `process.cwd()`), no `settingSources`, no `mcpServers`, store under
  `os.tmpdir()`. These are security properties: user text goes into this
  agent, and it must have no tools, no filesystem context, and no MCP.
- System prompt: flatten the Anthropic-shaped system blocks from
  `buildCoachSystemBlocks` into one string (drop `cache_control`). History +
  question become the message text, with prior turns clearly labeled.
- If `send()` fails with the account-gated system-prompt error, retry ONCE
  with the system text inlined at the top of the message instead of
  `systemPrompt`. Any other error does not retry.
- Map `text-delta` updates to `text` items. After `wait()`: `finished` ->
  `stop` with `stopReason: "end_turn"`; `cancelled` -> `stop` with
  `stopReason: "cancelled"`; `error` -> an `error` item.
- Error mapping to `CoachProviderError` codes (reuse the class BY NAME):
  `RateLimitError` -> `rate_limited`; `AuthenticationError` ->
  `provider_error` (NOT `invalid_key` - that code's client copy blames the
  user's Anthropic key, and a bad hosted key is an operator problem); network
  -> `provider_error`; a failed lazy `require` (wrong Node, missing package)
  -> `provider_error`, never a crash.
- If the request's abort signal fires, stop streaming and cancel the run if
  the SDK exposes a cancel; either way dispose.
- Dispose the agent on EVERY path (success, error, abort).

**E. Palette via Cursor.** In the palette path, when the resolved provider is
`cursor`: ask for the palette with `PALETTE_SYSTEM_PROMPT` plus an explicit
instruction to return ONLY one JSON object matching `PALETTE_JSON_SCHEMA`;
extract the first JSON object from the returned text (tolerate a ```json
fence); then hand it to the EXISTING `JSON.parse` -> `validatePalette` flow.
The validator stays authoritative and never repairs. Unparseable output ->
the existing `palette_invalid`. Do not change the Anthropic or mock branches.

**F. `scripts/smoke-cursor-coach.mjs`.** A live proof that calls
`cursorProvider.js` directly (no HTTP server, no DB): reads the key from
`CURSOR_API_KEY` or `--key`, streams one coach answer over a tiny inline
fixture system prompt and question, prints deltas as they arrive, then prints
a one-line verdict: whether `systemPrompt` was accepted or the inline fallback
ran, the model reported, and total chars. Then runs one palette completion and
prints whether it passed `validatePalette`. `--help` prints usage and exits 0
without a network call. Follow the `scripts/smoke-coach.mjs` style.

**G. `.env.example`.** Document the hosted-Cursor setup next to the existing
coach lines: `COACH_PROVIDER=cursor`, `COACH_API_KEY=<Cursor user API key>`,
`COACH_MODEL` optional (default `auto`), and that BYO keys remain Anthropic.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - paste verbatim counts. Baseline
  is 28 suites / 302 tests; yours must be >= that, with no existing test
  modified to make it pass.
- `npm run build` clean from `client/` (unchanged, but prove it).
- New unit tests (injected fake SDK, no network) prove, at minimum:
  - `getCoachConfig({ COACH_PROVIDER: "cursor", COACH_API_KEY: "key_abc" })`
    -> `provider: "cursor"`, `model: "auto"`, `hostedKey: "key_abc"`;
    `getCoachConfig({})` -> `provider: "anthropic"`, `model:
    "claude-sonnet-5"` (unchanged).
  - Resolver: provider `cursor` + hosted `"key_abc"` + entitled -> ok, source
    `hosted`, provider `cursor`. Same config + a valid `sk-ant-...` BYO key ->
    source `byo`, provider `anthropic`. BYO `"hunter2"` still ->
    `bad_key_format`.
  - The fake SDK's `Agent.create` receives `tools: []`, the explicit
    `apiKey`, a `local.cwd` that starts with `os.tmpdir()` and is not inside
    the repo, and NO `settingSources` / `mcpServers` keys.
  - Two `text-delta` updates + a `finished` wait -> items `start`, `text`,
    `text`, `stop { stopReason: "end_turn" }`, texts concatenating correctly.
  - First `send()` throws the gated-system-prompt error -> exactly one retry
    without `systemPrompt`, and the system text appears in that retry's
    message.
  - A thrown `RateLimitError`-shaped error -> `CoachProviderError` code
    `rate_limited`; an `AuthenticationError`-shaped one -> `provider_error`.
  - The agent is disposed on success AND on error (the fake records it).
  - Palette extraction: `"```json\n{...}\n```"` and bare `"{...}"` both yield
    the object; `"no json here"` yields nothing (-> `palette_invalid`).
- `grep -n "@cursor/sdk" server/src -r` shows the require ONLY inside a
  function body in `cursorProvider.js` (paste it), and
  `node -e "require('./src/app')"` from `server/` does not load the SDK
  (prove it, e.g. by checking `require.cache` for `@cursor/sdk` afterwards).
- `node -e "const s=require('@cursor/sdk'); console.log(typeof s.Agent)"`
  from `server/` prints `function` (the CommonJS export loads). Report
  `node --version`.
- `node --check scripts/smoke-cursor-coach.mjs` exits 0 and `--help` exits 0
  with no network call. THEN run it for real once with the `CURSOR_API_KEY`
  already in this environment and paste the full output verbatim - this is
  the first time the adapter meets the real service, and whether the
  `systemPrompt` fallback fired is a fact the reviewer needs. If the live run
  fails, do not paper over it: paste the error and stop.
- `server/package.json` diff shows exactly: `@cursor/sdk` added to
  dependencies and the `engines` field. Paste the diff.

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
