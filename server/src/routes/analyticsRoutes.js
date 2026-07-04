const express = require("express");
const authRequired = require("../middleware/authRequired");
const { getSummary } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/summary", authRequired, getSummary);

module.exports = router;
