const express = require("express");
const authRequired = require("../middleware/authRequired");
const { resolveExerciseNames } = require("../controllers/exerciseController");

const router = express.Router();

router.post("/resolve", authRequired, resolveExerciseNames);

module.exports = router;
