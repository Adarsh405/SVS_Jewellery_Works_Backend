const pool = require("../config/db");

const getHallmarkItems = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM hallmark_items ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get Hallmark items"
    });
  }
};


const getHallmarkItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM hallmark_items WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hallmark item not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get Hallmark item"
    });
  }
};


const addHallmarkItem = async (req, res) => {

  try {

    const {
      id,
      name,
      itemType,
      netWeight,
      charges,
      makingCost,
      status
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO hallmark_items
      (
        id,
        name,
        item_type,
        net_weight,
        charges,
        making_cost,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        id,
        name,
        itemType,
        netWeight,
        charges,
        makingCost,
        status || "available"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Hallmark item added",
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
      message: "Failed to add Hallmark item"
    });
  }
};


const sellHallmarkItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE hallmark_items
      SET status = 'sold'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hallmark item not found"
      });
    }

    res.json({
      success: true,
      message: "Hallmark item marked as sold",
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to update status"
    });
  }
};


const deleteHallmarkItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM hallmark_items WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hallmark item not found"
      });
    }

    res.json({
      success: true,
      message: "Hallmark item deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to delete Hallmark item"
    });
  }
};


module.exports = {
  getHallmarkItems,
  getHallmarkItem,
  addHallmarkItem,
  sellHallmarkItem,
  deleteHallmarkItem
};