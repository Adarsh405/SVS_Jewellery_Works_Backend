const pool = require("../config/db");

// ============================================================
// ADD CUSTOMER
// ============================================================

const addCustomer = async (req, res) => {
  try {
    const {
      customer_name,
      mobile_number,
      email,
      address,
      telugu_name,
    } = req.body;

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------

    if (!customer_name || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile number are required",
      });
    }

    // ----------------------------------------------------------
    // MOBILE VALIDATION
    // ----------------------------------------------------------

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    // ----------------------------------------------------------
    // CHECK DUPLICATE MOBILE
    // ----------------------------------------------------------

    const existing = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE mobile_number = $1
      `,
      [mobile_number]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Customer with this mobile number already exists",
      });
    }

    // ----------------------------------------------------------
    // INSERT CUSTOMER
    // ----------------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        customer_name,
        mobile_number,
        email,
        address,
        telugu_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        customer_name.trim(),
        mobile_number,
        email || null,
        address || null,
        telugu_name || null,
      ]
    );

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Add customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add customer",
    });
  }
};

// ============================================================
// GET ALL CUSTOMERS
// ============================================================

const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM customers
      ORDER BY id DESC
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      customers: result.rows,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customers",
    });
  }
};

// ============================================================
// GET CUSTOMER BY ID
// ============================================================

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get customer",
    });
  }
};

// ============================================================
// UPDATE CUSTOMER
// ============================================================

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      customer_name,
      mobile_number,
      email,
      address,
      telugu_name,
    } = req.body;

    // ----------------------------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------------------------

    if (!customer_name || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile number are required",
      });
    }

    // ----------------------------------------------------------
    // MOBILE VALIDATION
    // ----------------------------------------------------------

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    // ----------------------------------------------------------
    // CHECK DUPLICATE MOBILE
    // Exclude current customer
    // ----------------------------------------------------------

    const duplicate = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE mobile_number = $1
      AND id != $2
      `,
      [mobile_number, id]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Another customer already uses this mobile number",
      });
    }

    // ----------------------------------------------------------
    // UPDATE CUSTOMER
    // ----------------------------------------------------------

    const result = await pool.query(
      `
      UPDATE customers
      SET
        customer_name = $1,
        mobile_number = $2,
        email = $3,
        address = $4,
        telugu_name = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [
        customer_name.trim(),
        mobile_number,
        email || null,
        address || null,
        telugu_name || null,
        id,
      ]
    );

    // ----------------------------------------------------------
    // CUSTOMER NOT FOUND
    // ----------------------------------------------------------

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};

// ============================================================
// GET CUSTOMER BY MOBILE NUMBER
// GET /api/customers/mobile/:mobile
// ============================================================

const getCustomerByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;

    // ----------------------------------------------------------
    // MOBILE VALIDATION
    // ----------------------------------------------------------

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    // ----------------------------------------------------------
    // FIND CUSTOMER
    // ----------------------------------------------------------

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE mobile_number = $1
      `,
      [mobile]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Get customer by mobile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to find customer",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerByMobile,
};