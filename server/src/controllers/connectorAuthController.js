const prisma = require("../lib/prisma");
const { connectorAccess } = require("../ai/consent");
const {
  completeConnectorAuthorization,
} = require("../ai/workosClient");
const {
  connectorAuthorizeDecision,
} = require("../lib/connectorAuthorize");

async function connectorAuthorize(req, res) {
  const externalAuthId =
    typeof req.body?.external_auth_id === "string"
      ? req.body.external_auth_id
      : "";

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.authUserId },
      select: {
        id: true,
        email: true,
        aiConnectorEnabled: true,
        aiConsent: true,
      },
    });
    if (!user) {
      throw new Error("Authenticated connector user was not found");
    }

    const access = connectorAccess({
      consentRow: user.aiConsent,
      aiConnectorEnabled: user.aiConnectorEnabled,
    });
    const decision = connectorAuthorizeDecision({
      authUserId: req.authUserId,
      externalAuthId,
      access,
    });

    if (!decision.ok) {
      if (decision.reason === "missing_external_auth_id") {
        return res.status(400).json({ error: "missing_external_auth_id" });
      }
      if (decision.reason === "consent_required") {
        return res.status(403).json({ error: "consent_required" });
      }
      return res.status(401).json({ error: "unauthenticated" });
    }

    try {
      const redirectUri = await completeConnectorAuthorization(
        { id: user.id, email: user.email },
        externalAuthId.trim()
      );
      return res.status(200).json({ redirectUri });
    } catch (error) {
      console.error("Connector authorization completion failed", error);
      return res.status(409).json({ error: "authorization_expired" });
    }
  } catch (error) {
    console.error("Connector authorization failed", error);
    return res.status(500).json({ error: "authorization_failed" });
  }
}

module.exports = {
  connectorAuthorize,
};
