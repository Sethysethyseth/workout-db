const express = require("express");
const authRoutes = require("./authRoutes");
const exerciseRoutes = require("./exerciseRoutes");
const templateRoutes = require("./templateRoutes");
const blockTemplateRoutes = require("./blockTemplateRoutes");
const sessionRoutes = require("./sessionRoutes");
const feedbackRoutes = require("./feedbackRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "WorkoutDB API running" });
});

router.use("/auth", authRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/templates", templateRoutes);
router.use("/block-templates", blockTemplateRoutes);
router.use("/sessions", sessionRoutes);
router.use("/feedback", feedbackRoutes);

module.exports = router;