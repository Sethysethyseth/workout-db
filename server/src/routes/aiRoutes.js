const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getConsent,
  grantConsent,
  revokeConsent,
  setBlockDraftsAllowed,
  signOutConnector,
} = require("../controllers/aiController");
const {
  connectorAuthorize,
} = require("../controllers/connectorAuthController");

const router = express.Router();

router.post("/connector/authorize", authRequired, connectorAuthorize);
router.post("/connector/signout", authRequired, signOutConnector);
router.get("/consent", authRequired, getConsent);
router.post("/consent", authRequired, grantConsent);
router.delete("/consent", authRequired, revokeConsent);
router.put("/consent/block-drafts", authRequired, setBlockDraftsAllowed);

module.exports = router;
