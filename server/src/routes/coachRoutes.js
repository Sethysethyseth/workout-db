const express = require("express");
const authRequired = require("../middleware/authRequired");
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
} = require("../controllers/coachController");

const router = express.Router();

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
