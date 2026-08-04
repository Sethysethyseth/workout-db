const prisma = require("../lib/prisma");
const {
  CONNECTOR_SCOPE,
  consentStateFor,
} = require("../ai/consent");

async function loadConsentPayload(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiConnectorEnabled: true,
      aiConsent: true,
    },
  });
  if (!user) return null;
  return {
    ...consentStateFor(user.aiConsent),
    connectorEnabled: user.aiConnectorEnabled,
  };
}

async function getConsent(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = await loadConsentPayload(userId);
    if (!payload) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

async function grantConsent(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const now = new Date();
    await prisma.aiConsent.upsert({
      where: { userId },
      create: {
        userId,
        scope: CONNECTOR_SCOPE,
        grantedAt: now,
        revokedAt: null,
      },
      update: {
        scope: CONNECTOR_SCOPE,
        grantedAt: now,
        revokedAt: null,
      },
    });

    const payload = await loadConsentPayload(userId);
    if (!payload) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

async function revokeConsent(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // AI4: revoking consent must also revoke issued connector tokens.
    const existing = await prisma.aiConsent.findUnique({
      where: { userId },
    });
    if (existing && existing.revokedAt == null) {
      await prisma.aiConsent.update({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    }

    const payload = await loadConsentPayload(userId);
    if (!payload) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getConsent,
  grantConsent,
  revokeConsent,
};
