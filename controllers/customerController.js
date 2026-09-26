const pool = require('../config/db');

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
    } = req.body;

    if (!customer_name || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and mobile number are required',
      });
    }

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must contain exactly 10 digits',
      });
    }

    const existing = await pool.query(
      'SELECT id FROM customers WHERE mobile_number = $1',
      [mobile_number]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this mobile number already exists',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        customer_name,
        mobile_number,
        email,
        address
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        customer_name,
        mobile_number,
        email || null,
        address || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customer: result.rows[0],
    });

  } catch (error) {
    console.error('Add customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add customer',
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
    console.error('Get customers error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get customers',
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
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      customer: result.rows[0],
    });

  } catch (error) {
    console.error('Get customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get customer',
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
    } = req.body;

    if (!customer_name || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and mobile number are required',
      });
    }

    if (!/^[0-9]{10}$/.test(mobile_number)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must contain exactly 10 digits',
      });
    }

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
        message: 'Another customer already uses this mobile number',
      });
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET
        customer_name = $1,
        mobile_number = $2,
        email = $3,
        address = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
      `,
      [
        customer_name,
        mobile_number,
        email || null,
        address || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: result.rows[0],
    });

  } catch (error) {
    console.error('Update customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
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
};