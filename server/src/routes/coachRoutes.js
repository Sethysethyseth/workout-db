const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getCoachStatus,
  askCoach,
  generatePalette,
} = require("../controllers/coachController");

const router = express.Router();

router.get("/status", authRequired, getCoachStatus);
router.post("/ask", authRequired, askCoach);
router.post("/palette", authRequired, generatePalette);

module.exports = router;
