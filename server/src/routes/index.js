const express = require("express");
const authRoutes = require("./authRoutes");
const exerciseRoutes = require("./exerciseRoutes");
const templateRoutes = require("./templateRoutes");
const blockTemplateRoutes = require("./blockTemplateRoutes");
const sessionRoutes = require("./sessionRoutes");
const feedbackRoutes = require("./feedbackRoutes");
const analyticsRoutes = require("./analyticsRoutes");
const aiRoutes = require("./aiRoutes");
const {
  buildProtectedResourceMetadata,
} = require("../ai/protectedResource");

const router = express.Router();

function getMcpResourceUrl() {
  return process.env.MCP_RESOURCE_URL || "http://localhost:3000/mcp";
}

function getAuthorizationServers() {
  const issuer = process.env.MCP_AUTHORIZATION_SERVER;
  if (!issuer || typeof issuer !== "string" || !issuer.trim()) {
    return [];
  }
  return [issuer.trim()];
}

function protectedResourceHandler(req, res) {
  const doc = buildProtectedResourceMetadata({
    resourceUrl: getMcpResourceUrl(),
    authorizationServers: getAuthorizationServers(),
  });
  res.status(200).type("application/json").json(doc);
}

router.get("/", (req, res) => {
  res.json({ message: "WorkoutDB API running" });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// RFC 9728 Protected Resource Metadata - public; both path forms (clients differ).
router.get("/.well-known/oauth-protected-resource", protectedResourceHandler);
router.get(
  "/.well-known/oauth-protected-resource/mcp",
  protectedResourceHandler
);

router.use("/auth", authRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/templates", templateRoutes);
router.use("/block-templates", blockTemplateRoutes);
router.use("/sessions", sessionRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);

module.exports = router;