# TASK AI3: the remote MCP server and its four read-only tools

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Third unit of the AI connector wave (`docs/specs/ai-layer.md` section 4.1). AI1
built consent; AI2 built the perimeter (discovery document, Bearer guard, scope
and consent enforcement, rate limiting) with a swappable token verifier whose v1
implementation accepts an ordinary LogChamp Bearer token. This unit mounts the
actual MCP server behind that guard and exposes four read-only tools over the
analytics the app already computes.

**The hard boundary from spec section 2, restated because it is this unit's
whole point: the deterministic engine computes EVERY number; the model only
narrates.** A tool that returned raw sets and let the model do arithmetic would
break the contract silently and produce confident wrong answers with LogChamp's
name on them. Tool outputs are summary-shaped by construction. There is no tool
in this unit that returns individual `WorkoutSet` rows, and none that accepts a
write.

Grounding from the AIR1/AIR3 recon (August 4). Read all six - four of them
correct claims the spec itself gets wrong:

1. **Target the `2025-11-25` MCP protocol revision, not the current one.** The
   latest published revision is `2026-07-28`, but Anthropic's connector docs
   still list support only through `2025-11-25`, and `2026-07-28` changes the
   transport incompatibly (POST-only, no protocol-level sessions, new required
   headers). Building against the newest spec would produce a server today's
   Claude cannot talk to. This is a deliberate, dated decision - record it in
   the delivery report so the next reader knows it was chosen, not missed.
2. **Use `@modelcontextprotocol/sdk` (the v1 line, currently 1.30.0), NOT the
   `@modelcontextprotocol/server` v2 packages.** The v2 packages are ESM-only
   and require Node >= 20; `server/package.json` declares no `"type": "module"`
   and no `engines`, so the server is CommonJS. The v1 package is dual
   CJS/ESM and needs only Node >= 18. Picking v2 would force an ESM sidecar for
   no benefit, since v2 also targets the transport revision Claude cannot use.
3. **There is no `/api` prefix.** Routers mount at the host root
   (`server/src/app.js:126`). Spec section 4.1 says `/api/analytics/summary`
   and is WRONG - the live path is `/analytics/summary`.
4. **`GET /analytics/summary` requires BOTH `from` and `to`** and 400s without
   them (`analyticsController.js:106-124`). A date-only `to` is widened to
   end-of-day UTC (`:126-136`). Its response carries
   `meta: { effortCoverage, seriesGranularity, honestyNotes }`
   (`summary.js:143-157, :177`).
5. **`buildExerciseDetail` returns NO `meta` key at all**
   (`exerciseDetail.js:254-272`) - so the coverage/honesty metadata that spec
   section 2 requires to travel WITH the numbers is simply absent on that
   surface. Step 4 below says what to do about it. Do not silently ship a tool
   whose output implies a confidence it cannot support.
6. **The unit lane covers only `server/test/analytics/**` and
   `server/test/lib/**`** (`jest.config.js:11-14`).

FILES TO TOUCH:
- `server/package.json` + `server/package-lock.json`  (ONE dependency)
- `server/src/ai/mcpServer.js`        (new - server construction + tool registration)
- `server/src/ai/toolPayloads.js`     (new - PURE shaping/trimming, no Prisma)
- `server/src/ai/analyticsAccess.js`  (new - the shared data-access layer, see step 2)
- `server/src/controllers/analyticsController.js`  (see step 2 - AUTHORIZED edit)
- `server/src/app.js`                 (mount `/mcp`)
- `server/test/lib/toolPayloads.test.js`  (new)
Do NOT modify anything outside these files.

**DEPENDENCY - approved by Seth on August 4, install exactly one:**
`@modelcontextprotocol/sdk`. Nothing else.

CHANGE:

**1. Mount point.** `POST /mcp` (and `GET /mcp` for the `2025-11-25` transport's
SSE channel), in `server/src/app.js`, guarded by `connectorAuth` from AI2.
Placement: after `express.json()` and after `attachAuthUser`, alongside the
existing router mount. The connector CORS block AI2 added already covers
`/mcp*`; do not add another.

**2. `server/src/ai/analyticsAccess.js` - one data path, two consumers.** The
tools must return the SAME numbers the app's own Analytics screen shows. The
reliable way to guarantee that is for both to run the same code, not two copies
that agree today.

So: extract the Prisma query + `buildSummary(...)` invocation currently inside
`analyticsController.getSummary` into a plain async function in this new module
- something like `loadSummary({ userId, from, to })` returning the built summary
object - and have the controller CALL it. The controller keeps all of its
request parsing, validation, and error responses; only the data-fetch-and-build
core moves. Do the same for the exercise-detail path, reusing the existing
`fetchAllTimeEnrichedSets(userId)` rather than writing a new query.

**Editing `analyticsController.js` is explicitly authorized by this block** and
is not scope creep - it is the mechanism that prevents the connector and the app
from drifting apart. But the edit must be behaviour-preserving: the controller's
HTTP contract, validation, status codes, and response shape are byte-identical
before and after. Prove that in the report by showing the diff, not by asserting
it.

Every function in this module takes `userId` as its first argument and scopes
every query by it. There is no code path in this unit that reads another user's
rows.

**3. `server/src/ai/toolPayloads.js` - PURE, no Prisma, no Express.** This is
the shaping layer, and it is where the size trap is handled.

Claude's tool results cap at roughly 150,000 characters, and a summary for a
long date range is not obviously under that: `perExercise` carries `e1rmSeries`
and `topSetSeries` per exercise, and `perMuscle` carries a `series` array per
muscle. A user with a large roster and a 12-week window can produce a payload
that is silently truncated or rejected - and a truncated JSON payload is worse
than a small one, because the model will still try to read it.

Export:
- `trimSummaryForTool(summary, { maxExercises })` -> the same object with
  `perExercise` capped to the `maxExercises` most relevant entries (most recent
  activity first) and a `truncation` field stating plainly what was dropped and
  how many were omitted. Never drop `meta`, `range`, `workoutCount`, or
  `balance`.
- `estimatePayloadSize(obj)` -> the character length of its JSON serialization.
- `withHonestyNote(payload, note)` -> attaches a `honestyNotes` array entry
  without clobbering an existing one.

Every tool result passes through `estimatePayloadSize` before returning; if it
still exceeds a named constant (set it below Claude's limit with real headroom -
120,000 characters is the right order), trim further and say so in the
`truncation` field. **Never return a payload you know is over the limit, and
never truncate silently.**

**4. `server/src/ai/mcpServer.js` - the four tools.** Register exactly these,
all read-only, all scoped to `req.connectorUserId` from AI2's guard. No tool
takes a user id as an input parameter - the identity comes from the token, never
from the model.

| Tool | Input | Returns |
| --- | --- | --- |
| `get_training_summary` | `from`, `to` (ISO dates; both required, matching the endpoint) | the trimmed summary object, `meta` intact |
| `get_exercise_detail` | exactly one of `exerciseId` / `userExerciseId`, plus optional `from`/`to` | one exercise's detail |
| `list_exercises` | optional `activeOnly` (default true) | the roster, most-recently-trained first |
| `get_recent_sessions` | optional `limit` (default 10, max 50) | session HEADERS - date, name, exercise count, set count. **Never the sets themselves.** |

Validate inputs the same way the controllers do and return a clear error result
rather than throwing: a bad date is a tool result saying the date was bad, not a
500.

**On finding 5 (no `meta` on exercise detail):** `get_exercise_detail` must
attach the honesty context itself rather than shipping bare numbers. Compute
nothing new - carry across the `meta.effortCoverage` from the same user's
summary over the same window, or, when that is unavailable, attach an explicit
note that effort coverage is unknown for this view. An absent caveat reads as a
confident number; that is the failure this wave exists to avoid.

**Tool descriptions are prompt surface - they are product copy, not incidental
strings** (spec section 4.1). Each description MUST state, in plain language,
(a) what the tool returns, (b) that the numbers are already computed and must
not be recalculated or re-derived by the model, and (c) that coverage caveats in
the payload are to be surfaced to the user rather than smoothed over. Write them
as prose a person would read, not as schema comments.

**5. Session/transport handling.** Use the SDK's Streamable HTTP transport for
the `2025-11-25` revision. Construct a fresh server instance per request rather
than sharing one across users - a shared instance is how one user's context
leaks into another's, and this server is multi-tenant by definition. If the SDK
version you install makes per-request construction awkward, say so in the report
and stop rather than sharing state across identities.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with `server/test/lib/toolPayloads.test.js`
  running in it.
- `toolPayloads.test.js` asserts, at minimum:
  - `trimSummaryForTool` on a summary with more exercises than `maxExercises`
    returns exactly `maxExercises` entries in `perExercise` AND a `truncation`
    field naming how many were dropped
  - `trimSummaryForTool` never removes `meta`, `range`, `workoutCount`, or
    `balance` - assert each key is still present after trimming
  - a summary already under the cap round-trips with `perExercise` unchanged and
    no `truncation` field
  - `estimatePayloadSize` on a known small object returns its exact
    `JSON.stringify(...).length`
- `node --check` passes on every edited/added file under `server/src/`. Paste
  the output.
- **The controller extraction is behaviour-preserving.** Show the full diff of
  `analyticsController.js` in the report, and state explicitly that no status
  code, validation branch, or response key changed.
- `grep -rn "userId" server/src/ai/analyticsAccess.js` shows every exported
  function takes and uses it. Paste the grep.
- No tool schema accepts a user id, account id, or email as an input parameter -
  show the grep over `server/src/ai/mcpServer.js`.
- `grep -rn "workoutSet\|WorkoutSet" server/src/ai/mcpServer.js` returns NOTHING
  - no tool returns raw set rows.
- `server/package.json` gained exactly one dependency. Paste the dependency diff.
- Client `npm run build` compiles with no errors (regression check; this unit
  touches no client code).

**LANE GAP, and how to close part of it.** No runnable lane exercises an Express
route or an MCP handshake. The pure shaping layer is genuinely gated by the unit
lane; everything else is not. **If you can start a local dev server and drive
`/mcp` with `curl` using a LogChamp Bearer token** - which AI2's v1 verifier
exists precisely to allow - do it, and paste the verbatim request and response
for at least a `tools/list` call and one `get_training_summary` call. That
evidence is worth more than the rest of this list combined. If you cannot,
say so plainly rather than implying coverage you do not have.

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
