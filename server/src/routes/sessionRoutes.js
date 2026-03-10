const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  startSessionFromTemplate,
  getMySessions,
  getSessionById,
  createSetForSession,
  updateSet,
} = require("../controllers/sessionController");

const router = express.Router();

router.post("/start/:templateId", authRequired, startSessionFromTemplate);
router.get("/mine", authRequired, getMySessions);
router.get("/:id", authRequired, getSessionById);
router.post("/:id/sets", authRequired, createSetForSession);
router.patch("/sets/:id", authRequired, updateSet);

module.exports = router;

