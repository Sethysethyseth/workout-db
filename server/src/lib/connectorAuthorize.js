/**
 * Pure authorize-branch decision for the connector Login URI JSON endpoint.
 *
 * Property reads only - no Prisma, no env, no response handling - so the unit
 * lane can load this module. The caller passes AI1's connectorAccess(...)
 * result in as `access`; this helper never re-derives consent.
 */

function connectorAuthorizeDecision({ authUserId, externalAuthId, access }) {
  if (!authUserId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const id =
    typeof externalAuthId === "string" ? externalAuthId.trim() : "";
  if (!id) {
    return { ok: false, reason: "missing_external_auth_id" };
  }

  if (!access || !access.allowed) {
    return { ok: false, reason: "consent_required" };
  }

  return { ok: true, reason: null };
}

module.exports = {
  connectorAuthorizeDecision,
};
