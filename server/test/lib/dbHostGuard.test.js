const {
  assertSafeForReset,
  assertRecognizedHost,
} = require("../../src/lib/dbHostGuard");

// Real host fragments the guard keys off of (see dbHostGuard.js lists).
const PROD_URL =
  "postgresql://u:p@ep-solitary-sea-an56mioq.us-east-2.aws.neon.tech/db?sslmode=require";
const STAGING_URL =
  "postgresql://u:p@ep-bitter-breeze-am81izlh.us-east-2.aws.neon.tech/db?sslmode=require";
const LOCALHOST_URL = "postgresql://u:p@localhost:5432/db";
const UNKNOWN_URL =
  "postgresql://u:p@ep-some-other-project-xxxx.us-east-2.aws.neon.tech/db";

describe("assertSafeForReset (destructive - staging/localhost only)", () => {
  test("refuses the prod host (the wipe guard must never loosen)", () => {
    expect(() => assertSafeForReset(PROD_URL)).toThrow(/denylist/i);
  });

  test("refuses an unknown host", () => {
    expect(() => assertSafeForReset(UNKNOWN_URL)).toThrow(/allowlist/i);
  });

  test("refuses a missing/unparseable URL", () => {
    expect(() => assertSafeForReset(undefined)).toThrow(/missing or unparseable/i);
    expect(() => assertSafeForReset("not a url")).toThrow(/missing or unparseable/i);
  });

  test("permits staging and localhost", () => {
    expect(() => assertSafeForReset(STAGING_URL)).not.toThrow();
    expect(() => assertSafeForReset(LOCALHOST_URL)).not.toThrow();
  });
});

describe("assertRecognizedHost (non-destructive - prod-eligible)", () => {
  test("permits the prod host (idempotent seed / null-only backfill)", () => {
    expect(() => assertRecognizedHost(PROD_URL)).not.toThrow();
  });

  test("permits staging and localhost", () => {
    expect(() => assertRecognizedHost(STAGING_URL)).not.toThrow();
    expect(() => assertRecognizedHost(LOCALHOST_URL)).not.toThrow();
  });

  test("refuses an unknown host (guards against a typo'd DATABASE_URL)", () => {
    expect(() => assertRecognizedHost(UNKNOWN_URL)).toThrow(/not a recognized/i);
  });

  test("refuses a missing/unparseable URL", () => {
    expect(() => assertRecognizedHost(undefined)).toThrow(/missing or unparseable/i);
    expect(() => assertRecognizedHost("not a url")).toThrow(/missing or unparseable/i);
  });
});
