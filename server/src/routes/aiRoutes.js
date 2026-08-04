const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getConsent,
  grantConsent,
  revokeConsent,
} = require("../controllers/aiController");

const router = express.Router();

router.get("/consent", authRequired, getConsent);
router.post("/consent", authRequired, grantConsent);
router.delete("/consent", authRequired, revokeConsent);

module.exports = router;
