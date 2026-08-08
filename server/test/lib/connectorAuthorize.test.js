const {
  connectorAuthorizeDecision,
} = require("../../src/lib/connectorAuthorize");

describe("connectorAuthorizeDecision", () => {
  test("allowed + id -> ok", () => {
    expect(
      connectorAuthorizeDecision({
        authUserId: "u1",
        externalAuthId: "01ABC",
        access: { allowed: true },
      })
    ).toEqual({ ok: true, reason: null });
  });

  test("whitespace id -> missing_external_auth_id", () => {
    expect(
      connectorAuthorizeDecision({
        authUserId: "u1",
        externalAuthId: "   ",
        access: { allowed: true },
      })
    ).toEqual({ ok: false, reason: "missing_external_auth_id" });
  });

  test("empty id beats consent_required", () => {
    expect(
      connectorAuthorizeDecision({
        authUserId: "u1",
        externalAuthId: "",
        access: { allowed: false },
      })
    ).toEqual({ ok: false, reason: "missing_external_auth_id" });
  });

  test("denied access -> consent_required", () => {
    expect(
      connectorAuthorizeDecision({
        authUserId: "u1",
        externalAuthId: "01ABC",
        access: { allowed: false },
      })
    ).toEqual({ ok: false, reason: "consent_required" });
  });

  test("null authUserId -> unauthenticated", () => {
    expect(
      connectorAuthorizeDecision({
        authUserId: null,
        externalAuthId: "01ABC",
        access: { allowed: true },
      })
    ).toEqual({ ok: false, reason: "unauthenticated" });
  });
});
