const { ipKeyGenerator } = require("express-rate-limit");

/**
 * Rate-limit key derivation for the connector (/mcp) and app AI (/ai) surfaces.
 *
 * Pure property reads only - no Prisma, no env, no response handling - so the
 * unit lane can load this module. app.js wires these into rateLimit() as
 * keyGenerator functions; it never derives a key inline.
 *
 * IPv6 must go through express-rate-limit's ipKeyGenerator helper: v8 requires
 * it, and raw req.ip would let an IPv6 client rotate addresses within its own
 * subnet to bypass the limit.
 */

/** Shared IP-derived key. Also the fallback whenever no identity is present. */
function ipRateLimitKey(req) {
  return `ip:${ipKeyGenerator(req.ip)}`;
}

/**
 * Key for the /mcp per-identity budget. Reads req.connectorUserId ONLY.
 *
 * It must never consult req.authUserId. A WorkOS-issued connector token and a
 * LogChamp cookie/JWT session are different identities from different issuers;
 * substituting one for the other on a rate-limit key would make this surface
 * report the wrong principal. With no connector identity, fall back to IP -
 * never to another identity.
 */
function connectorRateLimitKey(req) {
  const connectorUserId = req.connectorUserId;
  if (connectorUserId) return `id:${connectorUserId}`;
  return ipRateLimitKey(req);
}

/** Key for the /ai surface, where attachAuthUser has already run. */
function aiRateLimitKey(req) {
  const authUserId = req.authUserId;
  if (authUserId) return `id:${authUserId}`;
  return ipRateLimitKey(req);
}

module.exports = {
  ipRateLimitKey,
  connectorRateLimitKey,
  aiRateLimitKey,
};
