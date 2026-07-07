require("dotenv").config();
const app = require("./app");
const { assertSafeForBoot } = require("./lib/dbHostGuard");
const { EXPECTED_MIGRATIONS } = require("./lib/expectedMigrations");
const prisma = require("./lib/prisma");
const { verifySchemaMigrations } = require("./lib/schemaSentinel");

const PORT = process.env.PORT || 3000;

async function startServer() {
  assertSafeForBoot(process.env.DATABASE_URL, process.env.NODE_ENV);

  await verifySchemaMigrations(prisma, {
    expected: EXPECTED_MIGRATIONS,
    databaseUrl: process.env.DATABASE_URL,
    skip: process.env.SKIP_SCHEMA_SENTINEL === "1",
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});