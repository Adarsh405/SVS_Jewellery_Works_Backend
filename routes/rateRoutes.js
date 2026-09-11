const express = require("express");

const verifyToken = require("../middleware/authMiddleware");

const {
  getRates,
  updateRates
} = require("../controllers/rateController");

const router = express.Router();


// PUBLIC
router.get("/", getRates);


// JWT REQUIRED
router.put("/", verifyToken, updateRates);


module.exports = router;