const pool = require("../config/db");


const getSilverItems = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM silver_items ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get Silver items"
    });
  }
};


const getSilverItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM silver_items WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Silver item not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get Silver item"
    });
  }
};


const addSilverItem = async (req, res) => {

  try {

    const {
      id,
      name,
      itemType,
      weight,
      makingCost,
      status
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO silver_items
      (
        id,
        name,
        item_type,
        weight,
        making_cost,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        id,
        name,
        itemType,
        weight,
        makingCost,
        status || "available"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Silver item added",
      data: result.rows[0]
    });

  } catch (error) {

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Item ID already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add Silver item"
    });
  }
};


const sellSilverItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE silver_items
      SET status = 'sold'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Silver item not found"
      });
    }

    res.json({
      success: true,
      message: "Silver item marked as sold",
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to update status"
    });
  }
};


const deleteSilverItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM silver_items WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Silver item not found"
      });
    }

    res.json({
      success: true,
      message: "Silver item deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to delete Silver item"
    });
  }
};


module.exports = {
  getSilverItems,
  getSilverItem,
  addSilverItem,
  sellSilverItem,
  deleteSilverItem
};