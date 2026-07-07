const { URL } = require("url");

function findMissingMigrations(expected, applied) {
  const appliedSet = new Set(applied);
  return expected.filter((name) => !appliedSet.has(name));
}

function formatSentinelHost(databaseUrl) {
  if (!databaseUrl) {
    return "<unknown-host>";
  }
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "<unparseable-host>";
  }
}

function logSentinelBypass() {
  console.warn(
    "[SCHEMA SENTINEL] SKIP_SCHEMA_SENTINEL=1 is set - bypassing migration check. For local throwaway DBs only; never set on Render.",
  );
}

function exitOnMissingMigrations(missing, databaseUrl) {
  const host = formatSentinelHost(databaseUrl);
  console.error(
    `[SCHEMA SENTINEL] DB ${host} is missing required migrations: ${missing.join(", ")}. Apply them per RUNBOOK section 3 before deploying this code. Refusing to start.`,
  );
  process.exit(1);
}

async function queryAppliedMigrations(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NULL
  `;
  return rows.map((row) => row.migration_name);
}

async function verifySchemaMigrations(prisma, options) {
  const { expected, databaseUrl, skip = false } = options;

  if (skip) {
    logSentinelBypass();
    return;
  }

  let applied;
  try {
    applied = await queryAppliedMigrations(prisma);
  } catch (error) {
    const host = formatSentinelHost(databaseUrl);
    console.error(
      `[SCHEMA SENTINEL] DB ${host} is missing required migrations: _prisma_migrations table is unavailable (${error.message}). Apply them per RUNBOOK section 3 before deploying this code. Refusing to start.`,
    );
    process.exit(1);
  }

  const missing = findMissingMigrations(expected, applied);
  if (missing.length > 0) {
    exitOnMissingMigrations(missing, databaseUrl);
  }
}

module.exports = {
  findMissingMigrations,
  formatSentinelHost,
  logSentinelBypass,
  exitOnMissingMigrations,
  queryAppliedMigrations,
  verifySchemaMigrations,
};
