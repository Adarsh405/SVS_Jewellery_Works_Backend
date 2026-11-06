
const express = require("express");
const router = express.Router();

const {
    addDue,
    getDues,
    getDueDetails,
    addPayment
} = require("../controllers/dueController");

router.post("/", addDue);

router.get("/", getDues);

router.get("/:id", getDueDetails);

router.post("/:id/payments", addPayment);

module.exports = router;
