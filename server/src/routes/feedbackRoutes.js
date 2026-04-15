const express = require("express");
const { createFeedback, listFeedback } = require("../controllers/feedbackController");
const authRequired = require("../middleware/authRequired");
const feedbackReviewerRequired = require("../middleware/feedbackReviewerRequired");

const router = express.Router();

router.post("/", authRequired, createFeedback);
router.get("/", authRequired, feedbackReviewerRequired, listFeedback);

module.exports = router;
