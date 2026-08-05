const {
  ipRateLimitKey,
  connectorRateLimitKey,
  aiRateLimitKey,
} = require("../../src/ai/rateLimitKeys");

describe("connectorRateLimitKey (/mcp per-identity budget)", () => {
  test("connector identity wins over any other identity on the request", () => {
    expect(
      connectorRateLimitKey({
        connectorUserId: "cku_abc",
        authUserId: "cku_other",
        ip: "1.2.3.4",
      })
    ).toBe("id:cku_abc");
  });

  test("never falls back to authUserId - no connector identity means an IP key", () => {
    const key = connectorRateLimitKey({ authUserId: "cku_999", ip: "1.2.3.4" });
    expect(key).toBe("ip:1.2.3.4");
    expect(key.startsWith("ip:")).toBe(true);
    expect(key).not.toBe("id:cku_999");
    expect(key).not.toContain("cku_999");
  });

  test("two connector identities get two different keys", () => {
    const first = connectorRateLimitKey({
      connectorUserId: "cku_one",
      ip: "1.2.3.4",
    });
    const second = connectorRateLimitKey({
      connectorUserId: "cku_two",
      ip: "1.2.3.4",
    });
    expect(first).toBe("id:cku_one");
    expect(second).toBe("id:cku_two");
    expect(first).not.toBe(second);
  });

  test("same connector identity from two IPs shares one bucket", () => {
    expect(
      connectorRateLimitKey({ connectorUserId: "cku_abc", ip: "1.2.3.4" })
    ).toBe(connectorRateLimitKey({ connectorUserId: "cku_abc", ip: "5.6.7.8" }));
  });

  test("no identity at all falls back to the IP key", () => {
    expect(connectorRateLimitKey({ ip: "1.2.3.4" })).toBe("ip:1.2.3.4");
  });
});

describe("aiRateLimitKey (/ai surface)", () => {
  test("keys on authUserId, which attachAuthUser has already set", () => {
    expect(aiRateLimitKey({ authUserId: "u1", ip: "1.2.3.4" })).toBe("id:u1");
  });

  test("two app identities get two different keys", () => {
    expect(aiRateLimitKey({ authUserId: "u1", ip: "1.2.3.4" })).not.toBe(
      aiRateLimitKey({ authUserId: "u2", ip: "1.2.3.4" })
    );
  });

  test("no authUserId falls back to the IP key", () => {
    expect(aiRateLimitKey({ ip: "1.2.3.4" })).toBe("ip:1.2.3.4");
  });

  test("ignores connectorUserId - /mcp identities are not billed to /ai", () => {
    expect(
      aiRateLimitKey({ connectorUserId: "cku_abc", ip: "1.2.3.4" })
    ).toBe("ip:1.2.3.4");
  });
});

describe("ipRateLimitKey (pre-auth failure ceiling)", () => {
  test("IPv4 addresses pass through under an ip: prefix", () => {
    expect(ipRateLimitKey({ ip: "1.2.3.4" })).toBe("ip:1.2.3.4");
  });

  test("IPv6 is normalized to a subnet via the ipKeyGenerator helper", () => {
    const key = ipRateLimitKey({ ip: "2001:db8:abcd:1234:5678:9abc:def0:1234" });
    expect(key).not.toBe("ip:2001:db8:abcd:1234:5678:9abc:def0:1234");
    expect(key).toBe(
      ipRateLimitKey({ ip: "2001:db8:abcd:1200:1111:2222:3333:4444" })
    );
  });
});
