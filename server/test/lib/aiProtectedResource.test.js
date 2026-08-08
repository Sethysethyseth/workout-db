const {
  buildProtectedResourceMetadata,
  buildWwwAuthenticateHeader,
} = require("../../src/ai/protectedResource");

const RESOURCE_URL = "https://example.com/mcp";
const METADATA_URL =
  "https://example.com/.well-known/oauth-protected-resource";

describe("buildProtectedResourceMetadata", () => {
  test("resource key equals the passed resourceUrl", () => {
    const doc = buildProtectedResourceMetadata({
      resourceUrl: RESOURCE_URL,
      authorizationServers: [],
    });
    expect(doc.resource).toBe(RESOURCE_URL);
  });

  test('bearer_methods_supported is exactly ["header"]', () => {
    const doc = buildProtectedResourceMetadata({
      resourceUrl: RESOURCE_URL,
      authorizationServers: ["https://as.example.com"],
    });
    expect(doc.bearer_methods_supported).toEqual(["header"]);
  });

  test("does not include scopes_supported when scopes are omitted (routes contract)", () => {
    const doc = buildProtectedResourceMetadata({
      resourceUrl: RESOURCE_URL,
      authorizationServers: [],
    });
    expect("scopes_supported" in doc).toBe(false);
  });
});

describe("buildWwwAuthenticateHeader", () => {
  test("sendUnauthorized contract: resource_metadata present, no scope=", () => {
    const header = buildWwwAuthenticateHeader({
      resourceMetadataUrl: METADATA_URL,
    });
    expect(header).toContain(`resource_metadata="${METADATA_URL}"`);
    expect(header).not.toContain("scope=");
  });
});
