const { verifyAuthToken } = require("../lib/jwt");
const { CONNECTOR_SCOPE } = require("./consent");

function createTokenVerifier() {
  // AI4 replaces this implementation with WorkOS JWKS verification (jose) + audience binding. The interface does not change.
  return {
    async verify(token) {
      try {
        const verified = verifyAuthToken(token);
        if (!verified || typeof verified.userId !== "string" || !verified.userId) {
          return null;
        }
        return { userId: verified.userId, scopes: [CONNECTOR_SCOPE] };
      } catch {
        return null;
      }
    },
  };
}

module.exports = {
  createTokenVerifier,
};
