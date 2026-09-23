const pool = require('../config/db');

/*
  PostgreSQL NUMERIC values are returned as strings by node-postgres.

  We keep them as strings when returning JSON so monetary precision
  is not lost.

  IMPORTANT:
  total_value and due_amount are NOT stored in the database.
  They will be calculated in the frontend.
*/

const OrderModel = {

  // ============================================================
  // CREATE ORDER
  // ============================================================

  async create(order) {

    const query = `
      INSERT INTO orders (
        order_type,
        customer_name,
        mobile_number,
        image,
        item_name,
        net_weight,
        gold_rate,
        charges,
        weight,
        silver_rate,
        making_cost,
        advance_paid,
        order_date,
        status,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,
        $11,$12,$13,$14,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const values = [
      order.order_type,
      order.customer_name,
      order.mobile_number,
      order.image,
      order.item_name,
      order.net_weight,
      order.gold_rate,
      order.charges,
      order.weight,
      order.silver_rate,
      order.making_cost,
      order.advance_paid,
      order.order_date,
      order.status
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
  },


  // ============================================================
  // GET ALL ORDERS
  // ============================================================

  async findAll(filters = {}) {

    const conditions = [];
    const values = [];

    let index = 1;


    // ----------------------------------------------------------
    // SEARCH
    // customer name
    // mobile number
    // item name
    // ----------------------------------------------------------

    if (filters.search) {

      conditions.push(`
        (
          customer_name ILIKE $${index}
          OR mobile_number ILIKE $${index}
          OR item_name ILIKE $${index}
        )
      `);

      values.push(`%${filters.search}%`);

      index++;
    }


    // ----------------------------------------------------------
    // STATUS FILTER
    // ----------------------------------------------------------

    if (filters.status) {

      conditions.push(
        `status = $${index}`
      );

      values.push(filters.status);

      index++;
    }


    // ----------------------------------------------------------
    // ORDER TYPE FILTER
    // ----------------------------------------------------------

    if (filters.order_type) {

      conditions.push(
        `order_type = $${index}`
      );

      values.push(filters.order_type);

      index++;
    }


    // ----------------------------------------------------------
    // FROM DATE
    // ----------------------------------------------------------

    if (filters.from_date) {

      conditions.push(
        `order_date >= $${index}`
      );

      values.push(filters.from_date);

      index++;
    }


    // ----------------------------------------------------------
    // TO DATE
    // ----------------------------------------------------------

    if (filters.to_date) {

      conditions.push(
        `order_date <= $${index}`
      );

      values.push(filters.to_date);

      index++;
    }


    // ----------------------------------------------------------
    // BASE QUERY
    // ----------------------------------------------------------

    let query = `
      SELECT *
      FROM orders
    `;


    // ----------------------------------------------------------
    // WHERE
    // ----------------------------------------------------------

    if (conditions.length > 0) {

      query += `
        WHERE ${conditions.join(' AND ')}
      `;
    }


    // ----------------------------------------------------------
    // ORDERING
    //
    // Pending orders first.
    // Newest orders inside each group.
    // ----------------------------------------------------------

    query += `
      ORDER BY
        CASE
          WHEN status = 'pending' THEN 0
          ELSE 1
        END,
        order_date DESC,
        created_at DESC
    `;


    const result =
      await pool.query(
        query,
        values
      );

    return result.rows;
  },


  // ============================================================
  // GET ORDER BY ID
  // ============================================================

  async findById(id) {

    const query = `
      SELECT *
      FROM orders
      WHERE id = $1
    `;

    const result =
      await pool.query(
        query,
        [id]
      );

    return result.rows[0];
  },


  // ============================================================
  // UPDATE ORDER
  // ============================================================

  async update(id, order) {

    const query = `
      UPDATE orders
      SET
        order_type = $1,
        customer_name = $2,
        mobile_number = $3,
        image = $4,
        item_name = $5,
        net_weight = $6,
        gold_rate = $7,
        charges = $8,
        weight = $9,
        silver_rate = $10,
        making_cost = $11,
        advance_paid = $12,
        order_date = $13,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $14

      RETURNING *
    `;


    const values = [

      order.order_type,

      order.customer_name,

      order.mobile_number,

      order.image,

      order.item_name,

      order.net_weight,

      order.gold_rate,

      order.charges,

      order.weight,

      order.silver_rate,

      order.making_cost,

      order.advance_paid,

      order.order_date,

      id
    ];


    const result =
      await pool.query(
        query,
        values
      );

    return result.rows[0];
  },


  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async updateStatus(id, status) {

    const query = `
      UPDATE orders
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $2

      RETURNING *
    `;


    const result =
      await pool.query(
        query,
        [
          status,
          id
        ]
      );

    return result.rows[0];
  },


  // ============================================================
  // DELETE ORDER
  // ============================================================

  async delete(id) {

    const query = `
      DELETE FROM orders
      WHERE id = $1
      RETURNING *
    `;


    const result =
      await pool.query(
        query,
        [id]
      );

    return result.rows[0];
  }

};


module.exports = OrderModel;