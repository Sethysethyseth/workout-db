# QOL gate R2 — route and ownership inventory

Branch `quality-of-life-updates` vs `main` @ `b5c6777`. Report only. Diff inputs: `git diff b5c6777...HEAD -- server/src/routes/ server/src/app.js` and `git diff b5c6777...HEAD -- server/src/controllers/`. Those diffs touch `server/src/app.js`, `server/src/routes/coachRoutes.js`, `server/src/routes/exerciseRoutes.js`, `server/src/routes/sessionRoutes.js`, `server/src/controllers/coachController.js`, `server/src/controllers/exerciseController.js`, `server/src/controllers/sessionController.js`. Mount prefixes are `server/src/routes/index.js` lines 62 (`/coach`), 54 (`/exercises`), 58 (`/sessions`).

`req.authUserId` is set by `attachAuthUser` before any `/coach` limiter (`server/src/app.js:182-183`, `server/src/app.js:234`). Route handlers below also sit behind `authRequired`.

## Summary

| Route | Handler | Verdict |
| --- | --- | --- |
| `PUT /coach/key` | `putCoachKey` | SCOPED |
| `DELETE /coach/key` | `deleteCoachKey` | SCOPED |
| `GET /coach/status` | `getCoachStatus` | SCOPED |
| `GET /coach/conversations` | `listCoachConversations` | SCOPED |
| `GET /coach/conversations/:id` | `getCoachConversation` | SCOPED |
| `DELETE /coach/conversations` | `deleteAllCoachConversations` | SCOPED |
| `DELETE /coach/conversations/:id` | `deleteCoachConversation` | SCOPED |
| `POST /coach/ask` | `askCoach` | SCOPED |
| `POST /coach/palette` | `generatePalette` | SCOPED |
| `POST /coach/block-draft` | `draftBlock` | SCOPED |
| `POST /coach/import-map` | `importMap` | SCOPED |
| `POST /coach/import-fix` | `importFix` | SCOPED |
| `POST /exercises/custom` | `createCustomExercise` | SCOPED + SHARED-READ |
| `PATCH /exercises/custom/:id` | `updateCustomExercise` | SCOPED |
| `GET /sessions/:id/last-performance` | `getLastPerformance` | SCOPED |

No handler in this set is UNSCOPED or UNSURE. The shared-read is the in-memory global exercise catalog name check on create and on rename (`server/src/controllers/exerciseController.js:154-159`), not a Prisma read. `CoachUsage` settle/refund deletes by reservation id only; those ids are not taken from the request (section 3).

## 1. Routes added or changed

Shared `/coach` chain, in order, for every coach row below:

1. `express.json({ limit: "2mb" })` mounted at `/coach` (`server/src/app.js:140`). This is the wave's app.js change. The following `express.json()` with no limit (`server/src/app.js:141`) is the 100 kB default the comment at `server/src/app.js:138-139` describes; `/coach` is parsed by the 2 MB parser first.
2. `attachAuthUser` (`server/src/app.js:183`).
3. `coachRateLimit`: 40 requests / 15 minutes, `keyGenerator: aiRateLimitKey` (`server/src/app.js:220-230`, mounted `server/src/app.js:234`). `aiRateLimitKey` uses `req.authUserId` when present, else IP (`server/src/ai/rateLimitKeys.js:36-39`).
4. `authRequired` on the route row.

There is no per-route body limit besides that 2 MB parser.

### NEW

| Method | Path | Extra middleware | Handler |
| --- | --- | --- | --- |
| PUT | `/coach/key` | `coachKeyWriteLimit` 10 / 15 min, same key generator (`server/src/routes/coachRoutes.js:24-36`) | `putCoachKey` `server/src/controllers/coachController.js:126` |
| DELETE | `/coach/key` | same limiter (`server/src/routes/coachRoutes.js:37`) | `deleteCoachKey` `server/src/controllers/coachController.js:152` |
| GET | `/coach/conversations` | none beyond the shared chain | `listCoachConversations` `server/src/controllers/coachController.js:1274` (`server/src/routes/coachRoutes.js:39`) |
| GET | `/coach/conversations/:id` | none | `getCoachConversation` `server/src/controllers/coachController.js:1289` (`server/src/routes/coachRoutes.js:40`) |
| DELETE | `/coach/conversations` | none | `deleteAllCoachConversations` `server/src/controllers/coachController.js:1315` (`server/src/routes/coachRoutes.js:41`) |
| DELETE | `/coach/conversations/:id` | none | `deleteCoachConversation` `server/src/controllers/coachController.js:1302` (`server/src/routes/coachRoutes.js:42`) |
| PATCH | `/exercises/custom/:id` | `authRequired` only (`server/src/routes/exerciseRoutes.js:19`). Body limit is the global `express.json()` (`server/src/app.js:141`), not the 2 MB coach parser. No rate limiter on this route. | `updateCustomExercise` `server/src/controllers/exerciseController.js:293` |
| GET | `/sessions/:id/last-performance` | `authRequired` only (`server/src/routes/sessionRoutes.js:31`). No body. No rate limiter. | `getLastPerformance` `server/src/controllers/sessionController.js:980` |

`GET /sessions/:id/last-performance` is registered before `GET /sessions/:id` (`server/src/routes/sessionRoutes.js:31-32`).

### CHANGED

Handler bodies changed. Route registration lines were already present except where noted. Middleware is the shared `/coach` chain unless stated. The wave's behavioral change on the five model routes is stored-vault BYO instead of the `x-coach-key` header (`readByoKey` removed; `loadStoredByoKey` used).

| Method | Path | Handler |
| --- | --- | --- |
| GET | `/coach/status` | `getCoachStatus` `server/src/controllers/coachController.js:273` (`server/src/routes/coachRoutes.js:38`) |
| POST | `/coach/ask` | `askCoach` `server/src/controllers/coachController.js:337` (`server/src/routes/coachRoutes.js:43`) |
| POST | `/coach/palette` | `generatePalette` `server/src/controllers/coachController.js:527` (`server/src/routes/coachRoutes.js:44`) |
| POST | `/coach/block-draft` | `draftBlock` `server/src/controllers/coachController.js:645` (`server/src/routes/coachRoutes.js:45`) |
| POST | `/coach/import-map` | `importMap` `server/src/controllers/coachController.js:787` (`server/src/routes/coachRoutes.js:46`) |
| POST | `/coach/import-fix` | `importFix` `server/src/controllers/coachController.js:1126` (`server/src/routes/coachRoutes.js:47`) |
| POST | `/exercises/custom` | `createCustomExercise` `server/src/controllers/exerciseController.js:191` (`server/src/routes/exerciseRoutes.js:18`). `authRequired` only. Global JSON body limit (`server/src/app.js:141`). No rate limiter. |

## 2. Prisma calls per handler

Helpers with no Prisma in `server/src/analytics/`, `server/src/lib/`, and `server/src/blocks/`: `buildLastPerformance`, `buildUserExerciseIndex`, `selectRowsToAdopt` (`server/src/lib/customExerciseRename.js`), `blockWeekInclude` (`server/src/blocks/blockTemplateStore.js:34-41`, an include tree only). `loadSummary` lives in `server/src/ai/analyticsAccess.js` and is listed because `askCoach` and `draftBlock` call it.

### `putCoachKey` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `userCoachKey.upsert` | `server/src/controllers/coachController.js:140-144` | `where.userId = req.authUserId`. `create.userId` is the same. |

### `deleteCoachKey` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `userCoachKey.deleteMany` | `server/src/controllers/coachController.js:154` | `where: { userId: req.authUserId }` |

### `getCoachStatus` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `user.findUnique` via `loadCoachAccess` | `server/src/coach/askCoach.js:53-55` | `where: { id: userId }` with `userId` = `req.authUserId` (`server/src/controllers/coachController.js:275`) |
| `userCoachKey.findUnique` via `loadStoredByoKey` | `server/src/controllers/coachController.js:112-115` | `where: { userId }` |
| `userCoachKey.findUnique` (last4) | `server/src/controllers/coachController.js:288-291` | `where: { userId: req.authUserId }` |
| `coachUsage.findMany` via `loadWeeklyCap`, only when `capAppliesToAccess` | `server/src/controllers/coachController.js:192-195`, gated at `293` | `where: { userId, createdAt: { gt: windowStart } }` |

### `listCoachConversations` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `coachConversation.findMany` | `server/src/coach/conversationStore.js:64-74` | `where` is `{ userId }` or `{ userId, updatedAt: { lt: before } }` (`server/src/coach/conversationStore.js:65`). `userId` is `req.authUserId` (`server/src/controllers/coachController.js:1278-1280`). `_count.messages` is the relation of those rows. |

### `getCoachConversation` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `coachConversation.findFirst` | `server/src/coach/conversationStore.js:92-103` | `where: { userId, id }`. Miss returns null; handler 404s (`server/src/controllers/coachController.js:1293-1294`). Messages are the relation of that row. |

### `deleteCoachConversation` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `coachConversation.deleteMany` | `server/src/coach/conversationStore.js:117-120` | `where: { userId, id }` |

### `deleteAllCoachConversations` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `coachConversation.deleteMany` | `server/src/coach/conversationStore.js:123-126` | `where: { userId }` |

### `askCoach` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `coachConversation.findFirst` via `findOwned`, only if `conversationId` is set | `server/src/coach/conversationStore.js:13-17`, called at `server/src/controllers/coachController.js:357-358` | `where: { userId, id }`. Miss is 404 before any write (`server/src/controllers/coachController.js:359`). |
| `user.findUnique` via `loadCoachAccess` | `server/src/coach/askCoach.js:53-55` | `where: { id: userId }` |
| `userCoachKey.findUnique` via `loadStoredByoKey` | `server/src/controllers/coachController.js:112-115` | `where: { userId }` |
| `reserveUses` when the weekly cap applies | `server/src/coach/usageLedger.js:23-48`, called at `server/src/controllers/coachController.js:382` | `$executeRaw` `pg_advisory_xact_lock(hashtext(userId))` (`server/src/coach/usageLedger.js:25`). `coachUsage.findMany` `where: { userId, createdAt: { gt: windowStart } }` (`server/src/coach/usageLedger.js:30-32`). `coachUsage.create` `data: { userId }` (`server/src/coach/usageLedger.js:46`). |
| `workoutSession.findFirst` inside `loadCoachData` when focus type is `session` | `server/src/coach/askCoach.js:137-146` | `where: { id: focus.sessionId, userId }`. Miss returns 404 `session_not_found` (`server/src/coach/askCoach.js:147-148`). Template name is the relation of that row. |
| `blockTemplate.findFirst` when focus type is `block` | `server/src/coach/askCoach.js:184-187` | `where: { id: focus.blockId, userId }`. Miss returns 404 `block_not_found` (`server/src/coach/askCoach.js:188-189`). `include: { weeks: blockWeekInclude }` reads children of that owned row (`server/src/blocks/blockTemplateStore.js:34-41`). |
| `loadSummary` (consent path only; skipped when consent is absent, `server/src/controllers/coachController.js:389-400`) | `server/src/ai/analyticsAccess.js:82-144` and `fetchAllTimeEnrichedSets` at `server/src/ai/analyticsAccess.js:34-39`, called from `server/src/ai/analyticsAccess.js:201` | Both `workoutSession.findMany` use `where: { userId }` (summary also filters `performedAt`). Both `userExercise.findMany` use `where: { userId }`. Sets and template sets are includes of those sessions. |
| `saveSuccessfulExchange` after a non-aborted stream | `server/src/coach/conversationStore.js:29-59`, called at `server/src/controllers/coachController.js:476-483` | Create: `coachConversation.create` `data.userId` (`server/src/coach/conversationStore.js:32-39`). Existing id: `coachConversation.findFirst` `where: { userId, id }` and `return null` before any message write if it misses (`server/src/coach/conversationStore.js:42-46`). `coachMessage.create` twice with that conversation id (`server/src/coach/conversationStore.js:49-54`). `coachConversation.updateMany` `where: { userId, id }` (`server/src/coach/conversationStore.js:55-58`). |
| `refundUses` or `settleUses` in `finally` when a reservation exists | `server/src/controllers/coachController.js:509-516`; deletes at `server/src/coach/usageLedger.js:72` and `server/src/coach/usageLedger.js:92` | `coachUsage.delete` `where: { id }` only. `id` is a reservation id from `reserveUses` for this `userId`, not a request id. |

Help focus with no consent does not call `loadCoachData` (`server/src/controllers/coachController.js:389-400`). Help focus inside `loadCoachData` returns before any query (`server/src/coach/askCoach.js:125-133`).

### `generatePalette` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `user.findUnique` via `loadCoachAccess` | `server/src/coach/askCoach.js:53-55` | `where: { id: userId }` |
| `userCoachKey.findUnique` via `loadStoredByoKey` | `server/src/controllers/coachController.js:112-115` | `where: { userId }` |
| `reserveUses` / `settleUses` / `refundUses` when the cap applies | same ledger lines as ask; reserve at `server/src/controllers/coachController.js:561`; settle/refund at `632-634` | Same as ask. No workout or conversation queries. |

### `draftBlock` — SCOPED

Same access, vault, and usage-ledger calls as palette (reserve at `server/src/controllers/coachController.js:683`, settle/refund at `774-776`). Additional, only when `mode === "generate"`:

| Call | Where | Scope |
| --- | --- | --- |
| `loadSummary` | `server/src/controllers/coachController.js:693-696` into `server/src/ai/analyticsAccess.js:82-144` and `server/src/ai/analyticsAccess.js:34-39` | `where.userId` on sessions and custom exercises, as under ask. |

### `importMap` — SCOPED

Same access, vault, and usage-ledger calls (reserve at `server/src/controllers/coachController.js:824-829`, settle/refund at `904-906`). No workout, catalog, or conversation queries. The pasted text is not a database id.

### `importFix` — SCOPED

Same access, vault, and usage-ledger calls (reserve at `server/src/controllers/coachController.js:1175-1180`, settle/refund at `1249-1254`). `completeImportMapRecipe` (`server/src/controllers/coachController.js:915`) and `completeBlockConvert` (`server/src/controllers/coachController.js:1017` region) do not query Prisma. No workout queries.

### `createCustomExercise` — SCOPED + SHARED-READ

| Call | Where | Scope |
| --- | --- | --- |
| Catalog name check via `resolveExercise` | `server/src/controllers/exerciseController.js:154-159` | SHARED-READ. In-memory global catalog, not Prisma. Condition: `catalogResolution.resolved` rejects the name as `already tracked as ${catalogResolution.catalogEntry.name}`. |
| `userExercise.findFirst` via `assertCustomExerciseFields` | `server/src/controllers/exerciseController.js:162-168` | `where: { userId, normalizedName }` |
| `userExercise.create` | `server/src/controllers/exerciseController.js:207-214` | `data.userId` is `req.authUserId` |

### `updateCustomExercise` — SCOPED

| Call | Where | Scope |
| --- | --- | --- |
| `userExercise.findFirst` (ownership) | `server/src/controllers/exerciseController.js:319-321` | `where: { id, userId }`. Miss is 404 (`server/src/controllers/exerciseController.js:322-325`) before the transaction. |
| `userExercise.findFirst` (name clash) via `assertCustomExerciseFields` | `server/src/controllers/exerciseController.js:162-168` | `where: { userId, normalizedName, id: { not: excludeId } }` |
| Catalog name check | `server/src/controllers/exerciseController.js:154-159` | SHARED-READ, same condition as create, only when `name` is in the body. |
| `userExercise.updateMany` | `server/src/controllers/exerciseController.js:350-353` | `where: { id, userId }`. `count !== 1` throws before any rename (`server/src/controllers/exerciseController.js:354-357`). |
| `sessionExercise.updateMany` | `server/src/controllers/exerciseController.js:363-366` | `where: { userExerciseId: id, workoutSession: { userId } }` |
| `templateExercise.updateMany` | `server/src/controllers/exerciseController.js:367-370` | `where: { userExerciseId: id, workoutTemplate: { userId } }` |
| `blockWorkoutExercise.updateMany` | `server/src/controllers/exerciseController.js:371-377` | `where: { userExerciseId: id, blockWorkout: { blockWeek: { blockTemplate: { userId } } } }` |
| `sessionExercise.findMany` | `server/src/controllers/exerciseController.js:382-389` | `where: { exerciseId: null, userExerciseId: null, workoutSession: { userId } }` |
| `templateExercise.findMany` | `server/src/controllers/exerciseController.js:390-397` | `where: { exerciseId: null, userExerciseId: null, workoutTemplate: { userId } }` |
| `blockWorkoutExercise.findMany` | `server/src/controllers/exerciseController.js:398-406` | `where: { exerciseId: null, userExerciseId: null, blockWorkout: { blockWeek: { blockTemplate: { userId } } } }` |
| `updateMany` inside `adoptNameOnlyRows` (up to three calls) | `server/src/controllers/exerciseController.js:283-289` | `where` is `{ id: { in: match ids }, ...ownerWhere }`. `ownerWhere` repeats the user relation from the findMany that produced the ids (`server/src/controllers/exerciseController.js:415`, `423`, `433-437`). |
| `userExercise.findFirst` (return row) | `server/src/controllers/exerciseController.js:441-443` | `where: { id, userId }` |

Rename writes run only when `nameChanged` (`server/src/controllers/exerciseController.js:361`).

### `getLastPerformance` — SCOPED

`buildLastPerformance` does not touch Prisma.

| Call | Where | Scope |
| --- | --- | --- |
| `workoutSession.findFirst` | `server/src/controllers/sessionController.js:998-1016` | `where: { id: sessionId, userId }` with `sessionId` from `req.params.id` (`server/src/controllers/sessionController.js:990`). Miss is 404 (`server/src/controllers/sessionController.js:1018-1021`) before the history read. Exercises are the relation of that row. |
| `workoutSession.findMany` | `server/src/controllers/sessionController.js:1028-1064` | `where: { userId, id: { not: sessionId }, completedAt: { not: null }, performedAt: { gte, lt } }`. Exercises and sets are relations of those sessions. |
| `userExercise.findMany` | `server/src/controllers/sessionController.js:1066-1074` | `where: { userId }` |

## 3. Writes that take an id from the request

| Write | Request id | Proof it belongs to the user before the write | `updateMany` / `deleteMany` `where` has user id? |
| --- | --- | --- | --- |
| `putCoachKey` upsert `server/src/controllers/coachController.js:140-144` | none (row key is `authUserId`) | n/a | n/a (upsert `where.userId`) |
| `deleteCoachKey` `server/src/controllers/coachController.js:154` | none | n/a | Yes. `where: { userId: req.authUserId }` |
| `askCoach` messages when `body.conversationId` is set | conversation id (`parseCoachRequest` value, checked at `server/src/controllers/coachController.js:357`) | `findOwned` `where: { userId, id }` and 404 if missing (`server/src/controllers/coachController.js:357-359`), before the provider call and before the save. Inside the save transaction, `findFirst` `where: { userId, id }` again and `return null` before `coachMessage.create` (`server/src/coach/conversationStore.js:42-46`). | `coachConversation.updateMany` at `server/src/coach/conversationStore.js:55-58`: yes, `where: { userId, id }` |
| `askCoach` new conversation (`conversationId` null) | none | `coachConversation.create` sets `userId` (`server/src/coach/conversationStore.js:32-36`). Message rows use that new id. | same `updateMany` as above |
| `deleteCoachConversation` | `params.id` | The delete itself is the check: `deleteMany` `where: { userId, id }` (`server/src/coach/conversationStore.js:117-120`). `count === 0` is 404 (`server/src/controllers/coachController.js:1307`). No write happens for another user's id. | Yes |
| `deleteAllCoachConversations` | none | n/a | Yes. `where: { userId }` (`server/src/coach/conversationStore.js:123-126`) |
| `updateCustomExercise` | `params.id` | `userExercise.findFirst` `where: { id, userId }` returns 404 before the transaction (`server/src/controllers/exerciseController.js:319-325`). `updateMany` repeats `where: { id, userId }` and a count other than 1 aborts before renames (`server/src/controllers/exerciseController.js:350-357`). | Yes on every `updateMany` in section 2, either `userId` or a relation to `userId`. |
| `createCustomExercise` | none | create data includes `userId` (`server/src/controllers/exerciseController.js:207-209`) | none |
| `getLastPerformance` | `params.id` is a read | ownership read at `server/src/controllers/sessionController.js:998-1021` | no writes |
| usage settle/refund | not a request id | `coachUsage.delete` `where: { id }` (`server/src/coach/usageLedger.js:72`, `server/src/coach/usageLedger.js:92`) | No user id on the `where`. Ids are the ones `reserveUses` just inserted for `req.authUserId` (`server/src/coach/usageLedger.js:46`). |

No write in this set applies an id from the client and only afterwards checks ownership.

`CoachMessage` has no `userId` column (`server/prisma/schema.prisma:377-386`). Isolation is the conversation ownership check in the same transaction, then the FK to that conversation.

## 4. Key vault

### Cipher, derivation, IV, tag

Blob layout, quoted from `server/src/coach/keyVault.js:7`:

```
Blob: "v1:" + base64(iv) + ":" + base64(tag) + ":" + base64(ciphertext)
```

Cipher and parameters (`server/src/coach/keyVault.js:13-15`, `server/src/coach/keyVault.js:37-51`):

```
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SECRET_BYTES = 32;

function encryptCoachKey(plaintext, secret, userId) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", secret, iv);
  cipher.setAAD(Buffer.from(String(userId), "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}
```

Decrypt checks the `v1` prefix, IV length 12, tag length 16, and secret length 32, then (`server/src/coach/keyVault.js:54-70`):

```
const decipher = crypto.createDecipheriv("aes-256-gcm", secret, iv);
decipher.setAAD(Buffer.from(String(userId), "utf8"));
decipher.setAuthTag(tag);
```

Any failure throws `new Error("byo key decrypt failed")` (`server/src/coach/keyVault.js:12`, `server/src/coach/keyVault.js:17-18`, `server/src/coach/keyVault.js:69-70`). The plaintext is not in that error string.

The vault secret is not derived from a password. `parseVaultSecret` (`server/src/coach/keyVault.js:25-34`) requires a canonical base64 string that decodes to exactly 32 bytes. `getCoachKeySecret` (`server/src/coach/config.js:34-36`) returns that buffer or null:

```
function getCoachKeySecret(env = process.env) {
  return parseVaultSecret(env.COACH_KEY_SECRET);
}
```

`byoStorageAvailable` is `getCoachKeySecret(env) != null` (`server/src/coach/config.js:52`).

`resolveCoachKey` does not decrypt. It accepts an already-decrypted `byoKey` and prefers it over the hosted key (`server/src/coach/keyResolver.js:31-38`). Headers are not a key source (`server/src/coach/keyResolver.js:5-6`).

### `COACH_KEY_SECRET` missing or wrong

Boot: no read of `COACH_KEY_SECRET` outside `getCoachKeySecret` / `getCoachConfig`. A missing or malformed secret does not throw at process start. `getCoachKeySecret` returns null (`server/src/coach/config.js:34-36` via `server/src/coach/keyVault.js:26-27`).

Save (`PUT /coach/key`): if `byoStorageAvailable` is false, response is 503 `{ error: "byo_unavailable" }` before encrypt (`server/src/controllers/coachController.js:134-136`). A malformed secret takes this path. A well-formed but different 32-byte secret is treated as present and used to encrypt (`server/src/controllers/coachController.js:137-144`).

Use (`loadStoredByoKey`, called from status and every model route): if `getCoachKeySecret()` is null, return null immediately (`server/src/controllers/coachController.js:107-108`). If decrypt throws (wrong secret, wrong AAD, bad blob), catch logs one line and returns null (`server/src/controllers/coachController.js:117-121`). Null BYO falls through to the hosted key or `no_key` inside `resolveCoachKey` (`server/src/coach/keyResolver.js:40-46`) and `resolveCoachProvider` (`server/src/coach/askCoach.js:81-95`).

### Where key material can leave the process

Searched `console.`, `res.json`, and `err.message` on `keyVault.js`, `keyResolver.js`, `config.js`, and the key routes.

| Site | What leaves |
| --- | --- |
| `server/src/coach/keyVault.js` | No `console`, no response. Comment at lines 3-4: no logging. |
| `server/src/coach/keyResolver.js` | No logging. The resolved `key` is returned to the controller and passed as `apiKey` to the provider. |
| `server/src/coach/config.js` | No logging. Comment at line 33: "Never log the return value." `hostedKey` is the separate `COACH_API_KEY` (`server/src/coach/config.js:39`). |
| `console.error` on decrypt failure | `` `byo key decrypt failed ${userId}` `` (`server/src/controllers/coachController.js:120`). User id only. |
| `PUT /coach/key` response | `{ saved: true, last4 }` (`server/src/controllers/coachController.js:145`). `last4` is `raw.slice(-4)` (`server/src/controllers/coachController.js:139`). Not the full key, not the ciphertext, not the secret. |
| `next(err)` on put/delete | `server/src/controllers/coachController.js:146-147` and `156-157`. `errorHandler` logs the error object and returns `{ error: err.message }` (`server/src/middleware/errorHandler.js:2-6`). The plaintext and the secret are not fields on the Prisma write. The upsert payload is `ciphertext` and `last4`. |
| Request log | `console.log` of method and URL only (`server/src/app.js:52-54`). |
| Provider HTTP | `x-api-key: apiKey` (`server/src/coach/provider.js:157`, `server/src/coach/provider.js:211`). That is the call to Anthropic, not a log line. |
| Provider error text | `extractProviderMessage` returns `parsed.error.message` (`server/src/coach/provider.js:33-37`). Stream errors forward `err.message` (`server/src/coach/provider.js:95-96`). Controller responses put `err.message` on 502 JSON for `CoachProviderError` (`server/src/controllers/coachController.js:627-628`, `769-770`, `899-900`, `1244-1245`) and on the ask SSE error (`server/src/controllers/coachController.js:497-500`). This code does not insert the key into that string. It does forward the provider's `error.message` unchanged. |
| Cursor log | `console.info` of mode, agent run count, and timings (`server/src/coach/cursorProvider.js:491-495`). No key. |

No `logger` calls on these paths.

### GET routes and the stored key

`GET /coach/status` does not return the ciphertext or the full key. It returns (`server/src/controllers/coachController.js:302-316`):

```
byoKey: {
  saved: Boolean(keyRow),
  last4: keyRow ? keyRow.last4 : null,
  storageAvailable: config.byoStorageAvailable,
}
```

`last4` is the stored last four characters (`server/prisma/schema.prisma:357-358`). The status comment says "Never echoes a key" (`server/src/controllers/coachController.js:271`). The other GET routes in this wave (`GET /coach/conversations`, `GET /coach/conversations/:id`, `GET /sessions/:id/last-performance`) return conversation metadata or set history, not key fields.

## 5. Coach cost and abuse limits

Hosted vs own key: `resolveCoachKey` returns `source: "byo"` when a decrypted key matches `KEY_FORMAT_RE`, otherwise `source: "hosted"` only if a hosted key exists and `entitled` is true (`server/src/coach/keyResolver.js:31-51`). `resolveCoachProvider` forces Anthropic for BYO (`server/src/coach/askCoach.js:101-110`).

The weekly counter is skipped unless the source is hosted. `weeklyCapApplies` (`server/src/coach/weeklyCap.js:67-69`):

```
return keySource === "hosted" && !isUncappedEmail(email, raw);
```

`capAppliesToAccess` passes `process.env.COACH_UNCAPPED_EMAILS` (`server/src/controllers/coachController.js:161-163`). BYO and mock never call `reserveUses`. An uncapped hosted email also skips it.

| Route | Rate limit | Body limit | Server-side length cap | Reservation vs provider |
| --- | --- | --- | --- | --- |
| `PUT /coach/key`, `DELETE /coach/key` | App coach limit 40/15 min (`server/src/app.js:220-234`) plus key-write limit 10/15 min (`server/src/routes/coachRoutes.js:24-34`) | 2 MB (`server/src/app.js:140`) | `KEY_FORMAT_RE` = `^sk-ant-[A-Za-z0-9_-]{20,}$` (`server/src/coach/keyResolver.js:15`). No upper bound in the regex. | No provider call. No usage reservation. |
| `GET /coach/status` | 40/15 min (`server/src/app.js:234`) | no body | none | No provider call. Reads the cap; does not reserve (`server/src/controllers/coachController.js:293-294`). |
| `GET/DELETE /coach/conversations` and `GET/DELETE /coach/conversations/:id` | 40/15 min | 2 MB parser applies; these handlers do not read a body | none in `conversationStore.js` | No provider call. No usage reservation. |
| `POST /coach/ask` | 40/15 min | 2 MB (`server/src/app.js:140`) | Question max 1000 chars (`server/src/coach/coachRequest.js:9`, `server/src/coach/coachRequest.js:130-131`). History last 12 turns (`server/src/coach/coachRequest.js:10`, `server/src/coach/coachRequest.js:97`), each content sliced to 4000 chars (`server/src/coach/coachRequest.js:11`, `server/src/coach/coachRequest.js:102`). Range max 85 days (`server/src/coach/coachRequest.js:12`, `server/src/coach/coachRequest.js:44-45`). Rejected at `server/src/controllers/coachController.js:353-354` before reserve and before the stream. | `reserveUses` of `ASK_COST` (1) at `server/src/controllers/coachController.js:380-387` when the cap applies. `openCoachStream` starts at `server/src/controllers/coachController.js:440`. Settle or refund is in `finally` (`server/src/controllers/coachController.js:509-516`), after the provider call. |
| `POST /coach/palette` | 40/15 min | 2 MB | Description trimmed and sliced to 200 chars (`server/src/coach/palette.js:11`, `server/src/coach/palette.js:217-221`). Empty becomes 400 (`server/src/controllers/coachController.js:540-542`). | Reserve `PALETTE_COST` (1) at `server/src/controllers/coachController.js:559-566`. Provider calls start at `569`. Settle/refund in `finally` at `632-634`. |
| `POST /coach/block-draft` | 40/15 min | 2 MB | Text max 20000 chars (`server/src/coach/blockDraft.js:14`, `server/src/coach/blockDraft.js:65-70`), checked by `parseBlockDraftRequest` before reserve (`server/src/controllers/coachController.js:660-661`). | Reserve `DRAFT_COST` (1) at `server/src/controllers/coachController.js:681-688`. Provider calls start at `701`. Settle/refund at `774-776`. |
| `POST /coach/import-map` | 40/15 min | 2 MB, sized for the 1,000,000-character cap (`server/src/app.js:138-140`) | Text max 1000000 chars (`server/src/coach/importMap.js:15`, `server/src/coach/importMap.js:80-85`), before reserve (`server/src/controllers/coachController.js:801-802`). | Reserve `IMPORT_MAP_COST` (3) at `server/src/controllers/coachController.js:822-834`. Provider calls start at `839`. Settle/refund at `904-906`. |
| `POST /coach/import-fix` | 40/15 min | 2 MB | Recipe path uses the import-map 1000000 cap via `parseImportFixRequest` (`server/src/coach/importFix.js:109-113`). Convert path rejects text longer than 20000 after parse (`server/src/controllers/coachController.js:1148-1151`, `BLOCK_DRAFT_MAX_TEXT_CHARS` from `server/src/coach/blockDraft.js:14`). Problems capped at 20 items and 200 chars each (`server/src/coach/importFix.js:16`, `server/src/coach/importFix.js:20`, `server/src/coach/importFix.js:128-148`). | Reserve `IMPORT_FIX_MAX_COST` (4) at `server/src/controllers/coachController.js:1173-1188`. Provider work starts at `1191`. On success, settle 1-4 from token totals (`server/src/controllers/coachController.js:1215-1221`, `1249-1251`). Otherwise refund (`server/src/controllers/coachController.js:1253`). |

Costs are defined at `server/src/coach/weeklyCap.js:10-24`. The cap is 7 hosted uses per rolling 7 days (`server/src/coach/weeklyCap.js:7-8`).

## 6. Conversation storage

`server/src/coach/conversationStore.js` does not define a cap on conversations per user, messages per conversation, or characters per message. There is no branch that rejects or trims a save for those reasons. `saveSuccessfulExchange` always creates the two message rows once the conversation is owned (`server/src/coach/conversationStore.js:49-54`).

What that file does cap is the list page: `PAGE_SIZE = 20` (`server/src/coach/conversationStore.js:6`). `listConversations` reads `PAGE_SIZE + 1` rows (`server/src/coach/conversationStore.js:67`) and, when more exist, returns 20 plus `nextBefore` (`server/src/coach/conversationStore.js:76-87`). That does not stop further saves.

Caps that apply before or beside the store, not inside it:

| Cap | Where | At the cap |
| --- | --- | --- |
| Question 1000 chars | `server/src/coach/coachRequest.js:130-131` | 400 from `parseCoachRequest`. The ask handler returns that error before save (`server/src/controllers/coachController.js:353-354`). |
| History 12 turns, 4000 chars each | `server/src/coach/coachRequest.js:97-106` | Extra turns dropped; content sliced. History is not written by `saveSuccessfulExchange`. The store writes `request.question` and the streamed answer (`server/src/controllers/coachController.js:476-482`). |
| Title 80 chars | `server/src/coach/conversationTitle.js:6-18` | Truncated on a word boundary. Used as `title` on create (`server/src/controllers/coachController.js:481`). |
| Answer length | model `maxTokens` 8000 (`server/src/coach/config.js:20`) | Not re-checked in `conversationStore.js`. The saved answer is `streamedAnswer` (`server/src/controllers/coachController.js:429-435`, `480`). |

Deleting a conversation deletes its messages by foreign-key cascade, not by a separate message delete in `conversationStore.js`. `deleteConversation` and `deleteAllConversations` delete only `CoachConversation` (`server/src/coach/conversationStore.js:117-126`). Schema (`server/prisma/schema.prisma:380`):

```
conversation   CoachConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
```

Migration (`server/prisma/migrations/20261008120000_coach_key_and_history/migration.sql:48`):

```
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CoachConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## git status --porcelain

```
?? REPORT-QOL-GATE-R2.md
```
