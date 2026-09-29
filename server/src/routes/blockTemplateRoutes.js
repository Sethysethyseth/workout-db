const express = require("express");
const {
  createBlockTemplate,
  getMyBlockTemplates,
  getPublicBlockTemplates,
  getBlockTemplateById,
  updateBlockTemplate,
  deleteBlockTemplate,
  cloneBlockTemplate,
  acceptBlockTemplate,
} = require("../controllers/blockTemplateController");
const {
  getBlockFormat,
  previewBlockImport,
  importBlock,
  exportBlockTemplate,
} = require("../controllers/blockImportController");
const authRequired = require("../middleware/authRequired");

const router = express.Router();

// Literal paths BEFORE any /:id route so format / import are never read as ids.
router.get("/format", getBlockFormat);
router.post("/import/preview", authRequired, previewBlockImport);
router.post("/import", authRequired, importBlock);

router.post("/", authRequired, createBlockTemplate);
router.get("/mine", authRequired, getMyBlockTemplates);
router.get("/public", getPublicBlockTemplates);
router.get("/:id/export", exportBlockTemplate);
router.get("/:id", getBlockTemplateById);
router.patch("/:id", authRequired, updateBlockTemplate);
router.delete("/:id", authRequired, deleteBlockTemplate);
router.post("/:id/clone", authRequired, cloneBlockTemplate);
router.post("/:id/accept", authRequired, acceptBlockTemplate);

module.exports = router;
