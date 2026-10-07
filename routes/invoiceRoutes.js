const express = require("express");

const router = express.Router();

const {
  createInvoice,
  getInvoices,
  getInvoiceById
} = require("../controllers/invoiceController");


// Create invoice
router.post("/", createInvoice);


// Get all invoices
router.get("/", getInvoices);


// Get one invoice
router.get("/:id", getInvoiceById);


module.exports = router;