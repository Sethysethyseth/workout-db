const prisma = require("../lib/prisma");
const {
  CONNECTOR_SCOPE,
  consentStateFor,
  isConsentActive,
  blockDraftsAllowed,
} = require("../ai/consent");
const {
  revokeWorkosConnectorBinding,
} = require("../ai/workosClient");

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
    blockDraftsAllowed: blockDraftsAllowed(user.aiConsent),
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
    // BK11: also clear the block-drafts opt-in.
    const existing = await prisma.aiConsent.findUnique({
      where: { userId },
    });
    if (existing && existing.revokedAt == null) {
      await prisma.aiConsent.update({
        where: { userId },
        data: {
          revokedAt: new Date(),
          blockDraftsAllowedAt: null,
        },
      });
    }

    const payload = await loadConsentPayload(userId);
    if (!payload) {
      return res.status(404).json({ error: "User not found" });
    }

    // Best-effort: end the AuthKit session and authorized apps so a later
    // connect cannot silently re-bind the same WorkOS identity. Failure is
    // logged with the counts actually achieved; the consent row stays the
    // authoritative block.
    try {
      await revokeWorkosConnectorBinding(userId);
    } catch (err) {
      console.error("[ai] WorkOS cleanup after revokeConsent failed", {
        userId,
        status: err.status,
        sessionsRevoked: err.sessionsRevoked ?? 0,
        applicationsRemoved: err.applicationsRemoved ?? 0,
        message: err.message,
      });
    }

    return res.json(payload);
  } catch (err) {
    return next(err);
  }
}

async function setBlockDraftsAllowed(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowed = req.body && req.body.allowed;
    if (typeof allowed !== "boolean") {
      return res.status(400).json({ error: "allowed must be a boolean" });
    }

    const existing = await prisma.aiConsent.findUnique({
      where: { userId },
    });
    if (!isConsentActive(existing)) {
      return res.status(409).json({
        error: "Turn on AI access before letting assistants draft blocks.",
      });
    }

    await prisma.aiConsent.update({
      where: { userId },
      data: {
        blockDraftsAllowedAt: allowed ? new Date() : null,
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

async function signOutConnector(req, res, next) {
  try {
    const userId = req.authUserId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const result = await revokeWorkosConnectorBinding(userId);
      return res.json(result);
    } catch (err) {
      console.error("[ai] WorkOS connector signout failed", {
        userId,
        status: err.status,
        sessionsRevoked: err.sessionsRevoked ?? 0,
        applicationsRemoved: err.applicationsRemoved ?? 0,
        message: err.message,
      });
      return res.status(502).json({ error: "workos_unavailable" });
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getConsent,
  grantConsent,
  revokeConsent,
  setBlockDraftsAllowed,
  signOutConnector,
};
