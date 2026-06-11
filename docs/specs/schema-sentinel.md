# Spec: Schema Sentinel (boot-time migration check)

**Tier:** yellow (touches server boot path; no schema change, no auth logic change)
**Status:** proposed June 11, 2026 — not yet implemented
**Motivation:** June 08 prod incident — code deployed expecting `displayName`/`usernameKey` before the migration reached prod Neon; result was a cryptic Prisma crash at login. The manual schema-change deploy discipline reduces the odds of a repeat; the sentinel changes the *failure mode* when discipline slips: from "users hit a broken app" to "deploy fails loudly with the actual cause, old version keeps serving."

This does NOT automate migrations. It only verifies, at startup, that the database the server is about to use has the migrations the code expects.

---

## Behavior

1. A constant in code lists the migrations this build requires:
   ```js
   // server/src/lib/expectedMigrations.js
   // Append a name here in the SAME commit that adds a migration directory.
   module.exports.EXPECTED_MIGRATIONS = [
     '20260603140000_add_user_username',
     // '20260527120000_add_exercise_catalog',  ← uncomment when catalog merges
   ];
   ```
2. On server boot, before `app.listen()`:
   - Query: `SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL;`
   - Compute `missing = EXPECTED_MIGRATIONS - applied`.
   - If `missing` is non-empty → log one unmistakable line and **exit non-zero**:
     ```
     [SCHEMA SENTINEL] DB <host> is missing required migrations: <names>.
     Apply them per RUNBOOK section 3 before deploying this code. Refusing to start.
     ```
   - If `_prisma_migrations` doesn't exist → same treatment (the DB is not a provisioned environment for this app).
3. **Why exit-on-fail is safe on Render:** Render health-checks the new instance before switching traffic; a process that exits keeps the previous deploy serving. That is the entire point.
4. Escape hatch: `SKIP_SCHEMA_SENTINEL=1` env var bypasses the check (logged loudly). For local throwaway DBs only; never set on Render.

## Non-goals

- Does not run, generate, or suggest migrations.
- Does not validate column shapes (migration names are the proxy; good enough).
- Does not replace the manual deploy discipline — it backstops it.

## Cursor prompt sketch (when scheduled)

Pre-implementation report required. DO NOT TOUCH: `schema.prisma`, any migration files, auth controllers, `dbHostGuard`. Files expected: new `expectedMigrations.js`, new `schemaSentinel.js`, one call-site edit in `server.js` before `listen()`. Verification: (1) boot against staging with the username migration listed → starts clean; (2) add a fake name to the list → boots, logs the sentinel error naming it, exits non-zero; (3) `SKIP_SCHEMA_SENTINEL=1` with the fake name → starts with a loud bypass warning. Confirm exit code in terminal yourself, not via Cursor's report.

## Maintenance rule (goes in master prompt once shipped)

Every commit that adds a `prisma/migrations/<name>/` directory must append `<name>` to `EXPECTED_MIGRATIONS` in the same commit. A migration not listed is invisible to the sentinel.
