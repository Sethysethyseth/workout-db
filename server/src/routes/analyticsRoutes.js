const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  getSummary,
  getExerciseIndex,
  getExerciseDetail,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get("/summary", authRequired, getSummary);
router.get("/exercises", authRequired, getExerciseIndex);
router.get("/exercise", authRequired, getExerciseDetail);

module.exports = router;
