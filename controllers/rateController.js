const pool = require("../config/db");


// GET current rates
const getRates = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM rates WHERE id = 1"
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rates not configured"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get rates"
    });
  }
};


// UPDATE rates
const updateRates = async (req, res) => {

  try {

    const {
      goldRate,
      hallmarkRate,
      silverRate
    } = req.body;

    if (
      goldRate === undefined ||
      hallmarkRate === undefined ||
      silverRate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All rates are required"
      });
    }

    const result = await pool.query(
      `
      UPDATE rates
      SET
        gold_rate = $1,
        hallmark_rate = $2,
        silver_rate = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *
      `,
      [
        goldRate,
        hallmarkRate,
        silverRate
      ]
    );

    res.json({
      success: true,
      message: "Rates updated successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update rates"
    });
  }
};


module.exports = {
  getRates,
  updateRates
};