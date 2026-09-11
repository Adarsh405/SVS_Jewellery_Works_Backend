const express = require("express");

const {
  login,
  logout,
  verifyLogin
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);

router.post("/logout", logout);

router.get("/verify", verifyToken, verifyLogin);

module.exports = router;
