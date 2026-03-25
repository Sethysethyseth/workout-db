const express = require("express");
const {
  createTemplate,
  getMyTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  cloneTemplate,
} = require("../controllers/templateController");
const authRequired = require("../middleware/authRequired");

const router = express.Router();

router.post("/", authRequired, createTemplate);
router.get("/mine", authRequired, getMyTemplates);
router.get("/public", getPublicTemplates);
router.get("/:id", getTemplateById);
router.patch("/:id", authRequired, updateTemplate);
router.delete("/:id", authRequired, deleteTemplate);
router.post("/:id/clone", authRequired, cloneTemplate);

module.exports = router;