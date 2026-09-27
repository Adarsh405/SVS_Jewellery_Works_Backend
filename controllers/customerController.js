const pool = require("../config/db");

// ============================================================
// ADD CUSTOMER
// ============================================================

const addCustomer = async (req, res) => {
  try {
    let {
      customer_name,
      mobile_number,
      address,
      telugu_name,
    } = req.body;

    // ----------------------------------------------------------
    // CLEAN INPUT
    // ----------------------------------------------------------

    customer_name =
      typeof customer_name === "string"
        ? customer_name.trim()
        : "";

    mobile_number =
      typeof mobile_number === "string"
        ? mobile_number.trim()
        : "";

    address =
      typeof address === "string"
        ? address.trim()
        : "";

    telugu_name =
      typeof telugu_name === "string"
        ? telugu_name.trim()
        : "";

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
      LIMIT 1
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
        address,
        telugu_name
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        customer_name,
        mobile_number,
        address || null,
        telugu_name || null,
      ]
    );

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Add customer error:", error);

    return res.status(500).json({
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

    return res.json({
      success: true,
      count: result.rows.length,
      customers: result.rows,
    });

  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
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

    // ----------------------------------------------------------
    // ID VALIDATION
    // ----------------------------------------------------------

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // ----------------------------------------------------------
    // FIND CUSTOMER
    // ----------------------------------------------------------

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

    return res.json({
      success: true,
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
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

    let {
      customer_name,
      mobile_number,
      address,
      telugu_name,
    } = req.body;

    // ----------------------------------------------------------
    // ID VALIDATION
    // ----------------------------------------------------------

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // ----------------------------------------------------------
    // CLEAN INPUT
    // ----------------------------------------------------------

    customer_name =
      typeof customer_name === "string"
        ? customer_name.trim()
        : "";

    mobile_number =
      typeof mobile_number === "string"
        ? mobile_number.trim()
        : "";

    address =
      typeof address === "string"
        ? address.trim()
        : "";

    telugu_name =
      typeof telugu_name === "string"
        ? telugu_name.trim()
        : "";

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
      LIMIT 1
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
        address = $3,
        telugu_name = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [
        customer_name,
        mobile_number,
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

    return res.json({
      success: true,
      message: "Customer updated successfully",
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
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
      LIMIT 1
      `,
      [mobile]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Get customer by mobile error:", error);

    return res.status(500).json({
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