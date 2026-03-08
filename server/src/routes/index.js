const express = require("express");
const authRoutes = require("./authRoutes");
const exerciseRoutes = require("./exerciseRoutes");
const templateRoutes = require("./templateRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "WorkoutDB API running" });
});

router.use("/auth", authRoutes);
router.use("/exercises", exerciseRoutes);
router.use("/templates", templateRoutes);

module.exports = router;