# RUNBOOK — recurring rituals

Copy-paste blocks for operations that repeat. **PowerShell-safe** (no `&&`, no `grep`/`wc`). Update this file when a ritual changes, not per session.

Conventions:
- Lines starting with `#` are comments / manual steps in a browser UI.
- `<...>` = fill in before running.
- Prod Neon host: `ep-solitary-sea-an56mioq` (project `snowy-resonance`) · Staging: `ep-bitter-breeze-am81izlh` (project `noisy-surf` / LogChamp-staging). **Always confirm the host in the Neon URL bar before running SQL.**

---

## 1. Session start

```powershell
git status
git log main -1 --oneline
git branch -vv
git stash list
```

Manual checks (browser):
```
# Render → workout-db-staging → Settings → Branch  == the intended branch (normally main)
# Render → workout-db-staging → Events → latest deploy SHA == expected
# Render → workout-db-l3gc (prod) → Events → latest deploy SHA == main HEAD
```

Then read `docs/HANDOFF.md` and confirm its TODO list against the above before starting any unit.

---

## 2. Pre-merge checklist (feature branch → main)

```
# 1. Cursor reports done → DO NOT trust. Verify commits exist and are pushed:
```
```powershell
git log <branch> --oneline -5
git status
git log origin/<branch> -1 --oneline
```
```
# 2. Point staging Render at <branch>; verify deploy SHA in Events.
# 3. SMOKE on staging/preview IN THE BROWSER, once for the whole wave, against
#    the consolidated checklist the relay session handed over (build/server
#    tests do NOT catch React Hook dependency-array errors — exercise the
#    changed screens). Smoke comes BEFORE the gate: findings are review input.
# 4. GATE — after smoke sign-off, the frontier seat (Opus) runs the
#    `pre-main-review` skill on the full accumulated branch diff. NOTHING
#    merges without a PASS. A BLOCKED verdict sends fixes back through the
#    relay and restarts at step 1.
# 5. If the unit includes a schema change → run section 3 BEFORE merging.
# 5b. If the wave ships NEW PROD CONFIG (env vars, a third-party identity
#     provider, a new runtime dep with a Node floor) → section 10 FIRST.
#     For `ai-connector-wave` it is mandatory: it carries two pre-flight
#     vetoes that can stop the merge outright.
# 6. Merge (manual, ff-only preferred):
```
```powershell
git checkout main
git merge --ff-only <branch>
git push
```
```
# 7. Repoint staging Render back to main. Verify redeploy SHA in Events.
# 8. Update docs/HANDOFF.md.
```

---

## 3. Schema-change deploy (LOAD-BEARING — order matters)

DB first, code second. Code-ahead-of-DB crashes prod login (June 08 incident).

```
# 1. Open Neon SQL editor for the TARGET DB. Confirm host in URL bar:
#       prod = snowy-resonance / ep-solitary-sea-an56mioq
#    staging = noisy-surf / ep-bitter-breeze-am81izlh
# 2. Run the migration.sql statements verbatim.
# 3. Insert the _prisma_migrations row (template below). checksum MUST match
#    the value Prisma recorded on staging for the same migration — copy it,
#    don't invent it.
# 4. Verify columns/tables landed:
```
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = '<TableName>' ORDER BY ordinal_position;
```
```
# 5. ONLY THEN push/merge the code so Render auto-deploys.
# 6. Smoke test login + the changed surface on the deployed env.
```

### `_prisma_migrations` row template

```sql
-- Copy checksum + logs format from the staging row for the same migration:
-- SELECT * FROM "_prisma_migrations" WHERE migration_name = '<name>';
INSERT INTO "_prisma_migrations"
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid(), '<checksum-from-staging>', now(), '<migration_name>', NULL, NULL, now(), 1);
```

---

## 4. Migration history diff (prod vs staging)

Run in BOTH Neon SQL editors; compare output line-by-line:

```sql
SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY migration_name;
```

Any name present in one and not the other = drift; any checksum mismatch on a shared name = latent `migrate deploy` hazard. Record findings in HANDOFF.

---

## 5. Verify a deploy actually shipped

```
# Render → <service> → Events → newest "Deploy live" entry → commit SHA
```
```powershell
git log main -1 --format="%H %s"
```
```
# SHAs must match. If Render shows an older SHA, the push didn't trigger
# or the service is on the wrong branch (check Settings → Branch).
```

---

## 6. Commit workaround (dodge Cursor's Co-authored-by trailer)

```powershell
# Write the message to a temp UTF-8 file, commit with -F:
Set-Content -Path .git\COMMIT_MSG_TMP -Value "<commit message>" -Encoding utf8
git commit -F .git\COMMIT_MSG_TMP --author="Seth Knisel <SethjKnisel@gmail.com>"
Remove-Item .git\COMMIT_MSG_TMP
git log -1 --format="%an <%ae>%n%B"
# Confirm: no Co-authored-by trailer in the output.
```

---

## 7. PowerShell equivalents cheat sheet (for Cursor prompts)

| Unix | PowerShell |
| --- | --- |
| `grep pattern file` | `Select-String -Pattern "pattern" -Path file` |
| `wc -l file` | `(Get-Content file).Count` |
| `cmd1 && cmd2` | separate lines (or `;` if independent) |
| `cat file` | `Get-Content file` |
| `head -20 file` | `Get-Content file -TotalCount 20` |

---

## 8. Parallel worktree ritual (task-queue Mode 2)

For running Cursor in an isolated checkout while Claude Code works the main
tree. Protocol + when this is allowed: `docs/tasks/README.md`. Worktrees live
OUTSIDE OneDrive (avoids sync-lag/file-lock class of bugs).

### Create (before dispatching the block)

```powershell
New-Item -ItemType Directory -Force C:\dev\worktrees
git worktree add C:\dev\worktrees\<unit-id> -b unit/<unit-id> <base-branch>
```
```
# Open Cursor at C:\dev\worktrees\<unit-id> (File -> Open Folder).
# node_modules are NOT shared - inside the worktree run npm install in
# server/ and client/ (installs from existing lockfiles; not a gate item).
# The task block's MODE line must name this path + branch.
```

### Review + land (Claude Code, from the main checkout)

```powershell
git diff <base-branch>..unit/<unit-id> --stat
git diff <base-branch>..unit/<unit-id>
```
```
# Fix-or-bounce. Small fixes: edit IN THE WORKTREE, commit there on
# unit/<unit-id> (SHA-verify). Then merge into the integration branch:
```
```powershell
git checkout <base-branch>
git merge --ff-only unit/<unit-id>
git log -1 --oneline
```

### Cleanup

```powershell
git worktree remove C:\dev\worktrees\<unit-id>
```
```
# Branch deletion (git branch -d unit/<unit-id>) is gate item 4 - ask first.
# Merged unit branches can also just accumulate; deletion is hygiene, not
# required.
```

---

## 9. Safety invariants (never violate)

- `server/.env` → staging or localhost only. Never prod.
- Never paste prod connection strings into local files or ad-hoc CLI. Prod SQL = Neon SQL editor only.
- Never disable `dbHostGuard` to make a test pass. New DB-connecting scripts call `assertSafeForReset(process.env.DATABASE_URL)` at top of `main()`.
- All git merge/commit/push and all prod DB ops: manual, by Seth, never Cursor.

---

## 10. AI-layer prod cutover (`ai-connector-wave` → main)

Merging the code does NOT give prod a working AI layer. The connector needs
three env vars and an identity-provider configuration that has only ever
existed for staging; the coach needs a deliberate key decision. Written
September 17, 2026, before the merge — read top to bottom, in order.

### 10a. Pre-flight VETOES — run these first, either one stops the merge

```
# V1 — PROD NODE VERSION. Render -> workout-db-l3gc -> Settings (and the
#      NODE_VERSION env var, which wins if set).
#      REQUIRED: >= 22.12.
#      WHY: src/app.js requires ./ai/mcpServer UNCONDITIONALLY at boot, which
#      pulls in `zod` (a phantom transitive of @modelcontextprotocol/sdk,
#      declared NOWHERE in package.json) and `jose`. Both are "type":"module";
#      require() of an ESM package works only on Node >= 22.12. NOTHING in
#      this repo pins Node - no .node-version, no .nvmrc, no engines field.
#      Staging booting this code proves STAGING's Node, not prod's.
#      FAILURE MODE: total boot failure on deploy. Not a degraded feature -
#      the whole API is down.
#      FIX BEFORE MERGING: set NODE_VERSION on the prod service (fastest, no
#      repo change), or add .node-version. An `engines` field touches
#      package.json = gate item 5.
#
# V2 — PROD BUILD COMMAND. Render -> workout-db-l3gc -> Settings -> Build.
#      REQUIRED: it runs `npm run render-build`
#      (= `prisma generate && prisma migrate deploy`).
#      WHY: this wave carries migration 20260804180000_add_ai_consent, which
#      is on staging but NOT on prod. render-build applies it at BUILD time,
#      before the new code starts - that is what satisfies the ordering
#      invariant automatically.
#      FAILURE MODE if the command differs: the migration never applies, the
#      generated Prisma client selects User.aiConnectorEnabled against a
#      column that does not exist, and EVERY default-selection User query
#      fails - login included. Prod outage.
#      FIX BEFORE MERGING: correct the build command, or apply the migration
#      by hand via section 3 and verify with section 4 before pushing.
```

Do not treat staging's configuration as evidence for either one. The August 4
incident happened by trusting exactly that kind of assumption.

### 10b. Prod env vars — set on `workout-db-l3gc` BEFORE the deploy

```
# MCP_RESOURCE_URL        = https://workout-db-l3gc.onrender.com/mcp
#   UNSET DEFAULTS TO http://localhost:3000/mcp (routes/index.js:18,
#   middleware/connectorAuth.js:21). The connector then advertises localhost
#   in discovery and rejects every real token on the audience check - silently,
#   with no error anywhere. This is the quietest failure in the whole wave.
#
# MCP_AUTHORIZATION_SERVER = <the PROD AuthKit issuer URL>
#   Read at MODULE LOAD (ai/tokenVerifier.js:1-2), so setting it after boot
#   does nothing until the service RESTARTS.
#
# WORKOS_API_KEY           = <the PROD WorkOS API key>
#   Only thrown at call time (ai/workosClient.js:4-7), so a missing key does
#   not block boot - it breaks the handshake when a user actually tries.
#
# COACH_API_KEY / COACH_PROVIDER - ONLY if Lane B ships with a hosted key.
#   CAREFUL: COACH_PROVIDER unset means "anthropic", NOT mock
#   (coach/config.js:18). With no COACH_API_KEY the coach degrades honestly
#   (keyResolver -> no_key, /coach/status -> available:false) - it does not
#   crash. Shipping with NO key is a valid choice: the panel renders
#   unavailable and BYO keys still work.
```

`server/.env.example` already carries the intended prod values as comments —
use it as the reference, not memory.

### 10c. WorkOS / AuthKit — the decision that has to come first

```
# DECIDE: does prod get its OWN AuthKit environment, or share staging's?
#   Staging currently uses scientific-mist-64-staging.authkit.app, and its
#   External Sign-in URI points at this BRANCH's Vercel PREVIEW host.
#   An AuthKit environment has ONE External Sign-in URI. So if prod and
#   staging share one, pointing it at prod BREAKS the staging connector, and
#   pointing it back breaks prod. A separate prod environment is the only
#   configuration in which both work.
#
# THEN: set the prod environment's External Sign-in URI to
#   <prod client origin>/connector/login  (the AI8 fix: client origin, NOT
#   the API host - a Vercel 404 here is what killed the August 8 smoke).
#
# NOTE: external_auth_id has a 300-second TTL (AuthKit sets Max-Age=300).
#   A slow password screen can genuinely expire a handshake.
```

### 10d. Verify AFTER the deploy (in this order)

```powershell
# 1. AI routes are live at all (404 = still serving pre-wave main):
curl.exe -s -o NUL -w "%{http_code}`n" https://workout-db-l3gc.onrender.com/ai/consent
#    EXPECT 401. A 404 means the deploy did not ship this wave.

# 2. Discovery advertises PROD, not localhost - this is the V-for-MCP_RESOURCE_URL check:
curl.exe -s https://workout-db-l3gc.onrender.com/.well-known/oauth-protected-resource

# 3. The connector challenges correctly:
curl.exe -si https://workout-db-l3gc.onrender.com/mcp | Select-String "HTTP/|WWW-Authenticate"
#    EXPECT 401 + WWW-Authenticate carrying resource_metadata.

# 4. What the coach is actually running on:
curl.exe -s https://workout-db-l3gc.onrender.com/coach/status
```
```
# 5. Migration landed - run section 4's history diff (prod vs staging), or the
#    information_schema query in section 3 against "AiConsent".
# 6. LOG IN ON PROD. The migration adds a NOT NULL column to User; if login
#    works, the ordering invariant held. This is the single most informative
#    check on this list - do not skip it because the curls passed.
# 7. Then the connector end to end from a real account, per the wave's
#    consolidated smoke (HANDOFF, Part B).
```

### 10e. Known-at-cutover — decide BEFORE, not during

```
# - STALE AUTHKIT SESSION BINDS THE WRONG IDENTITY. prompt=login is ignored;
#   a user who lands on the wrong LogChamp account stays bound to it and the
#   connector then answers with ANOTHER ACCOUNT'S DATA. Cross-user surface,
#   open, not config-fixable from the client. Ship or fix - but decide.
# - AI10 IS NOT LANDED. If a hosted COACH_API_KEY goes on prod, coach answers
#   truncate mid-sentence and palette generation returns 502 (max_tokens
#   shared with adaptive thinking). Moot if the coach ships with no key.
# - WHAT'S NEW FIRES ON THIS DEPLOY. Entry `2026-08-ai-assistant` is
#   prod-gated (lib/appEnv.js keys off the prod API host) and dated Aug 5 -
#   it describes the CONNECTOR ONLY and predates the coach, palette studio
#   and the entire September 9 redesign. It also advertises a feature that
#   does nothing until 10b and 10c are complete.
```

### 10f. Rollback

The migration is purely additive (new `AiConsent` table; `User.aiConnectorEnabled`
BOOLEAN NOT NULL **DEFAULT true**), so pre-wave code runs fine against the
migrated schema. Reverting `main` to `59e27dc` is therefore safe and needs NO
down-migration. Leave the table and column in place.
