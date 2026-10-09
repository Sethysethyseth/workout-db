const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authRequired = require("../middleware/authRequired");
const { aiRateLimitKey } = require("../ai/rateLimitKeys");
const {
  getCoachStatus,
  askCoach,
  generatePalette,
  draftBlock,
  importMap,
  importFix,
  listCoachConversations,
  getCoachConversation,
  deleteCoachConversation,
  deleteAllCoachConversations,
  putCoachKey,
  deleteCoachKey,
} = require("../controllers/coachController");

const router = express.Router();

// Key writes are tighter than the coach call budget in app.js: 10 per 15
// minutes per signed-in user. authRequired runs first so the bucket is the user.
const coachKeyWriteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: aiRateLimitKey,
  message: {
    error: "rate_limited",
    message: "The coach is taking a breather. Try again in a few minutes.",
  },
});

router.put("/key", authRequired, coachKeyWriteLimit, putCoachKey);
router.delete("/key", authRequired, coachKeyWriteLimit, deleteCoachKey);
router.get("/status", authRequired, getCoachStatus);
router.get("/conversations", authRequired, listCoachConversations);
router.get("/conversations/:id", authRequired, getCoachConversation);
router.delete("/conversations", authRequired, deleteAllCoachConversations);
router.delete("/conversations/:id", authRequired, deleteCoachConversation);
router.post("/ask", authRequired, askCoach);
router.post("/palette", authRequired, generatePalette);
router.post("/block-draft", authRequired, draftBlock);
router.post("/import-map", authRequired, importMap);
router.post("/import-fix", authRequired, importFix);

module.exports = router;
