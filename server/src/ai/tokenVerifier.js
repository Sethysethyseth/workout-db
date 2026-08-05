const AUTHORIZATION_SERVER = process.env.MCP_AUTHORIZATION_SERVER?.trim();
const MCP_RESOURCE_URL = process.env.MCP_RESOURCE_URL?.trim();
let jwksPromise = null;

function getJwks() {
  if (!jwksPromise) {
    jwksPromise = import("jose").then(({ createRemoteJWKSet }) =>
      createRemoteJWKSet(
        new URL(`${AUTHORIZATION_SERVER.replace(/\/+$/, "")}/oauth2/jwks`)
      )
    );
  }
  return jwksPromise;
}

function hasExpectedAudience(audience, expectedAudience) {
  if (typeof audience === "string") {
    return audience === expectedAudience;
  }
  if (Array.isArray(audience)) {
    return audience.includes(expectedAudience);
  }
  return false;
}

function normalizeScopes(payload) {
  if (typeof payload.scope === "string") {
    return payload.scope.split(/\s+/).filter(Boolean);
  }
  if (Array.isArray(payload.scopes)) {
    return payload.scopes.filter((scope) => typeof scope === "string");
  }
  return [];
}

function createTokenVerifier() {
  return {
    async verify(token) {
      try {
        if (!AUTHORIZATION_SERVER || !MCP_RESOURCE_URL) {
          return null;
        }
        const [{ jwtVerify }, jwks] = await Promise.all([
          import("jose"),
          getJwks(),
        ]);
        const { payload } = await jwtVerify(token, jwks, {
          issuer: AUTHORIZATION_SERVER,
          audience: MCP_RESOURCE_URL,
        });
        if (!hasExpectedAudience(payload.aud, MCP_RESOURCE_URL)) {
          return null;
        }
        if (typeof payload.sub !== "string" || !payload.sub) {
          return null;
        }
        return {
          userId: payload.sub,
          scopes: normalizeScopes(payload),
        };
      } catch {
        return null;
      }
    },
  };
}

module.exports = {
  createTokenVerifier,
  hasExpectedAudience,
  normalizeScopes,
};
