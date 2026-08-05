const {
  hasExpectedAudience,
  normalizeScopes,
} = require("../../src/ai/tokenVerifier");

const RESOURCE_URL = "https://example.com/mcp";

describe("WorkOS token claim handling", () => {
  describe("audience validation", () => {
    test("accepts an exact string audience", () => {
      expect(hasExpectedAudience(RESOURCE_URL, RESOURCE_URL)).toBe(true);
    });

    test("accepts an array containing the expected audience", () => {
      expect(
        hasExpectedAudience(
          ["https://other.example.com", RESOURCE_URL],
          RESOURCE_URL
        )
      ).toBe(true);
    });

    test("rejects an array without the expected audience", () => {
      expect(
        hasExpectedAudience(["https://other.example.com"], RESOURCE_URL)
      ).toBe(false);
    });

    test("rejects a mismatched string audience", () => {
      expect(
        hasExpectedAudience("https://other.example.com", RESOURCE_URL)
      ).toBe(false);
    });
  });

  describe("scope normalization", () => {
    test("normalizes a space-delimited scope string", () => {
      expect(normalizeScopes({ scope: "training:read profile" })).toEqual([
        "training:read",
        "profile",
      ]);
    });

    test("normalizes a scopes array", () => {
      expect(
        normalizeScopes({ scopes: ["training:read", "profile"] })
      ).toEqual(["training:read", "profile"]);
    });
  });
});
