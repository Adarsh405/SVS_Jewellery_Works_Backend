const pool = require("../config/db");

// =====================================
// ADD NEW DUE
// POST /api/dues
// =====================================

exports.addDue = async (req, res) => {
    try {
        const {
            invoice_number,
            english_name,
            telugu_name,
            mobile_number,
            due_amount
        } = req.body;

        if (
            !english_name ||
            !telugu_name ||
            !mobile_number ||
            due_amount === undefined
        ) {
            return res.status(400).json({
                message: "Please provide all required details"
            });
        }

        const amount = Number(due_amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Invalid due amount"
            });
        }

        const result = await pool.query(
            `INSERT INTO dues (
                invoice_number,
                english_name,
                telugu_name,
                mobile_number,
                total_due,
                outstanding_amount
            )
            VALUES ($1, $2, $3, $4, $5, $5)
            RETURNING *`,
            [
                invoice_number || null,
                english_name,
                telugu_name,
                mobile_number,
                amount
            ]
        );

        res.status(201).json({
            message: "Due added successfully",
            due: result.rows[0]
        });

    } catch (error) {
        console.error("Add due error:", error);

        res.status(500).json({
            message: "Failed to add due"
        });
    }
};


// =====================================
// GET ALL DUES
// GET /api/dues
// =====================================

exports.getDues = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM dues
             WHERE outstanding_amount > 0
             ORDER BY created_at DESC`
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("Get dues error:", error);

        res.status(500).json({
            message: "Failed to fetch dues"
        });
    }
};


// =====================================
// GET SINGLE DUE + PAYMENT HISTORY
// GET /api/dues/:id
// =====================================

exports.getDueDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const dueResult = await pool.query(
            `SELECT * FROM dues WHERE id = $1`,
            [id]
        );

        if (dueResult.rows.length === 0) {
            return res.status(404).json({
                message: "Due not found"
            });
        }

        const historyResult = await pool.query(
            `SELECT id, paid_amount, payment_date
             FROM due_payments
             WHERE due_id = $1
             ORDER BY payment_date DESC, id DESC`,
            [id]
        );

        res.status(200).json({
            due: dueResult.rows[0],
            history: historyResult.rows
        });

    } catch (error) {
        console.error("Due details error:", error);

        res.status(500).json({
            message: "Failed to fetch due details"
        });
    }
};


// =====================================
// ADD PAYMENT
// POST /api/dues/:id/payments
// =====================================

exports.addPayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { paid_amount } = req.body;

        const amount = Number(paid_amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Enter a valid payment amount"
            });
        }

        await client.query("BEGIN");

        // Lock the due row to prevent simultaneous payments
        const dueResult = await client.query(
            `SELECT *
             FROM dues
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (dueResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Due not found"
            });
        }

        const due = dueResult.rows[0];

        const balance = Number(due.outstanding_amount);

        if (balance <= 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This due is already cleared"
            });
        }

        if (amount > balance) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: `Maximum payable amount is ${balance}`
            });
        }

        // Insert payment history
        const paymentResult = await client.query(
            `INSERT INTO due_payments (
                due_id,
                paid_amount
            )
            VALUES ($1, $2)
            RETURNING *`,
            [id, amount]
        );

        // Update outstanding amount
        const updateResult = await client.query(
            `UPDATE dues
             SET outstanding_amount = outstanding_amount - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [amount, id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Payment recorded successfully",
            due: updateResult.rows[0],
            payment: paymentResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Payment error:", error);

        res.status(500).json({
            message: "Failed to record payment"
        });

    } finally {
        client.release();
    }
};
