# RECON-CP — hosted Cursor coach provider (report-only)

Date: 2026-09-25. Lane: `cursor-lane-2`. No code changes except this file.

Goal: ground a task block that adds a **HOSTED** coach provider on a Cursor API key (`@cursor/sdk`), alongside the existing Anthropic provider (BYO keys) and the mock provider.

---

## Part 1 — NOW-state of the coach in this repo

### 1.1 How the provider is chosen

`getCoachConfig()` reads env at call time (not module load):

```15:22:server/src/coach/config.js
function getCoachConfig(env = process.env) {
  const hostedKey = (env.COACH_API_KEY || "").trim() || null;
  const providerRaw = (env.COACH_PROVIDER || "").trim().toLowerCase();
  const provider = providerRaw === "mock" ? "mock" : "anthropic";
  const model = (env.COACH_MODEL || "").trim() || DEFAULT_MODEL;
  const effortRaw = (env.COACH_EFFORT || "").trim().toLowerCase();
  const effort = EFFORT_LEVELS.has(effortRaw) ? effortRaw : DEFAULT_EFFORT;
  return { provider, hostedKey, model, effort, maxTokens: MAX_TOKENS };
}
```

Hard facts:

- `COACH_PROVIDER=mock` is the only non-Anthropic value. Anything else, including unset, is `"anthropic"` (`config.js:18`).
- Defaults: model `claude-sonnet-5` (`config.js:10`), effort `medium` (`config.js:11`), `MAX_TOKENS = 1500` (`config.js:13`). Effort allowlist: `low|medium|high|xhigh|max` (`config.js:12`).
- `COACH_API_KEY` is the **app's hosted key**, not a user key (`config.js:5-7`). Env example still documents it as `sk-ant-...` (`server/.env.example:33-36`).

Resolution order (one code path, two key sources) is in `resolveCoachProvider` (`askCoach.js:64-83`):

1. If `config.provider === "mock"` → `{ source: "mock", key: null }` and **no key check**.
2. Else `resolveCoachKey({ byoKey, hostedKey, entitled })` (`keyResolver.js:21-38`):
   - BYO wins even when the user is not entitled (`keyResolver.js:22-28`).
   - Hosted key is used only when present **and** `entitled` (`keyResolver.js:30-37`).
   - Failures: `bad_key_format` | `no_key` | `not_entitled`.

BYO arrives as header `x-coach-key` (`coachController.js:19-25`, `coachApi.js:9`). It is never stored server-side. Client keeps it in `sessionStorage` under `workoutdb-coach-key` (`coachKeyPref.js:1,9-16`).

`GET /coach/status` (`coachController.js:31-51`) returns `{ consentGranted, entitled, available, source, reason, provider, model }`. `available` is `consentGranted && resolved.ok`. `source` is `"mock" | "hosted" | "byo" | null`. Hosted model is `config.model` unless provider is mock (`coachController.js:50`).

`POST /coach/ask` and `POST /coach/palette` reuse the same resolver (`coachController.js:82-91`, `185-191`). Missing key → HTTP 409 `{ error: "coach_unavailable", reason }`. No consent → HTTP 403 `{ error: "forbidden", reason: "no_consent" }`.

Routes (`coachRoutes.js:11-13`), mounted at `/coach` (`routes/index.js:60`). Rate limit: 40 req / 15 min per signed-in identity (`app.js:38-39,214-224`). Auth: `authRequired` on all three coach routes (`coachRoutes.js:11-13`).

### 1.2 Every place that assumes the provider is Anthropic

**Server (functional, not just copy):**

| Location | Assumption |
|---|---|
| `config.js:18` | Non-mock provider is always `"anthropic"`. No `"cursor"` value. |
| `config.js:10` | Default model is `claude-sonnet-5`. |
| `keyResolver.js:11-13,23-26` | Hosted **and** BYO keys must match `^sk-ant-[A-Za-z0-9_-]{20,}$`. A Cursor key (`cursor_...` / dashboard key) fails `bad_key_format` if sent as BYO, and a hosted Cursor key would fail the same regex if anyone sent it through `resolveCoachKey`. Mock bypasses this. |
| `askCoach.js:19,182-190` | Non-mock stream is always `streamAnthropic`. |
| `provider.js:11-12,134-179,185-231` | Both stream and complete call `https://api.anthropic.com/v1/messages` with `x-api-key` + `anthropic-version: 2023-06-01`. |
| `provider.js:151` | Effort is Anthropic `output_config.effort`. |
| `provider.js:66-101` | Stream parser is Anthropic event types (`content_block_delta` / `text_delta`, `message_delta.stop_reason`, `message_start`, `error.overloaded_error`). |
| `prompt.js:225` | System block 2 sets Anthropic `cache_control: { type: "ephemeral" }`. |
| `coachController.js:10,197-205` | Palette path always calls `completeAnthropic` with Anthropic structured-output `output_config.format`. |
| `mockProvider.js:69` | Copy tells the reader to add `COACH_API_KEY` (implied Anthropic). |

**Client (copy + format gate):**

| Location | Assumption |
|---|---|
| `coachKeyPref.js:32-33` | `looksLikeAnthropicKey` is `sk-ant-...`. |
| `coachApi.js:26-28` | `invalid_key` / `bad_key_format` copy names Anthropic. |
| `CoachPanel.jsx:30-38` | Unavailable copy: "your own Anthropic key", "sk-ant-". |
| `AiConnectorPage.jsx:139,235-236,342-364` | BYO UI is Anthropic-only (placeholder `sk-ant-…`, "your Anthropic account"). |
| `AppearancePage.jsx:36-46` | Palette-studio unavailable copy is Anthropic-only. |

**Docs / env (not runtime, but they will mislead the next block):** `server/.env.example:33-36`, `docs/HANDOFF.md:15-16,80` (Sept 25 decision still says hosted key "must be an Anthropic API key").

Implication for a hosted Cursor provider: `resolveCoachProvider` must **not** run a Cursor hosted key through `KEY_FORMAT_RE`. BYO should stay Anthropic-shaped. Hosted Cursor key and BYO Anthropic key are different formats.

### 1.3 Provider interface (today)

There is **no shared interface type**. The seam is two async generators plus one non-streaming complete, all Anthropic-named.

**Streaming (ask path)**

`streamAnthropic({ apiKey, model, system, messages, effort, maxTokens, signal, fetchImpl })` (`provider.js:134-179`)

Request body (`provider.js:144-151`):

```
{ model, max_tokens, stream: true, system, messages, output_config?: { effort } }
```

No `thinking` key (deliberate; pinned by `coachProvider.test.js:113`).

Inputs from the orchestrator (`askCoach.js:152-190`, `openCoachStream`):

- `system`: array of `{ type: "text", text, cache_control? }` from `buildCoachSystemBlocks` (`prompt.js:190-226`). Order: persona → data JSON (ephemeral cache) → volatile framing (today, unit, focus).
- `messages`: `[...history, { role: "user", content: question }]` (`prompt.js:229-231`). History already normalized to alternating user/assistant ending on assistant (`coachRequest.js:78-97`).
- `model` / `effort` / `maxTokens` come from `getCoachConfig()`, not the client.
- Data block is the compacted summary JSON **inside** the system text, not a separate API field (`prompt.js:200-213`). Ceiling `MAX_DATA_CHARS = 60000` (`prompt.js:12`).

Internal stream items (`provider.js:131`):

| `type` | Fields | Source |
|---|---|---|
| `start` | `model`, `usage` | Anthropic `message_start` (`provider.js:84-89`) |
| `text` | `text` | `content_block_delta` + `delta.type === "text_delta"` (`provider.js:69-76`) |
| `stop` | `stopReason`, `usage` | `message_delta.delta.stop_reason` (`provider.js:78-83`) |
| `error` | `code`, `message` | Anthropic `error` event; `overloaded_error` → `overloaded` (`provider.js:90-97`) |

Ignored: pings, block start/stop, thinking deltas (`provider.js:99-100`; pinned `coachProvider.test.js:38-42`).

`streamMock` yields the same item shapes (`mockProvider.js:73-87`): `start` (model `"mock"`) → `text` chunks → `stop` (`stopReason: "end_turn"`).

**SSE to the client** (`coachController.js:57-58,61-68,109-146`):

```
event: <name>
data: <json>

```

| Event | Payload | When |
|---|---|---|
| `meta` | `{ model, source, range: {from,to}, effortCoverage, workoutCount }` | Immediately after headers (`coachController.js:109-115`) |
| `delta` | `{ text }` | Each `item.type === "text"` (`coachController.js:130-131`) |
| `done` | `{ stopReason }` | After the stream, unless refusal (`coachController.js:146`) |
| `error` | `{ code, message }` | In-stream provider error, `stopReason === "refusal"`, or thrown `CoachProviderError` (`coachController.js:134-136,139-144,148-155`) |

`start` items are **not** forwarded. Client `askCoachStream` resolves `{ text, meta, stopReason }` (`coachApi.js:85-86,176`). `CoachPanel` uses `onDelta` / `onMeta` and **drops `stopReason`** (`CoachPanel.jsx:126-142`).

**`stop_reason` handling (NOW, not AI10):**

- Any Anthropic `stop_reason` is passed through on the `stop` item, including `"max_tokens"` and `"refusal"` (`provider.js:78-83`; test pins `"refusal"` at `coachProvider.test.js:45-48`).
- Controller special-cases **only** `"refusal"` → SSE `error` `{ code: "refusal", message: "The coach can't answer that one." }` (`coachController.js:139-144`).
- `"max_tokens"` today becomes `done { stopReason: "max_tokens" }` and the client treats it as a finished answer. AI10 is queued to surface a notice (`docs/tasks/ai10-ai-layer-live-proof.md:82-86`); that is **not in this tree**.

HTTP errors before the stream starts throw `CoachProviderError` with mapped codes (`provider.js:23-31,165-172`):

| HTTP | `code` |
|---|---|
| 401 | `invalid_key` |
| 403 | `forbidden` |
| 404 | `unknown_model` |
| 429 | `rate_limited` |
| 529 | `overloaded` |
| 400 | `bad_request` |
| other | `provider_error` |

### 1.4 Palette-studio call path

`POST /coach/palette` `{ description }` (`coachController.js:172-230`). **Non-streaming.** Same consent / key resolution as ask.

- Description: trim, collapse whitespace, cap 200 chars (`palette.js:217-221`). Empty → 400 `description is required`.
- Mock: `mockPaletteFor(description)` (deterministic HSL from a hash; always passes the validator) (`palette.js:248-284`, `coachController.js:194-195`).
- Live: `completeAnthropic` (`coachController.js:197-205`) with:
  - `system: [{ type: "text", text: PALETTE_SYSTEM_PROMPT }]`
  - `messages: [{ role: "user", content: "Design a palette for: ${description}" }]`
  - `effort: config.effort`
  - `maxTokens: PALETTE_MAX_TOKENS` (**800** today, `coachController.js:20`)
  - `outputFormat: { type: "json_schema", schema: PALETTE_JSON_SCHEMA }` → Anthropic `output_config.format` (`provider.js:202-205`)
- Response parse: concatenate text blocks, `JSON.parse` (`coachController.js:209-217`). Invalid JSON → **502** `{ error: "palette_invalid", errors: ["The model did not return a palette."] }`.
- `message.stop_reason === "refusal"` → **422** `{ error: "palette_refused" }` (`coachController.js:206-208`).
- `validatePalette` is authoritative and never repairs (`palette.js:154-169`). Fail → **422** `{ error: "palette_invalid", errors: first 6 }`.
- Success → `{ palette, source }`. Nothing persisted; client keeps it per device (`coachController.js:167-170,224`).

**`palette_truncated` does not exist in this tree.** `AppearancePage.jsx:54-57` handles `palette_invalid` and `palette_refused` only. AI10 will add a distinct truncation code **before** `JSON.parse` when `stop_reason === "max_tokens"` (`docs/tasks/ai10-ai-layer-live-proof.md:77-81`). It does not mandate the string `palette_truncated`; it says "a distinct error code (not `palette_invalid`)" following the `palette_refused` shape.

Provider failures on this path → 502 `{ error: err.code, message }` (`coachController.js:226-228`).

### 1.5 Unit tests that pin provider behavior

Unit lane is `server/test/lib/**` + `server/test/analytics/**` (`jest.config.js:9-14`). Controllers / routes are **never** loaded by `test:unit` (`docs/HANDOFF.md:257-260`). There is **no** `getCoachConfig` test and **no** `completeAnthropic` / palette-controller test.

**`server/test/lib/coachProvider.test.js`** (the one that pins the live adapter):

| Lines | Asserts |
|---|---|
| 32-43 | `text_delta` → `{ type: "text", text }`; `content_block_start`, `ping`, `thinking_delta` → `null`. |
| 45-54 | `message_delta` carries `stopReason: "refusal"` + usage; `error.overloaded_error` → `{ type: "error", code: "overloaded" }`. |
| 56-59 | Malformed / comment-only SSE blocks → `null` (no throw). |
| 63-75 | `iterateSse` reassembles events split across byte chunks; types `start, text, text, stop`; concatenated text `"Hello"`; `stopReason: "end_turn"`. |
| 79-118 | `streamAnthropic` POST goes to `https://api.anthropic.com/v1/messages`, headers `x-api-key` + `anthropic-version: 2023-06-01`, body `{ model, max_tokens: 500, stream: true, output_config: { effort: "medium" } }`, **`thinking` is undefined**, yields text + stop. |
| 120-140 | HTTP 401 throws `CoachProviderError` `{ code: "invalid_key", status: 401 }` before any yield. |
| 142-148 | `mapProviderStatus`: 429→`rate_limited`, 529→`overloaded`, 404→`unknown_model`, 503→`provider_error`. |
| 161-168 | Mock narrative starts with `**Mock coach**`, quotes compacted numbers, never pretends to be the model. |
| 170-178 | Mock stream is `start` → text chunks → `stop { stopReason: "end_turn" }`. |

**`server/test/lib/coachKeyResolver.test.js`:**

| Lines | Asserts |
|---|---|
| 6-13 | BYO `sk-ant-...` wins over hosted, even when `entitled: false`. |
| 15-27 | Hosted requires entitlement; empty BYO + not entitled → `not_entitled`. |
| 29-35 | No key → `no_key`. |
| 37-41 | `"hunter2"` as BYO → `bad_key_format` (never reaches provider). All fixtures are `sk-ant-...`. |

**Adjacent (not the HTTP adapter, but they pin the contract a Cursor provider must still satisfy):**

- `coachRequest.test.js:8-66` — question required / 1000-char cap; defaults lbs / no focus / no range; date-only range; view + session focus.
- `coachRequest.test.js:69-95` — history merge / drop rules.
- `coachPrompt.test.js:53-98` — compacted summary shape; no raw sets.
- `coachPrompt.test.js:111-123` — system blocks: persona, cached data, framing; `cache_control.ephemeral` on block 2.
- `coachPrompt.test.js:148-162` — messages = history + question.
- `coachPalette.test.js` — validator / schema / mock palette. **Does not call a provider.**

### 1.6 Server module system and ESM-only deps

The server is **CommonJS**. `server/package.json` has no `"type": "module"` and no `engines` field. Entry is `require("./app")` (`server.js:2`). Every coach file uses `module.exports` / `require`.

How current ESM-only deps are loaded:

| Package | Declared? | How loaded | Why it boots |
|---|---|---|---|
| `jose` ^6.2.8 | Yes (`package.json:32`) | Dynamic `import("jose")` in `tokenVerifier.js:7,43-46` | `import()` works on any modern Node. AI4 avoided top-level `require("jose")` after it broke on ESM. |
| `zod` 4.4.3 | **No** — phantom transitive of `@modelcontextprotocol/sdk` (`HANDOFF.md:235-237,549-552`) | `const { z } = require("zod")` at `mcpServer.js:1`, pulled in at boot via `app.js:10` | Zod 4 is `"type": "module"`. `require()` of ESM works only on **Node >= 22.12**. |
| `@modelcontextprotocol/sdk` | Yes | CJS `require(...)` (`mcpServer.js:2-5`) | v1, chosen because v2 is ESM-only (`docs/tasks/QUEUE.md` AI3 notes). |

`docs/HANDOFF.md:78` records prod Render Node **>= 22.12** (Seth checked Sept 25). Nothing pins Node in-repo (`HANDOFF.md:91,#14`).

---

## Part 2 — `@cursor/sdk` facts from official docs

Verified against:

- https://cursor.com/docs/sdk/typescript (and the `.md` twin)
- https://cursor.com/docs/api
- https://www.npmjs.com/package/@cursor/sdk (v1.0.32, updated 2026-09-22)
- https://cdn.jsdelivr.net/npm/@cursor/sdk@1.0.32/package.json
- https://cdn.jsdelivr.net/npm/@cursor/sdk@1.0.32/dist/esm/options.d.ts
- https://cursor.com/docs/models-and-pricing
- https://cursor.com/docs/cloud-agent
- https://www.cursor.com/privacy-overview
- https://cursor.com/terms-of-service
- https://cursor.com/docs/cloud-agent/security-network (Privacy Mode + Cloud Agents)

Skill file `C:\Users\Sethy\.cursor\skills-cursor\sdk\SKILL.md` was used as a pointer only; claims below are from the URLs above unless marked UNVERIFIED.

### 2.1 Package: ESM-only or dual? `require()`? Node floor?

**Dual.** `@cursor/sdk@1.0.32` `package.json`:

- `"type": "module"`
- `"engines": { "node": ">=22.13" }`
- `exports["."].require` → `./dist/cjs/index.js`
- `exports["."].import` → `./dist/esm/index.js`
- CJS build exists (jsDelivr served `dist/cjs/index.js`).

So a CommonJS server can `require("@cursor/sdk")` **via the published CJS export**, not only via Node's `require(esm)`. Official docs still describe it as a Node-first package and do not document a CommonJS recipe; they show `import { Agent } from "@cursor/sdk"`. https://cursor.com/docs/sdk/typescript

**Node floor: 22.13+** (package `engines` + official Runtime support section). That is **one minor above** the 22.12 floor this repo currently relies on for `require("zod")`. If Render is 22.12.x and not 22.13+, `@cursor/sdk` is out of its documented engine range. UNVERIFIED: exact prod Render Node patch (HANDOFF only records `>= 22.12`).

npm: https://www.npmjs.com/package/@cursor/sdk — weekly downloads ~546k; license `SEE LICENSE IN LICENSE.md`; docs link on the npm README is `https://cursor.com/docs/api/sdk/typescript` (same content family as `/docs/sdk/typescript`).

### 2.2 Local runtime: subprocess? binary? disk? Render?

Official: **local = agent loop inline in the Node process; files from disk.** "Local" is not a local model — inference is always Cursor-hosted. https://cursor.com/docs/sdk/typescript (Overview)

It **ships** per-platform optional native packages for sandboxing and ripgrep (`@cursor/sdk-linux-x64`, `linux-arm64`, `darwin-*`, `win32-x64` in `optionalDependencies`). Official text: "Native binaries can't live inside a JavaScript bundle. Sandboxing and the built-in ripgrep ship in the per-platform `@cursor/sdk--` packages." Without them, search falls back to `rg` on PATH; enabling `sandboxOptions` throws `ConfigurationError`. Importing the package does **not** eagerly load the local agent stack; the local executor loads on first local acquire.

Official does **not** say the TypeScript SDK downloads a binary at runtime. Build scripts (`prepare:rg`) are publish-time. UNVERIFIED: whether first `acquire` fetches anything extra from Cursor besides inference HTTP.

Disk needs for local:

- `local.cwd` — working directory (rules/skills/workspace scan). Default store is **on-disk SQLite via `node:sqlite`** (under the workspace state root / home). If `node:sqlite` is missing, `Agent.create()` throws `ConfigurationError` unless you pass `JsonlLocalAgentStore` or another `local.store`. https://cursor.com/docs/sdk/typescript (Local agent stores, Known limitations)
- Sandbox default is **off**. On Linux, sandbox uses `bubblewrap` + the helper binary.

**Render (Linux, ephemeral FS):**

- Linux optional binary should install if optional deps are not omitted (`npm install --omit=optional` would drop it).
- Ephemeral disk is fine for one-shot create → send → dispose if the store lives under `/tmp` (pass `JsonlLocalAgentStore("/tmp/...")` to avoid depending on `node:sqlite` / home).
- A production web process can run the local loop **in-process**. That is the documented local runtime.
- **Do not point `cwd` at the LogChamp repo** if the hosted coach should not see application source. Use a dedicated empty directory.
- Cloud runtime would avoid local disk entirely, but **`systemPrompt`, `tools`, and `disallowedTools` are local-only** and throw `ConfigurationError` when combined with `cloud` (`options.d.ts` + Known limitations). A text-only coach with our persona **must be local**.

UNVERIFIED: whether Render's Node includes `node:sqlite` (it should on 22.13+). Safer to pin `JsonlLocalAgentStore` on `/tmp`.

### 2.3 `Agent.create` options

Documented `AgentOptions` (https://cursor.com/docs/sdk/typescript Configuration reference + `options.d.ts`):

**Model ids**

- Required before first **local** `send()`. Cloud falls back to a server default if omitted.
- Discover via `Cursor.models.list({ apiKey })`. Do not hard-code unusual ids.
- `{ id: "composer-2.5" }` is the current documented default example. `composer-2` / `composer-2-fast` reroute to 2.5.
- `{ id: "auto" }` = server-selected Auto fallback.
- `{ id: "auto-smart", params: [{ id: "optimize_for", value: "cost"|"balanced"|"intelligence" }] }` = Cursor Router. Teams/Enterprise; must be enabled; **always pass `optimize_for`**. Cost follows bundled Auto pricing; Balance/Intelligence bill at the routed model's rate. https://cursor.com/docs/sdk/typescript (Cursor Router)
- Per-model `params` (effort, `fast`, etc.) come from the catalog. Composer 2.5 documents a `fast` boolean param.

**`systemPrompt`**

- Replaces Cursor's built-in main-loop prompt. Tool schemas, rules, and skills **still load**. Subagents keep their own prompts.
- Local only. Non-empty. Not persisted across `resume`.
- **Gated per account.** Without access, first `send()` fails naming `--system-prompt` / `InvalidArgument`. https://cursor.com/docs/sdk/typescript (Replacing the system prompt); `options.d.ts` systemPrompt JSDoc.

**Tools**

- `tools: undefined` → standard toolset.
- **`tools: []` → no built-in tools; model can only respond with text.** Official, not a fallback. https://cursor.com/docs/sdk/typescript (Restricting the toolset); `options.d.ts` AgentOptions.tools.
- `disallowedTools: [...]` removes named tools; deny wins if both are set.
- Local only; not persisted on resume.
- Curated `ToolName` literals (`options.d.ts`): `shell`, `read`, `edit`, `grep`, `glob`, `ls`, `task`, `mcp`, `webSearch`, `delete`, `readLints`, `webFetch`, `semSearch`, `updateTodos`, `readTodos`, `askQuestion`, `await`, `generateImage`, `applyAgentDiff`. Plus open `(string & {})` for proto names (e.g. `web_search_tool_call`). Unknown names throw `ConfigurationError` listing valid names. This is **not** claimed to be the complete runtime vocabulary.
- Capability groups: `"shell"` includes stdin writes; `"mcp"` is the whole MCP family including `customTools`; `"task"` gates subagents.

**Turning off MCP / rules / workspace**

- Omit `mcpServers`. Without `local.settingSources`, **only inline servers load** (official). So omit `settingSources` (do not pass `"project"` / `"user"` / `"all"`).
- Cloud **always** loads project/team/plugins and ignores `settingSources`. Another reason not to use cloud for this coach.
- `tools: []` disables built-in tools including MCP/shell/task.
- Rules/skills still conceptually load from `cwd` if `.cursor/` / `AGENTS.md` exist. Use an empty scratch `cwd` so there is nothing to load.
- Cannot turn off the fact that this is an **agent SDK**, not a chat-completions API (https://cursor.com/docs/api). Even with `tools: []`, it is still a Cursor agent run billed as such.

### 2.4 Streaming, completion, truncation, errors, quota

`run.stream()` yields `SDKMessage` (https://cursor.com/docs/sdk/typescript Stream events):

| `type` | What |
|---|---|
| `system` | Init once; `model?`, `tools?` |
| `user` | Echo of the prompt |
| `assistant` | Model text: `message.content[]` of `text` / `tool_use` blocks |
| `thinking` | Reasoning text |
| `tool_call` | Tool lifecycle; `truncated?` flags oversized args/result |
| `status` | Cloud lifecycle: CREATING/RUNNING/FINISHED/ERROR/CANCELLED/EXPIRED |
| `task` | Task milestones |
| `request` | Awaiting input/approval |
| `usage` | Per-turn `TokenUsage` at turn end |

**Assistant text on `run.stream()`:** each `assistant` event carries `message.content` text blocks. Official streaming sample writes `block.text` as events arrive. That is **not** documented as token-by-token on `stream()`. **Token-level incremental text** is `send({ onDelta })` where `update.type === "text-delta"` (and `thinking-delta`). https://cursor.com/docs/sdk/typescript (Streaming raw deltas)

**Completion:** always `await run.wait()`. Result `{ status: "finished"|"error"|"cancelled", result?: string, error?: { message, code? }, usage?, durationMs?, model? }`. Skipping `wait()` leaks watchers (skill; matches official "result data lives on the Run after the stream completes — use wait()").

**Truncation:** no Anthropic-style `stop_reason: "max_tokens"` on this API. Closest official signals: `tool_call.truncated`, run `status: "error"` + `error.code`, or a short `result.result`. UNVERIFIED: a dedicated "output truncated" code for assistant text.

**Errors (startup, thrown):** all extend `CursorSdkError` (alias `CursorAgentError`). Fields: `isRetryable`, `code?`, `status?`, `cause?`, `endpoint?`, `requestId?`, `operation?`. Classes: `AuthenticationError`, `RateLimitError` ("Rate limit exceeded" **or** "Usage limit exceeded"), `ConfigurationError`, `AgentBusyError`, `NetworkError`, `UnknownAgentError`, etc. https://cursor.com/docs/sdk/typescript (Errors)

**Quota / usage exhaustion:** official class is `RateLimitError` covering burst **and** monthly cap. `isRetryable: true` for transient cases; monthly cap → raise the plan limit. No documented `quota_exhausted` string. HTTP APIs use 429 (https://cursor.com/docs/api). UNVERIFIED: exact `error.code` string for monthly-cap vs burst.

**Run failures (not thrown):** `result.status === "error"` with `result.error { message, code? }`. Different from a thrown `CursorSdkError` (run never started).

### 2.5 Per-request lifecycle

- `Agent` is a durable conversation container. `send()` is one run. Follow-ups reuse context.
- `Agent.prompt(message, options)` = create + send + wait + dispose (one-shot).
- For isolated coach questions: **create one agent per question** (or `Agent.prompt`) unless you want thread memory. Our `/coach/ask` already sends `history` in the prompt, so SDK-side reuse is optional and would double-store context.
- Dispose: `await using agent = await Agent.create(...)` or `await agent[Symbol.asyncDispose]()`. `agent.close()` starts disposal without awaiting. Official: "Always dispose agents when done."
- Local persist: SQLite/JSONL under cwd/home so `resume` survives process restart. One-shot + dispose still writes unless you use an in-memory custom store (interface exists; UNVERIFIED whether an official in-memory store ships).
- **Typical latency:** not documented as a number. Official: resolving a local workspace (rules, skills, MCP, ignore files) is "the slowest part of a local agent's first turn"; `prewarmLocalWorkspace()` exists for hosts that know the cwd. UNVERIFIED: p50 for a tools-off one-shot.
- **Concurrency:** cloud `AgentBusyError` if you `send()` while the same agent is CREATING/RUNNING (`isRetryable: false`). Local: no `agent_busy`; use `send({ local: { force: true } })` to expire a stuck run. No documented process-wide concurrency cap for local SDK. Generic API default 20 req/min unless an endpoint says otherwise (https://cursor.com/docs/api) — UNVERIFIED whether local SDK inference is that limiter or a different pool.

### 2.6 Billing: user key vs service account; included pool vs usage-based; Privacy Mode

Official SDK (https://cursor.com/docs/sdk/typescript Usage and billing):

- Accepts **user API keys** (Dashboard → API Keys) and **team service-account keys**. Team Admin keys are **not** supported.
- User keys bill to that user's plan. Service-account keys bill to the owning team.
- **SDK runs follow the same pricing, request pools, and Privacy Mode rules as the IDE and Cloud Agents.** Spend appears under the SDK tag.
- `agent.getUsage()`: `chargedCents` is **0 for plan-included, BYOK, and credit-grant usage**.
- Start plan (India) **does not include the Cursor SDK** (https://cursor.com/docs/models-and-pricing). Pro and above do.

**Contrast with Cloud Agents API / Cloud Agents product:**

- Official Cloud Agents product: "charged at API pricing for the selected model" and "You'll be asked to set a spend limit when you first start using them." Paid plan required. https://cursor.com/docs/cloud-agent (Billing)
- Official API overview lists Cloud Agents API as **Beta (All Plans)** and the TypeScript SDK as **All users**. They are "not a standalone model-inference or chat-completions API." https://cursor.com/docs/api
- Official docs do **not** say "Cloud Agents API requires usage-based pricing and never draws the included pool." `getUsage().chargedCents === 0` for plan-included usage applies to SDK runs including cloud runtime.
- Forum staff later corrected an earlier "skips included usage" claim and said Cloud Agents consume included usage first, but on-demand must still be enabled to start, with ~$2 headroom: https://forum.cursor.com/t/what-is-the-pricing-structure-for-using-cloud-agents/156843/6 — **not official docs**. Treat the "must enable on-demand to start a Cloud Agent" gate as UNVERIFIED-official (forum-only).
- This repo's `HANDOFF-ARCHIVE` note that Cloud Agents API "NEVER draws the included Pro pool" is **not** supported by current official SDK/pricing pages.

**Privacy Mode** (https://www.cursor.com/privacy-overview; Cloud Agents: https://cursor.com/docs/cloud-agent/security-network):

- Privacy Mode on: Cursor does not train on Customer Data; ZDR with providers; abuse classifiers may still store flagged prompts.
- Privacy Mode off: codebase/prompts may be used to improve features and train.
- Requests still go through Cursor's backend even with a customer API key ("that's where we do our final prompt building").
- Cloud Agents work in Privacy Mode; **Privacy Mode (Legacy)** is not supported because agents must store code in the cloud while they run.
- SDK: same Privacy Mode rules as IDE / Cloud Agents. There is **no** per-`Agent.create` privacy flag in the documented options.

### 2.7 Terms / docs about embedding the SDK in a production app that serves end users

Found:

- Cookbook intro lists **"embedded in-product agents"** as an intended starting point. https://cursor.com/docs/sdk/typescript
- `options.d.ts` `enableAgentRetries` JSDoc: "Defaults to true for **headless embedders**."
- SDK is documented for scripts, CI, and backend services.

ToS (https://cursor.com/terms-of-service, updated 2026-09-03):

- No clause that says "you may embed the SDK to serve your own end users."
- No clause that clearly forbids it either.
- Closest restrictions: 1.5(iii) do not "rent, lease, lend, or sell the Service"; 1.5(x) no specially regulated data (HIPAA etc.) as Inputs; 1.6 Beta Services "not for production use" **if** a surface is designated beta.
- 1.1 frames the Service as coding tools for developers.

API overview marks **Cloud Agents API** as Beta; TypeScript SDK is listed as "All users" without a beta badge on that page. The in-repo SDK skill calls both SDKs "public beta" — that is **not** repeated on the official TS page I fetched.

**UNVERIFIED (legal):** whether a hosted LogChamp coach that bills Seth's Cursor key for end-user questions is "selling the Service" under 1.5(iii), or an allowed embed. Official docs do not settle it. Acceptable Use Policy is referenced by the ToS and was **not** fetched (UNVERIFIED).

### 2.8 Minimal verified sample (one-shot, system prompt, no tools, stream, shutdown)

Composed from official snippets (create, `systemPrompt`, `tools: []`, `stream`, `wait`, `await using`). Not executed in this lane.

```typescript
import { Agent } from "@cursor/sdk";

await using agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY, // or the hosted key you pass explicitly
  model: { id: "auto-smart", params: [{ id: "optimize_for", value: "balanced" }] },
  // or model: { id: "composer-2.5" }
  systemPrompt: "You are the LogChamp coach. Quote the given numbers; never invent stats.",
  tools: [], // official: no built-in tools; text only
  local: {
    cwd: "/tmp/logchamp-coach", // empty scratch dir; do not use the app repo
    // omit settingSources so on-disk MCP/rules/plugins do not load
  },
});

const run = await agent.send("How is my bench progressing?\n\nDATA:\n{...compact summary...}");

for await (const event of run.stream()) {
  if (event.type === "assistant") {
    for (const block of event.message.content) {
      if (block.type === "text") process.stdout.write(block.text);
    }
  }
}

const result = await run.wait();
// result.status === "finished" | "error" | "cancelled"
// result.result = final assistant text
// disposed automatically by `await using`
```

Token-level deltas if the coach SSE needs them: pass `onDelta: ({ update }) => { if (update.type === "text-delta") ... }` on `send()`.

One-shot helper (no stream): `await Agent.prompt(question, { apiKey, model, systemPrompt, tools: [], local: { cwd } })` — official; disposes for you.

**Caveats the block must not skip:** `systemPrompt` access is account-gated; `tools`/`systemPrompt` are local-only; always `wait()`; always dispose; pass `apiKey` explicitly in a multi-tenant server (official production note in the skill; official docs say credential order is explicit `apiKey` then `CURSOR_API_KEY`).

---

## Candidate FILES TO TOUCH (for the future Cursor-provider unit)

**Likely required**

| File | Why |
|---|---|
| `server/src/coach/cursorProvider.js` **NEW** | Local `Agent.create` + `tools: []` + `systemPrompt` + map stream/wait onto `{ type: "text"\|"stop"\|"error" }`. Keep Anthropic HTTP out of this file. |
| `server/src/coach/config.js` | Accept `COACH_PROVIDER=cursor` (today only `mock` vs anthropic). Hosted key is a Cursor key, not `sk-ant-`. Model default cannot stay `claude-sonnet-5` for this provider. |
| `server/src/coach/askCoach.js` | `openCoachStream` third branch. AI10's block says **do not touch this file**; a Cursor unit almost certainly must. |
| `server/src/coach/keyResolver.js` | Hosted Cursor key must skip `sk-ant-` regex. BYO path should stay Anthropic-only. |
| `server/src/controllers/coachController.js` | Palette path is hard-wired to `completeAnthropic`. Either a Cursor complete (JSON via `wait().result`) or "palette stays Anthropic/mock". Status `provider` field already returns `config.provider`. |
| `server/test/lib/cursorProvider.test.js` **NEW** (or extend `coachProvider.test.js`) | Pin: `tools: []` in create options, system prompt passed through, stream items match the coach seam, errors map to `CoachProviderError` codes. Mock the SDK; do not call the network. |
| `server/test/lib/coachKeyResolver.test.js` | Hosted Cursor-shaped key + `provider=cursor` (or a resolver flag) must not return `bad_key_format`. |
| `server/.env.example` | Document `COACH_PROVIDER=cursor` and that `COACH_API_KEY` is then a Cursor key. |
| `server/package.json` + lockfile | Add `@cursor/sdk`. **Gate item 5 — ask first.** Also consider declaring `zod` and pinning `engines.node` to `>=22.13` (HANDOFF #14). |

**Likely if copy should stay honest (BYO remains Anthropic; hosted is Cursor)**

| File | Why |
|---|---|
| `client/src/api/coachApi.js` | `invalid_key` copy says "Anthropic rejected that key" — true for BYO, wrong if hosted Cursor 401s. |
| `client/src/pages/profile/AiConnectorPage.jsx` | Status line / BYO UI. BYO can stay Anthropic; hosted-ready copy should not say the server is "not set up" when Cursor is configured. |
| `client/src/pages/profile/AppearancePage.jsx` | Same unavailable copy as the panel. |
| `client/src/components/coach/CoachPanel.jsx` | Unavailable strings name Anthropic. |

**Do not need (provider-agnostic today)**

- `prompt.js` — summary + persona are provider-agnostic **except** `cache_control` is Anthropic-only. A Cursor provider can flatten the three blocks into one `systemPrompt` string. AI10 forbids touching `prompt.js`; flattening can live in the new provider.
- `coachRequest.js`, `palette.js` (validator), `mockProvider.js`, `CoachMarkdown.jsx`, `coachSuggestions.js`, `coachKeyPref.js` (BYO stays `sk-ant-`).

**Adding `@cursor/sdk` is a dependency install (gate item 5).** The block cannot silently `npm install`.

---

## Collision with AI10

AI10 is **DISPATCHED** (HANDOFF #4, Sept 25) on `cursor-lane` / `cursor/ai10`. Its FILES TO TOUCH (`docs/tasks/ai10-ai-layer-live-proof.md:49-57`):

| AI10 file | AI10 change | Collision with a Cursor-provider unit? |
|---|---|---|
| `server/src/coach/config.js` | `MAX_TOKENS` 1500 → 8000 + comment | **YES.** Same file must also grow a `cursor` provider enum and a Cursor default model. Serialize or land AI10 first, then add the enum on top of 8000. |
| `server/src/controllers/coachController.js` | `PALETTE_MAX_TOKENS` 800 → 3000; `stop_reason === "max_tokens"` → distinct palette error (not `palette_invalid`) | **YES** if the Cursor unit also branches palette. If palette stays Anthropic-only, the Cursor unit can skip this file and avoid the collision. |
| `client/src/components/coach/CoachPanel.jsx` | Pre-first-token "working" state; `stopReason === "max_tokens"` notice | **YES** if the Cursor unit edits unavailable-copy. Prefer leaving this file to AI10 and putting Anthropic-specific copy changes in `AiConnectorPage` / `AppearancePage` only, or wait. |
| `client/src/index.css` | New classes for those two states | **YES** only if the Cursor unit adds UI chrome. It should not. |

AI10 explicitly **forbids** touching `provider.js`, `prompt.js`, `askCoach.js`. A Cursor provider **must** touch `askCoach.js` (third branch) and should **not** need `provider.js` (leave Anthropic HTTP intact for BYO).

**Recommendation for the authoring seat:** do not dispatch the Cursor-provider unit until AI10 is landed, **or** write the Cursor unit to avoid AI10's four files (new `cursorProvider.js` + `askCoach.js` + `keyResolver.js` only, palette remains Anthropic/mock). `config.js` is the one unavoidable overlap if `COACH_PROVIDER=cursor` is env-driven.

---

## Block-authoring implications (not a design ruling)

1. **Hosted Cursor + BYO Anthropic is two adapters, one resolver.** Today `resolveCoachKey` assumes both keys are `sk-ant-`. Split: mock / hosted-cursor / byo-anthropic.
2. **Local + `tools: []` + `systemPrompt` + scratch `cwd`** is the only officially documented way to get a text-only coach with our persona. Cloud cannot take `systemPrompt` or `tools`.
3. **Account gate on `systemPrompt`.** A hosted key whose account has not enabled that feature fails on first `send()`. The smoke must prove this, not assume it.
4. **Node 22.13 vs this repo's 22.12 proof.** Pin Node or confirm Render is 22.13+ before the unit lands.
5. **This is an agent SDK, not Messages API.** No `max_tokens` / `effort` / `output_config` / `stop_reason` parity. Map `RateLimitError` → `rate_limited`, `AuthenticationError` → `invalid_key`, `result.status === "error"` → `provider_error`. Truncation detection is UNVERIFIED and must not be specified as Anthropic `max_tokens`.
6. **Do not install the package in the recon lane.** Adding `@cursor/sdk` is gate item 5.

---

## UNVERIFIED checklist

- Exact prod/staging Render Node version (only `>= 22.12` is recorded).
- Whether first local `acquire` downloads extra artifacts beyond optionalDependencies.
- Whether `node:sqlite` exists on Render's Node image.
- Token-level vs whole-message behavior of `run.stream()` `assistant` events (official shows writing `block.text` per event; `onDelta` `text-delta` is the documented incremental path).
- A dedicated assistant-text truncation code equivalent to Anthropic `max_tokens`.
- Exact `RateLimitError.code` for monthly cap vs burst.
- Typical latency / concurrency limits for local tools-off runs.
- Whether Cloud Agents **API** (REST `/v1/agents`) still requires on-demand billing to start (forum yes; official product page only says "set a spend limit").
- Legal clearance to serve end users through a team/user Cursor key (ToS silent; AUP not fetched).
- Whether Seth's Cursor account has `systemPrompt` access.
- Whether `tools: []` also suppresses rules/skills/`<user_info>` or only built-in tools (official: systemPrompt removes coding identity; "tool schemas, rules, and skills still load").
- AI10 working-tree contents on `cursor-lane` (this lane has not seen that diff).
