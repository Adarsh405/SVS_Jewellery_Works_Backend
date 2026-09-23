const express = require("express");

const router = express.Router();

const {
  createPayment,
  checkPaymentStatus,
} = require("../controllers/paymentController");


router.post(
  "/create",
  createPayment
);


router.get(
  "/status/:orderId",
  checkPaymentStatus
);


module.exports = router;