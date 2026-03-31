const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  startSession,
  createAdHocSession,
  addSessionExercise,
  updateSessionExercise,
  getMySessions,
  getSessionById,
  createSetForSession,
  updateSet,
  updateSession,
  completeSession,
  deleteSession,
  deleteSet,
} = require("../controllers/sessionController");

const router = express.Router();

router.post("/start/:templateId", authRequired, startSession);
router.post("/", authRequired, createAdHocSession);
router.get("/mine", authRequired, getMySessions);
router.patch("/:id/exercises/:exerciseId", authRequired, updateSessionExercise);
router.post("/:id/exercises", authRequired, addSessionExercise);
router.get("/:id", authRequired, getSessionById);
router.post("/:id/complete", authRequired, completeSession);
router.patch("/:id", authRequired, updateSession);
router.delete("/:id", authRequired, deleteSession);
router.post("/:id/sets", authRequired, createSetForSession);
router.patch("/sets/:id", authRequired, updateSet);
router.delete("/sets/:id", authRequired, deleteSet);

module.exports = router;