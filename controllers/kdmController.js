const pool = require("../config/db");


// GET all KDM items
const getKdmItems = async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM kdm_items ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get KDM items"
    });
  }
};


// GET single KDM item
const getKdmItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM kdm_items WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KDM item not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to get KDM item"
    });
  }
};


// ADD KDM item
const addKdmItem = async (req, res) => {

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
      INSERT INTO kdm_items
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
      message: "KDM item added",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Item ID already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add KDM item"
    });
  }
};


// CHANGE STATUS TO SOLD
const sellKdmItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE kdm_items
      SET status = 'sold'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KDM item not found"
      });
    }

    res.json({
      success: true,
      message: "KDM item marked as sold",
      data: result.rows[0]
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to update status"
    });
  }
};


// DELETE KDM item
const deleteKdmItem = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM kdm_items WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KDM item not found"
      });
    }

    res.json({
      success: true,
      message: "KDM item deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to delete KDM item"
    });
  }
};


module.exports = {
  getKdmItems,
  getKdmItem,
  addKdmItem,
  sellKdmItem,
  deleteKdmItem
};