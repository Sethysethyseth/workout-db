const {
  isConsentActive,
  consentStateFor,
  connectorAccess,
  CONNECTOR_SCOPE,
} = require("../../src/ai/consent");

const grantedAt = new Date("2026-08-01T12:00:00.000Z");
const revokedAt = new Date("2026-08-02T12:00:00.000Z");

const activeRow = {
  grantedAt,
  revokedAt: null,
  scope: CONNECTOR_SCOPE,
};

const revokedRow = {
  grantedAt,
  revokedAt,
  scope: CONNECTOR_SCOPE,
};

describe("isConsentActive", () => {
  test("isConsentActive(null) -> false", () => {
    expect(isConsentActive(null)).toBe(false);
  });

  test("isConsentActive({ grantedAt, revokedAt: null }) -> true", () => {
    expect(isConsentActive({ grantedAt, revokedAt: null })).toBe(true);
  });

  test("isConsentActive({ grantedAt, revokedAt }) -> false", () => {
    expect(isConsentActive({ grantedAt, revokedAt })).toBe(false);
  });
});

describe("consentStateFor", () => {
  test("active row returns granted ISO state", () => {
    expect(consentStateFor(activeRow)).toEqual({
      granted: true,
      grantedAt: grantedAt.toISOString(),
      scope: CONNECTOR_SCOPE,
    });
  });

  test("missing or revoked row returns not granted", () => {
    expect(consentStateFor(null)).toEqual({
      granted: false,
      grantedAt: null,
      scope: null,
    });
    expect(consentStateFor(revokedRow)).toEqual({
      granted: false,
      grantedAt: null,
      scope: null,
    });
  });
});

describe("connectorAccess", () => {
  test('no consent -> { allowed: false, reason: "no_consent" }', () => {
    expect(
      connectorAccess({ consentRow: null, aiConnectorEnabled: true })
    ).toEqual({ allowed: false, reason: "no_consent" });
  });

  test('active consent, not entitled -> { allowed: false, reason: "not_entitled" }', () => {
    expect(
      connectorAccess({ consentRow: activeRow, aiConnectorEnabled: false })
    ).toEqual({ allowed: false, reason: "not_entitled" });
  });

  test("active consent, entitled -> { allowed: true, reason: null }", () => {
    expect(
      connectorAccess({ consentRow: activeRow, aiConnectorEnabled: true })
    ).toEqual({ allowed: true, reason: null });
  });

  test('revoked consent -> { allowed: false, reason: "no_consent" }', () => {
    expect(
      connectorAccess({ consentRow: revokedRow, aiConnectorEnabled: true })
    ).toEqual({ allowed: false, reason: "no_consent" });
  });
});
