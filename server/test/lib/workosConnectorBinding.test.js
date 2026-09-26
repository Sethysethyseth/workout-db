const {
  revokeWorkosConnectorBinding,
} = require("../../src/ai/workosClient");
const { withBoundAccount } = require("../../src/ai/mcpServer");

const API_KEY = "sk_test_id1";
const EXTERNAL_ID = "user/with spaces+plus";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body == null ? "" : JSON.stringify(body)),
  };
}

function emptyOk(status = 200) {
  return {
    ok: true,
    status,
    text: async () => "",
  };
}

describe("revokeWorkosConnectorBinding", () => {
  const priorKey = process.env.WORKOS_API_KEY;

  beforeEach(() => {
    process.env.WORKOS_API_KEY = API_KEY;
  });

  afterEach(() => {
    if (priorKey === undefined) {
      delete process.env.WORKOS_API_KEY;
    } else {
      process.env.WORKOS_API_KEY = priorKey;
    }
  });

  test("external-id lookup 404 returns found:false and makes no further calls", async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(404, { message: "not found" }));

    await expect(
      revokeWorkosConnectorBinding(EXTERNAL_ID, { fetchImpl })
    ).resolves.toEqual({
      found: false,
      sessionsRevoked: 0,
      applicationsRemoved: 0,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(
      `https://api.workos.com/user_management/users/external_id/${encodeURIComponent(
        EXTERNAL_ID
      )}`
    );
    expect(init.headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });

  test("revokes every session and deletes every authorized app", async () => {
    const fetchImpl = jest.fn(async (url, init) => {
      if (url.includes("/users/external_id/")) {
        return jsonResponse(200, { id: "user_wo_1", email: "x@y.z" });
      }
      if (url.includes("/sessions") && (!init.method || init.method === "GET")) {
        return jsonResponse(200, {
          object: "list",
          data: [{ id: "session_1" }, { id: "session_2" }],
          list_metadata: { before: null, after: null },
        });
      }
      if (url.endsWith("/sessions/revoke")) {
        return emptyOk(200);
      }
      if (url.includes("/authorized_applications") && init.method === "DELETE") {
        return { ok: true, status: 204, text: async () => "" };
      }
      if (url.includes("/authorized_applications")) {
        return jsonResponse(200, {
          object: "list",
          data: [
            {
              id: "authorized_connect_app_1",
              application: { id: "conn_app_1" },
            },
          ],
          list_metadata: { before: null, after: null },
        });
      }
      throw new Error(`unexpected fetch ${init.method} ${url}`);
    });

    await expect(
      revokeWorkosConnectorBinding(EXTERNAL_ID, { fetchImpl })
    ).resolves.toEqual({
      found: true,
      sessionsRevoked: 2,
      applicationsRemoved: 1,
    });

    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(5);
    for (const [, init] of fetchImpl.mock.calls) {
      expect(init.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    }

    const lookupUrl = fetchImpl.mock.calls[0][0];
    expect(lookupUrl).toContain(encodeURIComponent(EXTERNAL_ID));
    expect(lookupUrl).not.toContain("user/with spaces");

    const revokeCalls = fetchImpl.mock.calls.filter(
      ([url, init]) => url.endsWith("/sessions/revoke") && init.method === "POST"
    );
    expect(revokeCalls).toHaveLength(2);
    const sessionIds = revokeCalls.map(([, init]) => JSON.parse(init.body).session_id);
    expect(sessionIds).toEqual(["session_1", "session_2"]);

    const deleteCalls = fetchImpl.mock.calls.filter(
      ([, init]) => init.method === "DELETE"
    );
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0][0]).toBe(
      "https://api.workos.com/user_management/users/user_wo_1/authorized_applications/conn_app_1"
    );
  });

  test("a 500 from WorkOS throws with the status", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => "boom",
    }));

    await expect(
      revokeWorkosConnectorBinding("u1", { fetchImpl })
    ).rejects.toMatchObject({ status: 500 });
  });

  test("missing WORKOS_API_KEY throws before any fetch", async () => {
    delete process.env.WORKOS_API_KEY;
    const fetchImpl = jest.fn();

    await expect(
      revokeWorkosConnectorBinding("u1", { fetchImpl })
    ).rejects.toThrow(/not configured/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("withBoundAccount", () => {
  test("stamps email and note without mutating the input", () => {
    const input = { a: 1 };
    const result = withBoundAccount(input, "x@y.z");
    expect(result).toEqual({
      a: 1,
      boundAccount: { email: "x@y.z" },
      boundAccountNote:
        'If this is not the account the user expects, tell them to use "Sign out of connected assistants" under Profile -> AI access in LogChamp and reconnect.',
    });
    expect(input).toEqual({ a: 1 });
    expect(result).not.toBe(input);
  });
});
