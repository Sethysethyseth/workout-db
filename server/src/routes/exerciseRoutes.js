const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getMuscles,
  createCustomExercise,
  listCustomExercises,
  deleteCustomExercise,
  resolveExerciseNames,
} = require("../controllers/exerciseController");

const router = express.Router();

router.get("/muscles", authRequired, getMuscles);
router.get("/custom", authRequired, listCustomExercises);
router.post("/custom", authRequired, createCustomExercise);
router.delete("/custom/:id", authRequired, deleteCustomExercise);
router.post("/resolve", authRequired, resolveExerciseNames);

module.exports = router;
