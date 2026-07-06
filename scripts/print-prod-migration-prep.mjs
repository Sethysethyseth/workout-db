#!/usr/bin/env node
/**
 * Prints copy-paste SQL for applying the L-wave schema changes (L1 + L3) to
 * production Neon BEFORE merging logging-ux-wave to main.
 *
 * Does NOT connect to any database. Seth runs the output in the Neon SQL editor
 * for prod (ep-solitary-sea-an56mioq) per docs/RUNBOOK.md section 3.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(
  repoRoot,
  "server",
  "prisma",
  "migrations",
);

const PROD_MIGRATIONS = [
  "20260704120000_add_workout_set_side",
  "20260704130000_add_user_exercise",
];

function migrationChecksum(migrationName) {
  const sqlPath = path.join(migrationsDir, migrationName, "migration.sql");
  const sql = fs.readFileSync(sqlPath);
  return crypto.createHash("sha256").update(sql).digest("hex");
}

function readMigrationSql(migrationName) {
  const sqlPath = path.join(migrationsDir, migrationName, "migration.sql");
  return fs.readFileSync(sqlPath, "utf8").trimEnd();
}

function printInsertRow(migrationName, checksum) {
  return `-- _prisma_migrations row for ${migrationName}
INSERT INTO "_prisma_migrations"
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid(), '${checksum}', now(), '${migrationName}', NULL, NULL, now(), 1);`;
}

function printVerificationBlock() {
  return `-- Post-apply verification (RUNBOOK section 3)
SELECT migration_name, checksum
FROM "_prisma_migrations"
WHERE migration_name IN (
  '20260704120000_add_workout_set_side',
  '20260704130000_add_user_exercise'
)
ORDER BY migration_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'WorkoutSet' AND column_name = 'side';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'UserExercise'
ORDER BY ordinal_position;`;
}

function main() {
  console.log(`# Prod migration prep - L1 + L3 (logging-ux-wave)
#
# TARGET: Neon prod only (snowy-resonance / ep-solitary-sea-an56mioq).
# Confirm the host in the Neon URL bar before running ANY statement below.
#
# ORDER (load-bearing):
#   1. Run this SQL in prod Neon BEFORE merging logging-ux-wave to main.
#   2. Verify the post-apply queries at the bottom.
#   3. ONLY THEN merge/push so Render auto-deploys the code.
#
# Pre-flight: compare prod vs staging migration history (RUNBOOK section 4):
#   SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY migration_name;
#
# Expected staging checksums for the two new rows (copy for cross-check):
`);

  for (const migrationName of PROD_MIGRATIONS) {
    console.log(`#   ${migrationName}: ${migrationChecksum(migrationName)}`);
  }

  console.log("\n-- BEGIN PROD SQL --\n");

  for (const migrationName of PROD_MIGRATIONS) {
    const checksum = migrationChecksum(migrationName);
    const sql = readMigrationSql(migrationName);

    console.log(`-- ${migrationName}`);
    console.log(sql);
    console.log("");
    console.log(printInsertRow(migrationName, checksum));
    console.log("");
  }

  console.log(printVerificationBlock());
  console.log("\n-- END PROD SQL --");
}

main();
