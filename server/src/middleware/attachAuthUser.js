const { verifyAuthToken } = require("../lib/jwt");

function parseBearerToken(req) {
  const raw = req.headers && req.headers.authorization;
  if (typeof raw !== "string") return null;
  const [scheme, token] = raw.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  if (!token) return null;
  return token.trim();
}

module.exports = function attachAuthUser(req, res, next) {
  // Prefer Authorization header (reliable in iOS standalone mode).
  const token = parseBearerToken(req);
  if (token) {
    try {
      const verified = verifyAuthToken(token);
      if (verified && verified.userId) {
        req.authUserId = verified.userId;
      }
    } catch {
      // Invalid/expired token -> treat as unauthenticated.
    }
  }

  // Back-compat: allow existing cookie sessions to continue working.
  if (!req.authUserId && req.session && req.session.userId) {
    req.authUserId = req.session.userId;
  }

  next();
};

