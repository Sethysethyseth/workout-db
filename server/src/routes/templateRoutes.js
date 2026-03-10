const express = require("express");
const {
  createTemplate,
  getMyTemplates,
  getPublicTemplates,
  cloneTemplate,
} = require("../controllers/templateController");
const authRequired = require("../middleware/authRequired");

const router = express.Router();

router.post("/", authRequired, createTemplate);
router.get("/mine", authRequired, getMyTemplates);
router.get("/public", getPublicTemplates);
router.post("/:id/clone", authRequired, cloneTemplate);

module.exports = router;