const { resolveCoachKey } = require("../../src/coach/keyResolver");

const GOOD_KEY = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789";

describe("resolveCoachKey - one code path, different key source", () => {
  test("a caller's own key wins over the hosted key, entitled or not", () => {
    const result = resolveCoachKey({
      byoKey: `  ${GOOD_KEY}  `,
      hostedKey: "sk-ant-hosted-0123456789abcdefghijklmnop",
      entitled: false,
    });
    expect(result).toEqual({ source: "byo", key: GOOD_KEY, reason: null });
  });

  test("hosted key requires entitlement", () => {
    const hosted = "sk-ant-hosted-0123456789abcdefghijklmnop";
    expect(resolveCoachKey({ byoKey: null, hostedKey: hosted, entitled: true })).toEqual({
      source: "hosted",
      key: hosted,
      reason: null,
    });
    expect(resolveCoachKey({ byoKey: "", hostedKey: hosted, entitled: false })).toEqual({
      source: null,
      key: null,
      reason: "not_entitled",
    });
  });

  test("no key anywhere is a plain 'no_key'", () => {
    expect(resolveCoachKey({ byoKey: undefined, hostedKey: "   ", entitled: true })).toEqual({
      source: null,
      key: null,
      reason: "no_key",
    });
  });

  test("a malformed caller key never reaches the provider", () => {
    expect(
      resolveCoachKey({ byoKey: "hunter2", hostedKey: GOOD_KEY, entitled: true })
    ).toEqual({ source: null, key: null, reason: "bad_key_format" });
  });
});
