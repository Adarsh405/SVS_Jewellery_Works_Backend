const express = require("express");

const verifyToken = require("../middleware/authMiddleware");

const {
  getSilverItems,
  getSilverItem,
  addSilverItem,
  sellSilverItem,
  deleteSilverItem
} = require("../controllers/silverController");

const router = express.Router();

router.get("/", getSilverItems);

router.get("/:id", getSilverItem);

router.post("/", verifyToken, addSilverItem);

router.patch("/:id/sold", sellSilverItem);

router.delete("/:id", verifyToken, deleteSilverItem);

module.exports = router;
