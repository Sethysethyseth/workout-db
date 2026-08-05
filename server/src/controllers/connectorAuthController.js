const prisma = require("../lib/prisma");
const { connectorAccess } = require("../ai/consent");
const {
  completeConnectorAuthorization,
} = require("../ai/workosClient");

function getClientOrigin() {
  const configured = process.env.CLIENT_ORIGIN;
  if (typeof configured !== "string") return null;
  const origin = configured
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  return origin ? origin.replace(/\/+$/, "") : null;
}

function currentRequestUrl(req) {
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

async function connectorLogin(req, res) {
  const externalAuthId =
    typeof req.query.external_auth_id === "string"
      ? req.query.external_auth_id
      : "";
  if (!externalAuthId.trim()) {
    return res
      .status(400)
      .type("text/plain")
      .send("This connector login link is missing required information.");
  }

  const clientOrigin = getClientOrigin();
  if (!clientOrigin) {
    console.error(
      "Connector authorization failed: CLIENT_ORIGIN is not configured"
    );
    return res
      .status(500)
      .type("text/plain")
      .send("Connector authorization is temporarily unavailable.");
  }

  if (!req.authUserId) {
    const next = encodeURIComponent(currentRequestUrl(req));
    return res.redirect(`${clientOrigin}/login?next=${next}`);
  }

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
    if (!access.allowed) {
      return res.redirect(`${clientOrigin}/profile/ai`);
    }

    const redirectUri = await completeConnectorAuthorization(
      { id: user.id, email: user.email },
      externalAuthId
    );
    return res.redirect(redirectUri);
  } catch (error) {
    console.error("Connector authorization completion failed", error);
    return res
      .status(500)
      .type("text/plain")
      .send("We could not finish connecting your LogChamp account.");
  }
}

module.exports = {
  connectorLogin,
};
