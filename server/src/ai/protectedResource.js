/**
 * RFC 9728 Protected Resource Metadata helpers (pure - no Express).
 */

function buildProtectedResourceMetadata({
  resourceUrl,
  authorizationServers,
  scopes,
}) {
  const doc = {
    resource: resourceUrl,
    authorization_servers: authorizationServers,
    bearer_methods_supported: ["header"],
    scopes_supported: scopes,
  };
  for (const key of Object.keys(doc)) {
    if (doc[key] === undefined) delete doc[key];
  }
  return doc;
}

function buildWwwAuthenticateHeader({ resourceMetadataUrl, scope }) {
  const parts = [
    'Bearer error="unauthorized"',
    'error_description="Authorization needed"',
    `resource_metadata="${resourceMetadataUrl}"`,
  ];
  if (scope != null && scope !== "") {
    parts.push(`scope="${scope}"`);
  }
  return parts.join(", ");
}

module.exports = {
  buildProtectedResourceMetadata,
  buildWwwAuthenticateHeader,
};
