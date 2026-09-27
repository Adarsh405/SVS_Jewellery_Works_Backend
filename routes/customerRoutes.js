const express = require("express");

const router = express.Router();

const {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerByMobile,
} = require("../controllers/customerController");

// ============================================================
// ADD CUSTOMER
// ============================================================

router.post("/", addCustomer);

// ============================================================
// GET ALL CUSTOMERS
// ============================================================

router.get("/", getCustomers);

// ============================================================
// GET CUSTOMER BY MOBILE
// IMPORTANT: KEEP THIS BEFORE /:id
// ============================================================

router.get("/mobile/:mobile", getCustomerByMobile);

// ============================================================
// GET CUSTOMER BY ID
// ============================================================

router.get("/:id", getCustomerById);

// ============================================================
// UPDATE CUSTOMER
// ============================================================

router.put("/:id", updateCustomer);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;