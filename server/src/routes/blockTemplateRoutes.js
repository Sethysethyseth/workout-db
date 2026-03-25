const express = require("express");
const {
  createBlockTemplate,
  getMyBlockTemplates,
  getPublicBlockTemplates,
  getBlockTemplateById,
  updateBlockTemplate,
  deleteBlockTemplate,
  cloneBlockTemplate,
} = require("../controllers/blockTemplateController");
const authRequired = require("../middleware/authRequired");

const router = express.Router();

router.post("/", authRequired, createBlockTemplate);
router.get("/mine", authRequired, getMyBlockTemplates);
router.get("/public", getPublicBlockTemplates);
router.get("/:id", getBlockTemplateById);
router.patch("/:id", authRequired, updateBlockTemplate);
router.delete("/:id", authRequired, deleteBlockTemplate);
router.post("/:id/clone", authRequired, cloneBlockTemplate);

module.exports = router;
