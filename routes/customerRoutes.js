const express = require("express");

const router = express.Router();

const {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerByMobile,
} = require("../controllers/customerController");

// Add customer
router.post("/", addCustomer);

// Get all customers
router.get("/", getCustomers);

// IMPORTANT: mobile route BEFORE /:id
router.get("/mobile/:mobile", getCustomerByMobile);

// Get customer by ID
router.get("/:id", getCustomerById);

// Update customer
router.put("/:id", updateCustomer);

module.exports = router;