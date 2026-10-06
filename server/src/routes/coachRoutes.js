const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getCoachStatus,
  askCoach,
  generatePalette,
  draftBlock,
  importMap,
  importFix,
} = require("../controllers/coachController");

const router = express.Router();

router.get("/status", authRequired, getCoachStatus);
router.post("/ask", authRequired, askCoach);
router.post("/palette", authRequired, generatePalette);
router.post("/block-draft", authRequired, draftBlock);
router.post("/import-map", authRequired, importMap);
router.post("/import-fix", authRequired, importFix);

module.exports = router;
