const express = require("express");
const authRequired = require("../middleware/authRequired");
const {
  createBlockRun,
  getActiveBlockRun,
  endBlockRun,
} = require("../controllers/blockRunController");

const router = express.Router();

router.post("/", authRequired, createBlockRun);
router.get("/active", authRequired, getActiveBlockRun);
router.post("/:id/end", authRequired, endBlockRun);

module.exports = router;
