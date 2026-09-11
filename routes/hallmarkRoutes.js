const express = require("express");

const verifyToken = require("../middleware/authMiddleware");

const {
  getHallmarkItems,
  getHallmarkItem,
  addHallmarkItem,
  sellHallmarkItem,
  deleteHallmarkItem
} = require("../controllers/hallmarkController");

const router = express.Router();

router.get("/", getHallmarkItems);

router.get("/:id", getHallmarkItem);

router.post("/", verifyToken, addHallmarkItem);

router.patch("/:id/sold", verifyToken, sellHallmarkItem);

router.delete("/:id", verifyToken, deleteHallmarkItem);

module.exports = router;