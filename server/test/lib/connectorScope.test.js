const {
  classifyConnectorToken,
} = require("../../src/middleware/connectorAuth");

describe("connector token classification (isolated)", () => {
  test("token with no scopes passes", () => {
    const result = classifyConnectorToken({
      userId: "u1",
      scopes: [],
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      failure: null,
    });
  });

  test("token with arbitrary scopes passes", () => {
    const result = classifyConnectorToken({
      userId: "u1",
      scopes: ["anything"],
    });
    expect(result).toEqual({
      ok: true,
      status: 200,
      failure: null,
    });
  });

  test("falsy/unverified token yields 401 unauthorized", () => {
    const result = classifyConnectorToken(null);
    expect(result).toEqual({
      ok: false,
      status: 401,
      failure: "unauthorized",
    });
  });
});
