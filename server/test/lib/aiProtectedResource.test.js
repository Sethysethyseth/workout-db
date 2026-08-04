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
      scopes: ["training:read"],
    });
    expect(doc.resource).toBe(RESOURCE_URL);
  });

  test('bearer_methods_supported is exactly ["header"]', () => {
    const doc = buildProtectedResourceMetadata({
      resourceUrl: RESOURCE_URL,
      authorizationServers: ["https://as.example.com"],
      scopes: ["training:read"],
    });
    expect(doc.bearer_methods_supported).toEqual(["header"]);
  });

  test("does not emit keys with undefined values", () => {
    const doc = buildProtectedResourceMetadata({
      resourceUrl: RESOURCE_URL,
      authorizationServers: [],
      scopes: undefined,
    });
    expect(Object.prototype.hasOwnProperty.call(doc, "scopes_supported")).toBe(
      false
    );
  });
});

describe("buildWwwAuthenticateHeader", () => {
  test('output contains resource_metadata="<url>" substring', () => {
    const header = buildWwwAuthenticateHeader({
      resourceMetadataUrl: METADATA_URL,
      scope: "training:read",
    });
    expect(header).toContain(`resource_metadata="${METADATA_URL}"`);
  });

  test("omits scope= entirely when no scope is passed", () => {
    const header = buildWwwAuthenticateHeader({
      resourceMetadataUrl: METADATA_URL,
    });
    expect(header).not.toMatch(/scope=/);
    expect(header).toContain(`resource_metadata="${METADATA_URL}"`);
  });
});
