const express = require("express");

const verifyToken = require("../middleware/authMiddleware");

const {
  getKdmItems,
  getKdmItem,
  addKdmItem,
  sellKdmItem,
  deleteKdmItem
} = require("../controllers/kdmController");

const router = express.Router();


// PUBLIC
router.get("/", getKdmItems);

router.get("/:id", getKdmItem);


// JWT REQUIRED
router.post("/", verifyToken, addKdmItem);

router.patch("/:id/sold", verifyToken, sellKdmItem);

router.delete("/:id", verifyToken, deleteKdmItem);


module.exports = router;