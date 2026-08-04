const {
  classifyConnectorToken,
  CONNECTOR_SCOPE,
} = require("../../src/middleware/connectorAuth");

describe("connector scope check (isolated)", () => {
  test("token whose scopes lack CONNECTOR_SCOPE is rejected", () => {
    const result = classifyConnectorToken({
      userId: "user-1",
      scopes: ["other:scope"],
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.failure).toBe("insufficient_scope");
  });

  test("token that has CONNECTOR_SCOPE passes", () => {
    const result = classifyConnectorToken({
      userId: "user-1",
      scopes: [CONNECTOR_SCOPE],
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  test("scope rejection is distinguishable from authentication failure", () => {
    const authFailure = classifyConnectorToken(null);
    const scopeFailure = classifyConnectorToken({
      userId: "user-1",
      scopes: [],
    });
    expect(authFailure.status).toBe(401);
    expect(authFailure.failure).toBe("unauthorized");
    expect(scopeFailure.status).toBe(403);
    expect(scopeFailure.failure).toBe("insufficient_scope");
    expect(authFailure.status).not.toBe(scopeFailure.status);
  });
});
