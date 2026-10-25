
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================================
// HELPERS
// ============================================================

const mapDue = (row) => ({
  dueId: row.due_id,
  customerName: row.customer_name,
  teluguCustomerName: row.telugu_customer_name,
  phoneNumber: row.phone_number,
  invoiceNumber: row.invoice_number,
  totalAmount: Number(row.total_amount),
  amountPaid: Number(row.amount_paid),
  balanceDue: Number(row.total_amount) - Number(row.amount_paid),
  status:
    Number(row.amount_paid) >= Number(row.total_amount)
      ? 'Paid'
      : 'Pending',
  startDate: row.start_date,
  lastUpdatedDate: row.last_updated_date,
  dueDate: row.due_date,
  paidHistory: row.paid_history || [],
});

const dueSelect = `
  SELECT
    d.*,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'amount', p.amount,
            'mode', p.payment_mode,
            'paidAt', p.paid_at
          )
          ORDER BY p.paid_at DESC
        )
        FROM due_payments p
        WHERE p.due_id = d.due_id
      ),
      '[]'::json
    ) AS paid_history
  FROM dues d
`;

const getDueById = async (client, dueId) => {
  const result = await client.query(
    `${dueSelect} WHERE d.due_id = $1`,
    [dueId]
  );

  return result.rows[0] ? mapDue(result.rows[0]) : null;
};

// ============================================================
// GET ALL DUES
// GET /api/dues
// ============================================================

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `${dueSelect} ORDER BY d.start_date DESC`
    );

    res.json({
      success: true,
      dues: result.rows.map(mapDue),
    });
  } catch (error) {
    console.error('Get dues error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch dues.',
    });
  }
});

// ============================================================
// DUES REPORT SUMMARY
// GET /api/dues/reports/summary
// ============================================================

router.get('/reports/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(
          SUM(total_amount - amount_paid),
          0
        ) AS total_outstanding,

        COALESCE(
          SUM(
            CASE
              WHEN due_date < CURRENT_DATE
                THEN total_amount - amount_paid
              ELSE 0
            END
          ),
          0
        ) AS overdue_amount,

        COUNT(
          DISTINCT phone_number
        ) FILTER (
          WHERE total_amount > amount_paid
        ) AS customers_with_due

      FROM dues
    `);

    const collectedResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS collected_this_month
      FROM due_payments
      WHERE paid_at >= date_trunc('month', CURRENT_DATE)
        AND paid_at < date_trunc('month', CURRENT_DATE)
          + INTERVAL '1 month'
    `);

    const row = result.rows[0];

    res.json({
      success: true,
      summary: {
        totalOutstanding: Number(row.total_outstanding),
        overdueAmount: Number(row.overdue_amount),
        collectedThisMonth: Number(
          collectedResult.rows[0].collected_this_month
        ),
        customersWithDue: Number(row.customers_with_due),
      },
    });
  } catch (error) {
    console.error('Dues summary error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch dues summary.',
    });
  }
});

// ============================================================
// GET DUES BY CUSTOMER PHONE
// GET /api/dues/customer/:phone
// ============================================================

router.get('/customer/:phone', async (req, res) => {
  try {
    const phone = String(req.params.phone || '').trim();

    const result = await pool.query(
      `${dueSelect}
       WHERE d.phone_number = $1
       ORDER BY d.start_date DESC`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No dues found for this customer.',
        dues: [],
      });
    }

    res.json({
      success: true,
      dues: result.rows.map(mapDue),
    });
  } catch (error) {
    console.error('Get customer dues error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch customer dues.',
    });
  }
});

// ============================================================
// ADD NEW DUE
// POST /api/dues
// ============================================================

router.post('/', async (req, res) => {
  const {
    customerName,
    teluguCustomerName = '',
    phoneNumber,
    invoiceNumber,
    totalAmount,
    amountPaid = 0,
    dueDate = null,
  } = req.body;

  const customer = String(customerName || '').trim();
  const phone = String(phoneNumber || '').trim();
  const invoice = String(invoiceNumber || '').trim();
  const total = Number(totalAmount);
  const paid = Number(amountPaid);

  if (!customer || !phone || !invoice) {
    return res.status(400).json({
      success: false,
      message: 'Customer name, phone number and invoice number are required.',
    });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid 10-digit phone number.',
    });
  }

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(paid) ||
    total <= 0 ||
    paid < 0 ||
    paid > total
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter valid total and paid amounts.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO dues (
        customer_name,
        telugu_customer_name,
        phone_number,
        invoice_number,
        total_amount,
        amount_paid,
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        customer,
        String(teluguCustomerName || '').trim(),
        phone,
        invoice,
        total,
        paid,
        dueDate || null,
      ]
    );

    const due = insertResult.rows[0];

    // Record any initial payment in payment history.
    if (paid > 0) {
      await client.query(
        `INSERT INTO due_payments (
          due_id,
          amount,
          payment_mode
        )
        VALUES ($1, $2, $3)`,
        [due.due_id, paid, 'Opening Payment']
      );
    }

    const fullDue = await getDueById(client, due.due_id);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Due added successfully.',
      due: fullDue,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'This invoice number already exists for this customer.',
      });
    }

    if (error.code === '23514' || error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid due information.',
      });
    }

    console.error('Add due error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to add due.',
    });
  } finally {
    client.release();
  }
});

// ============================================================
// UPDATE DUE DETAILS
// PUT /api/dues/:dueId
// ============================================================

router.put('/:dueId', async (req, res) => {
  const dueId = req.params.dueId;
  const {
    invoiceNumber,
    totalAmount,
    dueDate = null,
  } = req.body;

  const invoice = String(invoiceNumber || '').trim();
  const total = Number(totalAmount);

  if (
    !/^\d+$/.test(String(dueId)) ||
    !invoice ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter valid invoice details and total amount.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT * FROM dues
       WHERE due_id = $1
       FOR UPDATE`,
      [dueId]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Due record not found.',
      });
    }

    if (total < Number(existing.rows[0].amount_paid)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Total amount cannot be less than the amount already paid.',
      });
    }

    await client.query(
      `UPDATE dues
       SET invoice_number = $1,
           total_amount = $2,
           due_date = $3
       WHERE due_id = $4`,
      [invoice, total, dueDate || null, dueId]
    );

    const due = await getDueById(client, dueId);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Due updated successfully.',
      due,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'This invoice number already exists for this customer.',
      });
    }

    console.error('Update due error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to update due.',
    });
  } finally {
    client.release();
  }
});

// ============================================================
// RECORD PAYMENT
// POST /api/dues/:dueId/payments
// ============================================================

router.post('/:dueId/payments', async (req, res) => {
  const dueId = req.params.dueId;
  const amount = Number(req.body.amount);
  const mode = String(req.body.mode || 'Cash').trim();

  if (
    !/^\d+$/.test(String(dueId)) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !mode
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid payment amount and payment mode.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT *
       FROM dues
       WHERE due_id = $1
       FOR UPDATE`,
      [dueId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Due record not found.',
      });
    }

    const due = result.rows[0];
    const balance =
      Number(due.total_amount) - Number(due.amount_paid);

    if (balance <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This due has already been fully paid.',
      });
    }

    if (amount > balance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payment cannot exceed the remaining balance of ${balance.toFixed(2)}.`,
      });
    }

    await client.query(
      `INSERT INTO due_payments (
        due_id,
        amount,
        payment_mode
      )
      VALUES ($1, $2, $3)`,
      [dueId, amount, mode]
    );

    await client.query(
      `UPDATE dues
       SET amount_paid = amount_paid + $1
       WHERE due_id = $2`,
      [amount, dueId]
    );

    const updatedDue = await getDueById(client, dueId);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment recorded successfully.',
      due: updatedDue,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Record payment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to record payment.',
    });
  } finally {
    client.release();
  }
});

// ============================================================
// DELETE DUE
// DELETE /api/dues/:dueId
// ============================================================

router.delete('/:dueId', async (req, res) => {
  const dueId = req.params.dueId;

  if (!/^\d+$/.test(String(dueId))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid due ID.',
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM dues
       WHERE due_id = $1
       RETURNING due_id`,
      [dueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Due record not found.',
      });
    }

    res.json({
      success: true,
      message: 'Due deleted successfully.',
    });
  } catch (error) {
    console.error('Delete due error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to delete due.',
    });
  }
});

module.exports = router;
