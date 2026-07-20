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
