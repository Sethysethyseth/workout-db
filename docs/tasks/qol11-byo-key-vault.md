# TASK qol11: BYO coach key - encrypted on the server, never held by the browser

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth ruled on Sept 29 that the bring-your-own coach key MUST be encrypted.
He confirmed on Oct 8 that it is server-encrypted
(`docs/specs/quality-of-life-wave.md` ruling 6).

Today the key sits plaintext in the browser's `sessionStorage`
(`client/src/lib/coachKeyPref.js`, key `workoutdb-coach-key`). It rides
every coach request in the `x-coach-key` header, read by `readByoKey`
(`server/src/controllers/coachController.js` 70, 99-102, used by six
handlers) and resolved in `server/src/coach/keyResolver.js` /
`askCoach.js` `resolveCoachProvider`.

qol1 created `UserCoachKey` (`userId` @id, `ciphertext`, `last4`). It has
its own table because `sanitizeUser` only strips `passwordHash`.

This is a SECURITY surface, a standing frontier escalation: the reviewer
audits it line by line. Precision lives in the criteria below.

FILES TO TOUCH:
- server/src/coach/keyVault.js                (new, pure crypto)
- server/test/lib/coachKeyVault.test.js       (new)
- server/src/coach/config.js                  (read COACH_KEY_SECRET)
- server/src/coach/keyResolver.js             (comment/doc + key source)
- server/test/lib/coachKeyResolver.test.js    (keep green; update only if
                                               the resolver signature changes)
- server/src/coach/askCoach.js
- server/src/controllers/coachController.js
- server/src/routes/coachRoutes.js
- server/.env.example                         (document COACH_KEY_SECRET)
- client/src/lib/coachKeyPref.js
- client/src/api/coachApi.js
- client/src/pages/profile/AiConnectorPage.jsx
- client/src/components/coach/CoachPanel.jsx
- client/src/components/blocks/builder/BlockBuilder.jsx
- client/src/components/blocks/builder/CoachDraftCard.jsx
- client/src/pages/ImportBlockPage.jsx
- client/src/pages/profile/AppearancePage.jsx
Do NOT modify anything outside these files. In the last five client files,
the ONLY change is removing `coachKeyPref` key reads and passing.

CHANGE:
**Server**
1. **`keyVault.js`** (pure: `node:crypto` only, no env, no Prisma):
   - `parseVaultSecret(raw)`: a base64 string that decodes to exactly 32
     bytes returns that Buffer. Anything else returns `null`.
   - `encryptCoachKey(plaintext, secret, userId)`: AES-256-GCM with a
     random 12-byte IV per call and `userId` as the AAD. Returns
     `"v1:" + b64(iv) + ":" + b64(tag) + ":" + b64(ciphertext)`.
   - `decryptCoachKey(blob, secret, userId)`: the inverse. It THROWS on an
     unknown version, a malformed blob, a wrong secret, a wrong `userId`
     (AAD) or any tampered byte.
   - Error messages never contain key material or the blob.
2. **`config.js`:** read `COACH_KEY_SECRET` via `parseVaultSecret`.
   Expose `byoStorageAvailable` (true only when the secret is valid). The
   secret is never logged.
3. **Routes** (all authed, rate-limited with `express-rate-limit` in the
   same style as `app.js` / `server/src/ai/rateLimitKeys.js`, at 10 per
   15 minutes per user):
   - `PUT /coach/key` with body `{ key }`:
     - Validate the Anthropic shape with the SAME regex `keyResolver.js`
       uses (`KEY_FORMAT_RE`; export it, don't copy it). A bad shape
       returns 400 "That doesn't look like an Anthropic API key."
     - When `byoStorageAvailable` is false: 503 `{ error:
       "byo_unavailable" }`.
     - Otherwise encrypt with `userId` as the AAD and upsert
       `UserCoachKey` with `last4` = the key's last 4 characters.
     - Respond `{ saved: true, last4 }`.
   - `DELETE /coach/key` returns 204 (also when there is nothing to
     delete).
   - No route ever returns the key or the ciphertext.
4. **`GET /coach/status`** adds `byoKey: { saved, last4, storageAvailable
   }`. Existing fields are unchanged.
5. **Key source.**
   - Delete `readByoKey` and `BYO_KEY_HEADER`. The `x-coach-key` header is
     IGNORED everywhere.
   - Every handler that passed `readByoKey(req)` now passes the result of
     `loadStoredByoKey(userId)`: it loads the user's row and decrypts it
     with the secret. A missing row, a missing secret or a decrypt failure
     returns `null`.
   - A decrypt failure logs ONE line naming the `userId` and "byo key
     decrypt failed", with no key, no blob and no error stack.
   - Precedence is unchanged: a stored BYO key wins and forces the
     Anthropic provider; otherwise the hosted key applies.
   - Weekly-cap exemption for BYO is unchanged.
6. **`.env.example`:** document `COACH_KEY_SECRET` (32 random bytes,
   base64) with the generation command `node -e
   "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
   Note that rotating it invalidates saved keys (users re-enter them).

**Client**
7. **`coachKeyPref.js`** keeps only `looksLikeAnthropicKey` plus a
   `purgeLegacyCoachKey()` that removes the old `workoutdb-coach-key` from
   `sessionStorage` (try/catch). Call it once at app start from the
   existing coach entry point that loads first (`CoachPanel` /
   `AiConnectorPage` mount is fine). Every other export is gone.
8. **`coachApi.js`** stops sending `x-coach-key` and adds
   `saveCoachKey(key)` (PUT) and `deleteCoachKey()` (DELETE).
9. **`AiConnectorPage`**, in the key section:
   - **Not saved:**
     - a password-type input (`autocomplete="off"`, `spellcheck=false`)
       with the label "Your Anthropic API key"
     - a "Save key" button, disabled until `looksLikeAnthropicKey`
       passes
     - helper text: "Your key is encrypted and stored on our server. It's
       only used for your coach requests and is never shown again."
   - **Saved:** "Key ending in 4f2a" with a "Remove key" button, which
     opens `ConfirmPanel` (danger): "Remove your key?" / "Remove key" /
     "Keep".
   - **`storageAvailable` false:** the input is replaced by "Saving your
     own key isn't available right now."
   - Server errors show inline. The input clears after a successful save.
10. In `CoachPanel`, `BlockBuilder`, `CoachDraftCard`, `ImportBlockPage`
    and `AppearancePage`, remove every `loadCoachKey` read and every place
    the key is passed into a request. The server resolves it now.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with `coachKeyVault.test.js`
  covering:
  - round-trip
  - two encryptions of the same key differ (random IV)
  - a flipped ciphertext byte throws
  - a flipped tag byte throws
  - the wrong secret throws
  - the wrong `userId` throws
  - an unknown version `"v2:..."` throws
  - `parseVaultSecret` rejects 31- and 33-byte inputs and non-base64
  - no thrown message contains the plaintext or the blob (assert on
    `.message`)
- `grep -rn "x-coach-key\|readByoKey\|BYO_KEY_HEADER" server/src client/src`
  -> zero hits.
- `grep -rn "loadCoachKey\|saveCoachKey(" client/src`: the only
  `saveCoachKey` hit is the new `coachApi` function, and `loadCoachKey` has
  zero hits.
- `grep -n "console\.\|logger" server/src/coach/keyVault.js` -> zero hits.
- Client `npm run build` clean. `node scripts/check-hex.mjs` passes.
- Live checks the reviewer runs (staging with `COACH_KEY_SECRET` set):
  - PUT a well-shaped key -> `{ saved: true, last4 }`, and the DB row's
    `ciphertext` starts with `v1:` and does not contain the key
  - `/auth/me` has no coach key field
  - `/coach/status` shows `saved: true`
  - DELETE -> `saved: false`
  - with the secret unset locally, PUT returns 503 `byo_unavailable`
  - a request carrying an `x-coach-key` header is not used for anything

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
