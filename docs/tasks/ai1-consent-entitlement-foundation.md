# TASK AI1: consent + entitlement foundation (the privacy groundwork the AI layer ships on)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

**MIGRATION-CARRYING - NOT AUTONOMOUSLY DISPATCHABLE.** This block adds a
Prisma model and a migration file. Writing those files is ordinary code work;
RUNNING `prisma migrate` is Seth's manual track (AGENTS.md gate item 3), and
`dispatch-unit` section 4 refuses migration-carrying blocks. Seth relays this
one by hand, or the reviewer dispatches it only after he has explicitly cleared
it. **Do not run any migration command in this block** - see ACCEPTANCE.

CONTEXT:
First unit of the AI connector wave (`docs/specs/ai-layer.md`). The wave exposes
a remote MCP server that Claude/ChatGPT connect to, so a user can ask their own
AI assistant about their training data. Section 6 of the spec is emphatic that
**explicit, opt-in, revocable data-sharing consent lands with the FIRST AI
feature, not at productization** - retrofitting consent onto users who already
have the feature is the one genuinely irreversible mistake available in this
wave. Section 4.3 additionally requires a server-side entitlement check from day
one, so flipping the connector to paid later is configuration rather than a
refactor.

Recon (August 4, AIR1 + AIR2) established the ground this sits on, and two
findings shape the contract:

1. **There is NO server-persisted user preference of any kind today.** Every
   preference in the app is device-local localStorage (`weightUnitPref.js`,
   `effortSignalPref.js`, `analyticsRangePref.js`, ...). The `User` model
   (`server/prisma/schema.prisma:13-26`) holds identity fields only - no
   settings, no flags. This consent record is the FIRST of its kind, so there is
   no existing pattern to copy for the round-trip; build the one the rest of the
   wave will follow.
2. **There is no `/api` prefix.** Routers mount at the API host root via
   `app.use("/", routes)` (`server/src/app.js:126`). Live paths are
   `/analytics/summary`, `/sessions`, `/auth/me`. Any block or spec text that
   says `/api/...` is wrong against the tree - `ai-layer.md` section 4.1 has
   this error and is NOT to be followed on that point.

FILES TO TOUCH:
- `server/prisma/schema.prisma`          (new model + one User field + relation)
- `server/prisma/migrations/<timestamp>_add_ai_consent/migration.sql`  (new)
- `server/src/ai/consent.js`             (new - PURE decision logic, no Prisma)
- `server/src/controllers/aiController.js`  (new)
- `server/src/routes/aiRoutes.js`        (new)
- `server/src/routes/index.js`           (mount the new router)
- `server/test/lib/aiConsent.test.js`    (new - see the LANE note below)
- `client/src/api/aiApi.js`              (new)
- `client/src/pages/profile/AiConnectorPage.jsx`  (new)
- `client/src/pages/ProfilePage.jsx`     (one new settings row)
- `client/src/App.jsx`                   (one new route)
Do NOT modify anything outside these files. In particular do NOT touch
`client/src/index.css` - every class this unit needs already exists (see CHANGE
step 8) and adding CSS is a separate concern.

CHANGE:

**1. Prisma schema.** Add ONE new model and ONE new field on `User`.

```prisma
model AiConsent {
  id        Int       @id @default(autoincrement())
  userId    String    @unique
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  scope     String
  grantedAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
}
```

Plus on `User`: `aiConsent AiConsent?` (the back-relation) and
`aiConnectorEnabled Boolean @default(true)` (the entitlement flag - default TRUE
because the connector ships free, per spec section 4.3; the POINT is that the
check exists server-side, not that it currently denies anyone).

ONE ROW PER USER, by the `@unique` on `userId`. Revoking sets `revokedAt`;
re-granting clears it and updates `grantedAt`. This deliberately does not keep
an audit trail of every grant/revoke cycle - the spec asks for the CURRENT
consent state with a timestamp and scope, and a history table is scope creep.

**2. Migration.** Hand-write the SQL in a directory named
`YYYYMMDDHHMMSS_add_ai_consent` under `server/prisma/migrations/`, matching the
naming and comment style of the existing migrations - read
`server/prisma/migrations/20260707130000_add_exercise_fk_linkage/migration.sql`
and follow its `-- CreateTable` / `-- CreateIndex` / `-- AddForeignKey` idiom.
Use a timestamp later than `20260707130000`. The migration must be additive
only: `CREATE TABLE "AiConsent"`, its unique index and FK, and
`ALTER TABLE "User" ADD COLUMN "aiConnectorEnabled" BOOLEAN NOT NULL DEFAULT true`.
**Do NOT run `prisma migrate dev`, `prisma migrate deploy`, or any other
migration command** - write the file, do not apply it. `prisma generate` is
fine and you will need it for the client to typecheck.

**3. `server/src/ai/consent.js` - PURE, no Prisma import.** This is where the
policy lives, so it can be unit-tested in the DB-free lane. Export:

- `CONNECTOR_SCOPE` - the single v1 scope string, `"training:read"`. One
  constant, referenced everywhere; never a literal at a call site.
- `isConsentActive(row)` -> boolean. TRUE only when `row` exists, `grantedAt` is
  set, and `revokedAt` is null-ish. Treat a missing row as NOT consented.
- `consentStateFor(row)` -> the API shape:
  `{ granted: boolean, grantedAt: string|null, scope: string|null }`.
  `grantedAt` is an ISO string when granted, `null` otherwise.
- `connectorAccess({ consentRow, aiConnectorEnabled })` -> a DECISION OBJECT,
  not a boolean: `{ allowed: boolean, reason: null | "no_consent" | "not_entitled" }`.
  Check consent FIRST, then entitlement, so a user who never consented is told
  the honest reason. This function is the single gate AI2 and AI3 will call -
  they must not re-derive it.

Keep this module free of Express and Prisma imports entirely. Follow the style
of `server/src/analytics/` modules (pure functions, `module.exports` at the
bottom).

**4. `server/src/controllers/aiController.js`.** Follow the shape of
`server/src/controllers/analyticsController.js` BY NAME: read `req.authUserId`,
re-check it defensively even though the route guards, and use the shared Prisma
client the other controllers import. Three handlers:

- `getConsent` - loads the user's `aiConsent` row plus `aiConnectorEnabled`,
  returns `{ ...consentStateFor(row), connectorEnabled: <bool> }`.
- `grantConsent` - upserts the row with `grantedAt = now()`, `revokedAt = null`,
  `scope = CONNECTOR_SCOPE`. Idempotent: granting when already granted refreshes
  `grantedAt` and succeeds. Returns the same shape as `getConsent`.
- `revokeConsent` - sets `revokedAt = now()` on an existing row; a no-op success
  when there is no row or it is already revoked. Returns the same shape.

**Revocation must kill live connector tokens** (spec section 6). Tokens do not
exist yet - AI4 introduces them. Do NOT invent a token store here. Instead leave
exactly one clearly-named comment in `revokeConsent` marking the seam:
`// AI4: revoking consent must also revoke issued connector tokens.` and make
sure `connectorAccess()` is the gate every request passes, so a revoked user is
denied at request time regardless of what token they hold. That is the real
enforcement; token revocation is defence in depth.

**5. `server/src/routes/aiRoutes.js`.** Mirror
`server/src/routes/analyticsRoutes.js`: `express.Router()`, `authRequired` on
every route, one line per route.
- `GET /consent` -> `getConsent`
- `POST /consent` -> `grantConsent`
- `DELETE /consent` -> `revokeConsent`

**6. `server/src/routes/index.js`.** Mount it: `router.use("/ai", aiRoutes)`,
placed alongside the existing mounts (`/analytics`, `/sessions`, ...). Live
paths become `/ai/consent`. NO `/api` prefix - see CONTEXT finding 2.

**7. `client/src/api/aiApi.js`.** Follow the existing domain modules
(`client/src/api/analyticsApi.js` is the closest) - import the shared `http`
wrapper from `client/src/api/http.js` and export `getAiConsent()`,
`grantAiConsent()`, `revokeAiConsent()`. Do NOT hand-roll `fetch` - `http.js`
already handles the base URL, `credentials: "include"`, the Bearer header, and
`ApiError`.

**8. `client/src/pages/profile/AiConnectorPage.jsx`.** A settings sub-page at
`/profile/ai`. Follow `client/src/pages/profile/SecurityPage.jsx` BY NAME for
its structure: the `settings-page` / `settings-section` / `settings-group`
wrapper, the `settings-page-back` back link, `LoadingState` while fetching,
`ErrorMessage` for failures, and the inline
`settings-feedback settings-feedback--success` div for success (there is NO
toast system in this client - confirmed by grep; do not add one).

The page shows, in this order:

- A short heading and the plain-language statement of what leaves the app. This
  copy is PRODUCT VOICE and is specified verbatim below - do not paraphrase it.
- The current state: consented (with the date) or not.
- A single action button: "Turn on AI access" when off, "Turn off AI access"
  when on. Reuse the existing button classes the other settings pages use; do
  not invent new ones.

Copy, VERBATIM:

> Heading: `AI access`
>
> Body paragraph 1: `LogChamp can answer questions about your training inside
> an AI assistant you already use. This is off until you turn it on.`
>
> Body paragraph 2: `Only your computed summary leaves LogChamp - totals,
> trends, personal records, and how complete your effort data is. Your
> individual sets, notes, and account details are never sent.`
>
> Body paragraph 3: `You can turn this off at any time, which immediately cuts
> off access.`
>
> Granted-state line, where `{date}` is the grant date formatted the way the
> rest of the app formats dates: `AI access is on. You turned it on on {date}.`
>
> Off-state line: `AI access is off.`

There is no connector to connect to yet - AI5 adds the "connect to Claude"
surface on this same page. Do NOT build that here, and do NOT reference Claude
or ChatGPT by name anywhere in this unit's copy.

**9. `client/src/pages/ProfilePage.jsx`.** Add ONE settings row linking to
`/profile/ai`, in the existing `settings-group`. Copy the exact idiom of the
Appearance row at `ProfilePage.jsx:109-116` (`settings-row settings-row--link`,
`settings-row__main` > `settings-row__value`, `settings-row__chevron`). Label:
`AI access`. Place it after Security and before Send feedback. Do NOT gate it
behind `isProdEnv()` - unlike What's New, this must be reachable on staging so
it can be smoked.

**10. `client/src/App.jsx`.** Add the `/profile/ai` route wrapped in
`<ProtectedRoute>`, following the exact shape of the neighbouring
`/profile/security` route at `App.jsx:131-137`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` **and the new file's tests are in
  that run.** LANE NOTE, read this carefully: the unit lane is
  `jest --selectProjects unit`, whose `testMatch` covers ONLY
  `server/test/analytics/**` and `server/test/lib/**` (`jest.config.js:11-14`).
  A test placed anywhere else does NOT run in the lane that gates this unit.
  That is why `server/test/lib/aiConsent.test.js` is the mandated path.
- `server/test/lib/aiConsent.test.js` covers, at minimum, these exact cases:
  - `isConsentActive(null)` -> `false`
  - `isConsentActive({ grantedAt: <date>, revokedAt: null })` -> `true`
  - `isConsentActive({ grantedAt: <date>, revokedAt: <date> })` -> `false`
  - `connectorAccess({ consentRow: null, aiConnectorEnabled: true })` ->
    `{ allowed: false, reason: "no_consent" }`
  - `connectorAccess({ consentRow: <active>, aiConnectorEnabled: false })` ->
    `{ allowed: false, reason: "not_entitled" }`
  - `connectorAccess({ consentRow: <active>, aiConnectorEnabled: true })` ->
    `{ allowed: true, reason: null }`
  - `connectorAccess({ consentRow: <revoked>, aiConnectorEnabled: true })` ->
    `{ allowed: false, reason: "no_consent" }`
- `node --check` passes on every new/edited file under `server/src/`. The unit
  lane never loads server controllers or routes, so this is the only automated
  syntax check those files get - run it explicitly and paste the output.
- Client `npm run build` compiles with no errors.
- `grep -rn "/api/" client/src/api/aiApi.js` returns NOTHING - the API has no
  `/api` prefix.
- `grep -rn "prisma migrate" DELIVERY.md` shows no migration was run, and the
  report states explicitly that the migration file was written but NOT applied.
- The migration SQL contains `CREATE TABLE "AiConsent"` and
  `ALTER TABLE "User" ADD COLUMN "aiConnectorEnabled"`, and contains no `DROP`
  statement of any kind.
- `server/src/ai/consent.js` imports neither `@prisma/client` nor `express` -
  show the grep.

**LANE GAP, stated so the reviewer does not over-trust green lanes:** neither
runnable lane exercises an Express route (`npm run test:unit` is pure-function
only; the integration lane needs `server/.env`, which the lane worktree does not
have). The three new endpoints and the whole client page are therefore SMOKE
items, not lane-verified. Say so in the delivery report rather than implying
coverage you do not have.

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
