const pool = require("../config/db");

// ==========================================
// GET CURRENT RATES
// ==========================================

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

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Get rates error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get rates"
    });
  }
};


// ==========================================
// UPDATE RATES
// ==========================================

const updateRates = async (req, res) => {
  try {

    // IMPORTANT:
    // Frontend sends these names
    const {
      gold_rate,
      hallmark_rate,
      silver_rate
    } = req.body;


    // ======================================
    // CHECK REQUIRED VALUES
    // ======================================

    if (
      gold_rate === undefined ||
      hallmark_rate === undefined ||
      silver_rate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All rates are required"
      });
    }


    // ======================================
    // CONVERT TO NUMBERS
    // ======================================

    const goldRate = Number(gold_rate);
    const hallmarkRate = Number(hallmark_rate);
    const silverRate = Number(silver_rate);


    // ======================================
    // CHECK INTEGER
    // ======================================

    if (
      !Number.isInteger(goldRate) ||
      !Number.isInteger(hallmarkRate) ||
      !Number.isInteger(silverRate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rates must contain only whole numbers"
      });
    }


    // ======================================
    // KDM GOLD
    // MUST BE > 12000
    // ======================================

    if (goldRate <= 12000) {
      return res.status(400).json({
        success: false,
        message:
          "KDM Gold rate must be greater than ₹12,000"
      });
    }


    // ======================================
    // HALLMARK GOLD
    // MUST BE > 12000
    // ======================================

    if (hallmarkRate <= 12000) {
      return res.status(400).json({
        success: false,
        message:
          "HallMark Gold rate must be greater than ₹12,000"
      });
    }


    // ======================================
    // SILVER
    // MUST BE > 180
    // ======================================

    if (silverRate <= 180) {
      return res.status(400).json({
        success: false,
        message:
          "Silver rate must be greater than ₹180"
      });
    }


    // ======================================
    // UPDATE DATABASE
    // ======================================

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


    // ======================================
    // CHECK IF ROW EXISTS
    // ======================================

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rates record not found"
      });
    }


    // ======================================
    // SUCCESS
    // ======================================

    res.status(200).json({
      success: true,
      message: "Rates updated successfully",
      data: result.rows[0]
    });

  } catch (error) {

    console.error("Update rates error:", error);

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
