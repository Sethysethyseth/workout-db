const prisma = require("../lib/prisma");
const {
  CONNECTOR_SCOPE,
  connectorAccess,
} = require("../ai/consent");
const {
  buildWwwAuthenticateHeader,
} = require("../ai/protectedResource");
const { createTokenVerifier } = require("../ai/tokenVerifier");

const verifier = createTokenVerifier();

function parseBearerToken(req) {
  const raw = req.headers && req.headers.authorization;
  if (typeof raw !== "string") return null;
  const [scheme, token] = raw.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  if (!token) return null;
  return token.trim();
}

function resourceMetadataUrl() {
  const resourceUrl =
    process.env.MCP_RESOURCE_URL || "http://localhost:3000/mcp";
  try {
    const u = new URL(resourceUrl);
    return `${u.origin}/.well-known/oauth-protected-resource`;
  } catch {
    return "http://localhost:3000/.well-known/oauth-protected-resource";
  }
}

/**
 * Pure scope/auth classification for unit tests and the guard.
 * Distinguishes authentication failure (401) from missing scope (403).
 */
function classifyConnectorToken(verified) {
  if (!verified) {
    return { ok: false, status: 401, failure: "unauthorized" };
  }
  const scopes = verified.scopes;
  if (!Array.isArray(scopes) || !scopes.includes(CONNECTOR_SCOPE)) {
    return { ok: false, status: 403, failure: "insufficient_scope" };
  }
  return { ok: true, status: 200, failure: null };
}

function sendUnauthorized(res) {
  const header = buildWwwAuthenticateHeader({
    resourceMetadataUrl: resourceMetadataUrl(),
    scope: CONNECTOR_SCOPE,
  });
  res.setHeader("WWW-Authenticate", header);
  return res.status(401).json({
    error: "unauthorized",
    error_description: "Authorization needed",
  });
}

async function connectorAuth(req, res, next) {
  try {
    const token = parseBearerToken(req);
    if (!token) {
      return sendUnauthorized(res);
    }

    const verified = await verifier.verify(token);
    const classified = classifyConnectorToken(verified);
    if (!classified.ok && classified.status === 401) {
      return sendUnauthorized(res);
    }
    if (!classified.ok && classified.status === 403) {
      return res.status(403).json({
        error: "forbidden",
        error_description: "Missing required scope",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: {
        aiConnectorEnabled: true,
        aiConsent: true,
      },
    });

    const access = connectorAccess({
      consentRow: user ? user.aiConsent : null,
      aiConnectorEnabled: user ? user.aiConnectorEnabled : false,
    });
    if (!access.allowed) {
      return res.status(403).json({
        error: "forbidden",
        reason: access.reason,
      });
    }

    req.connectorUserId = verified.userId;
    req.connectorScopes = verified.scopes;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = connectorAuth;
module.exports.classifyConnectorToken = classifyConnectorToken;
module.exports.CONNECTOR_SCOPE = CONNECTOR_SCOPE;
