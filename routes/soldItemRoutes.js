const express = require("express");

const router = express.Router();

const {
  getSoldItems,
  getSoldItemById,
  createSoldItem
} = require("../controllers/soldItemController");


// GET all sold items
router.get("/", getSoldItems);


// GET one sold item
router.get("/:id", getSoldItemById);


// ADD sold item
router.post("/", createSoldItem);


module.exports = router;
