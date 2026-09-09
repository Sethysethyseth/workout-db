const express = require("express");
const authRequired = require("../middleware/authRequired");
const { getCoachStatus, askCoach } = require("../controllers/coachController");

const router = express.Router();

router.get("/status", authRequired, getCoachStatus);
router.post("/ask", authRequired, askCoach);

module.exports = router;
