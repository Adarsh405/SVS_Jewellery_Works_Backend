const pool = require("../config/db");

/*
============================================================
CREATE INVOICE
============================================================

Customer name/mobile/address are optional.

items must be an array.

Example:

{
  customer_name: "Adarsh",
  customer_mobile: "9908622405",
  customer_address: "Dharmavaram",

  items: [
    {
      id: 1001,
      item_type: "Silver",
      item_name: "Pattilu",
      weight: 3,
      making_cost: 300,
      price: 1200
    }
  ]
}
*/

const createInvoice = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_name = null,
      customer_mobile = null,
      customer_address = null,
      items
    } = req.body;

    // ----------------------------------------------------
    // Validate items
    // ----------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required"
      });
    }

    // ----------------------------------------------------
    // Calculate total weight
    // Supports:
    // weight
    // net_weight
    // netWeight
    // gross_weight
    // grossWeight
    // ----------------------------------------------------

    const totalWeight = items.reduce((total, item) => {
      const weight =
        Number(
          item.weight ??
          item.net_weight ??
          item.netWeight ??
          item.gross_weight ??
          item.grossWeight ??
          0
        ) || 0;

      return total + weight;
    }, 0);

    // ----------------------------------------------------
    // Calculate total amount
    //
    // Supports:
    // price
    // sold_price
    // total_price
    // totalPrice
    // amount
    // ----------------------------------------------------

    const totalAmount = items.reduce((total, item) => {
      const price =
        Number(
          item.price ??
          item.sold_price ??
          item.total_price ??
          item.totalPrice ??
          item.amount ??
          0
        ) || 0;

      return total + price;
    }, 0);

    // ----------------------------------------------------
    // Start transaction
    // ----------------------------------------------------

    await client.query("BEGIN");

    // ----------------------------------------------------
    // Create invoice
    //
    // PostgreSQL automatically generates:
    // id
    // invoice_number
    // ----------------------------------------------------

    const invoiceResult = await client.query(
      `
      INSERT INTO invoices (
        customer_name,
        customer_mobile,
        customer_address,
        items,
        total_weight,
        total_amount
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      RETURNING
        id,
        invoice_number,
        customer_name,
        customer_mobile,
        customer_address,
        items,
        total_weight,
        total_amount,
        created_at
      `,
      [
        customer_name || null,
        customer_mobile || null,
        customer_address || null,
        JSON.stringify(items),
        totalWeight,
        totalAmount
      ]
    );

    const invoice = invoiceResult.rows[0];

    // ----------------------------------------------------
    // Commit
    // ----------------------------------------------------

    await client.query("COMMIT");

    // ----------------------------------------------------
    // Return generated invoice number
    // ----------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",

      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,

        customer_name: invoice.customer_name,
        customer_mobile: invoice.customer_mobile,
        customer_address: invoice.customer_address,

        items: invoice.items,

        total_weight: invoice.total_weight,
        total_amount: invoice.total_amount,

        created_at: invoice.created_at
      }
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message
    });

  } finally {
    client.release();
  }
};


/*
============================================================
GET ALL INVOICES
============================================================
*/

const getInvoices = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        invoice_number,
        customer_name,
        customer_mobile,
        customer_address,
        items,
        total_weight,
        total_amount,
        created_at
      FROM invoices
      ORDER BY invoice_number DESC
      `
    );

    res.json({
      success: true,
      invoices: result.rows
    });

  } catch (error) {
    console.error("Get invoices error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message
    });
  }
};


/*
============================================================
GET SINGLE INVOICE
============================================================
*/

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        invoice_number,
        customer_name,
        customer_mobile,
        customer_address,
        items,
        total_weight,
        total_amount,
        created_at
      FROM invoices
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    res.json({
      success: true,
      invoice: result.rows[0]
    });

  } catch (error) {
    console.error("Get invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message
    });
  }
};


module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById
};