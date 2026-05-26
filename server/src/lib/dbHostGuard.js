const DENYLIST = ["ep-solitary-sea-an56mioq"];
const ALLOWLIST = ["ep-bitter-breeze-am81izlh", "localhost", "127.0.0.1"];

function parseHostname(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("dbHostGuard: DATABASE_URL is missing or unparseable");
  }
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    throw new Error("dbHostGuard: DATABASE_URL is missing or unparseable");
  }
}

function matchesDenylist(hostname) {
  return DENYLIST.some((entry) => hostname.includes(entry));
}

function matchesAllowlist(hostname) {
  return ALLOWLIST.some((entry) => {
    if (entry === "localhost" || entry === "127.0.0.1") {
      return hostname === entry;
    }
    return hostname.includes(entry);
  });
}

function assertSafeForReset(databaseUrl) {
  const hostname = parseHostname(databaseUrl);

  if (matchesDenylist(hostname)) {
    throw new Error(
      `dbHostGuard: refusing to reset DB — hostname '${hostname}' matches production denylist. This is the safety guard preventing the May 2026 wipe pattern.`,
    );
  }

  if (!matchesAllowlist(hostname)) {
    throw new Error(
      `dbHostGuard: refusing to reset DB — hostname '${hostname}' is not on the safe allowlist. Add it to ALLOWLIST in server/src/lib/dbHostGuard.js if intentional.`,
    );
  }
}

function assertSafeForBoot(databaseUrl, nodeEnv) {
  if (nodeEnv !== "test") {
    return;
  }

  let hostname;
  try {
    if (!databaseUrl) {
      console.error(
        "dbHostGuard: refusing test boot — DATABASE_URL is missing or unparseable",
      );
      process.exit(1);
    }
    hostname = new URL(databaseUrl).hostname;
  } catch {
    console.error(
      "dbHostGuard: refusing test boot — DATABASE_URL is missing or unparseable",
    );
    process.exit(1);
  }

  if (matchesDenylist(hostname)) {
    console.error(
      `dbHostGuard: refusing test boot — hostname '${hostname}' matches production denylist. This is the safety guard preventing the May 2026 wipe pattern.`,
    );
    process.exit(1);
  }
}

module.exports = { assertSafeForReset, assertSafeForBoot };
