// LOCAL descriptor for the AiConsent audit row only. Must never again be
// advertised in protected-resource metadata, sent in a WWW-Authenticate
// header, or required of an access token - the authorization server
// (WorkOS AuthKit) cannot issue this custom scope.
const CONNECTOR_SCOPE = "training:read";

function isConsentActive(row) {
  if (!row) return false;
  if (!row.grantedAt) return false;
  if (row.revokedAt != null) return false;
  return true;
}

function consentStateFor(row) {
  if (!isConsentActive(row)) {
    return { granted: false, grantedAt: null, scope: null };
  }
  const grantedAt =
    row.grantedAt instanceof Date
      ? row.grantedAt.toISOString()
      : new Date(row.grantedAt).toISOString();
  return {
    granted: true,
    grantedAt,
    scope: row.scope ?? null,
  };
}

function connectorAccess({ consentRow, aiConnectorEnabled }) {
  if (!isConsentActive(consentRow)) {
    return { allowed: false, reason: "no_consent" };
  }
  if (!aiConnectorEnabled) {
    return { allowed: false, reason: "not_entitled" };
  }
  return { allowed: true, reason: null };
}

module.exports = {
  CONNECTOR_SCOPE,
  isConsentActive,
  consentStateFor,
  connectorAccess,
};
