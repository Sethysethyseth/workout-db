const express = require("express");
const authController = require("../controllers/authController");
const authRequired = require("../middleware/authRequired");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Auth routes working" });
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authRequired, authController.me);
router.patch("/password", authRequired, authController.changePassword);

module.exports = router;