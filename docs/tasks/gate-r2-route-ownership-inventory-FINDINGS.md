# Gate R2 — route and ownership inventory

Wave `7d3b91e...HEAD`. Route list is taken from
`git diff 7d3b91e...HEAD -- server/src/routes/ server/src/app.js`.
Mount prefixes are `server/src/routes/index.js`. `attachAuthUser` runs for
every request (`server/src/app.js:180`) and sets `req.authUserId` before
route middleware. `authRequired` (`server/src/middleware/authRequired.js:1-8`)
rejects when that id is missing.

Global limiters in front of the new mounts:

- `app.use("/ai", aiRateLimit)` — `server/src/app.js:230`, 300 requests / 15 min (`server/src/app.js:23-24`, `server/src/app.js:206-212`), key `aiRateLimitKey` (`server/src/ai/rateLimitKeys.js:36-39`).
- `app.use("/coach", coachRateLimit)` — `server/src/app.js:231`, 40 requests / 15 min (`server/src/app.js:38-39`, `server/src/app.js:217-227`), same key function.

No rate limiter was added for `/block-templates` or `/block-runs` or `/sessions`.

## Summary

| Handler | Entry | Verdict |
| --- | --- | --- |
| `setBlockDraftsAllowed` | `PUT /ai/consent/block-drafts` | SCOPED |
| `createBlockRun` | `POST /block-runs` | SCOPED |
| `getActiveBlockRun` | `GET /block-runs/active` | SCOPED |
| `getLeftOffRuns` | `GET /block-runs/left-off` | SCOPED |
| `endBlockRun` | `POST /block-runs/:id/end` | SCOPED |
| `getBlockFormat` | `GET /block-templates/format` | PUBLIC-READ |
| `previewBlockImport` | `POST /block-templates/import/preview` | SCOPED |
| `importBlock` | `POST /block-templates/import` | SCOPED |
| `exportBlockTemplate` | `GET /block-templates/:id/export` | PUBLIC-READ |
| `acceptBlockTemplate` | `POST /block-templates/:id/accept` | SCOPED |
| `draftBlock` | `POST /coach/block-draft` | SCOPED |
| `importMap` | `POST /coach/import-map` | SCOPED |
| `importFix` | `POST /coach/import-fix` | SCOPED |
| `startSessionFromBlock` | `POST /sessions/start-from-block` | SCOPED |
| `get_block_format` | MCP | PUBLIC-READ |
| `create_block_draft` | MCP | SCOPED |
| `get_training_summary` | MCP (data path changed) | SCOPED |
| `get_exercise_detail` | MCP (data path changed) | SCOPED |
| `list_exercises` | MCP (data path changed) | SCOPED |
| `searchExercises` | `GET /exercises/search` (handler changed; route file not in the diff) | SCOPED |

No handler in this map is UNSCOPED or UNSURE. Two follow-up reads and two writes omit `userId` from their own `where` and rely on an earlier user-scoped read. Those are called out in sections 3 and 4.

## 1. Routes added or changed

Paths below are the mounted path (`server/src/routes/index.js:56-62`).

### `PUT /ai/consent/block-drafts`

- Registration: `server/src/routes/aiRoutes.js:21`.
- Middleware: `aiRateLimit` (`server/src/app.js:230`), then `authRequired`.
- Handler: `setBlockDraftsAllowed` — `server/src/controllers/aiController.js:127`.

### `POST /block-runs`

- Registration: `server/src/routes/blockRunRoutes.js:12`. Mount: `server/src/routes/index.js:57`.
- Middleware: `authRequired`.
- Handler: `createBlockRun` — `server/src/controllers/blockRunController.js:16`.

### `GET /block-runs/active`

- Registration: `server/src/routes/blockRunRoutes.js:13`.
- Middleware: `authRequired`.
- Handler: `getActiveBlockRun` — `server/src/controllers/blockRunController.js:164`.

### `GET /block-runs/left-off`

- Registration: `server/src/routes/blockRunRoutes.js:14`.
- Middleware: `authRequired`.
- Handler: `getLeftOffRuns` — `server/src/controllers/blockRunController.js:214`.

### `POST /block-runs/:id/end`

- Registration: `server/src/routes/blockRunRoutes.js:15`.
- Middleware: `authRequired`.
- Handler: `endBlockRun` — `server/src/controllers/blockRunController.js:306`.

### `GET /block-templates/format`

- Registration: `server/src/routes/blockTemplateRoutes.js:23`. Mount: `server/src/routes/index.js:56`.
- Middleware: none on the route. `attachAuthUser` still runs; the handler ignores `req`.
- Handler: `getBlockFormat` — `server/src/controllers/blockImportController.js:25`.

### `POST /block-templates/import/preview`

- Registration: `server/src/routes/blockTemplateRoutes.js:24`.
- Middleware: `authRequired`. Body parser: `express.json({ limit: "2mb" })` mounted at `/block-templates/import` (`server/src/app.js:137`), which is a prefix of this path.
- Handler: `previewBlockImport` — `server/src/controllers/blockImportController.js:71`.

### `POST /block-templates/import`

- Registration: `server/src/routes/blockTemplateRoutes.js:25`.
- Middleware: `authRequired`. Same 2 MB JSON parser (`server/src/app.js:137`).
- Handler: `importBlock` — `server/src/controllers/blockImportController.js:126`.

### `GET /block-templates/:id/export`

- Registration: `server/src/routes/blockTemplateRoutes.js:30`.
- Middleware: none on the route. Optional identity comes only from `attachAuthUser`.
- Handler: `exportBlockTemplate` — `server/src/controllers/blockImportController.js:163`.

### `POST /block-templates/:id/accept`

- Registration: `server/src/routes/blockTemplateRoutes.js:35`.
- Middleware: `authRequired`.
- Handler: `acceptBlockTemplate` — `server/src/controllers/blockTemplateController.js:428`.

### `POST /coach/block-draft`

- Registration: `server/src/routes/coachRoutes.js:17`. Mount: `server/src/routes/index.js:62`.
- Middleware: `coachRateLimit` (`server/src/app.js:231`), then `authRequired`.
- Handler: `draftBlock` — `server/src/controllers/coachController.js:536`.

### `POST /coach/import-map`

- Registration: `server/src/routes/coachRoutes.js:18`.
- Middleware: `coachRateLimit`, then `authRequired`.
- Handler: `importMap` — `server/src/controllers/coachController.js:678`.

### `POST /coach/import-fix`

- Registration: `server/src/routes/coachRoutes.js:19`.
- Middleware: `coachRateLimit`, then `authRequired`.
- Handler: `importFix` — `server/src/controllers/coachController.js:1017`.

### `POST /sessions/start-from-block`

- Registration: `server/src/routes/sessionRoutes.js:25`. Mount: `server/src/routes/index.js:58`.
- Middleware: `authRequired`.
- Handler: `startSessionFromBlock` — `server/src/controllers/sessionController.js:350`.

### Not a route: import body parser

`server/src/app.js:137` registers `express.json({ limit: "2mb" })` on `/block-templates/import` before the global parser at `server/src/app.js:138`.

### Handlers the wave edited whose route lines were not in that diff

These are entry points whose files changed under `server/src/controllers/` (or `server/src/ai/`). Their route registration lines did not change.

- `POST /block-templates` — `createBlockTemplate` (`server/src/controllers/blockTemplateController.js:16`) now calls `createBlockTemplateForUser` (`server/src/blocks/blockTemplateStore.js:114`). Route: `server/src/routes/blockTemplateRoutes.js:27`, `authRequired`.
- `PATCH /block-templates/:id` — `updateBlockTemplate` (`server/src/controllers/blockTemplateController.js:153`) gained a draft/public guard at `server/src/controllers/blockTemplateController.js:219-226`. Route: `server/src/routes/blockTemplateRoutes.js:32`, `authRequired`.
- `POST /block-templates/:id/clone` — `cloneBlockTemplate` (`server/src/controllers/blockTemplateController.js:368`) now creates through `createBlockTemplateForUser`. Route: `server/src/routes/blockTemplateRoutes.js:34`, `authRequired`. The source read is still `findUnique` by id only (`server/src/controllers/blockTemplateController.js:387-394`), then `!existing.isPublic && !isOwner` returns 403 (`server/src/controllers/blockTemplateController.js:402-408`). PUBLIC-READ of the source, plus a SCOPED create for the caller.
- `DELETE /ai/consent` — `revokeConsent` (`server/src/controllers/aiController.js:78`) now also writes `blockDraftsAllowedAt: null` (`server/src/controllers/aiController.js:91-96`). Route unchanged: `server/src/routes/aiRoutes.js:20`, `authRequired` plus `aiRateLimit`. `where: { userId }` with `userId = req.authUserId` (`server/src/controllers/aiController.js:79`). SCOPED.
- `GET /exercises/search` — `searchExercises` (`server/src/controllers/exerciseController.js:290`). Route unchanged: `server/src/routes/exerciseRoutes.js:14`, `authRequired`. New raw SQL is in section 5. SCOPED.
- `POST /sessions/start/:templateId` and `GET /sessions/:id` now call `attachBlockContext` (`server/src/controllers/sessionController.js:328` and `:965`). The new read is `resolveBlockContext` (`server/src/controllers/sessionController.js:77-94`): `blockRun.findFirst` `where: { id: session.blockRunId, userId: session.userId }`. SCOPED. `getSessionById` loads the session with `where: { id: sessionId, userId }` first (`server/src/controllers/sessionController.js:924-928`).

## 2. MCP tools added or changed

Identity for every tool is `connectorUserId` closed over by `createMcpServerForUser` (`server/src/ai/mcpServer.js:162`). The HTTP entry `handleMcpRequest` reads `req.connectorUserId` (`server/src/ai/mcpServer.js:460-470`), which `connectorAuth` set. It does not read `req.authUserId`. `loadBoundAccountEmail` loads `user.findUnique({ where: { id: connectorUserId } })` (`server/src/ai/mcpServer.js:91-96`) before the server is built.

`/mcp` middleware (`server/src/app.js:229-235`): `connectorAuthFailureRateLimit`, then `connectorAuth`, then `connectorRateLimit`.

### `get_block_format` (added)

- Registration: `server/src/ai/mcpServer.js:392`.
- Handler: `server/src/ai/mcpServer.js:402-410`.
- User id: not used. Returns static `BLOCK_FORMAT_*` constants. No Prisma.
- Verdict: PUBLIC-READ (no user rows).

### `create_block_draft` (added)

- Registration: `server/src/ai/mcpServer.js:413`.
- Handler: `server/src/ai/mcpServer.js:431-434`. Calls `createDraftForUser(connectorUserId, args.block)`.
- User id: the closure `connectorUserId`. The comment at `server/src/ai/mcpServer.js:432-433` says model-supplied `userId` is ignored. `blockDraftAccess.js:4-5` states the same doctrine.
- Prisma: section 3.

### Tools whose registration did not change, but whose read path did

`server/src/ai/analyticsAccess.js` added `durationSec` and block-plan snapshots. These tools pass `connectorUserId` as the `userId` argument:

- `get_training_summary` — handler `server/src/ai/mcpServer.js:194-203` calls `loadSummary(connectorUserId, ...)`. `loadSummary` is `server/src/ai/analyticsAccess.js:81`.
- `get_exercise_detail` — handler `server/src/ai/mcpServer.js:214` (call at `server/src/ai/mcpServer.js:282`) calls `loadExerciseDetail(connectorUserId, ...)`, which calls `fetchAllTimeEnrichedSets(userId)` (`server/src/ai/analyticsAccess.js:220`). A model-supplied `exerciseId` / `userExerciseId` filters that already-loaded set in memory (`server/src/ai/analyticsAccess.js:221-226`). It is not a Prisma `where` on another user's row.
- `list_exercises` — handler `server/src/ai/mcpServer.js:354-357` calls `loadExerciseRoster(connectorUserId, ...)`, which also uses `fetchAllTimeEnrichedSets` (`server/src/ai/analyticsAccess.js:235`).

`get_recent_sessions` (`server/src/ai/mcpServer.js:362`) does not use the changed helpers. It was not modified.

## 3. Prisma calls per handler

`userId` / `authUserId` below is `req.authUserId` unless the row says otherwise.

### `setBlockDraftsAllowed` (`server/src/controllers/aiController.js:127`)

| Call | Where | Scope |
| --- | --- | --- |
| `aiConsent.findUnique` | `server/src/controllers/aiController.js:139-141` | `where.userId = authUserId` |
| `aiConsent.update` | `server/src/controllers/aiController.js:148-153` | `where.userId = authUserId` |
| `user.findUnique` via `loadConsentPayload` | `server/src/controllers/aiController.js:13-19`, called at `:155` | `where.id = authUserId` |

### `createBlockRun` (`server/src/controllers/blockRunController.js:16`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockTemplate.findFirst` | `server/src/controllers/blockRunController.js:38-47` | `where: { id: blockTemplateId, userId }`. Missing row is 404 at `:49-53`. |
| `blockRun.findFirst` (only when `resumeRunId` is set) | `:62-77` | `where: { id: resumeRunId, userId }`. Mismatch with the template is 404 at `:79-83`. |
| `blockRun.findFirst` (latest run of that template) | `:85-96` | `where: { userId, blockTemplateId }` |
| `blockRun.updateMany` (end other open runs) | `:118-127` | `where: { userId, endedAt: null, id: { not: existing.id } }` |
| `blockRun.update` (clear `endedAt` on the resumed run) | `:129-133` | `where: { id: existing.id }` only. `existing` was loaded with `userId` at `:62-66`, before this write. |
| `blockRun.updateMany` (fresh start) | `:140-148` | `where: { userId, endedAt: null }` |
| `blockRun.create` | `:150-155` | `data.userId` is `authUserId`; `blockTemplateId` is `block.id` from the user-scoped read at `:38-47`. |

The `include` of `blockTemplate` on the resume read (`:68-72`) is the relation off a run already filtered by `userId`.

### `getActiveBlockRun` (`server/src/controllers/blockRunController.js:164`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockRun.findMany` | `server/src/controllers/blockRunController.js:174-193` | `where: { userId, endedAt: null }`. Included `blockTemplate` is that run's relation. |

### `getLeftOffRuns` (`server/src/controllers/blockRunController.js:214`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockTemplate.findMany` | `:224-232` | `where: { userId, isDraft: false }` |
| `blockRun.findMany` | `:241-254` | `where: { userId, blockTemplateId: { in: templateIds } }` and `templateIds` are the rows from `:224-232`. |
| `blockTemplate.findMany` | `:270-272` | `where: { id: { in: ... } }` only. The ids are `blockTemplateId` values from the user-scoped run query at `:241-254`, which itself was limited to the user's templates. No `userId` in this `where`. |
| `workoutSession.findMany` | `:274-277` | `where: { blockRunId: { in: latestEnded run ids } }` only. Those run ids came from `:241-254` (`userId` plus the user's template ids). No `session.userId` in this `where`. |

The only `blockRunId` writers in `server/src` are `startSessionFromBlock` (`server/src/controllers/sessionController.js:409` and `:444`), and both set `userId` to the same `authUserId` that owns the run (`:408` and `:441`).

### `endBlockRun` (`server/src/controllers/blockRunController.js:306`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockRun.findFirst` | `:324-329` | `where: { id: runId, userId }`. 404 at `:331-335` before any write. |
| `blockRun.updateMany` | `:339-348` | `where: { id: existing.id, userId, endedAt: null }` |
| `blockRun.findFirst` | `:349-354` | `where: { id: existing.id, userId }` |

### `getBlockFormat` (`server/src/controllers/blockImportController.js:25`)

No Prisma. Static JSON.

### `previewBlockImport` (`server/src/controllers/blockImportController.js:71`)

| Call | Where | Scope |
| --- | --- | --- |
| `userExercise.findMany` | `server/src/controllers/blockImportController.js:91-93` | `where: { userId }` |

Name resolution uses that index in memory (`:94-95`). No write.

### `importBlock` (`server/src/controllers/blockImportController.js:126`)

Calls `createBlockTemplateForUser(userId, payload, { source: "import" })` at `:149-151`.

| Call | Where | Scope |
| --- | --- | --- |
| `userExercise.findMany` | `server/src/blocks/blockTemplateStore.js:180-182` | `where: { userId }` — the `userId` argument, which the controller passes as `req.authUserId` (`blockImportController.js:128`). |
| `blockTemplate.create` | `server/src/blocks/blockTemplateStore.js:220-225` | `data.userId` set at `:192`. Nested `weeks.create` / workouts / exercises / sets are children of that row (shape from `stampBlockWeeksArray`, `server/src/lib/exerciseIdentity.js:39-58`). |

`stampBlockWeeksArray` overwrites `exerciseId` and `userExerciseId` from the exercise name against the caller's `userExercise` rows (`server/src/lib/exerciseIdentity.js:47-53` via `:4-16`). Client-supplied exercise ids in the import body do not survive that spread.

`formatToCreatePayload` (`server/src/blocks/blockFormatMapping.js:10-66`) does not copy exercise ids. It sets `isPublic: false` (`:15`).

### `exportBlockTemplate` (`server/src/controllers/blockImportController.js:163`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockTemplate.findUnique` | `:183-186` | `where: { id: templateId }` only. This loads any id, including another user's private block, into memory. |

The response gate is after that read (`server/src/controllers/blockImportController.js:192-197`):

```
const isOwner = userId && blockTemplate.userId === userId;
if (!blockTemplate.isPublic && !isOwner) {
  return res.status(403).json({
    error: "You do not have permission to view this block template",
  });
}
```

`isPublic === true` is the public-only condition. A non-owner of a public block gets the formatted tree. A non-owner of a private block gets 403 and the loaded tree is not written to the response. Verdict: PUBLIC-READ.

Included `weeks: blockWeekInclude` (`server/src/blocks/blockTemplateStore.js:34-41`) is the relation off that one template.

### `acceptBlockTemplate` (`server/src/controllers/blockTemplateController.js:428`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockTemplate.findFirst` | `:446-451` | `where: { id: templateId, userId }`. 404 at `:453-457` before the write. |
| `blockTemplate.update` | `:459-469` | `where: { id: templateId }` only. Sets `isDraft: false`. Ownership is the prior read, not this `where`. |

### `draftBlock` (`server/src/controllers/coachController.js:536`)

Persists no block. Prisma:

| Call | Where | Scope |
| --- | --- | --- |
| `user.findUnique` via `loadCoachAccess` | `server/src/coach/askCoach.js:52-56`, called at `coachController.js:555` | `where: { id: userId }` and `userId` is `req.authUserId`. |
| `reserveUses` when the cap applies | `coachController.js:573-578` | See ledger below. `userId` is `req.authUserId`. |
| `loadSummary` when `mode === "generate"` | `coachController.js:582-588` | `loadSummary(req.authUserId, ...)`. Session query `where: { userId, performedAt }` at `server/src/ai/analyticsAccess.js:83-90`. `userExercise.findMany` `where: { userId }` at `:141-143`. Included sets/exercises/plans are relations off those sessions. |
| `settleUses` / `refundUses` | `coachController.js:665-667` | Deletes `coachUsage` by the ids `reserveUses` just inserted. Not request ids. |

`reserveUses` (`server/src/coach/usageLedger.js:21-60`):

| Call | Where | Scope |
| --- | --- | --- |
| `$executeRaw` advisory lock | `server/src/coach/usageLedger.js:25` | Parameter is `userId`. Quoted in section 5. |
| `coachUsage.findMany` | `:30-33` | `where: { userId, createdAt: { gt: windowStart } }` |
| `coachUsage.create` | `:48` | `data: { userId }` |

`settleUses` (`server/src/coach/usageLedger.js:68-84`) and `refundUses` (`:91-105`) call `coachUsage.delete({ where: { id } })`. The id is not constrained by `userId` on the delete. Callers pass `reservedIds` from the reserve return value (`coachController.js:578`, `:724`, `:1077`), not from the body.

### `importMap` (`server/src/controllers/coachController.js:678`)

| Call | Where | Scope |
| --- | --- | --- |
| `loadCoachAccess` | `:696` | Same as draft: `user.findUnique` `where: { id: req.authUserId }` (`server/src/coach/askCoach.js:53-56`). |
| `reserveUses` | `:715-725` | Same ledger, `req.authUserId`, cost `IMPORT_MAP_COST`. |
| `settleUses` / `refundUses` | `:795-797` | Same id-only delete of rows reserved in this request. |

No training-history read. The model sees `sampleForRecipe(text)` from the request body (`:727`), not another user's rows.

### `importFix` (`server/src/controllers/coachController.js:1017`)

| Call | Where | Scope |
| --- | --- | --- |
| `loadCoachAccess` | `:1046` | `user.findUnique` `where: { id: req.authUserId }`. |
| `reserveUses` | `:1066-1077` | Same ledger, `req.authUserId`, cost `IMPORT_FIX_MAX_COST`. |
| `settleUses` / `refundUses` | `:1140-1145` | Same id-only delete. Settle count is `settleCost` from token tiers (`:1111-1112`, `:1141-1142`). |

`completeImportMapRecipe` (`:806`) and `completeBlockConvert` (`:910`) do not call Prisma. They send the request text to the provider.

### `startSessionFromBlock` (`server/src/controllers/sessionController.js:350`)

| Call | Where | Scope |
| --- | --- | --- |
| `blockRun.findFirst` | `:380-392` | `where: { id: blockRunId, userId }`. 404 at `:394-398` before any write. Included `blockTemplate` is that run's relation. |
| `workoutSession.findFirst` (open session for that day) | `:406-415` | `where: { userId, blockRunId: run.id, blockWeekOrder, blockWorkoutOrder, completedAt: null }` |
| `workoutSession.create` | `:439-448` | `data.userId` is `authUserId`. `blockRunId: run.id` from the user-scoped read. |
| `sessionExercise.createMany` | `:451-463` | `workoutSessionId: createdSession.id` (the row just created). `exerciseId` / `userExerciseId` are copied from the owned block tree by `buildSessionFromBlockWorkout` (`server/src/blocks/blockRunLogic.js:50-54`), not taken as ids from the body. |
| `workoutSession.findUnique` | `:466-471` | `where: { id: createdSession.id }` inside the same transaction, after the create. |
| `blockRun.findFirst` via `attachBlockContext` → `resolveBlockContext` | `sessionController.js:474` calls `:121-123`, query at `:82-86` | `where: { id: session.blockRunId, userId: session.userId }` |

`weekOrder` and `workoutOrder` are matched against that owned tree before the create (`sessionController.js:425-436` → `blockRunLogic.js:41-45`). No match returns 404 and does not write.

### `create_block_draft` → `createDraftForUser` (`server/src/ai/blockDraftAccess.js:49`)

`userId` is the `connectorUserId` argument.

| Call | Where | Scope |
| --- | --- | --- |
| `aiConsent.findUnique` | `server/src/ai/blockDraftAccess.js:55` | `where: { userId }` |
| `blockTemplate.count` (daily) | `:80-87` | `where: { userId, source: "connector", createdAt: { gte: since } }` |
| `blockTemplate.count` (open drafts) | `:95-102` | `where: { userId, source: "connector", isDraft: true }` |
| `createBlockTemplateForUser` | `:108-112` | Same store calls as import: `userExercise.findMany` `where: { userId }` (`blockTemplateStore.js:180-182`) and `blockTemplate.create` with `data.userId` (`:192`, `:220-225`). `source: "connector"`, `isDraft: true`. |

### Changed analytics reads (MCP + coach generate)

`fetchAllTimeEnrichedSets` (`server/src/ai/analyticsAccess.js:33-39`):

- `workoutSession.findMany` `where: { userId }` at `:35-37`. Sets and exercise identity are includes.
- `userExercise.findMany` `where: { userId }` at `:39`.

`loadRecentSessions` was not changed: `workoutSession.findMany` `where: { userId }` at `server/src/ai/analyticsAccess.js:255-257`.

### `searchExercises` (`server/src/controllers/exerciseController.js:290`)

| Call | Where | Scope |
| --- | --- | --- |
| `userExercise.findMany` | `:322-324` | `where: { userId }` and `userId` is `req.authUserId` (`:292`). |
| `$queryRaw` | `:325-354` | Both branches filter `ws."userId" = ${userId}` (`:337`) and `bt."userId" = ${userId}` (`:350`). Quoted in section 5. |

## 4. Writes that take an id from the request

| Request id | Handler | Proof it belongs to the user before the write |
| --- | --- | --- |
| `body.blockTemplateId` | `createBlockRun` | `blockTemplate.findFirst({ where: { id: blockTemplateId, userId } })` at `server/src/controllers/blockRunController.js:38-47`. 404 at `:49-53`. The create uses `block.id` from that row (`:150-154`), after the check. |
| `body.resumeRunId` | `createBlockRun` | `blockRun.findFirst({ where: { id: resumeRunId, userId } })` at `:62-66`, plus `existing.blockTemplateId !== blockTemplateId` → 404 at `:79-83`. The later `blockRun.update({ where: { id: existing.id } })` at `:129-133` does not repeat `userId`. The proof is the read at `:62-66`, which is before the transaction write at `:116`. The sibling `updateMany` at `:118-123` does include `userId`. |
| `params.id` (run id) | `endBlockRun` | `blockRun.findFirst({ where: { id: runId, userId } })` at `:324-329`. 404 at `:331-335`. The write `updateMany` at `:339-343` also includes `userId`. |
| `params.id` (template id) | `acceptBlockTemplate` | `blockTemplate.findFirst({ where: { id: templateId, userId } })` at `server/src/controllers/blockTemplateController.js:446-451`. 404 at `:453-457`. The write at `:459-462` is `update({ where: { id: templateId } })` and does not repeat `userId`. Proof is the read, and it is before the write. |
| `body.blockRunId` | `startSessionFromBlock` | `blockRun.findFirst({ where: { id: blockRunId, userId } })` at `server/src/controllers/sessionController.js:380-384`. 404 at `:394-398`. Creates use `run.id` (`:444`) only after that. |
| `body.weekOrder`, `body.workoutOrder` | `startSessionFromBlock` | Not foreign-row ids. `buildSessionFromBlockWorkout` returns null unless both match a week and workout on the run's template (`server/src/blocks/blockRunLogic.js:41-45`). The controller returns 404 at `sessionController.js:432-436` before `workoutSession.create` at `:439`. |
| `params.id` on export | `exportBlockTemplate` | Read, not a write. Gate quoted in section 3 (`blockImportController.js:192-197`). |

`PUT /ai/consent/block-drafts` writes `aiConsent` by `where: { userId }` (`aiController.js:148-149`). The id is `req.authUserId`, not a body or param id.

Import and connector draft do not persist caller-supplied template, run, session, week, or exercise ids. `stampBlockWeeksArray` replaces exercise ids (`server/src/lib/exerciseIdentity.js:47-53`).

`coachUsage.delete({ where: { id } })` (`usageLedger.js:74` and `:97`) uses ids returned by `coachUsage.create` in the same request (`usageLedger.js:48-49`), not ids from the body. The delete `where` has no `userId`.

No write in this map runs before its ownership check.

## 5. Raw SQL added in the wave

`git grep` of `$queryRaw` / `$executeRaw` / `$queryRawUnsafe` / `$executeRawUnsafe` under `server/src` at HEAD finds only the two sites below. Both were added in this wave (`usageLedger.js` is a new file; the exercise query is in the `exerciseController.js` diff). Neither file uses `Unsafe`. Both interpolations are tagged-template parameters (`${...}`), not string concatenation.

### `server/src/coach/usageLedger.js:25`

```
await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
```

`userId` is the function argument (`usageLedger.js:21`), which callers set to `req.authUserId` or `connectorUserId`. One interpolation, tagged.

### `server/src/controllers/exerciseController.js:325-354`

```
prisma.$queryRaw`
  SELECT key, SUM(n)::int AS n
  FROM (
    SELECT
      CASE
        WHEN se."exerciseId" IS NOT NULL THEN 'catalog:' || se."exerciseId"
        WHEN se."userExerciseId" IS NOT NULL THEN 'user:' || se."userExerciseId"::text
        ELSE NULL
      END AS key,
      1 AS n
    FROM "SessionExercise" se
    INNER JOIN "WorkoutSession" ws ON ws.id = se."workoutSessionId"
    WHERE ws."userId" = ${userId}
    UNION ALL
    SELECT
      CASE
        WHEN bwe."exerciseId" IS NOT NULL THEN 'catalog:' || bwe."exerciseId"
        WHEN bwe."userExerciseId" IS NOT NULL THEN 'user:' || bwe."userExerciseId"::text
        ELSE NULL
      END AS key,
      1 AS n
    FROM "BlockWorkoutExercise" bwe
    INNER JOIN "BlockWorkout" bw ON bw.id = bwe."blockWorkoutId"
    INNER JOIN "BlockWeek" bwk ON bwk.id = bw."blockWeekId"
    INNER JOIN "BlockTemplate" bt ON bt.id = bwk."blockTemplateId"
    WHERE bt."userId" = ${userId}
  ) t
  WHERE key IS NOT NULL
  GROUP BY key
`
```

Both `${userId}` bindings are tagged-template parameters. `userId` is `req.authUserId` (`exerciseController.js:292`). No other interpolation.

## 6. Request-size and cost limits

There is no multipart/file upload on these paths. Import and coach bodies are JSON.

### Body size

| Surface | Limit | Where |
| --- | --- | --- |
| `POST /block-templates/import` and `POST /block-templates/import/preview` | `express.json({ limit: "2mb" })` | `server/src/app.js:137` |
| Every other JSON route, including `/coach/*` and `PUT /ai/consent/block-drafts` | `express.json()` with no `limit` option | `server/src/app.js:138` |

When `limit` is omitted, body-parser uses `options?.limit || '100kb'` (`server/node_modules/body-parser/lib/utils.js:63-64`). So coach and consent bodies fail at 100 KB before the char caps below.

### Application char caps (after the parser)

| Surface | Cap | Where |
| --- | --- | --- |
| Import preview `text` | `MAX_TEXT_CHARS = 1_000_000` | Declared `server/src/blocks/importPreview.js:18`. Rejected at `server/src/controllers/blockImportController.js:80-84` and again at `server/src/blocks/importPreview.js:462`. |
| Import save `block` | `validateBlockDraft` (shape), no separate byte cap | `server/src/controllers/blockImportController.js:142-145`. The 2 MB parser is the body ceiling. |
| `POST /coach/block-draft` `text` | `MAX_TEXT_CHARS = 20000` | `server/src/coach/blockDraft.js:14`, enforced in `parseBlockDraftRequest` at `server/src/coach/blockDraft.js:65-69`, called at `coachController.js:551`. |
| `POST /coach/import-map` `text` | `MAX_TEXT_CHARS = 1_000_000` | `server/src/coach/importMap.js:15`, enforced at `server/src/coach/importMap.js:80-84`, via `parseImportMapRequest` at `coachController.js:692`. A 1,000,000-character body cannot pass the 100 KB global JSON parser. |
| `POST /coach/import-fix` recipe path | same 1,000,000 cap | `server/src/coach/importFix.js:109-113` (`IMPORT_MAP_MAX_TEXT` from `importMap.js`). |
| `POST /coach/import-fix` convert path | `BLOCK_DRAFT_MAX_TEXT_CHARS` (20000) | `server/src/controllers/coachController.js:1039-1042`. |

### Rate limits

| Surface | Limiter | Budget |
| --- | --- | --- |
| `/coach/*` (block-draft, import-map, import-fix) | `coachRateLimit` | 40 / 15 min, key `req.authUserId` (`server/src/app.js:217-231`, `server/src/ai/rateLimitKeys.js:36-39`) |
| `/ai/consent/block-drafts` | `aiRateLimit` | 300 / 15 min, same key (`server/src/app.js:206-212`, `:230`) |
| `/block-templates/import*` | none added | — |
| MCP `create_block_draft` | `connectorRateLimit` | 300 / 15 min per `req.connectorUserId` (`server/src/app.js:197-203`, `:235`, `rateLimitKeys.js:29-32`) |
| Connector drafts per user | daily and open-draft counts | 10 connector creates per 24 h and 20 open drafts (`server/src/ai/blockDraftAccess.js:18-19`, checks at `:80-105`) |

### Coach usage reservation vs the provider call

Reservation runs only when `capAppliesToAccess` is true (`server/src/controllers/coachController.js:104-106` → `weeklyCapApplies`). When it is false, no `CoachUsage` row is inserted and the provider is still called.

When the cap applies, `reserveUses` is awaited and a failed reserve returns 429 before any provider call:

| Handler | Reserve | First provider call after that |
| --- | --- | --- |
| `draftBlock` | `server/src/controllers/coachController.js:573-578` (`DRAFT_COST`, `server/src/coach/weeklyCap.js:24`) | Mock returns in-process at `:592-593`. Otherwise `completeCursorFn` at `:595` or `completeAnthropicFn` at `:612`. |
| `importMap` | `:715-725` (`IMPORT_MAP_COST = 3`, `weeklyCap.js:10`) | Mock at `:730-731`. Otherwise `completeCursorFn` at `:733` or `completeAnthropicFn` at `:750`. |
| `importFix` | `:1066-1077` (`IMPORT_FIX_MAX_COST = 4`, `weeklyCap.js:15`) | `runRecipe` / `runConvert` at `:1081-1099`, which call the provider inside `completeImportMapRecipe` (`:838` or `:861`) or `completeBlockConvert` (`:942` or `:965`). |

Settle/refund is in `finally`, after the provider returns or throws: draft `:664-668`, import-map `:794-798`, import-fix `:1139-1146`. A failed or aborted call refunds (`delivered` stays false). import-fix settles `settleCost` (1–4 from tokens, `coachController.js:1111-1112`) rather than the reserved 4.

`POST /coach/block-draft` does not write a block. The connector tool `create_block_draft` does, through `createDraftForUser`, and that path does not use `CoachUsage`. Its limits are the consent flag (`blockDraftAccess.js:55-58`), the daily count, and the open-draft count (`:80-105`).

## git status

```
?? REPORT-GATE-R2.md
```
