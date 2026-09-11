const pool = require("../config/db");


// =========================================================
// GET ALL SOLD ITEMS
// =========================================================

const getSoldItems = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT *
      FROM sold_items
      ORDER BY sold_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {

    console.error("Error fetching sold items:", error);

    res.status(500).json({
      message: "Failed to fetch sold items"
    });

  }
};


// =========================================================
// GET SOLD ITEM BY ID
// =========================================================

const getSoldItemById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM sold_items
      WHERE id = $1
      `,
      [id]
    );


    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Sold item not found"
      });

    }


    res.status(200).json(result.rows[0]);

  } catch (error) {

    console.error("Error fetching sold item:", error);

    res.status(500).json({
      message: "Failed to fetch sold item"
    });

  }
};


// =========================================================
// ADD SOLD ITEM
// =========================================================

const createSoldItem = async (req, res) => {

  try {

    const {
      itemId,
      itemType,
      itemName,
      grossWeight,
      netWeight,
      charges,
      makingCost,
      soldPrice,
      customerName,
      customerPhone
    } = req.body;


    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!itemId) {

      return res.status(400).json({
        message: "Item ID is required"
      });

    }


    if (!itemType) {

      return res.status(400).json({
        message: "Item type is required"
      });

    }


    if (!["KDM", "HallMark", "Silver"].includes(itemType)) {

      return res.status(400).json({
        message: "Invalid item type"
      });

    }


    // -----------------------------------------------------
    // INSERT SOLD ITEM
    // -----------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO sold_items (
        item_id,
        item_type,
        item_name,
        gross_weight,
        net_weight,
        charges,
        making_cost,
        sold_price,
        customer_name,
        customer_phone
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      RETURNING *
      `,
      [
        itemId,
        itemType,
        itemName || null,
        grossWeight || null,
        netWeight || null,
        charges || null,
        makingCost || null,
        soldPrice || null,
        customerName || null,
        customerPhone || null
      ]
    );


    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    res.status(201).json({

      message: "Sold item added successfully",

      soldItem: result.rows[0]

    });


  } catch (error) {

    console.error("Error adding sold item:", error);

    res.status(500).json({
      message: "Failed to add sold item"
    });

  }

};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getSoldItems,
  getSoldItemById,
  createSoldItem
};
